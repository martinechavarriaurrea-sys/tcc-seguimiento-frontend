import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/api/dashboard.service';
import { QUERY_KEYS, STALE_TIMES } from '@/lib/constants';

export const DASHBOARD_POLL_MS = 60_000;

export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: dashboardService.getStats,
    staleTime: STALE_TIMES.dashboard,
    refetchInterval: DASHBOARD_POLL_MS,
    // Keep last known data visible when a poll fails
    placeholderData: (prev) => prev,
  });
}
