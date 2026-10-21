import React from 'react';
import { useWorkspace } from '../sync/Workspace';
export function AuthModal({ mostrar, onCerrar }: { mostrar: boolean; onCerrar: () => void }) {
  const { user } = useWorkspace();
  if (!mostrar) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-label="Sesión de Firebase" aria-modal="true">
    <section className="bg-white rounded-xl p-6 max-w-md w-full">
      <h2 className="text-xl font-bold">Sesión de Firebase</h2>
      <p>{user.email}</p><p>{user.cargo}</p>
      <p>La identidad y los permisos se verifican con Firebase. Para cambiar de cuenta, cierra la sesión desde la barra superior.</p>
      <button className="border rounded p-3 mt-4" onClick={onCerrar}>Cerrar</button>
    </section>
  </div>;
}
