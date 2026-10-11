import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  ChevronRight,
  Layers,
  Euro,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Edit
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlanSubvencion } from '../types';
import { formatearMoneda, formatearFecha } from '../utils/pdfExport';
import { NuevoPlanView } from './NuevoPlanView';
import { PlanDetalleView } from './PlanDetalleView';
import { EditarPlanModal } from './EditarPlanModal';

interface PlanesViewProps {
  onAbrirActuacion: (actuacionId: string) => void;
}

export const PlanesView: React.FC<PlanesViewProps> = ({ onAbrirActuacion }) => {
  const { planes } = useApp();

  // Estados de navegación interna de la página PLANES:
  // 'lista' = Vista principal requerida
  // 'alta' = Otra página dedicada para dar de alta nuevo plan (Forma 1 o Forma 2)
  // 'detalle' = Al pulsar "Entrar en el plan"
  const [vista, setVista] = useState<'lista' | 'alta' | 'detalle'>('lista');
  const [planSeleccionadoId, setPlanSeleccionadoId] = useState<string | null>(null);
  const [planAEditar, setPlanAEditar] = useState<PlanSubvencion | null>(null);
  const [planDirecto, setPlanDirecto] = useState<PlanSubvencion | null>(null);

  // Filtros de búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroAno, setFiltroAno] = useState<string>('');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Plan actualmente seleccionado para el detalle
  const planSeleccionado = useMemo(() => {
    if (!planSeleccionadoId) return null;
    const encontrado = planes.find((p) => p.id === planSeleccionadoId);
    if (encontrado) return encontrado;
    if (planDirecto && planDirecto.id === planSeleccionadoId) return planDirecto;
    return null;
  }, [planes, planSeleccionadoId, planDirecto]);

  // Años únicos presentes en los planes para el selector de filtros (ordenados de más antiguos a más nuevos)
  const anosDisponibles = useMemo(() => {
    const years = Array.from(new Set(planes.map((p) => p.ejercicio))).filter(Boolean);
    return years.sort((a, b) => a - b);
  }, [planes]);

  // 1. Resumen de todos los planes:
  // - Planes totales
  // - Importes totales de la suma de todos los planes
  // - Número de actuaciones totales
  const totalPlanes = planes.length;
  const importeTotalPlanes = useMemo(() => {
    return planes.reduce((acc, p) => acc + (p.presupuestoTotal || 0), 0);
  }, [planes]);

  const totalActuacionesPlanes = useMemo(() => {
    return planes.reduce((acc, p) => acc + (p.actuacionesPrevistas?.length || 0), 0);
  }, [planes]);

  // 2. Planes ordenados de más antiguos a más nuevos (con búsqueda y filtro por año)
  const planesFiltradosYOrdenados = useMemo(() => {
    return planes
      .filter((plan) => {
        const coincideAno = !filtroAno || String(plan.ejercicio) === filtroAno;
        const coincideTexto =
          !busqueda.trim() ||
          plan.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          plan.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
          String(plan.ejercicio).includes(busqueda);
        return coincideAno && coincideTexto;
      })
      .sort((a, b) => {
        // De más antiguos a más nuevos
        if (a.ejercicio !== b.ejercicio) {
          return a.ejercicio - b.ejercicio;
        }
        return a.nombre.localeCompare(b.nombre);
      });
  }, [planes, filtroAno, busqueda]);

  // Subpágina 1: Dar de alta nuevo plan
  if (vista === 'alta') {
    return (
      <NuevoPlanView
        onVolver={() => setVista('lista')}
        onPlanCreado={(nuevoPlanId, planCreado) => {
          if (planCreado) setPlanDirecto(planCreado);
          setPlanSeleccionadoId(nuevoPlanId);
          setVista('detalle');
          setMensajeExito('Plan dado de alta con éxito en el sistema con todas sus EELL y actuaciones.');
          setTimeout(() => setMensajeExito(null), 5000);
        }}
      />
    );
  }

  // Subpágina 2: Detalle al entrar en el plan
  if (vista === 'detalle' && planSeleccionado) {
    return (
      <PlanDetalleView
        plan={planSeleccionado}
        onVolver={() => setVista('lista')}
        onAbrirActuacion={onAbrirActuacion}
      />
    );
  }

  // =====================================================================
  // PÁGINA PRINCIPAL: PLANES (Minimalista, súper claro, letras mínimas)
  // =====================================================================
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Mensaje de éxito discreto */}
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

      {/* 1. PRIMERA FILA: RESUMEN DE TODOS LOS PLANES + BOTÓN ÚNICO DAR DE ALTA UN NUEVO PLAN */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Resumen minimalista: Planes totales, Importe total, Actuaciones totales */}
        <div className="flex items-center gap-6 sm:gap-10 flex-wrap">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Planes Totales
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {totalPlanes}
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6 sm:pl-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Importe Total
            </span>
            <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 mt-0.5">
              {formatearMoneda(importeTotalPlanes)}
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6 sm:pl-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Actuaciones Totales
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#004F90] mt-0.5">
              {totalActuacionesPlanes}
            </div>
          </div>
        </div>

        {/* A la derecha: UN SOLO BOTÓN de Dar de Alta un nuevo plan */}
        <button
          type="button"
          onClick={() => setVista('alta')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#004F90] hover:bg-[#003B71] text-white text-xs font-black shadow-xs transition shrink-0 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Dar de Alta un nuevo plan</span>
        </button>
      </div>

      {/* 2. DEBAJO DE ESTO: BUSCADOR DE PLANES CON FILTROS POR AÑO */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Buscador de texto */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar plan por nombre o código..."
            className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="text-[11px] text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Filtros por Año (Minimalista) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFiltroAno('')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              filtroAno === ''
                ? 'bg-[#004F90] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          {anosDisponibles.map((ano) => (
            <button
              key={ano}
              type="button"
              onClick={() => setFiltroAno(String(ano))}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                filtroAno === String(ano)
                  ? 'bg-[#004F90] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ano}
            </button>
          ))}
        </div>
      </div>

      {/* 3. LISTADO DE PLANES: EN FILAS DE IZQUIERDA A DERECHA SEGÚN ORDEN ESPECIFICADO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-3.5 px-3.5 text-center w-20">Anualidad</th>
                <th className="py-3.5 px-4 min-w-[240px]">Nombre del Plan</th>
                <th className="py-3.5 px-3 text-center w-24">Vigencia</th>
                <th className="py-3.5 px-4 text-right min-w-[130px]">Importe</th>
                <th className="py-3.5 px-4 min-w-[170px]">Plazo Máx. de Ejecución</th>
                <th className="py-3.5 px-4 min-w-[170px]">Plazo Máx. Justificación</th>
                <th className="py-3.5 px-3 text-center min-w-[110px]">Número de Actuaciones</th>
                <th className="py-3.5 px-4 text-right min-w-[140px]">Entrar en Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {planesFiltradosYOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                    No se encontraron planes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                planesFiltradosYOrdenados.map((plan) => {
                  const tieneAmpEjecucion =
                    plan.plazoEjecucionAmpliado &&
                    plan.plazoEjecucionAmpliado !== plan.plazoEjecucionMaximo;
                  const tieneAmpJustificacion =
                    plan.plazoJustificacionAmpliado &&
                    plan.plazoJustificacionAmpliado !== plan.plazoJustificacionMaximo;

                  const numActuaciones = plan.actuacionesPrevistas?.length || 0;

                  return (
                    <tr
                      key={plan.id}
                      onClick={() => {
                        setPlanSeleccionadoId(plan.id);
                        setVista('detalle');
                      }}
                      className="hover:bg-blue-50/20 transition cursor-pointer group"
                    >
                      {/* 1. ANUALIDAD */}
                      <td className="py-3.5 px-3.5 text-center align-middle whitespace-nowrap">
                        <div className="w-12 h-8 rounded-lg bg-blue-50 text-[#004F90] border border-blue-200 flex items-center justify-center font-mono font-black text-xs mx-auto shadow-2xs">
                          {plan.ejercicio}
                        </div>
                      </td>

                      {/* 2. NOMBRE DEL PLAN */}
                      <td className="py-3.5 px-4 align-middle">
                        <div
                          className="font-black text-slate-900 text-xs sm:text-sm group-hover:text-[#004F90] transition leading-snug"
                          title={plan.nombre}
                        >
                          {plan.nombre}
                        </div>
                        {plan.codigo && (
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                            {plan.codigo}
                          </span>
                        )}
                      </td>

                      {/* 3. VIGENCIA */}
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            plan.activo
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {plan.activo ? 'Vigente' : 'Cerrado'}
                        </span>
                      </td>

                      {/* 4. IMPORTE */}
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                        <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                          {formatearMoneda(plan.presupuestoTotal)}
                        </span>
                      </td>

                      {/* 5. PLAZO MAX. DE EJECUCIÓN Y DEBAJO AMPLIADO */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-1 font-bold text-slate-800 text-xs whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-[#004F90] shrink-0" />
                          <span>{formatearFecha(plan.plazoEjecucionMaximo)}</span>
                        </div>
                        {tieneAmpEjecucion ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 inline-block whitespace-nowrap">
                            Ampliado: {formatearFecha(plan.plazoEjecucionAmpliado)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 mt-0.5 block whitespace-nowrap">
                            Sin ampliación
                          </span>
                        )}
                      </td>

                      {/* 6. PLAZO MAX JUSTIFICACIÓN Y DEBAJO AMPLIACIÓN */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-1 font-bold text-slate-800 text-xs whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{formatearFecha(plan.plazoJustificacionMaximo)}</span>
                        </div>
                        {tieneAmpJustificacion ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1 inline-block whitespace-nowrap">
                            Ampliación: {formatearFecha(plan.plazoJustificacionAmpliado)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 mt-0.5 block whitespace-nowrap">
                            Sin ampliación
                          </span>
                        )}
                      </td>

                      {/* 7. NÚMERO DE ACTUACIONES */}
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        <span className="font-bold text-[#004F90] text-xs">
                          {numActuaciones} {numActuaciones === 1 ? 'actuación' : 'actuaciones'}
                        </span>
                      </td>

                      {/* 8. BOTON ENTRAR EN PLAN */}
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlanSeleccionadoId(plan.id);
                            setVista('detalle');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#004F90] hover:bg-[#003B71] text-white text-xs font-black shadow-2xs transition active:scale-[0.98]"
                          title="Entrar en el plan para ver sus actuaciones y municipios"
                        >
                          <span>Entrar en el plan</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para editar datos principales del plan */}
      {planAEditar && (
        <EditarPlanModal
          plan={planAEditar}
          mostrar={!!planAEditar}
          onCerrar={() => setPlanAEditar(null)}
        />
      )}
    </div>
  );
};
