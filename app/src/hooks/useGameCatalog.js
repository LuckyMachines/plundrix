import { useQuery } from '@tanstack/react-query';
import { AGENT_SERVICE_CONFIGURED, fetchAgentService } from '../config/service';

export function useGameCatalog(limit = 24) {
  return useQuery({
    queryKey: ['games', 'catalog', limit],
    queryFn: () => fetchAgentService(`/api/games?limit=${limit}&offset=0`),
    enabled: AGENT_SERVICE_CONFIGURED,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}
