import { useQuery } from '@tanstack/react-query';
import { systemService } from '@/services/api/system.service';
import { QUERY_KEYS, STALE_TIMES } from '@/lib/constants';

export function useSystem() {
  return useQuery({
    queryKey: QUERY_KEYS.system,
    queryFn: systemService.getHealth,
    staleTime: STALE_TIMES.system,
    refetchInterval: 30_000,
  });
}
