import { useReadContracts } from 'wagmi';
import {
  PLUNDRIX_ABI,
  PLUNDRIX_ADDRESS,
  IS_CONTRACT_CONFIGURED,
} from '../config/contract';
import { toGameId } from '../lib/gameId';

export function useTablePlayerStates(gameId, players = []) {
  const parsedGameId = toGameId(gameId);
  const contracts = players.filter(Boolean).map((player) => ({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    functionName: 'getPlayerState',
    args: [parsedGameId ?? 0n, player],
  }));
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null && contracts.length > 0,
      refetchInterval: 5000,
    },
  });
  const states = data?.map((result, index) => ({
    address: players[index],
    locksCracked: result.result?.[0] ?? 0n,
    tools: result.result?.[1] ?? 0n,
    stunned: result.result?.[2] ?? false,
    registered: result.result?.[3] ?? false,
    actionSubmitted: result.result?.[4] ?? false,
  })) || [];
  const leaderLocks = states.reduce(
    (leader, player) => Math.max(leader, Number(player.locksCracked || 0)),
    0,
  );
  return { states, leaderLocks, isLoading, error, refetch };
}
