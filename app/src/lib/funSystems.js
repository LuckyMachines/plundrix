const DEFAULT_TOTAL_LOCKS = 5;

const ACTION_VALUES = Object.freeze({
  NONE: 0,
  PICK: 1,
  SEARCH: 2,
  SABOTAGE: 3,
});

export const ACTION_IDENTITIES = Object.freeze({
  idle: {
    id: 'idle',
    label: 'Wait',
    role: 'Anticipation',
    motion: 'held breath',
    promise: 'The table is alive even before a command is chosen.',
  },
  pick: {
    id: 'pick',
    label: 'Pick',
    role: 'Pressure',
    motion: 'turning tension',
    promise: 'A direct push against the vault.',
  },
  search: {
    id: 'search',
    label: 'Search',
    role: 'Preparation',
    motion: 'careful scan',
    promise: 'A quieter beat that makes the next swing stronger.',
  },
  sabotage: {
    id: 'sabotage',
    label: 'Sabotage',
    role: 'Drama',
    motion: 'hard interruption',
    promise: 'A player-to-player twist that changes the table story.',
  },
  committed: {
    id: 'committed',
    label: 'Committed',
    role: 'Locked in',
    motion: 'sealed intent',
    promise: 'The choice is made and the reveal is coming.',
  },
});

export const TABLE_MOODS = Object.freeze({
  calm: { id: 'calm', label: 'Calm table', tone: 'neutral' },
  building: { id: 'building', label: 'Building pressure', tone: 'info' },
  urgent: { id: 'urgent', label: 'Urgent round', tone: 'warn' },
  finalLock: { id: 'final-lock', label: 'Final lock', tone: 'danger' },
  chaos: { id: 'chaos', label: 'Chaos turn', tone: 'danger' },
  cooldown: { id: 'cooldown', label: 'Cooldown', tone: 'neutral' },
  victory: { id: 'victory', label: 'Vault breached', tone: 'good' },
});

export const OPERATOR_REACTIONS = Object.freeze({
  waiting: { id: 'waiting', label: 'Waiting' },
  focused: { id: 'focused', label: 'Focused' },
  armed: { id: 'armed', label: 'Armed' },
  marked: { id: 'marked', label: 'Marked' },
  stunned: { id: 'stunned', label: 'Stunned' },
  committed: { id: 'committed', label: 'In' },
  threatening: { id: 'threatening', label: 'Final lock' },
  finished: { id: 'finished', label: 'Finished' },
});

export const VAULT_REACTIONS = Object.freeze({
  listening: { id: 'listening', label: 'Listening' },
  resisting: { id: 'resisting', label: 'Resisting' },
  cracking: { id: 'cracking', label: 'Cracking' },
  angry: { id: 'angry', label: 'Angry' },
  almostOpen: { id: 'almost-open', label: 'Almost open' },
  breached: { id: 'breached', label: 'Breached' },
});

export const MOMENT_TAGS = Object.freeze({
  nearMiss: { id: 'near-miss', label: 'Near miss', weight: 2 },
  comebackSpark: { id: 'comeback-spark', label: 'Comeback spark', weight: 3 },
  shutdown: { id: 'shutdown', label: 'Shutdown', weight: 3 },
  robbery: { id: 'robbery', label: 'Robbery', weight: 4 },
  finalLock: { id: 'final-lock', label: 'Final lock', weight: 5 },
  toolSpike: { id: 'tool-spike', label: 'Tool spike', weight: 2 },
  cleanBreach: { id: 'clean-breach', label: 'Clean breach', weight: 5 },
  deadAir: { id: 'dead-air', label: 'Dead air', weight: -3 },
  commitment: { id: 'commitment', label: 'Commitment', weight: 1 },
  vaultCrack: { id: 'vault-crack', label: 'Vault crack', weight: 2 },
});

const FLAVOR_LINES = Object.freeze({
  'near-miss': [
    'The vault held, but only barely.',
    'A miss with fingerprints on it.',
    'The table felt the slip.',
  ],
  'comeback-spark': [
    'The lead started to wobble.',
    'A quiet player found a path back in.',
    'The table reopened the question.',
  ],
  shutdown: [
    'Momentum got interrupted.',
    'The table snapped back.',
    'A clean plan hit resistance.',
  ],
  robbery: [
    'Someone left with more than they brought.',
    'The table changed hands for a beat.',
    'A quiet stash became public trouble.',
  ],
  'final-lock': [
    'One lock left.',
    'The vault is listening now.',
    'Every action points at the finish.',
  ],
  'tool-spike': [
    'A pocket got heavier.',
    'The next pick just got louder.',
    'Preparation turned into pressure.',
  ],
  'clean-breach': [
    'The vault opened clean.',
    'The last lock gave way.',
    'The table has a winner.',
  ],
  'dead-air': [
    'The table waited too long.',
    'A beat went empty.',
    'The round lost a little charge.',
  ],
  commitment: [
    'Intent is sealed.',
    'The reveal is closer.',
    'Another choice joined the stack.',
  ],
  'vault-crack': [
    'The vault answered.',
    'Metal gave a little.',
    'Progress became visible.',
  ],
  default: [
    'The table shifted.',
    'A new beat landed.',
    'The vault kept score.',
  ],
});

