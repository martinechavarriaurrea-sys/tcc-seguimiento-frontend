import type { DashboardStats } from '@/types';
import { IS_MOCK } from '@/lib/constants';
import { apiClient } from './client';
import { mockDashboard } from './mock';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    if (IS_MOCK) return mockDashboard.getStats();
    const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
    return data;
  },
};
