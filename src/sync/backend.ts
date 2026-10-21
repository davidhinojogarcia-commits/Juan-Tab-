import { doc, getDocFromServer, onSnapshot, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import { ConflictError, decode, initialVersion, type Backend, type RecordVersion } from './engine';
function version(data: any): RecordVersion {
  if (!data) return initialVersion();
  if (!Number.isSafeInteger(data.revision) || data.revision < 1 || typeof data.operationId !== 'string') throw new Error('Versión compartida inválida');
  decode(data.payload);
  return { revision: data.revision, payload: data.payload, operationId: data.operationId };
}
export function createBackend(db: Firestore, uid: string): Backend {
  const reference = doc(db, 'workspaces', 'planifica');
  return {
    async read() { return version((await getDocFromServer(reference)).data()); },
    async commit(operation) {
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(operation.payload));
      const hash = [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
      const eventRef = doc(db, 'workspaces', 'planifica', 'events', operation.id);
      return runTransaction(db, async transaction => {
        const [event, snapshot] = await Promise.all([transaction.get(eventRef), transaction.get(reference)]);
        if (event.exists()) {
          if (event.data().actorUid !== uid || event.data().payloadHash !== hash) throw new Error('La operación ya existe con otro contenido.');
          return { revision: event.data().revision, payload: operation.payload, operationId: operation.id };
        }
        const current = version(snapshot.data());
        if (current.revision !== operation.baseRevision) throw new ConflictError('Otra persona o dispositivo ha guardado una versión más reciente. Tus cambios siguen conservados en este dispositivo.');
        const next = { revision: current.revision + 1, payload: operation.payload, operationId: operation.id };
        transaction.set(reference, { ...next, payloadHash: hash, updatedBy: uid, updatedAt: serverTimestamp() });
        transaction.set(eventRef, { actorUid: uid, payloadHash: hash, revision: next.revision, createdAt: serverTimestamp() });
        return next;
      });
    }
  };
}
export function subscribeVersion(db: Firestore, next: (value: RecordVersion) => void, error: (error: Error) => void) {
  const reference = doc(db, 'workspaces', 'planifica');
  return onSnapshot(reference, { includeMetadataChanges: true }, snapshot => {
    if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
    try { next(version(snapshot.data())); } catch (cause) { error(cause as Error); }
  }, error);
}