export function hashString(input) {
  let hash = 2166136261;
  const text = String(input ?? '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return hash >>> 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function eventName(event) {
  return event?.type || event?.name || '';
}

function eventPayload(event) {
  return {
    ...(event?.args || {}),
    ...(event || {}),
  };
}

function toNumber(value, fallback = 0) {
  if (typeof value === 'bigint') return Number(value);
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function eventAction(event) {
  const payload = eventPayload(event);
  return normalizeAction(payload.action ?? event?.action);
}

function normalizeAction(action) {
  if (typeof action === 'number') {
    if (action === ACTION_VALUES.PICK) return 'pick';
    if (action === ACTION_VALUES.SEARCH) return 'search';
    if (action === ACTION_VALUES.SABOTAGE) return 'sabotage';
    return 'idle';
  }
  if (typeof action === 'bigint') return normalizeAction(Number(action));
  const text = String(action || '').toLowerCase();
  if (text.includes('pick') || text === '1') return 'pick';
  if (text.includes('search') || text === '2') return 'search';
  if (text.includes('sabotage') || text === '3') return 'sabotage';
  if (text.includes('commit')) return 'committed';
  return 'idle';
}

function getEvents(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.events)) return input.events;
  return [];
}

function getRecentEvents(input, count = 8) {
  const explicit = input?.latestRoundEvents;
  if (Array.isArray(explicit) && explicit.length) return explicit.slice(-count);
  return getEvents(input).slice(-count);
}

function totalLocksFrom(input) {
  return toNumber(input?.rules?.totalLocks ?? input?.totalLocks, DEFAULT_TOTAL_LOCKS);
}

function playersFrom(input) {
  return Array.isArray(input?.players) ? input.players : [];
}

function hasEvent(input, names) {
  const accepted = new Set(Array.isArray(names) ? names : [names]);
  return getRecentEvents(input).some((event) => accepted.has(eventName(event)));
}

export function getActionIdentity(action) {
  return ACTION_IDENTITIES[normalizeAction(action)] || ACTION_IDENTITIES.idle;
}

export function deriveTableMood(input = {}) {
  const state = typeof input.state === 'object' && input.state ? input.state : input.gameState || input;
  const gameStatus = typeof input.state === 'string' ? input.state : state.state;
  const totalLocks = totalLocksFrom(state);
  const players = playersFrom(state);
  const events = getRecentEvents(input);
  const pressureStage = input.session?.pressure?.stage || input.pressure?.stage;
  const highImpactCount = events.filter((event) =>
    ['LockCracked', 'ToolFound', 'PlayerSabotaged', 'PlayerStunned', 'GameWon'].includes(eventName(event)),
  ).length;

  if (state.winner || gameStatus === 'COMPLETE' || hasEvent(input, 'GameWon')) return TABLE_MOODS.victory;
  if (players.some((player) => toNumber(player.locksCracked) >= totalLocks - 1)) return TABLE_MOODS.finalLock;
  if (highImpactCount >= 4 || events.filter((event) => eventName(event) === 'PlayerSabotaged').length >= 2) return TABLE_MOODS.chaos;
  if (['critical', 'timeout', 'urgent'].includes(pressureStage) || input.canResolve) return TABLE_MOODS.urgent;
  if (hasEvent(input, 'RoundResolved')) return TABLE_MOODS.cooldown;
  if (toNumber(state.currentRound ?? input.currentRound, 1) > 2 || events.length > 3) return TABLE_MOODS.building;
  return TABLE_MOODS.calm;
}

export function deriveVaultReaction(input = {}) {
  const state = typeof input.state === 'object' && input.state ? input.state : input.gameState || input;
  const gameStatus = typeof input.state === 'string' ? input.state : state.state;
  const totalLocks = totalLocksFrom(state);
  const locksCracked = toNumber(input.locksCracked ?? state.locksCracked);
  const latestEvent = input.latestEvent || getRecentEvents(input, 1)[0];
  const latestName = eventName(latestEvent);
  const action = normalizeAction(input.actionIntent || input.action || latestEvent?.action);

  if (state.winner || gameStatus === 'COMPLETE' || latestName === 'GameWon') return VAULT_REACTIONS.breached;
  if (locksCracked >= totalLocks - 1) return VAULT_REACTIONS.almostOpen;
  if (latestName === 'LockCracked') return VAULT_REACTIONS.cracking;
  if (latestName === 'PlayerSabotaged' || latestName === 'PlayerStunned' || action === 'sabotage') return VAULT_REACTIONS.angry;
  if (action === 'pick') return VAULT_REACTIONS.resisting;
  return VAULT_REACTIONS.listening;
}

