import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { type Firestore, setDoc, doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { createBackend } from '../../src/sync/backend';
import { SharedSync, emptyPayload, encode, type SavedState } from '../../src/sync/engine';
let env: RulesTestEnvironment;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-planifica-adapter', firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') } });
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'members/alice'), { role: 'admin', active: true });
    await setDoc(doc(context.firestore(), 'members/bob'), { role: 'editor', active: true });
  });
});
after(async () => env.cleanup());
test('real SDK transaction acknowledges save, survives replay, detects conflicts and creates immutable evidence', async () => {
  const aliceDb = env.authenticatedContext('alice').firestore();
  const alice = createBackend(aliceDb as unknown as Firestore, 'alice'); const bob = createBackend(env.authenticatedContext('bob').firestore() as unknown as Firestore, 'bob');
  const first = { id: 'transaction-1', baseRevision: 0, payload: encode({ ...emptyPayload(), planes: [{ id: 'plan-real', nombre: 'Datos representativos' }] }) };
  const saved = await alice.commit(first); assert.equal(saved.revision, 1);
  assert.deepEqual(await alice.commit(first), saved);
  await assert.rejects(bob.commit({ ...first, id: 'conflicting-device' }), /Otra persona/);
  const evidence = (await getDoc(doc(aliceDb, 'workspaces/planifica/events/transaction-1'))).data()!;
  assert.equal(evidence.actorUid, 'alice'); assert.equal(evidence.payloadHash.length, 64); assert.ok(evidence.createdAt.toMillis() > 0);
  assert.equal((await getDocs(collection(aliceDb, 'workspaces/planifica/events'))).size, 1);
  assert.equal((await alice.read()).payload, first.payload);
  let persisted: SavedState | undefined;
  const sync = new SharedSync({ load: async () => persisted, save: async state => { persisted = structuredClone(state); } }, alice, () => {}, () => 'queued-2');
  await sync.start(false); // local draft with stale base 0 must not overwrite the first transaction
  await sync.stage({ ...emptyPayload(), planes: [{ id: 'offline', nombre: 'Sin conexión' }] });
  sync.setOnline(true); await sync.flush(); assert.equal(sync.status, 'conflicto');
  assert.equal(persisted!.pending.length, 1); assert.equal((await alice.read()).revision, 1);
});
