import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useApp } from '../context/AppContext';
import { Actuacion } from '../types';
import { formatearMoneda, formatearPorcentaje } from '../utils/pdfExport';
import { limpiarNombreEELL } from '../utils/eellUtils';
import {
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  Euro,
  Building2,
  ChevronRight
} from 'lucide-react';

interface AnualidadData {
  ano: number;
  pendientes: number;
  enRevision: number;
  aprobadas: number;
  total: number;
  importeTotal: number;
}

interface ResumenActuacionesD3Props {
  onVerActuaciones?: () => void;
  className?: string;
}

export const ResumenActuacionesD3: React.FC<ResumenActuacionesD3Props> = ({
  onVerActuaciones,
  className = ''
}) => {
  const { actuaciones, planes } = useApp();
  const [anoSeleccionado, setAnoSeleccionado] = useState<number | 'todos'>('todos');
  const [tipoGrafico, setTipoGrafico] = useState<'barras' | 'donut'>('barras');
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    titulo: string;
    items: { label: string; valor: number | string; color: string }[];
  }>({
    visible: false,
    x: 0,
    y: 0,
    titulo: '',
    items: []
  });

  const barChartRef = useRef<SVGSVGElement | null>(null);
  const donutChartRef = useRef<SVGSVGElement | null>(null);

  // 1. Consolidación de todas las actuaciones del sistema (tanto dadas de alta como previstas en planes)
  const todasLasActuaciones = useMemo(() => {
    const mapa = new Map<string, Actuacion>();
    actuaciones.forEach((a) => mapa.set(a.id, a));

    planes.forEach((pl) => {
      (pl.actuacionesPrevistas || []).forEach((pr, idx) => {
        const yaExiste = Array.from(mapa.values()).some(
          (a) =>
            (a.plan.toLowerCase() === pl.nombre.toLowerCase() ||
              a.plan.toLowerCase() === pl.codigo?.toLowerCase()) &&
            (a.numero === pr.numero || a.id === pr.actuacionGeneradaId)
        );
        if (!yaExiste) {
          const pto =
            pr.subvencionSolicitada ||
            (pl.presupuestoTotal > 0
              ? Math.round(pl.presupuestoTotal / (pl.actuacionesPrevistas?.length || 1))
              : 150000);
          const synth: Actuacion = {
            id: pr.actuacionGeneradaId || pr.id || `act-plan-${pl.id}-${idx}`,
            numero: pr.numero || `${idx + 1}.1`,
            plan: pl.nombre,
            entidadLocal: limpiarNombreEELL(pr.entidadLocal) || 'Entidad Local',
            titulo: pr.titulo || `Actuación ${pr.numero} en ${limpiarNombreEELL(pr.entidadLocal)}`,
            aplicacionPresupuestaria:
              pr.aplicacionPresupuestaria || `${pl.ejercicio || 2026}-03-920-${46200 + idx}`,
            plazos: {
              plazoEjecucion: pr.plazoEjecucion || pl.plazoEjecucionMaximo,
              plazoJustificacion: pr.plazoJustificacion || pl.plazoJustificacionMaximo,
              plazoEjecucionAmpliado: pl.plazoEjecucionAmpliado || pl.plazoEjecucionMaximo,
              plazoJustificacionAmpliado: pl.plazoJustificacionAmpliado || pl.plazoJustificacionMaximo
            },
            importes: {
              importeActuacion: Math.round(pto * 1.1 * 100) / 100,
              importeConcesion: pto,
              importeAdjudicacion: pto
            },
            documentos: [],
            liquidacion: {
              adjudicacion: pto,
              justificadoEnPlazo: 0,
              justificadoEnPlazoConDeficiencias: 0,
              justificadoFueraDePlazo: 0,
              justificadoFueraDePlazoConDeficiencias: 0,
              noJustificado: 0,
              observacionesLiquidacion: ''
            },
            estadoGeneral: 'pendiente',
            tecnicoAsignadoId: '',
            tecnicoAsignadoNombre: '',
            fechaCreacion: pl.fechaCreacion || new Date().toISOString(),
            fechaModificacion: pl.fechaCreacion || new Date().toISOString()
          };
          mapa.set(synth.id, synth);
        }
      });
    });

    return Array.from(mapa.values());
  }, [actuaciones, planes]);

  // Extraer año / anualidad de una actuación
  const extraerAno = (act: Actuacion): number => {
    if ((act as any).ano) return Number((act as any).ano);
    if ((act as any).ejercicio) return Number((act as any).ejercicio);
    const pl = planes.find(
      (p) =>
        p.nombre.toLowerCase() === act.plan.toLowerCase() ||
        p.codigo?.toLowerCase() === act.plan.toLowerCase()
    );
    if (pl?.ejercicio) return pl.ejercicio;
    const match = act.plan.match(/\b(202\d)\b/);
    if (match) return parseInt(match[1], 10);
    return 2026;
  };

  // Clasificar estado en: Pendiente, En Revisión, Aprobada
  const clasificarEstado = (
    estado: string
  ): 'pendientes' | 'enRevision' | 'aprobadas' => {
    if (estado === 'conforme' || estado === 'justificado') return 'aprobadas';
    if (estado === 'en_revision' || estado === 'con_deficiencias') return 'enRevision';
    return 'pendientes';
  };

  // 2. Agrupación por Anualidad
  const datosPorAnualidad = useMemo((): AnualidadData[] => {
    const mapa = new Map<number, AnualidadData>();

    todasLasActuaciones.forEach((act) => {
      const ano = extraerAno(act);
      if (!mapa.has(ano)) {
        mapa.set(ano, {
          ano,
          pendientes: 0,
          enRevision: 0,
          aprobadas: 0,
          total: 0,
          importeTotal: 0
        });
      }
      const item = mapa.get(ano)!;
      item.total += 1;
      item.importeTotal += Number(act.importes?.importeConcesion || act.importes?.importeActuacion || 0);

      const cat = clasificarEstado(act.estadoGeneral);
      item[cat] += 1;
    });

    return Array.from(mapa.values()).sort((a, b) => a.ano - b.ano);
  }, [todasLasActuaciones]);

  // Años disponibles ordenados
  const anosDisponibles = useMemo(() => {
    return datosPorAnualidad.map((d) => d.ano);
  }, [datosPorAnualidad]);

  // Métricas para la selección actual (global o por año)
  const metricasActuales = useMemo(() => {
    if (anoSeleccionado === 'todos') {
      const pendientes = datosPorAnualidad.reduce((acc, d) => acc + d.pendientes, 0);
      const enRevision = datosPorAnualidad.reduce((acc, d) => acc + d.enRevision, 0);
      const aprobadas = datosPorAnualidad.reduce((acc, d) => acc + d.aprobadas, 0);
      const total = pendientes + enRevision + aprobadas;
      const importeTotal = datosPorAnualidad.reduce((acc, d) => acc + d.importeTotal, 0);

      return {
        titulo: 'Todas las anualidades',
        pendientes,
        enRevision,
        aprobadas,
        total,
        importeTotal,
        porcAprobadas: total > 0 ? Math.round((aprobadas / total) * 100) : 0,
        porcEnRevision: total > 0 ? Math.round((enRevision / total) * 100) : 0,
        porcPendientes: total > 0 ? Math.round((pendientes / total) * 100) : 0
      };
    }

    const d = datosPorAnualidad.find((it) => it.ano === anoSeleccionado) || {
      ano: anoSeleccionado,
      pendientes: 0,
      enRevision: 0,
      aprobadas: 0,
      total: 0,
      importeTotal: 0
    };
    const total = d.total;

    return {
      titulo: `Anualidad ${d.ano}`,
      pendientes: d.pendientes,
      enRevision: d.enRevision,
      aprobadas: d.aprobadas,
      total: d.total,
      importeTotal: d.importeTotal,
      porcAprobadas: total > 0 ? Math.round((d.aprobadas / total) * 100) : 0,
      porcEnRevision: total > 0 ? Math.round((d.enRevision / total) * 100) : 0,
      porcPendientes: total > 0 ? Math.round((d.pendientes / total) * 100) : 0
    };
  }, [datosPorAnualidad, anoSeleccionado]);

  // Paleta institucional para los tres estados
  const colorAprobadas = '#059669'; // Emerald 600
  const colorEnRevision = '#D97706'; // Amber 600
  const colorPendientes = '#64748B'; // Slate 500

  // 3. Renderizado D3: GRÁFICO DE BARRAS AGRUPADAS POR ANUALIDAD
  useEffect(() => {
    if (!barChartRef.current || datosPorAnualidad.length === 0 || tipoGrafico !== 'barras') return;

    const svg = d3.select(barChartRef.current);
    svg.selectAll('*').remove();

    const width = 580;
    const height = 240;
    const margin = { top: 25, right: 20, bottom: 35, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Escala X para las anualidades
    const x0 = d3
      .scaleBand()
      .domain(datosPorAnualidad.map((d) => String(d.ano)))
      .rangeRound([0, innerWidth])
      .paddingInner(0.25);

    // Sub-escala para los 3 estados
    const keys: ('pendientes' | 'enRevision' | 'aprobadas')[] = [
      'pendientes',
      'enRevision',
      'aprobadas'
    ];
    const x1 = d3
      .scaleBand()
      .domain(keys)
      .rangeRound([0, x0.bandwidth()])
      .padding(0.12);

    const maxValor = d3.max(datosPorAnualidad, (d) => Math.max(d.pendientes, d.enRevision, d.aprobadas)) || 10;
    const y = d3
      .scaleLinear()
      .domain([0, Math.ceil(maxValor * 1.15)])
      .nice()
      .rangeRound([innerHeight, 0]);

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(keys)
      .range([colorPendientes, colorEnRevision, colorAprobadas]);

    // Líneas de cuadrícula horizontales
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#E2E8F0')
      .attr('stroke-dasharray', '2,2');

    g.select('.grid .domain').remove();

    // Eje X
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x0).tickSize(0))
      .call((axisG) => axisG.select('.domain').attr('stroke', '#CBD5E1'))
      .selectAll('text')
      .attr('fill', '#334155')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('dy', '1em');

    // Eje Y
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call((axisG) => axisG.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#64748B')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Grupos de barras por año
    const grupos = g
      .selectAll('.grupo-ano')
      .data(datosPorAnualidad)
      .enter()
      .append('g')
      .attr('class', 'grupo-ano')
      .attr('transform', (d) => `translate(${x0(String(d.ano))},0)`)
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        setAnoSeleccionado((prev) => (prev === d.ano ? 'todos' : d.ano));
      });

    // Barras
    grupos
      .selectAll('rect')
      .data((d) =>
        keys.map((key) => ({
          key,
          value: d[key],
          ano: d.ano,
          total: d.total
        }))
      )
      .enter()
      .append('rect')
      .attr('x', (d) => x1(d.key)!)
      .attr('y', innerHeight)
      .attr('width', x1.bandwidth())
      .attr('height', 0)
      .attr('fill', (d) => colorScale(d.key))
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('opacity', (d) => (anoSeleccionado === 'todos' || anoSeleccionado === d.ano ? 1 : 0.35))
      .on('mouseenter', (event, d) => {
        const labels: Record<string, string> = {
          pendientes: 'Pendientes',
          enRevision: 'En Revisión',
          aprobadas: 'Aprobadas'
        };
        const pct = d.total > 0 ? Math.round((d.value / d.total) * 100) : 0;
        const rect = (event.currentTarget as SVGRectElement).getBoundingClientRect();
        setTooltipData({
          visible: true,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          titulo: `Anualidad ${d.ano} · ${labels[d.key]}`,
          items: [
            { label: 'Actuaciones', valor: d.value, color: colorScale(d.key) },
            { label: '% del año', valor: `${pct}%`, color: '#64748B' },
            { label: 'Total anual', valor: d.total, color: '#004F90' }
          ]
        });
      })
      .on('mouseleave', () => {
        setTooltipData((prev) => ({ ...prev, visible: false }));
      })
      .transition()
      .duration(600)
      .delay((_, i) => i * 80)
      .attr('y', (d) => y(d.value))
      .attr('height', (d) => Math.max(0, innerHeight - y(d.value)));

    // Etiquetas numéricas encima de cada barra
    grupos
      .selectAll('.barra-label')
      .data((d) =>
        keys.map((key) => ({
          key,
          value: d[key]
        }))
      )
      .enter()
      .append('text')
      .attr('class', 'barra-label')
      .attr('x', (d) => x1(d.key)! + x1.bandwidth() / 2)
      .attr('y', (d) => (d.value > 0 ? y(d.value) - 4 : innerHeight - 4))
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .attr('fill', '#475569')
      .text((d) => (d.value > 0 ? d.value : ''));
  }, [datosPorAnualidad, anoSeleccionado, tipoGrafico]);

  // 4. Renderizado D3: GRÁFICO DONUT RADIAL
  useEffect(() => {
    if (!donutChartRef.current || tipoGrafico !== 'donut') return;

    const svg = d3.select(donutChartRef.current);
    svg.selectAll('*').remove();

    const width = 280;
    const height = 240;
    const radius = Math.min(width, height) / 2 - 20;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const dataPie = [
      { estado: 'Aprobadas', valor: metricasActuales.aprobadas, color: colorAprobadas },
      { estado: 'En Revisión', valor: metricasActuales.enRevision, color: colorEnRevision },
      { estado: 'Pendientes', valor: metricasActuales.pendientes, color: colorPendientes }
    ];

    const pie = d3
      .pie<{ estado: string; valor: number; color: string }>()
      .value((d) => d.valor)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<{ estado: string; valor: number; color: string }>>()
      .innerRadius(radius * 0.62)
      .outerRadius(radius)
      .cornerRadius(4);

    const arcHover = d3
      .arc<d3.PieArcDatum<{ estado: string; valor: number; color: string }>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius + 6)
      .cornerRadius(4);

    const arcs = g
      .selectAll('.arc')
      .data(pie(dataPie))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', (d) => arc(d)!)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', (a) => arcHover(a as any)!);

        const rect = (event.currentTarget as SVGPathElement).getBoundingClientRect();
        const pct = metricasActuales.total > 0 ? Math.round((d.data.valor / metricasActuales.total) * 100) : 0;
        setTooltipData({
          visible: true,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          titulo: `${d.data.estado} · ${metricasActuales.titulo}`,
          items: [
            { label: 'Actuaciones', valor: d.data.valor, color: d.data.color },
            { label: 'Porcentaje', valor: `${pct}%`, color: '#64748B' }
          ]
        });
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', (a) => arc(a as any)!);
        setTooltipData((prev) => ({ ...prev, visible: false }));
      });

    // Texto central
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('font-size', '20px')
      .attr('font-weight', '900')
      .attr('fill', '#0F172A')
      .text(metricasActuales.total);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#64748B')
      .attr('text-transform', 'uppercase')
      .text('Actuaciones');
  }, [metricasActuales, tipoGrafico]);

  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4 ${className}`}>
      {/* Encabezado del componente con selector de anualidad y tipo de gráfico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-blue-50 text-[#004F90] border border-blue-200 shadow-sm">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Estado Global de las Actuaciones por Anualidad
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Visualización interactiva con gráficos D3 del avance técnico y administrativo de todos los planes provinciales
          </p>
        </div>

        {/* Controles: Selector de anualidad y conmutador de gráfico */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Anualidad */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setAnoSeleccionado('todos')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                anoSeleccionado === 'todos'
                  ? 'bg-white text-[#004F90] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            {anosDisponibles.map((ano) => (
              <button
                key={ano}
                type="button"
                onClick={() => setAnoSeleccionado(ano)}
                className={`px-2.5 py-1 rounded-md font-bold font-mono transition ${
                  anoSeleccionado === ano
                    ? 'bg-white text-[#004F90] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ano}
              </button>
            ))}
          </div>

          {/* Conmutador de Gráfico */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setTipoGrafico('barras')}
              className={`p-1.5 rounded-md transition ${
                tipoGrafico === 'barras'
                  ? 'bg-white text-[#004F90] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Gráfico D3 de barras apiladas por anualidad"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTipoGrafico('donut')}
              className={`p-1.5 rounded-md transition ${
                tipoGrafico === 'donut'
                  ? 'bg-white text-[#004F90] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Gráfico D3 donut de distribución global"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {onVerActuaciones && (
            <button
              type="button"
              onClick={onVerActuaciones}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-[#004F90] hover:bg-blue-100 text-xs font-bold border border-blue-200 transition shadow-sm"
              title="Ver todas las actuaciones filtrables"
            >
              <span>Ver actuaciones</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4 TARJETAS DE RESUMEN (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tarjeta 1: Total Actuaciones */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Actuaciones
            </span>
            <span className="p-1 rounded-md bg-white border border-slate-200 text-slate-700 shadow-xs">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {metricasActuales.total}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              en {datosPorAnualidad.length} anualidades
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Presupuesto total:</span>
            <span className="font-mono font-bold text-slate-800">
              {formatearMoneda(metricasActuales.importeTotal)}
            </span>
          </div>
        </div>

        {/* Tarjeta 2: Pendientes */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Pendientes
            </span>
            <span className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 shadow-xs">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800 font-mono">
              {metricasActuales.pendientes}
            </span>
            <span className="text-[11px] font-bold text-slate-500 font-mono">
              ({metricasActuales.porcPendientes}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-slate-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metricasActuales.porcPendientes}%` }}
            />
          </div>
        </div>

        {/* Tarjeta 3: En Revisión */}
        <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              En Revisión
            </span>
            <span className="p-1 rounded-md bg-white border border-amber-200 text-amber-600 shadow-xs">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-900 font-mono">
              {metricasActuales.enRevision}
            </span>
            <span className="text-[11px] font-bold text-amber-700 font-mono">
              ({metricasActuales.porcEnRevision}%)
            </span>
          </div>
          <div className="w-full bg-amber-100 h-1.5 rounded-full mt-2.5 overflow-hidden border border-amber-200">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metricasActuales.porcEnRevision}%` }}
            />
          </div>
        </div>

        {/* Tarjeta 4: Aprobadas */}
        <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Aprobadas (Conformes)
            </span>
            <span className="p-1 rounded-md bg-white border border-emerald-200 text-emerald-600 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-800 font-mono">
              {metricasActuales.aprobadas}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 font-mono">
              ({metricasActuales.porcAprobadas}%)
            </span>
          </div>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-2.5 overflow-hidden border border-emerald-200">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${metricasActuales.porcAprobadas}%` }}
            />
          </div>
        </div>
      </div>

      {/* ÁREA DE GRÁFICOS D3 Y LEYENDA */}
      <div className="pt-2 border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Contenedor del Gráfico D3 */}
        <div className="w-full lg:w-3/5 overflow-x-auto flex justify-center items-center py-2">
          {tipoGrafico === 'barras' ? (
            <svg
              ref={barChartRef}
              viewBox="0 0 580 240"
              className="w-full max-w-[580px] h-auto select-none"
            />
          ) : (
            <svg
              ref={donutChartRef}
              viewBox="0 0 280 240"
              className="w-full max-w-[280px] h-auto select-none"
            />
          )}
        </div>

        {/* Leyenda y Desglose por Anualidad */}
        <div className="w-full lg:w-2/5 space-y-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <span className="text-xs font-bold text-slate-800">
              Distribución · {metricasActuales.titulo}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {metricasActuales.total} total
            </span>
          </div>

          {/* Barra de Distribución Proporcional */}
          <div className="w-full h-3 rounded-full overflow-hidden flex shadow-xs border border-slate-200">
            <div
              className="bg-emerald-600 h-full transition-all duration-500"
              style={{ width: `${metricasActuales.porcAprobadas}%` }}
              title={`Aprobadas: ${metricasActuales.aprobadas} (${metricasActuales.porcAprobadas}%)`}
            />
            <div
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${metricasActuales.porcEnRevision}%` }}
              title={`En Revisión: ${metricasActuales.enRevision} (${metricasActuales.porcEnRevision}%)`}
            />
            <div
              className="bg-slate-400 h-full transition-all duration-500"
              style={{ width: `${metricasActuales.porcPendientes}%` }}
              title={`Pendientes: ${metricasActuales.pendientes} (${metricasActuales.porcPendientes}%)`}
            />
          </div>

          {/* Leyenda con indicadores */}
          <div className="grid grid-cols-3 gap-2 text-xs pt-1">
            <div className="p-2 rounded-md bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                <span className="truncate">Pendientes</span>
              </div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {metricasActuales.pendientes}{' '}
                <span className="text-[10px] text-slate-400 font-normal">
                  ({metricasActuales.porcPendientes}%)
                </span>
              </div>
            </div>

            <div className="p-2 rounded-md bg-white border border-amber-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-amber-800 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">En Revisión</span>
              </div>
              <div className="font-mono font-bold text-amber-900 mt-0.5">
                {metricasActuales.enRevision}{' '}
                <span className="text-[10px] text-amber-600 font-normal">
                  ({metricasActuales.porcEnRevision}%)
                </span>
              </div>
            </div>

            <div className="p-2 rounded-md bg-white border border-emerald-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-emerald-800 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                <span className="truncate">Aprobadas</span>
              </div>
              <div className="font-mono font-bold text-emerald-800 mt-0.5">
                {metricasActuales.aprobadas}{' '}
                <span className="text-[10px] text-emerald-600 font-normal">
                  ({metricasActuales.porcAprobadas}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip flotante interactivo */}
      {tooltipData.visible && (
        <div
          className="fixed pointer-events-none z-50 bg-slate-900/95 text-white px-3 py-2 rounded-lg shadow-md text-xs -translate-x-1/2 -translate-y-full border border-slate-700 animate-in fade-in zoom-in-95 duration-100"
          style={{ left: `${tooltipData.x}px`, top: `${tooltipData.y}px` }}
        >
          <div className="font-bold text-[11px] pb-1 border-b border-slate-700 mb-1">
            {tooltipData.titulo}
          </div>
          <div className="space-y-0.5 text-[10px]">
            {tooltipData.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}:</span>
                </span>
                <span className="font-mono font-bold">{item.valor}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
