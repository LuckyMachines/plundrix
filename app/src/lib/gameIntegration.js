import { Action, GameState, MAX_TOOLS, ROUND_TIMEOUT, TOTAL_LOCKS } from './constants';

const ACTION_TO_INTENT = {
  [Action.PICK]: 'pick',
  [Action.SEARCH]: 'search',
  [Action.SABOTAGE]: 'sabotage',
};

export const SOUND_CUES = {
  INTENT_PICK: 'intent.pick',
  INTENT_SEARCH: 'intent.search',
  INTENT_SABOTAGE: 'intent.sabotage',
  INPUT_INVALID: 'input.invalid',
  ACTION_COMMIT: 'action.commit',
  TX_PENDING: 'tx.pending',
  TX_CONFIRMED: 'tx.confirmed',
  LOCK_CRACK: 'lock.crack',
  TOOL_FOUND: 'tool.found',
  SABOTAGE_HIT: 'sabotage.hit',
  STUN_CLEAR: 'stun.clear',
  ROUND_READY: 'round.ready',
  ROUND_RESOLVE: 'round.resolve',
  GAME_WIN: 'game.win',
};

function asNumber(value, fallback = 0) {
  if (value === undefined || value === null) return fallback;
  return Number(value);
}

function sameAddress(a, b) {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

function getRemainingSeconds(roundStartTime, nowMs, timeout = ROUND_TIMEOUT) {
  if (!roundStartTime) return timeout;
  const elapsed = Math.max(0, Math.floor(nowMs / 1000) - Number(roundStartTime));
  return Math.max(0, timeout - elapsed);
}

export function getPressureState(roundStartTime, nowMs, timeout = ROUND_TIMEOUT) {
  const remaining = getRemainingSeconds(roundStartTime, nowMs, timeout);
  const fraction = timeout > 0 ? remaining / timeout : 0;

  if (remaining <= 0) {
    return { remaining, fraction, stage: 'timeout', label: 'Timeout', urgency: 4 };
  }
  if (remaining <= 30) {
    return { remaining, fraction, stage: 'critical', label: 'Critical', urgency: 3 };
  }
  if (remaining <= 60) {
    return { remaining, fraction, stage: 'urgent', label: 'Urgent', urgency: 2 };
  }
  if (fraction <= 0.5) {
    return { remaining, fraction, stage: 'pressing', label: 'Pressing', urgency: 1 };
  }
  return { remaining, fraction, stage: 'steady', label: 'Steady', urgency: 0 };
}

export function buildPlayerStatus({
  address,
  currentAddress,
  connected,
  registered,
  locksCracked,
  tools,
  stunned,
  actionSubmitted,
  targetAddress,
  latestCue,
}) {
  const toolCount = asNumber(tools);
  const lockCount = asNumber(locksCracked);
  const isCurrentUser = sameAddress(address, currentAddress);
  const isTargeted = sameAddress(address, targetAddress);
  const isComplete = lockCount >= TOTAL_LOCKS;
  const role = isCurrentUser ? 'self' : isTargeted ? 'target' : 'rival';

  return {
    address,
    role,
    connected,
    registered,
    isCurrentUser,
    isTargeted,
    isComplete,
    locksCracked: lockCount,
    lockProgress: TOTAL_LOCKS > 0 ? lockCount / TOTAL_LOCKS : 0,
    tools: toolCount,
    toolCapacity: MAX_TOOLS,
    toolPressure: MAX_TOOLS > 0 ? toolCount / MAX_TOOLS : 0,
    stunned: !!stunned,
    actionSubmitted: !!actionSubmitted,
    latestCue,
    posture: getPlayerPosture({
      stunned,
      actionSubmitted,
      isTargeted,
      isComplete,
      toolCount,
    }),
  };
}

export function getPlayerPosture({
  stunned,
  actionSubmitted,
  isTargeted,
  isComplete,
  toolCount,
}) {
  if (isComplete) return 'victory';
  if (stunned) return 'stunned';
  if (isTargeted) return 'threatened';
  if (actionSubmitted) return 'committed';
  if (toolCount >= MAX_TOOLS) return 'loaded';
  if (toolCount === 0) return 'searching';
  return 'ready';
}

export function buildEventCue(event, currentAddress) {
  if (!event) return null;
  const args = event.args || {};
  const player = args.player || args.attacker || args.winner || args.resolver;
  const isMine = sameAddress(player, currentAddress);

  switch (event.name) {
    case 'ActionSubmitted':
      return {
        id: `${event.transactionHash || event.timestamp}-submitted-${player || ''}`,
        type: 'action.commit',
        tone: 'blueprint',
        actor: player,
        target: args.sabotageTarget,
        intent: ACTION_TO_INTENT[Number(args.action)] || 'idle',
        sound: SOUND_CUES.ACTION_COMMIT,
        isMine,
      };
    case 'ActionOutcome':
      return {
        id: `${event.transactionHash || event.timestamp}-outcome-${player || ''}`,
        type: 'action.outcome',
        tone: Number(args.action) === Action.SABOTAGE ? 'danger' : 'blueprint',
        actor: player,
        target: args.sabotageTarget,
        intent: ACTION_TO_INTENT[Number(args.action)] || 'idle',
        success: !!args.success,
        reason: Number(args.reason),
        sound: !!args.success ? SOUND_CUES.TX_CONFIRMED : SOUND_CUES.INPUT_INVALID,
        isMine,
      };
    case 'LockCracked':
      return {
        id: `${event.transactionHash || event.timestamp}-lock-${player || ''}`,
        type: 'lock.crack',
        tone: 'tungsten',
        actor: player,
        total: asNumber(args.totalCracked),
        sound: SOUND_CUES.LOCK_CRACK,
        isMine,
      };
    case 'ToolFound':
      return {
        id: `${event.transactionHash || event.timestamp}-tool-${player || ''}`,
        type: 'tool.found',
        tone: 'oxide',
        actor: player,
        total: asNumber(args.totalTools),
        sound: SOUND_CUES.TOOL_FOUND,
        isMine,
      };
    case 'PlayerSabotaged':
      return {
        id: `${event.transactionHash || event.timestamp}-sabotage-${args.attacker || ''}-${args.victim || ''}`,
        type: 'sabotage.hit',
        tone: 'danger',
        actor: args.attacker,
        target: args.victim,
        sound: SOUND_CUES.SABOTAGE_HIT,
        isMine: sameAddress(args.attacker, currentAddress),
      };
    case 'PlayerStunned':
      return {
        id: `${event.transactionHash || event.timestamp}-stun-${player || ''}`,
        type: 'player.stunned',
        tone: 'danger',
        actor: player,
        sound: SOUND_CUES.SABOTAGE_HIT,
        isMine,
      };
    case 'RoundResolved':
      return {
        id: `${event.transactionHash || event.timestamp}-round-${args.round || ''}`,
        type: 'round.resolve',
        tone: 'blueprint',
        round: asNumber(args.round),
        sound: SOUND_CUES.ROUND_RESOLVE,
      };
    case 'GameWon':
      return {
        id: `${event.transactionHash || event.timestamp}-won-${args.winner || ''}`,
        type: 'game.win',
        tone: 'tungsten',
        actor: args.winner,
        sound: SOUND_CUES.GAME_WIN,
        isMine: sameAddress(args.winner, currentAddress),
      };
    default:
      return {
        id: `${event.transactionHash || event.timestamp}-${event.name}`,
        type: event.name,
        tone: 'neutral',
        actor: player,
        sound: null,
        isMine,
      };
  }
}

export function buildEventCues(events = [], currentAddress) {
  return events.map((event) => buildEventCue(event, currentAddress)).filter(Boolean);
}

export function summarizeRoundEvents(events = []) {
  return events.reduce(
    (summary, event) => {
      if (event.name === 'ActionSubmitted') summary.commits += 1;
      if (event.name === 'LockCracked') summary.locks += 1;
      if (event.name === 'ToolFound') summary.tools += 1;
      if (event.name === 'PlayerSabotaged' || event.name === 'PlayerStunned') summary.sabotages += 1;
      if (event.name === 'ActionOutcome' && !!event.args?.success) summary.successes += 1;
      if (event.name === 'GameWon') summary.winner = event.args?.winner;
      return summary;
    },
    { commits: 0, locks: 0, tools: 0, sabotages: 0, successes: 0, winner: null }
  );
}

export function getRecommendedIntent({ connected, registered, actionSubmitted, stunned, tools }) {
  const toolCount = asNumber(tools);
  if (!connected || !registered || actionSubmitted) return 'idle';
  if (stunned) return 'search';
  if (toolCount >= MAX_TOOLS) return 'pick';
  if (toolCount >= 3) return 'pick';
  if (toolCount === 0) return 'search';
  return 'pick';
}

export function getCommandAvailability({
  connected,
  registered,
  actionSubmitted,
  stunned,
  canResolve,
  isConfigured,
  pending,
  confirming,
}) {
  const blocked = !isConfigured || !connected || !registered || actionSubmitted || pending || confirming;
  return {
    pick: !blocked && !stunned,
    search: !blocked,
    sabotage: !blocked,
    resolve: !!canResolve && isConfigured && !pending && !confirming,
    help: true,
    replay: true,
    cycleTarget: !blocked,
    blockedReason: getBlockedReason({ connected, registered, actionSubmitted, stunned, isConfigured, pending, confirming }),
  };
}

function getBlockedReason({ connected, registered, actionSubmitted, stunned, isConfigured, pending, confirming }) {
  if (!isConfigured) return 'config';
  if (!connected) return 'wallet';
  if (!registered) return 'spectator';
  if (actionSubmitted) return 'submitted';
  if (pending || confirming) return 'transaction';
  if (stunned) return 'stunned';
  return null;
}

export function deriveIntegratedSession({
  gameId,
  gameState,
  currentRound,
  playerCount,
  roundStartTime,
  allSubmitted,
  timedOut,
  canResolve,
  events = [],
  latestRoundEvents = [],
  roundHistory = [],
  currentAddress,
  connected,
  registered,
  actionSubmitted,
  stunned,
  locksCracked,
  tools,
  targetAddress,
  actionIntent = 'idle',
  isConfigured = true,
  pending = false,
  confirming = false,
  nowMs = Date.now(),
  roundTimeout = ROUND_TIMEOUT,
}) {
  const safeEvents = events || [];
  const safeLatestRoundEvents = latestRoundEvents || [];
  const safeRoundHistory = roundHistory || [];
  const pressure = getPressureState(roundStartTime, nowMs, roundTimeout);
  const eventCues = buildEventCues(safeEvents, currentAddress);
  const latestCue = eventCues[eventCues.length - 1] || null;
  const latestRoundSummary = summarizeRoundEvents(safeLatestRoundEvents);
  const playerStatus = buildPlayerStatus({
    address: currentAddress,
    currentAddress,
    connected,
    registered,
    locksCracked,
    tools,
    stunned,
    actionSubmitted,
    targetAddress,
    latestCue,
  });
  const recommendedIntent = getRecommendedIntent({
    connected,
    registered,
    actionSubmitted,
    stunned,
    tools,
  });
  const commandAvailability = getCommandAvailability({
    connected,
    registered,
    actionSubmitted,
    stunned,
    canResolve,
    isConfigured,
    pending,
    confirming,
  });
  const stateNum = gameState !== undefined ? Number(gameState) : null;
  const mode =
    stateNum === GameState.COMPLETE
      ? 'complete'
      : canResolve
        ? 'resolve-ready'
        : stateNum === GameState.ACTIVE
          ? pressure.stage
          : stateNum === GameState.OPEN
            ? 'lobby'
            : 'loading';

  return {
    gameId,
    mode,
    gameState: stateNum,
    currentRound: asNumber(currentRound),
    playerCount: asNumber(playerCount),
    roundStartTime,
    allSubmitted: !!allSubmitted,
    timedOut: !!timedOut,
    canResolve: !!canResolve,
    pressure,
    playerStatus,
    actionIntent,
    targetAddress,
    recommendedIntent,
    commandAvailability,
    eventCues,
    latestCue,
    latestRoundSummary,
    roundHistorySummary: safeRoundHistory.map((entry) => ({
      round: entry.round,
      ...summarizeRoundEvents(entry.events || []),
    })),
    soundCueQueue: eventCues.map((cue) => cue.sound).filter(Boolean).slice(-8),
  };
}
