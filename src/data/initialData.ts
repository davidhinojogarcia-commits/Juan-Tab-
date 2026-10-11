import { Actuacion, DocumentoActuacion, CampoRevisar, User, PlanSubvencion, ComentarioActuacion } from '../types';

export interface GrupoSubsanacion {
  categoria: string;
  motivos: string[];
}

export const GRUPOS_SUBSANACION: GrupoSubsanacion[] = [
  {
    categoria: 'Memoria y Proyecto Técnico',
    motivos: [
      'Falta el objeto de la actuación',
      'Faltan las necesidades a satisfacer',
      'Falta memoria descriptiva y justificación técnica',
      'Falta presupuesto detallado / desglose de unidades',
      'Falta plazo previsto de ejecución',
      'Falta plano de situación / emplazamiento',
      'Falta acreditación de la titularidad o disponibilidad de los terrenos'
    ]
  },
  {
    categoria: 'Firmas, Resoluciones y Registro',
    motivos: [
      'Falta firma del técnico competente',
      'Falta firma de Alcaldía / Presidencia',
      'Falta aprobación por resolución de Alcaldía / Junta de Gobierno',
      'Falta registro de entrada en sede electrónica',
      'Contenido mínimo incompleto'
    ]
  },
  {
    categoria: 'Económico, Facturación y Justificación',
    motivos: [
      'Discrepancia en importes respecto a la adjudicación',
      'Factura no acompañada de justificante bancario de pago',
      'Fecha de expedición fuera de plazo de ejecución',
      'Fotografías sin georreferenciación o cartel no conforme',
      'Falta certificación de no concurrencia de otras subvenciones',
      'Falta documento preceptivo',
      'Documento desactualizado'
    ]
  }
];

export const RESPUESTAS_TIPO_SUBSANACION = [
  'Falta el objeto de la actuación',
  'Faltan las necesidades a satisfacer',
  'Falta memoria descriptiva y justificación técnica',
  'Falta presupuesto detallado / desglose de unidades',
  'Falta plazo previsto de ejecución',
  'Falta plano de situación / emplazamiento',
  'Falta acreditación de la titularidad o disponibilidad de los terrenos',
  'Falta firma del técnico competente',
  'Falta firma de Alcaldía / Presidencia',
  'Falta aprobación por resolución de Alcaldía / Junta de Gobierno',
  'Falta registro de entrada en sede electrónica',
  'Contenido mínimo incompleto',
  'Discrepancia en importes respecto a la adjudicación',
  'Factura no acompañada de justificante bancario de pago',
  'Fecha de expedición fuera de plazo de ejecución',
  'Fotografías sin georreferenciación o cartel no conforme',
  'Falta certificación de no concurrencia de otras subvenciones',
  'Falta documento preceptivo',
  'Documento desactualizado'
];

export const USUARIOS_INICIALES: User[] = [
  {
    id: 'usr-jefe-1',
    nombre: 'Juan',
    apellidos: 'Hinojo García',
    email: 'juan.tabu.oficial@gmail.com',
    rol: 'jefe_servicio',
    departamento: 'Área de Desarrollo Local',
    cargo: 'Jefe del Servicio de Asistencia Técnica y Obras',
    telefono: '+34 956 240 100',
    biometriaHabilitada: true,
    dosFactoresHabilitado: true,
    activo: true,
    fechaAlta: '2024-01-10',
    permisos: {
      puedeEditarPlanes: true,
      puedeAsignarTecnicos: true,
      puedeCalificarDocumentos: true,
      puedeExportarInformes: true,
      puedeEnviarComentarios: true,
      puedeGestionarUsuarios: true
    },
    ultimoAcceso: '2026-09-25T09:15:00Z'
  },
  {
    id: 'usr-tec-1',
    nombre: 'Carmen',
    apellidos: 'Rivas Delgado',
    email: 'crivas@dipucadiz.es',
    rol: 'tecnico',
    departamento: 'Área de Desarrollo Local',
    cargo: 'Técnica Superior de Proyectos y Obras',
    telefono: '+34 956 240 114',
    biometriaHabilitada: true,
    dosFactoresHabilitado: false,
    activo: true,
    fechaAlta: '2024-02-15',
    permisos: {
      puedeEditarPlanes: false,
      puedeAsignarTecnicos: false,
      puedeCalificarDocumentos: true,
      puedeExportarInformes: true,
      puedeEnviarComentarios: true,
      puedeGestionarUsuarios: false
    },
    ultimoAcceso: '2026-09-25T08:45:00Z'
  },
  {
    id: 'usr-tec-2',
    nombre: 'Manuel',
    apellidos: 'Benítez Romero',
    email: 'mbenitez@dipucadiz.es',
    rol: 'tecnico',
    departamento: 'Área de Desarrollo Local',
    cargo: 'Arquitecto Técnico Inspector',
    telefono: '+34 956 240 128',
    biometriaHabilitada: false,
    dosFactoresHabilitado: true,
    activo: true,
    fechaAlta: '2024-03-01',
    permisos: {
      puedeEditarPlanes: false,
      puedeAsignarTecnicos: false,
      puedeCalificarDocumentos: true,
      puedeExportarInformes: true,
      puedeEnviarComentarios: true,
      puedeGestionarUsuarios: false
    },
    ultimoAcceso: '2026-09-24T16:30:00Z'
  },
  {
    id: 'usr-aud-1',
    nombre: 'Elena',
    apellidos: 'Morales Soto',
    email: 'emorales@dipucadiz.es',
    rol: 'auditor',
    departamento: 'Intervención y Control Financiero',
    cargo: 'Auditora de Fondos y Subvenciones',
    telefono: '+34 956 240 205',
    biometriaHabilitada: true,
    dosFactoresHabilitado: true,
    activo: true,
    fechaAlta: '2024-04-12',
    permisos: {
      puedeEditarPlanes: false,
      puedeAsignarTecnicos: false,
      puedeCalificarDocumentos: false,
      puedeExportarInformes: true,
      puedeEnviarComentarios: false,
      puedeGestionarUsuarios: false
    },
    ultimoAcceso: '2026-09-24T11:20:00Z'
  }
];

