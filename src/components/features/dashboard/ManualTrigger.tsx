'use client';

import { RefreshCw, Loader2, CheckCircle2, XCircle, ExternalLink, RotateCcw } from 'lucide-react';
import { useDispatch, type DispatchState } from '@/hooks/useDispatch';

const STATE_LABEL: Record<DispatchState, string> = {
  idle: 'Actualizar',
  triggering: 'Iniciando...',
  queued: 'En cola...',
  in_progress: 'Consultando TCC...',
  completed: 'Actualizado',
  failed: 'Reintentar',
};

function ProgressBar({ state }: { state: DispatchState }) {
  if (state === 'idle') return null;

  const widths: Record<DispatchState, string> = {
    idle: 'w-0',
    triggering: 'w-1/12',
    queued: 'w-3/12',
    in_progress: 'w-9/12',
    completed: 'w-full',
    failed: 'w-full',
  };
  const color =
    state === 'completed' ? 'bg-green-500' :
    state === 'failed'    ? 'bg-red-500'   : 'bg-blue-500';

  return (
    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-in-out ${widths[state]} ${color} ${
          state === 'in_progress' ? 'animate-pulse' : ''
        }`}
      />
    </div>
  );
}

export function ManualTrigger() {
  const { state, run, error, trigger, reset } = useDispatch();

  const isActive = state === 'triggering' || state === 'queued' || state === 'in_progress';

  function formatDuration(secs: number | null | undefined) {
    if (!secs) return null;
    return secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-3">
          {/* Botón principal */}
          <button
            onClick={() => (state === 'completed' || state === 'failed' ? reset() : trigger())}
            disabled={isActive}
            className={`flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              state === 'completed'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : state === 'failed'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isActive ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : state === 'completed' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : state === 'failed' ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {STATE_LABEL[state]}
          </button>

          {/* Descripción del estado actual */}
          <p className="text-xs text-gray-500">
            {state === 'idle' && 'Consulta TCC ahora y actualiza el dashboard.'}
            {state === 'triggering' && 'Enviando orden a GitHub Actions...'}
            {state === 'queued' && 'Esperando runner disponible...'}
            {state === 'in_progress' && 'Consultando TCC guía por guía, actualizando BD...'}
            {state === 'completed' && `Listo${run?.duration_seconds ? ` en ${formatDuration(run.duration_seconds)}` : ''}. El dashboard ya tiene los datos nuevos.`}
            {state === 'failed' && (error ?? 'Algo salió mal.')}
          </p>
        </div>

        {/* Link a logs + botón reset */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {run?.url && (
            <a
              href={run.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <ExternalLink className="h-3 w-3" />
              Ver logs
            </a>
          )}
          {(state === 'completed' || state === 'failed') && (
            <button onClick={reset} className="text-gray-400 hover:text-gray-600">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <ProgressBar state={state} />
    </div>
  );
}
