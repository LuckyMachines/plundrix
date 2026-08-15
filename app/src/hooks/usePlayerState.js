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
    locksCracked: data?.[0] ?? 0n,
    tools: data?.[1] ?? 0n,
    stunned: data?.[2] ?? false,
    registered: data?.[3] ?? false,
    actionSubmitted: data?.[4] ?? false,
    isLoading,
    error,
    refetch,
  };
}
