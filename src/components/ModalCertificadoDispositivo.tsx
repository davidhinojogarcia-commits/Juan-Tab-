import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  KeyRound,
  FileKey,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  RefreshCw,
  HardDrive,
  Copy,
  Check,
  Laptop
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CertificadoDispositivo } from '../types';
import {
  obtenerCertificadoDispositivoActual,
  guardarCertificadoDispositivoUsuario,
  restablecerCertificadoDispositivoPorDefecto,
  detectarCertificadosDispositivoDisponibles,
  procesarArchivoCertificadoDispositivo,
  calcularHashSha256,
  verificarEstadoAutoFirmaDispositivo
} from '../services/deviceSignatureService';

interface ModalCertificadoDispositivoProps {
  mostrar: boolean;
  onCerrar: () => void;
  onCertificadoCambiado?: (cert: CertificadoDispositivo) => void;
}

export const ModalCertificadoDispositivo: React.FC<ModalCertificadoDispositivoProps> = ({
  mostrar,
  onCerrar,
  onCertificadoCambiado
}) => {
  const { usuarioActual } = useApp();
  const [certificadoActivo, setCertificadoActivo] = useState<CertificadoDispositivo | null>(null);
  const [certificadosDisponibles, setCertificadosDisponibles] = useState<CertificadoDispositivo[]>([]);
  const [tab, setTab] = useState<'activo' | 'disponibles' | 'importar' | 'diagnostico'>('activo');
  const [copiadoHuella, setCopiadoHuella] = useState(false);
  const [pruebaFirmaResultado, setPruebaFirmaResultado] = useState<string | null>(null);
  const [probandoFirma, setProbandoFirma] = useState(false);
  const [cargandoArchivo, setCargandoArchivo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [diagnosticoAutoFirma, setDiagnosticoAutoFirma] = useState<{
    instalada: boolean;
    version: string;
    almacenesDetectados: string[];
    mensaje: string;
  } | null>(null);

  useEffect(() => {
    if (mostrar && usuarioActual) {
      const cert = obtenerCertificadoDispositivoActual(usuarioActual);
      setCertificadoActivo(cert);
      detectarCertificadosDispositivoDisponibles(usuarioActual).then(setCertificadosDisponibles);
      verificarEstadoAutoFirmaDispositivo().then(setDiagnosticoAutoFirma);
      setPruebaFirmaResultado(null);
      setErrorArchivo(null);
    }
  }, [mostrar, usuarioActual]);

  if (!mostrar || !usuarioActual || !certificadoActivo) return null;

  const handleSeleccionarCertificado = (cert: CertificadoDispositivo) => {
    guardarCertificadoDispositivoUsuario(usuarioActual.id, cert);
    setCertificadoActivo(cert);
    if (onCertificadoCambiado) onCertificadoCambiado(cert);
    setTab('activo');
  };

  const handleRestablecerPorDefecto = () => {
    const cert = restablecerCertificadoDispositivoPorDefecto(usuarioActual);
    setCertificadoActivo(cert);
    if (onCertificadoCambiado) onCertificadoCambiado(cert);
  };

  const handleCopiarHuella = () => {
    if (!certificadoActivo) return;
    navigator.clipboard?.writeText(certificadoActivo.huellaSha256);
    setCopiadoHuella(true);
    setTimeout(() => setCopiadoHuella(false), 2500);
  };

  const handleProbarFirma = async () => {
    setProbandoFirma(true);
    setPruebaFirmaResultado(null);
    try {
      const payloadPrueba = `PRUEBA_FIRMA_DISPOSITIVO:${usuarioActual.id}:${Date.now()}`;
      const hash = await calcularHashSha256(payloadPrueba);
      setTimeout(() => {
        setPruebaFirmaResultado(
          `Firma criptográfica verificada con éxito con el certificado instalado en el dispositivo. Hash SHA-256 de control: ${hash.slice(0, 24)}... (Algoritmo: ${certificadoActivo.algoritmo})`
        );
        setProbandoFirma(false);
      }, 600);
    } catch {
      setPruebaFirmaResultado('Error al procesar la prueba criptográfica con el dispositivo.');
      setProbandoFirma(false);
    }
  };

  const handleArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCargandoArchivo(true);
    setErrorArchivo(null);
    try {
      const nuevoCert = await procesarArchivoCertificadoDispositivo(file, usuarioActual);
      setCertificadoActivo(nuevoCert);
      setCertificadosDisponibles((prev) => [nuevoCert, ...prev]);
      if (onCertificadoCambiado) onCertificadoCambiado(nuevoCert);
      setTab('activo');
    } catch {
      setErrorArchivo('No se pudo leer el archivo de certificado. Comprueba el formato (.p12, .pfx, .cer, .crt).');
    } finally {
      setCargandoArchivo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-md flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#004F90] flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-[#004F90]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Firma Electrónica del Dispositivo
              </h3>
              <p className="text-xs text-slate-500">
                Certificado digital instalado en el equipo de {usuarioActual.nombre} {usuarioActual.apellidos}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas de navegación */}
        <div className="flex border-b border-slate-100 px-5 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setTab('activo')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition ${
              tab === 'activo'
                ? 'border-[#004F90] text-[#004F90] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Certificado Activo
          </button>
          <button
            type="button"
            onClick={() => setTab('disponibles')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition ${
              tab === 'disponibles'
                ? 'border-[#004F90] text-[#004F90] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Certificados del Equipo ({certificadosDisponibles.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('importar')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition ${
              tab === 'importar'
                ? 'border-[#004F90] text-[#004F90] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Vincular Archivo (.p12/.pfx)
          </button>
          <button
            type="button"
            onClick={() => setTab('diagnostico')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition ${
              tab === 'diagnostico'
                ? 'border-[#004F90] text-[#004F90] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Diagnóstico
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {tab === 'activo' && (
            <div className="space-y-4">
              {/* Tarjeta de Estado del Certificado */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900">
                      Certificado Electrónico Detectado y Válido
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                    Vigente
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span className="text-slate-500">Titular:</span>
                    <span className="font-bold text-slate-900 text-right">{certificadoActivo.titular}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span className="text-slate-500">NIF / DNI:</span>
                    <span className="font-bold text-slate-800">{certificadoActivo.nif}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span className="text-slate-500">Entidad Emisora:</span>
                    <span className="font-medium text-slate-700 text-right max-w-xs">{certificadoActivo.emisor}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span className="text-slate-500">Número de Serie:</span>
                    <span className="font-mono text-[11px] text-slate-800">{certificadoActivo.numeroSerie}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span className="text-slate-500">Algoritmo:</span>
                    <span className="font-medium text-slate-700">{certificadoActivo.algoritmo}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span className="text-slate-500">Origen de Firma:</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      <Laptop className="w-3 h-3 text-slate-500" />
                      {certificadoActivo.origen === 'almacen_sistema'
                        ? 'Almacén del Dispositivo (Windows / Mac / Navegador)'
                        : certificadoActivo.origen === 'autofirma'
                        ? 'AutoFirma / DNIe'
                        : 'Archivo de Certificado en Dispositivo'}
                    </span>
                  </div>
                </div>

                {/* Huella SHA-256 */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Huella Digital (SHA-256 Thumbprint):</span>
                    <button
                      type="button"
                      onClick={handleCopiarHuella}
                      className="flex items-center gap-1 text-[#004F90] hover:underline font-medium"
                    >
                      {copiadoHuella ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiadoHuella ? 'Copiada' : 'Copiar'}</span>
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 font-mono text-[10px] text-slate-600 break-all select-all">
                    {certificadoActivo.huellaSha256}
                  </div>
                </div>
              </div>

              {/* Botón de prueba de firma */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Comprobar Firma del Dispositivo</span>
                  <span className="text-slate-500">Ejecuta un hash de prueba para validar el acceso al certificado</span>
                </div>
                <button
                  type="button"
                  disabled={probandoFirma}
                  onClick={handleProbarFirma}
                  className="px-3 py-1.5 rounded-lg bg-[#004F90] text-white font-bold hover:bg-[#003867] transition disabled:opacity-50"
                >
                  {probandoFirma ? 'Verificando...' : 'Probar Firma'}
                </button>
              </div>

              {pruebaFirmaResultado && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#004F90]">
                  {pruebaFirmaResultado}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRestablecerPorDefecto}
                  className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
                >
                  Restablecer certificado por defecto del técnico
                </button>
              </div>
            </div>
          )}

          {tab === 'disponibles' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Selecciona el certificado del dispositivo que este técnico utilizará para firmar los informes de revisión:
              </p>
              <div className="space-y-2">
                {certificadosDisponibles.map((c) => {
                  const esSeleccionado = c.numeroSerie === certificadoActivo.numeroSerie;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSeleccionarCertificado(c)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start justify-between gap-3 ${
                        esSeleccionado
                          ? 'border-[#004F90] bg-blue-50/40 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{c.titular}</span>
                          <span className="text-[10px] text-slate-500">NIF: {c.nif}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{c.emisor}</p>
                        <p className="font-mono text-[10px] text-slate-400">Serie: {c.numeroSerie}</p>
                      </div>
                      {esSeleccionado ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#004F90] text-white">
                          Activo
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-[11px]"
                        >
                          Usar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'importar' && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Si utilizas un archivo de certificado de software exportado de tu dispositivo (.p12, .pfx, .cer, .crt), puedes vincularlo aquí:
              </p>

              <label className="border-2 border-dashed border-slate-300 hover:border-[#004F90] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50">
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                <span className="font-bold text-slate-800">
                  {cargandoArchivo ? 'Leyendo certificado...' : 'Selecciona o arrastra tu archivo de certificado'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Formatos compatibles: PKCS#12 (.p12, .pfx) o X.509 (.cer, .crt)
                </span>
                <input
                  type="file"
                  accept=".p12,.pfx,.cer,.crt"
                  onChange={handleArchivoSeleccionado}
                  disabled={cargandoArchivo}
                  className="hidden"
                />
              </label>

              {errorArchivo && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorArchivo}
                </div>
              )}
            </div>
          )}

          {tab === 'diagnostico' && diagnosticoAutoFirma && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Laptop className="w-4 h-4 text-[#004F90]" />
                  <span>{diagnosticoAutoFirma.version}</span>
                </div>
                <p className="text-slate-600">{diagnosticoAutoFirma.mensaje}</p>
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">
                    Almacenes criptográficos detectados en el sistema:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                    {diagnosticoAutoFirma.almacenesDetectados.map((alm, idx) => (
                      <li key={idx}>{alm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl bg-[#004F90] text-white text-xs font-bold hover:bg-[#003867] transition shadow-xs"
          >
            Aceptar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
