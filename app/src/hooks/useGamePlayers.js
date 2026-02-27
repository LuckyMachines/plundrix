import { useReadContracts } from 'wagmi';
import {
  PLUNDRIX_ABI,
  PLUNDRIX_ADDRESS,
  IS_CONTRACT_CONFIGURED,
} from '../config/contract';
import { toGameId } from '../lib/gameId';

export function useGamePlayers(gameId, playerCount) {
  const count = Number(playerCount || 0);
  const parsedGameId = toGameId(gameId);
  const gameIdArg = parsedGameId ?? 0n;

  const contracts = Array.from({ length: count }, (_, i) => ({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    functionName: 'getPlayerAddress',
    args: [gameIdArg, BigInt(i + 1)],
  }));

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled:
        IS_CONTRACT_CONFIGURED && count > 0 && parsedGameId !== null,
    },
  });

  const players = data?.map((r) => r.result).filter(Boolean) || [];

  return { players, isLoading, error, refetch };
}
