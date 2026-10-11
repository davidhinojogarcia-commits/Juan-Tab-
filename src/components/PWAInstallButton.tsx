import React, { useState } from 'react';
import { Download, Smartphone, X, ShieldCheck, Apple, QrCode } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { MobileCompatibilityModal } from './MobileCompatibilityModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pestañaInicial, setPestañaInicial] = useState<'ios' | 'android' | 'qr'>('qr');

  // Si ya está ejecutándose como PWA instalada en pantalla completa
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 text-[11px] font-semibold text-white/90">
        <ShieldCheck className="w-3.5 h-3.5 text-[#39DA8A]" />
        <span className="hidden md:inline">PWA Instalada</span>
      </div>
    );
  }

  // Flujo Android directo con beforeinstallprompt nativo
  if (isInstallable) {
    return (
      <>
        <div className="flex items-center gap-1">
          <button
            onClick={() => install()}
            className="flex items-center gap-1.5 rounded-lg bg-white text-[#0063A2] hover:bg-white/90 px-3 py-1.5 text-xs font-bold shadow-xs transition-all active:scale-95"
            title="Instalar ADL en este dispositivo Android o navegador"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instalar App</span>
            <span className="sm:hidden">Instalar</span>
          </button>

          <button
            onClick={() => {
              setPestañaInicial(isAndroid ? 'android' : 'qr');
              setModalAbierto(true);
            }}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition"
            title="Ver opciones para iOS y Android"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        <MobileCompatibilityModal
          mostrar={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          pestañaInicial={pestañaInicial}
        />
      </>
    );
  }

  // Flujo iOS Safari (dispositivo iPhone / iPad detectado)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => {
            setPestañaInicial('ios');
            setModalAbierto(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-white text-[#0063A2] hover:bg-white/90 px-2.5 py-1.5 text-xs font-bold shadow-xs transition-all active:scale-95"
        >
          <Apple className="w-3.5 h-3.5" />
          <span>Instalar en iOS</span>
        </button>

        <MobileCompatibilityModal
          mostrar={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          pestañaInicial="ios"
        />
      </>
    );
  }

  // Flujo escritorio / cualquier navegador: Botón para abrir compatibilidad móvil (iOS / Android / QR)
  return (
    <>
      <button
        onClick={() => {
          setPestañaInicial(isAndroid ? 'android' : isIOS ? 'ios' : 'qr');
          setModalAbierto(true);
        }}
        className="flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95"
        title="Instalar en móvil iPhone (iOS) o Android"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden md:inline">App Móvil (iOS/Android)</span>
      </button>

      <MobileCompatibilityModal
        mostrar={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        pestañaInicial={pestañaInicial}
      />
    </>
  );
};

export default PWAInstallButton;
