'use client';

import { CheckCircle, XCircle, Server, Database, Clock, Activity, CalendarClock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useSystem } from '@/hooks/useSystem';
import { formatDateTime, formatRelative, formatUptime } from '@/utils/format';
import { cn } from '@/utils/cn';

function StatusRow({ ok, label, description }: { ok: boolean; label: string; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <div className={cn('flex items-center gap-1.5 text-xs font-medium', ok ? 'text-green-600' : 'text-red-600')}>
        {ok ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {ok ? 'OK' : 'Error'}
      </div>
    </div>
  );
}

export default function SistemaPage() {
  const { data, isLoading, isError } = useSystem();
  const automationOk =
    data?.scheduler_mode === 'external'
      ? Boolean(data.cron_protected)
      : Boolean(data?.scheduler_activo);
  const schedulerDescription =
    data?.scheduler_mode === 'external'
      ? 'Automatizacion externa sobre el backend desplegado'
      : data?.scheduler_mode === 'embedded'
        ? 'Scheduler interno del backend'
        : 'Sin scheduler residente en este deployment';

  const statusBadge = data
    ? {
        ok: 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-200',
        degraded: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
        error: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200',
      }[data.status]
    : '';

  return (
    <DashboardLayout>
      <Header title="Estado del sistema" subtitle="Salud del servicio y monitoreo en tiempo real" />

      <div className="p-6">
        {isError && (
          <Alert variant="error" className="mb-6">
            No se pudo conectar con el servidor. Verifica que el backend este corriendo.
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Estado general</CardTitle>
              {!isLoading && data && (
                <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusBadge)}>
                  {data.status === 'ok' ? 'Operacional' : data.status === 'degraded' ? 'Degradado' : 'Error'}
                </span>
              )}
            </CardHeader>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner className="text-gray-300" />
              </div>
            ) : data ? (
              <div>
                <StatusRow ok={data.bd_conectada} label="Base de datos" description="Conexion a PostgreSQL/SQLite" />
                <StatusRow ok={automationOk} label="Automatizacion" description={schedulerDescription} />
                <StatusRow ok={Boolean(data.email_configured)} label="Correo saliente" description="Configuracion para enviar reportes y alertas" />
                <StatusRow ok={Boolean(data.cron_protected)} label="Proteccion de cron" description="Validacion del disparo automatico" />
                <StatusRow ok={data.status === 'ok'} label="API FastAPI" description="Endpoints disponibles" />
                {data.mensaje && <p className="mt-3 text-xs text-gray-500">{data.mensaje}</p>}
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metricas</CardTitle>
            </CardHeader>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner className="text-gray-300" />
              </div>
            ) : data ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600">
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Version</p>
                    <p className="text-sm font-semibold text-gray-900">{data.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tiempo de actividad</p>
                    <p className="text-sm font-semibold text-gray-900">{formatUptime(data.uptime_seconds)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2.5 text-green-600">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Guias en BD</p>
                    <p className="text-sm font-semibold text-gray-900">{data.total_guias_bd}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ultima consulta TCC</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatRelative(data.ultima_consulta_tcc ?? undefined)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDateTime(data.ultima_consulta_tcc ?? undefined)}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Horarios de ejecucion automatica</CardTitle>
            </CardHeader>
            <div className="grid gap-4 sm:grid-cols-3">
              {['07:00 AM', '12:00 PM', '04:00 PM'].map((hora) => (
                <div key={hora} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <CalendarClock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{hora}</p>
                    <p className="text-xs text-gray-500">Consulta + reporte + correo</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