export const PLANTILLA_DOCUMENTOS_SOLICITUD: Omit<DocumentoActuacion, 'camposRevisar' | 'metadatos' | 'revisadoCompleto' | 'tieneDeficiencias'>[] = [
  {
    id: 'doc-sol-01',
    orden: 1,
    codigo: 'ANX-I',
    titulo: 'Modelo de Solicitud de la Subvención y Memoria Técnica (Anexo I)',
    subtitulo: 'Datos de la entidad local, descripción técnica, aplicación presupuestaria y plazos previstos',
    categoria: 'solicitud',
    fase: 'solicitud'
  },
  {
    id: 'doc-sol-02',
    orden: 2,
    codigo: 'ANX-II',
    titulo: 'Certificado de Aprobación del Proyecto o Memoria Valorada (Anexo II)',
    subtitulo: 'Acuerdo plenario o resolución del órgano competente de aprobación técnica de la actuación',
    categoria: 'solicitud',
    fase: 'solicitud'
  },
  {
    id: 'doc-sol-03',
    orden: 3,
    codigo: 'ANX-III',
    titulo: 'Certificado de Disponibilidad de Terrenos / Inmuebles (Anexo III)',
    subtitulo: 'Acreditación jurídica de la plena titularidad y disponibilidad de los bienes afectados',
    categoria: 'solicitud',
    fase: 'solicitud'
  },
  {
    id: 'doc-sol-04',
    orden: 4,
    codigo: 'ANX-IV',
    titulo: 'Certificado de Compatibilidad Urbanística y Licencias Sectoriales (Anexo IV)',
    subtitulo: 'Declaración de compatibilidad con el planeamiento y no concurrencia de otras ayudas',
    categoria: 'solicitud',
    fase: 'solicitud'
  },
  {
    id: 'doc-proy-01',
    orden: 5,
    codigo: 'PROY-OBRA',
    titulo: 'Proyecto Técnico / Memoria Valorada de las Obras',
    subtitulo: 'Memoria descriptiva y constructiva, planos acotados, pliego de prescripciones técnicas y presupuesto con mediciones',
    categoria: 'proyecto',
    fase: 'solicitud'
  }
];

export const PLANTILLA_DOCUMENTOS_BASE14: Omit<DocumentoActuacion, 'camposRevisar' | 'metadatos' | 'revisadoCompleto' | 'tieneDeficiencias'>[] = [
  {
    id: 'doc-01',
    orden: 5,
    codigo: 'ANX-IX',
    titulo: 'Certificado Adjudicación obra o ejecución directa o por medio propio no personificado (Anexo IX o IX.1 o IX.2)',
    subtitulo: 'Acreditación formal de adjudicación contractual o encomienda de gestión',
    categoria: 'adjudicacion',
    fase: 'justificacion'
  },
  {
    id: 'doc-02',
    orden: 6,
    codigo: 'ANX-IX-AT1',
    titulo: 'Certificado Adjudicación Asistencia Técnica 1 (Anexo IX)',
    subtitulo: 'Dirección de obra, redacción de proyecto o coordinación de seguridad',
    categoria: 'asistencia_tecnica',
    fase: 'justificacion'
  },
  {
    id: 'doc-03',
    orden: 7,
    codigo: 'ANX-IX-AT2',
    titulo: 'Certificado Adjudicación Asistencia Técnica 2 (Anexo IX)',
    subtitulo: 'Asistencia técnica adicional vinculada a la actuación',
    categoria: 'asistencia_tecnica',
    fase: 'justificacion'
  },
  {
    id: 'doc-04',
    orden: 8,
    codigo: 'ANX-IX-AT3',
    titulo: 'Certificado Adjudicación Asistencia Técnica 3 (Anexo IX)',
    subtitulo: 'Asistencia técnica complementaria (control de calidad/geotécnico)',
    categoria: 'asistencia_tecnica',
    fase: 'justificacion'
  },
  {
    id: 'doc-05',
    orden: 5,
    codigo: 'FOT-PUB',
    titulo: 'Fotografía cartel publicitario',
    subtitulo: 'Cartel informativo normalizado de la Diputación de Cádiz en el emplazamiento',
    categoria: 'fotografias'
  },
  {
    id: 'doc-06',
    orden: 6,
    codigo: 'FOT-INI',
    titulo: 'Fotografías zona anterior al inicio de las obras',
    subtitulo: 'Reportaje fotográfico del estado previo de los terrenos e instalaciones',
    categoria: 'fotografias'
  },
  {
    id: 'doc-07',
    orden: 7,
    codigo: 'ACT-REP',
    titulo: 'Acta de Comprobación Replanteo del Replanteo',
    subtitulo: 'Comprobación y viabilidad geométrica y disponibilidad de terrenos',
    categoria: 'replanteo'
  },
  {
    id: 'doc-08',
    orden: 8,
    codigo: 'CERT-01',
    titulo: 'Certificación 1',
    subtitulo: 'Primera certificación ordinaria mensual de obra ejecutada',
    categoria: 'certificaciones'
  },
  {
    id: 'doc-09',
    orden: 9,
    codigo: 'CERT-02',
    titulo: 'Certificación 2',
    subtitulo: 'Segunda certificación ordinaria mensual de obra ejecutada',
    categoria: 'certificaciones'
  },
  {
    id: 'doc-10',
    orden: 10,
    codigo: 'CERT-03',
    titulo: 'Certificación 3',
    subtitulo: 'Tercera certificación ordinaria mensual de obra ejecutada',
    categoria: 'certificaciones'
  },
  {
    id: 'doc-11',
    orden: 11,
    codigo: 'CERT-04',
    titulo: 'Certificación 4',
    subtitulo: 'Cuarta certificación ordinaria mensual de obra ejecutada',
    categoria: 'certificaciones'
  },
  {
    id: 'doc-12',
    orden: 12,
    codigo: 'CERT-05',
    titulo: 'Certificación 5',
    subtitulo: 'Quinta certificación ordinaria mensual de obra ejecutada',
    categoria: 'certificaciones'
  },
  {
    id: 'doc-13',
    orden: 13,
    codigo: 'CERT-06',
    titulo: 'Certificación 6',
    subtitulo: 'Sexta certificación ordinaria mensual de obra ejecutada',
    categoria: 'certificaciones'
  },
  {
    id: 'doc-14',
    orden: 14,
    codigo: 'FAC-AT1',
    titulo: 'Factura 1 Asistencia Técnica',
    subtitulo: 'Factura y abono de dirección de obra / coordinación',
    categoria: 'asistencia_tecnica'
  },
  {
    id: 'doc-15',
    orden: 15,
    codigo: 'FAC-AT2',
    titulo: 'Factura 2 Asistencia Técnica',
    subtitulo: 'Factura y abono de asistencia técnica complementaria',
    categoria: 'asistencia_tecnica'
  },
  {
    id: 'doc-16',
    orden: 16,
    codigo: 'FAC-AT3',
    titulo: 'Factura 3 Asistencia Técnica',
    subtitulo: 'Factura y abono de liquidación de asistencia técnica',
    categoria: 'asistencia_tecnica'
  },
  {
    id: 'doc-17',
    orden: 17,
    codigo: 'ACT-REC',
    titulo: 'Acta de Recepción de la obra o de reconocimiento y comprobación',
    subtitulo: 'Acta formal de entrega y recepción en plazo reglamentario',
    categoria: 'recepcion'
  },
  {
    id: 'doc-18',
    orden: 18,
    codigo: 'CERT-FIN',
    titulo: 'Certificación Final',
    subtitulo: 'Certificación final y liquidación de obra con relación valorada',
    categoria: 'certificaciones'
  },
  {
    id: 'doc-20',
    orden: 19,
    codigo: 'FOT-FIN',
    titulo: 'Fotografías de la actuación una vez finalizadas las obras',
    subtitulo: 'Reportaje gráfico del estado final tras la recepción de la actuación',
    categoria: 'fotografias'
  },
  {
    id: 'doc-21',
    orden: 21,
    codigo: 'ANX-XI',
    titulo: 'Informe Justificación de la Subvención (Anexo XI)',
    subtitulo: 'Memoria técnica explicativa del cumplimiento de la finalidad',
    categoria: 'justificacion'
  },
  {
    id: 'doc-22',
    orden: 22,
    codigo: 'ANX-XII',
    titulo: 'Certificado Cuenta Justificativa (Anexo XII)',
    subtitulo: 'Certificado de intervención de gastos e inversiones aplicadas',
    categoria: 'justificacion'
  }
];

