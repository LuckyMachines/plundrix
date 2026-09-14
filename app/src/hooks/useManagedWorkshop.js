import { useCallback, useEffect, useState } from 'react';
import { AGENT_SERVICE_CONFIGURED } from '../config/service';
import {
  CRAFTING_MATERIALS,
  STARTER_GADGET_IDS,
  blueprintIdToGadgetId,
  gadgetIdToBlueprintId,
} from '../data/gadgetInventory';
import { commandManagedWorkshop, getManagedWorkshop } from '../lib/managedService';

function normalizeWorkshop(data) {
  if (!data) return null;
  const craftedIds = (data.craftedBlueprintIds || [])
    .map(blueprintIdToGadgetId)
    .filter(Boolean);
  const equippedId = Number(data.equippedBlueprintId) > 0
    ? blueprintIdToGadgetId(data.equippedBlueprintId)
    : null;
  return {
    version: 1,
    ownedIds: [...new Set([...STARTER_GADGET_IDS, ...craftedIds])],
    equippedId,
    craftedCount: Number(data.craftedCount || 0),
    materials: Object.fromEntries(CRAFTING_MATERIALS.map((material, index) => (
      [material.id, Number(data.materials?.[index] || 0)]
    ))),
    claimedMatches: [],
    recentDrops: [],
  };
}

export function useManagedWorkshop() {
  const [inventory, setInventory] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(AGENT_SERVICE_CONFIGURED);

  const refresh = useCallback(async () => {
    if (!AGENT_SERVICE_CONFIGURED) return null;
    setIsLoading(true);
    try {
      const data = await getManagedWorkshop();
      const next = normalizeWorkshop(data);
      setInventory(next);
      setError(null);
      return next;
    } catch (nextError) {
      setError(nextError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const transact = useCallback(async (operation, gadgetId) => {
    const blueprintId = gadgetIdToBlueprintId(gadgetId);
    if (blueprintId === null) throw new Error('Invalid blueprint ID.');
    setPendingAction({ operation, gadgetId });
    try {
      const data = await commandManagedWorkshop(operation, Number(blueprintId));
      const next = normalizeWorkshop(data);
      setInventory(next);
      setError(null);
      return next;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setPendingAction(null);
    }
  }, []);

  const ready = Boolean(inventory);
  return {
    inventory,
    craftBlueprint: (gadgetId) => transact('craft', gadgetId),
    equipBlueprint: (gadgetId) => transact('equip', gadgetId),
    reclaimBlueprint: (gadgetId) => transact('reclaim', gadgetId),
    refresh,
    pendingAction,
    isConnected: ready,
    isConfigured: AGENT_SERVICE_CONFIGURED,
    isLinked: ready,
    isLoading,
    error,
  };
}
