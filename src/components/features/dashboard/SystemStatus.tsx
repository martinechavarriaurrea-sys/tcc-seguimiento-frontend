'use client';

import { CheckCircle, XCircle, AlertTriangle, Clock, Database, CalendarClock } from 'lucide-react';
import { useSystem } from '@/hooks/useSystem';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { formatDateTime, formatRelative, formatUptime } from '@/utils/format';
import { cn } from '@/utils/cn';

function StatusIndicator({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={ok ? 'text-gray-700' : 'text-red-600'}>{label}</span>
    </div>
  );
}

export function SystemStatus() {
  const { data, isLoading, isError } = useSystem();

  const statusColor = {
    ok: 'bg-green-100 text-green-700 ring-green-200',
    degraded: 'bg-amber-100 text-amber-700 ring-amber-200',
    error: 'bg-red-100 text-red-700 ring-red-200',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado del sistema</CardTitle>
        {!isLoading && data && (
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', statusColor[data.status])}>
            {data.status === 'ok' ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {data.status === 'ok' ? 'Operacional' : data.status === 'degraded' ? 'Degradado' : 'Error'}
          </span>
        )}
      </CardHeader>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner className="text-gray-300" />
        </div>
      ) : isError ? (
        <p className="text-sm text-red-500">No se pudo conectar con el servidor.</p>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2.5">
            <StatusIndicator ok={data.bd_conectada} label="Base de datos" />
            <StatusIndicator ok={data.scheduler_activo} label="Scheduler automático" />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Database className="h-4 w-4 text-gray-400" />
              <span>{data.total_guias_bd} guías en BD</span>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>Uptime: {formatUptime(data.uptime_seconds)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarClock className="h-4 w-4 text-gray-400" />
              <span title={formatDateTime(data.ultima_consulta_tcc ?? undefined)}>
                Última consulta TCC: {formatRelative(data.ultima_consulta_tcc ?? undefined)}
              </span>
            </div>
            <p className="text-xs text-gray-400">v{data.version}</p>
          </div>
          {data.mensaje && (
            <p className="col-span-2 text-xs text-gray-500">{data.mensaje}</p>
          )}
        </div>
      ) : null}
    </Card>
  );
}