export function generarChecklistPorDefecto(docId: string, docCodigo: string): CampoRevisar[] {
  switch (docCodigo) {
    case 'ANX-I':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Formulario oficial de Solicitud Anexo I firmado por la Alcaldía / Presidencia',
          descripcion: 'Suscripción electrónica por el representante legal de la entidad local',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Memoria descriptiva, justificación técnica y necesidad pública de la obra',
          descripcion: 'Detalle de los objetivos, beneficiarios y adecuación a los fines del Plan',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Aplicación presupuestaria municipal consignada y saldo disponible',
          descripcion: 'Identificación correcta de la partida contable (ej. 2026-03-920-46200)',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-4`,
          campo: 'Presupuesto estimativo desglosado e importe de subvención solicitada',
          descripcion: 'Conforme al límite máximo asignado al municipio en las bases aprobadas',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-5`,
          campo: 'Compromiso de ejecución dentro de los plazos máximos fijados por el Pleno',
          descripcion: 'Cronograma ajustado a los plazos límite de ejecución y justificación',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-6`,
          campo: 'Declaración responsable de cumplimiento del art. 13 Ley General de Subvenciones',
          descripcion: 'Acreditación de hallarse al corriente en obligaciones tributarias y con Seguridad Social',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'ANX-II':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Certificado de Secretaría con fe pública del acuerdo de aprobación de la actuación',
          descripcion: 'Resolución de Alcaldía, acuerdo de Junta de Gobierno Local o Pleno corporativo',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Aprobación formal del proyecto técnico de obras o memoria valorada',
          descripcion: 'Documento técnico suscrito por facultativo competente colegiado',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Compromiso expreso de financiación de eventuales bajas o excesos de liquidación',
          descripcion: 'Garantía municipal de cobertura ante desviaciones presupuestarias',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'ANX-III':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Certificado de Secretaría acreditativo de la plena disponibilidad jurídica de terrenos / inmuebles',
          descripcion: 'Afectación al dominio público, titularidad municipal o cesión administrativa vigente',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Constancia de inscripción en el Inventario Municipal de Bienes y Derechos',
          descripcion: 'Epígrafe registral y referencia catastral del emplazamiento de la actuación',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Inexistencia de cargas, gravámenes o litigios que impidan el inicio de las obras',
          descripcion: 'Disponibilidad real e inmediata del suelo sin condicionamientos jurídicos',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'ANX-IV':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Certificado municipal de no concurrencia de otras ayudas públicas incompatibles',
          descripcion: 'Garantía de no duplicidad de financiación pública sobre la misma actuación',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Certificación de compatibilidad con el planeamiento urbanístico (PGOU / NNSS)',
          descripcion: 'Uso y calificación del suelo conforme con la obra proyectada',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Informes y autorizaciones sectoriales preceptivas o acreditación de su solicitud',
          descripcion: 'Carreteras, Dominio Público Hidráulico, Costas, Vías Pecuarias o Medio Ambiente',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'PROY-OBRA':
    case 'PROY-TEC':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Memoria descriptiva, justificativa y constructiva completa suscrita por técnico competente',
          descripcion: 'Definición precisa del objeto, estado actual y soluciones técnicas proyectadas',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Planos generales y de detalle acotados con escala y definición suficiente',
          descripcion: 'Emplazamiento, plantas, alzados, secciones y detalles constructivos',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Pliego de prescripciones técnicas particulares (PPTP)',
          descripcion: 'Calidades de los materiales, condiciones de ejecución y ensayos exigibles',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-4`,
          campo: 'Presupuesto detallado con cuadro de precios unitarios y mediciones auxiliares',
          descripcion: 'Desglose por capítulos, precios descompuestos y resumen general de presupuesto',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-5`,
          campo: 'Estudio o Plan Básico de Seguridad y Salud / Plan de Gestión de Residuos',
          descripcion: 'Prevención de riesgos laborales y gestión medioambiental conforme a la normativa',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-6`,
          campo: 'Certificado o informe de aprobación técnica / supervisión municipal',
          descripcion: 'Aprobación técnica formal de la oficina de supervisión o servicios técnicos',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'ANX-IX':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Acuerdo de adjudicación del órgano competente municipal',
          descripcion: 'Resolución de Alcaldía o acuerdo de Junta de Gobierno Local / Pleno',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Identificación fehaciente del contratista adjudicatario y CIF',
          descripcion: 'Datos del licitador ganador conforme a la Plataforma de Contratación',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Importe de adjudicación desglosado (base imponible e IVA)',
          descripcion: 'No debe superar la concesión ni el presupuesto base de licitación',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-4`,
          campo: 'Firma electrónica válida del Secretario o Interventor municipal',
          descripcion: 'Certificado digital con sello de tiempo oficial',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-5`,
          campo: 'Fecha de adjudicación comprendida dentro del plazo fijado',
          descripcion: 'Verificar concordancia con las bases reguladoras del Plan',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'ANX-IX-AT1':
    case 'ANX-IX-AT2':
    case 'ANX-IX-AT3':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Certificado normalizado según Anexo IX suscrito por el Secretario',
          descripcion: 'Modelo oficial de la Diputación de Cádiz para Asistencia Técnica',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Identificación del técnico facultativo y número de colegiación',
          descripcion: 'Arquitecto, Ingeniero o Técnico competente designado',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Importe del contrato de servicios dentro de límites aprobados',
          descripcion: 'Desglose de honorarios e impuestos repercutibles',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-4`,
          campo: 'Firma y fecha de expedición dentro de los plazos de la actuación',
          descripcion: 'Acreditación formal previa o coetánea al inicio de los trabajos',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'FOT-PUB':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Presencia explícita del logotipo corporativo de la Diputación de Cádiz',
          descripcion: 'Conforme al Manual de Identidad Visual del Área de Desarrollo Local',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Mención exacta del Plan, Título de la Actuación e Importe Financiado',
          descripcion: 'Datos coincidentes con el decreto de concesión de la subvención',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Fotografía panorámica que acredite ubicación visible en el emplazamiento',
          descripcion: 'Instalado en lugar visible y de fácil acceso al público',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'FOT-INI':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Reportaje fotográfico del estado previo del viario o inmueble',
          descripcion: 'Mínimo 3 perspectivas de las zonas objeto de intervención',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Fecha de toma de fotografías previa al inicio material de las obras',
          descripcion: 'Metadatos EXIF o fecha fehaciente reflejada en la memoria',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'ACT-REP':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Acta formal de comprobación del replanteo suscrita por todas las partes',
          descripcion: 'Firma de la Dirección de Obra, Contratista y Representante municipal',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Declaración expresa de posesión y disponibilidad efectiva de los terrenos',
          descripcion: 'Sin obstáculos jurídicos ni materiales para la ejecución inmediata',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Fecha del acta dentro del plazo fijado en las bases reguladoras',
          descripcion: 'No posterior al plazo límite de replanteo estipulado',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'CERT-01':
    case 'CERT-02':
    case 'CERT-03':
    case 'CERT-04':
    case 'CERT-05':
    case 'CERT-06':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Relación valorada mensual suscrita por la Dirección Facultativa',
          descripcion: 'Detalle de unidades de obra ejecutadas en el periodo correspondiente',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Factura correspondiente a la certificación emitida por el contratista',
          descripcion: 'Factura electrónica conforme a normativa FACe / formato reglamentario',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Aprobación formal por el órgano de contratación municipal',
          descripcion: 'Resolución de Alcaldía o Concejal delegado competente',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-4`,
          campo: 'Registro de entrada oficial y fechas de expedición coherentes',
          descripcion: 'Secuencia temporal ordenada con las certificaciones previas',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-5`,
          campo: 'Importe acumulado no excede el presupuesto de adjudicación',
          descripcion: 'Control del límite económico contratado',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'FAC-AT1':
    case 'FAC-AT2':
    case 'FAC-AT3':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Factura reglamentaria a nombre de la Entidad Local beneficiaria',
          descripcion: 'Identificación completa del emisor, destinatario, concepto e impuestos',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Informe de conformidad emitido por los servicios técnicos municipales',
          descripcion: 'Acreditación de la efectiva prestación del servicio facultativo',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Justificante bancario fehaciente del pago (adeudo en cuenta)',
          descripcion: 'Extracto bancario oficial con sello o validación digital de la entidad',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'ACT-REC':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Acta de recepción suscrita por representante municipal, técnico y contratista',
          descripcion: 'Recepción a satisfacción de las obras con asistencia preceptiva',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Fecha de recepción formal dentro del plazo de ejecución subvencionado',
          descripcion: 'O en su caso dentro de la prórroga o ampliación concedida',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Fijación formal del plazo de garantía legal de las obras',
          descripcion: 'Mínimo 1 año conforme a la Ley de Contratos del Sector Público',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'CERT-FIN':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Certificación final y liquidación económica detallada de las obras',
          descripcion: 'Medición final completa y balance económico de todas las partidas',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Firma de la Dirección de Obra y aprobación del Ayuntamiento',
          descripcion: 'Acuerdo expreso del órgano de contratación municipal',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Concordancia matemática entre certificaciones parciales y final',
          descripcion: 'Sumatorio idéntico sin descuadres en base imponible ni cuota de IVA',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'MOD-PROY':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Memoria técnica justificativa y causas imprevistas de la modificación',
          descripcion: 'Conforme a los supuestos tasados en los artículos 204 y 205 de la LCSP',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Presupuesto adicional, cuadro de precios contradictorios y nuevas mediciones',
          descripcion: 'Desglose detallado del incremento o reajuste sin superar el límite legal',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Aprobación formal del modificado por el órgano de contratación municipal',
          descripcion: 'Resolución de Alcaldía o acuerdo plenario aprobando el proyecto modificado',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-4`,
          campo: 'Informe favorable preceptivo de la Dirección Facultativa y Supervisión',
          descripcion: 'Conformidad técnica expresa previa a la ejecución de las unidades modificadas',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-5`,
          campo: 'Documento contable de reajuste presupuestario / retención de crédito',
          descripcion: 'Acreditación de cobertura financiera y disponibilidad presupuestaria',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-6`,
          campo: 'Reajuste del plazo de ejecución o prórroga por la modificación contractual',
          descripcion: 'Determinación fehaciente del nuevo plazo de finalización de las obras',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'FOT-FIN':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Reportaje fotográfico exhaustivo de las obras totalmente finalizadas',
          descripcion: 'Imágenes nítidas desde los mismos ángulos de las fotos iniciales',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Evidencia gráfica del uso público y perfecto estado de conservación',
          descripcion: 'Acreditación de la puesta en servicio y operatividad del equipamiento',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'ANX-XI':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Informe técnico justificativo normalizado según Anexo XI oficial',
          descripcion: 'Memoria de ejecución de las obras y objetivos alcanzados',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Firma electrónica del Técnico Municipal responsable de la actuación',
          descripcion: 'Certificación fehaciente de la adecuada ejecución material',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Presentación formal en el registro dentro del plazo de justificación',
          descripcion: 'Comprobación del sello de entrada en sede electrónica provincial',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    case 'ANX-XII':
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Certificado de la Cuenta Justificativa suscrito por la Intervención municipal (Anexo XII)',
          descripcion: 'Relación clasificada de los gastos e inversiones de la actividad',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Declaración expresa de que las facturas han sido abonadas íntegramente',
          descripcion: 'Certificación de la efectividad de los pagos y su contabilización',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-3`,
          campo: 'Declaración de inexistencia de otras ayudas concurrentes incompatibles',
          descripcion: 'Garantía del principio de no sobrefinanciación pública',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-4`,
          campo: 'Firma electrónica válida del Secretario-Interventor o Interventor municipal',
          descripcion: 'Certificado digital oficial y fecha de expedición en plazo',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];

    default:
      return [
        {
          id: `${docId}-chk-1`,
          campo: 'Documento original aportado y legible',
          descripcion: 'Copia auténtica o documento firmado electrónicamente',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        },
        {
          id: `${docId}-chk-2`,
          campo: 'Firma preceptiva del técnico o autoridad municipal',
          descripcion: 'Validez y vigencia de las firmas electrónicas',
          estado: 'sin_revisar',
          observacion: '',
          requerido: true
        }
      ];
  }
}

