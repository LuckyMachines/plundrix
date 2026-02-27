import { useReadContract } from 'wagmi';
import {
  PLUNDRIX_ABI,
  PLUNDRIX_ADDRESS,
  IS_CONTRACT_CONFIGURED,
} from '../config/contract';
import { toGameId } from '../lib/gameId';

export function useAllActionsSubmitted(gameId) {
  const parsedGameId = toGameId(gameId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    functionName: 'allActionsSubmitted',
    args: parsedGameId ? [parsedGameId] : undefined,
    query: {
      enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null,
      refetchInterval: 3000,
    },
  });

  return { allSubmitted: data, isLoading, error, refetch };
}
