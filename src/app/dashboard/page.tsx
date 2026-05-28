'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  Truck,
  AlertTriangle,
  Package,
  RefreshCw,
  WifiOff,
  Activity,
  MoreVertical,
  XCircle,
  User,
  Flame,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGuias, useRegistrarGuia, useCerrarGuia } from '@/hooks/useGuias';
import { useDashboard, DASHBOARD_POLL_MS } from '@/hooks/useDashboard';
import { KPICard } from '@/components/features/dashboard/KPICard';
import { ManualTrigger } from '@/components/features/dashboard/ManualTrigger';
import { PdfDownloadPanel } from '@/components/features/dashboard/PdfDownloadPanel';
import { extractApiErrorMessage, formatDateTime, formatRelative } from '@/utils/format';
import { QUERY_KEYS } from '@/lib/constants';
import type { GuiaResumen } from '@/types';

// ── Estado labels y colores ────────────────────────────────────────────────

const ESTADO_LABEL: Record<string, string> = {
  registrado: 'Registrada',
  recogido: 'Recogida',
  en_transito: 'En Tránsito',
  en_tcc: 'En Centro TCC',
  en_ruta_entrega: 'En Proceso De Entrega',
  entregado: 'Entregada',
  novedad: 'Novedad',
  devuelto: 'Devuelto',
  fallido: 'No Despachada',
  cerrado: 'Cerrada',
  reemplazado: 'Reemplazada',
  desconocido: 'Sin dato TCC',
};

const ESTADO_COLOR: Record<string, string> = {
  registrado: 'bg-gray-100 text-gray-600',
  recogido: 'bg-blue-100 text-blue-700',
  en_transito: 'bg-yellow-100 text-yellow-700',
  en_tcc: 'bg-cyan-100 text-cyan-700',
  en_ruta_entrega: 'bg-indigo-100 text-indigo-700',
  entregado: 'bg-green-100 text-green-700',
  novedad: 'bg-red-100 text-red-700',
  devuelto: 'bg-orange-100 text-orange-700',
  fallido: 'bg-red-100 text-red-700',
  cerrado: 'bg-gray-100 text-gray-500',
  reemplazado: 'bg-purple-100 text-purple-700',
  desconocido: 'bg-gray-100 text-gray-400',
};

const EN_RUTA = new Set(['registrado', 'recogido', 'en_transito', 'en_ruta_entrega']);

type FilterKey = 'all' | 'en_ruta' | 'novedad' | 'entregadas' | 'entregadas_hoy';
type ChipTone = 'gray' | 'blue' | 'red' | 'amber' | 'green';

const CHIP_ACTIVE: Record<ChipTone, string> = {
  gray: 'bg-gray-900 text-white border-gray-900',
  blue: 'bg-blue-600 text-white border-blue-600',
  red: 'bg-red-600 text-white border-red-600',
  amber: 'bg-amber-500 text-white border-amber-500',
  green: 'bg-green-600 text-white border-green-600',
};
const CHIP_IDLE: Record<ChipTone, string> = {
  gray: 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
  blue: 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50',
  red: 'bg-white text-red-700 border-red-200 hover:bg-red-50',
  amber: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50',
  green: 'bg-white text-green-700 border-green-200 hover:bg-green-50',
};

const KPI_RING: Record<ChipTone, string> = {
  gray: 'ring-gray-400',
  blue: 'ring-blue-400',
  red: 'ring-red-400',
  amber: 'ring-amber-400',
  green: 'ring-green-400',
};