export function construirDocumentosCompletos(): DocumentoActuacion[] {
  const todasLasPlantillas = [
    ...PLANTILLA_DOCUMENTOS_SOLICITUD,
    ...PLANTILLA_DOCUMENTOS_BASE14
  ];

  return todasLasPlantillas.map((plantilla, index) => ({
    ...plantilla,
    orden: index + 1,
    metadatos: {
      importeInicial: plantilla.categoria === 'adjudicacion' || plantilla.categoria === 'certificaciones' ? 0 : null,
      importeUltima: plantilla.categoria === 'adjudicacion' || plantilla.categoria === 'certificaciones' ? 0 : null,
      fechaExpedicionInicial: '',
      fechaExpedicionUltima: '',
      fechaRegistroInicial: '',
      fechaRegistroUltima: '',
      fechaAprobacionInicial: '',
      fechaAprobacionUltima: '',
      fechaRegistroAprobacionInicial: '',
      fechaRegistroAprobacionUltima: '',
      estadoJustificacion: 'Pendiente de calificar',
      observacionesGenerales: ''
    },
    camposRevisar: generarChecklistPorDefecto(plantilla.id, plantilla.codigo),
    revisadoCompleto: false,
    tieneDeficiencias: false
  }));
}

// Actuaciones iniciales representativas de la provincia de Cádiz
export const ACTUACIONES_INICIALES: Actuacion[] = [
  {
    id: 'ACT-2026-001',
    numero: '01',
    plan: 'Plan Cádiz Marcha 2024',
    entidadLocal: 'Ayuntamiento de Grazalema',
    titulo: 'Reurbanización, accesibilidad y mejora de saneamiento en Calle Las Piedras y Plaza Pequeña',
    aplicacionPresupuestaria: '2024-03-920-46200',
    plazos: {
      plazoEjecucion: '2025-10-31',
      plazoJustificacion: '2025-12-31',
      plazoEjecucionAmpliado: '2026-03-31',
      plazoJustificacionAmpliado: '2026-05-31'
    },
    importes: {
      importeActuacion: 175400.00,
      importeConcesion: 150000.00,
      importeAdjudicacion: 146820.50
    },
    estadoGeneral: 'en_revision',
    tecnicoAsignadoId: 'usr-tec-1',
    tecnicoAsignadoNombre: 'Carmen Rivas Delgado',
    fechaCreacion: '2026-02-10T08:30:00Z',
    fechaModificacion: '2026-09-24T14:20:00Z',
    observacionesInternas: 'Actuación prioritaria. Se han revisado las primeras certificaciones de obra.',
    liquidacion: {
      adjudicacion: 146820.50,
      justificadoEnPlazo: 146820.50,
      justificadoEnPlazoConDeficiencias: 0,
      justificadoFueraDePlazo: 0,
      justificadoFueraDePlazoConDeficiencias: 0,
      noJustificado: 0,
      observacionesLiquidacion: 'Obra ejecutada y justificada conforme a las bases sin incidencias sustanciales.'
    },
    documentos: (() => {
      const docs = construirDocumentosCompletos();
      // Preconfigurar doc 1 como conforme para demostrar auditoría y funcionamiento
      docs[0].camposRevisar[0].estado = 'conforme';
      docs[0].camposRevisar[1].estado = 'conforme';
      docs[0].camposRevisar[2].estado = 'conforme';
      docs[0].camposRevisar[3].estado = 'conforme';
      docs[0].camposRevisar[4].estado = 'conforme';
      docs[0].metadatos.importeInicial = 146820.50;
      docs[0].metadatos.importeUltima = 146820.50;
      docs[0].metadatos.fechaExpedicionInicial = '2026-03-15';
      docs[0].metadatos.fechaExpedicionUltima = '2026-03-15';
      docs[0].metadatos.fechaRegistroInicial = '2026-03-16';
      docs[0].metadatos.fechaRegistroUltima = '2026-03-16';
      docs[0].metadatos.fechaAprobacionInicial = '2026-03-14';
      docs[0].metadatos.fechaAprobacionUltima = '2026-03-14';
      docs[0].metadatos.fechaRegistroAprobacionInicial = '2026-03-15';
      docs[0].metadatos.fechaRegistroAprobacionUltima = '2026-03-15';
      docs[0].metadatos.estadoJustificacion = 'En plazo';
      docs[0].revisadoCompleto = true;
      docs[0].fechaHoraPrimerAcceso = '2026-09-24T09:12:30Z';
      docs[0].fechaHoraUltimoAcceso = '2026-09-24T09:35:10Z';
      docs[0].tecnicoUltimoAcceso = 'Carmen Rivas Delgado';

      // Doc 5 (PROY-OBRA: Proyecto Técnico) revisado por Juan Hinojo García
      docs[4].camposRevisar[0].estado = 'conforme';
      docs[4].camposRevisar[1].estado = 'conforme';
      docs[4].camposRevisar[2].estado = 'conforme';
      docs[4].metadatos.estadoJustificacion = 'En plazo';
      docs[4].revisadoCompleto = true;
      docs[4].fechaHoraPrimerAcceso = '2026-09-24T09:40:00Z';
      docs[4].fechaHoraUltimoAcceso = '2026-09-24T09:45:00Z';
      docs[4].tecnicoUltimoAcceso = 'Juan Hinojo García';
      docs[4].tecnicoRevisorOriginal = 'Juan Hinojo García';
      docs[4].tecnicosParticipantes = ['Juan Hinojo García'];

      return docs;
    })(),
    tecnicosParticipantes: ['Carmen Rivas Delgado', 'Juan Hinojo García']
  },
  {
    id: 'ACT-2026-002',
    numero: '02',
    plan: 'Plan Cádiz Marcha 2025',
    entidadLocal: 'Ayuntamiento de Arcos de la Frontera',
    titulo: 'Rehabilitación bioclimática y eficiencia energética del Centro Comunitario San Miguel',
    aplicacionPresupuestaria: '2025-04-450-76200',
    plazos: {
      plazoEjecucion: '2026-09-30',
      plazoJustificacion: '2026-11-30',
      plazoEjecucionAmpliado: '2027-01-31',
      plazoJustificacionAmpliado: '2027-03-31'
    },
    importes: {
      importeActuacion: 230000.00,
      importeConcesion: 200000.00,
      importeAdjudicacion: 198450.00
    },
    estadoGeneral: 'con_deficiencias',
    tecnicoAsignadoId: 'usr-tec-2',
    tecnicoAsignadoNombre: 'Manuel Benítez Romero',
    fechaCreacion: '2026-03-01T10:00:00Z',
    fechaModificacion: '2026-09-23T11:45:00Z',
    observacionesInternas: 'Faltan justificantes bancarios de las facturas de asistencia técnica.',
    liquidacion: {
      adjudicacion: 198450.00,
      justificadoEnPlazo: 185200.00,
      justificadoEnPlazoConDeficiencias: 13250.00,
      justificadoFueraDePlazo: 0,
      justificadoFueraDePlazoConDeficiencias: 0,
      noJustificado: 0,
      observacionesLiquidacion: 'Pendiente de subsanación de extracto bancario de dirección técnica.'
    },
    documentos: (() => {
      const docs = construirDocumentosCompletos();
      // Doc 14 (Factura 1 Asistencia Técnica) con deficiencia
      docs[13].camposRevisar[0].estado = 'conforme';
      docs[13].camposRevisar[1].estado = 'conforme';
      docs[13].camposRevisar[2].estado = 'no_conforme';
      docs[13].camposRevisar[2].observacion = 'Factura no acompañada de justificante bancario de pago';
      docs[13].metadatos.estadoJustificacion = 'En plazo con deficiencias no sustanciales';
      docs[13].revisadoCompleto = true;
      docs[13].tieneDeficiencias = true;
      docs[13].fechaHoraPrimerAcceso = '2026-09-23T11:10:00Z';
      docs[13].fechaHoraUltimoAcceso = '2026-09-23T11:40:00Z';
      docs[13].tecnicoUltimoAcceso = 'Manuel Benítez Romero';
      return docs;
    })()
  },
  {
    id: 'ACT-2026-003',
    numero: '03',
    plan: 'Plan + Inversión Cádiz 2026',
    entidadLocal: 'Ayuntamiento de Barbate',
    titulo: 'Adecuación de paseo marítimo y dotación de pasarelas accesibles en Playa del Carmen',
    aplicacionPresupuestaria: '2026-02-153-61900',
    plazos: {
      plazoEjecucion: '2027-06-30',
      plazoJustificacion: '2027-09-30',
      plazoEjecucionAmpliado: '2027-12-31',
      plazoJustificacionAmpliado: '2028-02-28'
    },
    importes: {
      importeActuacion: 310000.00,
      importeConcesion: 275000.00,
      importeAdjudicacion: 268900.00
    },
    estadoGeneral: 'pendiente',
    tecnicoAsignadoId: 'usr-tec-1',
    tecnicoAsignadoNombre: 'Carmen Rivas Delgado',
    fechaCreacion: '2026-05-18T09:00:00Z',
    fechaModificacion: '2026-09-20T17:00:00Z',
    observacionesInternas: 'Expediente recepcionado en sede electrónica. Próximo a vencer plazo de ejecución.',
    liquidacion: {
      adjudicacion: 268900.00,
      justificadoEnPlazo: 0,
      justificadoEnPlazoConDeficiencias: 0,
      justificadoFueraDePlazo: 0,
      justificadoFueraDePlazoConDeficiencias: 0,
      noJustificado: 0,
      observacionesLiquidacion: 'Sin iniciar revisión económica.'
    },
    documentos: construirDocumentosCompletos()
  },
  {
    id: 'ACT-2026-004',
    numero: '04',
    plan: 'Plan Cádiz Marcha + 2026',
    entidadLocal: 'Ayuntamiento de Ubrique',
    titulo: 'Renovación de pavimentación y soterramiento de infraestructuras en Casco Histórico Fase I',
    aplicacionPresupuestaria: '2026-05-920-46200',
    plazos: {
      plazoEjecucion: '2026-12-31',
      plazoJustificacion: '2027-03-31',
      plazoEjecucionAmpliado: '2027-06-30',
      plazoJustificacionAmpliado: '2027-09-30'
    },
    importes: {
      importeActuacion: 195000.00,
      importeConcesion: 160000.00,
      importeAdjudicacion: 154200.00
    },
    estadoGeneral: 'en_revision',
    tecnicoAsignadoId: 'usr-tec-2',
    tecnicoAsignadoNombre: 'Manuel Benítez Romero',
    fechaCreacion: '2026-04-12T11:00:00Z',
    fechaModificacion: '2026-09-24T16:00:00Z',
    observacionesInternas: 'Certificaciones 1 a 3 validadas.',
    liquidacion: {
      adjudicacion: 154200.00,
      justificadoEnPlazo: 82400.00,
      justificadoEnPlazoConDeficiencias: 0,
      justificadoFueraDePlazo: 0,
      justificadoFueraDePlazoConDeficiencias: 0,
      noJustificado: 0,
      observacionesLiquidacion: 'Certificaciones parciales en curso.'
    },
    documentos: construirDocumentosCompletos()
  },
  {
    id: 'ACT-2026-005',
    numero: '05',
    plan: 'Plan + Inversión 2027',
    entidadLocal: 'Ayuntamiento de Medina Sidonia',
    titulo: 'Consolidación de muralla histórica y adecuación paisajística del recinto arqueológico',
    aplicacionPresupuestaria: '2027-01-340-76200',
    plazos: {
      plazoEjecucion: '2027-12-31',
      plazoJustificacion: '2028-03-31',
      plazoEjecucionAmpliado: '2028-06-30',
      plazoJustificacionAmpliado: '2028-09-30'
    },
    importes: {
      importeActuacion: 410000.00,
      importeConcesion: 350000.00,
      importeAdjudicacion: 342000.00
    },
    estadoGeneral: 'justificado',
    tecnicoAsignadoId: 'usr-tec-1',
    tecnicoAsignadoNombre: 'Carmen Rivas Delgado',
    fechaCreacion: '2025-11-04T08:00:00Z',
    fechaModificacion: '2026-09-18T12:00:00Z',
    observacionesInternas: 'Revisión final completada satisfactoriamente con Anexo XI y XII conformes.',
    liquidacion: {
      adjudicacion: 342000.00,
      justificadoEnPlazo: 342000.00,
      justificadoEnPlazoConDeficiencias: 0,
      justificadoFueraDePlazo: 0,
      justificadoFueraDePlazoConDeficiencias: 0,
      noJustificado: 0,
      observacionesLiquidacion: 'Liquidación 100% favorable sin reintegro.'
    },
    documentos: (() => {
      const docs = construirDocumentosCompletos();
      // Marcamos todos conformes para testing de informe 100% justificado
      docs.forEach(d => {
        d.revisadoCompleto = true;
        d.metadatos.estadoJustificacion = 'En plazo';
        d.camposRevisar.forEach(c => {
          c.estado = 'conforme';
          c.observacion = '';
        });
      });
      return docs;
    })()
  }
];

