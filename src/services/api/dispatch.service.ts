import { IS_MOCK } from '@/lib/constants';
import { apiClient } from './client';

export type CycleLabel = '0700' | '1200' | '1600';
export type RunStatus = 'queued' | 'in_progress' | 'completed' | 'unknown';
export type RunConclusion = 'success' | 'failure' | 'cancelled' | 'timed_out' | null;

export interface RunInfo {
  run_id: number;
  status: RunStatus;
  conclusion: RunConclusion;
  started_at: string | null;
  updated_at: string | null;
  duration_seconds: number | null;
  url: string | null;
  event?: string;
}

export interface StatusResponse {
  latest: RunInfo;
  recent: RunInfo[];
}

export interface TriggerResult {
  triggered: boolean;
  cycle: CycleLabel;
  triggered_at: string;
  attempts: number;
  message: string;
}

export interface HealthResult {
  ready: boolean;
  workflow: string;
  workflow_state: string;
  repo: string;
}

// ── Mock ──────────────────────────────────────────────────────────────────────

let _mockId = 9000;
let _mockStarted: string | null = null;
let _mockStatus: RunStatus = 'completed';

const mockDispatch = {
  async health(): Promise<HealthResult> {
    await new Promise((r) => setTimeout(r, 200));
    return { ready: true, workflow: 'TCC Scheduler (mock)', workflow_state: 'active', repo: 'mock/repo' };
  },
  async trigger(cycle: CycleLabel): Promise<TriggerResult> {
    await new Promise((r) => setTimeout(r, 300));
    _mockId++;
    _mockStarted = new Date().toISOString();
    _mockStatus = 'queued';
    setTimeout(() => { _mockStatus = 'in_progress'; }, 2000);
    setTimeout(() => { _mockStatus = 'completed'; }, 8000);
    return { triggered: true, cycle, triggered_at: _mockStarted, attempts: 1, message: 'Demo: ciclo iniciado.' };
  },
  async getStatus(): Promise<StatusResponse | null> {
    await new Promise((r) => setTimeout(r, 150));
    if (!_mockStarted) return null;
    const run: RunInfo = {
      run_id: _mockId, status: _mockStatus,
      conclusion: _mockStatus === 'completed' ? 'success' : null,
      started_at: _mockStarted, updated_at: new Date().toISOString(),
      duration_seconds: _mockStatus === 'completed' ? 34 : null,
      url: `https://github.com/mock/actions/runs/${_mockId}`, event: 'workflow_dispatch',
    };
    return { latest: run, recent: [run] };
  },
};

// ── Real ──────────────────────────────────────────────────────────────────────

function extractDetail(err: unknown): string {
  const e = err as { response?: { data?: { detail?: string }; status?: number } };
  if (e?.response?.data?.detail) return e.response.data.detail;
  if (e?.response?.status === 401) return 'Sesión expirada. Recarga la página.';
  if (e?.response?.status === 503) return 'Servicio no disponible. Intenta en unos segundos.';
  return 'Error de conexión con el servidor.';
}

export const dispatchService = {
  // health y status son públicos — no requieren token
  async health(): Promise<HealthResult> {
    if (IS_MOCK) return mockDispatch.health();
    try {
      const { data } = await apiClient.get<HealthResult>('/dispatch/health');
      return data;
    } catch (err) {
      throw new Error(extractDetail(err));
    }
  },

  async trigger(cycle: CycleLabel): Promise<TriggerResult> {
    if (IS_MOCK) return mockDispatch.trigger(cycle);
    try {
      const { data } = await apiClient.post<TriggerResult>('/dispatch/trigger', null, { params: { cycle } });
      return data;
    } catch (err) {
      throw new Error(extractDetail(err));
    }
  },

  async getStatus(): Promise<StatusResponse | null> {
    if (IS_MOCK) return mockDispatch.getStatus();
    try {
      const { data } = await apiClient.get<StatusResponse>('/dispatch/status');
      return data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      // Errores de red durante polling: no propagar, retornar null
      return null;
    }
  },
};
