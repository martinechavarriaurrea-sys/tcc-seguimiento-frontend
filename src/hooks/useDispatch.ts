'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dispatchService, type CycleLabel, type RunInfo } from '@/services/api/dispatch.service';
import { QUERY_KEYS } from '@/lib/constants';

export type DispatchState =
  | 'idle'
  | 'triggering'
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'failed';

const POLL_MS = 5_000;
const TIMEOUT_MS = 120_000;

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

  // Refs — evitan stale closures sin causar re-renders
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerMs = useRef<number>(0);
  const runFound  = useRef<boolean>(false);

  const stopAll = useCallback(() => {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
    if (timerRef.current) { clearTimeout(timerRef.current);  timerRef.current = null; }
  }, []);

  // Limpieza al desmontar
  useEffect(() => () => stopAll(), [stopAll]);

  const trigger = useCallback(async (cycle?: CycleLabel) => {
    stopAll();
    const c = cycle ?? bogotaCycle();

    setError(null);
    setRun(null);
    runFound.current  = false;
    triggerMs.current = 0;
    setState('triggering');

    // 1. Verificar que el sistema esté listo ANTES de mostrar spinner largo
    try {
      await dispatchService.health();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sistema no disponible. Intenta en unos segundos.');
      setState('failed');
      return;
    }

    // 2. Disparar workflow en GitHub (3 reintentos internos en el backend)
    let triggeredAt: string;
    try {
      const result = await dispatchService.trigger(c);
      triggeredAt = result.triggered_at;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar el ciclo en GitHub Actions.');
      setState('failed');
      return;
    }

    // Tiempo mínimo del run: 10 segundos antes del trigger para tolerar desfase de reloj
    triggerMs.current = new Date(triggeredAt).getTime() - 10_000;
    setState('queued');

    // 3. Timeout: si en 2 minutos no aparece el run, avisar
    timerRef.current = setTimeout(() => {
      stopAll();
      setState('failed');
      setError('GitHub Actions no respondió en 2 minutos. Verifica en github.com si el run fue creado.');
    }, TIMEOUT_MS);

    // 4. Polling cada 5s — usa refs, sin dependencias de estado
    pollRef.current = setInterval(async () => {
      try {
        const resp = await dispatchService.getStatus();
        if (!resp) return;

        // Buscar en los 5 runs recientes el que corresponde a este trigger
        const match = resp.recent.find(r => {
          const ms = r.started_at ? new Date(r.started_at).getTime() : 0;
          return ms >= triggerMs.current;
        }) ?? null;

        if (!match) return; // Aún no aparece, seguir esperando

        // Primera vez que aparece: cancelar el timeout de "no aparece"
        if (!runFound.current) {
          runFound.current = true;
          if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
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
            setError(`El workflow terminó con error: "${match.conclusion}". Revisa los logs de GitHub Actions.`);
          }
        } else {
          setState(match.status === 'in_progress' ? 'in_progress' : 'queued');
        }
      } catch {
        // Error de red durante el poll — ignorar y reintentar en el próximo ciclo
      }
    }, POLL_MS);
  }, [stopAll, queryClient]);

  const reset = useCallback(() => {
    stopAll();
    setState('idle');
    setRun(null);
    setError(null);
    runFound.current  = false;
    triggerMs.current = 0;
  }, [stopAll]);

  return { state, run, error, trigger, reset, currentCycle: bogotaCycle() };
}