export const MUNICIPIOS_CADIZ = [
  'Alcalá de los Gazules',
  'Alcalá del Valle',
  'Algar',
  'Algeciras',
  'Algodonales',
  'Arcos de la Frontera',
  'Barbate',
  'Benalup-Casas Viejas',
  'Benaocaz',
  'Bornos',
  'Castellar de la Frontera',
  'Chiclana de la Frontera',
  'Chipiona',
  'Conil de la Frontera',
  'Cádiz',
  'El Bosque',
  'El Gastor',
  'El Puerto de Santa María',
  'Espera',
  'Grazalema',
  'Jerez de la Frontera',
  'Jimena de la Frontera',
  'La Línea de la Concepción',
  'Los Barrios',
  'Medina Sidonia',
  'Olvera',
  'Paterna de Rivera',
  'Prado del Rey',
  'Puerto Real',
  'Puerto Serrano',
  'Rota',
  'San Fernando',
  'San José del Valle',
  'San Martín del Tesorillo',
  'San Roque',
  'Sanlúcar de Barrameda',
  'Setenil de las Bodegas',
  'Tarifa',
  'Torre Alháquime',
  'Trebujena',
  'Ubrique',
  'Vejer de la Frontera',
  'Villaluenga del Rosario',
  'Villamartín',
  'Zahara de la Sierra'
];