export function deriveOperatorReaction(input = {}) {
  const operator = input.operator || input.player || input;
  const totalLocks = totalLocksFrom(input.state || input);
  const locksCracked = toNumber(operator.locksCracked ?? operator.cracked);
  const tools = toNumber(operator.tools);
  const targeted = Boolean(input.targeted || operator.targeted);
  const stunned = Boolean(operator.stunned || input.stunned);
  const committed = Boolean(operator.actionSubmitted || operator.committed || input.actionSubmitted);

  if (locksCracked >= totalLocks) return OPERATOR_REACTIONS.finished;
  if (stunned) return OPERATOR_REACTIONS.stunned;
  if (locksCracked >= totalLocks - 1) return OPERATOR_REACTIONS.threatening;
  if (targeted) return OPERATOR_REACTIONS.marked;
  if (committed) return OPERATOR_REACTIONS.committed;
  if (tools >= 2) return OPERATOR_REACTIONS.armed;
  if (tools > 0 || locksCracked > 0) return OPERATOR_REACTIONS.focused;
  return OPERATOR_REACTIONS.waiting;
}

export function getMomentTag(event, context = {}) {
  return buildMomentTags([event], context)[0] || MOMENT_TAGS.commitment;
}

export function buildMomentTags(eventsOrState = [], context = {}) {
  const events = getEvents(eventsOrState).length ? getEvents(eventsOrState) : (Array.isArray(eventsOrState) ? eventsOrState : [eventsOrState]);
  const totalLocks = totalLocksFrom(context);
  const tags = [];

  for (const event of events.filter(Boolean)) {
    const name = eventName(event);
    const payload = eventPayload(event);
    const action = eventAction(event);
    const reason = String(payload.reason || '');
    const success = Boolean(payload.success);
    const locksCracked = toNumber(payload.totalCracked ?? payload.locksCracked);
    const tools = toNumber(payload.tools);

    if (name === 'GameWon') tags.push(MOMENT_TAGS.cleanBreach);
    if (name === 'LockCracked') tags.push(locksCracked >= totalLocks - 1 ? MOMENT_TAGS.finalLock : MOMENT_TAGS.vaultCrack);
    if (name === 'ToolFound') tags.push(tools >= 2 ? MOMENT_TAGS.toolSpike : MOMENT_TAGS.commitment);
    if (name === 'PlayerSabotaged') tags.push(MOMENT_TAGS.shutdown);
    if (name === 'PlayerSabotaged' || reason.includes('STEAL')) tags.push(MOMENT_TAGS.robbery);
    if (name === 'ActionSubmitted') tags.push(MOMENT_TAGS.commitment);
    if (name === 'ActionOutcome' && action === 'pick' && !success) tags.push(MOMENT_TAGS.nearMiss);
    if (name === 'ActionOutcome' && action === 'sabotage' && success) tags.push(MOMENT_TAGS.shutdown);
    if (name === 'ActionOutcome' && reason.includes('NO_SUBMISSION')) tags.push(MOMENT_TAGS.deadAir);
  }

  return dedupeTags(tags.length ? tags : [MOMENT_TAGS.commitment]);
}

function dedupeTags(tags) {
  const seen = new Set();
  return tags.filter((tag) => {
    if (!tag || seen.has(tag.id)) return false;
    seen.add(tag.id);
    return true;
  });
}

export function getFlavorLine(keyOrEvent, context = {}) {
  const tagId = typeof keyOrEvent === 'string'
    ? keyOrEvent
    : getMomentTag(keyOrEvent, context).id;
  const pool = FLAVOR_LINES[tagId] || FLAVOR_LINES.default;
  const seed = `${tagId}:${context.seed || ''}:${context.round || ''}:${JSON.stringify(context.extra || {})}`;
  return pool[hashString(seed) % pool.length];
}

