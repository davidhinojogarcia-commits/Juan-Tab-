import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileDown,
  Calendar,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  TrendingUp,
  MapPin,
  Sparkles,
  LayoutList,
  LayoutGrid,
  Edit2,
  FileCheck2,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Actuacion, EstadoGeneralActuacion } from '../types';
import { PLANES_DISPONIBLES, MUNICIPIOS_CADIZ } from '../data/initialData';
import { formatearMoneda, formatearFecha, generarInformePDF } from '../utils/pdfExport';
import { exportarTodasActuacionesCSV } from '../utils/csvExport';
import { EditarActuacionModal } from './EditarActuacionModal';

// Helper para extraer el año de una actuación de forma fiable
export const extraerAnoActuacion = (act: Actuacion): string => {
  if (act.aplicacionPresupuestaria) {
    const match = act.aplicacionPresupuestaria.match(/\b(202\d)\b/);
    if (match) return match[1];
  }
  if (act.id) {
    const match = act.id.match(/\b(202\d)\b/);
    if (match) return match[1];
  }
  if (act.plan) {
    const match = act.plan.match(/\b(202\d)\b/);
    if (match) return match[1];
  }
  if (act.plazos?.plazoEjecucion) {
    const match = act.plazos.plazoEjecucion.match(/\b(202\d)\b/);
    if (match) return match[1];
  }
  return '2026';
};

// Helper para limpiar el nombre de la Entidad Local (muestra solo el nombre, sin "Ayuntamiento de ...")
export const formatearNombreEELL = (nombre: string): string => {
  if (!nombre) return '';
  return nombre
    .replace(/^(ayuntamiento\s+de\s+|ayuntamiento\s+del\s+|ayto\.\s+de\s+|ayto\s+de\s+|ayto\.\s+|ayto\s+|diputación\s+de\s+|diputacion\s+de\s+|e\.l\.a\.\s+de\s+|ela\s+de\s+|e\.l\.m\.\s+de\s+|elm\s+de\s+)/i, '')
    .trim();
};

// Helper para limpiar el número de actuación (muestra solo el número, quitando Nº)
export const formatearNumeroActuacion = (num: string): string => {
  if (!num) return '';
  return num.replace(/^N[ºo°\.\s]*/i, '').trim();
};

// Helper para obtener todos los técnicos revisores y participantes que han intervenido en el expediente
export const obtenerTodosTecnicosExpediente = (act: Actuacion): string[] => {
  const tecnicosSet = new Set<string>();

  // 1. Participantes a nivel de actuación
  if (Array.isArray(act.tecnicosParticipantes)) {
    act.tecnicosParticipantes.forEach((t) => {
      if (t && t.trim()) tecnicosSet.add(t.trim());
    });
  }

  // 2. Participantes a nivel de documentos
  if (Array.isArray(act.documentos)) {
    act.documentos.forEach((doc) => {
      if (doc.tecnicoUltimoAcceso && doc.tecnicoUltimoAcceso.trim()) {
        tecnicosSet.add(doc.tecnicoUltimoAcceso.trim());
      }
      if (doc.tecnicoRevisorOriginal && doc.tecnicoRevisorOriginal.trim()) {
        tecnicosSet.add(doc.tecnicoRevisorOriginal.trim());
      }
      if (Array.isArray(doc.tecnicosParticipantes)) {
        doc.tecnicosParticipantes.forEach((t) => {
          if (t && t.trim()) tecnicosSet.add(t.trim());
        });
      }
      if (Array.isArray(doc.historialParticipantes)) {
        doc.historialParticipantes.forEach((h) => {
          if (h.usuarioNombre && h.usuarioNombre.trim()) {
            tecnicosSet.add(h.usuarioNombre.trim());
          }
        });
      }
      if (Array.isArray(doc.rondasSubsanacion)) {
        doc.rondasSubsanacion.forEach((r) => {
          if (r.tecnicoNombre && r.tecnicoNombre.trim()) {
            tecnicosSet.add(r.tecnicoNombre.trim());
          }
        });
      }
      if (doc.informeFavorable?.firmanteNombre && doc.informeFavorable.firmanteNombre.trim()) {
        tecnicosSet.add(doc.informeFavorable.firmanteNombre.trim());
      }
    });
  }

  // 3. Fallback: si aún nadie ha intervenido, mostrar el técnico asignado oficial
  if (tecnicosSet.size === 0 && act.tecnicoAsignadoNombre) {
    tecnicosSet.add(act.tecnicoAsignadoNombre.trim());
  }

  return Array.from(tecnicosSet);
};

