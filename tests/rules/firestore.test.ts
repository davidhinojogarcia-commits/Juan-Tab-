import { before, after, beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, collection, getDocs } from 'firebase/firestore';
let env: RulesTestEnvironment;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-planifica', firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') } });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    for (const [uid, role, active] of [['admin', 'admin', true], ['editor', 'editor', true], ['auditor', 'auditor', true], ['inactive', 'editor', false]]) {
      await setDoc(doc(context.firestore(), 'members', uid as string), { role, active });
    }
  });
});
function db(uid?: string) { return uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore(); }
const hash = 'a'.repeat(64);
function data(uid = 'admin', revision = 1, operationId = 'op-1') {
  return { revision, payload: JSON.stringify({ actuaciones: [], planes: [], comentarios: [], registrosAuditoria: [] }), payloadHash: hash, operationId, updatedBy: uid, updatedAt: serverTimestamp() };
}
function save(uid = 'admin', revision = 1, op = 'op-1', patch = {}, eventPatch = {}) {
  const client = db(uid); const batch = writeBatch(client);
  batch.set(doc(client, 'workspaces/planifica'), { ...data(uid, revision, op), ...patch });
  batch.set(doc(client, 'workspaces/planifica/events', op), { actorUid: uid, revision, payloadHash: hash, createdAt: serverTimestamp(), ...eventPatch });
  return batch.commit();
}
test('only owner can read membership; neither self elevation nor member listing is allowed', async () => {
  await assertSucceeds(getDoc(doc(db('admin'), 'members/admin')));
  await assertFails(getDoc(doc(db('editor'), 'members/admin')));
  await assertFails(getDocs(collection(db('admin'), 'members')));
  await assertFails(setDoc(doc(db('editor'), 'members/editor'), { active: true, role: 'admin' }));
  await assertFails(setDoc(doc(db('new'), 'members/new'), { active: true, role: 'admin' }));
});
test('unauthenticated, nonmember, inactive and auditor writes are blocked', async () => {
  await assertFails(getDoc(doc(db(), 'workspaces/planifica')));
  await assertFails(getDoc(doc(db('outsider'), 'workspaces/planifica')));
  for (const uid of ['outsider', 'inactive', 'auditor']) await assertFails(save(uid));
});
test('admin and editor save complete snapshots and auditors can read', async () => {
  await assertSucceeds(save()); await assertSucceeds(save('editor', 2, 'op-2'));
  await assertSucceeds(getDoc(doc(db('auditor'), 'workspaces/planifica')));
  await assertSucceeds(getDoc(doc(db('auditor'), 'workspaces/planifica/events/op-2')));
});
test('no snapshot without event, no orphaned event, no snapshot deletion', async () => {
  await assertFails(setDoc(doc(db('admin'), 'workspaces/planifica'), data()));
  await assertFails(setDoc(doc(db('admin'), 'workspaces/planifica/events/orphan'), { actorUid: 'admin', revision: 1, payloadHash: hash, createdAt: serverTimestamp() }));
  await save(); await assertFails(deleteDoc(doc(db('admin'), 'workspaces/planifica')));
});
test('revision conflicts, invalid states and replay are blocked', async () => {
  await save(); await assertFails(save('editor', 1, 'stale')); await assertFails(save('admin', 3, 'skip'));
  await assertFails(save('admin', 2, 'op-1')); await assertFails(save('admin', -1, 'negative'));
});
test('schema, field types, missing required fields and oversized create/update are rejected', async () => {
  for (const patch of [{ payload: 1 }, { payload: 'x'.repeat(700001) }, { extra: true }, { updatedBy: 'other' }, { revision: '1' }, { payloadHash: 'invalid' }, { operationId: '' }, { updatedAt: new Date(0) }]) {
    await assertFails(save('admin', 1, 'bad-create', patch));
  }
  await save();
  for (const patch of [{ payload: 1 }, { payload: 'x'.repeat(700001) }, { extra: true }, { updatedBy: 'other' }, { revision: '2' }, { payloadHash: 'invalid' }, { updatedAt: new Date(0) }]) {
    await assertFails(save('admin', 2, 'bad-update', patch));
  }
  await assertFails(setDoc(doc(db('admin'), 'workspaces/planifica'), { revision: 2 }));
});
test('audit events cannot be changed or deleted and must match the committed snapshot', async () => {
  await save();
  await assertFails(updateDoc(doc(db('admin'), 'workspaces/planifica/events/op-1'), { revision: 9 }));
  await assertFails(deleteDoc(doc(db('admin'), 'workspaces/planifica/events/op-1')));
  for (const patch of [{ actorUid: 'other' }, { payloadHash: 'b'.repeat(64) }, { revision: 8 }, { extra: true }, { createdAt: new Date(0) }]) {
    await assertFails(save('admin', 2, 'mismatch', {}, patch));
  }
});
test('unrelated paths are denied by default', async () => {
  await assertFails(getDoc(doc(db('admin'), 'users/private')));
  await assertFails(setDoc(doc(db('admin'), 'workspaces/other'), data()));
  await assertFails(getDocs(collection(db('admin'), 'workspaces')));
});
