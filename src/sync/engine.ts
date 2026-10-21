export type Payload = { actuaciones: unknown[]; planes: unknown[]; comentarios: unknown[]; registrosAuditoria: unknown[]; planesPapelera?: unknown[] };
export type RecordVersion = { revision: number; payload: string; operationId: string };
export type Operation = { id: string; baseRevision: number; payload: string };
export type SavedState = { confirmed: RecordVersion; pending: Operation[] };
export type SyncStatus = 'cargando' | 'sincronizado' | 'guardando' | 'offline' | 'conflicto' | 'error';
export interface Persistence { load(): Promise<SavedState | undefined>; save(state: SavedState): Promise<void> }
export interface Backend { read(): Promise<RecordVersion>; commit(operation: Operation): Promise<RecordVersion> }
export const emptyPayload = (): Payload => ({ actuaciones: [], planes: [], comentarios: [], registrosAuditoria: [], planesPapelera: [] });
export function decode(payload: string): Payload {
  const value = JSON.parse(payload);
  value.planesPapelera ??= [];
  for (const key of Object.keys(emptyPayload()).filter(key => key !== 'planesPapelera')) {
    if (!Array.isArray(value?.[key]) || value[key].some((item: any) => !item || typeof item.id !== 'string')) {
      throw new Error('Los datos compartidos no tienen el formato esperado. No se han sustituido los datos locales.');
    }
  }
  if (value.planesPapelera !== undefined && (!Array.isArray(value.planesPapelera) || value.planesPapelera.some((item: any) => !item || typeof item.idCopia !== 'string'))) throw new Error('La papelera compartida no tiene el formato esperado.');
  for (const key of Object.keys(emptyPayload())) {
    const ids = (value[key] ?? []).map((item: any) => key === 'planesPapelera' ? item.idCopia : item.id);
    if (ids.some((id: string) => !id.trim()) || new Set(ids).size !== ids.length) throw new Error('Hay identificadores vacíos o repetidos. Revisa la copia antes de importar.');
  }
  if (Object.keys(value).some(key => !(key in emptyPayload()) && key !== 'planesPapelera')) throw new Error('Formato compartido desconocido');
  return value;
}
export function encode(value: Payload): string {
  const json = JSON.stringify(value);
  decode(json);
  if (new TextEncoder().encode(json).length > 700_000) throw new Error('El conjunto de datos supera el límite de sincronización (700 kB). Exporta los datos; no se han truncado.');
  return json;
}
export const initialVersion = (): RecordVersion => ({ revision: 0, payload: encode(emptyPayload()), operationId: '' });
export class ConflictError extends Error {}

// The persistent queue is written before network activity. A transaction acknowledgement,
// rather than navigator.onLine or a timer, is the only source of "sincronizado".
export class SharedSync {
  state: SavedState = { confirmed: initialVersion(), pending: [] };
  status: SyncStatus = 'cargando';
  error = '';
  private serial: Promise<void> = Promise.resolve();
  private sending: string | null = null;
  private running: Promise<void> | null = null;
  private stopped = false;
  private volatile: Payload | null = null;
  online = true;
  constructor(private store: Persistence, private backend: Backend, private notify: () => void, private uuid: () => string) {}
  private async command(fn: () => Promise<void>) {
    const next = this.serial.then(fn);
    this.serial = next.catch(() => {});
    return next;
  }
  private async persist(next: SavedState) {
    await this.store.save(next); // Quota errors must never claim success or remove pending data.
    this.state = next;
  }
  exportValue(): Payload { return this.volatile ?? this.value(); }
  value(): Payload { return decode(this.state.pending.at(-1)?.payload ?? this.state.confirmed.payload); }
  async start(online: boolean) {
    this.online = online;
    const saved = await this.store.load();
    if (saved) {
      decode(saved.confirmed.payload);
      for (const operation of saved.pending) decode(operation.payload);
      this.state = saved;
    }
    if (!online) { this.status = 'offline'; this.notify(); return; }
    try {
      const remote = await this.backend.read();
      if (!this.state.pending.length) await this.persist({ confirmed: remote, pending: [] });
      this.status = this.state.pending.length ? 'guardando' : 'sincronizado';
      this.notify();
      await this.flush();
    } catch (error) { this.fail(error); }
  }
  stop() { this.stopped = true; }
  fail(error: unknown) {
    this.status = error instanceof ConflictError ? 'conflicto' : 'error';
    this.error = error instanceof Error ? error.message : 'No se ha confirmado el guardado en el servidor.';
    this.notify();
  }
  async stage(value: Payload, displayedRevision?: number) {
    try {
      const payload = encode(value);
      await this.command(async () => {
        if (payload === (this.state.pending.at(-1)?.payload ?? this.state.confirmed.payload)) return;
        const pending = [...this.state.pending];
        const last = pending.at(-1);
        if (last && last.id !== this.sending) pending[pending.length - 1] = { ...last, payload };
        else pending.push({ id: this.uuid(), baseRevision: last ? last.baseRevision + 1 : (displayedRevision ?? this.state.confirmed.revision), payload });
        await this.persist({ ...this.state, pending });
        this.volatile = null;
        if (this.status !== 'conflicto') this.status = this.online ? 'guardando' : 'offline';
        this.notify();
      });
      if (this.online && this.status !== 'conflicto') void this.flush();
    } catch (error) { this.volatile = value; this.fail(error); throw error; }
  }
  async receive(remote: RecordVersion) {
    decode(remote.payload);
    await this.command(async () => {
      // A remote snapshot cannot erase an unacknowledged local edit.
      if (this.stopped || this.volatile || this.state.pending.length || remote.revision <= this.state.confirmed.revision) return;
      await this.persist({ confirmed: remote, pending: [] });
      this.status = 'sincronizado'; this.notify();
    });
  }
  setOnline(online: boolean) {
    this.online = online;
    if (!online && this.status !== 'conflicto') this.status = 'offline';
    this.notify();
    if (online && this.status !== 'conflicto') void this.flush();
  }
  flush(): Promise<void> {
    if (this.running) return this.running;
    if (this.volatile) return this.stage(this.volatile).then(() => this.flush()).catch(error => { this.fail(error); });
    this.running = this.send().finally(() => {
      this.running = null;
      if (!this.stopped && this.online && this.status === 'guardando' && this.state.pending.length) queueMicrotask(() => { void this.flush(); });
    });
    return this.running;
  }
  private async send() {
    await this.serial;
    if (this.stopped || !this.online || this.status === 'conflicto') return;
    try {
      while (this.state.pending.length && !this.stopped && this.online) {
        const operation = this.state.pending[0];
        this.sending = operation.id;
        this.status = 'guardando'; this.notify();
        const confirmed = await this.backend.commit(operation);
        await this.command(async () => {
          await this.persist({ confirmed, pending: this.state.pending.filter(item => item.id !== operation.id) });
          this.notify();
        });
        this.sending = null;
      }
      if (!this.state.pending.length && !this.stopped && this.online) {
        const remote = await this.backend.read();
        await this.receive(remote);
        if (!this.state.pending.length) { this.status = 'sincronizado'; this.error = ''; this.notify(); }
      }
    } catch (error) { this.fail(error); }
    finally { this.sending = null; }
  }
  // The UI must export a local backup before calling this explicit conflict resolution.
  async acceptRemote() {
    await this.serial;
    if (this.running) await this.running;
    const remote = await this.backend.read();
    await this.command(async () => {
      await this.persist({ confirmed: remote, pending: [] });
      this.volatile = null;
      this.status = 'sincronizado'; this.error = ''; this.notify();
    });
  }
}
