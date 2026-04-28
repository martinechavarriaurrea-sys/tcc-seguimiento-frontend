import { IS_MOCK } from '@/lib/constants';
import { apiClient } from './client';

export type CycleLabel = '0700' | '1200' | '1600';

export type RunStatus = 'queued' | 'in_progress' | 'completed';
export type RunConclusion = 'success' | 'failure' | 'cancelled' | 'timed_out' | null;

export interface TriggerResult {
  triggered: boolean;
  cycle: CycleLabel;
  triggered_at: string;
  message: string;
}

export interface RunInfo {
  run_id: number;
  status: RunStatus;
  conclusion: RunConclusion;
  started_at: string | null;
  updated_at: string | null;
  duration_seconds: number | null;
  url: string | null;
}

// ── Mock ──────────────────────────────────────────────────────────────────────

let _mockRunId = 1000;
let _mockStarted: string | null = null;
let _mockStatus: RunStatus = 'completed';

const mockDispatch = {
  async trigger(cycle: CycleLabel): Promise<TriggerResult> {
    await new Promise((r) => setTimeout(r, 300));
    _mockRunId++;
    _mockStarted = new Date().toISOString();
    _mockStatus = 'queued';
    // Simulate progression: queued → in_progress → completed
    setTimeout(() => { _mockStatus = 'in_progress'; }, 2000);
    setTimeout(() => { _mockStatus = 'completed'; }, 8000);
    return {
      triggered: true,
      cycle,
      triggered_at: _mockStarted,
      message: `Ciclo ${cycle.slice(0, 2)}:${cycle.slice(2)} iniciado (modo demo). Resultado en ~2-4 min.`,
    };
  },

  async getStatus(): Promise<RunInfo | null> {
    await new Promise((r) => setTimeout(r, 200));
    if (!_mockStarted) return null;
    return {
      run_id: _mockRunId,
      status: _mockStatus,
      conclusion: _mockStatus === 'completed' ? 'success' : null,
      started_at: _mockStarted,
      updated_at: new Date().toISOString(),
      duration_seconds: _mockStatus === 'completed' ? 120 : null,
      url: `https://github.com/mock/actions/runs/${_mockRunId}`,
    };
  },
};

// ── Real ──────────────────────────────────────────────────────────────────────

export const dispatchService = {
  async trigger(cycle: CycleLabel): Promise<TriggerResult> {
    if (IS_MOCK) return mockDispatch.trigger(cycle);
    const { data } = await apiClient.post<TriggerResult>('/dispatch/trigger', null, {
      params: { cycle },
    });
    return data;
  },

  async getStatus(): Promise<RunInfo | null> {
    if (IS_MOCK) return mockDispatch.getStatus();
    try {
      const { data } = await apiClient.get<RunInfo>('/dispatch/status');
      return data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw err;
    }
  },
};
