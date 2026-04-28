'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dispatchService, type CycleLabel, type RunInfo } from '@/services/api/dispatch.service';
import { QUERY_KEYS } from '@/lib/constants';

export type DispatchState = 'idle' | 'triggering' | 'queued' | 'in_progress' | 'completed' | 'failed';

const POLL_INTERVAL_MS = 5_000;

// Calcula el ciclo actual según hora de Bogotá (UTC-5)
function currentCycleBogota(): CycleLabel {
  const bogotaHour = (new Date().getUTCHours() - 5 + 24) % 24;
  if (bogotaHour < 9) return '0700';
  if (bogotaHour < 14) return '1200';
  return '1600';
}

export function useDispatch() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<DispatchState>('idle');
  const [run, setRun] = useState<RunInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [triggeredAt, setTriggeredAt] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Poll GitHub status every 5s while active
  const startPolling = useCallback((startedAfter: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const info = await dispatchService.getStatus();
        if (!info) return;

        // Ignore runs that started before our trigger
        const runStart = info.started_at ? new Date(info.started_at).getTime() : 0;
        const triggerTime = new Date(startedAfter).getTime() - 3000; // 3s margin
        if (runStart < triggerTime) return;

        setRun(info);

        if (info.status === 'completed') {
          stopPolling();
          if (info.conclusion === 'success') {
            setState('completed');
            // Refresh dashboard data now that TCC was queried
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.guias });
          } else {
            setState('failed');
            setError(`El workflow terminó con conclusión: ${info.conclusion ?? 'desconocida'}`);
          }
        } else {
          setState(info.status === 'in_progress' ? 'in_progress' : 'queued');
        }
      } catch {
        // Network error during poll — keep polling silently
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling, queryClient]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const trigger = useCallback(async (cycle?: CycleLabel) => {
    const resolvedCycle = cycle ?? currentCycleBogota();
    setError(null);
    setRun(null);
    setState('triggering');

    try {
      const result = await dispatchService.trigger(resolvedCycle);
      setTriggeredAt(result.triggered_at);
      setState('queued');
      startPolling(result.triggered_at);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'No se pudo iniciar el ciclo. Verifica que GITHUB_TOKEN esté configurado en Vercel.';
      setError(msg);
      setState('failed');
    }
  }, [startPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setState('idle');
    setRun(null);
    setError(null);
    setTriggeredAt(null);
  }, [stopPolling]);

  return {
    state,
    run,
    error,
    triggeredAt,
    trigger,
    reset,
    currentCycle: currentCycleBogota(),
  };
}