export function buildFunTelemetry(input = {}) {
  const events = getEvents(input);
  const actionOutcomes = events.filter((event) => eventName(event) === 'ActionOutcome');
  const roundCount = input.roundHistory?.length || toNumber(input.rounds ?? input.currentRound, 0);
  const actions = {
    idle: actionOutcomes.filter((event) => eventAction(event) === 'idle').length,
    pick: actionOutcomes.filter((event) => eventAction(event) === 'pick').length,
    search: actionOutcomes.filter((event) => eventAction(event) === 'search').length,
    sabotage: actionOutcomes.filter((event) => eventAction(event) === 'sabotage').length,
  };
  const successCount = actionOutcomes.filter((event) => Boolean(eventPayload(event).success)).length;
  const failedPickCount = actionOutcomes.filter((event) => eventAction(event) === 'pick' && !eventPayload(event).success).length;
  const sabotageSuccessCount = actionOutcomes.filter((event) => eventAction(event) === 'sabotage' && eventPayload(event).success).length;
  const toolFoundCount = events.filter((event) => eventName(event) === 'ToolFound').length;
  const lockCrackCount = events.filter((event) => eventName(event) === 'LockCracked').length;
  const stunCount = events.filter((event) => ['PlayerSabotaged', 'PlayerStunned'].includes(eventName(event))).length;
  const deadAirCount = actionOutcomes.filter((event) => String(eventPayload(event).reason || '').includes('NO_SUBMISSION')).length;
  const momentTags = buildMomentTags(events, input);
  const tagCounts = momentTags.reduce((counts, tag) => {
    counts[tag.id] = (counts[tag.id] || 0) + 1;
    return counts;
  }, {});
  const actionKinds = ['pick', 'search', 'sabotage'].filter((key) => actions[key] > 0).length;

  return {
    rounds: roundCount,
    actionOutcomes: actionOutcomes.length,
    actions,
    actionKinds,
    successCount,
    failedPickCount,
    sabotageSuccessCount,
    toolFoundCount,
    lockCrackCount,
    stunCount,
    nearWinMoments: toNumber(input.nearWinMoments) || events.filter((event) => getMomentTag(event, input).id === 'final-lock').length,
    leadChanges: toNumber(input.leadChanges),
    comeback: Boolean(input.comeback),
    runaway: Boolean(input.runaway),
    deadAirCount,
    momentTags,
    tagCounts,
  };
}

export function scoreFunTelemetry(telemetry = {}) {
  const totalActions = Math.max(1, telemetry.actionOutcomes || 0);
  const actionKinds = telemetry.actionKinds || 0;
  const variety = clamp((actionKinds / 3) * 100, 0, 100);
  const agency = clamp(
    52 +
      (telemetry.successCount / totalActions) * 28 +
      Math.min(telemetry.sabotageSuccessCount, 4) * 4 +
      Math.min(telemetry.toolFoundCount, 6) * 2 -
      telemetry.deadAirCount * 8,
    0,
    100,
  );
  const drama = clamp(
    40 +
      Math.min(telemetry.stunCount, 8) * 4 +
      Math.min(telemetry.nearWinMoments, 5) * 7 +
      Math.min(telemetry.leadChanges, 6) * 3 +
      (telemetry.comeback ? 8 : 0) -
      (telemetry.runaway ? 12 : 0),
    0,
    100,
  );
  const rhythm = clamp(
    100 -
      Math.max(0, 6 - telemetry.rounds) * 7 -
      Math.max(0, telemetry.rounds - 24) * 4 -
      telemetry.deadAirCount * 6,
    0,
    100,
  );
  const readability = clamp(
    72 +
      Math.min(telemetry.lockCrackCount, 6) * 3 +
      Math.min(telemetry.toolFoundCount, 6) * 2 -
      Math.max(0, telemetry.stunCount - 8) * 3,
    0,
    100,
  );
  const score = Math.round(average([agency, drama, readability, rhythm, variety]));

  return {
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    dimensions: {
      agency: Math.round(agency),
      drama: Math.round(drama),
      readability: Math.round(readability),
      rhythm: Math.round(rhythm),
      variety: Math.round(variety),
    },
  };
}

export function buildFunProof(input = {}) {
  const telemetry = input.funTelemetry || buildFunTelemetry(input);
  const score = input.funScore || scoreFunTelemetry(telemetry);
  const tags = telemetry.momentTags || [];
  const strongestTags = [...tags]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)
    .map((tag) => tag.label);
  const gaps = [];
  if (score.dimensions.variety < 70) gaps.push('Action mix is too narrow');
  if (score.dimensions.rhythm < 70) gaps.push('Match rhythm needs a cleaner arc');
  if (score.dimensions.drama < 70) gaps.push('More player-to-player swings would help');
  if (telemetry.deadAirCount > 0) gaps.push('Dead-air turns appeared');

  return {
    telemetry,
    score,
    strongestTags,
    gaps,
    summary: `${score.grade} fun proof with ${score.score}/100 aggregate score.`,
  };
}
