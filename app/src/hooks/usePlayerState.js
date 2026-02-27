import { useReadContract } from 'wagmi';
import {
  PLUNDRIX_ABI,
  PLUNDRIX_ADDRESS,
  IS_CONTRACT_CONFIGURED,
} from '../config/contract';
import { toGameId } from '../lib/gameId';

export function usePlayerState(gameId, playerAddr) {
  const parsedGameId = toGameId(gameId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    functionName: 'getPlayerState',
    args: parsedGameId && playerAddr ? [parsedGameId, playerAddr] : undefined,
    query: {
      enabled:
        IS_CONTRACT_CONFIGURED && parsedGameId !== null && !!playerAddr,
      refetchInterval: 5000,
    },
  });

  return {
    locksCracked: data?.[0],
    tools: data?.[1],
    stunned: data?.[2],
    registered: data?.[3],
    actionSubmitted: data?.[4],
    isLoading,
    error,
    refetch,
  };
}
