import type { Persistence, SavedState } from './engine';
const database = new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('planifica-shared-v1', 1);
  request.onupgradeneeded = () => { request.result.createObjectStore('drafts'); };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(new Error('No se puede abrir el almacenamiento local.'));
});
export function persistence(uid: string): Persistence {
  // A stable tab ID survives reloads; each tab keeps its own draft to avoid overwriting
  // another tab's unsent changes. Saved drafts remain exportable after a tab closes.
  let clientId = sessionStorage.getItem('planifica-client-id');
  if (!clientId) { clientId = crypto.randomUUID(); sessionStorage.setItem('planifica-client-id', clientId); }
  const key = `${uid}:${clientId}`;
  return {
    async load() {
      const db = await database;
      return new Promise((resolve, reject) => {
        const request = db.transaction('drafts').objectStore('drafts').get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
    async save(state: SavedState) {
      const db = await database;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('drafts', 'readwrite');
        transaction.objectStore('drafts').put(state, key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('No se pudo guardar en este dispositivo. Exporta tus cambios antes de cerrar.'));
        transaction.onabort = () => reject(new Error('Guardado local cancelado. Exporta tus cambios antes de cerrar.'));
      });
    }
  };
}
export async function savedDrafts(uid: string): Promise<SavedState[]> {
  const db = await database;
  return new Promise((resolve, reject) => {
    const values: SavedState[] = [];
    const request = db.transaction('drafts').objectStore('drafts').openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return resolve(values);
      if (String(cursor.key).startsWith(`${uid}:`) && cursor.value.pending.length) values.push(cursor.value);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
}
