import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { createBackend, subscribeVersion } from './backend';
import type { RecordVersion } from './engine';
// Web SDK identifiers are public. They grant no data access: Auth + members + Rules do.
const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA5hOk15bkWWVEXRlKP6Ru7ekN4_9mzkoQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'planifica-cadiz.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'planifica-cadiz',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:474657216761:web:5bfeca7a0fcbb527952a28'
});
export const auth = getAuth(app);
export const db = getFirestore(app);
if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
export const backend = (uid: string) => createBackend(db, uid);
export const watchVersion = (next: (value: RecordVersion) => void, error: (error: Error) => void) => subscribeVersion(db, next, error);
