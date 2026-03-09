import { useQuery } from '@tanstack/react-query';
import { fetchAgentService } from '../config/service';

export function useCompetitionProfile(address) {
  return useQuery({
    queryKey: ['competition', 'profile', address],
    queryFn: () =>
      fetchAgentService(`/api/competition/profiles/${address}`),
    enabled: Boolean(address),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
