import { Actuacion, NotificacionSistema } from '../types';

export function calcularDiasRestantes(fechaStr: string): number {
  if (!fechaStr) return 9999;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(fechaStr);
  objetivo.setHours(0, 0, 0, 0);
  const diffTiempo = objetivo.getTime() - hoy.getTime();
  return Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));
}

export function verificarAlertasVencimientos(actuaciones: Actuacion[], diasLimite: number = 30): NotificacionSistema[] {
  const alertas: NotificacionSistema[] = [];

  actuaciones.forEach((act) => {
    const diasEjecucion = calcularDiasRestantes(act.plazos.plazoEjecucion);
    const diasJustificacion = calcularDiasRestantes(act.plazos.plazoJustificacion);

    if (act.estadoGeneral !== 'justificado' && act.estadoGeneral !== 'conforme') {
      if (diasEjecucion < 0) {
        alertas.push({
          id: `venc-ejec-${act.id}`,
          titulo: `Plazo de ejecución VENCIDO: Act. ${act.numero}`,
          mensaje: `${act.entidadLocal}: El plazo expiró el ${act.plazos.plazoEjecucion}.`,
          tipo: 'alerta',
          fechaHora: new Date().toISOString(),
          leida: false,
          actuacionId: act.id
        });
      } else if (diasEjecucion <= diasLimite) {
        alertas.push({
          id: `warn-ejec-${act.id}`,
          titulo: `Vencimiento de ejecución próximo: Act. ${act.numero}`,
          mensaje: `${act.entidadLocal}: Quedan ${diasEjecucion} días para el plazo de ejecución (${act.plazos.plazoEjecucion}).`,
          tipo: 'vencimiento',
          fechaHora: new Date().toISOString(),
          leida: false,
          actuacionId: act.id
        });
      }

      if (diasJustificacion < 0) {
        alertas.push({
          id: `venc-just-${act.id}`,
          titulo: `Plazo de justificación VENCIDO: Act. ${act.numero}`,
          mensaje: `${act.entidadLocal}: Plazo límite expirado el ${act.plazos.plazoJustificacion}.`,
          tipo: 'alerta',
          fechaHora: new Date().toISOString(),
          leida: false,
          actuacionId: act.id
        });
      } else if (diasJustificacion <= diasLimite) {
        alertas.push({
          id: `warn-just-${act.id}`,
          titulo: `Vencimiento justificación próximo: Act. ${act.numero}`,
          mensaje: `${act.entidadLocal}: Quedan ${diasJustificacion} días para justificar (${act.plazos.plazoJustificacion}).`,
          tipo: 'vencimiento',
          fechaHora: new Date().toISOString(),
          leida: false,
          actuacionId: act.id
        });
      }
    }
  });

  return alertas;
}

export async function solicitarPermisoNotificacionesPush(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function enviarNotificacionPushNativa(titulo: string, opciones?: NotificationOptions): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(titulo, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        ...opciones
      });
    } catch {
      // Ignorar error de sandbox
    }
  }
}
