import type { SystemHealth } from '@/types';
import { IS_MOCK } from '@/lib/constants';
import { apiClient } from './client';
import { mockSystem } from './mock';

export const systemService = {
  async getHealth(): Promise<SystemHealth> {
    if (IS_MOCK) return mockSystem.getHealth();
    const { data } = await apiClient.get<SystemHealth>('/system/health');
    return data;
  },
};
