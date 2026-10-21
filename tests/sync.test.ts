import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ConflictError, SharedSync, emptyPayload, encode, initialVersion, type Payload, type SavedState, type RecordVersion, type Operation } from '../src/sync/engine';
const value = (name: string): Payload => ({ ...emptyPayload(), planes: [{ id: 'plan-1', nombre: name }] });
const clone = <T,>(value: T): T => structuredClone(value);
class MemoryStore {
  saved?: SavedState; fail = false;
  async load() { return clone(this.saved); }
  async save(state: SavedState) { if (this.fail) throw new Error('QuotaExceeded'); this.saved = clone(state); }
}
class Server {
  current = initialVersion(); events = new Map<string, RecordVersion>(); writes = 0; lostResponse = false;
  async read() { return clone(this.current); }
  async commit(operation: Operation) {
    if (this.events.has(operation.id)) return clone(this.events.get(operation.id)!);
    if (this.current.revision !== operation.baseRevision) throw new ConflictError('Version conflict');
    this.current = { revision: this.current.revision + 1, payload: operation.payload, operationId: operation.id };
    this.events.set(operation.id, clone(this.current)); this.writes++;
    if (this.lostResponse) { this.lostResponse = false; throw new Error('Connection lost after commit'); }
    return clone(this.current);
  }
}
let id = 0;
const engine = (store = new MemoryStore(), server = new Server()) => new SharedSync(store, server, () => {}, () => `operation-${++id}`);
test('offline changes survive reload and synchronize only after server acknowledgement', async () => {
  const store = new MemoryStore(); const server = new Server(); const first = engine(store, server);
  await first.start(false); await first.stage(value('offline')); assert.equal(server.writes, 0); assert.equal(first.status, 'offline');
  first.stop(); const restored = engine(store, server); await restored.start(false); assert.deepEqual(restored.value(), value('offline'));
  restored.setOnline(true); await restored.flush(); assert.equal(restored.status, 'sincronizado'); assert.equal(server.writes, 1); assert.equal(restored.state.pending.length, 0);
});
test('two devices cannot overwrite each other silently; a conflict keeps the local draft', async () => {
  const server = new Server(); const a = engine(new MemoryStore(), server); const bStore = new MemoryStore(); const b = engine(bStore, server);
  await a.start(false); await b.start(false); await a.stage(value('A')); await b.stage(value('B'));
  a.setOnline(true); await a.flush(); b.setOnline(true); await b.flush();
  assert.equal(b.status, 'conflicto'); assert.deepEqual(b.value(), value('B')); assert.equal(bStore.saved!.pending.length, 1);
  assert.equal(server.current.payload, encode(value('A'))); assert.equal(server.writes, 1);
  await b.receive(server.current); assert.deepEqual(b.value(), value('B'));
});
test('retry after a lost server response is idempotent', async () => {
  const server = new Server(); const sync = engine(new MemoryStore(), server); await sync.start(false); await sync.stage(value('one'));
  server.lostResponse = true; sync.setOnline(true); await sync.flush(); assert.equal(sync.status, 'error'); assert.equal(sync.state.pending.length, 1);
  await sync.flush(); assert.equal(server.writes, 1); assert.equal(sync.state.pending.length, 0); assert.equal(sync.status, 'sincronizado');
});
test('a local storage failure never sends unpersisted data or reports success', async () => {
  const store = new MemoryStore(); const server = new Server(); const sync = engine(store, server); await sync.start(false); store.fail = true;
  await assert.rejects(sync.stage(value('not saved')), /QuotaExceeded/); assert.equal(sync.status, 'error'); assert.equal(server.writes, 0); assert.deepEqual(sync.exportValue(), value('not saved'));
  store.fail = false; await sync.flush(); assert.equal(sync.state.pending.length, 1);
});
test('snapshot and audit arrays are never truncated and oversized data is rejected', () => {
  const data = { ...emptyPayload(), registrosAuditoria: Array.from({ length: 2500 }, (_, i) => ({ id: `audit-${i}` })) };
  assert.equal(JSON.parse(encode(data)).registrosAuditoria.length, 2500);
  assert.throws(() => encode({ ...data, planes: [{ id: 'large', text: 'x'.repeat(710000) }] }), /no se han truncado/);
});
test('stale rendered data does not borrow a newer revision to overwrite remote edits', async () => {
  const server = new Server(); const sync = engine(new MemoryStore(), server); await sync.start(false);
  server.current = { revision: 1, operationId: 'remote', payload: encode(value('remote')) };
  await sync.receive(server.current); await sync.stage(value('stale edit'), 0); sync.setOnline(true); await sync.flush();
  assert.equal(sync.status, 'conflicto'); assert.equal(server.current.payload, encode(value('remote')));
});
test('edits made during an in-flight commit are saved in order', async () => {
  const server = new Server(); const sync = engine(new MemoryStore(), server); await sync.start(false);
  const commit = server.commit.bind(server); let release!: () => void;
  server.commit = async operation => { await new Promise<void>(resolve => release = resolve); return commit(operation); };
  await sync.stage(value('first')); sync.setOnline(true); const run = sync.flush();
  await new Promise(resolve => setImmediate(resolve)); await sync.stage(value('second'));
  server.commit = commit; release(); await run;
  assert.equal(server.current.payload, encode(value('second'))); assert.equal(server.writes, 2); assert.equal(sync.status, 'sincronizado');
});
test('representative existing plans, records and comments round-trip without truncation', async () => {
  const { ACTUACIONES_INICIALES, PLANES_INICIALES, COMENTARIOS_INICIALES } = await import('../src/data/initialData');
  const payload = { actuaciones: ACTUACIONES_INICIALES, planes: PLANES_INICIALES, comentarios: COMENTARIOS_INICIALES, registrosAuditoria: [] };
  const encoded = encode(payload);
  assert.deepEqual(JSON.parse(encoded), JSON.parse(JSON.stringify(payload)));
  assert.ok(new TextEncoder().encode(encoded).length <= 700000);
});
