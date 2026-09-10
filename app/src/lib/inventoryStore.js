import {
  CRAFTING_MATERIALS,
  GADGET_CHASSIS_BY_ID,
  GADGETS_BY_ID,
  STARTER_GADGET_IDS,
  getGadgetById,
} from '../data/gadgetInventory.js';

export const INVENTORY_STORAGE_KEY = 'plundrix-workshop-v1';

export const MASTERY_RANKS = Object.freeze([
  { level: 4, threshold: 600, title: 'Vault Virtuoso', reward: 'Animated victory stamp' },
  { level: 3, threshold: 300, title: 'Tricksmith', reward: 'Engraved operator plate' },
  { level: 2, threshold: 120, title: 'Field Tinkerer', reward: 'Oxide maker patina' },
  { level: 1, threshold: 0, title: 'Bench Initiate', reward: 'Stamped maker mark' },
]);

function defaultMaterials() {
  return Object.fromEntries(CRAFTING_MATERIALS.map((material) => [material.id, material.start]));
}

export function createDefaultInventory() {
  return {
    version: 3,
    ownedIds: [...STARTER_GADGET_IDS],
    equippedId: STARTER_GADGET_IDS[0],
    favoriteIds: [],
    materials: defaultMaterials(),
    craftedCount: 0,
    claimedMatches: [],
    recentDrops: [],
    mastery: {},
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
  const mastery = Object.fromEntries(Object.entries(value.mastery || {})
    .filter(([id]) => GADGET_CHASSIS_BY_ID[id])
    .map(([id, record]) => [id, {
      xp: Math.max(0, Math.floor(Number(record?.xp) || 0)),
      activations: Math.max(0, Math.floor(Number(record?.activations) || 0)),
      wins: Math.max(0, Math.floor(Number(record?.wins) || 0)),
      runs: Math.max(0, Math.floor(Number(record?.runs) || 0)),
    }]));
  return {
    version: 3,
    ownedIds,
    equippedId: ownedIds.includes(value.equippedId) ? value.equippedId : fallback.equippedId,
    favoriteIds: [...new Set(Array.isArray(value.favoriteIds) ? value.favoriteIds.filter((id) => GADGETS_BY_ID[id]) : [])].slice(-100),
    materials,
    craftedCount: Math.max(0, Math.floor(Number(value.craftedCount) || 0)),
    claimedMatches: Array.isArray(value.claimedMatches) ? [...new Set(value.claimedMatches.filter(Boolean))].slice(-100) : [],
    recentDrops: Array.isArray(value.recentDrops) ? value.recentDrops.slice(-8) : [],
    mastery,
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

export function grantMatchSalvageState(state, { matchId, won = false, rounds = 1, rewardMultiplier = 1, actionMix = {}, routeId = null } = {}) {
  const current = normalizeInventory(state);
  if (!matchId || current.claimedMatches.includes(matchId)) return { awarded: false, next: current, drops: [] };
  const hash = hashString(`${matchId}:${rounds}:${won}`);
  const actionMaterial = dominantActionMaterial(actionMix);
  const routeMaterial = {
    'hot-entry': 'oxide-catalyst',
    'inside-route': 'cipher-glass',
    'ghost-route': 'vault-resin',
  }[routeId];
  const preferredId = actionMaterial?.materialId || routeMaterial;
  const first = CRAFTING_MATERIALS.find((material) => material.id === preferredId)
    || CRAFTING_MATERIALS[hash % CRAFTING_MATERIALS.length];
  const second = CRAFTING_MATERIALS[(hash + Math.max(1, rounds)) % CRAFTING_MATERIALS.length];
  const multiplier = Math.max(0.5, Math.min(2, Number(rewardMultiplier) || 1));
  const rewards = new Map([[first.id, Math.max(1, Math.round((won ? 5 : 3) * multiplier))]]);
  rewards.set(second.id, (rewards.get(second.id) || 0) + Math.max(1, Math.round((won ? 3 : 2) * multiplier)));
  const materials = { ...current.materials };
  const drops = [...rewards].map(([materialId, amount]) => {
    materials[materialId] = (materials[materialId] || 0) + amount;
    return {
      materialId,
      amount,
      reason: materialId === first.id
        ? actionMaterial?.reason || (routeMaterial ? 'Recovered from your chosen route.' : 'Recovered from the operation.')
        : 'Recovered from the vault spill.',
    };
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

function dominantActionMaterial(actionMix = {}) {
  const entries = [
    { keys: ['1', 'PICK', 'pick'], materialId: 'brass-cogs', reason: 'Your Pick-heavy play recovered mechanical stock.' },
    { keys: ['2', 'SEARCH', 'search'], materialId: 'cipher-glass', reason: 'Your Search-heavy play uncovered optical salvage.' },
    { keys: ['3', 'SABOTAGE', 'sabotage'], materialId: 'oxide-catalyst', reason: 'Your Sabotage-heavy play recovered volatile tuning compound.' },
  ].map((entry) => ({ ...entry, count: entry.keys.reduce((sum, key) => sum + (Number(actionMix[key]) || 0), 0) }));
  const strongest = entries.sort((a, b) => b.count - a.count)[0];
  return strongest?.count > 0 ? strongest : null;
}

export function getGadgetMastery(state, gadgetId) {
  const record = normalizeInventory(state).mastery[gadgetId] || {
    xp: 0,
    activations: 0,
    wins: 0,
    runs: 0,
  };
  const rank = MASTERY_RANKS.find((candidate) => record.xp >= candidate.threshold) || MASTERY_RANKS.at(-1);
  const nextRank = [...MASTERY_RANKS].reverse().find((candidate) => candidate.threshold > record.xp) || null;
  const progress = nextRank
    ? Math.round(((record.xp - rank.threshold) / (nextRank.threshold - rank.threshold)) * 100)
    : 100;
  return { ...record, ...rank, nextRank, progress: Math.max(0, Math.min(100, progress)) };
}

export function grantGadgetMasteryState(
  state,
  { gadgetId, won = false, activated = false, runCompleted = false } = {},
) {
  const current = normalizeInventory(state);
  if (!GADGET_CHASSIS_BY_ID[gadgetId]) return { awarded: false, xp: 0, next: current };
  const previous = getGadgetMastery(current, gadgetId);
  const activationCount = Math.max(0, Math.floor(Number(activated) || 0));
  const xp = 20 + activationCount * 35 + (won ? 65 : 0) + (runCompleted ? 45 : 0);
  const mastery = {
    ...current.mastery,
    [gadgetId]: {
      xp: previous.xp + xp,
      activations: previous.activations + activationCount,
      wins: previous.wins + (won ? 1 : 0),
      runs: previous.runs + 1,
    },
  };
  return { awarded: true, xp, next: { ...current, mastery } };
}
