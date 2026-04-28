'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Truck, XCircle, Package, Clock3 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGuias, useRegistrarGuia } from '@/hooks/useGuias';
import { useDashboard } from '@/hooks/useDashboard';
import { KPICard } from '@/components/features/dashboard/KPICard';
import { PdfDownloadPanel } from '@/components/features/dashboard/PdfDownloadPanel';
import { extractApiErrorMessage, formatDateTime } from '@/utils/format';
import { QUERY_KEYS } from '@/lib/constants';
import type { GuiaResumen } from '@/types';

const EN_RUTA = new Set(['registrado', 'recogido', 'en_transito', 'en_ruta_entrega']);
const CANCELADAS = new Set(['devuelto', 'cerrado']);

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
  en_transito: 'bg-blue-100 text-blue-700',
  en_ruta_entrega: 'bg-indigo-100 text-indigo-700',
  entregado: 'bg-green-100 text-green-700',
  novedad: 'bg-amber-100 text-amber-700',
  devuelto: 'bg-orange-100 text-orange-700',
  fallido: 'bg-red-100 text-red-700',
  cerrado: 'bg-gray-100 text-gray-500',
  desconocido: 'bg-gray-100 text-gray-400',
};

const schema = z.object({
  numero_guia: z.string().min(1, 'Requerido').transform((v) => v.trim()),
  asesor: z.string().min(2, 'Mínimo 2 caracteres').transform((v) => v.trim()),
  cliente: z.string().optional().transform((v) => v?.trim() || undefined),
  fecha_despacho: z.string().optional(),
});

type FormValues = z.input<typeof schema>;

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGuias({ page_size: 200 });
  const { data: dashboardStats } = useDashboard();
  const { mutateAsync, isPending } = useRegistrarGuia();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const guias = data?.items ?? [];
  const entregadas = guias.filter((g) => g.estado_actual === 'entregado').length;
  const enRuta = guias.filter((g) => EN_RUTA.has(g.estado_actual)).length;
  const canceladas = guias.filter((g) => CANCELADAS.has(g.estado_actual)).length;
  const nextReport = dashboardStats?.proxima_reporte ?? dashboardStats?.proxima_ejecucion;
  const automationState =
    dashboardStats?.estado_automatizacion === 'ejecutado'
      ? 'Activo'
      : 'Programado';

  async function onSubmit(values: FormValues) {
    setApiError(null);
    try {
      await mutateAsync({ numero_guia: values.numero_guia, asesor: values.asesor, cliente: values.cliente, fecha_despacho: values.fecha_despacho || undefined });
      reset();
      // TCC response time is 2-8s; 10s gives enough margin for first result
      setTimeout(() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.guias }), 10000);
    } catch (err) {
      setApiError(extractApiErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen bg-blue-950 p-6">
      <div className="mx-auto max-w-4xl flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Seguimiento de Guías TCC</h1>
            <p className="text-xs text-gray-500">ASTECO</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <KPICard title="Entregadas" value={entregadas} icon={CheckCircle2} iconClassName="bg-green-50 text-green-600" isLoading={isLoading} />
          <KPICard title="En ruta" value={enRuta} icon={Truck} iconClassName="bg-blue-50 text-blue-600" isLoading={isLoading} />
          <KPICard title="Canceladas" value={canceladas} icon={XCircle} iconClassName="bg-red-50 text-red-600" isLoading={isLoading} />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Clock3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Ejecucion automatica</h2>
              <p className="text-xs text-gray-500">Consulta 07:00, 12:00, 16:00; email Outlook 07:03, 12:03, 16:03</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Estado</p>
              <p className="mt-1 text-sm font-semibold text-green-700">{automationState}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Ultimo reporte</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {dashboardStats?.ultima_ejecucion ? formatDateTime(dashboardStats.ultima_ejecucion) : 'Sin registros recientes'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Proximo reporte</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {nextReport ? formatDateTime(nextReport) : 'Programado por GitHub Actions'}
              </p>
            </div>
          </div>
          {dashboardStats?.proxima_alerta && (
            <p className="mt-3 text-xs text-gray-500">
              Alertas de 72h: proxima revision {formatDateTime(dashboardStats.proxima_alerta)}.
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Respaldo de envio: 07:20, 12:20 y 16:20. Si el reporte ya fue enviado, no se duplica.
          </p>
        </div>

        {/* Formulario */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Ingresar guía</h2>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Guía <span className="text-red-500">*</span></label>
                <input
                  placeholder="Número de guía"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('numero_guia')}
                />
                {errors.numero_guia && <p className="text-xs text-red-500">{errors.numero_guia.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Asesor <span className="text-red-500">*</span></label>
                <input
                  placeholder="Nombre del asesor"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('asesor')}
                />
                {errors.asesor && <p className="text-xs text-red-500">{errors.asesor.message}</p>}
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

        {/* Tabla de guías */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Guías registradas</h2>
            <span className="text-xs text-gray-400">{guias.length} guías</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">Cargando...</div>
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
                  <th className="px-4 py-3 text-left">F. Despacho</th>
                  <th className="px-4 py-3 text-left">Dias Transito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {guias.map((g: GuiaResumen) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono font-medium text-gray-900">{g.numero_guia}</td>
                    <td className="px-4 py-3 text-gray-600">{g.cliente ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{g.asesor}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLOR[g.estado_actual] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ESTADO_LABEL[g.estado_actual] ?? g.estado_actual}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {g.fecha_despacho ? new Date(g.fecha_despacho + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {g.dias_en_transito != null ? `${g.dias_en_transito}d` : <span className="text-gray-300">—</span>}
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
