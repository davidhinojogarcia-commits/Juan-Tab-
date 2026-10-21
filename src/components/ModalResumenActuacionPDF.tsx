import React, { useState } from 'react';
import {
  X,
  FileText,
  FileDown,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  Euro,
  Layers,
  FileCheck2,
  KeyRound,
  Download,
  Printer,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Actuacion, User, CertificadoDispositivo } from '../types';
import { formatearMoneda, formatearFecha, generarDocumentoResumenActuacionPDF, OpcionesResumenPDF } from '../utils/pdfExport';
import { obtenerCertificadoDispositivoActual } from '../services/deviceSignatureService';

interface ModalResumenActuacionPDFProps {
  actuacion: Actuacion;
  usuarioActual: User | null;
  onCerrar: () => void;
  onNotificarExito: (mensaje: string) => void;
  onAbrirGestionCertificado?: () => void;
}

export const ModalResumenActuacionPDF: React.FC<ModalResumenActuacionPDFProps> = ({
  actuacion,
  usuarioActual,
  onCerrar,
  onNotificarExito,
  onAbrirGestionCertificado
}) => {
  const [generando, setGenerando] = useState<boolean>(false);
  const [incluirFichaCompleta, setIncluirFichaCompleta] = useState<boolean>(true);
  const [incluirDocumentosBase14, setIncluirDocumentosBase14] = useState<boolean>(true);
  const [incluirLiquidacion, setIncluirLiquidacion] = useState<boolean>(true);
  const [incluirFirmaDispositivo, setIncluirFirmaDispositivo] = useState<boolean>(true);
  const [observacionesAdicionales, setObservacionesAdicionales] = useState<string>('');

  const certDispositivo: CertificadoDispositivo = obtenerCertificadoDispositivoActual(usuarioActual);

  // Estadísticas de los datos cargados
  const totalDocumentos = actuacion.documentos.length;
  const docsConformes = actuacion.documentos.filter((d) => d.revisadoCompleto && !d.tieneDeficiencias).length;
  const docsConDeficiencias = actuacion.documentos.filter((d) => d.revisadoCompleto && d.tieneDeficiencias).length;
  const docsPendientes = totalDocumentos - (docsConformes + docsConDeficiencias);

  const liq = actuacion.liquidacion;
  const totalJustificado =
    liq.justificadoEnPlazo +
    liq.justificadoEnPlazoConDeficiencias +
    liq.justificadoFueraDePlazo +
    liq.justificadoFueraDePlazoConDeficiencias;
  const porcJustificado = liq.adjudicacion > 0 ? (totalJustificado / liq.adjudicacion) * 100 : 0;

  const handleGenerarPDF = async () => {
    try {
      setGenerando(true);
      // Breve pausa para permitir renderizado del spinner
      await new Promise((resolve) => setTimeout(resolve, 300));

      const opciones: OpcionesResumenPDF = {
        incluirFichaCompleta,
        incluirDocumentosBase14,
        incluirLiquidacion,
        incluirFirmaDispositivo,
        observacionesAdicionales: observacionesAdicionales.trim() || undefined
      };

      generarDocumentoResumenActuacionPDF(actuacion, usuarioActual, opciones);

      onNotificarExito(
        `✓ Documento PDF Resumen de la Actuación (${actuacion.numero} - ${actuacion.entidadLocal}) generado y descargado con formato institucional de la Diputación de Cádiz y firma electrónica del dispositivo.`
      );
      onCerrar();
    } catch (error) {
      console.error('Error al generar el documento PDF resumen:', error);
      alert('Se produjo un error al generar el documento PDF resumen. Por favor revise la consola.');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Cabecera Institucional Diputación */}
        <div className="bg-[#003366] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b-4 border-[#C59B27] relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FCE082]">
              <FileText className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#FCE082] bg-white/10 px-2 py-0.5 rounded-full">
                  Formato Institucional Diputación
                </span>
                <span className="text-[10px] text-slate-300">Base 14 · Planifica v1.0</span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                Generar Documento PDF Resumen de la Actuación
              </h3>
            </div>
          </div>

          <button
            onClick={onCerrar}
            disabled={generando}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-140px)] text-slate-800 text-xs sm:text-sm">
          {/* Tarjeta de la Actuación Cargada */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#004F90]">
                  Expediente Provincial Nº {actuacion.numero}
                </span>
                <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                  {actuacion.titulo}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    {actuacion.entidadLocal}
                  </span>
                  <span>•</span>
                  <span>Plan: <strong>{actuacion.plan}</strong></span>
                  <span>•</span>
                  <span>Partida: <code className="bg-slate-200/70 px-1 rounded text-[11px] font-mono">{actuacion.aplicacionPresupuestaria || '2026-03-920-46200'}</code></span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-[#004F90] whitespace-nowrap">
                {actuacion.estadoGeneral.replace('_', ' ')}
              </span>
            </div>

            {/* Cuadrícula de KPIs Rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Concesión</span>
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  {formatearMoneda(actuacion.importes.importeConcesion || actuacion.importes.importeActuacion)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Adjudicación</span>
                <span className="text-xs sm:text-sm font-black text-[#004F90]">
                  {formatearMoneda(actuacion.importes.importeAdjudicacion)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Justificado Base 14</span>
                <span className="text-xs sm:text-sm font-black text-emerald-700">
                  {porcJustificado.toFixed(1)}%
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Docs. Conformes</span>
                <span className="text-xs sm:text-sm font-black text-slate-800">
                  {docsConformes} / {totalDocumentos}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Firma Electrónica con Certificado del Dispositivo */}
          <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Certificado Electrónico del Dispositivo (Firma Oficial)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Instalado y Válido
              </span>
            </div>

            <p className="text-xs text-emerald-800/90 leading-relaxed">
              El documento se emitirá suscrito electrónicamente con el certificado digital instalado en este equipo,
              incorporando huella criptográfica SHA-256, sello de tiempo oficial de la Sede Electrónica y Código Seguro de Verificación (CSV).
            </p>

            <div className="bg-white p-3 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{certDispositivo.titular}</span>
                  <span className="text-[11px] text-slate-500 font-mono">({certDispositivo.nif})</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Emisor: <strong className="text-slate-700">{certDispositivo.emisor.split('·')[0].trim()}</strong> · Serie: <code className="font-mono text-[10px]">{certDispositivo.numeroSerie}</code>
                </div>
              </div>

              {onAbrirGestionCertificado && (
                <button
                  type="button"
                  onClick={onAbrirGestionCertificado}
                  className="text-xs text-[#004F90] hover:underline font-bold self-start sm:self-center"
                >
                  Gestionar Certificado
                </button>
              )}
            </div>
          </div>

          {/* Opciones de Contenido a Incluir en el PDF Resumen */}
          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#004F90]" />
              <span>Contenidos Institucionales a Incluir en el Documento</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={incluirFichaCompleta}
                  onChange={(e) => setIncluirFichaCompleta(e.target.checked)}
                  className="mt-0.5 rounded text-[#004F90] focus:ring-[#004F90]"
                />
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Ficha Identificativa y Plazos</span>
                  <span className="text-[11px] text-slate-500">
                    Datos del municipio, plan, partida, importes y cronograma de ejecución y justificación.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={incluirDocumentosBase14}
                  onChange={(e) => setIncluirDocumentosBase14(e.target.checked)}
                  className="mt-0.5 rounded text-[#004F90] focus:ring-[#004F90]"
                />
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Desglose Documental Base 14</span>
                  <span className="text-[11px] text-slate-500">
                    Listado cronológico de documentos revisados, metadatos, estado conforme y observaciones.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={incluirLiquidacion}
                  onChange={(e) => setIncluirLiquidacion(e.target.checked)}
                  className="mt-0.5 rounded text-[#004F90] focus:ring-[#004F90]"
                />
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Cuadro de Liquidación Económica</span>
                  <span className="text-[11px] text-slate-500">
                    Importes justificados en plazo, con deficiencias, no justificados y % final de liquidación.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={incluirFirmaDispositivo}
                  onChange={(e) => setIncluirFirmaDispositivo(e.target.checked)}
                  className="mt-0.5 rounded text-[#004F90] focus:ring-[#004F90]"
                />
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Diligencia de Firma y CSV Oficial</span>
                  <span className="text-[11px] text-slate-500">
                    Sello de firma electrónica del técnico actuante, CSV oficial y Vº Bº del Jefe de Servicio.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Observaciones técnicas opcionales */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones o Diligencia Adicional para el Resumen (Opcional):
            </label>
            <textarea
              rows={2}
              value={observacionesAdicionales}
              onChange={(e) => setObservacionesAdicionales(e.target.value)}
              placeholder="Ej: Revisión efectuada conforme al Decreto de Presidencia de aprobación del Plan y justificación aportada por la Entidad Local..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004F90] resize-none"
            />
          </div>

          {/* Información del Formato Institucional */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900">
            <Sparkles className="w-4 h-4 text-[#004F90] shrink-0" />
            <span>
              El documento se genera conforme al estándar gráfico de la <strong>Excma. Diputación Provincial de Cádiz</strong>:
              Cabecera institucional azul marino y oro, tipografía oficial, tablas autoajustables y numeración de páginas.
            </span>
          </div>
        </div>

        {/* Pie con Botones de Acción */}
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={generando}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleGenerarPDF}
            disabled={generando}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#003366] to-[#004F90] hover:from-[#002244] hover:to-[#003B71] text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition active:scale-[0.98] disabled:opacity-60"
          >
            {generando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generando Documento Oficial...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#FCE082]" />
                <span>Generar y Descargar PDF Resumen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
