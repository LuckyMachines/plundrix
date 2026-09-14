import { useQuery } from '@tanstack/react-query';
import { AGENT_SERVICE_CONFIGURED, fetchAgentService } from '../config/service';

export function useCompetitionProfile(operatorId) {
  return useQuery({
    queryKey: ['competition', 'profile', operatorId],
    queryFn: () =>
      fetchAgentService(`/api/competition/profiles/${operatorId}`),
    enabled: Boolean(operatorId) && AGENT_SERVICE_CONFIGURED,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
