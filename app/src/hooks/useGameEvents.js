import { useState, useCallback, useRef } from 'react';
import { useWatchContractEvent } from 'wagmi';
import {
  PLUNDRIX_ABI,
  PLUNDRIX_ADDRESS,
  IS_CONTRACT_CONFIGURED,
} from '../config/contract';
import { toGameId } from '../lib/gameId';

export function useGameEvents(gameId) {
  const parsedGameId = toGameId(gameId);
  const [events, setEvents] = useState([]);
  const [latestRoundEvents, setLatestRoundEvents] = useState(null);
  const eventsRef = useRef([]);

  const addEvent = useCallback((name, log) => {
    const gameIDFromLog = log.args?.gameID;
    if (
      parsedGameId !== null &&
      gameIDFromLog !== undefined &&
      parsedGameId !== gameIDFromLog
    ) return;

    const entry = {
      name,
      args: log.args,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      timestamp: Date.now(),
    };

    setEvents((prev) => {
      const next = [...prev, entry];
      eventsRef.current = next;
      return next;
    });
  }, [parsedGameId]);

  const collectRoundEvents = useCallback((resolvedLog) => {
    const resolvedBlockNumber = resolvedLog?.blockNumber;
    const resolvedRound = resolvedLog?.args?.round;
    const resolvedGameId = resolvedLog?.args?.gameID;

    if (
      resolvedBlockNumber === undefined ||
      resolvedRound === undefined ||
      resolvedGameId === undefined
    ) {
      return;
    }

    // Use ref to include events added in the same microtask.
    setTimeout(() => {
      const current = eventsRef.current;
      const roundBatch = current.filter((event) => {
        if (event.args?.gameID !== resolvedGameId) return false;

        // Include the full resolve transaction output.
        if (event.blockNumber === resolvedBlockNumber) return true;

        // Include prior action commits for this exact round.
        return (
          event.name === 'ActionSubmitted' &&
          event.args?.round === resolvedRound
        );
      });
      setLatestRoundEvents(roundBatch);
    }, 50);
  }, []);

  useWatchContractEvent({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    eventName: 'GameCreated',
    onLogs: (logs) => logs.forEach((l) => addEvent('GameCreated', l)),
    enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null,
  });

  useWatchContractEvent({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    eventName: 'PlayerJoined',
    onLogs: (logs) => logs.forEach((l) => addEvent('PlayerJoined', l)),
    enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null,
  });

  useWatchContractEvent({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    eventName: 'GameStarted',
    onLogs: (logs) => logs.forEach((l) => addEvent('GameStarted', l)),
    enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null,
  });

  useWatchContractEvent({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    eventName: 'ActionSubmitted',
    onLogs: (logs) => logs.forEach((l) => addEvent('ActionSubmitted', l)),
    enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null,
  });

  useWatchContractEvent({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    eventName: 'RoundResolved',
    onLogs: (logs) => {
      logs.forEach((l) => addEvent('RoundResolved', l));
      logs.forEach((l) => collectRoundEvents(l));
    },
    enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null,
  });

  useWatchContractEvent({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    eventName: 'LockCracked',
    onLogs: (logs) => logs.forEach((l) => addEvent('LockCracked', l)),
    enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null,
  });

  useWatchContractEvent({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    eventName: 'ToolFound',
    onLogs: (logs) => logs.forEach((l) => addEvent('ToolFound', l)),
    enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null,
  });

  useWatchContractEvent({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    eventName: 'PlayerSabotaged',
    onLogs: (logs) => logs.forEach((l) => addEvent('PlayerSabotaged', l)),
    enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null,
  });

  useWatchContractEvent({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    eventName: 'PlayerStunned',
    onLogs: (logs) => logs.forEach((l) => addEvent('PlayerStunned', l)),
    enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null,
  });

  useWatchContractEvent({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    eventName: 'GameWon',
    onLogs: (logs) => logs.forEach((l) => addEvent('GameWon', l)),
    enabled: IS_CONTRACT_CONFIGURED && parsedGameId !== null,
  });

  const clearEvents = useCallback(() => {
    setEvents([]);
    eventsRef.current = [];
  }, []);

  return { events, latestRoundEvents, clearEvents };
}
