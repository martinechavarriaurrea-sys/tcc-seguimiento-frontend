'use client';

import { RefreshCw, Loader2, CheckCircle2, XCircle, ExternalLink, RotateCcw, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useDispatch, type DispatchState } from '@/hooks/useDispatch';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(secs: number | null | undefined) {
  if (!secs) return '';
  return secs < 60 ? ` en ${secs}s` : ` en ${Math.floor(secs / 60)}m ${secs % 60}s`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBar({ state }: { state: DispatchState }) {
  if (state === 'idle' || state === 'checking' || state === 'ready') return null;

  const pct: Record<DispatchState, number> = {
    idle: 0, checking: 0, ready: 0,
    triggering: 8, queued: 20, in_progress: 70,
    completed: 100, failed: 100,
  };
  const color = state === 'completed' ? 'bg-green-500' : state === 'failed' ? 'bg-red-500' : 'bg-blue-500';
  const pulse = state === 'in_progress' || state === 'queued' || state === 'triggering';

  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        style={{ width: `${pct[state]}%` }}
        className={`h-full rounded-full transition-all duration-1000 ease-in-out ${color} ${pulse ? 'animate-pulse' : ''}`}
      />
    </div>
  );
}

function StatusLabel({ state, error, run }: { state: DispatchState; error: string | null; run: ReturnType<typeof useDispatch>['run'] }) {
  if (state === 'checking') return <p className="text-xs text-gray-400">Verificando sistema...</p>;
  if (state === 'ready') return <p className="text-xs text-gray-400">Sistema listo.</p>;
  if (state === 'triggering') return <p className="text-xs text-blue-500">Enviando orden a GitHub Actions...</p>;
  if (state === 'queued') return <p className="text-xs text-blue-500">GitHub recibió la orden — esperando runner disponible...</p>;
  if (state === 'in_progress') return <p className="text-xs text-blue-600 font-medium">Consultando TCC guía por guía y actualizando base de datos...</p>;
  if (state === 'completed') return (
    <p className="text-xs text-green-600 font-medium">
      Completado{formatDuration(run?.duration_seconds)}. Dashboard actualizado con los datos más recientes.
    </p>
  );
  if (state === 'failed' && error) return (
    <p className="text-xs text-red-600">{error}</p>
  );
  return null;
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ManualTrigger() {
  const { state, run, error, trigger, reset } = useDispatch();

  const isChecking = state === 'checking';
  const isReady = state === 'ready' || state === 'idle';
  const isActive = state === 'triggering' || state === 'queued' || state === 'in_progress';
  const isCompleted = state === 'completed';
  const isFailed = state === 'failed';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-3 min-w-0">

          {/* Botón principal */}
          <button
            onClick={() => {
              if (isCompleted || isFailed) { reset(); return; }
              if (isReady) trigger();
            }}
            disabled={isActive || isChecking}
            className={`flex-shrink-0 flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isCompleted ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer' :
              isFailed    ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer' :
                            'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isChecking || isActive ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : isFailed ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isChecking   ? 'Verificando...' :
             isActive     ? 'Ejecutando...' :
             isCompleted  ? 'Actualizado ✓' :
             isFailed     ? 'Reintentar' :
                            'Actualizar'}
          </button>

          {/* Descripción de estado */}
          <div className="min-w-0">
            <StatusLabel state={state} error={error} run={run} />
          </div>
        </div>

        {/* Indicador de salud del sistema + link logs */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {!isActive && !isChecking && (
            <span className={`flex items-center gap-1 text-xs font-medium ${isReady || isCompleted ? 'text-green-600' : 'text-red-500'}`}>
              {isReady || isCompleted
                ? <ShieldCheck className="h-3.5 w-3.5" />
                : <ShieldAlert className="h-3.5 w-3.5" />}
              {isReady || isCompleted ? 'Sistema OK' : 'Sistema con error'}
            </span>
          )}
          {run?.url && (
            <a
              href={run.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <ExternalLink className="h-3 w-3" />
              Logs
            </a>
          )}
        </div>
      </div>

      <StatusBar state={state} />
    </div>
  );
}
