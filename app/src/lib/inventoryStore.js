import {
  CRAFTING_MATERIALS,
  GADGETS_BY_ID,
  STARTER_GADGET_IDS,
  getGadgetById,
} from '../data/gadgetInventory.js';

export const INVENTORY_STORAGE_KEY = 'plundrix-workshop-v1';

function defaultMaterials() {
  return Object.fromEntries(CRAFTING_MATERIALS.map((material) => [material.id, material.start]));
}

export function createDefaultInventory() {
  return {
    version: 2,
    ownedIds: [...STARTER_GADGET_IDS],
    equippedId: STARTER_GADGET_IDS[0],
    favoriteIds: [],
    materials: defaultMaterials(),
    craftedCount: 0,
    claimedMatches: [],
    recentDrops: [],
  };
}

export function normalizeInventory(value) {
  const fallback = createDefaultInventory();
  if (!value || typeof value !== 'object') return fallback;
  const ownedIds = [...new Set([
    ...STARTER_GADGET_IDS,
    ...(Array.isArray(value.ownedIds) ? value.ownedIds.filter((id) => GADGETS_BY_ID[id]) : []),
  ])];
  const materials = Object.fromEntries(CRAFTING_MATERIALS.map((material) => {
    const stored = Number(value.materials?.[material.id]);
    return [material.id, Number.isFinite(stored) ? Math.max(0, Math.floor(stored)) : material.start];
  }));
  return {
    version: 2,
    ownedIds,
    equippedId: ownedIds.includes(value.equippedId) ? value.equippedId : fallback.equippedId,
    favoriteIds: [...new Set(Array.isArray(value.favoriteIds) ? value.favoriteIds.filter((id) => GADGETS_BY_ID[id]) : [])].slice(-100),
    materials,
    craftedCount: Math.max(0, Math.floor(Number(value.craftedCount) || 0)),
    claimedMatches: Array.isArray(value.claimedMatches) ? [...new Set(value.claimedMatches.filter(Boolean))].slice(-100) : [],
    recentDrops: Array.isArray(value.recentDrops) ? value.recentDrops.slice(-8) : [],
  };
}

export function readInventory(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return createDefaultInventory();
  try {
    return normalizeInventory(JSON.parse(storage.getItem(INVENTORY_STORAGE_KEY)));
  } catch {
    return createDefaultInventory();
  }
}

export function writeInventory(state, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const next = normalizeInventory(state);
  if (storage) storage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function canCraftGadget(state, gadget) {
  if (!gadget || state.ownedIds.includes(gadget.id)) return false;
  return gadget.recipe.every(({ materialId, amount }) => (state.materials[materialId] || 0) >= amount);
}

export function craftGadgetState(state, gadgetId) {
  const current = normalizeInventory(state);
  const gadget = GADGETS_BY_ID[gadgetId];
  if (!gadget) return { ok: false, next: current, message: 'Blueprint not found.' };
  if (current.ownedIds.includes(gadgetId)) return { ok: false, next: current, message: `${gadget.name} is already assembled.` };
  if (!canCraftGadget(current, gadget)) return { ok: false, next: current, message: 'More salvage is required for this blueprint.' };
  const materials = { ...current.materials };
  gadget.recipe.forEach(({ materialId, amount }) => { materials[materialId] -= amount; });
  return {
    ok: true,
    next: { ...current, ownedIds: [...current.ownedIds, gadgetId], materials, craftedCount: current.craftedCount + 1 },
    message: `${gadget.name} assembled. It is ready to equip.`,
  };
}

export function equipGadgetState(state, gadgetId) {
  const current = normalizeInventory(state);
  if (!current.ownedIds.includes(gadgetId)) return { ok: false, next: current, message: 'Assemble this blueprint before equipping it.' };
  const gadget = getGadgetById(gadgetId);
  return { ok: true, next: { ...current, equippedId: gadgetId }, message: `${gadget.name} equipped for Tactical play.` };
}

export function toggleFavoriteGadgetState(state, gadgetId) {
  const current = normalizeInventory(state);
  if (!GADGETS_BY_ID[gadgetId]) return current;
  const favoriteIds = current.favoriteIds.includes(gadgetId)
    ? current.favoriteIds.filter((id) => id !== gadgetId)
    : [...current.favoriteIds, gadgetId].slice(-100);
  return { ...current, favoriteIds };
}

export function dismantleGadgetState(state, gadgetId) {
  const current = normalizeInventory(state);
  const gadget = GADGETS_BY_ID[gadgetId];
  if (!gadget) return { ok: false, next: current, message: 'Blueprint not found.' };
  if (STARTER_GADGET_IDS.includes(gadgetId)) return { ok: false, next: current, message: 'Starter builds stay in your kit.' };
  if (!current.ownedIds.includes(gadgetId)) return { ok: false, next: current, message: 'Only assembled builds can be reclaimed.' };
  const materials = { ...current.materials };
  const refunds = gadget.recipe.map(({ materialId, amount }) => {
    const refund = Math.ceil(amount / 2);
    materials[materialId] = (materials[materialId] || 0) + refund;
    return { materialId, amount: refund };
  });
  const ownedIds = current.ownedIds.filter((id) => id !== gadgetId);
  return {
    ok: true,
    refunds,
    next: {
      ...current,
      ownedIds,
      materials,
      favoriteIds: current.favoriteIds.filter((id) => id !== gadgetId),
      equippedId: current.equippedId === gadgetId ? STARTER_GADGET_IDS[0] : current.equippedId,
      craftedCount: Math.max(0, current.craftedCount - 1),
    },
    message: `${gadget.name} reclaimed. Half its salvage returned to your locker.`,
  };
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function grantMatchSalvageState(state, { matchId, won = false, rounds = 1 } = {}) {
  const current = normalizeInventory(state);
  if (!matchId || current.claimedMatches.includes(matchId)) return { awarded: false, next: current, drops: [] };
  const hash = hashString(`${matchId}:${rounds}:${won}`);
  const first = CRAFTING_MATERIALS[hash % CRAFTING_MATERIALS.length];
  const second = CRAFTING_MATERIALS[(hash + Math.max(1, rounds)) % CRAFTING_MATERIALS.length];
  const rewards = new Map([[first.id, won ? 5 : 3]]);
  rewards.set(second.id, (rewards.get(second.id) || 0) + (won ? 3 : 2));
  const materials = { ...current.materials };
  const drops = [...rewards].map(([materialId, amount]) => {
    materials[materialId] = (materials[materialId] || 0) + amount;
    return { materialId, amount };
  });
  const record = { matchId, won, drops, at: new Date().toISOString() };
  return {
    awarded: true,
    drops,
    next: {
      ...current,
      materials,
      claimedMatches: [...current.claimedMatches, matchId].slice(-100),
      recentDrops: [...current.recentDrops, record].slice(-8),
    },
  };
}
