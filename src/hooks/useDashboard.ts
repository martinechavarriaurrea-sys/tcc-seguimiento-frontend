import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/api/dashboard.service';
import { QUERY_KEYS, STALE_TIMES } from '@/lib/constants';

export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: dashboardService.getStats,
    staleTime: STALE_TIMES.dashboard,
    refetchInterval: 5 * 60 * 1000,
  });
}