interface ActuacionListProps {
  onSeleccionarActuacion: (id: string) => void;
  onAbrirModalNueva: () => void;
}

export const ActuacionList: React.FC<ActuacionListProps> = ({
  onSeleccionarActuacion,
  onAbrirModalNueva
}) => {
  const {
    actuaciones,
    filtros,
    setFiltros,
    limpiarFiltros,
    usuarioActual
  } = useApp();

  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [vistaModo, setVistaModo] = useState<'tabla' | 'tarjetas'>('tabla');
  const [actuacionAEditar, setActuacionAEditar] = useState<Actuacion | null>(null);

  // Filtrado y ordenación cronológica predeterminada
  const actuacionesFiltradas = useMemo(() => {
    return actuaciones
      .filter((act) => {
        const anoAct = extraerAnoActuacion(act);

        // Filtro por palabra clave (busca en título, número, entidad, plan, aplicación, año, importe)
        if (filtros.palabraClave) {
          const q = filtros.palabraClave.toLowerCase().trim();
          const match =
            act.titulo.toLowerCase().includes(q) ||
            act.numero.toLowerCase().includes(q) ||
            act.entidadLocal.toLowerCase().includes(q) ||
            act.plan.toLowerCase().includes(q) ||
            (act.aplicacionPresupuestaria && act.aplicacionPresupuestaria.toLowerCase().includes(q)) ||
            anoAct.includes(q) ||
            act.importes.importeConcesion.toString().includes(q) ||
            act.tecnicoAsignadoNombre.toLowerCase().includes(q);
          if (!match) return false;
        }

        // 1. Filtro por AÑO / EJERCICIO
        if (filtros.ano) {
          const anoQ = filtros.ano.trim();
          const matchAno =
            anoAct.includes(anoQ) ||
            act.plan.includes(anoQ) ||
            act.plazos.plazoEjecucion.includes(anoQ);
          if (!matchAno) return false;
        }

        // 2. Filtro por PLAN
        if (filtros.plan && !act.plan.toLowerCase().includes(filtros.plan.toLowerCase())) {
          return false;
        }

        // 3. Filtro por ENTIDAD LOCAL (EELL)
        if (filtros.entidadLocal && !act.entidadLocal.toLowerCase().includes(filtros.entidadLocal.toLowerCase())) {
          return false;
        }

        // 4. Filtro por NÚMERO DE ACTUACIÓN
        if (filtros.numeroActuacion && !act.numero.toLowerCase().includes(filtros.numeroActuacion.toLowerCase())) {
          return false;
        }

        // 5. Filtro por APLICACIÓN PRESUPUESTARIA
        if (filtros.aplicacionPresupuestaria) {
          const ap = (act.aplicacionPresupuestaria || '').toLowerCase();
          if (!ap.includes(filtros.aplicacionPresupuestaria.toLowerCase().trim())) {
            return false;
          }
        }

        // 6. Filtro por IMPORTE
        if (filtros.importe) {
          const impQ = filtros.importe.trim().replace(/\./g, '').replace(/,/g, '.');
          const impNum = parseFloat(impQ);
          if (!isNaN(impNum)) {
            const matchesImporte =
              Math.abs(act.importes.importeConcesion - impNum) < 1 ||
              Math.abs(act.importes.importeAdjudicacion - impNum) < 1 ||
              Math.abs(act.importes.importeActuacion - impNum) < 1 ||
              act.importes.importeConcesion.toString().includes(impQ) ||
              act.importes.importeAdjudicacion.toString().includes(impQ);
            if (!matchesImporte) return false;
          } else {
            const strImp = filtros.importe.toLowerCase();
            const matchStr =
              formatearMoneda(act.importes.importeConcesion).toLowerCase().includes(strImp) ||
              formatearMoneda(act.importes.importeAdjudicacion).toLowerCase().includes(strImp);
            if (!matchStr) return false;
          }
        }

        // 7. Filtro por TÍTULO
        if (filtros.titulo && !act.titulo.toLowerCase().includes(filtros.titulo.toLowerCase())) {
          return false;
        }

        // Filtro por ESTADO
        if (filtros.estado && act.estadoGeneral !== filtros.estado) {
          return false;
        }

        // Filtro por FECHA (compara coincidencia en plazos o creación)
        if (filtros.fecha) {
          const fechaBuscar = filtros.fecha;
          const matchFecha =
            act.plazos.plazoEjecucion.includes(fechaBuscar) ||
            act.plazos.plazoJustificacion.includes(fechaBuscar) ||
            act.fechaCreacion.includes(fechaBuscar);
          if (!matchFecha) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Ordenación cronológica predeterminada (por fechaModificacion o fechaCreacion)
        const timeA = new Date(a.fechaModificacion || a.fechaCreacion).getTime();
        const timeB = new Date(b.fechaModificacion || b.fechaCreacion).getTime();
        return filtros.ordenCronologico === 'asc' ? timeA - timeB : timeB - timeA;
      });
  }, [actuaciones, filtros]);

  // Contadores para métricas superiores
  const stats = useMemo(() => {
    const total = actuaciones.length;
    const conformes = actuaciones.filter((a) => a.estadoGeneral === 'conforme' || a.estadoGeneral === 'justificado').length;
    const conDeficiencias = actuaciones.filter((a) => a.estadoGeneral === 'con_deficiencias').length;
    const enRevision = actuaciones.filter((a) => a.estadoGeneral === 'en_revision' || a.estadoGeneral === 'pendiente').length;

    const importeTotalActuaciones = actuaciones.reduce((acc, a) => acc + a.importes.importeActuacion, 0);
    const importeJustificado = actuaciones.reduce((acc, a) => acc + a.liquidacion.justificadoEnPlazo, 0);

    return {
      total,
      conformes,
      conDeficiencias,
      enRevision,
      importeTotalActuaciones,
      importeJustificado
    };
  }, [actuaciones]);

  const renderBadgeEstado = (estado: EstadoGeneralActuacion) => {
    switch (estado) {
      case 'conforme':
      case 'justificado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Justificado Conforme</span>
          </span>
        );
      case 'con_deficiencias':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Con Deficiencias</span>
          </span>
        );
      case 'en_revision':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>En Revisión</span>
          </span>
        );
      case 'pendiente':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Pendiente Revisión</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 1. PRIMERA FILA: RESUMEN DE TODAS LAS ACTUACIONES + SOLO BOTÓN + NUEVA ACTUACIÓN */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Resumen minimalista: Actuaciones Totales, Conformes, Con Deficiencias, En Revisión, Importe Total */}
        <div className="flex items-center gap-6 sm:gap-10 flex-wrap">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Actuaciones Totales
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {stats.total}
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6 sm:pl-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Conformes
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
              {stats.conformes}
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6 sm:pl-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Con Deficiencias
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5">
              {stats.conDeficiencias}
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6 sm:pl-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              En Revisión
            </span>
            <div className="text-xl sm:text-2xl font-black text-sky-700 mt-0.5">
              {stats.enRevision}
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6 sm:pl-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Importe Total
            </span>
            <div className="text-xl sm:text-2xl font-mono font-black text-[#004F90] mt-0.5">
              {formatearMoneda(stats.importeTotalActuaciones)}
            </div>
          </div>
        </div>

        {/* A la derecha: SOLO BOTÓN + NUEVA ACTUACIÓN */}
        <button
          type="button"
          onClick={onAbrirModalNueva}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#004F90] hover:bg-[#003B71] text-white text-xs font-black shadow-xs transition shrink-0 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Actuación</span>
        </button>
      </div>

      {/* 2. DEBAJO: BUSCADOR DE ACTUACIONES CON FILTROS */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Buscador de texto */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={filtros.palabraClave}
            onChange={(e) => setFiltros((prev) => ({ ...prev, palabraClave: e.target.value }))}
            placeholder="Buscar por actuación, municipio, plan, número o técnico..."
            className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {filtros.palabraClave && (
            <button
              type="button"
              onClick={() => setFiltros((prev) => ({ ...prev, palabraClave: '' }))}
              className="text-[11px] text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Filtros por Año y Acciones Rápidas */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFiltros((prev) => ({ ...prev, ano: '' }))}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              !filtros.ano
                ? 'bg-[#004F90] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          {['2027', '2026', '2025', '2024'].map((ano) => (
            <button
              key={ano}
              type="button"
              onClick={() => setFiltros((prev) => ({ ...prev, ano }))}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                filtros.ano === ano
                  ? 'bg-[#004F90] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ano}
            </button>
          ))}

          {/* Botón Filtros Específicos */}
          <button
            type="button"
            onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition border ${
              mostrarFiltrosAvanzados
                ? 'bg-blue-50 border-blue-200 text-[#004F90]'
                : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mostrarFiltrosAvanzados ? 'rotate-180' : ''}`} />
          </button>

          {/* Exportar CSV */}
          <button
            type="button"
            onClick={() => exportarTodasActuacionesCSV(actuacionesFiltradas)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
            title="Exportar todas las actuaciones a formato CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Panel Desplegable de Filtros Avanzados (Estética pastel limpia) */}
      {mostrarFiltrosAvanzados && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              1. Año / Ejercicio
            </label>
            <input
              type="text"
              value={filtros.ano || ''}
              onChange={(e) => setFiltros((prev) => ({ ...prev, ano: e.target.value }))}
              placeholder="Ej. 2026, 2025..."
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-hidden focus:border-[#004F90]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              2. Plan / Programa
            </label>
            <select
              value={filtros.plan}
              onChange={(e) => setFiltros((prev) => ({ ...prev, plan: e.target.value }))}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-hidden focus:border-[#004F90]"
            >
              <option value="">Todos los planes</option>
              {PLANES_DISPONIBLES.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              3. Entidad Local (EELL)
            </label>
            <input
              type="text"
              value={filtros.entidadLocal}
              onChange={(e) => setFiltros((prev) => ({ ...prev, entidadLocal: e.target.value }))}
              placeholder="Ej. Grazalema, Vejer..."
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-hidden focus:border-[#004F90]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              4. Número de Actuación
            </label>
            <input
              type="text"
              value={filtros.numeroActuacion}
              onChange={(e) => setFiltros((prev) => ({ ...prev, numeroActuacion: e.target.value }))}
              placeholder="Ej. 01, 02..."
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-hidden focus:border-[#004F90]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              5. Aplicación Presupuestaria
            </label>
            <input
              type="text"
              value={filtros.aplicacionPresupuestaria || ''}
              onChange={(e) => setFiltros((prev) => ({ ...prev, aplicacionPresupuestaria: e.target.value }))}
              placeholder="Ej. 2026-03-920-46200"
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-xs focus:outline-hidden focus:border-[#004F90]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              6. Importe (€)
            </label>
            <input
              type="text"
              value={filtros.importe || ''}
              onChange={(e) => setFiltros((prev) => ({ ...prev, importe: e.target.value }))}
              placeholder="Ej. 150000 o 150.000"
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-xs focus:outline-hidden focus:border-[#004F90]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              7. Título de la Actuación
            </label>
            <input
              type="text"
              value={filtros.titulo}
              onChange={(e) => setFiltros((prev) => ({ ...prev, titulo: e.target.value }))}
              placeholder="Buscar palabras en el título..."
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-hidden focus:border-[#004F90]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              8. Estado General
            </label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-hidden focus:border-[#004F90]"
            >
              <option value="">Cualquier estado</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En Revisión</option>
              <option value="con_deficiencias">Con Deficiencias</option>
              <option value="justificado">Justificado</option>
              <option value="conforme">Conforme</option>
            </select>
          </div>

          <div className="lg:col-span-4 flex justify-end items-center gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="flex items-center gap-1 text-xs text-[#004F90] hover:underline font-bold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer todos los filtros</span>
            </button>
          </div>
        </div>
      )}

      {/* Información de resultados */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Mostrando <strong>{actuacionesFiltradas.length}</strong> de {actuaciones.length} actuaciones
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Orden:</span>
          <span className="font-semibold text-slate-700">
            Cronológico ({filtros.ordenCronologico === 'desc' ? 'Descendente' : 'Ascendente'})
          </span>
        </div>
      </div>

      {/* 3. LISTADO DE TODAS LAS ACTUACIONES (EN FILAS, ESTÉTICA IDÉNTICA A PLANES) */}
      {actuacionesFiltradas.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-200 shadow-2xs">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">
            No se han encontrado actuaciones coincidentes
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Prueba a modificar los filtros o los términos de búsqueda.
          </p>
          <button
            onClick={limpiarFiltros}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-50 text-[#004F90] text-xs font-bold border border-blue-200"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-3 text-center w-20 whitespace-nowrap">Anualidad</th>
                  <th className="py-3.5 px-3 min-w-[130px] whitespace-nowrap">Plan</th>
                  <th className="py-3.5 px-3 min-w-[120px] whitespace-nowrap">EELL</th>
                  <th className="py-3.5 px-2.5 text-center w-16 whitespace-nowrap">Número</th>
                  <th className="py-3.5 px-3.5 min-w-[280px]">Título de la Actuación</th>
                  <th className="py-3.5 px-3 text-center min-w-[140px] whitespace-nowrap">Aplicación Presupuestaria</th>
                  <th className="py-3.5 px-3 text-right min-w-[105px] whitespace-nowrap">Importe</th>
                  <th className="py-3.5 px-3 min-w-[150px]">Técnico Revisor</th>
                  <th className="py-3.5 px-3 text-center min-w-[130px] whitespace-nowrap">Estado</th>
                  <th className="py-3.5 px-3 text-right min-w-[150px] whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {actuacionesFiltradas.map((act) => {
                  const ano = extraerAnoActuacion(act);
                  const nombreEELL = formatearNombreEELL(act.entidadLocal);
                  const numeroLimpio = formatearNumeroActuacion(act.numero);
                  const tecnicosExpediente = obtenerTodosTecnicosExpediente(act);

                  return (
                    <tr
                      key={act.id}
                      onClick={() => onSeleccionarActuacion(act.id)}
                      className="hover:bg-blue-50/20 transition cursor-pointer group"
                    >
                      {/* 1. ANUALIDAD */}
                      <td className="py-3.5 px-3 text-center font-bold font-mono whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-[#004F90] border border-blue-200 text-xs font-mono font-bold shadow-2xs">
                          {ano}
                        </span>
                      </td>

                      {/* 2. PLAN */}
                      <td className="py-3.5 px-3 font-semibold text-slate-800 text-xs whitespace-nowrap">
                        {act.plan}
                      </td>

                      {/* 3. EELL (Solo nombre, sin 'Ayuntamiento de...') */}
                      <td className="py-3.5 px-3 font-bold text-slate-900 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#004F90] shrink-0" />
                          <span>{nombreEELL}</span>
                        </div>
                      </td>

                      {/* 4. NÚMERO DE ACTUACIÓN (Solo número, sin Nº) */}
                      <td className="py-3.5 px-2.5 text-center font-mono font-black text-slate-900 text-xs whitespace-nowrap">
                        {numeroLimpio}
                      </td>

                      {/* 5. TÍTULO DE LA ACTUACIÓN (Completo, no cortado) */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-slate-900 group-hover:text-[#004F90] transition text-xs leading-snug whitespace-normal break-words">
                          {act.titulo}
                        </div>
                      </td>

                      {/* 6. APLICACIÓN PRESUPUESTARIA */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700 text-xs whitespace-nowrap">
                        {act.aplicacionPresupuestaria || '2026-03-920-46200'}
                      </td>

                      {/* 7. IMPORTE */}
                      <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900 text-xs whitespace-nowrap">
                        {formatearMoneda(act.importes.importeConcesion || act.importes.importeActuacion)}
                      </td>

                      {/* 8. TÉCNICO REVISOR (Todos los participantes en el expediente) */}
                      <td className="py-3.5 px-3 text-xs text-slate-700">
                        <div className="flex flex-col gap-1">
                          {tecnicosExpediente.map((tec, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 whitespace-nowrap"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-[#004F90] shrink-0" />
                              <span>{tec}</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 9. ESTADO */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {renderBadgeEstado(act.estadoGeneral)}
                      </td>

                      {/* 10. ACCIONES (EDITAR Y REVISAR) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActuacionAEditar(act);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition"
                            title="Editar datos principales de la actuación"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSeleccionarActuacion(act.id);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#004F90] hover:bg-[#003B71] text-white font-black text-xs shadow-2xs transition active:scale-[0.98]"
                            title="Entrar a la actuación y revisar su expediente"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Revisar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para editar los datos principales de la actuación */}
      {actuacionAEditar && (
        <EditarActuacionModal
          actuacion={actuacionAEditar}
          mostrar={!!actuacionAEditar}
          onCerrar={() => setActuacionAEditar(null)}
        />
      )}
    </div>
  );
};
