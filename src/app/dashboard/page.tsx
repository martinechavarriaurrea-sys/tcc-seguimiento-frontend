'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  Truck,
  AlertTriangle,
  Package,
  Clock3,
  RefreshCw,
  WifiOff,
  Activity,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGuias, useRegistrarGuia } from '@/hooks/useGuias';
import { useDashboard, DASHBOARD_POLL_MS } from '@/hooks/useDashboard';
import { KPICard } from '@/components/features/dashboard/KPICard';
import { PdfDownloadPanel } from '@/components/features/dashboard/PdfDownloadPanel';
import { extractApiErrorMessage, formatDateTime, formatRelative } from '@/utils/format';
import { QUERY_KEYS } from '@/lib/constants';
import type { GuiaResumen } from '@/types';

// ── Estado labels y colores ────────────────────────────────────────────────

const ESTADO_LABEL: Record<string, string> = {
  registrado: 'Registrada',
  recogido: 'Recogida',
  en_transito: 'En Despacho',
  en_ruta_entrega: 'En Proceso De Entrega',
  entregado: 'Entregada',
  novedad: 'Novedad',
  devuelto: 'En Proceso De Devolución',
  fallido: 'No Entregada',
  cerrado: 'Cerrada',
  desconocido: 'Sin dato TCC',
};

const ESTADO_COLOR: Record<string, string> = {
  registrado: 'bg-gray-100 text-gray-600',
  recogido: 'bg-blue-100 text-blue-700',
  en_transito: 'bg-yellow-100 text-yellow-700',
  en_ruta_entrega: 'bg-blue-100 text-blue-700',
  entregado: 'bg-green-100 text-green-700',
  novedad: 'bg-red-100 text-red-700',
  devuelto: 'bg-orange-100 text-orange-700',
  fallido: 'bg-red-100 text-red-700',
  cerrado: 'bg-gray-100 text-gray-500',
  desconocido: 'bg-gray-100 text-gray-400',
};

const EN_RUTA = new Set(['registrado', 'recogido', 'en_transito', 'en_ruta_entrega']);

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
  fecha_despacho: z.string().optional(),
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
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const guias = data?.items ?? [];
  const enRuta = guias.filter((g) => EN_RUTA.has(g.estado_actual)).length;

  async function onSubmit(values: FormValues) {
    setApiError(null);
    try {
      await mutateAsync({
        numero_guia: values.numero_guia,
        asesor: values.asesor,
        cliente: values.cliente,
        fecha_despacho: values.fecha_despacho || undefined,
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

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KPICard
            title="Entregadas hoy"
            value={stats?.total_guias_entregadas_hoy ?? 0}
            icon={CheckCircle2}
            iconClassName="bg-green-50 text-green-600"
            isLoading={isLoading}
          />
          <KPICard
            title="En ruta"
            value={enRuta}
            icon={Truck}
            iconClassName="bg-blue-50 text-blue-600"
            isLoading={isLoading}
          />
          <KPICard
            title="Con novedad"
            value={stats?.con_novedad ?? 0}
            icon={AlertTriangle}
            iconClassName="bg-red-50 text-red-600"
            isLoading={isLoading}
          />
          <KPICard
            title="Sin movimiento"
            value={stats?.sin_movimiento ?? 0}
            icon={Clock3}
            iconClassName="bg-amber-50 text-amber-600"
            isLoading={isLoading}
          />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Fecha despacho</label>
                <input
                  type="date"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('fecha_despacho')}
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

        <PdfDownloadPanel />

        {/* ── Tabla de guías ── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Guías registradas</h2>
            <span className="text-xs text-gray-400">{guias.length} guías</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              Cargando...
            </div>
          ) : guias.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
              <Package className="h-8 w-8 opacity-30" />
              <p className="text-sm">No hay guías registradas</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {guias.map((g: GuiaResumen) => (
                  <tr key={g.id} className="hover:bg-gray-50">
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
                    <td className="px-4 py-3 text-gray-500">
                      {g.dias_en_transito != null
                        ? `${g.dias_en_transito}d`
                        : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
