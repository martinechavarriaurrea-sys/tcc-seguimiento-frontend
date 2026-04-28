'use client';

import { useState } from 'react';
import { Play, Loader2, CheckCircle2, XCircle, ExternalLink, RotateCcw } from 'lucide-react';
import { useDispatch, type DispatchState } from '@/hooks/useDispatch';
import type { CycleLabel } from '@/services/api/dispatch.service';

const STATE_LABEL: Record<DispatchState, string> = {
  idle: 'Consultar TCC ahora',
  triggering: 'Iniciando...',
  queued: 'En cola — esperando runner...',
  in_progress: 'Ejecutando — consultando TCC...',
  completed: '¡Completado! Dashboard actualizado',
  failed: 'Error en la ejecución',
};

const CYCLES: { value: CycleLabel; label: string }[] = [
  { value: '0700', label: 'Ciclo 07:00' },
  { value: '1200', label: 'Ciclo 12:00' },
  { value: '1600', label: 'Ciclo 16:00' },
];

function ProgressBar({ state }: { state: DispatchState }) {
  const widths: Record<DispatchState, string> = {
    idle: 'w-0',
    triggering: 'w-1/12',
    queued: 'w-2/12',
    in_progress: 'w-8/12',
    completed: 'w-full',
    failed: 'w-full',
  };
  const colors: Record<DispatchState, string> = {
    idle: 'bg-blue-500',
    triggering: 'bg-blue-500',
    queued: 'bg-blue-400',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  };
  if (state === 'idle') return null;
  return (
    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-in-out ${widths[state]} ${colors[state]} ${
          state === 'in_progress' ? 'animate-pulse' : ''
        }`}
      />
    </div>
  );
}

export function ManualTrigger() {
  const { state, run, error, trigger, reset, currentCycle } = useDispatch();
  const [selectedCycle, setSelectedCycle] = useState<CycleLabel>(currentCycle);

  const isActive = state === 'triggering' || state === 'queued' || state === 'in_progress';
  const isDone = state === 'completed' || state === 'failed';

  function formatDuration(secs: number | null | undefined) {
    if (!secs) return null;
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Consultar TCC ahora</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Dispara una consulta inmediata sin esperar el horario automático.
            Tarda 2–4 minutos en completarse.
          </p>
        </div>

        {isDone && (
          <button
            onClick={reset}
            className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reiniciar
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* Cycle selector */}
        <select
          value={selectedCycle}
          onChange={(e) => setSelectedCycle(e.target.value as CycleLabel)}
          disabled={isActive || isDone}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        >
          {CYCLES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}{c.value === currentCycle ? ' (actual)' : ''}
            </option>
          ))}
        </select>

        {/* Action button */}
        <button
          onClick={() => trigger(selectedCycle)}
          disabled={isActive || state === 'completed'}
          className={`flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
            state === 'completed'
              ? 'bg-green-600 text-white cursor-default'
              : state === 'failed'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed'
          }`}
        >
          {state === 'completed' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : state === 'failed' ? (
            <XCircle className="h-4 w-4" />
          ) : isActive ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {state === 'failed' ? 'Reintentar' : STATE_LABEL[state]}
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar state={state} />

      {/* Status detail */}
      {state !== 'idle' && (
        <div className="mt-3 space-y-1">
          {/* Active step description */}
          {(state === 'queued' || state === 'in_progress') && (
            <p className="text-xs text-blue-600">
              {state === 'queued'
                ? 'Workflow recibido por GitHub, esperando runner disponible...'
                : 'Consultando TCC para cada guía activa y actualizando la base de datos...'}
            </p>
          )}

          {/* Success */}
          {state === 'completed' && (
            <p className="text-xs text-green-600">
              Consulta completada
              {run?.duration_seconds ? ` en ${formatDuration(run.duration_seconds)}` : ''}.
              El dashboard ya muestra los datos actualizados.
            </p>
          )}

          {/* Error */}
          {state === 'failed' && error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {/* GitHub run link */}
          {run?.url && (
            <a
              href={run.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <ExternalLink className="h-3 w-3" />
              Ver logs en GitHub Actions
            </a>
          )}
        </div>
      )}
    </div>
  );
}
