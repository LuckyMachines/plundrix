import { useReadContract } from 'wagmi';
import {
  PLUNDRIX_ABI,
  PLUNDRIX_ADDRESS,
  IS_CONTRACT_CONFIGURED,
} from '../config/contract';

export function useTotalGames() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    functionName: 'totalGames',
    query: {
      enabled: IS_CONTRACT_CONFIGURED,
      refetchInterval: 10000,
    },
  });

  return { totalGames: data, isLoading, error, refetch };
}