export const PLANES_DISPONIBLES = [
  'Plan Cádiz Marcha 2024',
  'Plan Cádiz Marcha 2025',
  'Plan + Inversión Cádiz 2026',
  'Plan Cádiz Marcha + 2026',
  'Plan + Inversión 2027',
  'Plan Provincial de Cooperación a las Obras y Servicios (PPCOS 2024-2028)',
  'Plan DipuInver'
];

export const PLANES_INICIALES: PlanSubvencion[] = [
  {
    id: 'plan-cadiz-marcha-2024',
    codigo: 'PCM-2024',
    nombre: 'Plan Cádiz Marcha 2024',
    descripcion: 'Plan Extraordinario de Reactivación y Asistencia Municipal 2024 de la Diputación Provincial de Cádiz.',
    ejercicio: 2024,
    plazoEjecucionMaximo: '2025-10-31',
    plazoJustificacionMaximo: '2025-12-31',
    plazoEjecucionAmpliado: '2026-03-31',
    plazoJustificacionAmpliado: '2026-05-31',
    eellBeneficiarias: ['Grazalema', 'Alcalá de los Gazules', 'Bornos', 'Espera', 'Medina Sidonia'],
    actuacionesPrevistas: [
      {
        id: 'pcm24-act-1',
        numero: '01',
        entidadLocal: 'Grazalema',
        titulo: 'Reurbanización, accesibilidad y pavimentación en Casco Histórico y Calle Las Piedras',
        aplicacionPresupuestaria: '2024-03-920-46200',
        subvencionSolicitada: 150000,
        actuacionGeneradaId: 'ACT-2026-001'
      },
      {
        id: 'pcm24-act-2',
        numero: '02',
        entidadLocal: 'Alcalá de los Gazules',
        titulo: 'Adecuación de viales peatonales y renovación de saneamiento en zona centro',
        aplicacionPresupuestaria: '2024-03-920-46201',
        subvencionSolicitada: 135000
      },
      {
        id: 'pcm24-act-3',
        numero: '03',
        entidadLocal: 'Bornos',
        titulo: 'Rehabilitación y acondicionamiento del entorno del Embarcadero Municipal',
        aplicacionPresupuestaria: '2024-03-920-46202',
        subvencionSolicitada: 160000
      }
    ],
    presupuestoTotal: 12500000,
    fechaCreacion: '2024-02-15T09:00:00Z',
    activo: true
  },
  {
    id: 'plan-cadiz-marcha-2025',
    codigo: 'PCM-2025',
    nombre: 'Plan Cádiz Marcha 2025',
    descripcion: 'Plan Provincial de Inversiones Municipales y Eficiencia de Servicios de la Diputación de Cádiz para 2025.',
    ejercicio: 2025,
    plazoEjecucionMaximo: '2026-09-30',
    plazoJustificacionMaximo: '2026-11-30',
    plazoEjecucionAmpliado: '2027-01-31',
    plazoJustificacionAmpliado: '2027-03-31',
    eellBeneficiarias: ['Arcos de la Frontera', 'Barbate', 'Chipiona', 'Olvera', 'Setenil de las Bodegas'],
    actuacionesPrevistas: [
      {
        id: 'pcm25-act-1',
        numero: '01',
        entidadLocal: 'Arcos de la Frontera',
        titulo: 'Rehabilitación bioclimática y eficiencia energética del Centro Comunitario San Miguel',
        aplicacionPresupuestaria: '2025-04-450-76200',
        subvencionSolicitada: 200000,
        actuacionGeneradaId: 'ACT-2026-002'
      },
      {
        id: 'pcm25-act-2',
        numero: '02',
        entidadLocal: 'Barbate',
        titulo: 'Regeneración urbana y pavimentación drenante en Barrio San Paulino',
        aplicacionPresupuestaria: '2025-04-450-76201',
        subvencionSolicitada: 180000
      },
      {
        id: 'pcm25-act-3',
        numero: '03',
        entidadLocal: 'Chipiona',
        titulo: 'Mejora de accesos y soterramiento de infraestructuras en Paseo Marítimo Cruz del Mar',
        aplicacionPresupuestaria: '2025-04-450-76202',
        subvencionSolicitada: 170000
      }
    ],
    presupuestoTotal: 15000000,
    fechaCreacion: '2025-01-20T08:30:00Z',
    activo: true
  },
  {
    id: 'plan-mas-inversion-cadiz-2026',
    codigo: 'PIC-2026',
    nombre: 'Plan + Inversión Cádiz 2026',
    descripcion: 'Plan Estratégico + Inversión para modernización urbana, conectividad viaria y equipamientos municipales.',
    ejercicio: 2026,
    plazoEjecucionMaximo: '2027-06-30',
    plazoJustificacionMaximo: '2027-09-30',
    plazoEjecucionAmpliado: '2027-12-31',
    plazoJustificacionAmpliado: '2028-02-28',
    eellBeneficiarias: ['Vejer de la Frontera', 'Ubrique', 'Tarifa', 'Conil de la Frontera', 'Rota'],
    actuacionesPrevistas: [
      {
        id: 'pic26-act-1',
        numero: '01',
        entidadLocal: 'Vejer de la Frontera',
        titulo: 'Rehabilitación integral de la Muralla Medieval y adecuación turística accesible',
        aplicacionPresupuestaria: '2026-02-153-61900',
        subvencionSolicitada: 275000,
        actuacionGeneradaId: 'ACT-2026-003'
      },
      {
        id: 'pic26-act-2',
        numero: '02',
        entidadLocal: 'Ubrique',
        titulo: 'Construcción de Pasarela Peatonal sobre el Río Ubrique y sendero fluvial',
        aplicacionPresupuestaria: '2026-02-153-61901',
        subvencionSolicitada: 210000
      },
      {
        id: 'pic26-act-3',
        numero: '03',
        entidadLocal: 'Tarifa',
        titulo: 'Adecuación de viales de acceso y aparcamiento disuasorio en zona pesquera',
        aplicacionPresupuestaria: '2026-02-153-61902',
        subvencionSolicitada: 240000
      }
    ],
    presupuestoTotal: 18000000,
    fechaCreacion: '2025-11-10T10:00:00Z',
    activo: true
  },
  {
    id: 'plan-cadiz-marcha-mas-2026',
    codigo: 'PCM-2026',
    nombre: 'Plan Cádiz Marcha + 2026',
    descripcion: 'Plan Extraordinario de Inversiones y Reactivación Municipal de la Diputación Provincial de Cádiz para el ejercicio 2026.',
    ejercicio: 2026,
    plazoEjecucionMaximo: '2026-12-31',
    plazoJustificacionMaximo: '2027-03-31',
    plazoEjecucionAmpliado: '2027-06-30',
    plazoJustificacionAmpliado: '2027-09-30',
    eellBeneficiarias: ['Grazalema', 'Vejer de la Frontera', 'Ubrique', 'Tarifa', 'Olvera', 'Medina Sidonia'],
    actuacionesPrevistas: [
      {
        id: 'pcm26-act-1',
        numero: '01',
        entidadLocal: 'Grazalema',
        titulo: 'Mejora de accesibilidad y pavimentación en Casco Histórico y Calle Agua',
        aplicacionPresupuestaria: '2026-05-920-46200',
        subvencionSolicitada: 120000
      },
      {
        id: 'pcm26-act-2',
        numero: '02',
        entidadLocal: 'Vejer de la Frontera',
        titulo: 'Adecuación de infraestructuras urbanas y dotación de servicios en núcleo histórico',
        aplicacionPresupuestaria: '2026-05-920-46201',
        subvencionSolicitada: 175000
      },
      {
        id: 'pcm26-act-3',
        numero: '03',
        entidadLocal: 'Ubrique',
        titulo: 'Renovación de pavimentación y soterramiento en Casco Histórico Fase I',
        aplicacionPresupuestaria: '2026-05-920-46202',
        subvencionSolicitada: 160000,
        actuacionGeneradaId: 'ACT-2026-004'
      },
      {
        id: 'pcm26-act-4',
        numero: '04',
        entidadLocal: 'Olvera',
        titulo: 'Consolidación de talud y mirador paisajístico en acceso Castillo Nazarí',
        aplicacionPresupuestaria: '2026-05-920-46203',
        subvencionSolicitada: 190000
      }
    ],
    presupuestoTotal: 20000000,
    fechaCreacion: '2026-01-15T08:00:00Z',
    activo: true
  },
  {
    id: 'plan-mas-inversion-2027',
    codigo: 'PI-2027',
    nombre: 'Plan + Inversión 2027',
    descripcion: 'Convocatoria plurianual de cooperación económica e infraestructuras estratégicas para entidades locales de la Provincia de Cádiz.',
    ejercicio: 2027,
    plazoEjecucionMaximo: '2027-12-31',
    plazoJustificacionMaximo: '2028-03-31',
    plazoEjecucionAmpliado: '2028-06-30',
    plazoJustificacionAmpliado: '2028-09-30',
    eellBeneficiarias: ['Medina Sidonia', 'El Bosque', 'Algodonales', 'Zahara de la Sierra', 'Villamartín'],
    actuacionesPrevistas: [
      {
        id: 'pi27-act-1',
        numero: '01',
        entidadLocal: 'Medina Sidonia',
        titulo: 'Consolidación de muralla histórica y adecuación paisajística del recinto arqueológico',
        aplicacionPresupuestaria: '2027-01-340-76200',
        subvencionSolicitada: 350000,
        actuacionGeneradaId: 'ACT-2026-005'
      },
      {
        id: 'pi27-act-2',
        numero: '02',
        entidadLocal: 'El Bosque',
        titulo: 'Renovación de redes de saneamiento y abastecimiento en Barriada San Antonio',
        aplicacionPresupuestaria: '2027-01-340-76201',
        subvencionSolicitada: 145000
      },
      {
        id: 'pi27-act-3',
        numero: '03',
        entidadLocal: 'Algodonales',
        titulo: 'Adecuación de edificio polivalente y centro de dinamización juvenil',
        aplicacionPresupuestaria: '2027-01-340-76202',
        subvencionSolicitada: 165000
      }
    ],
    presupuestoTotal: 22000000,
    fechaCreacion: '2026-02-01T09:30:00Z',
    activo: true
  }
];

