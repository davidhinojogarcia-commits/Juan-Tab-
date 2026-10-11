import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector
} from 'recharts';
import {
  PieChart as PieIcon,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowUpRight,
  Filter,
  Info,
  Euro
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Actuacion } from '../types';
import { formatearMoneda, formatearPorcentaje } from '../utils/pdfExport';
import { CadizLogo } from './CadizLogo';

export interface DashboardWidgetProps {
  actuaciones?: Actuacion[];
  planSeleccionado?: string;
  onSelectPlan?: (plan: string) => void;
  className?: string;
  mostrarFiltroPlan?: boolean;
  mostrarCabeceraInstitucional?: boolean;
}

// Colores del sistema para estados presupuestarios inspirados en la referencia
const COLORES_FREST = {
  exito: '#16A34A',       // Pastel Verde
  alerta: '#D97706',      // Pastel Ámbar
  info: '#2563EB',        // Pastel Azul
  primario: '#475569',    // Gris pizarra suave
  peligro: '#EA580C',     // Pastel Naranja
  morado: '#7C3AED',      // Pastel Lavanda
  gris: '#64748B'         // Neutro pizarra
};

// Renderizado de sector activo interactivo con animación y halo
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value,
    percent
  } = props;

  return (
    <g>
      {/* Halo exterior translúcido */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 3}
        outerRadius={outerRadius + 9}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
      {/* Sector principal expandido */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-300 drop-shadow-md cursor-pointer"
      />
    </g>
  );
};

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  actuaciones: propActuaciones,
  planSeleccionado: propPlanSeleccionado,
  onSelectPlan,
  className = '',
  mostrarFiltroPlan = true,
  mostrarCabeceraInstitucional = true
}) => {
  const { actuaciones: contextActuaciones, planes } = useApp();
  const actuaciones = propActuaciones || contextActuaciones;

  // Estados locales
  const [filtroPlan, setFiltroPlan] = useState<string>(propPlanSeleccionado || 'todos');
  const [modoVisualizacion, setModoVisualizacion] = useState<'liquidacion' | 'planes' | 'estados'>('liquidacion');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mostrarAyudaBase14, setMostrarAyudaBase14] = useState<boolean>(false);

  // Filtrado de actuaciones
  const actuacionesFiltradas = useMemo(() => {
    if (filtroPlan === 'todos') return actuaciones;
    return actuaciones.filter((a) => a.plan === filtroPlan);
  }, [actuaciones, filtroPlan]);

  // Cálculos presupuestarios consolidados
  const metricasConsolidadas = useMemo(() => {
    let totalConcesion = 0;
    let totalAdjudicacion = 0;
    let totalJustificadoEnPlazo = 0;
    let totalJustificadoConDeficiencias = 0;
    let totalJustificadoFueraPlazo = 0;
    let totalNoJustificado = 0;

    let conteoConforme = 0;
    let conteoDeficiencias = 0;
    let conteoFueraPlazo = 0;
    let conteoPendiente = 0;
    let conteoNoJustificado = 0;

    actuacionesFiltradas.forEach((act) => {
      totalConcesion += act.importes.importeConcesion || 0;
      totalAdjudicacion += act.importes.importeAdjudicacion || 0;

      const enPlazo = act.liquidacion.justificadoEnPlazo || 0;
      const deficiencias = (act.liquidacion.justificadoEnPlazoConDeficiencias || 0) + (act.liquidacion.justificadoFueraDePlazoConDeficiencias || 0);
      const fueraPlazo = act.liquidacion.justificadoFueraDePlazo || 0;
      const noJust = act.liquidacion.noJustificado || 0;

      totalJustificadoEnPlazo += enPlazo;
      totalJustificadoConDeficiencias += deficiencias;
      totalJustificadoFueraPlazo += fueraPlazo;
      totalNoJustificado += noJust;

      if (enPlazo > 0 && deficiencias === 0 && noJust === 0) conteoConforme++;
      if (deficiencias > 0) conteoDeficiencias++;
      if (fueraPlazo > 0) conteoFueraPlazo++;
      if (noJust > 0) conteoNoJustificado++;
      if (act.estadoGeneral === 'pendiente' || act.estadoGeneral === 'en_revision') conteoPendiente++;
    });

    const totalJustificadoValido = totalJustificadoEnPlazo + totalJustificadoConDeficiencias + totalJustificadoFueraPlazo;
    const baseCalculo = totalAdjudicacion > 0 ? totalAdjudicacion : totalConcesion;
    
    // Pendiente de justificar: Adjudicación menos lo justificado y menos reintegros
    const totalPendienteJustificar = Math.max(0, baseCalculo - totalJustificadoValido - totalNoJustificado);

    const porcentajeEjecucion = baseCalculo > 0 ? (totalJustificadoValido / baseCalculo) * 100 : 0;
    const porcentajeConforme = baseCalculo > 0 ? (totalJustificadoEnPlazo / baseCalculo) * 100 : 0;

    return {
      totalConcesion,
      totalAdjudicacion,
      totalJustificadoEnPlazo,
      totalJustificadoConDeficiencias,
      totalJustificadoFueraPlazo,
      totalPendienteJustificar,
      totalNoJustificado,
      totalJustificadoValido,
      baseCalculo,
      porcentajeEjecucion,
      porcentajeConforme,
      conteos: {
        conforme: conteoConforme,
        deficiencias: conteoDeficiencias,
        fueraPlazo: conteoFueraPlazo,
        pendiente: conteoPendiente,
        noJustificado: conteoNoJustificado
      }
    };
  }, [actuacionesFiltradas]);

  // Datos para Recharts según el modo de visualización seleccionado
  const datosDona = useMemo(() => {
    if (modoVisualizacion === 'liquidacion') {
      const {
        totalJustificadoEnPlazo,
        totalJustificadoConDeficiencias,
        totalJustificadoFueraPlazo,
        totalPendienteJustificar,
        totalNoJustificado,
        baseCalculo,
        conteos
      } = metricasConsolidadas;

      const items = [
        {
          id: 'conforme',
          nombre: 'Conforme en Plazo (Base 14)',
          descripcion: 'Justificado conforme y validado técnicamente',
          valor: totalJustificadoEnPlazo,
          cantidad: conteos.conforme,
          color: COLORES_FREST.exito,
          porcentaje: baseCalculo > 0 ? (totalJustificadoEnPlazo / baseCalculo) * 100 : 0
        },
        {
          id: 'deficiencias',
          nombre: 'En Subsanación (Deficiencias)',
          descripcion: 'En trámite de subsanación de requerimientos',
          valor: totalJustificadoConDeficiencias,
          cantidad: conteos.deficiencias,
          color: COLORES_FREST.alerta,
          porcentaje: baseCalculo > 0 ? (totalJustificadoConDeficiencias / baseCalculo) * 100 : 0
        },
        {
          id: 'fueraplazo',
          nombre: 'Fuera de Plazo Justificado',
          descripcion: 'Acreditado con causa o pendiente de resolución',
          valor: totalJustificadoFueraPlazo,
          cantidad: conteos.fueraPlazo,
          color: COLORES_FREST.info,
          porcentaje: baseCalculo > 0 ? (totalJustificadoFueraPlazo / baseCalculo) * 100 : 0
        },
        {
          id: 'pendiente',
          nombre: 'Pendiente de Justificar',
          descripcion: 'En plazo de ejecución / presentación de cuenta',
          valor: totalPendienteJustificar,
          cantidad: conteos.pendiente,
          color: COLORES_FREST.primario,
          porcentaje: baseCalculo > 0 ? (totalPendienteJustificar / baseCalculo) * 100 : 0
        },
        {
          id: 'nojustificado',
          nombre: 'Propuesta de Reintegro / No Justif.',
          descripcion: 'Incumplimiento de plazos o deficiencias graves',
          valor: totalNoJustificado,
          cantidad: conteos.noJustificado,
          color: COLORES_FREST.peligro,
          porcentaje: baseCalculo > 0 ? (totalNoJustificado / baseCalculo) * 100 : 0
        }
      ];

      return items.filter((item) => item.valor > 0 || items.length <= 2);
    }

    if (modoVisualizacion === 'planes') {
      const coloresPlanes = [
        COLORES_FREST.primario,
        COLORES_FREST.exito,
        COLORES_FREST.alerta,
        COLORES_FREST.info,
        COLORES_FREST.morado
      ];

      const agrupadoPorPlan: Record<string, { totalAdjudicado: number; totalJustificado: number; count: number }> = {};
      actuacionesFiltradas.forEach((act) => {
        if (!agrupadoPorPlan[act.plan]) {
          agrupadoPorPlan[act.plan] = { totalAdjudicado: 0, totalJustificado: 0, count: 0 };
        }
        agrupadoPorPlan[act.plan].totalAdjudicado += act.importes.importeAdjudicacion;
        agrupadoPorPlan[act.plan].totalJustificado +=
          act.liquidacion.justificadoEnPlazo +
          act.liquidacion.justificadoEnPlazoConDeficiencias +
          act.liquidacion.justificadoFueraDePlazo;
        agrupadoPorPlan[act.plan].count++;
      });

      const totalGlobal = Object.values(agrupadoPorPlan).reduce((acc, p) => acc + p.totalAdjudicado, 0);

      return Object.entries(agrupadoPorPlan).map(([planNombre, datos], idx) => ({
        id: planNombre,
        nombre: planNombre,
        descripcion: `${datos.count} actuaciones registradas`,
        valor: datos.totalAdjudicado,
        cantidad: datos.count,
        color: coloresPlanes[idx % coloresPlanes.length],
        porcentaje: totalGlobal > 0 ? (datos.totalAdjudicado / totalGlobal) * 100 : 0
      }));
    }

    // Por Estado General de Calificación Técnica
    const agrupadoEstado: Record<string, { total: number; count: number }> = {
      conforme: { total: 0, count: 0 },
      con_deficiencias: { total: 0, count: 0 },
      en_revision: { total: 0, count: 0 },
      pendiente: { total: 0, count: 0 }
    };

    actuacionesFiltradas.forEach((act) => {
      const estado = act.estadoGeneral === 'justificado' ? 'conforme' : act.estadoGeneral;
      if (agrupadoEstado[estado]) {
        agrupadoEstado[estado].total += act.importes.importeAdjudicacion;
        agrupadoEstado[estado].count++;
      } else {
        agrupadoEstado.pendiente.total += act.importes.importeAdjudicacion;
        agrupadoEstado.pendiente.count++;
      }
    });

    const totalEstados = Object.values(agrupadoEstado).reduce((acc, t) => acc + t.total, 0);
    const nombresEstados: Record<string, string> = {
      conforme: 'Conforme y Justificado',
      con_deficiencias: 'Con Deficiencias (Subsanando)',
      en_revision: 'En Revisión Técnica',
      pendiente: 'Pendiente de Presentación'
    };
    const coloresEstados: Record<string, string> = {
      conforme: COLORES_FREST.exito,
      con_deficiencias: COLORES_FREST.alerta,
      en_revision: COLORES_FREST.info,
      pendiente: COLORES_FREST.primario
    };

    return Object.entries(agrupadoEstado)
      .filter(([_, d]) => d.total > 0 || d.count > 0)
      .map(([estado, d]) => ({
        id: estado,
        nombre: nombresEstados[estado] || estado,
        descripcion: `${d.count} actuaciones técnicas`,
        valor: d.total,
        cantidad: d.count,
        color: coloresEstados[estado] || COLORES_FREST.gris,
        porcentaje: totalEstados > 0 ? (d.total / totalEstados) * 100 : 0
      }));
  }, [modoVisualizacion, metricasConsolidadas, actuacionesFiltradas]);

  // Manejador interactivo al hacer hover en rebanadas
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Elemento activo actual o métrica global central
  const elementoActivo = activeIndex !== null && datosDona[activeIndex] ? datosDona[activeIndex] : null;

  // Custom Tooltip Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-[#1A2332]/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xl max-w-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-bold text-xs text-[#475F7B] dark:text-white truncate">
              {data.nombre}
            </span>
          </div>
          <div className="text-base font-black text-[#475F7B] dark:text-white font-mono">
            {formatearMoneda(data.valor)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#727E8C] dark:text-slate-400 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Cuota consolidada:</span>
            <span className="font-bold text-[#475F7B] dark:text-white">
              {formatearPorcentaje(data.porcentaje)}
            </span>
          </div>
          {data.cantidad !== undefined && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Actuaciones:</span>
              <span className="font-semibold text-[#0063A2] dark:text-sky-400">{data.cantidad} expedientes</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-[#EEF2F6] rounded-3xl border border-[#CBD5E1] shadow-xs p-6 flex flex-col justify-between relative overflow-hidden ${className}`}>
      {/* 1. CABECERA DEL WIDGET CON IDENTIDAD DIPUTACIÓN Y SELECTORES */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {mostrarCabeceraInstitucional && (
            <div className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <CadizLogo size="sm" showText={false} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#1C2E3D] dark:text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#36799C] dark:text-sky-400" />
                <span>Estado Consolidado de Ejecución Presupuestaria</span>
              </h2>
              <button
                type="button"
                onClick={() => setMostrarAyudaBase14(!mostrarAyudaBase14)}
                title="Información sobre reglas de liquidación Base 14"
                className="text-[#6C7D8E] hover:text-[#283949] transition p-0.5"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-[#6C7D8E] dark:text-slate-400 mt-0.5">
              Supervisión de créditos comprometidos, justificados y pendientes según Bases Reguladoras
            </p>
          </div>
        </div>

        {/* Controles de vista y filtros */}
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
          {/* Selector de modo */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setModoVisualizacion('liquidacion')}
              className={`px-3 py-1.5 rounded-xl transition ${
                modoVisualizacion === 'liquidacion'
                  ? 'bg-white dark:bg-[#1E2738] text-[#1C2E3D] dark:text-white shadow-xs'
                  : 'text-[#6C7D8E] hover:text-[#1C2E3D] dark:hover:text-white'
              }`}
            >
              Base 14
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacion('planes')}
              className={`px-3 py-1.5 rounded-xl transition ${
                modoVisualizacion === 'planes'
                  ? 'bg-white dark:bg-[#1E2738] text-[#1C2E3D] dark:text-white shadow-xs'
                  : 'text-[#6C7D8E] hover:text-[#1C2E3D] dark:hover:text-white'
              }`}
            >
              Planes
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacion('estados')}
              className={`px-3 py-1.5 rounded-xl transition ${
                modoVisualizacion === 'estados'
                  ? 'bg-white dark:bg-[#1E2738] text-[#1C2E3D] dark:text-white shadow-xs'
                  : 'text-[#6C7D8E] hover:text-[#1C2E3D] dark:hover:text-white'
              }`}
            >
              Calificación
            </button>
          </div>

          {/* Filtro por Plan provincial si está habilitado */}
          {mostrarFiltroPlan && (
            <div className="relative">
              <select
                value={filtroPlan}
                onChange={(e) => {
                  setFiltroPlan(e.target.value);
                  if (onSelectPlan) onSelectPlan(e.target.value);
                }}
                className="pl-2.5 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E2738] text-xs font-bold text-slate-700 dark:text-white focus:outline-hidden focus:border-[#0063A2] cursor-pointer"
              >
                <option value="todos">Todos los Planes</option>
                {planes.map((p) => (
                  <option key={p.id} value={p.nombre}>
                    {p.codigo} - {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Banner Informativo Desplegable sobre Criterios Base 14 */}
      {mostrarAyudaBase14 && (
        <div className="my-3 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-[#0063A2] dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[#0063A2] dark:text-sky-300">Criterios de Liquidación Económica (Base 14):</span>
              <p className="leading-relaxed text-[11px]">
                El cálculo consolida las actuaciones conforme a los plazos improrrogables de ejecución y justificación. Las certificaciones y facturas presentadas en plazo sin objeciones componen la cuota <strong className="text-emerald-600 dark:text-emerald-400">Conforme</strong>. Aquellas con subsanación documental requerida se computan como <strong className="text-amber-600 dark:text-amber-400">En Deficiencias</strong>, y los importes extemporáneos sin causa de fuerza mayor son propuestos para <strong className="text-rose-600 dark:text-rose-400">Reintegro</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. CUERPO PRINCIPAL: GRÁFICO DE DONA CON RECHARTS A LA IZQUIERDA + LEYENDA DETALLADA A LA DERECHA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 items-center">
        {/* Gráfico de Dona con Recharts */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[280px]">
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  {...({
                    data: datosDona,
                    cx: "50%",
                    cy: "50%",
                    innerRadius: 72,
                    outerRadius: 108,
                    paddingAngle: 3,
                    dataKey: "valor",
                    nameKey: "nombre",
                    activeIndex: activeIndex !== null ? activeIndex : undefined,
                    activeShape: renderActiveShape,
                    onMouseEnter: onPieEnter,
                    onMouseLeave: onPieLeave,
                    animationBegin: 0,
                    animationDuration: 900
                  } as any)}
                >
                  {datosDona.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.id}-${index}`}
                      fill={entry.color}
                      stroke="transparent"
                      className="cursor-pointer transition-all duration-300"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Núcleo Central del Donut con métrica viva y porcentaje consolidado */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {elementoActivo ? (
              <div className="animate-in fade-in zoom-in-90 duration-150 px-2 max-w-[150px]">
                <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">
                  {elementoActivo.nombre}
                </span>
                <span className="text-xl font-black text-slate-800 dark:text-white font-mono block leading-tight">
                  {formatearPorcentaje(elementoActivo.porcentaje)}
                </span>
                <span className="text-[10px] font-bold text-[#0063A2] dark:text-sky-400 block mt-0.5">
                  {formatearMoneda(elementoActivo.valor)}
                </span>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-90 duration-150 px-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block">
                  Ejecución Base 14
                </span>
                <span className="text-2xl font-black text-slate-800 dark:text-white font-mono block leading-none my-1">
                  {formatearPorcentaje(metricasConsolidadas.porcentajeEjecucion)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 inline-block">
                  {formatearMoneda(metricasConsolidadas.totalJustificadoValido)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Leyenda interactiva y lista de partidas */}
        <div className="lg:col-span-6 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
            <span>Partida Presupuestaria</span>
            <span>Importe & Cuota</span>
          </div>

          <div className="space-y-2">
            {datosDona.map((item, idx) => {
              const isSelected = activeIndex === idx;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-[#0063A2] bg-[#0063A2]/5 dark:bg-[#0063A2]/10 shadow-xs'
                      : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#1E2738]/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {item.nombre}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {item.descripcion}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-slate-800 dark:text-white font-mono">
                      {formatearMoneda(item.valor)}
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[10px] font-bold text-[#0063A2] dark:text-sky-400">
                        {formatearPorcentaje(item.porcentaje)}
                      </span>
                      {item.cantidad !== undefined && (
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">
                          ({item.cantidad} exp.)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. RESUMEN FINANCIERO CONSOLIDADOS (4 MINI TARJETAS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        {/* KPI 1: Subvención Total */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2738]/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Euro className="w-3.5 h-3.5 text-[#0063A2] dark:text-sky-400" />
            <span>Subvencionado</span>
          </div>
          <div className="mt-1 text-sm sm:text-base font-black text-slate-800 dark:text-white font-mono truncate">
            {formatearMoneda(metricasConsolidadas.totalConcesion)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {actuacionesFiltradas.length} actuaciones totales
          </span>
        </div>

        {/* KPI 2: Total Adjudicado */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2738]/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#727E8C] uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#00CFDD]" />
            <span>Adjudicado</span>
          </div>
          <div className="mt-1 text-sm sm:text-base font-black text-[#475F7B] dark:text-white font-mono truncate">
            {formatearMoneda(metricasConsolidadas.totalAdjudicacion)}
          </div>
          <span className="text-[10px] text-[#00CFDD] font-semibold mt-0.5">
            Base contractual
          </span>
        </div>

        {/* KPI 3: Justificado Conforme */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2738]/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#727E8C] uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#39DA8A]" />
            <span>Validado Conforme</span>
          </div>
          <div className="mt-1 text-sm sm:text-base font-black text-[#39DA8A] font-mono truncate">
            {formatearMoneda(metricasConsolidadas.totalJustificadoEnPlazo)}
          </div>
          <span className="text-[10px] text-[#39DA8A] font-bold mt-0.5">
            {formatearPorcentaje(metricasConsolidadas.porcentajeConforme)} del total
          </span>
        </div>

        {/* KPI 4: No Justificado / Reintegro */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2738]/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#727E8C] uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FF5B5C]" />
            <span>Reintegro / Extemp.</span>
          </div>
          <div className="mt-1 text-sm sm:text-base font-black text-[#FF5B5C] font-mono truncate">
            {formatearMoneda(metricasConsolidadas.totalNoJustificado)}
          </div>
          <span className="text-[10px] text-[#FF5B5C] font-semibold mt-0.5">
            {metricasConsolidadas.conteos.noJustificado} con deficiencias graves
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardWidget;
