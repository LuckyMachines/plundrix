import { useReadContract } from 'wagmi';
import {
  PLUNDRIX_ABI,
  PLUNDRIX_ADDRESS,
  IS_CONTRACT_CONFIGURED,
} from '../config/contract';
import { toGameId } from '../lib/gameId';

export function useGameInfo(gameId) {
  const parsedGameId = toGameId(gameId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    functionName: 'getGameInfo',
    args: parsedGameId ? [parsedGameId] : undefined,
    query: {
      enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null,
      refetchInterval: 5000,
    },
  });

  return {
    state: data?.[0],
    currentRound: data?.[1],
    playerCount: data?.[2],
    roundStartTime: data?.[3],
    winner: data?.[4],
    isLoading,
    error,
    refetch,
  };
}
