import { decode, encode, type Payload } from './engine';

/** Keep the complete origin, including keys which must not grant server permissions. */
export function legacyEntries(storage: Storage = localStorage): Record<string, string> {
  const entries: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith('adl_cadiz_')) {
      const raw = storage.getItem(key);
      if (raw !== null) entries[key] = raw;
    }
  }
  return entries;
}

/** Import only reviewed business data; local users never become authenticated members. */
export function legacyData(storage: Storage = localStorage): Payload {
  const read = (key: string) => {
    const current = storage.getItem(`adl_cadiz_${key}_v2`);
    const older = storage.getItem(`adl_cadiz_${key}_v1.1`);
    if (current !== null && older !== null && JSON.stringify(JSON.parse(current)) !== JSON.stringify(JSON.parse(older))) {
      throw new Error('Hay dos versiones locales distintas. Conserva la copia completa y concilia los datos antes de importar.');
    }
    return JSON.parse(current ?? older ?? '[]');
  };
  const payload = {
    actuaciones: read('actuaciones'), planes: read('planes'), comentarios: read('comentarios'),
    registrosAuditoria: read('auditoria'), planesPapelera: read('planes_papelera'),
  };
  return decode(encode(payload));
}
