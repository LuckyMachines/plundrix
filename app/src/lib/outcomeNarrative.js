const ACTION = Object.freeze({ PICK: 1, SEARCH: 2, SABOTAGE: 3 });
const REASON = Object.freeze({
  PICK_FAILED_STUNNED: 'PICK_FAILED_STUNNED',
  SEARCH_FAILED_MAX_TOOLS: 'SEARCH_FAILED_MAX_TOOLS',
  SABOTAGE_SUCCESS_STEAL: 'SABOTAGE_SUCCESS_STEAL',
  SABOTAGE_FAILED_COOLDOWN: 'SABOTAGE_FAILED_COOLDOWN',
  SABOTAGE_BLOCKED_GADGET: 'SABOTAGE_BLOCKED_GADGET',
});
const ACTION_BY_NAME = Object.freeze({ pick: ACTION.PICK, search: ACTION.SEARCH, sabotage: ACTION.SABOTAGE });

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function actionCode(value) {
  if (typeof value === 'string' && ACTION_BY_NAME[value.toLowerCase()]) return ACTION_BY_NAME[value.toLowerCase()];
  return number(value);
}

function playerLabel(players, playerId, fallback = 'A rival') {
  const player = players.find((candidate) => candidate.id === playerId || candidate.actor === playerId);
  return player?.name || player?.label || fallback;
}

function chanceText(outcome) {
  return Number.isFinite(Number(outcome?.chance)) ? ` at ${number(outcome.chance)}% odds` : '';
}

export function buildOutcomeNarrative(outcome, {
  players = [],
  playerId = 'player-1',
  totalLocks = 5,
  pickToolBonus = 15,
} = {}) {
  if (!outcome) return null;
  const action = actionCode(outcome.action);
  const isPlayer = outcome.actor === playerId || outcome.you === true;
  const actor = isPlayer ? 'You' : playerLabel(players, outcome.actor, outcome.actorLabel || 'A rival');
  const target = playerLabel(players, outcome.target, outcome.targetLabel || 'a rival');
  const locks = number(outcome.locksCracked);
  const tools = number(outcome.tools);
  const locksBefore = number(outcome.locksBefore, locks - (outcome.success && action === ACTION.PICK ? 1 : 0));
  const toolsBefore = number(outcome.toolsBefore, tools - (outcome.success && action === ACTION.SEARCH ? 1 : 0));
  const lockDelta = Math.max(0, locks - locksBefore);
  const toolDelta = tools - toolsBefore;
  const successful = Boolean(outcome.success);

  if (action === ACTION.PICK) {
    if (successful) {
      return {
        action: 'pick',
        successful,
        headline: `${actor} cracked ${lockDelta || 1} ${lockDelta === 1 ? 'lock' : 'locks'}.`,
        cause: `Pick landed${chanceText(outcome)}.`,
        consequence: `${locksBefore} -> ${locks} of ${totalLocks} locks open.`,
      };
    }
    const stunned = outcome.reason === REASON.PICK_FAILED_STUNNED || number(outcome.reasonCode, -1) === 2;
    return {
      action: 'pick',
      successful,
      headline: stunned ? `${actor} could not Pick while stunned.` : `${actor}'s Pick did not open the lock.`,
      cause: stunned ? 'Sabotage blocked this attempt.' : `The roll missed${chanceText(outcome)}.`,
      consequence: `${locks} of ${totalLocks} locks remain open.`,
    };
  }

  if (action === ACTION.SEARCH) {
    if (successful) {
      return {
        action: 'search',
        successful,
        headline: `${actor} found ${Math.max(1, toolDelta)} ${Math.max(1, toolDelta) === 1 ? 'tool' : 'tools'}.`,
        cause: `Search landed${chanceText(outcome)}.`,
        consequence: `${toolsBefore} -> ${tools} tools; Pick gains up to ${Math.max(1, toolDelta) * pickToolBonus} points.`,
      };
    }
    const full = outcome.reason === REASON.SEARCH_FAILED_MAX_TOOLS || number(outcome.reasonCode, -1) === 6;
    return {
      action: 'search',
      successful,
      headline: full ? `${actor}'s tool rack was already full.` : `${actor} found no tool.`,
      cause: full ? 'Search had nowhere to store the result.' : `The search missed${chanceText(outcome)}.`,
      consequence: `${tools} tools carried; Pick odds are unchanged.`,
    };
  }

  if (action === ACTION.SABOTAGE) {
    if (successful) {
      const stoleTool = toolDelta > 0 || outcome.reason === REASON.SABOTAGE_SUCCESS_STEAL || number(outcome.reasonCode, -1) === 8;
      return {
        action: 'sabotage',
        successful,
        headline: `${actor} stunned ${target}.`,
        cause: stoleTool ? 'Sabotage landed and stole one tool.' : 'Sabotage landed; there was no tool to steal.',
        consequence: stoleTool ? `${actor} now carries ${tools} tools; ${target} loses the next Pick.` : `${target} loses the next Pick.`,
      };
    }
    const blocked = outcome.reason === REASON.SABOTAGE_BLOCKED_GADGET || number(outcome.reasonCode, -1) === 13;
    const cooling = outcome.reason === REASON.SABOTAGE_FAILED_COOLDOWN || number(outcome.reasonCode, -1) === 12;
    return {
      action: 'sabotage',
      successful,
      headline: blocked ? `${target}'s gadget blocked ${actor}.` : cooling ? `${target} resisted another Sabotage.` : `${actor}'s Sabotage missed.`,
      cause: blocked ? 'A defensive gadget absorbed the hit.' : cooling ? 'Counter-pressure prevents consecutive stuns.' : 'The target was not valid.',
      consequence: 'No rival lost a turn.',
    };
  }

  return {
    action: 'none',
    successful: false,
    headline: `${actor} made no move.`,
    cause: 'No action was submitted before resolution.',
    consequence: 'The table advanced without progress.',
  };
}
