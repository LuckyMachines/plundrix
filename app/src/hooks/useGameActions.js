import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  PLUNDRIX_ABI,
  PLUNDRIX_ADDRESS,
  IS_CONTRACT_CONFIGURED,
  CONTRACT_CONFIG_ERROR,
} from '../config/contract';
import { toGameId } from '../lib/gameId';

function ensureConfigured() {
  if (!IS_CONTRACT_CONFIGURED) {
    throw new Error(CONTRACT_CONFIG_ERROR || 'Contract is not configured');
  }
}

export function useGameActions() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createGame = () => {
    ensureConfigured();
    return writeContractAsync({
      address: PLUNDRIX_ADDRESS,
      abi: PLUNDRIX_ABI,
      functionName: 'createGame',
    });
  };

const registerPlayer = (gameId, value) => {
    ensureConfigured();
    const parsedGameId = toGameId(gameId);
    if (parsedGameId === null) {
      throw new Error('Invalid game ID');
    }
    return writeContractAsync({
      address: PLUNDRIX_ADDRESS,
      abi: PLUNDRIX_ABI,
      functionName: 'registerPlayer',
      args: [parsedGameId],
      ...(value ? { value } : {}),
    });
  };

  const startGame = (gameId) => {
    ensureConfigured();
    const parsedGameId = toGameId(gameId);
    if (parsedGameId === null) {
      throw new Error('Invalid game ID');
    }
    return writeContractAsync({
      address: PLUNDRIX_ADDRESS,
      abi: PLUNDRIX_ABI,
      functionName: 'startGame',
      args: [parsedGameId],
    });
  };

  const submitAction = (gameId, action, sabotageTarget = '0x0000000000000000000000000000000000000000') => {
    ensureConfigured();
    const parsedGameId = toGameId(gameId);
    if (parsedGameId === null) {
      throw new Error('Invalid game ID');
    }
    return writeContractAsync({
      address: PLUNDRIX_ADDRESS,
      abi: PLUNDRIX_ABI,
      functionName: 'submitAction',
      args: [parsedGameId, action, sabotageTarget],
    });
  };

  const resolveRound = (gameId) => {
    ensureConfigured();
    const parsedGameId = toGameId(gameId);
    if (parsedGameId === null) {
      throw new Error('Invalid game ID');
    }
    return writeContractAsync({
      address: PLUNDRIX_ADDRESS,
      abi: PLUNDRIX_ABI,
      functionName: 'resolveRound',
      args: [parsedGameId],
    });
  };

  const withdraw = () => {
    ensureConfigured();
    return writeContractAsync({
      address: PLUNDRIX_ADDRESS,
      abi: PLUNDRIX_ABI,
      functionName: 'withdraw',
    });
  };

  const createStakesGame = (entryFee) => {
    ensureConfigured();
    return writeContractAsync({
      address: PLUNDRIX_ADDRESS,
      abi: PLUNDRIX_ABI,
      functionName: 'createGame',
      args: [1, entryFee],
    });
  };

  return {
    createGame,
    createStakesGame,
    withdraw,
    registerPlayer,
    startGame,
    submitAction,
    resolveRound,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isConfigured: IS_CONTRACT_CONFIGURED,
    configError: CONTRACT_CONFIG_ERROR,
  };
}
