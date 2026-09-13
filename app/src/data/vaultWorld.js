import worldManifest from '../../world/manifest.json' with { type: 'json' };

export const VAULT_WORLD = Object.freeze(worldManifest);

const ACTIONS = new Set(worldManifest.truths.actions);
const ACTION_BY_ID = Object.freeze({ 1: 'pick', 2: 'search', 3: 'sabotage' });

function normalizeAction(action, fallback = 'pick') {
  if (ACTIONS.has(action)) return action;
  return ACTION_BY_ID[action] || fallback;
}

export function deriveVaultWorldState({
  cracked = 0,
  total = worldManifest.truths.lockCount,
  resolving = false,
  selectedAction = 'pick',
  latestOutcome = null,
  players = [],
} = {}) {
  const lockTotal = Math.max(1, Number(total) || worldManifest.truths.lockCount);
  const locksOpen = Math.max(0, Math.min(lockTotal, Number(cracked) || 0));
  const selectedRoute = normalizeAction(selectedAction);
  const outcomeRoute = normalizeAction(latestOutcome?.action, selectedRoute);
  const route = latestOutcome && !resolving ? outcomeRoute : selectedRoute;
  const affectedOperator = latestOutcome?.target || (latestOutcome?.action === 'sabotage' ? latestOutcome.actor : null);
  const phase = locksOpen >= lockTotal
    ? 'breached'
    : resolving
      ? 'revealing'
      : latestOutcome
        ? latestOutcome.success ? 'aftermath-success' : 'aftermath-failed'
        : 'planning';

  return Object.freeze({
    id: worldManifest.id,
    phase,
    route,
    selectedRoute,
    outcomeRoute,
    locksOpen,
    lockTotal,
    progress: locksOpen / lockTotal,
    affectedOperator,
    activeRivals: players.filter((player) => player.id !== 'player-1').length,
  });
}
