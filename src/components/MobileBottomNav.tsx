import React from 'react';
import {
  Layers,
  FolderKanban,
  LayoutDashboard,
  Shield,
  History,
  Smartphone,
  BarChart3
} from 'lucide-react';

interface MobileBottomNavProps {
  vistaActual: 'actuaciones' | 'planes' | 'estado' | 'dashboard' | 'admin' | 'auditoria';
  setVistaActual: (vista: 'actuaciones' | 'planes' | 'estado' | 'dashboard' | 'admin' | 'auditoria') => void;
  onLimpiarActuacionActiva: () => void;
  actuacionActiva: boolean;
  onAbrirCompatibilidadMovil: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  vistaActual,
  setVistaActual,
  onLimpiarActuacionActiva,
  actuacionActiva,
  onAbrirCompatibilidadMovil
}) => {
  const items = [
    { id: 'planes' as const, label: 'Planes', icon: Layers },
    { id: 'actuaciones' as const, label: 'Actuaciones', icon: FolderKanban },
    { id: 'estado' as const, label: 'Estado', icon: BarChart3 },
    { id: 'dashboard' as const, label: 'Mando', icon: LayoutDashboard },
    { id: 'auditoria' as const, label: 'Auditoría', icon: History },
  ];

  return (
    <nav
      aria-label="Navegación móvil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1E2738]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 pb-safe shadow-lg transition-all"
    >
      <div className="grid grid-cols-5 items-center h-14 max-w-md mx-auto px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = !actuacionActiva && vistaActual === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onLimpiarActuacionActiva();
                setVistaActual(item.id);
              }}
              className={`flex flex-col items-center justify-center h-full py-1 px-1 transition-all rounded-xl relative select-none ${
                isActive
                  ? 'text-[#0063A2] dark:text-sky-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95'
              }`}
            >
              {/* Indicador superior activo Diputación */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 rounded-full bg-[#0063A2] shadow-sm shadow-[#0063A2]/50" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
