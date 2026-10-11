import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { CampoRevisar } from '../types';

interface NavigationValidationModalProps {
  mostrar: boolean;
  documentoTitulo: string;
  camposFaltantes: CampoRevisar[];
  onCerrar: () => void;
  onConfirmarSalto: () => void;
}

export const NavigationValidationModal: React.FC<NavigationValidationModalProps> = ({
  mostrar,
  documentoTitulo,
  camposFaltantes,
  onCerrar,
  onConfirmarSalto
}) => {
  if (!mostrar) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 shadow-2xl p-6 overflow-hidden">
        {/* Decorative corner warning bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bloqueo de Navegación · Campos sin Revisar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Regla obligatoria de revisión técnica del Área de Desarrollo Local
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>Documento actual: {documentoTitulo}</span>
          </div>
          <p>
            No se puede pasar al siguiente documento hasta calificar todos los campos obligatorios
            con <strong>✅ Conforme</strong> o <strong>❌ No Conforme</strong> (con su texto de subsanación automático).
          </p>
        </div>

        <div className="mt-4">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Campos pendientes de revisión ({camposFaltantes.length})</span>
            <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400">Obligatorios</span>
          </h4>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {camposFaltantes.map((campo, idx) => (
              <div
                key={campo.id}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{campo.campo}</p>
                  {campo.descripcion && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{campo.descripcion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onCerrar}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Revisar campos pendientes ahora</span>
          </button>

          <button
            onClick={onConfirmarSalto}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition flex items-center justify-center gap-1"
            title="Solo para técnicos supervisores o revisiones preliminares"
          >
            <span>Omitir temporalmente</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
