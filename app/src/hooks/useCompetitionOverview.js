import { useQuery } from '@tanstack/react-query';
import { fetchAgentService } from '../config/service';

export function useCompetitionOverview() {
  return useQuery({
    queryKey: ['competition', 'overview'],
    queryFn: () => fetchAgentService('/api/competition/overview'),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
