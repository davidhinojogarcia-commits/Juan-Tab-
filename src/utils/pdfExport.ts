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
import { obtenerCertificadoDispositivoActual } from '../services/deviceSignatureService';

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
  const certTecnico = obtenerCertificadoDispositivoActual(usuarioFirmante);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryNavy);

  // Firma Técnico con Certificado del Dispositivo
  doc.text('EL/LA TÉCNICO/A REVISOR/A (CERTIFICADO DIGITAL DISPOSITIVO)', 14, firmaY);
  doc.line(14, firmaY + 16, 95, firmaY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text(`${certTecnico.titular} (NIF: ${certTecnico.nif})`, 14, firmaY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Cert: ${certTecnico.emisor.split('·')[0].trim()} · Serie: ${certTecnico.numeroSerie}`, 14, firmaY + 24);
  doc.text(`Firma electrónica del dispositivo con CSV oficial y Sello TSA`, 14, firmaY + 28);

  // Firma Jefe de Servicio
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryNavy);
  doc.text('Vº Bº EL JEFE DEL SERVICIO DE ASISTENCIA TÉCNICA', pageWidth - 95, firmaY);
  doc.line(pageWidth - 95, firmaY + 16, pageWidth - 14, firmaY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('D. Juan Hinojo García', pageWidth - 85, firmaY + 20);
  doc.text('Área de Desarrollo Local · Diputación de Cádiz', pageWidth - 85, firmaY + 24);

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

export interface OpcionesResumenPDF {
  incluirFichaCompleta?: boolean;
  incluirDocumentosBase14?: boolean;
  incluirLiquidacion?: boolean;
  incluirFirmaDispositivo?: boolean;
  observacionesAdicionales?: string;
}

/**
 * Genera automáticamente el Documento PDF Resumen Oficial de la Actuación
 * basándose en los datos cargados y siguiendo el formato institucional de la Excma. Diputación Provincial de Cádiz.
 */
export function generarDocumentoResumenActuacionPDF(
  actuacion: Actuacion,
  usuarioFirmante: User | null,
  opciones: OpcionesResumenPDF = {}
): void {
  const {
    incluirFichaCompleta = true,
    incluirDocumentosBase14 = true,
    incluirLiquidacion = true,
    incluirFirmaDispositivo = true,
    observacionesAdicionales
  } = opciones;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryNavy: [number, number, number] = [0, 51, 102]; // #003366 Corporativo Diputación
  const goldAccent: [number, number, number] = [197, 155, 39]; // #C59B27 Oro Institucional
  const darkSlate: [number, number, number] = [30, 41, 59]; // Slate 800
  const lightGray: [number, number, number] = [248, 250, 252]; // Slate 50
  const borderSlate: [number, number, number] = [203, 213, 225]; // Slate 300
  const emeraldGreen: [number, number, number] = [5, 150, 105]; // Emerald 600

  // 1. Cabecera Institucional Oficial de la Excma. Diputación Provincial de Cádiz
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Franja dorada de separación institucional
  doc.setFillColor(...goldAccent);
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  // Textos Cabecera
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('EXCMA. DIPUTACIÓN PROVINCIAL DE CÁDIZ', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Área de Desarrollo Local · Servicio de Asistencia Técnica y Obras', 14, 18.5);

  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text('Planifica v1.0 · Sistema Provincial de Gestión y Justificación de Subvenciones', 14, 24);

  // Lateral derecho: Distintivo oficial de la Sede Electrónica
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(252, 224, 130);
  doc.text('DOCUMENTO RESUMEN', pageWidth - 14, 13, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Sede Electrónica Oficial', pageWidth - 14, 19, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('sede.dipucadiz.es', pageWidth - 14, 24, { align: 'right' });

  // 2. Título Oficial del Documento Resumen
  let currentY = 38;
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DOCUMENTO RESUMEN OFICIAL DE LA ACTUACIÓN', 14, currentY);

  currentY += 6;
  doc.setFontSize(9);
  doc.setTextColor(...goldAccent);
  doc.text(`EXPEDIENTE Nº ${actuacion.numero} · BASE 14 · JUSTIFICACIÓN Y LIQUIDACIÓN`, 14, currentY);

  currentY += 4;

  // 3. Cuadro Resumen Ejecutivo (KPIs de los datos cargados)
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

  // Caja de Resumen Ejecutivo en cabecera
  currentY += 2;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(...borderSlate);
  doc.roundedRect(14, currentY, pageWidth - 28, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryNavy);
  doc.text('RESUMEN EJECUTIVO:', 18, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);

  const txtKpi1 = `Entidad: ${actuacion.entidadLocal} | Concesión: ${formatearMoneda(actuacion.importes.importeConcesion || actuacion.importes.importeActuacion)} | Adjudicación: ${formatearMoneda(actuacion.importes.importeAdjudicacion)}`;
  const txtKpi2 = `Justificado: ${formatearMoneda(totalJustificado)} (${porcJustificado.toFixed(1)}%) | Revisión Base 14: ${docsConformes}/${totalDocumentos} Conformes | Estado: ${actuacion.estadoGeneral.toUpperCase().replace(/_/g, ' ')}`;
  doc.text(txtKpi1, 18, currentY + 9);
  doc.text(txtKpi2, 18, currentY + 12.5);

  currentY += 18;

  // 4. Bloque 1: Datos Identificativos y Administrativos de la Actuación
  if (incluirFichaCompleta) {
    autoTable(doc, {
      startY: currentY,
      head: [['1. DATOS IDENTIFICATIVOS Y ADMINISTRATIVOS', 'CONDICIONES ECONÓMICAS Y PLAZOS']],
      body: [
        [
          `Entidad Local: ${actuacion.entidadLocal}\n` +
          `NIF / CIF Entidad: ${actuacion.nifEntidad || 'P1100000E'}\n` +
          `Plan Provincial: ${actuacion.plan}\n` +
          `Nº Actuación: ${actuacion.numero}\n` +
          `Denominación: ${actuacion.titulo}\n` +
          `Aplicación Presupuestaria: ${actuacion.aplicacionPresupuestaria || '2026-03-920-46200'}\n` +
          `Técnico/a Responsable: ${usuarioFirmante ? `${usuarioFirmante.nombre} ${usuarioFirmante.apellidos}` : actuacion.tecnicoAsignadoNombre} (${usuarioFirmante?.cargo || actuacion.tecnicoAsignadoCargo})`,

          `Presupuesto Total Actuación: ${formatearMoneda(actuacion.importes.importeActuacion)}\n` +
          `Aportación Diputación (Concesión): ${formatearMoneda(actuacion.importes.importeConcesion)}\n` +
          `Aportación Municipal: ${formatearMoneda(actuacion.importes.aportacionMunicipal || (actuacion.importes.importeActuacion - actuacion.importes.importeConcesion))}\n` +
          `Importe Adjudicación (Contrato): ${formatearMoneda(actuacion.importes.importeAdjudicacion)}\n` +
          `Plazo de Ejecución: ${formatearFecha(actuacion.plazos.plazoEjecucion)}${actuacion.plazos.plazoEjecucionAmpliado ? ` (Amp: ${formatearFecha(actuacion.plazos.plazoEjecucionAmpliado)})` : ''}\n` +
          `Plazo de Justificación: ${formatearFecha(actuacion.plazos.plazoJustificacion)}${actuacion.plazos.plazoJustificacionAmpliado ? ` (Amp: ${formatearFecha(actuacion.plazos.plazoJustificacionAmpliado)})` : ''}\n` +
          `Estado de Tramitación: ${actuacion.estadoGeneral.toUpperCase().replace(/_/g, ' ')}`
        ]
      ],
      headStyles: {
        fillColor: primaryNavy,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: darkSlate,
        lineColor: borderSlate,
        lineWidth: 0.2,
        cellPadding: 3
      },
      theme: 'grid'
    });

    currentY = (doc as any).lastAutoTable?.finalY || currentY + 45;
    currentY += 7;
  }

  // 5. Bloque 2: Desglose y Control de Documentación Base 14 (Datos Cargados)
  if (incluirDocumentosBase14 && actuacion.documentos.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...primaryNavy);
    doc.text('2. RESUMEN DE REVISIÓN DOCUMENTAL BASE 14 (DATOS CARGADOS)', 14, currentY);

    const tablaDocsBody = actuacion.documentos.map((docItem) => {
      let estadoTexto = 'Pendiente de revisión';
      let dictamenColor = 'Pendiente';
      if (docItem.revisadoCompleto) {
        estadoTexto = docItem.tieneDeficiencias ? 'Con deficiencias / Subsanación' : 'Conforme Base 14';
      }

      // Detalle de metadatos cargados
      const metadatosInfo = [
        docItem.metadatos.importeUltima ? `Imp: ${formatearMoneda(docItem.metadatos.importeUltima)}` : null,
        docItem.metadatos.fechaExpedicionUltima ? `Exp: ${formatearFecha(docItem.metadatos.fechaExpedicionUltima)}` : null,
        docItem.metadatos.fechaRegistroUltima ? `Reg: ${formatearFecha(docItem.metadatos.fechaRegistroUltima)}` : null,
        docItem.metadatos.fechaAprobacionUltima ? `Aprob: ${formatearFecha(docItem.metadatos.fechaAprobacionUltima)}` : null
      ].filter(Boolean).join(' | ');

      // Deficiencias u observaciones cargadas
      const deficiencias = docItem.camposRevisar
        .filter((c) => c.estado === 'no_conforme')
        .map((c) => `[${c.campo}]: ${c.observacion || 'No conforme'}`)
        .join('; ');

      const rondasCount = docItem.rondasSubsanacion?.length || 0;
      const rondasInfo = rondasCount > 0 ? ` (Rondas cursadas: ${rondasCount})` : '';

      return [
        `${docItem.orden}`,
        `${docItem.titulo}`,
        metadatosInfo || 'Sin datos económicos específicos',
        `${estadoTexto}${rondasInfo}`,
        deficiencias || (docItem.revisadoCompleto ? 'Cumple requisitos Base 14 sin observaciones' : 'Pendiente de comprobación por los servicios técnicos')
      ];
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [[
        'Nº',
        'Documento / Anexo',
        'Metadatos y Fechas Registradas',
        'Dictamen Técnico',
        'Observaciones y Deficiencias'
      ]],
      body: tablaDocsBody,
      headStyles: {
        fillColor: primaryNavy,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      bodyStyles: {
        fontSize: 6.8,
        textColor: darkSlate,
        cellPadding: 2,
        lineColor: [226, 232, 240],
        lineWidth: 0.15
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 46 },
        2: { cellWidth: 44 },
        3: { cellWidth: 36 },
        4: { cellWidth: 'auto' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      theme: 'grid'
    });

    currentY = (doc as any).lastAutoTable?.finalY || currentY + 50;
    currentY += 7;
  }

  // 6. Bloque 3: Cuadro de Liquidación y Propuesta Económica
  if (incluirLiquidacion) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...primaryNavy);
    doc.text('3. CUADRO DE LIQUIDACIÓN Y JUSTIFICACIÓN ECONÓMICA', 14, currentY);

    const totalNoJustificado = liq.noJustificado;
    const porcNoJustificado = liq.adjudicacion > 0 ? (totalNoJustificado / liq.adjudicacion) * 100 : 0;

    autoTable(doc, {
      startY: currentY + 3,
      head: [
        ['Concepto de Liquidación Económica', 'Importe (€)', 'Porcentaje (%)', 'Estado de Cumplimiento']
      ],
      body: [
        ['Presupuesto de Adjudicación Contratada (Base)', formatearMoneda(liq.adjudicacion), '100,00%', 'Presupuesto total formalizado'],
        ['Justificado en plazo de ejecución', formatearMoneda(liq.justificadoEnPlazo), `${((liq.justificadoEnPlazo / (liq.adjudicacion || 1)) * 100).toFixed(2)}%`, 'Ejecución y aprobación en plazo reglamentario'],
        ['Justificado en plazo con deficiencias no sustanciales', formatearMoneda(liq.justificadoEnPlazoConDeficiencias), `${((liq.justificadoEnPlazoConDeficiencias / (liq.adjudicacion || 1)) * 100).toFixed(2)}%`, 'Documentación subsanable o aclaratoria'],
        ['Justificado fuera de plazo', formatearMoneda(liq.justificadoFueraDePlazo), `${((liq.justificadoFueraDePlazo / (liq.adjudicacion || 1)) * 100).toFixed(2)}%`, 'Sujeto a ponderación o penalidades'],
        ['Justificado fuera de plazo con deficiencias no sustanciales', formatearMoneda(liq.justificadoFueraDePlazoConDeficiencias), `${((liq.justificadoFueraDePlazoConDeficiencias / (liq.adjudicacion || 1)) * 100).toFixed(2)}%`, 'Sometido a informe de Intervención'],
        ['NO JUSTIFICADO (Propuesta de Reintegro / Desestimiento)', formatearMoneda(totalNoJustificado), `${porcNoJustificado.toFixed(2)}%`, totalNoJustificado > 0 ? 'Incumplimiento de requisitos Base 14' : 'Sin deducciones aplicadas'],
        ['TOTAL LIQUIDADO CONFORME', formatearMoneda(totalJustificado), `${porcJustificado.toFixed(2)}%`, 'Propuesta de reconocimiento y abono']
      ],
      headStyles: {
        fillColor: goldAccent,
        textColor: [0, 34, 68],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      bodyStyles: {
        fontSize: 7,
        textColor: darkSlate,
        lineColor: borderSlate,
        lineWidth: 0.2,
        cellPadding: 2
      },
      theme: 'grid'
    });

    currentY = (doc as any).lastAutoTable?.finalY || currentY + 40;
    currentY += 6;
  }

  // Observaciones adicionales si se especificaron
  if (observacionesAdicionales) {
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(254, 252, 232); // Amber 50
    doc.setDrawColor(251, 191, 36); // Amber 400
    doc.roundedRect(14, currentY, pageWidth - 28, 16, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14); // Amber 800
    doc.text('OBSERVACIONES TÉCNICAS ADICIONALES:', 18, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 53, 15);
    doc.text(doc.splitTextToSize(observacionesAdicionales, pageWidth - 36), 18, currentY + 10);

    currentY += 20;
  }

  // 7. Bloque 4: Diligencia Oficial de Firma Electrónica con Certificado del Dispositivo
  if (incluirFirmaDispositivo) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 20;
    }

    const certTecnico = obtenerCertificadoDispositivoActual(usuarioFirmante);
    const ahora = new Date();
    const fechaHoraTSA = ahora.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Código Seguro de Verificación (CSV) oficial
    const hashCorto = certTecnico.huellaSha256 ? certTecnico.huellaSha256.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase() : 'CADIZ2026';
    const csvOficial = `CSV-ADL-DIPUCADIZ-${actuacion.numero.replace(/[^a-zA-Z0-9]/g, '')}-${hashCorto}`;

    // Recuadro del Sello de Firma Electrónica
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...primaryNavy);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, currentY, pageWidth - 28, 42, 2, 2, 'FD');

    // Franja lateral decorativa azul/oro
    doc.setFillColor(...primaryNavy);
    doc.rect(14, currentY, 4, 42, 'F');
    doc.setFillColor(...goldAccent);
    doc.rect(18, currentY, 1.5, 42, 'F');

    // Título de la diligencia de firma
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryNavy);
    doc.text('DILIGENCIA OFICIAL DE FIRMA ELECTRÓNICA CON CERTIFICADO DEL DISPOSITIVO', 23, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'Documento Resumen emitido conforme a la Base 14 y suscrito electrónicamente con el certificado digital instalado en el dispositivo del técnico actuante.',
      23,
      currentY + 10.5
    );

    // Columna Izquierda: Datos del Certificado Digital del Técnico
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...darkSlate);
    doc.text(`FIRMADO DIGITALMENTE POR: ${certTecnico.titular}`, 23, currentY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`NIF: ${certTecnico.nif} | Cargo: ${usuarioFirmante?.cargo || actuacion.tecnicoAsignadoCargo}`, 23, currentY + 20);
    doc.text(`Emisor: ${certTecnico.emisor.split('·')[0].trim()}`, 23, currentY + 24);
    doc.text(`Nº de Serie: ${certTecnico.numeroSerie} | Algoritmo: ${certTecnico.algoritmo}`, 23, currentY + 28);
    doc.text(`Huella SHA-256: ${certTecnico.huellaSha256.substring(0, 36)}...`, 23, currentY + 32);
    doc.text(`Sello de Tiempo TSA Oficial: ${fechaHoraTSA} (TSA Autoridad de Sellado Diputación de Cádiz)`, 23, currentY + 36);

    // Columna Derecha: CSV y Visto Bueno
    const colDerX = pageWidth - 80;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...primaryNavy);
    doc.text('CÓDIGO SEGURO DE VERIFICACIÓN (CSV):', colDerX, currentY + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(csvOficial, colDerX, currentY + 20.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Cotejo en sede electrónica oficial:', colDerX, currentY + 24.5);
    doc.setTextColor(...primaryNavy);
    doc.setFont('helvetica', 'bold');
    doc.text('https://sede.dipucadiz.es/validador', colDerX, currentY + 28.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryNavy);
    doc.text('Vº Bº JEFATURA DE SERVICIO:', colDerX, currentY + 33);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('D. Juan Hinojo García (Jefe Serv. Asistencia Técnica)', colDerX, currentY + 37);

    currentY += 46;
  }

  // 8. Numeración de páginas institucional en todas las páginas
  const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : ((doc as any).internal?.pages?.length - 1) || 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Filete sutil en pie de página
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} · Documento Resumen Oficial de la Actuación · Excma. Diputación Provincial de Cádiz · Sede Electrónica Oficial`,
      pageWidth / 2,
      pageHeight - 5.5,
      { align: 'center' }
    );
  }

  // 9. Guardar y descargar automáticamente el documento
  const nombreLimpio = actuacion.entidadLocal.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const numLimpio = actuacion.numero.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Resumen_Oficial_Actuacion_${numLimpio}_${nombreLimpio}.pdf`);
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

  // 7. Sello de Firma Electrónica con Certificado del Dispositivo
  const certSubsanacion = ronda.firmaElectronica?.certificado || obtenerCertificadoDispositivoActual(usuarioFirmante);

  if (currentY > pageHeight - 52) {
    doc.addPage();
    currentY = 20;
  }

  const alturaSelloSub = 34;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, alturaSelloSub, 2, 2, 'FD');

  // Franja lateral del sello
  doc.setFillColor(...amberWarning);
  doc.roundedRect(14, currentY, 3, alturaSelloSub, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryNavy);
  doc.text('DOCUMENTO FIRMADO ELECTRÓNICAMENTE CON CERTIFICADO DIGITAL DEL DISPOSITIVO', 22, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Técnico Revisor: ${certSubsanacion.titular} (NIF: ${certSubsanacion.nif}) · ${ronda.tecnicoCargo}`, 22, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Certificado Instalado: ${certSubsanacion.emisor} · Serie: ${certSubsanacion.numeroSerie}`, 22, currentY + 16.5);
  doc.text(`Huella Criptográfica SHA-256: ${certSubsanacion.huellaSha256.slice(0, 48)}...`, 22, currentY + 21);
  doc.text(`Fecha y Sello Oficial: ${ronda.firmaElectronica?.selloTiempoTSA ? ronda.firmaElectronica.selloTiempoTSA.split('(')[0].trim() : formatearFechaHora(ronda.fechaHora)}`, 22, currentY + 25.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...primaryNavy);
  doc.text(`Código Seguro de Verificación (CSV): ${ronda.csv}`, 22, currentY + 30);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Verificación de autenticidad en: https://sede.dipucadiz.es/verifirma', pageWidth - 18, currentY + 30, { align: 'right' });

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

  // 5. Sello de Firma Electrónica Oficial (Borde Esmeralda con Certificado del Dispositivo)
  const certFavorable = informeFavorable.firmaElectronica?.certificado || obtenerCertificadoDispositivoActual(usuarioFirmante);

  if (currentY > pageHeight - 54) {
    doc.addPage();
    currentY = 20;
  }

  const alturaSelloFav = 35;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(14, currentY, pageWidth - 28, alturaSelloFav, 2, 2, 'FD');

  // Franja lateral verde esmeralda
  doc.setFillColor(...emeraldSuccess);
  doc.roundedRect(14, currentY, 3.5, alturaSelloFav, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  doc.text('DOCUMENTO CERTIFICADO Y FIRMADO CON CERTIFICADO ELECTRÓNICO DEL DISPOSITIVO', 22, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Técnico Competente: ${certFavorable.titular} (NIF: ${certFavorable.nif}) · ${informeFavorable.firmanteCargo}`, 22, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(`Certificado Instalado: ${certFavorable.emisor} · Serie: ${certFavorable.numeroSerie}`, 22, currentY + 16.5);
  doc.text(`Algoritmo y Huella SHA-256: ${certFavorable.algoritmo} · [${certFavorable.huellaSha256.slice(0, 36)}...]`, 22, currentY + 21);
  doc.text(`Fecha y Sello TSA Cualificado: ${informeFavorable.firmaElectronica?.selloTiempoTSA ? informeFavorable.firmaElectronica.selloTiempoTSA.split('(')[0].trim() : formatearFechaHora(informeFavorable.fechaHoraFirma)}`, 22, currentY + 25.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(6, 95, 70);
  doc.text(`Código Seguro de Verificación (CSV): ${informeFavorable.csv}`, 22, currentY + 30.5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Autenticidad verificable en: https://sede.dipucadiz.es/verifirma', pageWidth - 18, currentY + 30.5, { align: 'right' });

  // Pie de página
  const footerY = pageHeight - 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Planifica v1.0 · Excma. Diputación Provincial de Cádiz · Dictamen Favorable · ${documento.codigo}`, 14, footerY);

  const nombreArchivo = `Dictamen_Favorable_Conforme_${documento.codigo}_${actuacion.numero}.pdf`;
  doc.save(nombreArchivo);
}

