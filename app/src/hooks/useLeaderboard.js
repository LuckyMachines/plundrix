import { useQuery } from '@tanstack/react-query';
import { fetchAgentService } from '../config/service';

export function useLeaderboard(queue = 'all', limit = 25) {
  return useQuery({
    queryKey: ['competition', 'leaderboard', queue, limit],
    queryFn: () =>
      fetchAgentService(
        `/api/competition/leaderboard?queue=${encodeURIComponent(queue)}&limit=${limit}`
      ),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
