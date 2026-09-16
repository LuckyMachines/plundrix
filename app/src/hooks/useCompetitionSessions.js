import { useQuery } from '@tanstack/react-query';
import { AGENT_SERVICE_CONFIGURED, fetchAgentService } from '../config/service';

export function useCompetitionSessions({
  state = 'all',
  queue = 'all',
  limit = 20,
} = {}) {
  return useQuery({
    queryKey: ['competition', 'sessions', state, queue, limit],
    queryFn: () =>
      fetchAgentService(
        `/api/competition/sessions?state=${encodeURIComponent(state)}&queue=${encodeURIComponent(queue)}&limit=${limit}`
      ),
    enabled: AGENT_SERVICE_CONFIGURED,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
