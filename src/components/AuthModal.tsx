import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AuthModalProps {
  mostrar: boolean;
  onCerrar: () => void;
}

/**
 * La versión local todavía no tiene un proveedor de identidad.
 * No simular biometría, códigos 2FA ni inicios de sesión satisfactorios.
 * La autenticación real se integrará con el backend antes del despliegue.
 */
export const AuthModal: React.FC<AuthModalProps> = ({ mostrar, onCerrar }) => {
  if (!mostrar) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70">
      <div role="dialog" aria-modal="true" aria-labelledby="auth-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-slate-800">
        <div className="flex items-start justify-between gap-3">
          <h2 id="auth-title" className="text-lg font-bold">Autenticación pendiente de configurar</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-1 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />
          <p>Esta versión funciona como demostración local. No verifica identidades ni aplica una autenticación real. No introduzcas expedientes ni datos personales reales hasta conectar y probar el sistema de acceso seguro.</p>
        </div>
        <p className="mt-4 text-sm text-slate-600">Las opciones anteriores de huella, reconocimiento facial y códigos 2FA eran simuladas y se han deshabilitado para evitar una falsa sensación de seguridad.</p>
        <button type="button" onClick={onCerrar} className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Entendido</button>
      </div>
    </div>
  );
};
