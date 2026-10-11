import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileCheck2,
  FileDown,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Shield,
  Save,
  Check,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Calculator,
  Lock,
  Edit3,
  Euro,
  Info,
  MessageSquare,
  Send,
  Mail,
  Users,
  UserCheck,
  Eye,
  Clock,
  Ban,
  ArrowRight,
  ListFilter,
  CheckCheck,
  Layers,
  Sparkles,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  X,
  AlertCircle,
  FileSignature,
  PenTool,
  Award,
  Download,
  FileText,
  ChevronDown,
  ShieldCheck,
  Edit2,
  FolderKanban,
  GitBranch
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RESPUESTAS_TIPO_SUBSANACION, GRUPOS_SUBSANACION } from '../data/initialData';
import {
  formatearMoneda,
  formatearPorcentaje,
  formatearFecha,
  formatearFechaHora,
  generarInformePDF,
  generarInformeSubsanacionPDF,
  generarInformeFavorablePDF
} from '../utils/pdfExport';
import { exportarActuacionCSV } from '../utils/csvExport';
import { DocumentoActuacion, RondaSubsanacion, InformeFavorableDocumento } from '../types';
import { EditarActuacionModal } from './EditarActuacionModal';

interface ActuacionDetailProps {
  onVolver: () => void;
  onVerAuditoria: () => void;
}

