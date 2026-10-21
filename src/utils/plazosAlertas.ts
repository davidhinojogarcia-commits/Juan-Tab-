import { Actuacion, PlanSubvencion } from '../types';

export interface AlertaPlazoJustificacion {
  diasRestantes: number | null;
  fechaLimite: string | null;
  esProximo30Dias: boolean; // 0 <= diasRestantes <= 30
  esVencido: boolean;       // diasRestantes < 0
  esMuyUrgente: boolean;    // 0 <= diasRestantes <= 7
  nivel: 'urgente' | 'aviso' | 'vencido' | 'normal' | 'sin_fecha';
  mensaje: string;
  badgeTexto: string;
}

/**
 * Parsea de forma segura cualquier formato de fecha estándar (YYYY-MM-DD, ISO, DD/MM/YYYY).
 */
export function parsearFechaSegura(fechaStr?: string | null): Date | null {
  if (!fechaStr || typeof fechaStr !== 'string') return null;
  const strLimpia = fechaStr.trim();
  if (!strLimpia) return null;

  // Formato YYYY-MM-DD o ISO (ej. 2026-10-25 o 2026-10-25T12:00:00Z)
  const matchIso = strLimpia.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (matchIso) {
    const y = parseInt(matchIso[1], 10);
    const m = parseInt(matchIso[2], 10) - 1;
    const d = parseInt(matchIso[3], 10);
    return new Date(y, m, d);
  }

  // Formato DD/MM/YYYY
  const matchEs = strLimpia.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (matchEs) {
    const d = parseInt(matchEs[1], 10);
    const m = parseInt(matchEs[2], 10) - 1;
    const y = parseInt(matchEs[3], 10);
    return new Date(y, m, d);
  }

  const d = new Date(strLimpia);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calcula la alerta visual para una fecha límite de justificación dada.
 * Si faltan entre 0 y 30 días, se clasifica como próxima a fecha límite.
 */
export function obtenerAlertaJustificacion(
  fechaJustificacion?: string | null,
  estadoGeneral?: string
): AlertaPlazoJustificacion {
  if (!fechaJustificacion) {
    return {
      diasRestantes: null,
      fechaLimite: null,
      esProximo30Dias: false,
      esVencido: false,
      esMuyUrgente: false,
      nivel: 'sin_fecha',
      mensaje: 'Sin fecha límite de justificación definida',
      badgeTexto: ''
    };
  }

  const fechaObj = parsearFechaSegura(fechaJustificacion);
  if (!fechaObj) {
    return {
      diasRestantes: null,
      fechaLimite: fechaJustificacion,
      esProximo30Dias: false,
      esVencido: false,
      esMuyUrgente: false,
      nivel: 'sin_fecha',
      mensaje: 'Fecha de justificación no válida',
      badgeTexto: ''
    };
  }

  // Fecha actual a medianoche para cálculo exacto de días naturales
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaObj.setHours(0, 0, 0, 0);

  const diffMs = fechaObj.getTime() - hoy.getTime();
  const diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const yaJustificado = estadoGeneral === 'justificado' || estadoGeneral === 'conforme';

  // Si ya ha vencido
  if (diasRestantes < 0) {
    const diasVencido = Math.abs(diasRestantes);
    return {
      diasRestantes,
      fechaLimite: fechaJustificacion,
      esProximo30Dias: false,
      esVencido: true,
      esMuyUrgente: false,
      nivel: 'vencido',
      mensaje: yaJustificado
        ? `Actuación justificada (su plazo venció hace ${diasVencido} ${diasVencido === 1 ? 'día' : 'días'})`
        : `¡Plazo de justificación vencido hace ${diasVencido} ${diasVencido === 1 ? 'día' : 'días'}!`,
      badgeTexto: `Vencido hace ${diasVencido}d`
    };
  }

  // Si está en los próximos 30 días
  if (diasRestantes <= 30) {
    const esMuyUrgente = diasRestantes <= 7;
    const badgeTexto =
      diasRestantes === 0
        ? '¡Vence hoy!'
        : diasRestantes === 1
        ? '¡Vence mañana!'
        : `${diasRestantes} días`;

    const mensaje =
      diasRestantes === 0
        ? '¡Atención prioritaria! Hoy vence el plazo límite de justificación.'
        : diasRestantes === 1
        ? '¡Atención prioritaria! Mañana vence el plazo límite de justificación.'
        : `Aviso: Actuación próxima a su fecha límite de justificación (quedan ${diasRestantes} días).`;

    return {
      diasRestantes,
      fechaLimite: fechaJustificacion,
      esProximo30Dias: true,
      esVencido: false,
      esMuyUrgente,
      nivel: esMuyUrgente ? 'urgente' : 'aviso',
      mensaje,
      badgeTexto
    };
  }

  // Fuera del umbral de alerta (más de 30 días)
  return {
    diasRestantes,
    fechaLimite: fechaJustificacion,
    esProximo30Dias: false,
    esVencido: false,
    esMuyUrgente: false,
    nivel: 'normal',
    mensaje: `En plazo de justificación (${diasRestantes} días restantes)`,
    badgeTexto: `${diasRestantes}d`
  };
}

/**
 * Obtiene la fecha límite de justificación de una Actuacion individual,
 * consultando primero sus propios plazos y como respaldo el plan al que pertenece.
 */
export function resolverFechaJustificacionActuacion(
  act: Actuacion,
  planes?: PlanSubvencion[]
): string | null {
  if (act.plazos?.plazoJustificacionAmpliado) {
    return act.plazos.plazoJustificacionAmpliado;
  }
  if (act.plazos?.plazoJustificacion) {
    return act.plazos.plazoJustificacion;
  }

  if (planes && planes.length > 0 && act.plan) {
    const planEncontrado = planes.find(
      (p) => p.nombre === act.plan || p.codigo === act.plan || p.id === act.plan
    );
    if (planEncontrado) {
      return (
        planEncontrado.plazoJustificacionAmpliado ||
        planEncontrado.plazoJustificacionMaximo ||
        null
      );
    }
  }

  return null;
}
