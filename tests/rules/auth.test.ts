import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDocFromServer } from 'firebase/firestore';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { setDoc } from 'firebase/firestore';
import { createBackend } from '../../src/sync/backend';
import { emptyPayload, encode } from '../../src/sync/engine';

test('actual Auth emulator login gates membership and shared writes', async () => {
  const projectId = 'demo-planifica-auth-flow';
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-user-project': projectId },
    body: JSON.stringify({ email: 'integration@example.test', password: 'emulator-only-password', returnSecureToken: true }),
  });
  assert.equal(response.ok, true);
  const { localId: uid } = await response.json() as { localId: string };
  const env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') } });
  const app = initializeApp({ projectId, apiKey: 'demo-key' }, 'auth-integration');
  const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8080);
  try {
    await assert.rejects(signInWithEmailAndPassword(auth, 'integration@example.test', 'incorrect-password'));
    const user = (await signInWithEmailAndPassword(auth, 'integration@example.test', 'emulator-only-password')).user;
    assert.equal(user.uid, uid);
    const backend = createBackend(db, uid);
    await assert.rejects(backend.read(), /permissions|permission/i);
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'members', uid), { role: 'admin', active: true });
    });
    assert.equal((await getDocFromServer(doc(db, 'members', uid))).data()?.active, true);
    const saved = await backend.commit({ id: 'actual-auth-operation', baseRevision: 0, payload: encode({ ...emptyPayload(), planes: [{ id: 'auth-plan' }] }) });
    assert.equal(saved.revision, 1);
    assert.equal((await backend.read()).payload, saved.payload);
    await signOut(auth);
    await assert.rejects(backend.read(), /permissions|permission/i);
  } finally { await deleteApp(app); await env.cleanup(); }
});