export const ActuacionDetail: React.FC<ActuacionDetailProps> = ({
  onVolver,
  onVerAuditoria
}) => {
  const {
    actuacionActiva,
    documentoActivoIndex,
    documentoActivo,
    cambiarDocumentoPestana,
    actualizarEstadoCampo,
    actualizarMetadatosDocumento,
    actualizarLiquidacion,
    actualizarActuacionCabecera,
    marcarDocumentoRevisado,
    marcarDocumentoNoProcede,
    marcarDocumentoNoProcedePorIndex,
    autovalidarTodoConformeDocumento,
    autovalidarTodoConformePorIndex,
    autovalidarTodaActuacion,
    agregarCertificacionAActuacion,
    agregarFacturaAActuacion,
    agregarModificadoProyecto,
    eliminarDocumentoDeActuacion,
    guardarRondaSubsanacion,
    firmarInformeFavorable,
    usuarioActual,
    usuarios,
    comentarios,
    enviarComentarioActuacion,
    estadoSincronizacion
  } = useApp();

  // Estados de vista principal dentro de la actuación:
  // 'ficha' = Ficha inicial con el listado de arriba a abajo de todo lo que hay que revisar (orden cronológico)
  // 'documento' = Al entrar dentro de un documento para revisarlo según el Excel
  const [modoVista, setModoVista] = useState<'ficha' | 'documento'>('ficha');

  // Estados locales para edición de notas y comentarios
  const [editandoObservacionId, setEditandoObservacionId] = useState<string | null>(null);
  const [observacionTextoTemporal, setObservacionTextoTemporal] = useState<string>('');
  const [nuevoComentarioTexto, setNuevoComentarioTexto] = useState<string>('');
  const [comentarioEnviadoAviso, setComentarioEnviadoAviso] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mostrarHistorialParticipantes, setMostrarHistorialParticipantes] = useState<boolean>(false);
  const [mostrarCuadroLiquidacion, setMostrarCuadroLiquidacion] = useState<boolean>(false);
  const [filtroEstadoFicha, setFiltroEstadoFicha] = useState<'todos' | 'pendientes' | 'revisados' | 'no_proceden'>('todos');
  const [copiadoSubsanacion, setCopiadoSubsanacion] = useState<boolean>(false);
  const [copiadoConforme, setCopiadoConforme] = useState<boolean>(false);
  const [copiadoRondaId, setCopiadoRondaId] = useState<string | null>(null);
  const [modalEditarActuacionAbierto, setModalEditarActuacionAbierto] = useState<boolean>(false);

  // Estados para firma electrónica de dictamen favorable
  const [modalFirmaAbierto, setModalFirmaAbierto] = useState<boolean>(false);
  const [firmandoInforme, setFirmandoInforme] = useState<boolean>(false);
  const [declaracionAceptada, setDeclaracionAceptada] = useState<boolean>(true);

  // Copiar al portapapeles con compatibilidad amplia
  const copiarTextoAlPortapapeles = async (texto: string, tipo: 'subsanacion' | 'conforme' | string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      if (tipo === 'subsanacion') {
        setCopiadoSubsanacion(true);
        setTimeout(() => setCopiadoSubsanacion(false), 3000);
      } else if (tipo === 'conforme') {
        setCopiadoConforme(true);
        setTimeout(() => setCopiadoConforme(false), 3000);
      } else {
        setCopiadoRondaId(tipo);
        setTimeout(() => setCopiadoRondaId(null), 3000);
      }
      setMensajeExito('Texto copiado al portapapeles. Listo para enviar a la Entidad Local.');
      setTimeout(() => setMensajeExito(null), 3500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  // Emitir y registrar una nueva ronda de subsanación técnica con su PDF firmado
  const handleEmitirRondaSubsanacion = () => {
    if (!actuacionActiva || !documentoActivo) return;
    const camposNoConformes = documentoActivo.camposRevisar.filter((c) => c.estado === 'no_conforme');
    if (camposNoConformes.length === 0) return;

    const rondasPrevias = documentoActivo.rondasSubsanacion || [];
    const numRonda = rondasPrevias.length + 1;
    const tecNombre =
      usuarioActual ? `${usuarioActual.nombre} ${usuarioActual.apellidos}` : actuacionActiva.tecnicoAsignadoNombre || 'D. Juan Hinojo García';
    const tecCargo = usuarioActual?.cargo || 'Jefe del Servicio de Asistencia Técnica y Obras';

    const nuevaRonda: RondaSubsanacion = {
      id: `ronda-${documentoActivo.id}-${numRonda}-${Date.now()}`,
      numeroRonda: numRonda,
      fechaHora: new Date().toISOString(),
      tecnicoId: usuarioActual?.id || 'usr-tec-1',
      tecnicoNombre: tecNombre,
      tecnicoCargo: tecCargo,
      estado: numRonda === 1 ? 'requiere_subsanacion' : 'parcialmente_subsanado',
      deficiencias: camposNoConformes.map((c) => ({
        campoId: c.id,
        campo: c.campo,
        descripcion: c.descripcion,
        subsanaciones: obtenerSubsanacionesDeCampo(c),
        observacion: c.observacion
      })),
      camposConformes: documentoActivo.camposRevisar.filter((c) => c.estado === 'conforme').map((c) => c.campo),
      csv: `CSV-ADL-SUB-${numRonda}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      firmado: true
    };

    guardarRondaSubsanacion(documentoActivoIndex, nuevaRonda);
    generarInformeSubsanacionPDF(actuacionActiva, documentoActivo, nuevaRonda, usuarioActual);
    setMensajeExito(
      `Se ha guardado el Requerimiento de Subsanación (Ronda ${numRonda}) con trazabilidad oficial y se ha generado su informe PDF firmado.`
    );
    setTimeout(() => setMensajeExito(null), 6000);
  };

  // Descargar informe PDF de una ronda de subsanación específica
  const handleDescargarInformeSubsanacion = (ronda: RondaSubsanacion) => {
    if (!actuacionActiva || !documentoActivo) return;
    generarInformeSubsanacionPDF(actuacionActiva, documentoActivo, ronda, usuarioActual);
  };

  // Confirmar firma digital y emitir informe favorable
  const handleConfirmarFirmaFavorable = () => {
    if (!actuacionActiva || !documentoActivo) return;
    setFirmandoInforme(true);

    setTimeout(() => {
      const tecNombre =
        usuarioActual ? `${usuarioActual.nombre} ${usuarioActual.apellidos}` : actuacionActiva.tecnicoAsignadoNombre || 'D. Juan Hinojo García';
      const tecCargo = usuarioActual?.cargo || 'Jefe del Servicio de Asistencia Técnica y Obras';
      const tecDpto = usuarioActual?.departamento || 'Área de Desarrollo Local · Diputación Provincial de Cádiz';
      const csv = `CSV-ADL-CONF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const informe: InformeFavorableDocumento = {
        emitido: true,
        fechaHoraFirma: new Date().toISOString(),
        firmanteId: usuarioActual?.id || 'usr-tec-1',
        firmanteNombre: tecNombre,
        firmanteCargo: tecCargo,
        firmanteDpto: tecDpto,
        csv,
        dictamen: 'CALIFICACIÓN FAVORABLE CONFORME BASE 14'
      };

      firmarInformeFavorable(documentoActivoIndex, informe);
      generarInformeFavorablePDF(actuacionActiva, documentoActivo, informe, usuarioActual);

      setFirmandoInforme(false);
      setModalFirmaAbierto(false);
      setMensajeExito('Dictamen Técnico Favorable firmado electrónicamente con éxito. PDF oficial descargado.');
      setTimeout(() => setMensajeExito(null), 6000);
    }, 600);
  };

  // Descargar PDF de informe favorable ya emitido
  const handleDescargarInformeFavorable = () => {
    if (!actuacionActiva || !documentoActivo || !documentoActivo.informeFavorable) return;
    generarInformeFavorablePDF(actuacionActiva, documentoActivo, documentoActivo.informeFavorable, usuarioActual);
  };

  // Entrar a revisar un documento con detección automática del técnico
  const handleEntrarARevisarDocumento = (index: number) => {
    if (!actuacionActiva) return;
    const doc = actuacionActiva.documentos[index];
    if (!doc) return;

    const tecNombre =
      usuarioActual ? `${usuarioActual.nombre} ${usuarioActual.apellidos}` : actuacionActiva.tecnicoAsignadoNombre || 'D. Juan Hinojo García';
    const ahora = new Date().toISOString();

    // Actualizar metadatos del técnico en el documento de forma persistente
    const nuevosDocs = actuacionActiva.documentos.map((d, i) => {
      if (i !== index) return d;
      const prevParticipantes = d.tecnicosParticipantes || [];
      const nuevosParticipantes = prevParticipantes.includes(tecNombre)
        ? prevParticipantes
        : [...prevParticipantes, tecNombre];

      return {
        ...d,
        tecnicoUltimoAcceso: tecNombre,
        fechaHoraUltimoAcceso: ahora,
        tecnicoRevisorOriginal: d.tecnicoRevisorOriginal || tecNombre,
        fechaRevisionOriginal: d.fechaRevisionOriginal || ahora,
        tecnicosParticipantes: nuevosParticipantes
      };
    });

    const prevActuacionParticipantes = actuacionActiva.tecnicosParticipantes || [];
    const nuevosActuacionParticipantes = prevActuacionParticipantes.includes(tecNombre)
      ? prevActuacionParticipantes
      : [...prevActuacionParticipantes, tecNombre];

    actualizarActuacionCabecera({
      documentos: nuevosDocs,
      tecnicosParticipantes: nuevosActuacionParticipantes
    });

    cambiarDocumentoPestana(index, true);
    setModoVista('documento');
    setMensajeExito(`Técnico revisor detectado: ${tecNombre}. Iniciando revisión técnica de ${doc.codigo}.`);
    setTimeout(() => setMensajeExito(null), 3500);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cambiar estado desde el menú desplegable a la derecha de cada documento en el listado general
  const handleCambiarEstadoMenuDesplegable = (index: number, nuevoValor: string) => {
    if (!actuacionActiva) return;
    const doc = actuacionActiva.documentos[index];
    if (!doc) return;

    const tecNombre =
      usuarioActual ? `${usuarioActual.nombre} ${usuarioActual.apellidos}` : actuacionActiva.tecnicoAsignadoNombre || 'D. Juan Hinojo García';

    if (nuevoValor === 'no_procede') {
      marcarDocumentoNoProcedePorIndex(index, true);
      setMensajeExito(`El documento ${doc.codigo} se ha marcado como NO PROCEDE.`);
      setTimeout(() => setMensajeExito(null), 3500);
      return;
    }

    if (nuevoValor === 'pendiente_revisar') {
      marcarDocumentoNoProcedePorIndex(index, false);
      const nuevosCampos = doc.camposRevisar.map((c) => ({
        ...c,
        estado: 'sin_revisar' as const,
        observacion: '',
        subsanaciones: []
      }));
      const nuevosDocs = actuacionActiva.documentos.map((d, i) => {
        if (i !== index) return d;
        return {
          ...d,
          noProcede: false,
          revisadoCompleto: false,
          tieneDeficiencias: false,
          camposRevisar: nuevosCampos
        };
      });
      actualizarActuacionCabecera({ documentos: nuevosDocs });
      setMensajeExito(`El documento ${doc.codigo} se ha restablecido como PENDIENTE DE REVISAR.`);
      setTimeout(() => setMensajeExito(null), 3500);
      return;
    }

    if (nuevoValor === 'conforme') {
      autovalidarTodoConformePorIndex(index);
      setMensajeExito(`El documento ${doc.codigo} ha sido calificado como CONFORME (Verde) por ${tecNombre}.`);
      setTimeout(() => setMensajeExito(null), 3500);
      return;
    }

    if (nuevoValor === 'pendiente_subsanacion') {
      handleEntrarARevisarDocumento(index);
      setMensajeExito(`Accediendo a ${doc.codigo} para seleccionar los motivos de subsanación.`);
      setTimeout(() => setMensajeExito(null), 3500);
      return;
    }
  };

  // Finalizar revisión del documento actual con grabación de trazabilidad y conforme general
  const handleFinalizarRevision = () => {
    if (!actuacionActiva || !documentoActivo) return;

    const tecNombre =
      usuarioActual ? `${usuarioActual.nombre} ${usuarioActual.apellidos}` : actuacionActiva.tecnicoAsignadoNombre || 'D. Juan Hinojo García';
    const tecCargo = usuarioActual?.cargo || 'Jefe del Servicio de Asistencia Técnica y Obras';
    const ahora = new Date().toISOString();

    const camposNoConformes = documentoActivo.camposRevisar.filter((c) => c.estado === 'no_conforme');
    const camposConformes = documentoActivo.camposRevisar.filter((c) => c.estado === 'conforme');
    const camposSinRevisar = documentoActivo.camposRevisar.filter((c) => c.estado === 'sin_revisar');

    // CASO A: Hay deficiencias pendientes de subsanación
    if (camposNoConformes.length > 0) {
      const rondasPrevias = documentoActivo.rondasSubsanacion || [];
      const numRonda = rondasPrevias.length + 1;
      const csvRonda = `CSV-ADL-SUB-${numRonda}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const nuevaRonda: RondaSubsanacion = {
        id: `ronda-${documentoActivo.id}-${numRonda}-${Date.now()}`,
        numeroRonda: numRonda,
        fechaHora: ahora,
        tecnicoId: usuarioActual?.id || 'usr-tec-1',
        tecnicoNombre: tecNombre,
        tecnicoCargo: tecCargo,
        estado: numRonda === 1 ? 'requiere_subsanacion' : 'parcialmente_subsanado',
        deficiencias: camposNoConformes.map((c) => ({
          campoId: c.id,
          campo: c.campo,
          descripcion: c.descripcion,
          subsanaciones: obtenerSubsanacionesDeCampo(c),
          observacion: c.observacion
        })),
        camposConformes: camposConformes.map((c) => c.campo),
        csv: csvRonda,
        firmado: true
      };

      guardarRondaSubsanacion(documentoActivoIndex, nuevaRonda);
      generarInformeSubsanacionPDF(actuacionActiva, documentoActivo, nuevaRonda, usuarioActual);

      setMensajeExito(
        `✓ Revisión finalizada: Se ha grabado la Ronda ${numRonda} con ${camposNoConformes.length} subsanación(es) pendientes por el técnico ${tecNombre}. Trazabilidad grabada y PDF oficial generado.`
      );
      setTimeout(() => setMensajeExito(null), 7000);
      return;
    }

    // CASO B: Todo comprobado y conforme (0 deficiencias)
    if (camposNoConformes.length === 0 && camposSinRevisar.length === 0 && camposConformes.length > 0) {
      // Abrir modal de firma electrónica oficial
      setModalFirmaAbierto(true);
      return;
    }

    // CASO C: Quedan campos sin calificar
    if (camposSinRevisar.length > 0) {
      if (
        window.confirm(
          `Quedan ${camposSinRevisar.length} comprobaciones pendientes. ¿Deseas calificar los campos restantes como CONFORME y finalizar la revisión con Conforme General?`
        )
      ) {
        autovalidarTodoConformeDocumento();
        setModalFirmaAbierto(true);
      }
    }
  };

  // Contar certificaciones ordinarias existentes para saber el número siguiente automático
  const certsOrdinarias = actuacionActiva?.documentos.filter(
    (d) => d.codigo.startsWith('CERT-') && d.codigo !== 'CERT-FIN'
  ) || [];
  let maxNumCert = 0;
  certsOrdinarias.forEach((d) => {
    const match = d.codigo.match(/CERT-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNumCert) maxNumCert = n;
    }
  });
  const siguienteNumCert = maxNumCert > 0 ? maxNumCert + 1 : certsOrdinarias.length + 1;

  // Contar facturas existentes para saber el número siguiente automático
  const facturasExistentes = actuacionActiva?.documentos.filter((d) => d.codigo.startsWith('FAC-')) || [];
  let maxNumFac = 0;
  facturasExistentes.forEach((d) => {
    const match = d.codigo.match(/FAC-AT(\d+)/) || d.codigo.match(/FAC-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNumFac) maxNumFac = n;
    }
  });
  const siguienteNumFac = maxNumFac > 0 ? maxNumFac + 1 : facturasExistentes.length + 1;

  const handleAgregarCertificacion = (abrirDirectamente = false) => {
    if (!actuacionActiva) return;
    const nuevo = agregarCertificacionAActuacion(actuacionActiva.id);
    if (nuevo) {
      setMensajeExito(`Se ha añadido ${nuevo.titulo} (${nuevo.codigo}) automáticamente en orden cronológico.`);
      setTimeout(() => setMensajeExito(null), 4000);
      if (abrirDirectamente) {
        const newIndex = nuevo.orden - 1;
        cambiarDocumentoPestana(newIndex, true);
        setModoVista('documento');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleAgregarFactura = (abrirDirectamente = false) => {
    if (!actuacionActiva) return;
    const nuevo = agregarFacturaAActuacion(actuacionActiva.id);
    if (nuevo) {
      setMensajeExito(`Se ha añadido ${nuevo.titulo} (${nuevo.codigo}) automáticamente en orden cronológico.`);
      setTimeout(() => setMensajeExito(null), 4000);
      if (abrirDirectamente) {
        const newIndex = nuevo.orden - 1;
        cambiarDocumentoPestana(newIndex, true);
        setModoVista('documento');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleAgregarModificadoProyecto = (despuesDeDocId?: string, abrirDirectamente = false) => {
    if (!actuacionActiva) return;
    const nuevo = agregarModificadoProyecto(actuacionActiva.id, despuesDeDocId);
    if (nuevo) {
      setMensajeExito(`Se ha añadido ${nuevo.titulo} (${nuevo.codigo}) al expediente de obras.`);
      setTimeout(() => setMensajeExito(null), 4000);
      if (abrirDirectamente) {
        const newIndex = nuevo.orden - 1;
        cambiarDocumentoPestana(newIndex, true);
        setModoVista('documento');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  if (!actuacionActiva || !documentoActivo) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <p className="text-slate-500">No se ha seleccionado ninguna actuación.</p>
        <button
          onClick={onVolver}
          className="mt-4 px-4 py-2 bg-[#004F90] text-white rounded-xl text-xs font-semibold"
        >
          Volver a Planes
        </button>
      </div>
    );
  }

  const totalDocumentos = actuacionActiva.documentos.length;

  // Clasificación de estados para cada documento del expediente:
  const getEstadoDoc = (doc: DocumentoActuacion): 'ya_revisado' | 'en_revision' | 'pendiente' | 'no_procede' => {
    if (doc.noProcede) return 'no_procede';
    if (doc.revisadoCompleto && !doc.tieneDeficiencias) return 'ya_revisado';
    if (doc.tieneDeficiencias) return 'en_revision';
    const camposRevisados = doc.camposRevisar.filter((c) => c.estado !== 'sin_revisar').length;
    if (camposRevisados > 0) return 'en_revision';
    return 'pendiente';
  };

  // Estado específico para el menú desplegable a la derecha de cada documento en el listado general:
  // "a la derecha de cada documento a revisar, en el listado general, aparecerá en primer logar REVISAR,
  // a la derecha un menú desplegable que diga NO PROCEDE, PENDIENTE DE REVISAR.
  // Una vez revisado aparecerá automático en este menú PENDIENTE DE SUBSANACIÓN o CONFORME, con sus colores respectivos verde, ."
  const getEstadoMenuDoc = (doc: DocumentoActuacion): 'no_procede' | 'pendiente_revisar' | 'pendiente_subsanacion' | 'conforme' => {
    if (doc.noProcede) return 'no_procede';
    const noConformes = doc.camposRevisar.filter((c) => c.estado === 'no_conforme');
    const sinRevisar = doc.camposRevisar.filter((c) => c.estado === 'sin_revisar');
    const conformes = doc.camposRevisar.filter((c) => c.estado === 'conforme');

    // Si tiene subsanaciones pendientes o deficiencias detectadas
    if (noConformes.length > 0 || doc.tieneDeficiencias) {
      return 'pendiente_subsanacion';
    }

    // Si está completamente revisado y todo conforme (o revisadoCompleto sin deficiencias)
    if (
      (doc.revisadoCompleto && !doc.tieneDeficiencias) ||
      (conformes.length > 0 && sinRevisar.length === 0)
    ) {
      return 'conforme';
    }

    return 'pendiente_revisar';
  };

  // Contadores para el resumen de la Ficha
  const docsYaRevisados = actuacionActiva.documentos.filter((d) => getEstadoDoc(d) === 'ya_revisado').length;
  const docsEnRevision = actuacionActiva.documentos.filter((d) => getEstadoDoc(d) === 'en_revision').length;
  const docsPendientes = actuacionActiva.documentos.filter((d) => getEstadoDoc(d) === 'pendiente').length;
  const docsNoProceden = actuacionActiva.documentos.filter((d) => getEstadoDoc(d) === 'no_procede').length;

  const totalAplicables = totalDocumentos - docsNoProceden;
  const porcentajeAvance = totalAplicables > 0 ? Math.round((docsYaRevisados / totalAplicables) * 100) : 100;

  // Helper para comenzar o continuar revisión automática en el primer documento pendiente
  const continuarRevisionAutomatica = () => {
    const primerPendienteIndex = actuacionActiva.documentos.findIndex((d) => {
      const st = getEstadoDoc(d);
      return st === 'pendiente' || st === 'en_revision';
    });

    const destino = primerPendienteIndex !== -1 ? primerPendienteIndex : 0;
    cambiarDocumentoPestana(destino, true);
    setModoVista('documento');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Extraer lista de motivos de subsanación de un campo
  const obtenerSubsanacionesDeCampo = (campo: { observacion?: string; subsanaciones?: string[] }): string[] => {
    if (campo.subsanaciones && campo.subsanaciones.length > 0) {
      return campo.subsanaciones;
    }
    if (!campo.observacion) return [];
    return campo.observacion.split(/;\s*|\s*•\s*/).filter(Boolean);
  };

  // Añadir un nuevo motivo a la lista múltiple de subsanaciones
  const agregarMotivoSubsanacion = (campoId: string, motivo: string) => {
    if (!motivo) return;
    const campo = documentoActivo.camposRevisar.find((c) => c.id === campoId);
    if (!campo) return;
    const previas = obtenerSubsanacionesDeCampo(campo);
    if (!previas.includes(motivo)) {
      const nuevaLista = [...previas, motivo];
      actualizarEstadoCampo(campoId, 'no_conforme', nuevaLista.join('; '), nuevaLista);
    }
  };

  // Quitar un motivo de la lista de subsanaciones
  const quitarMotivoSubsanacion = (campoId: string, indiceAQuitar: number) => {
    const campo = documentoActivo.camposRevisar.find((c) => c.id === campoId);
    if (!campo) return;
    const previas = obtenerSubsanacionesDeCampo(campo);
    const nuevaLista = previas.filter((_, i) => i !== indiceAQuitar);
    actualizarEstadoCampo(
      campoId,
      'no_conforme',
      nuevaLista.length > 0 ? nuevaLista.join('; ') : '',
      nuevaLista
    );
  };

  // Añadir motivo manual personalizado
  const agregarMotivoSubsanacionManual = (campoId: string, textoNuevo: string) => {
    if (!textoNuevo.trim()) return;
    const campo = documentoActivo.camposRevisar.find((c) => c.id === campoId);
    if (!campo) return;
    const previas = obtenerSubsanacionesDeCampo(campo);
    if (!previas.includes(textoNuevo.trim())) {
      const nuevaLista = [...previas, textoNuevo.trim()];
      actualizarEstadoCampo(campoId, 'no_conforme', nuevaLista.join('; '), nuevaLista);
    }
    setEditandoObservacionId(null);
    setObservacionTextoTemporal('');
  };

  // Guardar edición manual de observación en el checklist (compatibilidad)
  const guardarObservacionManual = (campoId: string) => {
    agregarMotivoSubsanacionManual(campoId, observacionTextoTemporal);
  };

  // Métricas del documento actualmente abierto
  const camposConformes = documentoActivo.camposRevisar.filter((c) => c.estado === 'conforme').length;
  const camposNoConformes = documentoActivo.camposRevisar.filter((c) => c.estado === 'no_conforme').length;
  const camposSinRevisar = documentoActivo.camposRevisar.filter((c) => c.estado === 'sin_revisar').length;

  // Certificaciones acumuladas (si aplica)
  const esCertificacion = documentoActivo.codigo.startsWith('CERT');
  const todasCerts = actuacionActiva.documentos.filter((d) => d.codigo.startsWith('CERT'));
  const certIndex = todasCerts.findIndex((d) => d.id === documentoActivo.id);

  let anteriorAcumulado = 0;
  if (certIndex > 0) {
    for (let i = 0; i < certIndex; i++) {
      anteriorAcumulado += todasCerts[i].metadatos.importeUltima || todasCerts[i].metadatos.importeInicial || 0;
    }
  }
  const impEstaCert = documentoActivo.metadatos.importeUltima || documentoActivo.metadatos.importeInicial || 0;
  const totalCertAcumulada = anteriorAcumulado + impEstaCert;
  const adjAct = actuacionActiva.importes.importeAdjudicacion || 1;
  const porcObraCert = (totalCertAcumulada / adjAct) * 100;

  const esFactura = documentoActivo.codigo.startsWith('FAC');
  const todasFacturas = actuacionActiva.documentos.filter((d) => d.codigo.startsWith('FAC'));
  const totalFacturasAcumuladas = todasFacturas.reduce(
    (sum, d) => sum + (d.metadatos.importeUltima || d.metadatos.importeInicial || 0),
    0
  );

  const comentariosDeEstaActuacion = comentarios.filter((c) => c.actuacionId === actuacionActiva.id);

  // Lista consolidada de técnicos participantes
  const participantesDoc: string[] =
    documentoActivo.tecnicosParticipantes && documentoActivo.tecnicosParticipantes.length > 0
      ? documentoActivo.tecnicosParticipantes
      : documentoActivo.tecnicoRevisorOriginal
      ? [documentoActivo.tecnicoRevisorOriginal]
      : [];

  // Fases cronológicas para agrupar los documentos de forma intuitiva y dinámica
  const getFaseCronologica = (doc: DocumentoActuacion) => {
    if (['ANX-I', 'ANX-II', 'ANX-III', 'ANX-IV'].includes(doc.codigo) || (doc.categoria === 'solicitud' && doc.codigo !== 'PROY-OBRA')) {
      return { faseNum: 1, titulo: '1. FASE DE SOLICITUD DE LA SUBVENCIÓN (ANEXOS I AL IV)' };
    }
    if (doc.codigo === 'PROY-OBRA' || doc.categoria === 'proyecto' || doc.codigo.startsWith('PROY-')) {
      return { faseNum: 2, titulo: '2. FASE DE PROYECTO TÉCNICO Y MEMORIA VALORADA (PESTAÑA PROYECTO)' };
    }
    if (['ANX-IX', 'ANX-IX-AT1', 'ANX-IX-AT2', 'ANX-IX-AT3', 'FOT-PUB', 'FOT-INI', 'ACT-REP'].includes(doc.codigo) || doc.categoria === 'adjudicacion' || doc.categoria === 'replanteo') {
      return { faseNum: 3, titulo: '3. FASE DE ADJUDICACIÓN, INICIO Y REPLANTEO' };
    }
    if ((doc.codigo.startsWith('CERT-') && doc.codigo !== 'CERT-FIN') || doc.codigo.startsWith('FAC-') || doc.codigo.startsWith('MOD-') || doc.categoria === 'modificado') {
      return { faseNum: 4, titulo: '4. FASE DE EJECUCIÓN: CERTIFICACIONES DE OBRA, FACTURAS AT Y MODIFICACIONES DE PROYECTO' };
    }
    return { faseNum: 5, titulo: '5. FASE DE FINALIZACIÓN, RECEPCIÓN Y CUENTA JUSTIFICATIVA' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Mensaje flotante de confirmación o éxito */}
      {mensajeExito && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between font-bold shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-emerald-700 hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {/* 1. BARRA SUPERIOR INSTITUCIONAL DE LA ACTUACIÓN (Estética idéntica a Planes) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <button
              onClick={onVolver}
              className="mt-1 p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs"
              title="Volver a la vista del Plan"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#004F90] font-black text-xs border border-blue-200 shadow-2xs">
                  ACTUACIÓN Nº {actuacionActiva.numero}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {actuacionActiva.id}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#004F90]" />
                  {actuacionActiva.entidadLocal}
                </span>
              </div>

              <h1 className="mt-1.5 text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {actuacionActiva.titulo}
              </h1>

              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                {actuacionActiva.plan}
              </p>
            </div>
          </div>

          {/* Acciones Rápidas del Expediente: Modo Ficha/Documento, PDF, CSV, Auditoría */}
          <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end flex-wrap">
            {/* Conmutador Modo Ficha / Modo Documento */}
            <div className="bg-white p-1 rounded-2xl border border-[#CBD5E1] shadow-2xs flex items-center gap-1">
              <button
                onClick={() => {
                  setModoVista('ficha');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  modoVista === 'ficha'
                    ? 'bg-[#004F90] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Ver Ficha con el listado cronológico de todos los documentos"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ficha de Revisión</span>
              </button>

              <button
                onClick={() => {
                  setModoVista('documento');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  modoVista === 'documento'
                    ? 'bg-[#004F90] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Entrar a revisar el documento actual"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Revisar Documento</span>
              </button>
            </div>

            {/* Botón Editar Actuación Oficial */}
            <button
              onClick={() => setModalEditarActuacionAbierto(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-300 bg-white hover:bg-blue-50/50 hover:border-[#004F90] text-[#004F90] text-xs font-bold transition shadow-xs"
              title="Editar datos principales de la actuación (título, importes, plazos, técnico asignado, etc.)"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#004F90]" />
              <span>Editar Actuación</span>
            </button>

            <button
              onClick={onVerAuditoria}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-[#DFE6ED] bg-white text-[#1C2E3D] text-xs font-bold hover:bg-slate-50 transition shadow-xs"
              title="Ver registro de auditoría de accesos"
            >
              <History className="w-3.5 h-3.5 text-[#36799C]" />
              <span className="hidden sm:inline">Auditoría</span>
            </button>

            <button
              onClick={() => exportarActuacionCSV(actuacionActiva)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-[#CFEFE7] bg-[#EAF6F3] text-emerald-800 text-xs font-bold hover:bg-[#D8F0E8] transition shadow-xs"
              title="Descargar datos de la actuación en CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => generarInformePDF(actuacionActiva, usuarioActual)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#004F90] hover:bg-[#003B71] text-white text-xs font-bold shadow-xs transition"
              title="Exportar informe oficial de gestión en PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Informe PDF</span>
            </button>
          </div>
        </div>

        {/* Datos Básicos de la Actuación: Importes y Plazos */}
        <div className="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Importe Concesión</span>
            <span className="text-sm font-black text-slate-900">
              {formatearMoneda(actuacionActiva.importes.importeConcesion || actuacionActiva.importes.importeActuacion)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 shadow-2xs">
            <span className="text-[10px] text-blue-800 block uppercase font-bold">Partida Presupuestaria</span>
            <span className="text-xs font-mono font-black text-blue-900 block truncate" title={actuacionActiva.aplicacionPresupuestaria || '2026-03-920-46200'}>
              {actuacionActiva.aplicacionPresupuestaria || '2026-03-920-46200'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Importe Adjudicación</span>
            <span className="text-sm font-black text-[#004F90]">
              {formatearMoneda(actuacionActiva.importes.importeAdjudicacion)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Plazo Ejecución</span>
            <span className="text-xs font-bold text-slate-800 block">
              {formatearFecha(actuacionActiva.plazos.plazoEjecucion)}
            </span>
            {actuacionActiva.plazos.plazoEjecucionAmpliado && (
              <span className="text-[10px] text-blue-600 block">Amp: {formatearFecha(actuacionActiva.plazos.plazoEjecucionAmpliado)}</span>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Plazo Justificación</span>
            <span className="text-xs font-bold text-slate-800 block">
              {formatearFecha(actuacionActiva.plazos.plazoJustificacion)}
            </span>
            {actuacionActiva.plazos.plazoJustificacionAmpliado && (
              <span className="text-[10px] text-blue-600 block">Amp: {formatearFecha(actuacionActiva.plazos.plazoJustificacionAmpliado)}</span>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Técnico Asignado</span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {actuacionActiva.tecnicoAsignadoNombre || 'Carmen Rivas Delgado'}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block">Revisor Oficial</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: FICHA CON LISTADO DE ARRIBA A ABAJO DE TODO LO QUE HAY QUE REVISAR */}
      {/* ========================================================================= */}
      {modoVista === 'ficha' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* PANEL DE CONTROL DE LA FICHA: Contadores y Botones de Automatización */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-[#004F90]" />
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Ficha de Revisión Técnica del Expediente
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Listado cronológico de todos los documentos y anexos a comprobar. Cada documento muestra su estado y permite marcar si procede o no.
                </p>
              </div>

              {/* Botones de Acción Automatizada y Añadir Certificaciones / Facturas */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Botón + Añadir Certificación con numeración automática */}
                <button
                  type="button"
                  onClick={() => handleAgregarCertificacion(false)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-300 bg-blue-50/90 hover:bg-blue-100 text-[#004F90] text-xs font-black transition shadow-2xs active:scale-[0.98]"
                  title={`Añadir una nueva certificación (Certificación ${siguienteNumCert})`}
                >
                  <Plus className="w-3.5 h-3.5 text-[#004F90] stroke-[3]" />
                  <span>+ Certificación {siguienteNumCert}</span>
                </button>

                {/* Botón + Añadir Factura con numeración automática */}
                <button
                  type="button"
                  onClick={() => handleAgregarFactura(false)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-300 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-900 text-xs font-black transition shadow-2xs active:scale-[0.98]"
                  title={`Añadir una nueva factura de asistencia técnica (Factura ${siguienteNumFac})`}
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-700 stroke-[3]" />
                  <span>+ Factura {siguienteNumFac}</span>
                </button>

                {/* Botón + Añadir Modificación de Proyecto (Caso especial de incidencias contractuales) */}
                <button
                  type="button"
                  onClick={() => handleAgregarModificadoProyecto(undefined, false)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/90 hover:bg-amber-100 text-amber-900 text-xs font-black transition shadow-2xs active:scale-[0.98]"
                  title="Añadir una modificación de proyecto / contrato (caso especial para alteraciones contractuales durante las obras)"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700 stroke-[3]" />
                  <span>+ Modificación de Proyecto</span>
                </button>

                <button
                  type="button"
                  onClick={continuarRevisionAutomatica}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#004F90] hover:bg-[#003B71] text-white text-xs font-black shadow-xs transition active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {docsPendientes === totalDocumentos ? 'Comenzar Revisión →' : 'Continuar Revisión →'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Deseas validar automáticamente como CONFORME todos los documentos pendientes de esta actuación?')) {
                      autovalidarTodaActuacion();
                      setMensajeExito('Todos los documentos del expediente han sido validados como CONFORMES.');
                      setTimeout(() => setMensajeExito(null), 4000);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition shadow-2xs"
                  title="Calificar automáticamente todo el expediente como conforme"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>Validar Todo Conforme</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarCuadroLiquidacion(!mostrarCuadroLiquidacion)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs"
                >
                  <Calculator className="w-4 h-4 text-amber-600" />
                  <span>{mostrarCuadroLiquidacion ? 'Ocultar Liquidación' : 'Ver Liquidación'}</span>
                </button>
              </div>
            </div>

            {/* Fila de Estadísticas y Porcentaje de Avance */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total a Revisar</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalDocumentos}</span>
                <span className="text-[10px] text-slate-500">Documentos ordenados</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-emerald-800">Ya Revisados</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xl font-black text-emerald-800 mt-0.5 block">{docsYaRevisados}</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Conformes (Aspas verde)</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-800">En Revisión</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xl font-black text-amber-900 mt-0.5 block">{docsEnRevision}</span>
                <span className="text-[10px] text-amber-700">En curso o subsanar</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Pendientes</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                </div>
                <span className="text-xl font-black text-slate-700 mt-0.5 block">{docsPendientes}</span>
                <span className="text-[10px] text-slate-400">Por comprobar</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">No Proceden</span>
                  <Ban className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-xl font-black text-slate-600 mt-0.5 block">{docsNoProceden}</span>
                <span className="text-[10px] text-slate-400">Exentos para este plan</span>
              </div>
            </div>

            {/* Barra de Progreso */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Progreso de Revisión Técnica Oficial:
                </span>
                <span className="font-mono font-black text-[#004F90]">
                  {porcentajeAvance}% completado ({docsYaRevisados} de {totalAplicables} documentos aplicables)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-[#004F90] rounded-full transition-all duration-300"
                  style={{ width: `${porcentajeAvance}%` }}
                />
              </div>
            </div>
          </div>

          {/* CUADRO DE LIQUIDACIÓN ECONÓMICA (Desplegable) */}
          {mostrarCuadroLiquidacion && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Cuadro Oficial de Liquidación Económica · Justificación Base 14
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">Diputación Provincial de Cádiz</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5 border-r border-slate-200">Adjudicación Contratada</th>
                      <th className="p-2.5 border-r border-slate-200 bg-emerald-50 text-emerald-900">En plazo (Conforme)</th>
                      <th className="p-2.5 border-r border-slate-200 bg-amber-50 text-amber-900">En plazo c/ deficiencias</th>
                      <th className="p-2.5 border-r border-slate-200">Fuera de plazo</th>
                      <th className="p-2.5 bg-red-50 text-red-900">No Justificado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="divide-x divide-slate-100">
                      <td className="p-2.5 font-bold font-mono">
                        {formatearMoneda(actuacionActiva.liquidacion.adjudicacion)}
                      </td>
                      <td className="p-2.5 font-bold font-mono text-emerald-700">
                        {formatearMoneda(actuacionActiva.liquidacion.justificadoEnPlazo)}
                      </td>
                      <td className="p-2.5 font-bold font-mono text-amber-700">
                        {formatearMoneda(actuacionActiva.liquidacion.justificadoEnPlazoConDeficiencias)}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">
                        {formatearMoneda(actuacionActiva.liquidacion.justificadoFueraDePlazo)}
                      </td>
                      <td className="p-2.5 font-bold font-mono text-red-700">
                        {formatearMoneda(actuacionActiva.liquidacion.noJustificado)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LISTADO DE ARRIBA A ABAJO DE TODO LO QUE HAY QUE REVISAR (ORDEN CRONOLÓGICO) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Índice Cronológico Obligatorio
                </span>
                <span className="text-sm font-black text-slate-800">
                  Listado cronológico de documentos a revisar ({totalDocumentos} documentos)
                </span>
              </div>

              {/* Filtro rápido de la ficha */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setFiltroEstadoFicha('todos')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    filtroEstadoFicha === 'todos' ? 'bg-[#004F90] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Todos ({totalDocumentos})
                </button>
                <button
                  onClick={() => setFiltroEstadoFicha('pendientes')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    filtroEstadoFicha === 'pendientes' ? 'bg-[#004F90] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Pendientes ({docsPendientes + docsEnRevision})
                </button>
                <button
                  onClick={() => setFiltroEstadoFicha('revisados')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    filtroEstadoFicha === 'revisados' ? 'bg-[#004F90] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Revisados ({docsYaRevisados})
                </button>
                <button
                  onClick={() => setFiltroEstadoFicha('no_proceden')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    filtroEstadoFicha === 'no_proceden' ? 'bg-[#004F90] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  No Proceden ({docsNoProceden})
                </button>
              </div>
            </div>

            {/* Filas de la Ficha en orden cronológico */}
            <div className="divide-y divide-slate-100">
              {actuacionActiva.documentos.map((doc, index) => {
                const estadoDoc = getEstadoDoc(doc);
                const estadoMenuDoc = getEstadoMenuDoc(doc);
                const fase = getFaseCronologica(doc);
                const prevDoc = index > 0 ? actuacionActiva.documentos[index - 1] : null;
                const esPrimerDocDeFase = index === 0 || (prevDoc && getFaseCronologica(prevDoc).faseNum !== fase.faseNum);

                // Detección de última certificación ordinaria para mostrar fila + Certificación
                const esCertOrdinaria = doc.codigo.startsWith('CERT-') && doc.codigo !== 'CERT-FIN';
                const nextDoc = actuacionActiva.documentos[index + 1];
                const esUltimaCertOrdinaria =
                  esCertOrdinaria && (!nextDoc || !nextDoc.codigo.startsWith('CERT-') || nextDoc.codigo === 'CERT-FIN');

                // Detección de última factura para mostrar fila + Factura
                const esFacturaDoc = doc.codigo.startsWith('FAC-');
                const esUltimaFactura = esFacturaDoc && (!nextDoc || !nextDoc.codigo.startsWith('FAC-'));

                // Filtrar según filtro seleccionado
                if (filtroEstadoFicha === 'pendientes' && (estadoDoc === 'ya_revisado' || estadoDoc === 'no_procede')) return null;
                if (filtroEstadoFicha === 'revisados' && estadoDoc !== 'ya_revisado') return null;
                if (filtroEstadoFicha === 'no_proceden' && estadoDoc !== 'no_procede') return null;

                const conformesCount = doc.camposRevisar.filter((c) => c.estado === 'conforme').length;
                const totalCamposDoc = doc.camposRevisar.length;

                return (
                  <React.Fragment key={doc.id}>
                    {/* Encabezado de Fase Cronológica si corresponde */}
                    {esPrimerDocDeFase && (
                      <div className="bg-slate-100/80 px-4 sm:px-6 py-2 border-y border-slate-200 text-[11px] font-black text-slate-700 tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#004F90]" />
                        <span>{fase.titulo}</span>
                      </div>
                    )}

                    <div
                      className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                        doc.noProcede
                          ? 'bg-slate-50/50 opacity-75'
                          : estadoDoc === 'ya_revisado'
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                          : estadoDoc === 'en_revision'
                          ? 'bg-amber-50/20 hover:bg-amber-50/30'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Lado Izquierdo: Número, Código, Título y Descripción */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Círculo con número cronológico */}
                        <div
                          className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-black shadow-2xs ${
                            doc.noProcede
                              ? 'bg-slate-200 text-slate-500'
                              : estadoDoc === 'ya_revisado'
                              ? 'bg-emerald-600 text-white'
                              : estadoDoc === 'en_revision'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {doc.orden}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200">
                              {doc.codigo}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              {doc.titulo}
                            </span>
                            {/* Distintivos específicos */}
                            {(doc.codigo === 'PROY-OBRA' || doc.categoria === 'proyecto') && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-[#004F90] border border-blue-200">
                                📁 Pestaña Proyecto
                              </span>
                            )}
                            {(doc.codigo.startsWith('MOD-') || doc.categoria === 'modificado') && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                ⚡ Modificación de Proyecto
                              </span>
                            )}
                            {esCertOrdinaria && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100/70 text-[#004F90]">
                                Certificación de obra
                              </span>
                            )}
                            {esFacturaDoc && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100/70 text-indigo-900">
                                Factura AT
                              </span>
                            )}
                          </div>

                          {doc.subtitulo && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {doc.subtitulo}
                            </p>
                          )}

                          {/* Conteo de verificaciones */}
                          {!doc.noProcede && (
                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                              <span>
                                {conformesCount} de {totalCamposDoc} comprobaciones conformes
                              </span>
                              {doc.metadatos.estadoJustificacion && doc.metadatos.estadoJustificacion !== 'Pendiente de calificar' && (
                                <>
                                  <span>·</span>
                                  <span className="font-semibold text-slate-600">
                                    Calificación: {doc.metadatos.estadoJustificacion}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lado Derecho: En primer lugar REVISAR, a la derecha el Menú Desplegable con estado automático y colores */}
                      <div className="flex items-center gap-2.5 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                        {/* Botón para intercalar Modificado de Proyecto tras esta certificación */}
                        {esCertOrdinaria && (
                          <button
                            type="button"
                            onClick={() => handleAgregarModificadoProyecto(doc.id, false)}
                            className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition shadow-2xs"
                            title={`Añadir Modificación de Proyecto tras ${doc.codigo}`}
                          >
                            <Plus className="w-3 h-3 text-amber-700 stroke-[3]" />
                            <span>+ Modificado tras Cert.</span>
                          </button>
                        )}

                        {/* Botón para eliminar certificación, factura o modificado dinámico */}
                        {(doc.id.startsWith('doc-cert-') || doc.id.startsWith('doc-fac-') || doc.id.startsWith('doc-mod-') || doc.categoria === 'modificado') && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Deseas eliminar "${doc.titulo}" (${doc.codigo}) del expediente?`)) {
                                eliminarDocumentoDeActuacion(actuacionActiva.id, doc.id);
                                setMensajeExito(`Se ha eliminado ${doc.titulo} correctamente.`);
                                setTimeout(() => setMensajeExito(null), 3000);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                            title={`Eliminar ${doc.titulo}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 1. EN PRIMER LUGAR: BOTÓN REVISAR (detecta y asigna automáticamente al técnico) */}
                        <button
                          type="button"
                          onClick={() => handleEntrarARevisarDocumento(index)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#004F90] hover:bg-[#003B71] text-white text-xs font-black shadow-xs transition active:scale-[0.98]"
                          title={`Revisar ${doc.codigo} (detecta y asigna automáticamente al técnico revisor)`}
                        >
                          <span>REVISAR</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {/* 2. A LA DERECHA: MENÚ DESPLEGABLE CON ESTADO AUTOMÁTICO Y COLORES RESPECTIVOS */}
                        <div className="relative">
                          <select
                            value={estadoMenuDoc}
                            onChange={(e) => handleCambiarEstadoMenuDesplegable(index, e.target.value)}
                            className={`text-xs font-bold py-2 pl-3 pr-8 rounded-xl border transition appearance-none cursor-pointer focus:outline-hidden focus:ring-2 shadow-2xs ${
                              estadoMenuDoc === 'conforme'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-400 font-black'
                                : estadoMenuDoc === 'pendiente_subsanacion'
                                ? 'bg-amber-50 text-amber-900 border-amber-300 focus:ring-amber-400 font-black'
                                : estadoMenuDoc === 'no_procede'
                                ? 'bg-slate-100 text-slate-700 border-slate-300 focus:ring-slate-400 font-bold'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 focus:ring-blue-400'
                            }`}
                            title="Estado de revisión del documento"
                          >
                            <option value="no_procede">NO PROCEDE</option>
                            <option value="pendiente_revisar">PENDIENTE DE REVISAR</option>
                            <option value="pendiente_subsanacion">PENDIENTE DE SUBSANACIÓN</option>
                            <option value="conforme">CONFORME</option>
                          </select>
                          <ChevronDown
                            className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                              estadoMenuDoc === 'conforme'
                                ? 'text-emerald-700'
                                : estadoMenuDoc === 'pendiente_subsanacion'
                                ? 'text-amber-700'
                                : 'text-slate-400'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* FILA INTERACTIVA: + AÑADIR CERTIFICACIÓN (Numeración automática) */}
                    {esUltimaCertOrdinaria && (
                      <div className="p-3 sm:p-4 bg-blue-50/50 border-y border-dashed border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#004F90] flex items-center justify-center font-black text-sm shrink-0 border border-blue-200 shadow-2xs">
                            +
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#004F90] block">
                              ¿Necesitas certificar más mensualidades de obra?
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Se numerará automáticamente como <strong>Certificación {siguienteNumCert}</strong> (código CERT-{String(siguienteNumCert).padStart(2, '0')})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleAgregarCertificacion(false)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#004F90] hover:bg-[#003B71] text-white text-xs font-bold shadow-xs transition active:scale-[0.98]"
                            title={`Añadir Certificación ${siguienteNumCert}`}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>+ Certificación {siguienteNumCert}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAgregarModificadoProyecto(doc.id, false)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold shadow-2xs transition active:scale-[0.98]"
                            title="Añadir una Modificación de Proyecto al final de las certificaciones ordinarias"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3] text-amber-700" />
                            <span>+ Modificado (al final)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* FILA INTERACTIVA: + AÑADIR FACTURA (Numeración automática) */}
                    {esUltimaFactura && (
                      <div className="p-3 sm:p-4 bg-indigo-50/50 border-y border-dashed border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200 shadow-2xs">
                            +
                          </div>
                          <div>
                            <span className="text-xs font-bold text-indigo-950 block">
                              ¿Dispones de más facturas de asistencia técnica / dirección facultativa?
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Se numerará automáticamente como <strong>Factura {siguienteNumFac} Asistencia Técnica</strong> (código FAC-AT{siguienteNumFac})
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAgregarFactura(false)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition active:scale-[0.98] self-start sm:self-auto shrink-0"
                          title={`Añadir Factura ${siguienteNumFac}`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>+ Factura {siguienteNumFac}</span>
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: DENTRO DE UN DOCUMENTO (Revisión según el Excel + Automatizado) */}
      {/* ========================================================================= */}
      {modoVista === 'documento' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* BARRA HORIZONTAL DE PESTAÑAS DEL EXPEDIENTE (Acceso directo a Pestaña Proyecto, Certificaciones, etc.) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 px-1 border-b border-slate-100 mb-1.5 text-[11px]">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#004F90]" />
                <span>Pestañas del Expediente ({totalDocumentos} documentos ordenados):</span>
              </span>
              <span className="text-slate-400 text-[10px] hidden sm:inline">
                Haz clic en cualquier pestaña para ir directamente al documento
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {actuacionActiva.documentos.map((doc, idx) => {
                const esActivo = idx === documentoActivoIndex;
                const estadoDoc = getEstadoDoc(doc);
                const esProyecto = doc.codigo === 'PROY-OBRA' || doc.categoria === 'proyecto';
                const esModificado = doc.codigo.startsWith('MOD-') || doc.categoria === 'modificado';

                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      cambiarDocumentoPestana(idx, true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 whitespace-nowrap ${
                      esActivo
                        ? 'bg-[#004F90] text-white shadow-xs ring-2 ring-blue-300'
                        : esProyecto
                        ? 'bg-blue-50 text-[#004F90] border border-blue-200 hover:bg-blue-100 font-black'
                        : esModificado
                        ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                    title={`${doc.codigo}: ${doc.titulo}`}
                  >
                    {/* Indicador de estado */}
                    {doc.noProcede ? (
                      <Ban className={`w-3 h-3 ${esActivo ? 'text-white/80' : 'text-slate-400'}`} />
                    ) : estadoDoc === 'ya_revisado' ? (
                      <CheckCircle2 className={`w-3 h-3 ${esActivo ? 'text-emerald-300' : 'text-emerald-600'}`} />
                    ) : estadoDoc === 'en_revision' ? (
                      <Clock className={`w-3 h-3 ${esActivo ? 'text-amber-300' : 'text-amber-600'}`} />
                    ) : (
                      <span className={`w-2 h-2 rounded-full ${esActivo ? 'bg-white/60' : 'bg-slate-300'}`} />
                    )}

                    <span>{esProyecto ? '📁 Pestaña Proyecto' : esModificado ? `⚡ ${doc.codigo}` : doc.codigo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BARRA SUPERIOR DEL DOCUMENTO ACTIVO */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setModoVista('ficha');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-2xs"
                title="Volver a la Ficha de Revisión completa"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a la Ficha</span>
              </button>

              <div className="text-xs text-slate-500 font-medium">
                Documento <span className="font-bold text-slate-800">{documentoActivoIndex + 1} de {totalDocumentos}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="font-mono font-bold text-[#004F90]">{documentoActivo.codigo}</span>
              </div>

              {/* Técnico Revisor Detectado Automáticamente */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[#004F90] text-xs font-bold shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Revisor: {usuarioActual ? `${usuarioActual.nombre} ${usuarioActual.apellidos}` : actuacionActiva.tecnicoAsignadoNombre || 'Carmen Rivas Delgado'}</span>
              </div>
            </div>

            {/* Acciones del documento: Finalizar Revisión + Marcar No Procede + Validar Conforme + Cert/Fact */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* BOTÓN PROMINENTE: FINALIZAR REVISIÓN (Graba trazabilidad y emite informe o dictamen) */}
              <button
                type="button"
                onClick={handleFinalizarRevision}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004F90] hover:bg-[#003B71] text-white text-xs font-black shadow-xs transition active:scale-[0.98]"
                title="Finalizar revisión para grabar la trazabilidad oficial y dictamen"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Finalizar revisión</span>
              </button>
              {/* Botón + si es Certificación */}
              {esCertificacion && documentoActivo.codigo !== 'CERT-FIN' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleAgregarCertificacion(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50/90 hover:bg-blue-100 text-[#004F90] text-xs font-black transition shadow-2xs active:scale-[0.98]"
                    title={`Añadir una nueva certificación (Certificación ${siguienteNumCert}) y pasar a revisarla`}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3] text-[#004F90]" />
                    <span>+ Certificación {siguienteNumCert}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAgregarModificadoProyecto(documentoActivo.id, true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50/90 hover:bg-amber-100 text-amber-900 text-xs font-black transition shadow-2xs active:scale-[0.98]"
                    title="Añadir una modificación de proyecto tras esta certificación y pasar a revisarla"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3] text-amber-700" />
                    <span>+ Modificado tras Cert.</span>
                  </button>
                </>
              )}

              {/* Botón eliminar si es modificado dinámico */}
              {(documentoActivo.id.startsWith('doc-mod-') || documentoActivo.categoria === 'modificado') && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Deseas eliminar "${documentoActivo.titulo}" (${documentoActivo.codigo}) del expediente?`)) {
                      eliminarDocumentoDeActuacion(actuacionActiva.id, documentoActivo.id);
                      setModoVista('ficha');
                      setMensajeExito(`Se ha eliminado ${documentoActivo.titulo} correctamente.`);
                      setTimeout(() => setMensajeExito(null), 3000);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition shadow-2xs"
                  title="Eliminar esta modificación de proyecto"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Eliminar Modificado</span>
                </button>
              )}

              {/* Botón + si es Factura */}
              {esFactura && (
                <button
                  type="button"
                  onClick={() => handleAgregarFactura(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-900 text-xs font-black transition shadow-2xs active:scale-[0.98]"
                  title={`Añadir una nueva factura (Factura ${siguienteNumFac}) y pasar a revisarla`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3] text-indigo-700" />
                  <span>+ Factura {siguienteNumFac}</span>
                </button>
              )}

              {/* Botones de acceso rápido para añadir certificación o factura desde cualquier documento */}
              {!esCertificacion && !esFactura && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAgregarCertificacion(false)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-[#004F90] text-xs font-bold transition shadow-2xs"
                    title={`Añadir Certificación ${siguienteNumCert}`}
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>+ Cert. {siguienteNumCert}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAgregarFactura(false)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition shadow-2xs"
                    title={`Añadir Factura ${siguienteNumFac}`}
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>+ Fact. {siguienteNumFac}</span>
                  </button>
                </div>
              )}

              {/* Interruptor No Procede */}
              <button
                type="button"
                onClick={() => {
                  marcarDocumentoNoProcede(!documentoActivo.noProcede);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                  documentoActivo.noProcede
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{documentoActivo.noProcede ? 'Documento NO procede (Exento)' : 'Marcar No Procede'}</span>
              </button>

              {/* Botón de Automatización Rápida (Validar todo conforme de 1 clic) */}
              {!documentoActivo.noProcede && (
                <button
                  type="button"
                  onClick={() => {
                    autovalidarTodoConformeDocumento();
                    setMensajeExito(`Todos los puntos de ${documentoActivo.codigo} han sido validados como CONFORME.`);
                    setTimeout(() => setMensajeExito(null), 3000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                  title="Marcar automáticamente todos los campos como conforme"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Validar Todo Conforme</span>
                </button>
              )}
            </div>
          </div>

          {/* Aviso si el documento está marcado como No Procede */}
          {documentoActivo.noProcede && (
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <span className="font-bold">Este documento ha sido marcado como NO PROCEDE para esta actuación.</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Queda excluido de la revisión preceptiva. Puedes continuar directamente con el siguiente documento.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (documentoActivoIndex < totalDocumentos - 1) {
                    cambiarDocumentoPestana(documentoActivoIndex + 1, true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    setModoVista('ficha');
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004F90] hover:bg-[#003B71] text-white text-xs font-black shadow-xs transition"
              >
                <span>Continuar al Siguiente Documento →</span>
              </button>
            </div>
          )}

          {/* CUERPO PRINCIPAL DEL DOCUMENTO: Pantalla completa pegada a izquierda y ocupando todo el espacio a la derecha */}
          <div className="flex flex-col lg:flex-row items-start gap-5 w-full">
            {/* Columna Izquierda: Formulario Base 14 (Pegado a la izquierda, compacto y ordenado) */}
            <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div className="border-b border-slate-100 pb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                    {documentoActivo.codigo}
                  </span>
                  <h2 className="mt-1 text-base font-bold text-slate-900 leading-snug">
                    {documentoActivo.titulo}
                  </h2>
                  {documentoActivo.subtitulo && (
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {documentoActivo.subtitulo}
                    </p>
                  )}
                </div>

                {/* Si es Certificación: Banner Oficial de Sumatorio Acumulado (Google Sheet) */}
                {esCertificacion && (
                  <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                      <span className="flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-blue-600" />
                        <span>Cálculo Acumulado Base 14 (Google Sheet)</span>
                      </span>
                      <span className="text-[10px] font-mono bg-blue-200/60 px-1.5 py-0.5 rounded text-blue-800 font-bold">
                        Auto-sumado
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Acumulado Anterior:</span>
                        <span className="font-bold text-slate-700">
                          {formatearMoneda(anteriorAcumulado)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Total Acumulado:</span>
                        <span className="font-bold text-emerald-700">
                          {formatearMoneda(totalCertAcumulada)}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1 border-t border-blue-200/60">
                      <span>% Obra Ejecutada / Adjudicación:</span>
                      <span className="font-bold text-blue-700 font-mono">
                        {formatearPorcentaje(porcObraCert)}
                      </span>
                    </div>

                    {/* Botón directo para añadir la siguiente certificación */}
                    {documentoActivo.codigo !== 'CERT-FIN' && (
                      <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-blue-800 font-medium">
                          Siguiente: Certificación {siguienteNumCert}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAgregarCertificacion(true)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#004F90] hover:bg-[#003B71] text-white text-[11px] font-black shadow-2xs transition active:scale-[0.98]"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                          <span>+ Añadir Certificación {siguienteNumCert}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Si es Factura: Banner de Asistencia Técnica y Facturas acumuladas */}
                {esFactura && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
                      <span className="flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Facturación de Asistencia Técnica</span>
                      </span>
                      <span className="text-[10px] font-mono bg-indigo-200/60 px-1.5 py-0.5 rounded text-indigo-800 font-bold">
                        {todasFacturas.length} Facturas registradas
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between items-center">
                      <span>Total Facturado Asistencia Técnica:</span>
                      <span className="font-mono font-bold text-indigo-950">
                        {formatearMoneda(totalFacturasAcumuladas)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-indigo-800 font-medium">
                        Siguiente: Factura {siguienteNumFac}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAgregarFactura(true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-[11px] font-black shadow-2xs transition active:scale-[0.98]"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>+ Añadir Factura {siguienteNumFac}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Campos de Fechas e Importes oficiales según el Excel */}
                <div className="space-y-3">
                  {/* Calificación de justificación */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Calificación de Justificación
                    </label>
                    <select
                      value={documentoActivo.metadatos.estadoJustificacion}
                      onChange={(e) =>
                        actualizarMetadatosDocumento({
                          estadoJustificacion: e.target.value as any
                        })
                      }
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800"
                    >
                      <option value="En plazo">En plazo</option>
                      <option value="En plazo con deficiencias no sustanciales">
                        En plazo con deficiencias no sustanciales
                      </option>
                      <option value="Fuera de plazo">Fuera de plazo</option>
                      <option value="Fuera de plazo con deficiencias no sustanciales">
                        Fuera de plazo con deficiencias no sustanciales
                      </option>
                      <option value="No Justificado">No Justificado</option>
                      <option value="Pendiente de calificar">Pendiente de calificar</option>
                    </select>
                  </div>

                  {/* Importes si aplica (Introducir a mano + formato con miles y 2 decimales) */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                        <span className="font-bold">Importe Inicial</span>
                        <span className="text-[9px] font-semibold text-[#004F90] bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                          A mano
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={documentoActivo.metadatos.importeInicial || ''}
                        onChange={(e) =>
                          actualizarMetadatosDocumento({
                            importeInicial: parseFloat(e.target.value) || 0
                          })
                        }
                        placeholder="0.00"
                        className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-mono focus:border-[#004F90] focus:ring-1 focus:ring-[#004F90]"
                      />
                      <span className="block text-[10px] font-mono font-bold text-slate-600 mt-0.5">
                        {formatearMoneda(documentoActivo.metadatos.importeInicial)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                        <span className="font-bold">Importe Última</span>
                        <span className="text-[9px] font-semibold text-[#004F90] bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                          A mano
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={documentoActivo.metadatos.importeUltima || ''}
                        onChange={(e) =>
                          actualizarMetadatosDocumento({
                            importeUltima: parseFloat(e.target.value) || 0
                          })
                        }
                        placeholder="0.00"
                        className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-mono focus:border-[#004F90] focus:ring-1 focus:ring-[#004F90]"
                      />
                      <span className="block text-[10px] font-mono font-bold text-slate-600 mt-0.5">
                        {formatearMoneda(documentoActivo.metadatos.importeUltima)}
                      </span>
                    </div>
                  </div>

                  {/* Fecha de Expedición */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Expedición Inicial</label>
                      <input
                        type="date"
                        value={documentoActivo.metadatos.fechaExpedicionInicial}
                        onChange={(e) =>
                          actualizarMetadatosDocumento({
                            fechaExpedicionInicial: e.target.value
                          })
                        }
                        className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Expedición Última</label>
                      <input
                        type="date"
                        value={documentoActivo.metadatos.fechaExpedicionUltima}
                        onChange={(e) =>
                          actualizarMetadatosDocumento({
                            fechaExpedicionUltima: e.target.value
                          })
                        }
                        className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Fecha de Registro */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Registro Inicial</label>
                      <input
                        type="date"
                        value={documentoActivo.metadatos.fechaRegistroInicial}
                        onChange={(e) =>
                          actualizarMetadatosDocumento({
                            fechaRegistroInicial: e.target.value
                          })
                        }
                        className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Registro Última</label>
                      <input
                        type="date"
                        value={documentoActivo.metadatos.fechaRegistroUltima}
                        onChange={(e) =>
                          actualizarMetadatosDocumento({
                            fechaRegistroUltima: e.target.value
                          })
                        }
                        className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Observaciones Generales */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Observaciones Técnicas Generales
                  </label>
                  <textarea
                    rows={2}
                    value={documentoActivo.metadatos.observacionesGenerales}
                    onChange={(e) =>
                      actualizarMetadatosDocumento({
                        observacionesGenerales: e.target.value
                      })
                    }
                    placeholder="Anotaciones técnicas del documento..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Ocupando TODO el espacio posible a la derecha */}
            <div className="flex-1 min-w-0 w-full space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-[#004F90]" />
                      <span>Comprobación Técnica (según Excel Oficial)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pulsa <strong>✅ Conforme</strong> si cumple, o <strong>❌ No Conforme</strong> para registrar deficiencias o subsanación.
                    </p>
                  </div>

                  {/* Resumen del checklist de esta pestaña */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                      ✅ {camposConformes} Conformes
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 font-bold">
                      ❌ {camposNoConformes} Subsanar
                    </span>
                    {camposSinRevisar > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold animate-pulse">
                        ⚠️ {camposSinRevisar} pendientes
                      </span>
                    )}
                  </div>
                </div>

                {/* TABLA PRINCIPAL DE COMPROBACIÓN SEGÚN EL EXCEL */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-50/70">
                        <th className="py-3 px-3 w-5/12">Campo a Revisar</th>
                        <th className="py-3 px-3 w-3/12 text-center">Estado</th>
                        <th className="py-3 px-3 w-4/12">Observación / Subsanación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {documentoActivo.camposRevisar.map((campo) => {
                        const esConforme = campo.estado === 'conforme';
                        const esNoConforme = campo.estado === 'no_conforme';
                        const sinRevisar = campo.estado === 'sin_revisar';

                        return (
                          <tr
                            key={campo.id}
                            className={`transition-colors ${
                              sinRevisar
                                ? 'bg-amber-50/20'
                                : esNoConforme
                                ? 'bg-red-50/30'
                                : 'hover:bg-slate-50/50'
                            }`}
                          >
                            {/* 1. Campo a Revisar */}
                            <td className="py-3 px-3 align-top">
                              <div className="font-semibold text-slate-800">
                                {campo.campo}
                              </div>
                              {campo.descripcion && (
                                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                  {campo.descripcion}
                                </div>
                              )}
                            </td>

                            {/* 2. Botones de Calificación Rápida (✅ / ❌) */}
                            <td className="py-3 px-3 align-top text-center">
                              <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => actualizarEstadoCampo(campo.id, 'conforme')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                    esConforme
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-emerald-700 hover:bg-white'
                                  }`}
                                  title="Marcar como Conforme"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Conforme</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const subsExistentes = obtenerSubsanacionesDeCampo(campo);
                                    actualizarEstadoCampo(
                                      campo.id,
                                      'no_conforme',
                                      subsExistentes.join('; '),
                                      subsExistentes
                                    );
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                    esNoConforme
                                      ? 'bg-red-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-red-700 hover:bg-white'
                                  }`}
                                  title="Marcar como No Conforme / Subsanar"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Subsanar</span>
                                </button>
                              </div>
                            </td>

                            {/* 3. Observación / Motivos de Subsanación (Múltiple Selección) */}
                            <td className="py-3 px-3 align-top">
                              {esConforme ? (
                                <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Correcto (Conforme)</span>
                                </span>
                              ) : esNoConforme ? (
                                <div className="space-y-2">
                                  {(() => {
                                    const subsActuales = obtenerSubsanacionesDeCampo(campo);

                                    return (
                                      <>
                                        {/* Lista de motivos de subsanación seleccionados: aparecen uno tras otro */}
                                        {subsActuales.length > 0 && (
                                          <div className="flex flex-wrap gap-1.5 items-center">
                                            {subsActuales.map((subTexto, subIdx) => (
                                              <span
                                                key={subIdx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200/80 text-xs font-medium shadow-2xs group hover:bg-rose-100/70 transition"
                                              >
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                                <span>{subTexto}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => quitarMotivoSubsanacion(campo.id, subIdx)}
                                                  className="text-rose-400 hover:text-rose-700 hover:bg-rose-200/60 rounded p-0.5 transition shrink-0 ml-0.5"
                                                  title={`Quitar "${subTexto}"`}
                                                >
                                                  <X className="w-3 h-3 stroke-[2.5]" />
                                                </button>
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                        {/* Si aún no se ha seleccionado ningún motivo, indicación discreta */}
                                        {subsActuales.length === 0 && editandoObservacionId !== campo.id && (
                                          <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50/70 px-2.5 py-1 rounded-md border border-amber-200/70 w-fit">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                            <span>Elija los motivos de subsanación a requerir:</span>
                                          </div>
                                        )}

                                        {/* Selector para añadir múltiples motivos consecutivamente */}
                                        {editandoObservacionId === campo.id ? (
                                          <div className="flex items-center gap-1.5 pt-0.5">
                                            <input
                                              type="text"
                                              placeholder="Escriba motivo de subsanación..."
                                              value={observacionTextoTemporal}
                                              onChange={(e) => setObservacionTextoTemporal(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  agregarMotivoSubsanacionManual(campo.id, observacionTextoTemporal);
                                                }
                                              }}
                                              className="flex-1 p-1.5 rounded-lg border border-red-300 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-red-400"
                                              autoFocus
                                            />
                                            <button
                                              type="button"
                                              onClick={() => agregarMotivoSubsanacionManual(campo.id, observacionTextoTemporal)}
                                              className="px-2.5 py-1 rounded-lg bg-[#004F90] text-white text-xs font-bold shadow-2xs hover:bg-[#003B71] transition"
                                            >
                                              Añadir
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setEditandoObservacionId(null)}
                                              className="px-2 py-1 rounded-lg border border-slate-200 text-slate-500 text-xs hover:bg-slate-100"
                                            >
                                              Cancelar
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 pt-0.5">
                                            <select
                                              value=""
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                if (!val) return;
                                                if (val === 'OTRO_TEXTO') {
                                                  setEditandoObservacionId(campo.id);
                                                  setObservacionTextoTemporal('');
                                                } else {
                                                  agregarMotivoSubsanacion(campo.id, val);
                                                }
                                              }}
                                              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-medium focus:outline-hidden focus:ring-1 focus:ring-[#004F90] cursor-pointer shadow-2xs"
                                            >
                                              <option value="" disabled>
                                                {subsActuales.length === 0
                                                  ? '— Elegir motivo de subsanación —'
                                                  : '+ Añadir otro motivo a este apartado...'}
                                              </option>
                                              {GRUPOS_SUBSANACION.map((grupo) => (
                                                <optgroup key={grupo.categoria} label={grupo.categoria}>
                                                  {grupo.motivos.map((resp) => {
                                                    const yaEsta = subsActuales.includes(resp);
                                                    return (
                                                      <option key={resp} value={resp} disabled={yaEsta}>
                                                        {yaEsta ? `✓ ${resp}` : resp}
                                                      </option>
                                                    );
                                                  })}
                                                </optgroup>
                                              ))}
                                              <option value="OTRO_TEXTO">+ Escribir motivo personalizado...</option>
                                            </select>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <span className="text-amber-600/80 text-[11px] italic">
                                  Pendiente de comprobación
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ========================================================================= */}
                {/* CUADRO DE CONCLUSIÓN DEL DOCUMENTO (Subsanaciones para EELL o Conforme) */}
                {/* ========================================================================= */}
                {(() => {
                  const camposNoConformes = documentoActivo.camposRevisar.filter((c) => c.estado === 'no_conforme');
                  const camposConformes = documentoActivo.camposRevisar.filter((c) => c.estado === 'conforme');
                  const camposSinRevisar = documentoActivo.camposRevisar.filter((c) => c.estado === 'sin_revisar');
                  const tieneSubsanaciones = camposNoConformes.length > 0;
                  const estaTodoConforme =
                    !documentoActivo.noProcede &&
                    camposNoConformes.length === 0 &&
                    camposSinRevisar.length === 0 &&
                    camposConformes.length > 0;
                  const esDocNoProcede = !!documentoActivo.noProcede;

                  const tecnicoRedactorNombre =
                    documentoActivo.tecnicoUltimoAcceso ||
                    documentoActivo.tecnicoRevisorOriginal ||
                    (usuarioActual ? `${usuarioActual.nombre} ${usuarioActual.apellidos}` : actuacionActiva.tecnicoAsignadoNombre || 'D. Juan Hinojo García');

                  const tecnicoRedactorCargo =
                    usuarioActual?.cargo || 'Jefe del Servicio de Asistencia Técnica y Obras';

                  const tecnicoRedactorDpto =
                    usuarioActual?.departamento || 'Área de Desarrollo Local · Diputación Provincial de Cádiz';

                  const fechaConclusion = new Date().toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });

                  // Texto redactado oficial para que las administrativas envíen por correo electrónico a la EELL
                  const textoEmailSubsanacion = `ASUNTO: REQUERIMIENTO DE SUBSANACIÓN · ${actuacionActiva.plan} · Actuación Nº ${actuacionActiva.numero}: ${actuacionActiva.titulo}
ENTIDAD LOCAL DESTINATARIA: ${actuacionActiva.entidadLocal}
DOCUMENTO OBJETO DE REVISIÓN: ${documentoActivo.codigo} - ${documentoActivo.titulo}
EXPEDIENTE: ${actuacionActiva.id}

Estimados/as señores/as:

Desde el Área de Desarrollo Local de la Diputación Provincial de Cádiz, se pone en su conocimiento que, tras la comprobación técnica del documento "${documentoActivo.codigo}: ${documentoActivo.titulo}" correspondiente a la Actuación nº ${actuacionActiva.numero} ("${actuacionActiva.titulo}") dentro de la convocatoria "${actuacionActiva.plan}", se han detectado las siguientes incidencias que precisan subsanación por parte de esa Entidad Local:

RELACIÓN DE SUBSANACIONES REQUERIDAS:
${camposNoConformes.map((c, i) => {
  const motivos = obtenerSubsanacionesDeCampo(c);
  let motivosTexto = '';
  if (motivos.length > 1) {
    motivosTexto = motivos.map((m, mIdx) => `   ${mIdx + 1}) ${m}`).join('\n');
  } else if (motivos.length === 1) {
    motivosTexto = `   → Motivo: ${motivos[0]}`;
  } else {
    motivosTexto = `   → Motivo: ${c.observacion || 'Falta documento preceptivo o subsanación requerida'}`;
  }
  return `${i + 1}. REQUISITO: ${c.campo}\n${motivosTexto}${c.descripcion ? `\n   → Referencia: ${c.descripcion}` : ''}`;
}).join('\n\n')}

Rogamos procedan a remitir la documentación subsanada a través de la sede electrónica de la Diputación de Cádiz a la mayor brevedad posible para continuar con la tramitación preceptiva de la justificación.

Atentamente,
TÉCNICO REDACTOR / REVISOR:
${tecnicoRedactorNombre}
${tecnicoRedactorCargo}
${tecnicoRedactorDpto}
Fecha de emisión: ${fechaConclusion}`;

                  // Texto de certificación favorable
                  const textoConformidad = `DICTAMEN TÉCNICO FAVORABLE · CONFORME
EXPEDIENTE: Actuación Nº ${actuacionActiva.numero} - ${actuacionActiva.titulo}
PLAN / CONVOCATORIA: ${actuacionActiva.plan}
ENTIDAD LOCAL: ${actuacionActiva.entidadLocal}
DOCUMENTO: ${documentoActivo.codigo} - ${documentoActivo.titulo}

Se certifica que, tras la comprobación técnica efectuada conforme a las bases reguladoras de la Base 14, el presente documento reúne todos los requisitos preceptivos, emitiéndose dictamen favorable y calificación de CONFORME para la justificación de la subvención.

TÉCNICO REDACTOR / REVISOR:
${tecnicoRedactorNombre}
${tecnicoRedactorCargo}
${tecnicoRedactorDpto}
Fecha de conformidad: ${fechaConclusion}`;

                  const asuntoMailto = encodeURIComponent(
                    `Requerimiento de Subsanación - ${actuacionActiva.plan} - Act. ${actuacionActiva.numero} (${documentoActivo.codigo})`
                  );
                  const cuerpoMailto = encodeURIComponent(textoEmailSubsanacion);
                  const mailtoUrl = `mailto:?subject=${asuntoMailto}&body=${cuerpoMailto}`;

                  return (
                    <div
                      className={`mt-6 rounded-2xl border p-5 shadow-xs transition-all ${
                        tieneSubsanaciones
                          ? 'border-amber-300 bg-amber-50/40'
                          : estaTodoConforme
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : esDocNoProcede
                          ? 'border-slate-300 bg-slate-50/60'
                          : 'border-slate-200 bg-slate-50/40'
                      }`}
                    >
                      {/* Cabecera del Cuadro de Conclusión */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              tieneSubsanaciones
                                ? 'bg-amber-100 text-amber-800'
                                : estaTodoConforme
                                ? 'bg-emerald-100 text-emerald-800'
                                : esDocNoProcede
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-blue-100 text-[#004F90]'
                            }`}
                          >
                            {tieneSubsanaciones ? (
                              <AlertTriangle className="w-4 h-4 text-amber-700" />
                            ) : estaTodoConforme ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            ) : esDocNoProcede ? (
                              <Ban className="w-4 h-4 text-slate-600" />
                            ) : (
                              <FileCheck2 className="w-4 h-4 text-[#004F90]" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <span>Conclusión</span>
                              <span className="text-[11px] font-normal text-slate-400">·</span>
                              <span className="text-xs font-semibold text-slate-600">
                                {documentoActivo.codigo}
                              </span>
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              {tieneSubsanaciones
                                ? 'Se han detectado deficiencias que requieren subsanación por la Entidad Local.'
                                : estaTodoConforme
                                ? 'Comprobación favorable: todos los requisitos han sido calificados como conformes.'
                                : esDocNoProcede
                                ? 'Documento exento para esta actuación (marcado como No Procede).'
                                : 'Revisión técnica en curso (califique los campos superiores).'}
                            </p>
                          </div>
                        </div>

                        {/* Badge de Estado del Dictamen */}
                        <div>
                          {tieneSubsanaciones ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                              <span>REQUIERE SUBSANACIÓN ({camposNoConformes.length})</span>
                            </span>
                          ) : estaTodoConforme ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>CONFORME</span>
                            </span>
                          ) : esDocNoProcede ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold">
                              <Ban className="w-3.5 h-3.5 text-slate-500" />
                              <span>NO PROCEDE</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300 text-xs font-semibold">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>EN REVISIÓN ({camposSinRevisar.length} pendientes)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CASO 1: HAY SUBSANACIONES PENDIENTES */}
                      {tieneSubsanaciones && (
                        <div className="mt-4 space-y-3.5">
                          {/* Listado visual de las deficiencias detectadas */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                              Deficiencias detectadas ({camposNoConformes.length}):
                            </span>
                            <div className="grid grid-cols-1 gap-2">
                              {camposNoConformes.map((c, i) => {
                                const subs = obtenerSubsanacionesDeCampo(c);
                                return (
                                  <div
                                    key={c.id}
                                    className="p-3 rounded-xl bg-white border border-amber-200/90 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-2xs"
                                  >
                                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                      <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                        {i + 1}
                                      </span>
                                      <div className="space-y-0.5">
                                        <span className="font-semibold text-slate-800 block">
                                          {c.campo}
                                        </span>
                                        {c.descripcion && (
                                          <span className="text-[11px] text-slate-400 block">
                                            {c.descripcion}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="shrink-0 pl-7 sm:pl-0 flex flex-wrap gap-1.5 justify-start sm:justify-end max-w-sm">
                                      {subs.length > 0 ? (
                                        subs.map((motivo, mIdx) => (
                                          <span
                                            key={mIdx}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/80 text-[11px] font-medium"
                                          >
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                            <span>{motivo}</span>
                                          </span>
                                        ))
                                      ) : (
                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/80 text-[11px] font-medium">
                                          {c.observacion || 'Falta documento'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Cuadro redactado para administrativas con botones de acción */}
                          <div className="p-3.5 rounded-xl bg-white border border-slate-300/80 shadow-2xs space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">
                                  Texto preparado para comunicación a la Entidad Local:
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  Las administrativas pueden copiar este requerimiento con un solo clic y enviarlo por correo a {actuacionActiva.entidadLocal}.
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => copiarTextoAlPortapapeles(textoEmailSubsanacion, 'subsanacion')}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition shadow-xs active:scale-[0.98] ${
                                    copiadoSubsanacion
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-[#004F90] hover:bg-[#003B71] text-white'
                                  }`}
                                  title="Copiar el texto completo de subsanación para pegarlo en el correo"
                                >
                                  {copiadoSubsanacion ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      <span>¡Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>Copiar para Correo</span>
                                    </>
                                  )}
                                </button>

                                <a
                                  href={mailtoUrl}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-2xs"
                                  title="Abrir en el cliente de correo predeterminado"
                                >
                                  <Mail className="w-3.5 h-3.5 text-slate-600" />
                                  <span className="hidden sm:inline">Abrir Correo</span>
                                </a>
                              </div>
                            </div>

                            {/* Vista previa del texto editable/copiable */}
                            <textarea
                              readOnly
                              rows={7}
                              value={textoEmailSubsanacion}
                              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-700 leading-relaxed resize-y focus:outline-hidden"
                            />
                          </div>
                        </div>
                      )}

                      {/* CASO 2: TODO ESTÁ OK (CONFORME) */}
                      {estaTodoConforme && (
                        <div className="mt-4 space-y-3">
                          <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-xs font-black text-emerald-950 block">
                                  Dictamen Favorable de Conformidad
                                </span>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  El documento cumple íntegramente con todos los puntos de la Base 14. Se emite calificación favorable sin requerimiento alguno a {actuacionActiva.entidadLocal}.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => copiarTextoAlPortapapeles(textoConformidad, 'conforme')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs active:scale-[0.98] shrink-0 self-start sm:self-auto ${
                                copiadoConforme
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title="Copiar texto de conformidad técnica para el expediente"
                            >
                              {copiadoConforme ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>¡Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Copiar Certificación</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* CASO 3: EN REVISIÓN (PENDIENTE) */}
                      {!tieneSubsanaciones && !estaTodoConforme && !esDocNoProcede && (
                        <div className="mt-3 p-3 rounded-xl bg-white/80 border border-slate-200 text-xs text-slate-500">
                          <span>
                            Quedan {camposSinRevisar.length} comprobaciones pendientes. Marque cada punto como conforme o elija el motivo de subsanación para emitir la conclusión definitiva.
                          </span>
                        </div>
                      )}

                      {/* FIRMA Y TÉCNICO REDACTOR MARCADO EN AMBAS SITUACIONES */}
                      <div
                        className={`mt-4 pt-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          tieneSubsanaciones
                            ? 'border-amber-200 text-amber-950'
                            : estaTodoConforme
                            ? 'border-emerald-200 text-emerald-950'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                              tieneSubsanaciones
                                ? 'bg-amber-100 border-amber-300 text-amber-800'
                                : estaTodoConforme
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                          >
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Técnico redactor / revisor:
                              </span>
                              <span className="font-black text-slate-900 text-xs">
                                {tecnicoRedactorNombre}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              {tecnicoRedactorCargo} · {tecnicoRedactorDpto}
                            </span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                            Fecha de Dictamen
                          </span>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {fechaConclusion}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* BOTÓN Y ACCIÓN: FINALIZAR REVISIÓN OFICIAL */}
                <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-[#004F90] flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        Finalizar Revisión Técnica del Documento
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Al pulsar se grabará la trazabilidad oficial, registrando al técnico revisor ({usuarioActual ? `${usuarioActual.nombre} ${usuarioActual.apellidos}` : actuacionActiva.tecnicoAsignadoNombre || 'Carmen Rivas Delgado'}) y guardando las subsanaciones pendientes o el conforme general.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFinalizarRevision}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#004F90] hover:bg-[#003B71] text-white text-xs font-black shadow-xs transition active:scale-[0.98] shrink-0"
                    title="Finalizar revisión para grabar trazabilidad y dictamen"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Finalizar revisión</span>
                  </button>
                </div>

                {/* ========================================================================= */}
                {/* TRAZABILIDAD Y REGISTRO HISTÓRICO DE REVISIONES Y SUBSANACIONES */}
                {/* ========================================================================= */}
                {documentoActivo.rondasSubsanacion && documentoActivo.rondasSubsanacion.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#004F90]" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Trazabilidad Histórica de Subsanaciones ({documentoActivo.rondasSubsanacion.length} {documentoActivo.rondasSubsanacion.length === 1 ? 'cuadro registrado' : 'cuadros registrados'})
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 font-bold">
                        {documentoActivo.codigo}
                      </span>
                    </div>

                    {documentoActivo.rondasSubsanacion.map((ronda) => (
                      <div
                        key={ronda.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          ronda.estado === 'totalmente_subsanado'
                            ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                            : 'bg-white border-amber-200 shadow-2xs'
                        }`}
                      >
                        {/* Cabecera del Cuadro de Subsanación */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                              ronda.estado === 'totalmente_subsanado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}>
                              R{ronda.numeroRonda}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-slate-900">
                                  Cuadro {ronda.numeroRonda} · {ronda.numeroRonda === 1 ? 'Requerimiento Inicial de Subsanación' : `Revisión ${ronda.numeroRonda} tras Llegada de Documentación`}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                  ronda.estado === 'totalmente_subsanado'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : ronda.estado === 'parcialmente_subsanado'
                                    ? 'bg-orange-100 text-orange-900 border-orange-300'
                                    : 'bg-amber-100 text-amber-900 border-amber-300'
                                }`}>
                                  {ronda.estado === 'totalmente_subsanado'
                                    ? '✓ TOTALMENTE SUBSANADO'
                                    : ronda.estado === 'parcialmente_subsanado'
                                    ? '⚠️ PARCIALMENTE SUBSANADO'
                                    : '❌ REQUIERE SUBSANACIÓN'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                                <span>Técnico revisor: <strong className="text-slate-800 font-bold">{ronda.tecnicoNombre}</strong> ({ronda.tecnicoCargo})</span>
                                <span>·</span>
                                <span className="font-medium">{formatearFechaHora(ronda.fechaHora)}</span>
                                <span>·</span>
                                <span className="font-mono text-slate-400 font-bold">CSV: {ronda.csv}</span>
                              </div>
                            </div>
                          </div>

                          {/* Botones de Acción de esta Ronda */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDescargarInformeSubsanacion(ronda)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs active:scale-[0.98]"
                              title={`Descargar informe formal en PDF de la Ronda ${ronda.numeroRonda} firmado por el técnico`}
                            >
                              <Download className="w-3.5 h-3.5 text-[#004F90]" />
                              <span>PDF Informe Ronda {ronda.numeroRonda}</span>
                            </button>
                          </div>
                        </div>

                        {/* Contenido de la Ronda: Deficiencias y Estado */}
                        <div className="pt-3 space-y-2">
                          {ronda.deficiencias && ronda.deficiencias.length > 0 ? (
                            <>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                Deficiencias detectadas en este cuadro ({ronda.deficiencias.length}):
                              </span>
                              <div className="space-y-2">
                                {ronda.deficiencias.map((def, dIdx) => (
                                  <div
                                    key={dIdx}
                                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 shadow-2xs"
                                  >
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-slate-900 block">
                                        {dIdx + 1}. {def.campo}
                                      </span>
                                      {def.descripcion && (
                                        <p className="text-[11px] text-slate-500">{def.descripcion}</p>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 shrink-0 justify-start sm:justify-end">
                                      {def.subsanaciones && def.subsanaciones.length > 0 ? (
                                        def.subsanaciones.map((m, mIdx) => (
                                          <span
                                            key={mIdx}
                                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold"
                                          >
                                            {m}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold">
                                          {def.observacion || 'Falta documento preceptivo'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Todas las incidencias previas han sido subsanadas satisfactoriamente por la Entidad Local en este cuadro de revisión.</span>
                            </div>
                          )}

                          {ronda.camposConformes && ronda.camposConformes.length > 0 && (
                            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-600">Comprobaciones conformes en esta fecha:</span>
                              <span>{ronda.camposConformes.length} requisitos validados satisfactoriamente.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* DICTAMEN TÉCNICO FAVORABLE Y FIRMA ELECTRÓNICA */}
                {/* ========================================================================= */}
                {documentoActivo.informeFavorable?.emitido ? (
                  <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-950 block">
                            Dictamen Técnico Favorable · Firmado Electrónicamente
                          </span>
                          <span className="text-[11px] text-emerald-800">
                            Documento calificado formalmente como CONFORME con plena validez administrativa
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleDescargarInformeFavorable}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs shrink-0 active:scale-[0.98]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Dictamen Favorable (PDF Oficial)</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">Técnico Firmante</span>
                        <span className="font-bold text-slate-800">{documentoActivo.informeFavorable.firmanteNombre}</span>
                        <span className="text-[11px] text-slate-500 block">{documentoActivo.informeFavorable.firmanteCargo}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">Fecha y Hora de Firma</span>
                        <span className="font-mono font-bold text-slate-800">{formatearFechaHora(documentoActivo.informeFavorable.fechaHoraFirma)}</span>
                        <span className="text-[11px] text-slate-500 block">Certificado digital oficial</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">Código Seguro de Verificación</span>
                        <span className="font-mono font-black text-emerald-900 bg-white px-2 py-1 rounded-md border border-emerald-300 inline-block mt-0.5">
                          {documentoActivo.informeFavorable.csv}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* BARRA INFERIOR DE NAVEGACIÓN CONTINUA ENTRE DOCUMENTOS */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={documentoActivoIndex === 0}
                    onClick={() => {
                      if (documentoActivoIndex > 0) {
                        cambiarDocumentoPestana(documentoActivoIndex - 1, true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                      documentoActivoIndex === 0
                        ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                        : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Documento Anterior</span>
                  </button>

                  <div className="flex items-center gap-2 justify-center flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setModoVista('ficha');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline px-2 py-1"
                    >
                      Ver Ficha Completa
                    </button>

                    {/* Botón + si se está revisando Certificación */}
                    {esCertificacion && documentoActivo.codigo !== 'CERT-FIN' && (
                      <button
                        type="button"
                        onClick={() => handleAgregarCertificacion(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50 text-[#004F90] hover:bg-blue-100 text-xs font-black transition shadow-2xs active:scale-[0.98]"
                        title={`Añadir Certificación ${siguienteNumCert}`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>+ Certificación {siguienteNumCert}</span>
                      </button>
                    )}

                    {/* Botón + si se está revisando Factura */}
                    {esFactura && (
                      <button
                        type="button"
                        onClick={() => handleAgregarFactura(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 text-xs font-black transition shadow-2xs active:scale-[0.98]"
                        title={`Añadir Factura ${siguienteNumFac}`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>+ Factura {siguienteNumFac}</span>
                      </button>
                    )}
                  </div>

                  {/* Botón Principal: Guardar y Pasar al Siguiente Documento */}
                  <button
                    type="button"
                    onClick={() => {
                      if (documentoActivoIndex < totalDocumentos - 1) {
                        // Pasar al siguiente documento en orden cronológico
                        cambiarDocumentoPestana(documentoActivoIndex + 1, true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        // Último documento completado
                        setModoVista('ficha');
                        setMensajeExito('¡Has completado la revisión de todos los documentos del expediente!');
                        setTimeout(() => setMensajeExito(null), 5000);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004F90] hover:bg-[#003B71] text-white text-xs font-black shadow-xs transition active:scale-[0.98]"
                  >
                    <span>
                      {documentoActivoIndex < totalDocumentos - 1
                        ? 'Guardar y Siguiente Documento →'
                        : 'Finalizar Revisión del Expediente'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Oficial de Firma Electrónica para Dictamen Favorable */}
      {modalFirmaAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Firma Electrónica Oficial · Dictamen Favorable
                  </h3>
                  <span className="text-xs text-slate-500">
                    Diputación Provincial de Cádiz · Área de Desarrollo Local
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalFirmaAbierto(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Expediente:</span>
                <span className="font-bold text-slate-800 text-right">{actuacionActiva.id} · Act. {actuacionActiva.numero}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Documento:</span>
                <span className="font-bold text-slate-800 text-right">{documentoActivo.codigo} - {documentoActivo.titulo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Técnico firmante:</span>
                <span className="font-bold text-slate-800 text-right">
                  {usuarioActual ? `${usuarioActual.nombre} ${usuarioActual.apellidos}` : actuacionActiva.tecnicoAsignadoNombre || 'Carmen Rivas Delgado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Cargo oficial:</span>
                <span className="font-semibold text-slate-700 text-right">
                  {usuarioActual?.cargo || 'Jefe del Servicio de Asistencia Técnica y Obras'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Departamento:</span>
                <span className="text-slate-600 text-right">
                  {usuarioActual?.departamento || 'Área de Desarrollo Local · Diputación Provincial de Cádiz'}
                </span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-200 transition">
              <input
                type="checkbox"
                checked={declaracionAceptada}
                onChange={(e) => setDeclaracionAceptada(e.target.checked)}
                className="mt-0.5 rounded text-[#004F90] focus:ring-[#004F90]"
              />
              <span>
                Declaro bajo mi responsabilidad que he verificado el cumplimiento de todos los requisitos técnicos exigidos en la Base 14 para este documento y emito dictamen técnico favorable y conforme con plena validez administrativa.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalFirmaAbierto(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!declaracionAceptada || firmandoInforme}
                onClick={handleConfirmarFirmaFavorable}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition disabled:opacity-50 active:scale-[0.98]"
              >
                {firmandoInforme ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Firmando electrónicamente...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirmar Firma y Generar PDF Oficial</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar los datos principales de la actuación */}
      {modalEditarActuacionAbierto && actuacionActiva && (
        <EditarActuacionModal
          actuacion={actuacionActiva}
          mostrar={modalEditarActuacionAbierto}
          onCerrar={() => setModalEditarActuacionAbierto(false)}
        />
      )}
    </div>
  );
};
