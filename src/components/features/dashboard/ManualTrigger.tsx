'use client';

import { RefreshCw, Loader2, CheckCircle2, XCircle, ExternalLink, RotateCcw } from 'lucide-react';
import { useDispatch, type DispatchState } from '@/hooks/useDispatch';

function ProgressBar({ state }: { state: DispatchState }) {
  if (state === 'idle') return null;
  const pct: Record<DispatchState, number> = {
    idle: 0, triggering: 10, queued: 25, in_progress: 65, completed: 100, failed: 100,
  };
  const color =
    state === 'completed' ? 'bg-green-500' :
    state === 'failed'    ? 'bg-red-400'   : 'bg-blue-500';
  const pulse = state === 'triggering' || state === 'queued' || state === 'in_progress';
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        style={{ width: `${pct[state]}%` }}
        className={`h-full rounded-full transition-all duration-1000 ${color} ${pulse ? 'animate-pulse' : ''}`}
      />
    </div>
  );
}

function StatusText({ state, error, durationSecs }: {
  state: DispatchState;
  error: string | null;
  durationSecs: number | null | undefined;
}) {
  const dur = durationSecs
    ? durationSecs < 60 ? ` en ${durationSecs}s` : ` en ${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s`
    : '';

  if (state === 'triggering') return <p className="text-xs text-gray-500">Verificando sistema y enviando orden a GitHub...</p>;
  if (state === 'queued')     return <p className="text-xs text-blue-500">GitHub recibió la orden — esperando runner...</p>;
  if (state === 'in_progress') return <p className="text-xs text-blue-600 font-medium">Consultando TCC y actualizando datos...</p>;
  if (state === 'completed')  return <p className="text-xs text-green-600 font-medium">Completado{dur} · Dashboard actualizado.</p>;
  if (state === 'failed' && error) return <p className="text-xs text-red-600">{error}</p>;
  return null;
}

export function ManualTrigger() {
  const { state, run, error, trigger, reset } = useDispatch();

  const isActive    = state === 'triggering' || state === 'queued' || state === 'in_progress';
  const isCompleted = state === 'completed';
  const isFailed    = state === 'failed';
  const isDone      = isCompleted || isFailed;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">

        {/* Botón + texto de estado */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => isDone ? reset() : trigger()}
            disabled={isActive}
            className={`flex-shrink-0 flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold
              transition-colors disabled:cursor-not-allowed disabled:opacity-60
              ${isCompleted ? 'bg-green-600 text-white hover:bg-green-700' :
                isFailed    ? 'bg-gray-600 text-white hover:bg-gray-700'   :
                              'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {isActive ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : isFailed ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isActive     ? 'Ejecutando...' :
             isCompleted  ? 'Actualizado'   :
             isFailed     ? 'Reintentar'    :
                            'Actualizar'}
          </button>

          <StatusText state={state} error={error} durationSecs={run?.duration_seconds} />
        </div>

        {/* Acciones secundarias */}
        {run?.url && (
          <a
            href={run.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <ExternalLink className="h-3 w-3" />
            Ver logs
          </a>
        )}
        {isFailed && !run?.url && (
          <a
            href="https://github.com/martinechavarriaurrea-sys/tcc-consolidacion-informes-backend/actions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-3 w-3" />
            Ver GitHub Actions
          </a>
        )}
      </div>

      <ProgressBar state={state} />
    </div>
  );
}