export const COMENTARIOS_INICIALES: ComentarioActuacion[] = [
  {
    id: 'com-001',
    actuacionId: 'ACT-2026-001',
    actuacionNumero: '01',
    actuacionTitulo: 'Mejora de accesibilidad y pavimentación en Casco Histórico y Calle Agua',
    autorId: 'usr-jefe-1',
    autorNombre: 'Juan Hinojo García',
    autorRol: 'jefe_servicio',
    destinatarioId: 'usr-tec-1',
    destinatarioNombre: 'Carmen Rivas Delgado',
    destinatarioEmail: 'crivas@dipucadiz.es',
    mensaje: 'Carmen, por favor revisa con prioridad la fecha de aprobación del Anexo IX de Grazalema antes del viernes. La Intervención nos pide confirmar que el acuerdo de Junta de Gobierno Local fue anterior al inicio material de las obras.',
    fechaHora: '2026-09-24T10:30:00Z',
    enviadoPorEmail: true,
    emailSimuladoEstado: 'entregado',
    leido: false
  },
  {
    id: 'com-002',
    actuacionId: 'ACT-2026-002',
    actuacionNumero: '02',
    actuacionTitulo: 'Rehabilitación integral de la Muralla Medieval y adecuación turística',
    autorId: 'usr-jefe-1',
    autorNombre: 'Juan Hinojo García',
    autorRol: 'jefe_servicio',
    destinatarioId: 'usr-tec-2',
    destinatarioNombre: 'Manuel Benítez Romero',
    destinatarioEmail: 'mbenitez@dipucadiz.es',
    mensaje: 'Manuel, comprueba si Vejer de la Frontera ha subsanado el reportaje fotográfico previo al inicio de las obras con las coordenadas GPS correctas. Recuerda que no podemos dar la conformidad a la Certificación 1 sin ello.',
    fechaHora: '2026-09-24T12:15:00Z',
    enviadoPorEmail: true,
    emailSimuladoEstado: 'entregado',
    leido: true
  }
];
