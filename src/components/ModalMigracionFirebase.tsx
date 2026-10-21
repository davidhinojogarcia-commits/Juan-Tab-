import React, { useState } from 'react';
import { downloadBackup, useWorkspace } from '../sync/Workspace';
import { legacyData, legacyEntries } from '../sync/legacy';

export function ModalMigracionFirebase({ mostrar, onCerrar }: { mostrar: boolean; onCerrar: () => void }) {
  const { engine, user } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!mostrar) return null;
  const importData = async () => {
    setBusy(true); setError('');
    try {
      downloadBackup(legacyEntries(), 'planifica-origen-completo.json');
      if (engine.state.confirmed.revision !== 0 || engine.state.pending.length) throw new Error('El espacio compartido ya contiene datos. No se ha sobrescrito ningún registro.');
      await engine.stage(legacyData(), 0);
      onCerrar();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo preparar la importación.'); }
    finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Copia de seguridad e importación">
    <section className="bg-white rounded-xl p-5 max-w-lg w-full max-h-[90dvh] overflow-y-auto space-y-4">
      <h2 className="text-xl font-bold">Copia de seguridad e importación</h2>
      <p>La copia conserva los datos del navegador. La importación añade planes, actuaciones, comentarios, auditoría y papelera al espacio compartido vacío. Las cuentas y permisos se gestionan en Firebase.</p>
      <button className="border rounded p-3" onClick={() => { try { downloadBackup(legacyEntries(), 'planifica-origen-completo.json'); } catch { setError('No se pudo descargar la copia.'); } }}>Descargar datos antiguos</button>
      {user.rol === 'jefe_servicio' && <button className="border rounded p-3" disabled={busy} onClick={() => void importData()}>{busy ? 'Preparando…' : 'Descargar copia e importar'}</button>}
      <p>Comprueba que la descarga termine. «Pendiente» indica que Firebase todavía no ha confirmado el guardado.</p>
      {error && <p role="alert" className="text-red-800">{error}</p>}
      <button className="border rounded p-3" disabled={busy} onClick={onCerrar}>Cerrar</button>
    </section>
  </div>;
}
