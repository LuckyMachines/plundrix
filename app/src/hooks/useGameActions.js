import { useState } from 'react';
import { useAccount, useChainId, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { zeroAddress } from 'viem';
import {
  PLUNDRIX_ABI,
  PLUNDRIX_ADDRESS,
  IS_CONTRACT_CONFIGURED,
  CONTRACT_CONFIG_ERROR,
  SESSION_KEYS_ENABLED,
  SESSION_RELAY_URL,
  NEXT_RULES_ENABLED,
} from '../config/contract';
import { toGameId } from '../lib/gameId';

function ensureConfigured() {
  if (!IS_CONTRACT_CONFIGURED) {
    throw new Error(CONTRACT_CONFIG_ERROR || 'Contract is not configured');
  }
}

export function useGameActions() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [relayHash, setRelayHash] = useState();
  const [sessionVersion, setSessionVersion] = useState(0);
  const { writeContractAsync, data: walletHash, isPending, error } = useWriteContract();
  const hash = relayHash || walletHash;

  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

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

  const sessionStorageKey = (gameId) => `plundrix-session:${chainId}:${PLUNDRIX_ADDRESS}:${gameId}:${address || ''}`;
  const getStoredSession = (gameId) => {
    if (!SESSION_KEYS_ENABLED || typeof sessionStorage === 'undefined' || !address) return null;
    const privateKey = sessionStorage.getItem(sessionStorageKey(gameId));
    return /^0x[a-fA-F0-9]{64}$/.test(privateKey || '') ? privateKeyToAccount(privateKey) : null;
  };

  const createGameWithPace = (roundTimeout) => {
    ensureConfigured();
    if (!NEXT_RULES_ENABLED) throw new Error('Paced games are not enabled for this deployment');
    return writeContractAsync({
      address: PLUNDRIX_ADDRESS,
      abi: PLUNDRIX_ABI,
      functionName: 'createGameWithPace',
      args: [BigInt(roundTimeout)],
    });
  };

  const hasLocalSession = (gameId) => {
    void sessionVersion;
    return Boolean(getStoredSession(gameId));
  };

  const authorizeSession = (gameId) => {
    ensureConfigured();
    const parsedGameId = toGameId(gameId);
    if (parsedGameId === null || !address) throw new Error('Connect a registered player wallet first');
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    sessionStorage.setItem(sessionStorageKey(gameId), privateKey);
    setSessionVersion((value) => value + 1);
    setRelayHash(undefined);
    return writeContractAsync({
      address: PLUNDRIX_ADDRESS,
      abi: PLUNDRIX_ABI,
      functionName: 'authorizeSessionKey',
      args: [parsedGameId, account.address],
    });
  };

  const revokeSession = (gameId) => {
    ensureConfigured();
    const parsedGameId = toGameId(gameId);
    if (parsedGameId === null) throw new Error('Invalid game ID');
    sessionStorage.removeItem(sessionStorageKey(gameId));
    setSessionVersion((value) => value + 1);
    setRelayHash(undefined);
    return writeContractAsync({
      address: PLUNDRIX_ADDRESS,
      abi: PLUNDRIX_ABI,
      functionName: 'revokeSessionKey',
      args: [parsedGameId],
    });
  };

  const submitAction = async (gameId, action, sabotageTarget = zeroAddress) => {
    ensureConfigured();
    const parsedGameId = toGameId(gameId);
    if (parsedGameId === null) {
      throw new Error('Invalid game ID');
    }
    const sessionAccount = getStoredSession(gameId);
    if (sessionAccount && SESSION_RELAY_URL && publicClient && address) {
      const [authorizedKey, nonce] = await publicClient.readContract({
        address: PLUNDRIX_ADDRESS,
        abi: PLUNDRIX_ABI,
        functionName: 'getSessionKey',
        args: [parsedGameId, address],
      });
      if (authorizedKey.toLowerCase() === sessionAccount.address.toLowerCase()) {
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 120);
        const signature = await sessionAccount.signTypedData({
          domain: { name: 'Plundrix', version: '1', chainId, verifyingContract: PLUNDRIX_ADDRESS },
          types: {
            SessionAction: [
              { name: 'gameID', type: 'uint256' },
              { name: 'player', type: 'address' },
              { name: 'action', type: 'uint8' },
              { name: 'sabotageTarget', type: 'address' },
              { name: 'nonce', type: 'uint256' },
              { name: 'deadline', type: 'uint256' },
            ],
          },
          primaryType: 'SessionAction',
          message: { gameID: parsedGameId, player: address, action, sabotageTarget, nonce, deadline },
        });
        const response = await fetch(`${SESSION_RELAY_URL}/api/session-actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: parsedGameId.toString(),
            player: address,
            action,
            sabotageTarget,
            deadline: deadline.toString(),
            signature,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Session relay failed');
        setRelayHash(result.hash);
        return result.hash;
      }
    }
    setRelayHash(undefined);
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
    createGameWithPace,
    createStakesGame,
    withdraw,
    registerPlayer,
    startGame,
    submitAction,
    authorizeSession,
    revokeSession,
    hasLocalSession,
    sessionKeysEnabled: SESSION_KEYS_ENABLED && Boolean(SESSION_RELAY_URL),
    nextRulesEnabled: NEXT_RULES_ENABLED,
    resolveRound,
    hash,
    receipt,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isConfigured: IS_CONTRACT_CONFIGURED,
    configError: CONTRACT_CONFIG_ERROR,
  };
}
