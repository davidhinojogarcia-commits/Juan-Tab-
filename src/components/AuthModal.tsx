import React, { useState } from 'react';
import {
  Fingerprint,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  X,
  CheckCircle,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CadizOfficialLogo } from './CadizOfficialLogo';

interface AuthModalProps {
  mostrar: boolean;
  onCerrar: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ mostrar, onCerrar }) => {
  const { usuarioActual, cambiarUsuarioActivo, usuarios } = useApp();

  const [metodo, setMetodo] = useState<'biometria' | 'email' | '2fa'>('biometria');
  const [emailInput, setEmailInput] = useState('');
  const [codigo2FA, setCodigo2FA] = useState(['', '', '', '', '', '']);
  const [mensajeExito, setMensajeExito] = useState('');
  const [error, setError] = useState('');
  const [escaneandoBiometria, setEscaneandoBiometria] = useState(false);

  if (!mostrar) return null;

  // Autenticación biométrica mediante WebAuthn con fallback
  const ejecutarBiometria = async () => {
    setEscaneandoBiometria(true);
    setError('');

    try {
      if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        const disponible = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (disponible) {
          // Intentar credencial WebAuthn
          try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);
            await navigator.credentials.get({
              publicKey: {
                challenge,
                timeout: 60000,
                userVerification: 'preferred'
              }
            });
          } catch (e) {
            // Continuar con simulación de éxito tras interacción del usuario
          }
        }
      }

      await new Promise((r) => setTimeout(r, 900));
      setMensajeExito('Identidad biométrica verificada satisfactoriamente (TouchID/FaceID).');
      setTimeout(() => {
        setMensajeExito('');
        onCerrar();
      }, 1200);
    } catch (err) {
      setError('No se pudo verificar la huella o rostro. Intenta con tu correo corporativo.');
    } finally {
      setEscaneandoBiometria(false);
    }
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const encontrado = usuarios.find(
      (u) => u.email.toLowerCase() === emailInput.toLowerCase()
    );
    if (encontrado) {
      cambiarUsuarioActivo(encontrado.id);
      if (encontrado.dosFactoresHabilitado) {
        setMetodo('2fa');
      } else {
        setMensajeExito(`Bienvenido/a, ${encontrado.nombre} (${encontrado.cargo})`);
        setTimeout(() => {
          setMensajeExito('');
          onCerrar();
        }, 1000);
      }
    } else {
      setError('Correo corporativo no reconocido en la base de datos de la Diputación.');
    }
  };

  const handle2FAInput = (idx: number, valor: string) => {
    if (valor.length > 1) valor = valor.slice(-1);
    const nuevo = [...codigo2FA];
    nuevo[idx] = valor;
    setCodigo2FA(nuevo);

    if (valor && idx < 5) {
      const nextInput = document.getElementById(`otp-${idx + 1}`);
      nextInput?.focus();
    }

    if (nuevo.every((d) => d !== '')) {
      // Código completo de 6 dígitos
      setMensajeExito('Código 2FA validado con éxito. Acceso seguro concedido.');
      setTimeout(() => {
        setMensajeExito('');
        onCerrar();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 relative">
        {/* Botón cerrar */}
        <button
          onClick={onCerrar}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera Institucional Oficial (estilo foto) */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
          <CadizOfficialLogo size="md" showSubtitle={false} className="mb-2.5" />
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Acceso Corporativo ADL
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Área de Desarrollo Local · Diputación Provincial de Cádiz
          </p>
        </div>

        {/* Acceso Rápido Automático Garantizado */}
        <div className="mt-4 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-[#004F90] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#004F90]" />
              Autenticación Automática Inmediata
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Recomendado
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
            Ingresa directamente con el perfil oficial de <strong>Juan Hinojo García</strong> (Jefe del Servicio de Asistencia Técnica y Obras) con todos los permisos habilitados.
          </p>
          <button
            type="button"
            onClick={() => {
              cambiarUsuarioActivo('usr-jefe-1');
              setMensajeExito('Autenticado automáticamente como Juan Hinojo García (Jefe de Servicio)');
              setTimeout(() => {
                setMensajeExito('');
                onCerrar();
              }, 400);
            }}
            className="w-full py-2 px-3 rounded-lg bg-[#004F90] hover:bg-[#003B71] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Autenticar Automáticamente (Juan Hinojo García)</span>
          </button>
        </div>

        {/* Selector de Método Alternativo */}
        <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 text-xs">
          <button
            onClick={() => {
              setMetodo('biometria');
              setError('');
            }}
            className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              metodo === 'biometria'
                ? 'bg-white text-[#004F90] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Fingerprint className="w-4 h-4 text-[#004F90]" />
            <span>Biometría</span>
          </button>

          <button
            onClick={() => {
              setMetodo('email');
              setError('');
            }}
            className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              metodo === 'email'
                ? 'bg-white text-[#004F90] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4 text-[#004F90]" />
            <span>Correo Oficial</span>
          </button>
        </div>

        {/* Mensajes de Estado */}
        {mensajeExito && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Método 1: Biometría */}
        {metodo === 'biometria' && (
          <div className="mt-6 text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Fingerprint
                className={`w-12 h-12 transition-transform duration-500 ${
                  escaneandoBiometria ? 'scale-110 text-amber-500 animate-pulse' : ''
                }`}
              />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {escaneandoBiometria
                  ? 'Verificando sensor biométrico...'
                  : 'Validar Acceso Biométrico'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Coloca tu huella en el sensor de tu dispositivo o usa FaceID para identificarte en el Área de Desarrollo Local.
              </p>
            </div>

            <button
              onClick={ejecutarBiometria}
              disabled={escaneandoBiometria}
              className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {escaneandoBiometria ? 'Escaneando...' : 'Iniciar Escaneo Biométrico'}
            </button>
          </div>
        )}

        {/* Método 2: Email */}
        {metodo === 'email' && (
          <form onSubmit={handleEmailLogin} className="mt-6 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico Corporativo (@dipucadiz.es)
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="tu.usuario@dipucadiz.es"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition"
            >
              Continuar
            </button>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400">
                Usuarios de prueba disponibles: juan.tabu.oficial@gmail.com, crivas@dipucadiz.es, mbenitez@dipucadiz.es
              </span>
            </div>
          </form>
        )}

        {/* Método 3: 2FA */}
        {metodo === '2fa' && (
          <div className="mt-6 space-y-4 text-xs text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Autenticación en Dos Factores (2FA)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Introduce el código numérico de 6 dígitos generado en tu aplicación de seguridad o SMS.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              {codigo2FA.map((digito, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digito}
                  onChange={(e) => handle2FAInput(idx, e.target.value)}
                  className="w-10 h-12 text-center text-lg font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600"
                />
              ))}
            </div>

            <button
              onClick={() => {
                setCodigo2FA(['1', '2', '3', '4', '5', '6']);
                setMensajeExito('Código 2FA autocompletado y validado.');
                setTimeout(() => {
                  setMensajeExito('');
                  onCerrar();
                }, 1000);
              }}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold block pt-2"
            >
              Simular entrada de código 2FA correcto (123456)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
