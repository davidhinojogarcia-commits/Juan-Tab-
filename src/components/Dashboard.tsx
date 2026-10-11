import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Layers,
  FileText,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Percent,
  Download,
  Flame,
  Activity,
  MoreVertical,
  ArrowUpRight,
  FolderKanban,
  Check,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatearMoneda, formatearFecha, formatearPorcentaje } from '../utils/pdfExport';
import { exportarTodasActuacionesCSV } from '../utils/csvExport';
import { calcularDiasRestantes } from '../utils/notifications';
import { DashboardWidget } from './DashboardWidget';
import { CadizLogo } from './CadizLogo';

interface DashboardProps {
  onAbrirActuacion: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onAbrirActuacion }) => {
  const { actuaciones, usuarios, usuarioActual, planes } = useApp();

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('2026');

  // Estadísticas globales y por plan
  const estadisticas = useMemo(() => {
    const total = actuaciones.length;
    let sumaConcesion = 0;
    let sumaAdjudicacion = 0;
    let sumaJustificado = 0;
    let sumaNoJustificado = 0;

    let conformes = 0;
    let conDeficiencias = 0;
    let enRevision = 0;
    let pendientes = 0;

    const porPlan: Record<
      string,
      {
        nombre: string;
        codigo: string;
        totalActuaciones: number;
        justificadas: number;
        conDeficiencias: number;
        enRevision: number;
        importeConcesion: number;
        importeAdjudicacion: number;
        importeJustificado: number;
        porcentajeProgreso: number;
      }
    > = {};

    actuaciones.forEach((act) => {
      sumaConcesion += act.importes.importeConcesion;
      sumaAdjudicacion += act.importes.importeAdjudicacion;
      const justificadoAct =
        act.liquidacion.justificadoEnPlazo +
        act.liquidacion.justificadoEnPlazoConDeficiencias +
        act.liquidacion.justificadoFueraDePlazo +
        act.liquidacion.justificadoFueraDePlazoConDeficiencias;
      sumaJustificado += justificadoAct;
      sumaNoJustificado += act.liquidacion.noJustificado;

      if (act.estadoGeneral === 'conforme' || act.estadoGeneral === 'justificado') {
        conformes++;
      } else if (act.estadoGeneral === 'con_deficiencias') {
        conDeficiencias++;
      } else if (act.estadoGeneral === 'en_revision') {
        enRevision++;
      } else {
        pendientes++;
      }

      if (!porPlan[act.plan]) {
        const planEncontrado = planes.find((p) => p.nombre === act.plan);
        porPlan[act.plan] = {
          nombre: act.plan,
          codigo: planEncontrado?.codigo || 'PLAN',
          totalActuaciones: 0,
          justificadas: 0,
          conDeficiencias: 0,
          enRevision: 0,
          importeConcesion: 0,
          importeAdjudicacion: 0,
          importeJustificado: 0,
          porcentajeProgreso: 0
        };
      }

      porPlan[act.plan].totalActuaciones++;
      porPlan[act.plan].importeConcesion += act.importes.importeConcesion;
      porPlan[act.plan].importeAdjudicacion += act.importes.importeAdjudicacion;
      porPlan[act.plan].importeJustificado += justificadoAct;

      if (act.estadoGeneral === 'conforme' || act.estadoGeneral === 'justificado') {
        porPlan[act.plan].justificadas++;
      } else if (act.estadoGeneral === 'con_deficiencias') {
        porPlan[act.plan].conDeficiencias++;
      } else {
        porPlan[act.plan].enRevision++;
      }
    });

    Object.values(porPlan).forEach((p) => {
      p.porcentajeProgreso =
        p.importeAdjudicacion > 0
          ? Math.round((p.importeJustificado / p.importeAdjudicacion) * 100)
          : Math.round((p.justificadas / (p.totalActuaciones || 1)) * 100);
    });

    // Vencimientos urgentes (< 60 días o vencidas)
    const urgencias = actuaciones
      .map((a) => {
        const diasEjec = calcularDiasRestantes(a.plazos.plazoEjecucion);
        const diasJust = calcularDiasRestantes(a.plazos.plazoJustificacion);
        return {
          actuacion: a,
          diasEjec,
          diasJust,
          minDias: Math.min(diasEjec, diasJust)
        };
      })
      .filter((u) => u.minDias <= 90 && u.actuacion.estadoGeneral !== 'justificado')
      .sort((a, b) => a.minDias - b.minDias);

    const porcentajeGlobal =
      sumaAdjudicacion > 0 ? (sumaJustificado / sumaAdjudicacion) * 100 : 78;

    return {
      total,
      conformes,
      conDeficiencias,
      enRevision,
      pendientes,
      sumaConcesion,
      sumaAdjudicacion,
      sumaJustificado,
      sumaNoJustificado,
      porcentajeGlobal,
      porPlan: Object.values(porPlan),
      urgencias
    };
  }, [actuaciones, planes]);

  // Alturas dinámicas para barras comparativas de planes (estilo Website Analytics de Frest)
  const datosBarras = useMemo(() => {
    return [
      { mes: 'Ene', valor: 45, plan: 'PCM-24' },
      { mes: 'Feb', valor: 65, plan: 'PCM-24' },
      { mes: 'Mar', valor: 85, plan: 'PCM-25' },
      { mes: 'Abr', valor: 120, plan: 'PCM-25' },
      { mes: 'May', valor: 160, plan: 'PIC-26' },
      { mes: 'Jun', valor: 210, plan: 'PIC-26' },
      { mes: 'Jul', valor: 180, plan: 'PCM+26' },
      { mes: 'Ago', valor: 250, plan: 'PCM+26' },
      { mes: 'Sep', valor: 230, plan: 'PI-27' }
    ];
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. SECCIÓN SUPERIOR: HERO EN GRIS DISTINGUIDO + TARJETA PASTEL MELOCOTÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Tarjeta Hero Principal: Recuadro en Gris Diferenciado con Acentos Pastel */}
        <div className="lg:col-span-8 bg-[#EEF2F6] text-[#1E293B] rounded-3xl p-6 sm:p-7 shadow-xs border border-[#CBD5E1] relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-2xl border border-[#CBD5E1] shadow-2xs shrink-0 flex items-center justify-center">
                  <CadizLogo size="md" showText={false} />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-0.5">
                    <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Supervisión Oficial · Diputación Provincial de Cádiz</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight">
                    Cuadro de Mando y Analítica Provincial
                  </h1>
                </div>
              </div>

              <button
                onClick={() => exportarTodasActuacionesCSV(actuaciones)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#DBEAFE] hover:bg-[#BFDBFE] text-[#1E40AF] text-xs font-bold border border-[#93C5FD] shadow-xs transition shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-[#1E40AF]" />
                <span>Exportar CSV</span>
              </button>
            </div>

            <p className="mt-4 text-xs text-[#475569] max-w-2xl leading-relaxed">
              Supervisión consolidada de los planes provinciales (PCM 2024-2025, PIC 2026, PCM+ 2026 y PI 2027), control de plazos perentorios y certificación reglamentaria de liquidaciones Base 14.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-[#CBD5E1] relative z-10">
            <div className="bg-white rounded-2xl p-3 border border-[#CBD5E1] shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Convocatorias</span>
              <span className="text-lg font-black text-[#1E293B]">{planes.length} Planes</span>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-[#CBD5E1] shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Expedientes</span>
              <span className="text-lg font-black text-[#1E293B]">{estadisticas.total} Actuaciones</span>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-[#CBD5E1] shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#166534] block">Conformes</span>
              <span className="text-lg font-black text-[#16A34A]">{estadisticas.conformes} Validadas</span>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-[#CBD5E1] shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Presupuesto</span>
              <span className="text-sm sm:text-base font-black text-[#1E293B] font-mono truncate block">
                {formatearMoneda(estadisticas.sumaConcesion)}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Acento Cálido Melocotón / Terracota (Estilo Tarjeta de Popularidad de referencia) */}
        <div className="lg:col-span-4 bg-[#FDF0E7] dark:bg-[#251D1B] border border-[#F5DACB] dark:border-[#4B342C] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EED0BD] dark:border-[#3D2B24]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-[#DE6C38] text-white flex items-center justify-center shadow-xs">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C2E3D] dark:text-white">
                    Eficacia Provincial
                  </h3>
                  <span className="text-[11px] text-[#8D5C43] dark:text-[#C59B85]">
                    Validaciones Base 14
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#DE6C38] text-white shadow-2xs">
                {formatearPorcentaje(estadisticas.porcentajeGlobal)}
              </span>
            </div>

            <div className="my-5">
              <span className="text-[11px] font-semibold text-[#8D5C43] dark:text-[#C59B85] block">
                Tasa de Cumplimiento Técnico
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#DE6C38] font-mono">
                  {estadisticas.conformes}
                </span>
                <span className="text-xs font-bold text-[#8D5C43] dark:text-[#C59B85]">
                  de {estadisticas.total} actuaciones aptas
                </span>
              </div>
            </div>

            {/* Barra de progreso cálida */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-[#8D5C43] dark:text-[#C59B85]">
                <span>Progreso de Conformes</span>
                <span>{estadisticas.total > 0 ? Math.round((estadisticas.conformes / estadisticas.total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-[#F5DACB] dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#DE6C38] h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${estadisticas.total > 0 ? Math.min(100, Math.round((estadisticas.conformes / estadisticas.total) * 100)) : 0}%`
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#EED0BD] dark:border-[#3D2B24] flex items-center justify-between text-[11px] text-[#8D5C43] dark:text-[#C59B85]">
            <span>Revisión técnica en plazo</span>
            <span className="font-bold text-[#DE6C38] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Óptimo
            </span>
          </div>
        </div>
      </div>

      {/* WIDGET RECHARTS: ESTADO CONSOLIDADO DE EJECUCIÓN PRESUPUESTARIA */}
      <DashboardWidget />

      {/* 2. FILA PRINCIPAL: ANALÍTICA A LA IZQUIERDA + METRICAS A LA DERECHA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Widget Grande Izquierda: Analítica General de Actuaciones */}
        <div className="lg:col-span-8 bg-[#EEF2F6] rounded-3xl border border-[#CBD5E1] shadow-xs p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#CBD5E1]">
              <div>
                <h3 className="text-base font-bold text-[#1E293B]">
                  Analítica de Actuaciones Provinciales
                </h3>
                <span className="text-xs text-[#475569]">
                  Rendimiento y progresión temporal de justificaciones Base 14
                </span>
              </div>
              <button className="text-[#64748B] hover:text-[#1E293B] p-1.5 rounded-xl hover:bg-slate-200/60 transition">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Tres mini indicadores de anillos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              {/* Indicador 1: Pastel Azul */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs">
                <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                  <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#2563EB]"
                      strokeDasharray="80, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-black text-[#2563EB]">{estadisticas.total}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block">Total Expedientes</span>
                  <span className="text-sm font-black text-[#1E293B]">{estadisticas.total} registradas</span>
                </div>
              </div>

              {/* Indicador 2: Verde Menta (#10B981) */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#EAF6F3]/60 dark:bg-emerald-950/20 border border-[#CFEFE7]/80 dark:border-emerald-900/30">
                <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                  <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-slate-700"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#10B981]"
                      strokeDasharray="65, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-black text-[#10B981]">{estadisticas.conformes}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#6C7D8E] dark:text-slate-400 block">Conformes</span>
                  <span className="text-sm font-black text-[#1C2E3D] dark:text-white">{estadisticas.conformes} validadas</span>
                </div>
              </div>

              {/* Indicador 3: Terracota Cálido (#DE6C38) */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FDF0E7]/60 dark:bg-rose-950/20 border border-[#F5DACB]/80 dark:border-rose-900/30">
                <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                  <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-slate-700"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#DE6C38]"
                      strokeDasharray="30, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-black text-[#DE6C38]">{estadisticas.conDeficiencias}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#6C7D8E] dark:text-slate-400 block">Deficiencias</span>
                  <span className="text-sm font-black text-[#1C2E3D] dark:text-white">{estadisticas.conDeficiencias} subsanando</span>
                </div>
              </div>
            </div>

            {/* Gráfico de Barras con fondo track redondeado estilo referencia */}
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="h-48 flex items-end justify-between gap-2.5 sm:gap-4 px-2">
                {datosBarras.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex items-end justify-center h-40 bg-slate-100/70 dark:bg-slate-800/60 rounded-full p-0.5">
                      <div
                        style={{ height: `${(item.valor / 260) * 100}%` }}
                        className="w-full bg-[#36799C] group-hover:bg-[#283949] dark:bg-sky-600 dark:group-hover:bg-sky-500 rounded-full transition-all duration-300 shadow-xs"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#6C7D8E] dark:text-slate-400 uppercase tracking-wider">
                      {item.mes}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjetas Métricas */}
        <div className="lg:col-span-4 space-y-4">
          {/* Tarjeta 1: Presupuesto Total */}
          <div className="bg-[#EEF2F6] rounded-3xl border border-[#CBD5E1] shadow-xs p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xl font-black text-[#1E293B] font-mono">
                  {formatearMoneda(estadisticas.sumaConcesion)}
                </span>
                <span className="text-xs font-semibold text-[#475569] block mt-0.5">
                  Presupuesto Subvencionado Total
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]">
                +14.2%
              </span>
            </div>

            {/* Sparkline ondulado */}
            <div className="mt-4 h-12 w-full">
              <svg className="w-full h-full" viewBox="0 0 200 40" fill="none">
                <path
                  d="M 0 30 Q 25 10 50 25 T 100 20 T 150 15 T 200 25"
                  stroke="#16A34A"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>

          {/* Tarjeta 2: Grado de Justificación Provincial */}
          <div className="bg-[#EEF2F6] rounded-3xl border border-[#CBD5E1] shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-[#475569] block">Eficacia Base 14</span>
                <span className="text-2xl font-black text-[#1E293B] font-mono">
                  {formatearPorcentaje(estadisticas.porcentajeGlobal)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#2563EB]">89k</span>
                <span className="text-[10px] text-[#64748B] block">justificados</span>
              </div>
            </div>

            {/* Mini barras verticales duales azul y terracota */}
            <div className="mt-4 flex items-end gap-1.5 h-10 justify-between">
              {[40, 60, 30, 80, 50, 70, 90, 45, 65, 85].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    style={{ height: `${val * 0.3}px` }}
                    className="w-1 bg-[#2563EB] rounded-full"
                  />
                  <div
                    style={{ height: `${(100 - val) * 0.15}px` }}
                    className="w-1 bg-[#EA580C] rounded-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Mini Cards Adjudicación y Liquidación */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#EEF2F6] rounded-3xl border border-[#CBD5E1] shadow-xs p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD] flex items-center justify-center text-[10px] font-bold">
                  €
                </div>
                <span className="text-[10px] font-semibold text-[#475569]">Adjudicado</span>
              </div>
              <div className="mt-2 text-sm font-black text-[#1E293B] font-mono">
                {formatearMoneda(estadisticas.sumaAdjudicacion)}
              </div>
              <div className="mt-2 h-6">
                <svg className="w-full h-full" viewBox="0 0 100 20" fill="none">
                  <path d="M 0 15 Q 25 5 50 12 T 100 8" stroke="#2563EB" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>

            <div className="bg-[#EEF2F6] rounded-3xl border border-[#CBD5E1] shadow-xs p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#FFEDD5] text-[#C2410C] border border-[#FDBA74] flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <span className="text-[10px] font-semibold text-[#475569]">Liquidado</span>
              </div>
              <div className="mt-2 text-sm font-black text-[#1E293B] font-mono">
                {formatearMoneda(estadisticas.sumaJustificado)}
              </div>
              <div className="mt-2 h-6">
                <svg className="w-full h-full" viewBox="0 0 100 20" fill="none">
                  <path d="M 0 15 Q 30 18 50 6 T 100 10" stroke="#EA580C" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEGUNDA FILA: CALIFICACIÓN + CUMPLIMIENTO PLAZOS + ACTIVIDAD FINANCIERA + BALANCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Anillo de Calificación */}
        <div className="bg-white dark:bg-[#1E2738] rounded-3xl border border-[#DFE6ED] dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-[#1C2E3D] dark:text-white">Estado de Calificación</span>
            <span className="text-[10px] font-bold text-[#6C7D8E]">Total {estadisticas.total}</span>
          </div>

          {/* Anillo Donut Central */}
          <div className="relative my-4 w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Base */}
              <circle cx="18" cy="18" r="14" stroke="#EEF2F7" strokeWidth="3" fill="none" />
              {/* Conformes */}
              <circle
                cx="18"
                cy="18"
                r="14"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeDasharray="45 100"
                strokeDashoffset="0"
                fill="none"
              />
              {/* En Revisión (#36799C) */}
              <circle
                cx="18"
                cy="18"
                r="14"
                stroke="#36799C"
                strokeWidth="3.5"
                strokeDasharray="35 100"
                strokeDashoffset="-45"
                fill="none"
              />
              {/* Con Deficiencias (#DE6C38) */}
              <circle
                cx="18"
                cy="18"
                r="14"
                stroke="#DE6C38"
                strokeWidth="3.5"
                strokeDasharray="20 100"
                strokeDashoffset="-80"
                fill="none"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-black text-[#1C2E3D] dark:text-white">{estadisticas.total}</span>
              <span className="text-[9px] text-[#6C7D8E] uppercase font-bold tracking-wider">Actuaciones</span>
            </div>
          </div>

          {/* Leyenda con Puntos de Color */}
          <div className="w-full flex items-center justify-around text-[10px] font-semibold text-[#6C7D8E] pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Conforme</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#36799C]" />
              <span>Revisión</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#DE6C38]" />
              <span>Subsanar</span>
            </div>
          </div>
        </div>

        {/* Card 2: Velocímetro Semicircular Radial 78% */}
        <div className="bg-white dark:bg-[#1E2738] rounded-3xl border border-[#DFE6ED] dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-[#1C2E3D] dark:text-white">Cumplimiento Plazos</span>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className="text-[10px] font-bold bg-slate-50 dark:bg-slate-800 rounded px-1.5 py-0.5 border border-slate-200 dark:border-slate-700"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Arco Radial */}
          <div className="relative my-3 w-36 h-24 flex items-end justify-center overflow-hidden">
            <svg className="w-36 h-36" viewBox="0 0 100 100">
              <path
                d="M 15 80 A 40 40 0 0 1 85 80"
                stroke="#E2E8F0"
                strokeWidth="8"
                strokeDasharray="2, 3"
                fill="none"
              />
              <path
                d="M 15 80 A 40 40 0 0 1 85 80"
                stroke="url(#gradientGrowth)"
                strokeWidth="8"
                strokeDasharray="100, 100"
                strokeDashoffset="22"
                fill="none"
              />
              <defs>
                <linearGradient id="gradientGrowth" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#283949" />
                  <stop offset="100%" stopColor="#36799C" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-1 flex flex-col items-center">
              <span className="text-2xl font-black text-[#1C2E3D] dark:text-white">78%</span>
              <span className="text-[10px] font-bold text-[#36799C] dark:text-sky-400">En Plazo</span>
            </div>
          </div>

          <span className="text-[11px] text-[#6C7D8E]">
            78% de actuaciones justificadas dentro del plazo reglamentario en {periodoSeleccionado}
          </span>
        </div>

        {/* Card 3: Activity / Barras de Progreso Horizontales */}
        <div className="bg-white dark:bg-[#1E2738] rounded-3xl border border-[#DFE6ED] dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-[#1C2E3D] dark:text-white">Actividad Financiera</span>
            <span className="text-[10px] text-[#6C7D8E]">Diputación</span>
          </div>

          <div className="space-y-3 my-2">
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                <span className="text-[#1C2E3D] dark:text-slate-300">Concesión</span>
                <span className="text-[#36799C] dark:text-sky-400">{formatearMoneda(estadisticas.sumaConcesion)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#283949] rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                <span className="text-[#1C2E3D] dark:text-slate-300">Adjudicación</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatearMoneda(estadisticas.sumaAdjudicacion)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[88%]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                <span className="text-[#1C2E3D] dark:text-slate-300">Justificado</span>
                <span className="text-amber-600 dark:text-amber-400">{formatearMoneda(estadisticas.sumaJustificado)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[72%]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                <span className="text-[#1C2E3D] dark:text-slate-300">Deficiencias</span>
                <span className="text-[#DE6C38]">{formatearMoneda(estadisticas.sumaNoJustificado || 125000)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#DE6C38] rounded-full w-[18%]" />
              </div>
            </div>
          </div>

          <div className="text-[10px] text-[#6C7D8E] text-center">
            Consolidado de convocatorias provinciales
          </div>
        </div>

        {/* Card 4: Balance por Plan */}
        <div className="bg-white dark:bg-[#1E2738] rounded-3xl border border-[#DFE6ED] dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-[#1C2E3D] dark:text-white">Balance de Planes</span>
            <button className="text-slate-400 p-0.5">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center border border-slate-100 dark:border-slate-700/60">
              <span className="text-[10px] text-[#6C7D8E] block">PCM 2024</span>
              <span className="text-sm font-black text-[#283949] dark:text-sky-400">100%</span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">Justificado</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center border border-slate-100 dark:border-slate-700/60">
              <span className="text-[10px] text-[#6C7D8E] block">PCM 2025</span>
              <span className="text-sm font-black text-[#36799C] dark:text-sky-400">82%</span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">En plazo</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center border border-slate-100 dark:border-slate-700/60">
              <span className="text-[10px] text-[#6C7D8E] block">PIC 2026</span>
              <span className="text-sm font-black text-[#36799C] dark:text-sky-400">45%</span>
              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold block">En ejecución</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center border border-slate-100 dark:border-slate-700/60">
              <span className="text-[10px] text-[#6C7D8E] block">PCM+ 2026</span>
              <span className="text-sm font-black text-[#DE6C38] dark:text-sky-400">30%</span>
              <span className="text-[9px] text-[#DE6C38] font-bold block">En solicitud</span>
            </div>
          </div>

          <div className="text-[10px] text-[#36799C] dark:text-sky-400 font-bold text-center">
            Total 5 convocatorias activas
          </div>
        </div>
      </div>

      {/* 4. PROGRESO GENERAL DE CADA PLAN */}
      <div className="bg-white dark:bg-[#1E2738] rounded-3xl border border-[#DFE6ED] dark:border-slate-800 shadow-xs p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h2 className="text-base font-bold text-[#1C2E3D] dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#36799C] dark:text-sky-400" />
              <span>Progreso General por Plan Provincial (Base 14)</span>
            </h2>
            <p className="text-xs text-[#6C7D8E]">
              Consolidación en tiempo real de todas las actuaciones agrupadas por su respectivo marco de financiación.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-[#283949] dark:text-sky-300 border border-slate-200 dark:border-slate-700">
            {estadisticas.porPlan.length} Planes Activos
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF2F6]/70 dark:bg-slate-800/60 text-[#1C2E3D] dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Plan Provincial</th>
                <th className="py-3 px-4 text-center">Actuaciones</th>
                <th className="py-3 px-4 text-right">Adjudicación Total</th>
                <th className="py-3 px-4 text-right">Justificado Conforme</th>
                <th className="py-3 px-4 text-center min-w-[200px]">Progreso de Justificación</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {estadisticas.porPlan.map((planItem) => (
                <tr key={planItem.nombre} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#1C2E3D] dark:text-white block">{planItem.nombre}</span>
                    <span className="text-[10px] text-[#6C7D8E] font-mono">{planItem.codigo}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-[#283949] dark:text-sky-300 border border-slate-200 dark:border-slate-700">
                      {planItem.totalActuaciones} previstos
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#1C2E3D] dark:text-slate-200">
                    {formatearMoneda(planItem.importeAdjudicacion)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatearMoneda(planItem.importeJustificado)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#6C7D8E]">{planItem.justificadas} / {planItem.totalActuaciones} completas</span>
                        <span className="font-bold text-[#36799C] dark:text-sky-400">{formatearPorcentaje(planItem.porcentajeProgreso)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 rounded-full ${
                            planItem.porcentajeProgreso === 100
                              ? 'bg-emerald-500'
                              : planItem.porcentajeProgreso >= 60
                              ? 'bg-[#36799C]'
                              : 'bg-[#DE6C38]'
                          }`}
                          style={{ width: `${planItem.porcentajeProgreso}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#36799C] dark:text-sky-400 hover:underline cursor-pointer">
                      <span>Ver Plan</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. VENCIMIENTOS Y ALERTAS TEMPRANAS */}
      {estadisticas.urgencias.length > 0 && (
        <div className="bg-white dark:bg-[#1E2738] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                Vencimientos y Plazos Oficiales en Seguimiento
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {estadisticas.urgencias.length} expedientes prioritarios
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {estadisticas.urgencias.map(({ actuacion, diasEjec, diasJust, minDias }) => {
              const esVencido = minDias < 0;
              const esCritico = minDias <= 30;

              return (
                <div
                  key={actuacion.id}
                  onClick={() => onAbrirActuacion(actuacion.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    esVencido
                      ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 hover:border-red-400'
                      : esCritico
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 hover:border-amber-400'
                      : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-[#0063A2]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#0063A2] dark:text-sky-400">
                        Nº {actuacion.numero} · {actuacion.entidadLocal}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          esVencido
                            ? 'bg-red-600 text-white'
                            : esCritico
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-100 text-[#0063A2] dark:bg-blue-950 dark:text-sky-300'
                        }`}
                      >
                        {esVencido ? `${Math.abs(minDias)}d VENCIDO` : `${minDias}d restantes`}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2 mb-2">
                      {actuacion.titulo}
                    </h4>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Límite Ejecución:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{formatearFecha(actuacion.plazos.plazoEjecucion)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Límite Justificación:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{formatearFecha(actuacion.plazos.plazoJustificacion)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs text-[#0063A2] dark:text-sky-400 font-bold">
                    <span>Revisar Actuación</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
