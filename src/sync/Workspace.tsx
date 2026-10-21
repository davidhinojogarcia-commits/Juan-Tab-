import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, backend, watchVersion } from './firebase';
import { SharedSync, type Payload, type SyncStatus } from './engine';
import { persistence, savedDrafts } from './persistence';
import type { User } from '../types';
import { legacyData, legacyEntries } from './legacy';

export function downloadBackup(value: unknown, name = 'planifica-copia-local.json') {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const Workspace = createContext<{ engine: SharedSync; payload: Payload; user: User; status: SyncStatus; error: string } | null>(null);
export function useWorkspace() {
  const value = useContext(Workspace);
  if (!value) throw new Error('La sesión compartida no está disponible');
  return value;
}
const messages: Record<SyncStatus, string> = {
  cargando: 'Comprobando datos compartidos…', sincronizado: 'Guardado confirmado en Firebase', guardando: 'Pendiente de confirmación del servidor',
  offline: 'Sin conexión · guardado en Firebase pendiente', conflicto: 'Conflicto · tus cambios locales están conservados', error: 'Guardado sin confirmar · revisa el error'
};
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<FirebaseUser | null>(null);
  const [member, setMember] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<{ engine: SharedSync; payload: Payload; status: SyncStatus; error: string } | null>(null);
  const engineRef = useRef<SharedSync | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [draftCount, setDraftCount] = useState(0);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => onAuthStateChanged(auth, user => { setAccount(user); setMember(null); setLoading(!!user); setError(''); }), []);
  useEffect(() => {
    if (!account) return;
    void savedDrafts(account.uid).then(drafts => setDraftCount(drafts.length)).catch(() => {});
    if (!online) {
      try {
        const cached = JSON.parse(localStorage.getItem(`planifica-membership:${account.uid}`) || 'null');
        if (cached && ['admin', 'editor', 'auditor'].includes(cached.role)) { setMember(cached); setLoading(false); return; }
      } catch {}
      setError('Sin conexión: no hay una autorización previa guardada para esta cuenta.'); setLoading(false); return;
    }
    return onSnapshot(doc(db, 'members', account.uid), { includeMetadataChanges: true }, snapshot => {
      if (snapshot.metadata.fromCache) return;
      const data = snapshot.data();
      if (data?.active === true && ['admin', 'editor', 'auditor'].includes(data.role)) { setMember({ role: data.role }); localStorage.setItem(`planifica-membership:${account.uid}`, JSON.stringify({ role: data.role })); setError(''); }
      else { localStorage.removeItem(`planifica-membership:${account.uid}`); setMember(null); setError('Esta cuenta no está autorizada para PLANIFICA. Solicita al administrador que revise su ficha de miembro.'); }
      setLoading(false);
    }, () => { setMember(null); setLoading(false); setError('No se puede verificar tu autorización. Las reglas publicadas deben permitir leer tu propia ficha de miembro.'); });
  }, [account?.uid, online]);
  useEffect(() => {
    setState(null);
    if (!account || !member) return;
    let cancelled = false;
    const engine = new SharedSync(persistence(account.uid), backend(account.uid), () => {
      if (!cancelled) setState({ engine, payload: engine.value(), status: engine.status, error: engine.error });
    }, () => crypto.randomUUID());
    engineRef.current = engine;
    let unsubscribe = () => {};
    void engine.start(navigator.onLine).then(() => {
      if (cancelled) return;
      unsubscribe = watchVersion(value => { void engine.receive(value).catch(error => engine.fail(error)); }, error => engine.fail(error));
    }).catch(error => engine.fail(error));
    const online = () => engine.setOnline(true); const offline = () => engine.setOnline(false);
    window.addEventListener('online', online); window.addEventListener('offline', offline);
    return () => { cancelled = true; engine.stop(); unsubscribe(); window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, [account?.uid, member?.role]);
  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { await signInWithEmailAndPassword(auth, email, password); setPassword(''); }
    catch { setError('No se ha podido iniciar sesión. Comprueba la cuenta y la contraseña de Firebase.'); }
    finally { setBusy(false); }
  }
  async function exportPending() {
    try { downloadBackup({ current: engineRef.current?.exportValue(), drafts: account ? await savedDrafts(account.uid) : [], legacy: legacyEntries() }); }
    catch { setError('No se pudo preparar la copia local. No cierres esta pestaña.'); }
  }
  if (!account || !member || !state) return <main className="min-h-screen grid place-items-center p-5 bg-slate-100">
    <form onSubmit={login} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-sm">
      <h1 className="text-2xl font-bold">PLANIFICA</h1>
      <p>Acceso al espacio compartido de Juan.</p>
      {loading ? <p>Verificando sesión…</p> : !account ? <>
        <label className="block">Correo electrónico<input className="block border rounded p-3 w-full" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="block">Contraseña<input className="block border rounded p-3 w-full" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button disabled={busy} className="bg-blue-900 text-white rounded p-3 w-full">{busy ? 'Accediendo…' : 'Iniciar sesión'}</button>
      </> : <p>Comprobando acceso a los datos compartidos.</p>}
      {error && <p role="alert">{error}</p>}
      {account && <button type="button" onClick={() => void signOut(auth)}>Cerrar sesión</button>}
    </form>
  </main>;
  const admin = member.role === 'admin'; const editor = admin || member.role === 'editor';
  const names = (account.displayName || account.email?.split('@')[0] || 'Usuario').split(' ');
  const user: User = {
    id: account.uid, nombre: names[0], apellidos: names.slice(1).join(' '), email: account.email || '',
    rol: admin ? 'jefe_servicio' : editor ? 'tecnico' : 'auditor', activo: true,
    departamento: 'PLANIFICA', cargo: admin ? 'Administrador de PLANIFICA' : editor ? 'Técnico' : 'Auditor',
    biometriaHabilitada: false, dosFactoresHabilitado: account.providerData.some(provider => provider.providerId === 'phone'),
    permisos: { puedeEditarPlanes: editor, puedeAsignarTecnicos: admin, puedeCalificarDocumentos: editor, puedeExportarInformes: true, puedeEnviarComentarios: editor, puedeGestionarUsuarios: false }
  };
  return <Workspace.Provider value={{ ...state, user }}>
    <div className="p-3 bg-white border-b flex flex-wrap items-center gap-3 text-sm" role="status">
      <span>{messages[state.status]}</span>
      <button className="underline" onClick={() => void state.engine.flush()}>Reintentar guardado</button>
      <button className="underline" onClick={() => void exportPending()}>Descargar copia local</button>
      {admin && <button className="underline" onClick={() => setImportOpen(true)}>Importar datos antiguos</button>}
      <button className="underline" onClick={() => void signOut(auth)}>Cerrar sesión</button>
      {draftCount > 0 && <p className="w-full">Hay borradores pendientes guardados en este dispositivo. «Descargar copia local» incluye también los de otras pestañas.</p>}
      {state.error && <p className="w-full text-red-800" role="alert">{state.error}</p>}
      {state.status === 'conflicto' && <button className="border p-2" onClick={async () => {
        if (!window.confirm('Se descargará una copia de tus cambios antes de cargar la versión compartida. Revisa que la descarga se complete. ¿Continuar?')) return;
        downloadBackup(state.engine.state, 'planifica-conflicto-local.json');
        try { await state.engine.acceptRemote(); } catch (error) { state.engine.fail(error); }
      }}>Guardar copia y cargar versión compartida</button>}
    </div>
    {importOpen && <section className="p-4 bg-amber-50 border" role="dialog" aria-label="Importar datos antiguos">
      <p>Importa los datos guardados por la versión anterior en este navegador. La importación solo está disponible si el espacio compartido está vacío; se conservará una copia del origen.</p>
      <button className="border p-2 m-2" onClick={async () => {
        try {
          downloadBackup(legacyEntries(), 'planifica-datos-antiguos.json'); const legacy = legacyData();
          if (state.engine.state.confirmed.revision !== 0 || state.engine.state.pending.length) throw new Error('El espacio compartido ya contiene cambios. Se ha descargado el origen para preparar una importación revisada.');
          await state.engine.stage(legacy, 0); setImportOpen(false);
        } catch (error) { state.engine.fail(error); }
      }}>Descargar copia e importar</button>
      <button onClick={() => setImportOpen(false)}>Cancelar</button>
    </section>}
    <React.Fragment key={account.uid}>{children}</React.Fragment>
  </Workspace.Provider>;
}
