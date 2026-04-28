'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dispatchService, type CycleLabel, type RunInfo } from '@/services/api/dispatch.service';
import { QUERY_KEYS } from '@/lib/constants';

export type DispatchState =
  | 'idle'         // listo para usar
  | 'checking'     // verificando que el sistema esté listo
  | 'ready'        // verificado, esperando clic
  | 'triggering'   // enviando orden a GitHub
  | 'queued'       // GitHub recibió, esperando runner
  | 'in_progress'  // runner activo, consultando TCC
  | 'completed'    // éxito, dashboard actualizado
  | 'failed';      // error con detalle visible

const POLL_MS = 5_000;
const RUN_APPEAR_TIMEOUT_MS = 90_000; // si en 90s no aparece el run, advertir

function bogotaCycle(): CycleLabel {
  const h = (new Date().getUTCHours() - 5 + 24) % 24;
  if (h < 9) return '0700';
  if (h < 14) return '1200';
  return '1600';
}

export function useDispatch() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<DispatchState>('idle');
  const [run, setRun] = useState<RunInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [triggeredAt, setTriggeredAt] = useState<string | null>(null);
  const [runAppearedAt, setRunAppearedAt] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopAll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const startPolling = useCallback((startedAfter: string) => {
    stopAll();

    // Timeout: si en 90s no aparece el run, avisar al usuario
    timeoutRef.current = setTimeout(() => {
      if (pollRef.current) {
        setState('failed');
        setError('GitHub Actions tardó más de 90 segundos en iniciar el run. Verifica en github.com/actions si fue recibido.');
        stopAll();
      }
    }, RUN_APPEAR_TIMEOUT_MS);

    const triggerMs = new Date(startedAfter).getTime() - 5_000; // 5s margen

    pollRef.current = setInterval(async () => {
      try {
        const resp = await dispatchService.getStatus();
        if (!resp) return;

        const { latest, recent } = resp;

        // Buscar en los 5 runs recientes el que corresponde a este trigger
        const match = recent.find((r) => {
          const runMs = r.started_at ? new Date(r.started_at).getTime() : 0;
          return runMs >= triggerMs;
        }) ?? (latest.started_at && new Date(latest.started_at).getTime() >= triggerMs ? latest : null);

        if (!match) return; // aún no aparece en GitHub API, seguir esperando

        // Primera vez que aparece: cancelar el timeout de "no aparece"
        if (!runAppearedAt) {
          setRunAppearedAt(Date.now());
          if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        }

        setRun(match);

        if (match.status === 'completed') {
          stopAll();
          if (match.conclusion === 'success') {
            setState('completed');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.guias });
          } else {
            setState('failed');
            setError(`El workflow terminó con error: ${match.conclusion ?? 'desconocido'}. Revisa los logs de GitHub Actions.`);
          }
        } else {
          setState(match.status === 'in_progress' ? 'in_progress' : 'queued');
        }
      } catch {
        // Error de red durante el polling — no interrumpir, solo esperar el siguiente intento
      }
    }, POLL_MS);
  }, [stopAll, queryClient, runAppearedAt]);

  // Verificar estado del sistema al montar
  const checkHealth = useCallback(async () => {
    setState('checking');
    setError(null);
    try {
      await dispatchService.health();
      setState('ready');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sistema no disponible.';
      setState('failed');
      setError(msg);
    }
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  const trigger = useCallback(async (cycle?: CycleLabel) => {
    const resolvedCycle = cycle ?? bogotaCycle();
    setError(null);
    setRun(null);
    setRunAppearedAt(null);
    setState('triggering');

    try {
      const result = await dispatchService.trigger(resolvedCycle);
      setTriggeredAt(result.triggered_at);
      setState('queued');
      startPolling(result.triggered_at);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo iniciar el ciclo.';
      setError(msg);
      setState('failed');
    }
  }, [startPolling]);

  const retry = useCallback(() => {
    stopAll();
    checkHealth();
  }, [stopAll, checkHealth]);

  const reset = useCallback(() => {
    stopAll();
    setState('checking');
    setRun(null);
    setError(null);
    setTriggeredAt(null);
    setRunAppearedAt(null);
    checkHealth();
  }, [stopAll, checkHealth]);

  return { state, run, error, triggeredAt, trigger, reset, retry, currentCycle: bogotaCycle() };
}
