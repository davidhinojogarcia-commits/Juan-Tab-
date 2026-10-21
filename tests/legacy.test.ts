import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legacyData, legacyEntries } from '../src/sync/legacy';
import { encode, decode, emptyPayload } from '../src/sync/engine';
function storage(entries: Record<string, string>) {
  return { length: Object.keys(entries).length, key: (i: number) => Object.keys(entries)[i], getItem: (k: string) => entries[k] ?? null } as Storage;
}
test('imports current v2 data including recycle bin without changing its original keys', () => {
  const entries = { adl_cadiz_planes_v2: '[{"id":"plan-1","presupuestoTotal":1234}]', adl_cadiz_planes_papelera_v2: '[{"idCopia":"copy-1","plan":{"id":"removed"}}]', adl_cadiz_usuarios_v2: '[{"id":"local-admin"}]' };
  const local = storage(entries);
  assert.deepEqual(legacyData(local).planes, [{ id: 'plan-1', presupuestoTotal: 1234 }]);
  assert.deepEqual(legacyData(local).planesPapelera, [{ idCopia: 'copy-1', plan: { id: 'removed' } }]);
  assert.deepEqual(legacyEntries(local), entries);
  assert.equal('usuarios' in legacyData(local), false);
});
test('different source versions cannot be silently selected or mixed', () => {
  assert.throws(() => legacyData(storage({ adl_cadiz_planes_v2: '[{"id":"new"}]', 'adl_cadiz_planes_v1.1': '[{"id":"old"}]' })), /dos versiones/);
});
test('invalid JSON, duplicate IDs and malformed recycle-bin copies block import', () => {
  assert.throws(() => legacyData(storage({ adl_cadiz_planes_v2: '{' })));
  assert.throws(() => encode({ ...emptyPayload(), planes: [{ id: 'same' }, { id: 'same' }] }), /repetidos/);
  assert.throws(() => encode({ ...emptyPayload(), planesPapelera: [{ id: 'wrong' }] }), /papelera/);
  assert.throws(() => encode({ ...emptyPayload(), planes: [{ id: '' }] }), /vacíos/);
});
test('older snapshot without recycle bin remains readable', () => {
  assert.deepEqual(decode('{"actuaciones":[],"planes":[],"comentarios":[],"registrosAuditoria":[]}').planesPapelera, []);
});
