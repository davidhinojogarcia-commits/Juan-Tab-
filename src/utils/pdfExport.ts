import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Actuacion,
  User,
  PlanSubvencion,
  DocumentoActuacion,
  RondaSubsanacion,
  InformeFavorableDocumento
} from '../types';

export function formatearFechaHora(fechaStr: string | null | undefined): string {
  if (!fechaStr) return '---';
  try {
    const f = new Date(fechaStr);
    if (isNaN(f.getTime())) return fechaStr;
    return f.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return fechaStr;
  }
}

export function formatearMoneda(cantidad: number | null | undefined): string {
  if (cantidad === null || cantidad === undefined || isNaN(cantidad)) return '0,00 €';
  const formateado = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cantidad);
  return `${formateado} €`;
}

export function formatearPorcentaje(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || isNaN(valor)) return '0,00 %';
  const formateado = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
  return `${formateado} %`;
}

export function formatearFecha(fechaStr: string | null | undefined): string {
  if (!fechaStr) return '---';
  try {
    const f = new Date(fechaStr);
    if (isNaN(f.getTime())) return fechaStr;
    return f.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return fechaStr;
  }
}

export function generarInformePDF(actuacion: Actuacion, usuarioFirmante: User | null): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryNavy: [number, number, number] = [0, 51, 102]; // #003366
  const goldAccent: [number, number, number] = [197, 155, 39]; // #C59B27
  const darkSlate: [number, number, number] = [30, 41, 59];
  const lightGray: [number, number, number] = [241, 245, 249];

  // 1. Cabecera Institucional
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Franja dorada inferior
  doc.setFillColor(...goldAccent);
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  // Textos Cabecera
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('EXCMA. DIPUTACIÓN PROVINCIAL DE CÁDIZ', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Área de Desarrollo Local · Servicio de Asistencia Técnica y Obras (Planifica v1.0)', 14, 19);

  // Escudo / Sello lateral
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(252, 224, 130);
  doc.text('PLANIFICA', pageWidth - 14, 14, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text('Sede Electrónica Oficial', pageWidth - 14, 20, { align: 'right' });

  // 2. Título del Informe
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('INFORME TÉCNICO DE REVISIÓN Y LIQUIDACIÓN', 14, 40);

  doc.setFontSize(10);
  doc.setTextColor(...goldAccent);
  doc.text('DOCUMENTACIÓN BASE 14 · JUSTIFICACIÓN DE ACTUACIONES', 14, 46);

  // 3. Ficha de Datos Generales de la Actuación
  const fechaAuditoria = new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  autoTable(doc, {
    startY: 50,
    head: [['DATOS IDENTIFICATIVOS DE LA ACTUACIÓN', 'INFORMACIÓN ECONÓMICA Y TEMPORAL']],
    body: [
      [
        `Entidad Local: ${actuacion.entidadLocal}\n` +
        `Plan / Programa: ${actuacion.plan}\n` +
        `Nº Actuación: ${actuacion.numero}\n` +
        `Título: ${actuacion.titulo}\n` +
        `Aplicación Presupuestaria: ${actuacion.aplicacionPresupuestaria || '2026-03-920-46200'}\n` +
        `Estado General: ${actuacion.estadoGeneral.toUpperCase().replace('_', ' ')}`,
        
        `Importe Actuación: ${formatearMoneda(actuacion.importes.importeActuacion)}\n` +
        `Importe Concesión: ${formatearMoneda(actuacion.importes.importeConcesion)}\n` +
        `Importe Adjudicación: ${formatearMoneda(actuacion.importes.importeAdjudicacion)}\n` +
        `Plazo Ejecución: ${formatearFecha(actuacion.plazos.plazoEjecucion)} (Amp: ${formatearFecha(actuacion.plazos.plazoEjecucionAmpliado)})\n` +
        `Plazo Justificación: ${formatearFecha(actuacion.plazos.plazoJustificacion)} (Amp: ${formatearFecha(actuacion.plazos.plazoJustificacionAmpliado)})`
      ]
    ],
    headStyles: {
      fillColor: primaryNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: darkSlate,
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    theme: 'grid'
  });

  // 4. Tabla de Documentos Base 14
  const tablaDocsBody = actuacion.documentos.map((docItem) => {
    let estadoTexto = 'Pendiente';
    if (docItem.revisadoCompleto) {
      estadoTexto = docItem.tieneDeficiencias ? 'Con deficiencias' : 'Conforme';
    }

    // Resumen de observaciones / subsanación
    const deficiencias = docItem.camposRevisar
      .filter((c) => c.estado === 'no_conforme')
      .map((c) => `[${c.campo}]: ${c.observacion || 'No conforme'}`)
      .join('\n');

    return [
      `${docItem.orden}. ${docItem.titulo}`,
      docItem.metadatos.importeUltima ? formatearMoneda(docItem.metadatos.importeUltima) : '---',
      formatearFecha(docItem.metadatos.fechaExpedicionUltima),
      formatearFecha(docItem.metadatos.fechaRegistroUltima),
      formatearFecha(docItem.metadatos.fechaAprobacionUltima),
      docItem.metadatos.estadoJustificacion || estadoTexto,
      deficiencias || (docItem.revisadoCompleto ? 'Conforme / Sin incidencias' : 'Pendiente de revisión')
    ];
  });

  const finalY1 = (doc as any).lastAutoTable?.finalY || 95;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryNavy);
  doc.text('DOCUMENTACIÓN BASE 14 · REVISIÓN PESTAÑA A PESTAÑA', 14, finalY1 + 8);

  autoTable(doc, {
    startY: finalY1 + 11,
    head: [[
      'Documento',
      'Importe',
      'F. Expedición',
      'F. Registro',
      'F. Aprobación',
      'Estado Justificación',
      'Observaciones / Subsanación'
    ]],
    body: tablaDocsBody,
    headStyles: {
      fillColor: primaryNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    bodyStyles: {
      fontSize: 7,
      textColor: darkSlate,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 20 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
      5: { cellWidth: 28 },
      6: { cellWidth: 'auto' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    theme: 'grid'
  });

  // 5. Cuadro de Liquidación Final
  const finalY2 = (doc as any).lastAutoTable?.finalY || 180;
  
  // Si no hay suficiente espacio para el cuadro final y firmas, añadir nueva página
  if (finalY2 > 210) {
    doc.addPage();
  }

  const startYLiquidacion = ((doc as any).internal?.getCurrentPageInfo?.()?.pageNumber || 1) > 1 && finalY2 > 210 ? 20 : finalY2 + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryNavy);
  doc.text('CUADRO DE LIQUIDACIÓN Y JUSTIFICACIÓN ECONÓMICA', 14, startYLiquidacion);

  const liq = actuacion.liquidacion;
  const totalJustificado = 
    liq.justificadoEnPlazo + 
    liq.justificadoEnPlazoConDeficiencias + 
    liq.justificadoFueraDePlazo + 
    liq.justificadoFueraDePlazoConDeficiencias;

  const totalNoJustificado = liq.noJustificado;
  const porcJustificado = liq.adjudicacion > 0 ? (totalJustificado / liq.adjudicacion) * 100 : 0;
  const porcNoJustificado = liq.adjudicacion > 0 ? (totalNoJustificado / liq.adjudicacion) * 100 : 0;

  autoTable(doc, {
    startY: startYLiquidacion + 3,
    head: [
      ['Concepto Económico', 'Importe (€)', 'Porcentaje (%)', 'Observaciones de Justificación']
    ],
    body: [
      ['Importe de Adjudicación', formatearMoneda(liq.adjudicacion), '100,00%', 'Presupuesto contratado base'],
      ['Justificado en plazo de ejecución', formatearMoneda(liq.justificadoEnPlazo), `${((liq.justificadoEnPlazo / (liq.adjudicacion || 1)) * 100).toFixed(2)}%`, 'Ejecución y aprobación en plazo reglamentario'],
      ['Justificado en plazo con deficiencias no sustanciales', formatearMoneda(liq.justificadoEnPlazoConDeficiencias), `${((liq.justificadoEnPlazoConDeficiencias / (liq.adjudicacion || 1)) * 100).toFixed(2)}%`, 'Documentación subsanable aportada'],
      ['Justificado fuera de plazo', formatearMoneda(liq.justificadoFueraDePlazo), `${((liq.justificadoFueraDePlazo / (liq.adjudicacion || 1)) * 100).toFixed(2)}%`, 'Sujeto a ponderación de penalidades'],
      ['Justificado fuera de plazo con deficiencias no sustanciales', formatearMoneda(liq.justificadoFueraDePlazoConDeficiencias), `${((liq.justificadoFueraDePlazoConDeficiencias / (liq.adjudicacion || 1)) * 100).toFixed(2)}%`, 'Requiere valoración de Intervención'],
      ['NO JUSTIFICADO (Reintegro / Incumplimiento)', formatearMoneda(totalNoJustificado), `${porcNoJustificado.toFixed(2)}%`, 'Ejecutado fuera de plazo / deficiencias sustanciales'],
      ['TOTAL LIQUIDADO CONFORME', formatearMoneda(totalJustificado), `${porcJustificado.toFixed(2)}%`, 'Propuesta de reconocimiento de obligación']
    ],
    headStyles: {
      fillColor: goldAccent,
      textColor: [0, 34, 68],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: darkSlate,
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    theme: 'grid'
  });

  // 6. Pie de Firma y Registro de Auditoría
  const finalY3 = (doc as any).lastAutoTable?.finalY || 240;
  
  if (finalY3 > 245) {
    doc.addPage();
  }

  const startYFirmas = ((doc as any).internal?.getCurrentPageInfo?.()?.pageNumber || 1) > 1 && finalY3 > 245 ? 20 : finalY3 + 10;

  // Cuadro de Auditoría de Acceso
  doc.setFillColor(...lightGray);
  doc.roundedRect(14, startYFirmas, pageWidth - 28, 16, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryNavy);
  doc.text('REGISTRO DE AUDITORÍA Y TRAZABILIDAD ELECTRÓNICA:', 18, startYFirmas + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Fecha/Hora emisión: ${fechaAuditoria} | Técnico: ${usuarioFirmante ? `${usuarioFirmante.nombre} ${usuarioFirmante.apellidos} (${usuarioFirmante.cargo})` : actuacion.tecnicoAsignadoNombre} | ` +
    `Cód. Actuación: ${actuacion.id} | Plataforma: Planifica v1.0 (Diputación de Cádiz)`,
    18,
    startYFirmas + 11
  );

  // Bloques de firma
  const firmaY = startYFirmas + 24;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryNavy);

  // Firma Técnico
  doc.text('EL/LA TÉCNICO/A REVISOR/A', 35, firmaY);
  doc.line(20, firmaY + 16, 85, firmaY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(usuarioFirmante ? `${usuarioFirmante.nombre} ${usuarioFirmante.apellidos}` : actuacion.tecnicoAsignadoNombre, 32, firmaY + 20);
  doc.text('Firma electrónica con CSV oficial', 32, firmaY + 24);

  // Firma Jefe de Servicio
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryNavy);
  doc.text('Vº Bº EL JEFE DEL SERVICIO DE ASISTENCIA TÉCNICA', pageWidth - 90, firmaY);
  doc.line(pageWidth - 95, firmaY + 16, pageWidth - 20, firmaY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('D. Juan Hinojo García', pageWidth - 75, firmaY + 20);
  doc.text('Área de Desarrollo Local - Diputación de Cádiz', pageWidth - 85, firmaY + 24);

  // Numeración de páginas
  const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : ((doc as any).internal?.pages?.length - 1) || 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} · Documento oficial generado en Planifica v1.0 · Diputación Provincial de Cádiz`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  // Descarga del fichero
  const nombreLimpio = actuacion.titulo.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  doc.save(`Informe_Tecnico_ADL_${actuacion.numero}_${nombreLimpio}.pdf`);
}

/**
 * Genera el informe institucional de rendimiento y control del Área de Desarrollo Local
 * Exportación para el Jefe de Servicio / Dirección
 */
export function generarInformeRendimientoPDF(
  actuaciones: Actuacion[],
  usuarios: User[],
  planes: PlanSubvencion[],
  usuarioFirmante: User | null
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryNavy: [number, number, number] = [0, 51, 102];
  const goldAccent: [number, number, number] = [197, 155, 39];

  // 1. Cabecera Institucional
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(...goldAccent);
  doc.rect(0, 24, pageWidth, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('DIPUTACIÓN PROVINCIAL DE CÁDIZ', 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 230, 242);
  doc.text('Área de Desarrollo Local · Informe Oficial de Planes, Programas y Convenios (Planifica v1.0)', 14, 16);

  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Fecha de emisión: ${fechaHoy}`, pageWidth - 14, 15, { align: 'right' });

  // 2. Resumen Ejecutivo
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(11);
  doc.text('1. RESUMEN EJECUTIVO Y RENDIMIENTO OPERATIVO', 14, 34);

  const totalActuaciones = actuaciones.length;
  const justificadas = actuaciones.filter((a) => a.estadoGeneral === 'justificado' || a.estadoGeneral === 'conforme').length;
  const enRevision = actuaciones.filter((a) => a.estadoGeneral === 'en_revision').length;
  const conDeficiencias = actuaciones.filter((a) => a.estadoGeneral === 'con_deficiencias').length;
  const totalPresupuesto = actuaciones.reduce((acc, a) => acc + (a.importes.importeConcesion || 0), 0);
  const totalLiquidado = actuaciones.reduce((acc, a) => {
    const l = a.liquidacion;
    return acc + (l.justificadoEnPlazo + l.justificadoEnPlazoConDeficiencias + l.justificadoFueraDePlazo + l.justificadoFueraDePlazoConDeficiencias);
  }, 0);

  autoTable(doc, {
    startY: 38,
    head: [['Métrica de Control', 'Valor Global', 'Métrica Económica', 'Importe Acumulado']],
    body: [
      ['Expedientes Totales Registrados', `${totalActuaciones} actuaciones`, 'Presupuesto Provincial Asignado', formatearMoneda(totalPresupuesto)],
      ['Justificadas / Conformadas', `${justificadas} (${totalActuaciones > 0 ? formatearPorcentaje((justificadas / totalActuaciones) * 100) : '0,00 %'})`, 'Importe Total Liquidado Aceptado', formatearMoneda(totalLiquidado)],
      ['En Curso de Revisión Técnica', `${enRevision} actuaciones`, 'Planes de Subvención Activos', `${planes.length} planes`],
      ['Con Deficiencias / Subsanación', `${conDeficiencias} actuaciones`, 'Técnicos Revisores Asignados', `${usuarios.filter(u => u.rol === 'tecnico').length} técnicos`]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: primaryNavy, textColor: [255, 255, 255], fontStyle: 'bold' }
  });

  // 3. Tabla Desglosada por Actuaciones
  const lastY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 51, 102);
  doc.text('2. ESTADO DETALLADO POR ACTUACIÓN Y PLAN', 14, lastY);

  const tablaActuaciones = actuaciones.map((a) => {
    const l = a.liquidacion;
    const justif = l.justificadoEnPlazo + l.justificadoEnPlazoConDeficiencias + l.justificadoFueraDePlazo + l.justificadoFueraDePlazoConDeficiencias;
    const docsRevisados = a.documentos.filter((d) => d.revisadoCompleto).length;
    return [
      `Nº ${a.numero}`,
      a.entidadLocal,
      a.titulo.length > 35 ? a.titulo.substring(0, 32) + '...' : a.titulo,
      a.plan.length > 25 ? a.plan.substring(0, 22) + '...' : a.plan,
      a.tecnicoAsignadoNombre || 'Sin asignar',
      `${docsRevisados}/22 docs`,
      a.estadoGeneral.toUpperCase().replace('_', ' '),
      formatearMoneda(a.importes.importeConcesion),
      formatearMoneda(justif)
    ];
  });

  autoTable(doc, {
    startY: lastY + 4,
    head: [['Nº', 'Entidad Local', 'Título', 'Plan', 'Técnico Revisor', 'Progreso', 'Estado', 'Concesión', 'Liquidado']],
    body: tablaActuaciones,
    theme: 'striped',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: primaryNavy, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center' },
      5: { halign: 'center' },
      6: { fontStyle: 'bold' },
      7: { halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // Pie y firma
  const firmanteTexto = usuarioFirmante
    ? `${usuarioFirmante.nombre} ${usuarioFirmante.apellidos} (${usuarioFirmante.cargo})`
    : 'D. Juan Hinojo García - Jefe de Servicio de Asistencia Técnica y Obras';

  const footerY = pageHeight - 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Informe emitido por el Jefe del Servicio: ${firmanteTexto} · Diputación Provincial de Cádiz`, 14, footerY);

  doc.save(`Informe_Rendimiento_ADL_${fechaHoy.replace(/\//g, '-')}.pdf`);
}

/**
 * Genera el informe formal en PDF de un Requerimiento de Subsanación (con trazabilidad de ronda y firma técnica)
 */
export function generarInformeSubsanacionPDF(
  actuacion: Actuacion,
  documento: DocumentoActuacion,
  ronda: RondaSubsanacion,
  usuarioFirmante: User | null
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryNavy: [number, number, number] = [0, 51, 102];
  const goldAccent: [number, number, number] = [197, 155, 39];
  const amberWarning: [number, number, number] = [180, 83, 9];

  // 1. Cabecera Institucional
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(...goldAccent);
  doc.rect(0, 26, pageWidth, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('EXCMA. DIPUTACIÓN PROVINCIAL DE CÁDIZ', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 230, 242);
  doc.text('Área de Desarrollo Local · Servicio de Asistencia Técnica y Obras (Planifica v1.0)', 14, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(252, 224, 130);
  doc.text('SEDE ELECTRÓNICA OFICIAL', pageWidth - 14, 12, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`CSV: ${ronda.csv}`, pageWidth - 14, 18, { align: 'right' });

  // 2. Título Oficial del Requerimiento
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const tituloRonda = ronda.numeroRonda === 1
    ? 'REQUERIMIENTO OFICIAL DE SUBSANACIÓN TÉCNICA (RONDA INICIAL)'
    : `REQUERIMIENTO DE SUBSANACIÓN TÉCNICA (RONDA Nº ${ronda.numeroRonda})`;
  doc.text(tituloRonda, 14, 38);

  doc.setFontSize(9.5);
  doc.setTextColor(...amberWarning);
  doc.text('CONTROL Y COMPROBACIÓN FORMAL DE DOCUMENTACIÓN · BASE 14', 14, 44);

  // 3. Tabla de Metadatos de la Actuación y Documento
  autoTable(doc, {
    startY: 48,
    head: [['DATOS DEL EXPEDIENTE Y ENTIDAD LOCAL', 'DATOS DE LA REVISIÓN TÉCNICA']],
    body: [
      [
        `Entidad Local: ${actuacion.entidadLocal}\nPlan: ${actuacion.plan}\nActuación Nº: ${actuacion.numero} - ${actuacion.titulo}\nExpediente: ${actuacion.id}`,
        `Documento: ${documento.codigo} - ${documento.titulo}\nFecha Emisión: ${formatearFechaHora(ronda.fechaHora)}\nTécnico Revisor: ${ronda.tecnicoNombre}\nCargo: ${ronda.tecnicoCargo}`
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: { fillColor: primaryNavy, textColor: [255, 255, 255], fontStyle: 'bold' }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 6;

  // 4. Texto Legal Introductorio
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const textoIntro =
    `De conformidad con lo dispuesto en las Bases Reguladoras de la convocatoria (Base 14) y en la legislación vigente, tras el examen del documento técnico de referencia, se REQUIERE a la Entidad Local destinataria para que en el plazo improrrogable de DIEZ (10) DÍAS HÁBILES proceda a la subsanación de las deficiencias que a continuación se detallan:`;
  const splitIntro = doc.splitTextToSize(textoIntro, pageWidth - 28);
  doc.text(splitIntro, 14, currentY);
  currentY += splitIntro.length * 4.2 + 4;

  // 5. Tabla de Deficiencias y Motivos de Subsanación
  const tablaDeficiencias = ronda.deficiencias.map((def, idx) => {
    let motivosStr = '';
    if (def.subsanaciones && def.subsanaciones.length > 0) {
      motivosStr = def.subsanaciones.map((m, mIdx) => `${mIdx + 1}) ${m}`).join('\n');
    } else {
      motivosStr = def.observacion || 'Falta documento preceptivo';
    }

    return [
      `${idx + 1}`,
      def.campo,
      motivosStr,
      def.descripcion || 'Base 14'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Nº', 'Requisito Comprobado', 'Deficiencias y Motivos de Subsanación Requeridos', 'Referencia']],
    body: tablaDeficiencias,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 10 },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 85, textColor: [153, 27, 27] },
      3: { cellWidth: 32, fontStyle: 'italic', textColor: [100, 116, 139] }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 6. Advertencia de tramitación
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const advertencia =
    `AVISO: La documentación subsanada deberá registrarse exclusivamente a través de la sede electrónica de la Diputación Provincial de Cádiz (https://sede.dipucadiz.es) referenciando el expediente ${actuacion.id}. Transcurrido el plazo concedido sin haberse aportado la documentación requerida, se procederá conforme a las bases reguladoras.`;
  const splitAdv = doc.splitTextToSize(advertencia, pageWidth - 28);
  doc.text(splitAdv, 14, currentY);
  currentY += splitAdv.length * 3.8 + 6;

  // 7. Sello de Firma Electrónica
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'FD');

  // Franja lateral del sello
  doc.setFillColor(...amberWarning);
  doc.roundedRect(14, currentY, 3, 28, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryNavy);
  doc.text('DOCUMENTO FIRMADO ELECTRÓNICAMENTE CON VALIDEZ JURÍDICA', 22, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Técnico Revisor: ${ronda.tecnicoNombre} · ${ronda.tecnicoCargo}`, 22, currentY + 13);
  doc.text(`Fecha y hora de firma digital: ${formatearFechaHora(ronda.fechaHora)}`, 22, currentY + 18);
  doc.setFont('courier', 'bold');
  doc.text(`Código Seguro de Verificación (CSV): ${ronda.csv}`, 22, currentY + 23);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('Verificación de autenticidad en: https://sede.dipucadiz.es/verifirma', pageWidth - 18, currentY + 23, { align: 'right' });

  // Pie de página
  const footerY = pageHeight - 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Planifica v1.0 · Diputación Provincial de Cádiz · Ronda ${ronda.numeroRonda} · ${documento.codigo}`, 14, footerY);

  const nombreArchivo = `Requerimiento_Subsanacion_Ronda${ronda.numeroRonda}_${documento.codigo}_${actuacion.numero}.pdf`;
  doc.save(nombreArchivo);
}

/**
 * Genera el informe formal en PDF de Dictamen Técnico Favorable (Conforme) firmado electrónicamente
 */
export function generarInformeFavorablePDF(
  actuacion: Actuacion,
  documento: DocumentoActuacion,
  informeFavorable: InformeFavorableDocumento,
  usuarioFirmante: User | null
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryNavy: [number, number, number] = [0, 51, 102];
  const goldAccent: [number, number, number] = [197, 155, 39];
  const emeraldSuccess: [number, number, number] = [5, 150, 105];

  // 1. Cabecera Institucional
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(...goldAccent);
  doc.rect(0, 26, pageWidth, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('EXCMA. DIPUTACIÓN PROVINCIAL DE CÁDIZ', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 230, 242);
  doc.text('Área de Desarrollo Local · Servicio de Asistencia Técnica y Obras (Planifica v1.0)', 14, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(252, 224, 130);
  doc.text('DICTAMEN FAVORABLE', pageWidth - 14, 12, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`CSV: ${informeFavorable.csv}`, pageWidth - 14, 18, { align: 'right' });

  // 2. Título del Documento
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INFORME TÉCNICO FAVORABLE Y CALIFICACIÓN DE CONFORME', 14, 38);

  doc.setFontSize(9.5);
  doc.setTextColor(...emeraldSuccess);
  doc.text('CERTIFICACIÓN TÉCNICA DE JUSTIFICACIÓN · BASE 14', 14, 44);

  // 3. Ficha de Datos
  autoTable(doc, {
    startY: 48,
    head: [['DATOS IDENTIFICATIVOS DEL EXPEDIENTE', 'DOCUMENTO COMPROBADO Y CERTIFICADO']],
    body: [
      [
        `Entidad Local: ${actuacion.entidadLocal}\nPlan / Convocatoria: ${actuacion.plan}\nActuación Nº: ${actuacion.numero} - ${actuacion.titulo}\nExpediente: ${actuacion.id}`,
        `Código Documental: ${documento.codigo}\nTítulo: ${documento.titulo}\nCalificación: CONFORME (Favorable)\nFecha de Dictamen: ${formatearFechaHora(informeFavorable.fechaHoraFirma)}`
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: { fillColor: primaryNavy, textColor: [255, 255, 255], fontStyle: 'bold' }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;

  // 4. Cuerpo de la Certificación y Dictamen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryNavy);
  doc.text('CERTIFICACIÓN Y DICTAMEN TÉCNICO:', 14, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const parrafo1 = `D./Dña. ${informeFavorable.firmanteNombre}, en su condición de ${informeFavorable.firmanteCargo} adscrito/a al ${informeFavorable.firmanteDpto} de la Excma. Diputación Provincial de Cádiz, en ejercicio de las funciones de comprobación y verificación técnica de las subvenciones reguladas por la Base 14:`;
  const splitP1 = doc.splitTextToSize(parrafo1, pageWidth - 28);
  doc.text(splitP1, 14, currentY);
  currentY += splitP1.length * 4.4 + 4;

  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICA:', 14, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  const puntosCertificacion = [
    `PRIMERO.- Que se ha comprobado de manera exhaustiva el documento preceptivo "${documento.codigo}: ${documento.titulo}" presentado por la Entidad Local ${actuacion.entidadLocal}.`,
    `SEGUNDO.- Que dicho documento reúne la totalidad de los requisitos técnicos, económicos, formales y procedimentales exigidos por las Bases Reguladoras.`,
    `TERCERO.- Que todas las comprobaciones del checklist técnico han resultado plenamente conformes con dictamen positivo.`,
    documento.rondasSubsanacion && documento.rondasSubsanacion.length > 0
      ? `CUARTO.- Consta en el expediente la emisión de requerimiento(s) de subsanación técnica previo(s) (${documento.rondasSubsanacion.length} ronda(s)), habiendo sido subsanadas y regularizadas todas las incidencias por la Entidad Local a plena satisfacción técnica.`
      : `CUARTO.- No habiéndose detectado deficiencias sustanciales que impidan la continuidad del procedimiento de liquidación y abono.`,
    `QUINTO.- Por todo lo cual, se emite CALIFICACIÓN FAVORABLE DE CONFORME para el presente documento dentro de la cuenta justificativa de la actuación.`
  ];

  puntosCertificacion.forEach((punto) => {
    const splitP = doc.splitTextToSize(punto, pageWidth - 32);
    doc.text(splitP, 16, currentY);
    currentY += splitP.length * 4.3 + 3;
  });

  currentY += 4;

  // 5. Sello de Firma Electrónica Oficial (Borde Esmeralda)
  if (currentY > pageHeight - 48) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(14, currentY, pageWidth - 28, 30, 2, 2, 'FD');

  // Franja lateral verde esmeralda
  doc.setFillColor(...emeraldSuccess);
  doc.roundedRect(14, currentY, 3.5, 30, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70);
  doc.text('CERTIFICADO Y FIRMADO ELECTRÓNICAMENTE POR EL TÉCNICO COMPETENTE', 22, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Firmante: ${informeFavorable.firmanteNombre} (${informeFavorable.firmanteCargo})`, 22, currentY + 13);
  doc.text(`Departamento: ${informeFavorable.firmanteDpto}`, 22, currentY + 18);
  doc.text(`Fecha y hora de certificación electrónica: ${formatearFechaHora(informeFavorable.fechaHoraFirma)}`, 22, currentY + 23);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text(`CSV: ${informeFavorable.csv}`, 22, currentY + 27.5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('Autenticidad verificable en: https://sede.dipucadiz.es/verifirma', pageWidth - 18, currentY + 27.5, { align: 'right' });

  // Pie de página
  const footerY = pageHeight - 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Planifica v1.0 · Excma. Diputación Provincial de Cádiz · Dictamen Favorable · ${documento.codigo}`, 14, footerY);

  const nombreArchivo = `Dictamen_Favorable_Conforme_${documento.codigo}_${actuacion.numero}.pdf`;
  doc.save(nombreArchivo);
}