function ChipFilter({
  active,
  onClick,
  tone = 'gray',
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone?: ChipTone;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
        active ? CHIP_ACTIVE[tone] : CHIP_IDLE[tone]
      }`}
    >
      {children}
    </button>
  );
}

function kpiBtnCn(active: boolean, tone: ChipTone): string {
  return `text-left w-full transition rounded-lg ${
    active ? `ring-2 ${KPI_RING[tone]}` : 'hover:opacity-90'
  }`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCycle(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    const h = d.getUTCHours() - 5; // UTC-5 Bogotá
    const norm = ((h % 24) + 24) % 24;
    if (norm === 7) return '07:00';
    if (norm === 12) return '12:00';
    if (norm === 16) return '16:00';
    return formatDateTime(isoStr);
  } catch {
    return '—';
  }
}

function secsToLabel(secs: number): string {
  if (secs < 5) return 'ahora mismo';
  if (secs < 60) return `hace ${secs}s`;
  const m = Math.floor(secs / 60);
  return `hace ${m}m`;
}

// ── Formulario ─────────────────────────────────────────────────────────────

const schema = z.object({
  numero_guia: z.string().min(1, 'Requerido').transform((v) => v.trim()),
  asesor: z.string().min(2, 'Mínimo 2 caracteres').transform((v) => v.trim()),
  cliente: z.string().optional().transform((v) => v?.trim() || undefined),
});
type FormValues = z.input<typeof schema>;

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // Guías list — also polls every 60s to stay fresh
  const { data, isLoading } = useGuias({ page_size: 200 });

  // Dashboard stats — polls every 60s, exposes last fetch time
  const {
    data: stats,
    isError: statsError,
    dataUpdatedAt,
  } = useDashboard();

  // "Actualizado hace X segundos" counter
  const [secsAgo, setSecsAgo] = useState(0);
  useEffect(() => {
    if (!dataUpdatedAt) return;
    const tick = () => setSecsAgo(Math.floor((Date.now() - dataUpdatedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dataUpdatedAt]);

  const { mutateAsync, isPending } = useRegistrarGuia();
  const { mutateAsync: cerrarGuia, isPending: cerrando } = useCerrarGuia();
  const [apiError, setApiError] = useState<string | null>(null);

  // Menú •••
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleCerrar(g: GuiaResumen) {
    setMenuOpenId(null);
    await cerrarGuia(g.id);
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const guias = data?.items ?? [];

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [filtro, setFiltro] = useState<FilterKey>('all');
  const [filtroAsesor, setFiltroAsesor] = useState<string>('');

  const { guiasFiltradas, conteo, asesoresUnicos } = useMemo(() => {
    const ahora = Date.now();
    const hoyStr = new Date().toDateString();

    const c: Record<FilterKey, number> = {
      all: guias.length,
      en_ruta: 0,
      novedad: 0,
      entregadas: 0,
      entregadas_hoy: 0,
    };

    // Guía demorada: activa, con fecha de despacho, >= 5 días desde despacho y sin entregar
    const esDemorada = (g: GuiaResumen): boolean => {
      if (!g.activa || !g.fecha_despacho || g.estado_actual === 'entregado') return false;
      const dias = (ahora - new Date(g.fecha_despacho + 'T00:00:00').getTime()) / 86400000;
      return dias >= 5;
    };
    const esEntregada = (g: GuiaResumen): boolean => g.estado_actual === 'entregado';
    const esEntregadaHoy = (g: GuiaResumen): boolean => {
      if (g.estado_actual !== 'entregado' || !g.fecha_ultima_actualizacion) return false;
      return new Date(g.fecha_ultima_actualizacion).toDateString() === hoyStr;
    };

    for (const g of guias) {
      if (EN_RUTA.has(g.estado_actual)) c.en_ruta++;
      // Novedad = guías demoradas >= 5 días desde despacho sin entregar
      if (esDemorada(g)) c.novedad++;
      if (esEntregada(g)) c.entregadas++;
      if (esEntregadaHoy(g)) c.entregadas_hoy++;
    }

    // Lista de asesores únicos, ordenada A-Z
    const asesoresUnicos = Array.from(new Set(guias.map((g) => g.asesor))).sort((a, b) =>
      a.localeCompare(b, 'es')
    );

    const aplicaFiltro = (g: GuiaResumen): boolean => {
      // Filtro por chip
      const pasaChip = (() => {
        switch (filtro) {
          case 'all': return true;
          case 'en_ruta': return EN_RUTA.has(g.estado_actual);
          case 'novedad': return esDemorada(g);
          case 'sin_movimiento': return esSinMovimiento(g);
          case 'entregadas': return esEntregada(g);
          case 'entregadas_hoy': return esEntregadaHoy(g);
        }
      })();
      // Filtro por asesor (AND con chip)
      const pasaAsesor = filtroAsesor === '' || g.asesor === filtroAsesor;
      return pasaChip && pasaAsesor;
    };

    const esAlerta = (g: GuiaResumen) =>
      g.activa && g.dias_en_transito != null && g.dias_en_transito > 5;

    const filtradas = guias.filter(aplicaFiltro).sort((a, b) => {
      // Guías con alerta (+5 días) siempre van primero
      const aAlert = esAlerta(a) ? 0 : 1;
      const bAlert = esAlerta(b) ? 0 : 1;
      if (aAlert !== bAlert) return aAlert - bAlert;
      // Dentro de cada grupo: más días primero
      return (b.dias_en_transito ?? 0) - (a.dias_en_transito ?? 0);
    });

    return { guiasFiltradas: filtradas, conteo: c, asesoresUnicos };
  }, [guias, filtro, filtroAsesor]);

  async function onSubmit(values: FormValues) {
    setApiError(null);
    try {
      await mutateAsync({
        numero_guia: values.numero_guia,
        asesor: values.asesor,
        cliente: values.cliente,
      });
      reset();
      setTimeout(() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.guias }), 10000);
    } catch (err) {
      setApiError(extractApiErrorMessage(err));
    }
  }

  const sistemaActivo = stats?.sistema_activo ?? true;

  return (
    <div className="min-h-screen bg-blue-950 p-6">
      <div className="mx-auto max-w-4xl flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Seguimiento de Guías TCC</h1>
              <p className="text-xs text-gray-500">ASTECO</p>
            </div>
          </div>

          {/* Badges de estado del sistema */}
          <div className="flex items-center gap-2">
            {statsError && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-200">
                <WifiOff className="h-3 w-3" />
                Sin conexión
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                sistemaActivo
                  ? 'bg-green-50 text-green-700 ring-green-200'
                  : 'bg-red-50 text-red-700 ring-red-200'
              }`}
            >
              <Activity className="h-3 w-3" />
              {sistemaActivo ? 'Sistema activo' : 'Sistema inactivo'}
            </span>
          </div>
        </div>

        {/* ── KPIs (clickeables como atajo de filtro) ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setFiltro(filtro === 'entregadas_hoy' ? 'all' : 'entregadas_hoy')}
            className={kpiBtnCn(filtro === 'entregadas_hoy', 'green')}
          >
            <KPICard
              title="Entregadas hoy"
              value={stats?.total_guias_entregadas_hoy ?? 0}
              icon={CheckCircle2}
              iconClassName="bg-green-50 text-green-600"
              isLoading={isLoading}
            />
          </button>
          <button
            type="button"
            onClick={() => setFiltro(filtro === 'en_ruta' ? 'all' : 'en_ruta')}
            className={kpiBtnCn(filtro === 'en_ruta', 'blue')}
          >
            <KPICard
              title="En ruta"
              value={conteo.en_ruta}
              icon={Truck}
              iconClassName="bg-blue-50 text-blue-600"
              isLoading={isLoading}
            />
          </button>
          <button
            type="button"
            onClick={() => setFiltro(filtro === 'novedad' ? 'all' : 'novedad')}
            className={kpiBtnCn(filtro === 'novedad', 'red')}
          >
            <KPICard
              title="Con novedad"
              value={conteo.novedad}
              icon={AlertTriangle}
              iconClassName="bg-red-50 text-red-600"
              isLoading={isLoading}
            />
          </button>
        </div>

        {/* ── Estado del ciclo + indicador de polling ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <RefreshCw className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Estado de ejecución</h2>
                <p className="text-xs text-gray-500">GitHub Actions · ciclos 07:00, 12:00, 16:00</p>
              </div>
            </div>

            {/* Indicador de última actualización */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span
                className={`h-2 w-2 rounded-full ${
                  statsError ? 'bg-red-400' : 'bg-green-400 animate-pulse'
                }`}
              />
              {statsError
                ? 'Sin conexión — mostrando último estado'
                : `Actualizado ${secsToLabel(secsAgo)} · refresca cada ${DASHBOARD_POLL_MS / 1000}s`}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Último ciclo ejecutado</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {stats?.ultima_ejecucion ? formatDateTime(stats.ultima_ejecucion) : 'Sin registros'}
              </p>
              {stats?.ultima_ejecucion && (
                <p className="mt-0.5 text-xs text-gray-400">
                  Ciclo {formatCycle(stats.ultima_ejecucion)} · {formatRelative(stats.ultima_ejecucion)}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Próximo ciclo programado</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {stats?.proxima_ejecucion ? formatDateTime(stats.proxima_ejecucion) : '—'}
              </p>
              {stats?.proxima_ejecucion && (
                <p className="mt-0.5 text-xs text-gray-400">
                  Ciclo {formatCycle(stats.proxima_ejecucion)}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Guías activas monitoreadas</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {stats?.total_guias_activas ?? '—'}
              </p>
              {stats?.guias_activas?.length != null && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {stats.guias_activas.filter((g) => g.estado_actual === 'novedad').length} con novedad
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Formulario ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Ingresar guía</h2>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">
                  Guía <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Número de guía"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('numero_guia')}
                />
                {errors.numero_guia && (
                  <p className="text-xs text-red-500">{errors.numero_guia.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">
                  Asesor <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Nombre del asesor"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('asesor')}
                />
                {errors.asesor && (
                  <p className="text-xs text-red-500">{errors.asesor.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Cliente</label>
                <input
                  placeholder="Nombre del cliente"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('cliente')}
                />
              </div>
            </div>
            {apiError && <p className="mt-2 text-xs text-red-600">{apiError}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-950 disabled:opacity-50"
              >
                {isPending ? 'Registrando...' : 'Registrar'}
              </button>
              <button
                type="button"
                onClick={() => { reset(); setApiError(null); }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>

        <ManualTrigger />

        <PdfDownloadPanel />

        {/* ── Tabla de guías ── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Guías registradas</h2>
            <span className="text-xs text-gray-400">
              {guiasFiltradas.length} {guiasFiltradas.length === 1 ? 'guía' : 'guías'}
              {filtro !== 'all' && ` de ${guias.length}`}
            </span>
          </div>

          {/* Filtros: asesor arriba, chips abajo */}
          <div className="flex flex-col border-b border-gray-100 bg-gray-50">
            {/* Fila 1 — Selector de asesor */}
            <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-gray-100">
              <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <select
                value={filtroAsesor}
                onChange={(e) => setFiltroAsesor(e.target.value)}
                className={`rounded-full border py-1.5 pl-2.5 pr-7 text-xs font-medium transition appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  filtroAsesor
                    ? 'border-blue-400 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <option value="">Todos los asesores</option>
                {asesoresUnicos.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Fila 2 — Chips de filtro por estado */}
            <div className="flex flex-wrap items-center gap-2 px-6 py-3">
              <ChipFilter active={filtro === 'all'} onClick={() => setFiltro('all')}>
                Todas ({conteo.all})
              </ChipFilter>
              <ChipFilter active={filtro === 'en_ruta'} onClick={() => setFiltro('en_ruta')} tone="blue">
                En ruta ({conteo.en_ruta})
              </ChipFilter>
              <ChipFilter active={filtro === 'novedad'} onClick={() => setFiltro('novedad')} tone="red">
                Con novedad ({conteo.novedad})
              </ChipFilter>
              <ChipFilter active={filtro === 'entregadas'} onClick={() => setFiltro('entregadas')} tone="green">
                Entregadas ({conteo.entregadas})
              </ChipFilter>
              <ChipFilter active={filtro === 'entregadas_hoy'} onClick={() => setFiltro('entregadas_hoy')} tone="green">
                Entregadas hoy ({conteo.entregadas_hoy})
              </ChipFilter>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              Cargando...
            </div>
          ) : guiasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
              <Package className="h-8 w-8 opacity-30" />
              <p className="text-sm">
                {guias.length === 0 ? 'No hay guías registradas' : 'No hay guías para este filtro'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
                  <th className="px-6 py-3 text-left">Guía</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Asesor</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Última actualización</th>
                  <th className="px-4 py-3 text-left">F. Despacho</th>
                  <th className="px-4 py-3 text-left">Días tránsito</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {guiasFiltradas.map((g: GuiaResumen) => {
                  const diasAlerta = g.activa && g.dias_en_transito != null && g.dias_en_transito > 5;
                  return (
                  <tr key={g.id} className={diasAlerta ? 'row-alert' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-3 font-mono font-medium text-gray-900">
                      {g.numero_guia}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {g.cliente ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{g.asesor}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ESTADO_COLOR[g.estado_actual] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ESTADO_LABEL[g.estado_actual] ?? g.estado_actual}
                      </span>
                      {g.estado_raw && (
                        <p className="mt-0.5 truncate max-w-[160px] text-[10px] text-gray-400 italic" title={g.estado_raw}>
                          {g.estado_raw}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatRelative(g.fecha_ultima_actualizacion)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {g.fecha_despacho
                        ? new Date(g.fecha_despacho + 'T00:00:00').toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {g.dias_en_transito != null ? (
                        <span className={`inline-flex items-center gap-1 font-medium ${diasAlerta ? 'text-red-700' : 'text-gray-500'}`}>
                          {diasAlerta && <Flame className="h-3.5 w-3.5 text-red-500" />}
                          {g.dias_en_transito}d
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Menú ••• */}
                    <td className="px-2 py-3 relative" ref={menuOpenId === g.id ? menuRef : null}>
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === g.id ? null : g.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {menuOpenId === g.id && (
                        <div className="absolute right-2 top-10 z-20 w-44 rounded-lg border border-gray-200 bg-white shadow-lg">
                          {g.activa ? (
                            <button
                              onClick={() => handleCerrar(g)}
                              disabled={cerrando}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                            >
                              <XCircle className="h-4 w-4 text-gray-400" />
                              Cerrar guía
                            </button>
                          ) : (
                            <p className="px-4 py-2.5 text-xs text-gray-400 rounded-lg">
                              Guía cerrada
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
