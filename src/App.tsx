import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { ActuacionList } from './components/ActuacionList';
import { ActuacionDetail } from './components/ActuacionDetail';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { PlanesView } from './components/PlanesView';
import { AuditoriaView } from './components/AuditoriaView';
import { NavigationValidationModal } from './components/NavigationValidationModal';
import { AuditLogModal } from './components/AuditLogModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { NuevaActuacionModal } from './components/NuevaActuacionModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileCompatibilityModal } from './components/MobileCompatibilityModal';
import { WifiOff, ShieldCheck, Heart } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    actuacionActiva,
    seleccionarActuacion,
    alertaCamposIncompletos,
    cerrarAlertaCampos,
    confirmarSaltoForzado,
    isOnline
  } = useApp();

  const [vistaActual, setVistaActual] = useState<'planes' | 'actuaciones' | 'dashboard' | 'admin' | 'auditoria'>('planes');
  const [vistaOrigen, setVistaOrigen] = useState<'planes' | 'actuaciones' | 'dashboard'>('planes');
  const [modalAuditoriaAbierto, setModalAuditoriaAbierto] = useState(false);
  const [modalAjustesAbierto, setModalAjustesAbierto] = useState(false);
  const [modalAuthAbierto, setModalAuthAbierto] = useState(false);
  const [modalNuevaActuacionAbierto, setModalNuevaActuacionAbierto] = useState(false);
  const [modalMovilAbierto, setModalMovilAbierto] = useState(false);

  const [resetPlanesKey, setResetPlanesKey] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FA] text-[#1E293B]">
      {/* Header Superior Institucional con Logo y Menú Principal Arriba */}
      <Header
        vistaActual={vistaActual}
        setVistaActual={(v) => {
          seleccionarActuacion(null);
          setVistaActual(v);
          if (v === 'planes') {
            setResetPlanesKey((k) => k + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        abrirAjustes={() => setModalAjustesAbierto(true)}
        abrirAuthModal={() => setModalAuthAbierto(true)}
      />

      {/* Banner de Modo Offline Activo */}
        {!isOnline && (
          <div className="bg-amber-100 border-b border-amber-300 text-amber-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-2xs">
            <WifiOff className="w-4 h-4 text-amber-700 animate-pulse" />
            <span>
              Modo Offline Completo Activo · Todos los datos se guardan con cifrado local y se sincronizarán al recuperar la conexión a la red de la Diputación.
            </span>
          </div>
        )}

        {/* Contenedor Principal de Vista (Pantalla completa para tablas de Actuaciones y Planes) */}
        <main className={`flex-1 w-full mx-auto p-3 sm:p-5 md:p-6 pb-20 md:pb-8 transition-all ${actuacionActiva || vistaActual === 'actuaciones' || vistaActual === 'planes' ? 'max-w-none px-3 sm:px-6 md:px-8' : 'max-w-7xl'}`}>
          {actuacionActiva ? (
            <ActuacionDetail
              onVolver={() => {
                seleccionarActuacion(null);
                setVistaActual(vistaOrigen);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onVerAuditoria={() => setModalAuditoriaAbierto(true)}
            />
          ) : vistaActual === 'planes' ? (
            <PlanesView
              key={resetPlanesKey}
              onAbrirActuacion={(id) => {
                setVistaOrigen('planes');
                seleccionarActuacion(id);
              }}
            />
          ) : vistaActual === 'dashboard' ? (
            <Dashboard
              onAbrirActuacion={(id) => {
                setVistaOrigen('dashboard');
                seleccionarActuacion(id);
                setVistaActual('actuaciones');
              }}
            />
          ) : vistaActual === 'admin' ? (
            <AdminPanel />
          ) : vistaActual === 'auditoria' ? (
            <AuditoriaView />
          ) : (
            <ActuacionList
              onSeleccionarActuacion={(id) => {
                setVistaOrigen('actuaciones');
                seleccionarActuacion(id);
              }}
              onAbrirModalNueva={() => setModalNuevaActuacionAbierto(true)}
            />
          )}
        </main>

        {/* Footer Institucional con Logo Diputación de Cádiz */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500 mb-14 md:mb-0 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800">
                Diputación Provincial de Cádiz
              </span>
              <span className="text-slate-300">—</span>
              <span>Área de Desarrollo Local · Supervisión y Control Técnico de Obras</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>Sede Electrónica Oficial</span>
              <span className="text-slate-200">·</span>
              <span>Planifica v1.0 · Sesión Segura</span>
            </div>
          </div>
        </footer>

      {/* Barra de Navegación Inferior para Smartphones iOS y Android */}
      <MobileBottomNav
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        onLimpiarActuacionActiva={() => seleccionarActuacion(null)}
        actuacionActiva={!!actuacionActiva}
        onAbrirCompatibilidadMovil={() => setModalMovilAbierto(true)}
      />

      {/* Modal de Compatibilidad Móvil (iOS y Android) */}
      <MobileCompatibilityModal
        mostrar={modalMovilAbierto}
        onCerrar={() => setModalMovilAbierto(false)}
      />

      {/* Modal de Validación de Navegación (REGLA MANDATORIA) */}
      <NavigationValidationModal
        mostrar={!!alertaCamposIncompletos?.mostrar}
        documentoTitulo={alertaCamposIncompletos?.documentoOrigenTitulo || ''}
        camposFaltantes={alertaCamposIncompletos?.camposFaltantes || []}
        onCerrar={cerrarAlertaCampos}
        onConfirmarSalto={confirmarSaltoForzado}
      />

      {/* Modales Auxiliares */}
      <AuditLogModal
        mostrar={modalAuditoriaAbierto || vistaActual === 'auditoria'}
        onCerrar={() => {
          setModalAuditoriaAbierto(false);
          if (vistaActual === 'auditoria') {
            setVistaActual('actuaciones');
          }
        }}
      />

      <SettingsModal
        mostrar={modalAjustesAbierto}
        onCerrar={() => setModalAjustesAbierto(false)}
      />

      <AuthModal
        mostrar={modalAuthAbierto}
        onCerrar={() => setModalAuthAbierto(false)}
      />

      <NuevaActuacionModal
        mostrar={modalNuevaActuacionAbierto}
        onCerrar={() => setModalNuevaActuacionAbierto(false)}
        onActuacionCreada={(id) => {
          seleccionarActuacion(id);
          setVistaActual('actuaciones');
        }}
      />
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturó error no controlado:', error, errorInfo);
  }

  handleReset = () => {
    try {
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#EEF2F6] flex items-center justify-center p-4 text-[#1E293B]">
          <div className="max-w-md w-full bg-white p-7 rounded-3xl border border-slate-200 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-blue-50 text-[#004F90] border border-blue-200 rounded-2xl flex items-center justify-center mx-auto font-black text-xl shadow-xs">
              ADL
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Recuperación Automática del Sistema
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Área de Desarrollo Local · Diputación Provincial de Cádiz
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Se ha asegurado la sesión para <strong>Juan Hinojo García</strong> (Jefe de Servicio). Pulsa el botón para recargar la interfaz con todos los datos actualizados.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-xl bg-[#004F90] hover:bg-[#003B71] text-white font-black text-xs shadow-md transition"
            >
              Cargar Aplicación y Restaurar Sesión
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
