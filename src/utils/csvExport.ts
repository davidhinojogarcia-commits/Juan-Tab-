import { Actuacion } from '../types';

export function exportarActuacionCSV(actuacion: Actuacion): void {
  const headers = [
    'Nº Documento',
    'Código Base 14',
    'Documento / Actuación',
    'Importe Inicial (€)',
    'Importe Última (€)',
    'Fecha Expedición Inicial',
    'Fecha Expedición Última',
    'Fecha Registro Inicial',
    'Fecha Registro Última',
    'Fecha Aprobación Inicial',
    'Fecha Aprobación Última',
    'Estado Justificación',
    'Revisión Completa',
    'Tiene Deficiencias',
    'Campos Conformes (✅)',
    'Campos No Conformes (❌)',
    'Detalle Observaciones Subsanación'
  ];

  const rows = actuacion.documentos.map((doc) => {
    const conformesCount = doc.camposRevisar.filter(c => c.estado === 'conforme').length;
    const noConformesCount = doc.camposRevisar.filter(c => c.estado === 'no_conforme').length;
    const deficienciasTexto = doc.camposRevisar
      .filter(c => c.estado === 'no_conforme')
      .map(c => `${c.campo}: ${c.observacion}`)
      .join(' | ');

    return [
      doc.orden,
      `"${doc.codigo}"`,
      `"${doc.titulo.replace(/"/g, '""')}"`,
      doc.metadatos.importeInicial || 0,
      doc.metadatos.importeUltima || 0,
      doc.metadatos.fechaExpedicionInicial || '',
      doc.metadatos.fechaExpedicionUltima || '',
      doc.metadatos.fechaRegistroInicial || '',
      doc.metadatos.fechaRegistroUltima || '',
      doc.metadatos.fechaAprobacionInicial || '',
      doc.metadatos.fechaAprobacionUltima || '',
      `"${doc.metadatos.estadoJustificacion || ''}"`,
      doc.revisadoCompleto ? 'SÍ' : 'NO',
      doc.tieneDeficiencias ? 'SÍ' : 'NO',
      conformesCount,
      noConformesCount,
      `"${deficienciasTexto.replace(/"/g, '""')}"`
    ].join(';');
  });

  const metadataInfo = [
    `"ACTUACIÓN:";"${actuacion.numero} - ${actuacion.titulo.replace(/"/g, '""')}"`,
    `"ENTIDAD LOCAL:";"${actuacion.entidadLocal}"`,
    `"PLAN:";"${actuacion.plan}"`,
    `"PLAZO EJECUCIÓN:";"${actuacion.plazos.plazoEjecucion}"`,
    `"PLAZO JUSTIFICACIÓN:";"${actuacion.plazos.plazoJustificacion}"`,
    `"IMPORTE ACTUACIÓN:";"${actuacion.importes.importeActuacion}"`,
    `"IMPORTE CONCESIÓN:";"${actuacion.importes.importeConcesion}"`,
    `"IMPORTE ADJUDICACIÓN:";"${actuacion.importes.importeAdjudicacion}"`,
    `"TOTAL JUSTIFICADO EN PLAZO:";"${actuacion.liquidacion.justificadoEnPlazo}"`,
    `"NO JUSTIFICADO:";"${actuacion.liquidacion.noJustificado}"`,
    ''
  ].join('\r\n');

  const csvContent = '\uFEFF' + metadataInfo + '\r\n' + headers.join(';') + '\r\n' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ADL_Actuacion_${actuacion.numero}_Base14.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportarTodasActuacionesCSV(actuaciones: Actuacion[]): void {
  const headers = [
    'ID',
    'Nº',
    'Plan / Programa',
    'Entidad Local',
    'Título Actuación',
    'Estado General',
    'Técnico Asignado',
    'Plazo Ejecución',
    'Plazo Justificación',
    'Importe Actuación (€)',
    'Importe Concesión (€)',
    'Importe Adjudicación (€)',
    'Justificado en Plazo (€)',
    'Justificado con Deficiencias (€)',
    'No Justificado (€)',
    'Fecha Última Modificación'
  ];

  const rows = actuaciones.map((a) => {
    return [
      `"${a.id}"`,
      `"${a.numero}"`,
      `"${a.plan.replace(/"/g, '""')}"`,
      `"${a.entidadLocal.replace(/"/g, '""')}"`,
      `"${a.titulo.replace(/"/g, '""')}"`,
      `"${a.estadoGeneral}"`,
      `"${a.tecnicoAsignadoNombre.replace(/"/g, '""')}"`,
      `"${a.plazos.plazoEjecucion}"`,
      `"${a.plazos.plazoJustificacion}"`,
      a.importes.importeActuacion,
      a.importes.importeConcesion,
      a.importes.importeAdjudicacion,
      a.liquidacion.justificadoEnPlazo,
      a.liquidacion.justificadoEnPlazoConDeficiencias,
      a.liquidacion.noJustificado,
      `"${a.fechaModificacion}"`
    ].join(';');
  });

  const csvContent = '\uFEFF' + headers.join(';') + '\r\n' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ADL_Diputacion_Cadiz_Listado_Actuaciones.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportarRendimientoCSV(actuaciones: Actuacion[]): void {
  const headers = [
    'Nº Actuación',
    'Entidad Local',
    'Título de la Actuación',
    'Plan Provincial',
    'Técnico Revisor',
    'Estado General',
    'Docs Revisados (de 22)',
    'Porcentaje Avance (%)',
    'Presupuesto Actuación (€)',
    'Concesión Provincial (€)',
    'Adjudicación (€)',
    'Justificado en Plazo (€)',
    'Justificado Fuera de Plazo (€)',
    'Propuesta de Reintegro (€)',
    'Fecha de Auditoría'
  ];

  const rows = actuaciones.map((a) => {
    const docsRev = a.documentos.filter((d) => d.revisadoCompleto).length;
    const porc = ((docsRev / 22) * 100).toFixed(2);
    return [
      `"${a.numero}"`,
      `"${a.entidadLocal.replace(/"/g, '""')}"`,
      `"${a.titulo.replace(/"/g, '""')}"`,
      `"${a.plan.replace(/"/g, '""')}"`,
      `"${a.tecnicoAsignadoNombre.replace(/"/g, '""')}"`,
      `"${a.estadoGeneral}"`,
      docsRev,
      `"${porc}%"`,
      a.importes.importeActuacion,
      a.importes.importeConcesion,
      a.importes.importeAdjudicacion,
      a.liquidacion.justificadoEnPlazo,
      a.liquidacion.justificadoFueraDePlazo,
      a.liquidacion.noJustificado,
      `"${new Date().toISOString()}"`
    ].join(';');
  });

  const fechaHoy = new Date().toISOString().split('T')[0];
  const csvContent = '\uFEFF' + headers.join(';') + '\r\n' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ADL_Informe_Rendimiento_JefeServicio_${fechaHoy}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

