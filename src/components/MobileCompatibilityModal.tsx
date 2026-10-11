import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Apple,
  X,
  Share2,
  PlusSquare,
  Download,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Wifi,
  Sparkles,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { CadizLogo } from './CadizLogo';

interface MobileCompatibilityModalProps {
  mostrar: boolean;
  onCerrar: () => void;
  pestañaInicial?: 'ios' | 'android' | 'qr';
}

export const MobileCompatibilityModal: React.FC<MobileCompatibilityModalProps> = ({
  mostrar,
  onCerrar,
  pestañaInicial
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [pestaña, setPestaña] = useState<'ios' | 'android' | 'qr'>('ios');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiado, setCopiado] = useState(false);
  const [instalando, setInstalando] = useState(false);

  useEffect(() => {
    if (pestañaInicial) {
      setPestaña(pestañaInicial);
    } else if (isIOS) {
      setPestaña('ios');
    } else if (isAndroid) {
      setPestaña('android');
    } else {
      setPestaña('qr');
    }
  }, [pestañaInicial, isIOS, isAndroid, mostrar]);

  useEffect(() => {
    if (mostrar && typeof window !== 'undefined') {
      const urlActual = window.location.origin;
      QRCode.toDataURL(urlActual, {
        width: 280,
        margin: 2,
        color: {
          dark: '#003366',
          light: '#ffffff'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generando QR:', err));
    }
  }, [mostrar]);

  if (!mostrar) return null;

  const handleCopiarEnlace = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin).then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      });
    }
  };

  const handleInstalarAndroid = async () => {
    setInstalando(true);
    try {
      await install();
    } finally {
      setInstalando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#1E2738] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Cabecera Institucional */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#0063A2]/10 via-[#0063A2]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0063A2] text-white flex items-center justify-center shadow-md shadow-[#0063A2]/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Compatibilidad Móvil (iOS y Android)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                  100% PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ADL (v1.1) · Diputación Provincial de Cádiz
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Selección de Plataforma */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setPestaña('ios')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              pestaña === 'ios'
                ? 'bg-white dark:bg-[#1E2738] text-[#0063A2] dark:text-sky-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>Apple iOS</span>
            {isIOS && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setPestaña('android')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              pestaña === 'android'
                ? 'bg-white dark:bg-[#1E2738] text-[#0063A2] dark:text-sky-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Google Android</span>
            {isAndroid && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setPestaña('qr')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              pestaña === 'qr'
                ? 'bg-white dark:bg-[#1E2738] text-[#0063A2] dark:text-sky-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Escanear QR</span>
          </button>
        </div>

        {/* Contenido según Pestaña */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar text-xs">
          {/* 1. APPLE IOS (iPhone / iPad) */}
          {pestaña === 'ios' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
                    <Apple className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      Compatible con iPhone y iPad
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Safari en iOS 14.3 o superior (pantalla completa, gestos y offline)
                    </p>
                  </div>
                </div>
                {isInstalled ? (
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Instalada
                  </span>
                ) : isIOS ? (
                  <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-800 text-[10px] font-bold">
                    Tu dispositivo
                  </span>
                ) : null}
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-[#475F7B] dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  Pasos para instalar en tu iPhone o iPad:
                </h5>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-[#0063A2] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Abre la aplicación en Safari
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                        Toca el botón <strong>Compartir</strong>{' '}
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs">
                          <Share2 className="w-3 h-3 inline mr-1" /> Compartir
                        </span>{' '}
                        en la barra inferior de Safari.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-[#0063A2] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Selecciona "Añadir a la pantalla de inicio"
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                        Desplaza hacia abajo en el menú desplegable y toca la opción con el icono{' '}
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs">
                          <PlusSquare className="w-3 h-3 inline mr-1" /> Añadir a pantalla de inicio
                        </span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-[#0063A2] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Confirma e inicia la aplicación
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                        Pulsa <strong>Añadir</strong> en la esquina superior derecha. Se creará el icono con el escudo oficial de la Diputación de Cádiz y se ejecutará a pantalla completa como una app nativa.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ventajas iOS */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#39DA8A]" />
                  <span>Sin barra de URL de Safari</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#39DA8A]" />
                  <span>Soporte Dynamic Island / Notch</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#39DA8A]" />
                  <span>Cifrado local con E2EE</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#39DA8A]" />
                  <span>Icono Retina Oficial (180x180)</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. GOOGLE ANDROID */}
          {pestaña === 'android' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#39DA8A] text-white flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-slate-900" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      Compatible con teléfonos y tablets Android
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Chrome, Samsung Internet, Edge, Firefox y navegadores compatibles
                    </p>
                  </div>
                </div>
                {isInstalled ? (
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Instalada
                  </span>
                ) : isAndroid ? (
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Tu dispositivo
                  </span>
                ) : null}
              </div>

              {/* Botón de 1-Clic si está disponible el prompt */}
              {isInstallable && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0063A2]/15 to-emerald-500/15 border border-[#0063A2]/30 text-center space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">
                    ¡Tu navegador Android permite la instalación directa!
                  </p>
                  <button
                    type="button"
                    onClick={handleInstalarAndroid}
                    disabled={instalando}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0063A2] hover:bg-[#004f82] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#0063A2]/30 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>{instalando ? 'Instalando...' : 'Instalar ADL en Android ahora (1-Clic)'}</span>
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <h5 className="font-bold text-[#475F7B] dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  Instalación manual en Android:
                </h5>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-[#39DA8A] text-slate-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Abre el menú del navegador
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                        Toca los tres puntos verticales <strong>(⋮)</strong> situados en la esquina superior derecha de Google Chrome o Samsung Internet.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-[#39DA8A] text-slate-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Pulsa "Instalar aplicación" o "Añadir a pantalla de inicio"
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                        El navegador descargará el paquete PWA de la Diputación de Cádiz con los iconos adaptativos y el caché de navegación offline.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-[#39DA8A] text-slate-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Acceso autónomo desde el cajón de aplicaciones
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                        La app aparecerá en tu cajón de aplicaciones junto al resto de apps nativas de tu dispositivo Android, con soporte para atajos de acceso directo (Planes, Actuaciones y Cuadro de Mando).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ventajas Android */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#39DA8A]" />
                  <span>Iconos Maskable adaptables</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#39DA8A]" />
                  <span>Atajos rápidos de inicio</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#39DA8A]" />
                  <span>Sincronización en segundo plano</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#39DA8A]" />
                  <span>Cero consumo de datos en modo offline</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. CÓDIGO QR PARA ESCANEAR CON MÓVIL */}
          {pestaña === 'qr' && (
            <div className="space-y-4 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-sm mx-auto">
                <p className="font-bold text-slate-900 dark:text-white mb-2">
                  Escanea con la cámara de tu iPhone o móvil Android
                </p>

                {qrDataUrl ? (
                  <div className="relative mx-auto w-56 h-56 bg-white p-3 rounded-2xl shadow-inner border border-slate-200 flex items-center justify-center">
                    <img
                      src={qrDataUrl}
                      alt="Código QR para abrir en iOS o Android"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md border border-slate-100 flex items-center justify-center">
                        <img src="/favicon-32x32.png" alt="Diputación" className="w-7 h-7" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-56 h-56 mx-auto flex items-center justify-center text-slate-400">
                    Generando QR oficial...
                  </div>
                )}

                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopiarEnlace}
                    className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado ? '¡Enlace copiado!' : 'Copiar Enlace'}</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Al escanear el código, la plataforma se abrirá de inmediato en el navegador móvil y podrás guardarla en la pantalla de inicio con un solo toque.
              </p>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-[#39DA8A]" />
            <span>Certificado SSL Seguro y Cifrado Oficial</span>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="py-2 px-4 rounded-xl bg-[#0063A2] hover:bg-[#004f82] text-white font-bold transition shadow-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
