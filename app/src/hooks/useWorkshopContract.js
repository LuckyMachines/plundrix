import { useCallback, useState } from 'react';
import { useAccount, usePublicClient, useReadContract, useWriteContract } from 'wagmi';
import {
  IS_CONTRACT_CONFIGURED,
  IS_WORKSHOP_CONFIGURED,
  PLUNDRIX_ABI,
  PLUNDRIX_ADDRESS,
  PLUNDRIX_WORKSHOP_ABI,
  PLUNDRIX_WORKSHOP_ADDRESS,
  WORKSHOP_CONFIG_ERROR,
} from '../config/contract';
import {
  CRAFTING_MATERIALS,
  STARTER_GADGET_IDS,
  blueprintIdToGadgetId,
  gadgetIdToBlueprintId,
} from '../data/gadgetInventory';

export function useWorkshopContract() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, error: writeError } = useWriteContract();
  const [pendingAction, setPendingAction] = useState(null);
  const configured = IS_CONTRACT_CONFIGURED && IS_WORKSHOP_CONFIGURED;
  const linkRead = useReadContract({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    functionName: 'workshop',
    query: { enabled: Boolean(isConnected && address && configured), refetchInterval: 30_000 },
  });
  const isLinked = Boolean(
    linkRead.data
    && String(linkRead.data).toLowerCase() === PLUNDRIX_WORKSHOP_ADDRESS.toLowerCase(),
  );
  const enabled = Boolean(isConnected && address && configured && isLinked);

  const stateRead = useReadContract({
    address: PLUNDRIX_WORKSHOP_ADDRESS,
    abi: PLUNDRIX_WORKSHOP_ABI,
    functionName: 'getWorkshopState',
    args: address ? [address] : undefined,
    query: { enabled, refetchInterval: 15_000 },
  });
  const collectionRead = useReadContract({
    address: PLUNDRIX_WORKSHOP_ADDRESS,
    abi: PLUNDRIX_WORKSHOP_ABI,
    functionName: 'getCraftedBlueprints',
    args: address ? [address] : undefined,
    query: { enabled, refetchInterval: 30_000 },
  });

  const refresh = useCallback(async () => {
    await Promise.all([stateRead.refetch(), collectionRead.refetch()]);
  }, [stateRead.refetch, collectionRead.refetch]);

  const transact = useCallback(async (functionName, gadgetId) => {
    if (!configured) throw new Error(WORKSHOP_CONFIG_ERROR || 'The game contract is not configured.');
    if (!address) throw new Error('Connect a wallet to use the onchain workshop.');
    if (!isLinked) throw new Error('The game contract is not linked to this workshop address.');
    if (!publicClient) throw new Error('The configured network is unavailable.');
    const blueprintId = gadgetIdToBlueprintId(gadgetId);
    if (blueprintId === null) throw new Error('Invalid blueprint ID.');
    setPendingAction({ functionName, gadgetId });
    try {
      const hash = await writeContractAsync({
        address: PLUNDRIX_WORKSHOP_ADDRESS,
        abi: PLUNDRIX_WORKSHOP_ABI,
        functionName,
        args: [blueprintId],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await refresh();
      return hash;
    } finally {
      setPendingAction(null);
    }
  }, [address, configured, isLinked, publicClient, refresh, writeContractAsync]);

  const data = stateRead.data;
  const equippedId = data && Number(data[0]) > 0 ? blueprintIdToGadgetId(data[0]) : null;
  const craftedIds = (collectionRead.data || []).map(blueprintIdToGadgetId).filter(Boolean);
  const inventory = data ? {
    version: 1,
    ownedIds: [...new Set([...STARTER_GADGET_IDS, ...craftedIds])],
    equippedId,
    craftedCount: Number(data[1]),
    materials: Object.fromEntries(CRAFTING_MATERIALS.map((material, index) => (
      [material.id, Number(data[2][index])]
    ))),
    claimedMatches: [],
    recentDrops: [],
  } : null;

  return {
    inventory,
    craftBlueprint: (gadgetId) => transact('craftBlueprint', gadgetId),
    equipBlueprint: (gadgetId) => transact('equipBlueprint', gadgetId),
    reclaimBlueprint: (gadgetId) => transact('reclaimBlueprint', gadgetId),
    refresh,
    pendingAction,
    isConnected,
    isConfigured: configured,
    isLinked,
    isLoading: Boolean(isConnected && configured) && (linkRead.isLoading || (isLinked && (stateRead.isLoading || collectionRead.isLoading))),
    error: linkRead.error || stateRead.error || collectionRead.error || writeError,
  };
}
