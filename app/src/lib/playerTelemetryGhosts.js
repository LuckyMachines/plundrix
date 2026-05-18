import {
  SIM_ACTION,
  SIM_ACTION_LABEL,
  SIM_DEFAULT_RULES,
  buildFunCurve,
  normalizeRuleset,
  normalizeStrategyProfile,
  runSimulation,
  summarizeSimulation,
} from './plundrixEngine.js';

export const GHOST_SCHEMA_VERSION = 1;
export const GHOST_ROSTER_KEY = 'plundrix-player-telemetry-ghosts-rosters:v1';
export const GHOST_REPORT_KEY = 'plundrix-player-telemetry-ghosts-reports:v1';
export const GHOST_PINNED_KEY = 'plundrix-player-telemetry-ghosts-pinned:v1';

export const GHOST_ARCHETYPE_IDS = Object.freeze([
  'reckless-picker',
  'tool-hoarder',
  'revenge-saboteur',
  'leader-hunter',
  'comeback-hunter',
  'stall-breaker',
  'chaos-agent',
  'safe-builder',
  'opportunist',
  'closer',
]);

export const GHOST_ARCHETYPES = Object.freeze({
  'reckless-picker': archetype({
    id: 'reckless-picker',
    label: 'Reckless Picker',
    description: 'Rushes locks early and accepts failed turns as the cost of pressure.',
    primaryMotivation: 'end the vault race before the table stabilizes',
    preferredActions: ['pick'],
    simulatorStrategy: 'picker',
    riskTolerance: 92,
    aggression: 90,
    greed: 16,
    sabotageTendency: 18,
    clutchBehavior: 92,
    targetPreference: 'finish',
    earlyGameBehavior: 'opens with picks even with low tool support',
    midGameBehavior: 'keeps pressure high instead of building inventory',
    endGameBehavior: 'attempts the final lock immediately',
    funRisks: ['fast finish pressure', 'spectacular failed picks'],
    balanceRisks: ['too-fast games', 'runaway opener'],
  }),
  'tool-hoarder': archetype({
    id: 'tool-hoarder',
    label: 'Tool Hoarder',
    description: 'Builds a large tool stack and tries to cash it in after the table overreacts.',
    primaryMotivation: 'turn patience into a high-probability finish',
    preferredActions: ['search', 'pick'],
    simulatorStrategy: 'searcher',
    riskTolerance: 42,
    aggression: 32,
    greed: 92,
    sabotageTendency: 24,
    clutchBehavior: 58,
    targetPreference: 'inventory',
    earlyGameBehavior: 'searches heavily',
    midGameBehavior: 'keeps searching until the stack feels safe',
    endGameBehavior: 'spends tools in a late pick chain',
    funRisks: ['delayed payoff', 'visible greed'],
    balanceRisks: ['stall loops', 'tool economy dominance'],
  }),
  'revenge-saboteur': archetype({
    id: 'revenge-saboteur',
    label: 'Revenge Saboteur',
    description: 'Remembers who disrupted them and answers with targeted sabotage.',
    primaryMotivation: 'make enemies pay for pressure',
    preferredActions: ['sabotage', 'search'],
    simulatorStrategy: 'saboteur',
    riskTolerance: 70,
    aggression: 62,
    greed: 44,
    sabotageTendency: 88,
    clutchBehavior: 48,
    targetPreference: 'revenge',
    earlyGameBehavior: 'builds enough tools to have leverage',
    midGameBehavior: 'sabotages players who look threatening',
    endGameBehavior: 'stuns near-winners before trying to close',
    funRisks: ['revenge turns', 'table politics'],
    balanceRisks: ['sabotage fatigue', 'low-agency loops'],
  }),
  'leader-hunter': archetype({
    id: 'leader-hunter',
    label: 'Leader Hunter',
    description: 'Tracks the front-runner and tries to keep the race compressed.',
    primaryMotivation: 'prevent runaway victories',
    preferredActions: ['sabotage', 'pick'],
    simulatorStrategy: 'saboteur',
    riskTolerance: 66,
    aggression: 64,
    greed: 36,
    sabotageTendency: 78,
    clutchBehavior: 68,
    targetPreference: 'leader',
    earlyGameBehavior: 'watches for first breakaway',
    midGameBehavior: 'hits the leader repeatedly',
    endGameBehavior: 'blocks near-winners before closing',
    funRisks: ['compressed standings', 'leader drama'],
    balanceRisks: ['leader punishment too high', 'dragged endings'],
  }),
  'comeback-hunter': archetype({
    id: 'comeback-hunter',
    label: 'Comeback Hunter',
    description: 'Falls behind safely, collects tools, then swings late.',
    primaryMotivation: 'create a visible comeback arc',
    preferredActions: ['search', 'sabotage', 'pick'],
    simulatorStrategy: 'balanced',
    riskTolerance: 74,
    aggression: 58,
    greed: 68,
    sabotageTendency: 55,
    clutchBehavior: 84,
    targetPreference: 'near-winner',
    earlyGameBehavior: 'accepts being behind',
    midGameBehavior: 'searches and disrupts leaders',
    endGameBehavior: 'tries to chain final picks',
    funRisks: ['late surges', 'near-win reversals'],
    balanceRisks: ['rubber banding too strong', 'unclear early agency'],
  }),
  'stall-breaker': archetype({
    id: 'stall-breaker',
    label: 'Stall Breaker',
    description: 'Pushes picks when the table becomes too defensive.',
    primaryMotivation: 'keep the game moving',
    preferredActions: ['pick', 'sabotage'],
    simulatorStrategy: 'picker',
    riskTolerance: 76,
    aggression: 78,
    greed: 28,
    sabotageTendency: 38,
    clutchBehavior: 76,
    targetPreference: 'pace',
    earlyGameBehavior: 'plays normally',
    midGameBehavior: 'picks more if too many turns are searches or stuns',
    endGameBehavior: 'forces a resolution',
    funRisks: ['pace recovery', 'decisive turns'],
    balanceRisks: ['overcorrected fast finishes'],
  }),
  'chaos-agent': archetype({
    id: 'chaos-agent',
    label: 'Chaos Agent',
    description: 'Mixes actions unpredictably and produces strange replay beats.',
    primaryMotivation: 'make the table unstable',
    preferredActions: ['pick', 'search', 'sabotage'],
    simulatorStrategy: 'random',
    riskTolerance: 86,
    aggression: 66,
    greed: 52,
    sabotageTendency: 68,
    clutchBehavior: 52,
    targetPreference: 'random',
    earlyGameBehavior: 'changes pattern immediately',
    midGameBehavior: 'chooses disruptive swings',
    endGameBehavior: 'may help or ruin any player',
    funRisks: ['surprises', 'weird replays'],
    balanceRisks: ['confusing agency', 'random-feeling outcomes'],
  }),
  'safe-builder': archetype({
    id: 'safe-builder',
    label: 'Safe Builder',
    description: 'Balances tools and picks with low drama but readable progress.',
    primaryMotivation: 'make steady progress without overexposure',
    preferredActions: ['search', 'pick'],
    simulatorStrategy: 'balanced',
    riskTolerance: 34,
    aggression: 42,
    greed: 58,
    sabotageTendency: 18,
    clutchBehavior: 62,
    targetPreference: 'self',
    earlyGameBehavior: 'searches for one or two tools',
    midGameBehavior: 'alternates search and pick',
    endGameBehavior: 'picks only when odds are decent',
    funRisks: ['readable learning curve'],
    balanceRisks: ['low drama', 'too safe for marketing proof'],
  }),
  opportunist: archetype({
    id: 'opportunist',
    label: 'Opportunist',
    description: 'Switches plans when a target exposes tools or a leader gets close.',
    primaryMotivation: 'take the best available edge',
    preferredActions: ['pick', 'search', 'sabotage'],
    simulatorStrategy: 'balanced',
    riskTolerance: 62,
    aggression: 60,
    greed: 54,
    sabotageTendency: 58,
    clutchBehavior: 70,
    targetPreference: 'richest-or-leader',
    earlyGameBehavior: 'builds light inventory',
    midGameBehavior: 'steals or picks based on table state',
    endGameBehavior: 'targets whichever action has the best swing',
    funRisks: ['sharp pivots', 'smart steals'],
    balanceRisks: ['dominates if every action is efficient'],
  }),
  closer: archetype({
    id: 'closer',
    label: 'Closer',
    description: 'Plays compactly until the endgame, then prioritizes finishing.',
    primaryMotivation: 'win final-round races',
    preferredActions: ['pick'],
    simulatorStrategy: 'picker',
    riskTolerance: 68,
    aggression: 72,
    greed: 36,
    sabotageTendency: 30,
    clutchBehavior: 96,
    targetPreference: 'finish',
    earlyGameBehavior: 'keeps pace without overcommitting',
    midGameBehavior: 'protects final pick odds',
    endGameBehavior: 'ignores distractions and closes',
    funRisks: ['clutch endings', 'clear finish identity'],
    balanceRisks: ['late-game inevitability'],
  }),
});

export const GHOST_NAMES = Object.freeze([
  'Lockrush',
  'Greedy Wrench',
  'Pocket Saboteur',
  'Vault Vulture',
  'Panic Picker',
  'Quiet Crowbar',
  'Last-Lock Lou',
  'Fuse Runner',
  'Toolbelt Tess',
  'Latch Baron',
  'Clutch Key',
  'Tripwire Mina',
  'Hardcase Jules',
  'Prize Sniffer',
  'Bolt Saint',
  'Night Shift',
]);

export const GHOST_SCENARIOS = Object.freeze({
  'balanced-cast': {
    id: 'balanced-cast',
    label: 'Balanced cast',
    description: 'A healthy default cast with pressure, greed, disruption, and closure.',
    archetypes: ['reckless-picker', 'tool-hoarder', 'leader-hunter', 'closer'],
    simulatorScenarioId: 'new-player-table',
  },
  'sabotage-den': {
    id: 'sabotage-den',
    label: 'Sabotage den',
    description: 'Stress test for stun loops, revenge, and target fatigue.',
    archetypes: ['revenge-saboteur', 'leader-hunter', 'chaos-agent', 'comeback-hunter'],
    simulatorScenarioId: 'stall-test',
  },
  'greedy-table': {
    id: 'greedy-table',
    label: 'Greedy table',
    description: 'Tool economy stress test with several inventory builders.',
    archetypes: ['tool-hoarder', 'safe-builder', 'opportunist', 'comeback-hunter'],
    simulatorScenarioId: 'all-searchers',
  },
  'new-player-ghosts': {
    id: 'new-player-ghosts',
    label: 'New-player ghosts',
    description: 'Readable cast for onboarding and first-session comprehension.',
    archetypes: ['safe-builder', 'reckless-picker', 'opportunist', 'leader-hunter'],
    simulatorScenarioId: 'new-player-table',
  },
  'comeback-lab': {
    id: 'comeback-lab',
    label: 'Comeback lab',
    description: 'Late-swing and near-win reversal coverage.',
    archetypes: ['comeback-hunter', 'leader-hunter', 'tool-hoarder', 'closer'],
    simulatorScenarioId: 'comeback-test',
  },
  'stall-risk-lab': {
    id: 'stall-risk-lab',
    label: 'Stall-risk lab',
    description: 'Finds defensive or sabotage-heavy tables that drag too long.',
    archetypes: ['tool-hoarder', 'safe-builder', 'revenge-saboteur', 'leader-hunter'],
    simulatorScenarioId: 'stall-test',
  },
  'high-drama-cast': {
    id: 'high-drama-cast',
    label: 'High-drama cast',
    description: 'Built to produce replay-worthy swings quickly.',
    archetypes: ['reckless-picker', 'chaos-agent', 'comeback-hunter', 'closer'],
    simulatorScenarioId: 'marketing-snapshot',
  },
});

function archetype(input) {
  return Object.freeze(input);
}

function nowIso() {
  return new Date().toISOString();
}

function hashString(input) {
  let hash = 2166136261;
  const text = String(input);
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

function seededUnit(seed, salt = '') {
  return hashString(`${seed}:${salt}`) / 0xffffffff;
}

function seededPick(items, seed, salt = '') {
  return items[Math.floor(seededUnit(seed, salt) * items.length) % items.length];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function pct(value) {
  return clamp(Number(value) || 0, 0, 100);
}

function scenarioConfig(id = 'balanced-cast') {
  return GHOST_SCENARIOS[id] || GHOST_SCENARIOS['balanced-cast'];
}

export function buildGhostProfile(archetypeId = 'opportunist', options = {}) {
  const base = GHOST_ARCHETYPES[archetypeId] || GHOST_ARCHETYPES.opportunist;
  const seed = options.seed || base.id;
  const variance = Number(options.variance ?? 6);
  const profile = {
    schemaVersion: GHOST_SCHEMA_VERSION,
    id: options.id || `ghost-${hashString(`${seed}:${base.id}:${options.index || 0}`).toString(16)}`,
    name: options.name || seededPick(GHOST_NAMES, seed, `${base.id}:${options.index || 0}`),
    archetypeId: base.id,
    archetypeLabel: base.label,
    description: base.description,
    primaryMotivation: base.primaryMotivation,
    preferredActions: base.preferredActions,
    simulatorStrategy: options.simulatorStrategy || base.simulatorStrategy,
    riskTolerance: pct(options.riskTolerance ?? jitter(base.riskTolerance, seed, 'risk', variance)),
    aggression: pct(options.aggression ?? jitter(base.aggression, seed, 'aggression', variance)),
    greed: pct(options.greed ?? jitter(base.greed, seed, 'greed', variance)),
    sabotageTendency: pct(options.sabotageTendency ?? jitter(base.sabotageTendency, seed, 'sabotage', variance)),
    clutchBehavior: pct(options.clutchBehavior ?? jitter(base.clutchBehavior, seed, 'clutch', variance)),
    targetPreference: options.targetPreference || base.targetPreference,
    earlyGameBehavior: base.earlyGameBehavior,
    midGameBehavior: base.midGameBehavior,
    endGameBehavior: base.endGameBehavior,
    funRisks: base.funRisks,
    balanceRisks: base.balanceRisks,
    notes: options.notes || '',
  };
  validateGhostProfile(profile);
  return profile;
}

function jitter(value, seed, salt, variance) {
  return value + Math.round((seededUnit(seed, salt) * 2 - 1) * variance);
}

export function generateGhostRoster(seed = 'ghost-roster', count = 4, options = {}) {
  const scenario = scenarioConfig(options.scenarioId || options.scenario || 'balanced-cast');
  const requested = options.archetypes?.length ? options.archetypes : scenario.archetypes;
  const roster = Array.from({ length: clamp(Number(count || requested.length), 2, 4) }, (_, index) => {
    const archetypeId = requested[index % requested.length];
    return buildGhostProfile(archetypeId, {
      seed: `${seed}:${scenario.id}:${index}`,
      index,
      ...(options.overrides?.[index] || {}),
    });
  });
  validateGhostRoster(roster);
  return roster;
}

export function ghostToSimulatorStrategy(ghost) {
  if (ghost?.archetypeId === 'tool-hoarder') return 'tool-hoarder';
  if (ghost?.archetypeId === 'leader-hunter') return 'leader-hunter';
  return ghost?.simulatorStrategy || GHOST_ARCHETYPES[ghost?.archetypeId]?.simulatorStrategy || 'balanced';
}

export function ghostToStrategyProfile(ghost) {
  return normalizeStrategyProfile({
    aggression: ghost?.aggression ?? 55,
    searchGreed: ghost?.greed ?? 45,
    sabotageThreshold: ghost?.sabotageTendency ?? 55,
    riskTolerance: ghost?.riskTolerance ?? 55,
  });
}

function averageStrategyProfile(roster) {
  return normalizeStrategyProfile({
    aggression: average(roster.map((ghost) => ghost.aggression)),
    searchGreed: average(roster.map((ghost) => ghost.greed)),
    sabotageThreshold: average(roster.map((ghost) => ghost.sabotageTendency)),
    riskTolerance: average(roster.map((ghost) => ghost.riskTolerance)),
  });
}

export function runGhostMatch(options = {}) {
  const scenario = scenarioConfig(options.scenario || options.scenarioId || 'balanced-cast');
  const roster = options.roster || generateGhostRoster(options.seed || scenario.id, options.count || 4, {
    scenario: scenario.id,
    archetypes: options.archetypes,
  });
  const state = runSimulation({
    seed: options.seed || `ghost-match-${scenario.id}`,
    gameId: options.gameId,
    scenarioId: options.simulatorScenarioId || scenario.simulatorScenarioId,
    playerCount: roster.length,
    names: roster.map((ghost) => ghost.name),
    strategies: roster.map(ghostToSimulatorStrategy),
    strategyProfile: options.strategyProfile || averageStrategyProfile(roster),
    rules: normalizeRuleset(options.rules || SIM_DEFAULT_RULES),
    maxRounds: Number(options.maxRounds || 40),
  });
  const behavior = analyzeGhostBehavior(state, roster);
  const summary = summarizeSimulation(state);
  const match = {
    schemaVersion: GHOST_SCHEMA_VERSION,
    id: `ghost-match-${hashString(`${state.seed}:${scenario.id}`).toString(16)}`,
    generatedAt: nowIso(),
    scenario: scenario.id,
    simulatorScenarioId: state.scenarioId,
    seed: state.seed,
    roster,
    strategies: roster.map(ghostToSimulatorStrategy),
    strategyProfile: options.strategyProfile || averageStrategyProfile(roster),
    state,
    summary,
    behavior,
    matchScore: scoreGhostMatch({ matches: [{ summary, behavior }] }),
    replaySeed: state.seed,
  };
  validateGhostMatch(match);
  return match;
}

export function runGhostBatch(options = {}) {
  const budget = options.budget || 'smoke';
  const gamesByBudget = { smoke: 4, normal: 24, deep: 120 };
  const games = Number(options.games || gamesByBudget[budget] || gamesByBudget.smoke);
  const scenario = scenarioConfig(options.scenario || options.scenarioId || 'balanced-cast');
  const matches = [];
  for (let index = 0; index < games; index += 1) {
    matches.push(runGhostMatch({
      ...options,
      scenario: scenario.id,
      seed: `${options.seed || 'ghost-batch'}-${scenario.id}-${index + 1}`,
      roster: options.roster || generateGhostRoster(`${options.seed || 'ghost-batch'}-${scenario.id}`, 4, {
        scenario: scenario.id,
        archetypes: options.archetypes,
      }),
    }));
  }
  const report = buildGhostReport({ ...options, scenario: scenario.id, matches, budget, games });
  validateGhostReport(report);
  return report;
}

export function analyzeGhostBehavior(state, roster) {
  const curve = buildFunCurve(state);
  const winner = state.winner;
  return roster.map((ghost, index) => {
    const playerId = `player-${index + 1}`;
    const rounds = state.roundHistory || [];
    const actionEvents = state.events.filter((event) => event.type === 'ActionOutcome' && event.actor === playerId);
    const playerSnapshots = rounds.map((round) => round.players.find((player) => player.id === playerId)).filter(Boolean);
    const picks = actionEvents.filter((event) => event.action === SIM_ACTION.PICK);
    const searches = actionEvents.filter((event) => event.action === SIM_ACTION.SEARCH);
    const sabotages = actionEvents.filter((event) => event.action === SIM_ACTION.SABOTAGE);
    const leaderTargets = sabotages.filter((event) => wasTargetLeader(rounds, event)).length;
    const nearVictoryRounds = playerSnapshots.filter((player) => player.locksCracked >= state.rules.totalLocks - 1).length;
    const maxTools = Math.max(0, ...playerSnapshots.map((player) => player.tools));
    const finalPlayer = state.players.find((player) => player.id === playerId);
    const comebackAttempts = countComebackAttempts(rounds, playerId);
    const endgameAggression = countEndgameActions(rounds, actionEvents, state.rules.totalLocks);
    const telemetry = {
      playerId,
      playerName: ghost.name,
      ghostId: ghost.id,
      declaredArchetype: ghost.archetypeId,
      declaredLabel: ghost.archetypeLabel,
      totalActions: actionEvents.length,
      picks: picks.length,
      searches: searches.length,
      sabotages: sabotages.length,
      pickRate: ratio(picks.length, actionEvents.length),
      searchRate: ratio(searches.length, actionEvents.length),
      sabotageRate: ratio(sabotages.length, actionEvents.length),
      successfulPickRate: ratio(picks.filter((event) => event.success).length, picks.length),
      failedPickRate: ratio(picks.filter((event) => !event.success).length, picks.length),
      sabotageSuccessRate: ratio(sabotages.filter((event) => event.success).length, sabotages.length),
      leaderTargetingCount: leaderTargets,
      leaderTargetingRate: ratio(leaderTargets, sabotages.length),
      maxToolsHeld: maxTools,
      finalTools: finalPlayer?.tools || 0,
      roundsStunned: playerSnapshots.filter((player) => player.stunned).length,
      nearVictoryRounds,
      comebackAttempts,
      endgameAggression,
      won: winner === playerId,
      finalLocks: finalPlayer?.locksCracked || 0,
      averageTensionWhileActing: average(curve.map((point) => point.tension)),
      causedStuns: state.events.filter((event) => event.type === 'PlayerSabotaged' && event.actor === playerId).length,
      actionLabels: actionEvents.map((event) => SIM_ACTION_LABEL[event.action] || 'None'),
    };
    const inferred = inferGhostArchetype(telemetry);
    return {
      ...telemetry,
      inferredArchetype: inferred.id,
      inferredLabel: inferred.label,
      stayedInCharacterScore: scoreCharacterFit(ghost, telemetry, inferred.id),
      funContribution: scoreFunContribution(telemetry, state, ghost),
      frustrationRisk: scoreFrustrationRisk(telemetry, state),
      personalityMoments: buildPersonalityMoments(ghost, telemetry),
    };
  });
}

function ratio(value, total) {
  return total ? value / total : 0;
}

function wasTargetLeader(rounds, event) {
  const round = rounds.find((item) => item.round === event.round);
  if (!round || !event.target) return false;
  const sorted = [...round.beforePlayers].sort((a, b) => b.locksCracked - a.locksCracked || b.tools - a.tools);
  return sorted[0]?.id === event.target;
}

function countComebackAttempts(rounds, playerId) {
  let count = 0;
  for (const round of rounds) {
    const player = round.beforePlayers.find((item) => item.id === playerId);
    if (!player) continue;
    const leaderLocks = Math.max(...round.beforePlayers.map((item) => item.locksCracked));
    const after = round.players.find((item) => item.id === playerId);
    if (leaderLocks - player.locksCracked >= 2 && after?.locksCracked > player.locksCracked) {
      count += 1;
    }
  }
  return count;
}

function countEndgameActions(rounds, actionEvents, totalLocks) {
  const endgameRounds = new Set(rounds
    .filter((round) => round.beforePlayers.some((player) => player.locksCracked >= totalLocks - 1))
    .map((round) => round.round));
  return actionEvents.filter((event) => endgameRounds.has(event.round) && event.action === SIM_ACTION.PICK).length;
}

export function inferGhostArchetype(telemetry) {
  if (telemetry.pickRate >= 0.72 && telemetry.searchRate < 0.25) return GHOST_ARCHETYPES['reckless-picker'];
  if (telemetry.searchRate >= 0.54 && telemetry.maxToolsHeld >= 3) return GHOST_ARCHETYPES['tool-hoarder'];
  if (telemetry.sabotageRate >= 0.44 && telemetry.leaderTargetingRate >= 0.45) return GHOST_ARCHETYPES['leader-hunter'];
  if (telemetry.sabotageRate >= 0.44) return GHOST_ARCHETYPES['revenge-saboteur'];
  if (telemetry.comebackAttempts >= 1 && telemetry.endgameAggression >= 1) return GHOST_ARCHETYPES['comeback-hunter'];
  if (telemetry.endgameAggression >= 2 && telemetry.pickRate >= 0.5) return GHOST_ARCHETYPES.closer;
  if (telemetry.pickRate > 0.25 && telemetry.searchRate > 0.25 && telemetry.sabotageRate > 0.2) return GHOST_ARCHETYPES['chaos-agent'];
  if (telemetry.searchRate >= 0.35 && telemetry.sabotageRate < 0.18) return GHOST_ARCHETYPES['safe-builder'];
  if (telemetry.pickRate >= 0.45 && telemetry.sabotageRate < 0.28) return GHOST_ARCHETYPES['stall-breaker'];
  return GHOST_ARCHETYPES.opportunist;
}

function scoreCharacterFit(ghost, telemetry, inferredId) {
  let score = inferredId === ghost.archetypeId ? 68 : 38;
  if (ghost.archetypeId === 'tool-hoarder') {
    score = Math.max(
      score,
      48 + telemetry.searchRate * 18 + Math.min(4, telemetry.maxToolsHeld) * 6 + telemetry.pickRate * 10,
    );
  }
  if (ghost.archetypeId === 'leader-hunter') {
    score = Math.max(
      score,
      48 + telemetry.leaderTargetingRate * 18 + Math.min(4, telemetry.leaderTargetingCount) * 6 + telemetry.pickRate * 8,
    );
  }
  if (ghost.archetypeId === 'closer') {
    score = Math.max(
      score,
      48 + telemetry.pickRate * 16 + Math.min(3, telemetry.nearVictoryRounds) * 6 + Math.min(4, telemetry.endgameAggression) * 5,
    );
  }
  if (ghost.preferredActions.includes('pick')) score += telemetry.pickRate * 12;
  if (ghost.preferredActions.includes('search')) score += telemetry.searchRate * 12;
  if (ghost.preferredActions.includes('sabotage')) score += telemetry.sabotageRate * 12;
  if (ghost.targetPreference === 'leader') score += telemetry.leaderTargetingRate * 8;
  if (ghost.targetPreference === 'finish') score += Math.min(10, telemetry.endgameAggression * 5);
  if (ghost.targetPreference === 'inventory') score += Math.min(10, telemetry.maxToolsHeld * 2);
  return Math.round(clamp(score, 0, 100));
}

function scoreFunContribution(telemetry, state, ghost = null) {
  const summary = summarizeSimulation(state);
  const archetypeBonus =
    ghost?.archetypeId === 'tool-hoarder'
      ? Math.min(18, telemetry.maxToolsHeld * 4 + telemetry.successfulPickRate * 6)
      : ghost?.archetypeId === 'leader-hunter'
        ? Math.min(18, telemetry.leaderTargetingCount * 7 + telemetry.comebackAttempts * 4)
        : ghost?.archetypeId === 'closer'
          ? Math.min(18, telemetry.nearVictoryRounds * 4 + telemetry.endgameAggression * 3)
          : 0;
  const score =
    telemetry.nearVictoryRounds * 8 +
    telemetry.comebackAttempts * 16 +
    telemetry.causedStuns * 7 +
    telemetry.leaderTargetingCount * 5 +
    telemetry.endgameAggression * 8 +
    telemetry.successfulPickRate * 10 +
    (telemetry.won ? 10 : 0) +
    summary.leadChanges * 2 +
    summary.averageTension * 0.18 +
    archetypeBonus;
  return Math.round(clamp(score, 0, 100));
}

function scoreFrustrationRisk(telemetry, state) {
  const summary = summarizeSimulation(state);
  const score =
    telemetry.sabotageRate * 38 +
    telemetry.failedPickRate * 12 +
    telemetry.roundsStunned * 5 +
    (summary.rounds > state.rules.maxHealthyRounds ? 18 : 0) +
    (summary.runaway && telemetry.won ? 18 : 0) +
    (telemetry.totalActions > 0 && telemetry.funContribution < 30 ? 8 : 0);
  return Math.round(clamp(score, 0, 100));
}

function buildPersonalityMoments(ghost, telemetry) {
  const moments = [];
  if (telemetry.maxToolsHeld >= 3) moments.push(`${ghost.name} hoarded ${telemetry.maxToolsHeld} tools.`);
  if (telemetry.leaderTargetingCount) moments.push(`${ghost.name} targeted the leader ${telemetry.leaderTargetingCount} times.`);
  if (telemetry.comebackAttempts) moments.push(`${ghost.name} made ${telemetry.comebackAttempts} comeback push.`);
  if (telemetry.endgameAggression) moments.push(`${ghost.name} pushed picks during the endgame.`);
  if (!moments.length) moments.push(`${ghost.name} stayed close to a ${ghost.archetypeLabel.toLowerCase()} pattern.`);
  return moments;
}

export function scoreGhostMatch(reportLike) {
  const matches = reportLike.matches || [];
  const behaviors = matches.flatMap((match) => match.behavior || []);
  const summaries = matches.map((match) => match.summary).filter(Boolean);
  const fun = average(behaviors.map((item) => item.funContribution));
  const frustration = average(behaviors.map((item) => item.frustrationRisk));
  const character = average(behaviors.map((item) => item.stayedInCharacterScore));
  const tension = average(summaries.map((summary) => summary.averageTension));
  const completion = ratio(summaries.filter((summary) => summary.completed).length, summaries.length);
  const score = Math.round(clamp(fun * 0.34 + character * 0.24 + tension * 0.22 + completion * 100 * 0.12 - frustration * 0.18, 0, 100));
  return {
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    funContribution: Math.round(fun),
    frustrationRisk: Math.round(frustration),
    stayedInCharacter: Math.round(character),
    averageTension: Math.round(tension),
    completionRate: completion,
  };
}

function buildGhostReport(options) {
  const matches = options.matches || [];
  const behaviors = matches.flatMap((match) => match.behavior);
  const archetypes = summarizeArchetypes(matches);
  const matchups = buildMatchupMatrix(matches);
  const score = scoreGhostMatch({ matches });
  const fairness = summarizeGhostFairness(matches, archetypes);
  const risks = buildGhostRisks(archetypes, score);
  const recommendations = buildGhostRecommendations(archetypes, risks, score);
  const report = {
    schemaVersion: GHOST_SCHEMA_VERSION,
    id: `ghost-report-${hashString(`${options.scenario}:${options.seed || 'seed'}:${matches.length}`).toString(16)}`,
    generatedAt: nowIso(),
    scenario: options.scenario,
    budget: options.budget || 'smoke',
    games: matches.length,
    seed: options.seed || 'ghost-report',
    score,
    roster: matches[0]?.roster || [],
    matches: matches.map((match) => ({
      id: match.id,
      seed: match.seed,
      rules: match.state?.rules || SIM_DEFAULT_RULES,
      summary: match.summary,
      behavior: match.behavior,
    })),
    archetypes,
    fairness,
    matchups,
    bestStory: chooseBestStory(matches),
    healthiestArchetype: [...archetypes].sort((a, b) => b.healthScore - a.healthScore)[0] || null,
    riskiestArchetype: [...archetypes].sort((a, b) => b.frustrationRisk - a.frustrationRisk)[0] || null,
    mostDramaticArchetype: [...archetypes].sort((a, b) => b.funContribution - a.funContribution)[0] || null,
    risks,
    recommendations,
    exports: {},
  };
  report.exports = {
    markdown: exportGhostReportMarkdown(report),
    json: exportGhostReportJson(report),
    csv: exportGhostReportCsv(report),
    rosterJson: exportGhostRosterJson(report.roster),
  };
  return report;
}

export function buildGhostFairnessReport(report) {
  const fairness = report.fairness || summarizeGhostFairness(report.matches || [], report.archetypes || []);
  return {
    generatedAt: report.generatedAt || nowIso(),
    scenario: report.scenario,
    budget: report.budget,
    games: report.games || report.matches?.length || 0,
    overallScore: fairness.overallScore,
    grade: fairness.grade,
    verdict: fairness.verdict,
    weakestArchetype: fairness.weakestArchetype,
    strongestArchetype: fairness.strongestArchetype,
    rows: fairness.rows,
    risks: fairness.rows
      .filter((row) => row.verdict !== 'pass')
      .map((row) => ({
        archetypeId: row.archetypeId,
        label: row.label,
        verdict: row.verdict,
        blockers: row.blockers,
        recommendation: row.recommendation,
      })),
  };
}

export function buildFocusedGhostValidation(reports, archetypeId = 'tool-hoarder') {
  const normalizedReports = Array.isArray(reports) ? reports.filter(Boolean) : [reports].filter(Boolean);
  const archetype = GHOST_ARCHETYPES[archetypeId] || GHOST_ARCHETYPES['tool-hoarder'];
  const rows = normalizedReports.map((report) => {
    const archetypeRow = (report.archetypes || []).find((item) => item.archetypeId === archetype.id);
    const fairnessRow = (report.fairness?.rows || []).find((item) => item.archetypeId === archetype.id);
    return {
      reportId: report.id,
      scenario: report.scenario,
      budget: report.budget,
      games: report.games,
      healthScore: archetypeRow?.healthScore ?? 0,
      winRate: archetypeRow?.winRate ?? 0,
      funContribution: archetypeRow?.funContribution ?? 0,
      frustrationRisk: archetypeRow?.frustrationRisk ?? 0,
      stayedInCharacter: archetypeRow?.stayedInCharacter ?? 0,
      fairnessScore: fairnessRow?.fairnessScore ?? 0,
      fairnessVerdict: fairnessRow?.verdict || 'missing',
      winViability: fairnessRow?.winViability ?? 0,
      agency: fairnessRow?.agency ?? 0,
      toolWasteRisk: fairnessRow?.toolWasteRisk ?? 0,
      counterplay: fairnessRow?.counterplay ?? 0,
      recommendation: fairnessRow?.recommendation || `${archetype.label} was not present in this report.`,
    };
  });
  const score = Math.round(average(rows.map((row) => (
    row.healthScore * 0.28 +
    row.fairnessScore * 0.28 +
    row.winViability * 0.16 +
    row.agency * 0.14 +
    (100 - row.frustrationRisk) * 0.08 +
    (100 - row.toolWasteRisk) * 0.06
  ))));
  const blockers = [];
  if (rows.some((row) => row.healthScore < 70)) blockers.push(`${archetype.label} health below 70 in at least one scenario.`);
  if (rows.some((row) => row.fairnessScore < 70)) blockers.push(`${archetype.label} fairness below 70 in at least one scenario.`);
  if (rows.some((row) => row.winViability < 52)) blockers.push(`${archetype.label} win viability is weak in at least one scenario.`);
  if (rows.some((row) => row.toolWasteRisk > 58)) blockers.push(`${archetype.label} wastes tools too often in at least one scenario.`);
  if (!rows.length) blockers.push(`${archetype.label} has no validation reports.`);
  return {
    generatedAt: nowIso(),
    archetypeId: archetype.id,
    label: archetype.label,
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    verdict: blockers.length ? 'hold' : 'pass',
    blockers,
    rows,
  };
}

export function exportFocusedGhostValidationMarkdown(validation) {
  return [
    `# ${validation.label} Focused Validation`,
    '',
    `Generated: ${validation.generatedAt}`,
    `Score: ${validation.score}/100 (${validation.grade})`,
    `Verdict: ${validation.verdict}`,
    '',
    '## Scenario Matrix',
    '',
    '| Scenario | Budget | Games | Health | Fairness | Win Rate | Win Viability | Agency | Tool Waste | Counterplay | Verdict |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
    ...validation.rows.map((row) => `| ${row.scenario} | ${row.budget} | ${row.games} | ${row.healthScore} | ${row.fairnessScore} | ${(row.winRate * 100).toFixed(1)}% | ${row.winViability} | ${row.agency} | ${row.toolWasteRisk} | ${row.counterplay} | ${row.fairnessVerdict} |`),
    '',
    '## Blockers',
    '',
    ...(validation.blockers.length ? validation.blockers.map((item) => `- ${item}`) : ['- No focused validation blockers.']),
    '',
    '## Recommendations',
    '',
    ...validation.rows.map((row) => `- ${row.scenario}: ${row.recommendation}`),
    '',
  ].join('\n');
}

function summarizeGhostFairness(matches, archetypes) {
  const behaviors = matches.flatMap((match) => match.behavior || []);
  const byArchetype = new Map();
  for (const item of behaviors) {
    if (!byArchetype.has(item.declaredArchetype)) byArchetype.set(item.declaredArchetype, []);
    byArchetype.get(item.declaredArchetype).push(item);
  }
  const archetypeById = new Map((archetypes || []).map((item) => [item.archetypeId, item]));
  const rows = [...byArchetype.entries()].map(([archetypeId, items]) => {
    const archetype = archetypeById.get(archetypeId) || summarizeFallbackArchetype(archetypeId, items);
    const winViability = scoreWinViability(archetype.winRate, items.length);
    const agency = scoreAgency(items);
    const stunExposure = average(items.map((item) => item.roundsStunned));
    const sabotageUse = average(items.map((item) => item.sabotageRate));
    const toolWaste = average(items.map((item) => item.finalTools));
    const toolWasteRisk = scoreToolWasteRisk(archetypeId, items, toolWaste);
    const stunRisk = clamp(stunExposure * 12, 0, 100);
    const sabotageFatigueRisk = clamp(Math.max(0, sabotageUse - 0.36) * 190, 0, 100);
    const frustration = archetype.frustrationRisk;
    const counterplay = Math.round(clamp(100 - frustration * 0.46 - stunRisk * 0.28 - sabotageFatigueRisk * 0.18 - toolWasteRisk * 0.08, 0, 100));
    const fairnessScore = Math.round(clamp(
      winViability * 0.24 +
      agency * 0.26 +
      (100 - frustration) * 0.18 +
      (100 - stunRisk) * 0.12 +
      (100 - sabotageFatigueRisk) * 0.1 +
      (100 - toolWasteRisk) * 0.1,
      0,
      100,
    ));
    const blockers = [];
    if (winViability < 52) blockers.push('win viability');
    if (agency < 55) blockers.push('agency');
    if (frustration > 62) blockers.push('frustration');
    if (stunRisk > 60) blockers.push('stun exposure');
    if (sabotageFatigueRisk > 55) blockers.push('sabotage fatigue');
    if (toolWasteRisk > 58) blockers.push('tool waste');
    return {
      archetypeId,
      label: archetype.label,
      appearances: items.length,
      fairnessScore,
      verdict: blockers.length ? (fairnessScore >= 68 ? 'watch' : 'hold') : 'pass',
      blockers,
      winViability,
      winRate: archetype.winRate,
      agency,
      frustration,
      stunExposure: Number(stunExposure.toFixed(2)),
      stunRisk: Math.round(stunRisk),
      sabotageUse: Number(sabotageUse.toFixed(3)),
      sabotageFatigueRisk: Math.round(sabotageFatigueRisk),
      toolWaste: Number(toolWaste.toFixed(2)),
      toolWasteRisk: Math.round(toolWasteRisk),
      counterplay,
      recommendation: recommendFairnessAction(archetype, {
        winViability,
        agency,
        frustration,
        stunRisk,
        sabotageFatigueRisk,
        toolWasteRisk,
      }),
    };
  }).sort((a, b) => a.fairnessScore - b.fairnessScore);
  const overallScore = Math.round(average(rows.map((row) => row.fairnessScore)));
  return {
    overallScore,
    grade: overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' : overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F',
    verdict: rows.some((row) => row.verdict === 'hold') ? 'hold' : rows.some((row) => row.verdict === 'watch') ? 'watch' : 'pass',
    weakestArchetype: rows[0] || null,
    strongestArchetype: [...rows].sort((a, b) => b.fairnessScore - a.fairnessScore)[0] || null,
    rows,
  };
}

function summarizeFallbackArchetype(archetypeId, items) {
  const archetype = GHOST_ARCHETYPES[archetypeId] || GHOST_ARCHETYPES.opportunist;
  return {
    archetypeId,
    label: archetype.label,
    winRate: ratio(items.filter((item) => item.won).length, items.length),
    frustrationRisk: Math.round(average(items.map((item) => item.frustrationRisk))),
  };
}

function scoreWinViability(winRate, appearances) {
  const target = 0.25;
  const sampleConfidence = clamp(appearances / 8, 0.35, 1);
  const distancePenalty = Math.abs(winRate - target) * 180 * sampleConfidence;
  const deadZonePenalty = appearances >= 4 && winRate === 0 ? 18 : 0;
  const dominancePenalty = winRate > 0.58 ? 22 : 0;
  return Math.round(clamp(100 - distancePenalty - deadZonePenalty - dominancePenalty, 0, 100));
}

function scoreAgency(items) {
  const actionPresence = clamp(average(items.map((item) => Math.min(1, item.totalActions / 6))) * 100, 0, 100);
  const progress = average(items.map((item) => Math.min(1, item.finalLocks / 3))) * 100;
  const meaningfulTurns = average(items.map((item) => (
    item.successfulPickRate * 35 +
    Math.min(1, item.causedStuns / 2) * 25 +
    Math.min(1, item.comebackAttempts) * 20 +
    Math.min(1, item.endgameAggression / 2) * 20
  )));
  const stunDrag = average(items.map((item) => item.roundsStunned)) * 5;
  return Math.round(clamp(actionPresence * 0.3 + progress * 0.32 + meaningfulTurns * 0.38 - stunDrag, 0, 100));
}

function scoreToolWasteRisk(archetypeId, items, toolWaste) {
  const searchRate = average(items.map((item) => item.searchRate));
  const pickRate = average(items.map((item) => item.pickRate));
  const hoarderMultiplier = archetypeId === 'tool-hoarder' ? 0.8 : 1;
  return clamp((toolWaste * 15 + Math.max(0, searchRate - pickRate - 0.18) * 80) * hoarderMultiplier, 0, 100);
}

function recommendFairnessAction(archetype, metrics) {
  if (metrics.winViability < 52) return `${archetype.label} needs a clearer route to win without becoming dominant.`;
  if (metrics.agency < 55) return `${archetype.label} needs more meaningful actions before promotion.`;
  if (metrics.frustration > 62) return `${archetype.label} needs lower frustration or stronger counterplay.`;
  if (metrics.stunRisk > 60) return `${archetype.label} spends too much time stunned and needs protection from low-agency loops.`;
  if (metrics.sabotageFatigueRisk > 55) return `${archetype.label} leans too hard on sabotage and needs a more varied path.`;
  if (metrics.toolWasteRisk > 58) return `${archetype.label} is carrying unused tools too often; rebalance search payoff or pick timing.`;
  return `${archetype.label} is fair enough for this budget; keep monitoring with normal-budget ghosts.`;
}

function summarizeArchetypes(matches) {
  const byArchetype = new Map();
  for (const match of matches) {
    for (const item of match.behavior || []) {
      const key = item.declaredArchetype;
      if (!byArchetype.has(key)) byArchetype.set(key, []);
      byArchetype.get(key).push(item);
    }
  }
  return [...byArchetype.entries()].map(([archetypeId, items]) => {
    const archetype = GHOST_ARCHETYPES[archetypeId] || GHOST_ARCHETYPES.opportunist;
    const winRate = ratio(items.filter((item) => item.won).length, items.length);
    const funContribution = average(items.map((item) => item.funContribution));
    const frustrationRisk = average(items.map((item) => item.frustrationRisk));
    const stayedInCharacter = average(items.map((item) => item.stayedInCharacterScore));
    const healthScore = Math.round(clamp(funContribution * 0.38 + stayedInCharacter * 0.32 + (100 - frustrationRisk) * 0.3, 0, 100));
    return {
      archetypeId,
      label: archetype.label,
      appearances: items.length,
      winRate,
      funContribution: Math.round(funContribution),
      frustrationRisk: Math.round(frustrationRisk),
      stayedInCharacter: Math.round(stayedInCharacter),
      healthScore,
      averagePickRate: average(items.map((item) => item.pickRate)),
      averageSearchRate: average(items.map((item) => item.searchRate)),
      averageSabotageRate: average(items.map((item) => item.sabotageRate)),
      balanceRisks: archetype.balanceRisks,
      bestMatchup: null,
      worstMatchup: null,
    };
  }).sort((a, b) => b.healthScore - a.healthScore);
}

function buildMatchupMatrix(matches) {
  const rows = [];
  for (const match of matches) {
    const labels = match.roster.map((ghost) => ghost.archetypeId);
    const signature = labels.join(' vs ');
    rows.push({
      matchId: match.id,
      signature,
      seed: match.seed,
      winnerArchetype: match.behavior.find((item) => item.won)?.declaredArchetype || 'none',
      dramaScore: Math.round(average(match.behavior.map((item) => item.funContribution))),
      stallRisk: match.summary.rounds > SIM_DEFAULT_RULES.maxHealthyRounds ? 100 : Math.round(match.summary.rounds / SIM_DEFAULT_RULES.maxHealthyRounds * 100),
      frustrationRisk: Math.round(average(match.behavior.map((item) => item.frustrationRisk))),
      rounds: match.summary.rounds,
    });
  }
  return rows;
}

function chooseBestStory(matches) {
  const sorted = [...matches].sort((a, b) => {
    const aScore = average(a.behavior.map((item) => item.funContribution)) + a.summary.averageTension + a.summary.leadChanges * 8;
    const bScore = average(b.behavior.map((item) => item.funContribution)) + b.summary.averageTension + b.summary.leadChanges * 8;
    return bScore - aScore;
  });
  const match = sorted[0];
  if (!match) return null;
  const best = [...match.behavior].sort((a, b) => b.funContribution - a.funContribution)[0];
  return {
    matchId: match.id,
    seed: match.seed,
    playerName: best?.playerName || 'Unknown ghost',
    archetype: best?.declaredLabel || 'Unknown',
    headline: `${best?.playerName || 'A ghost'} made the ${best?.declaredLabel || 'ghost'} story visible.`,
    proof: best?.personalityMoments || [],
    replayConfig: `/replay/ghost-${match.id}?seed=${encodeURIComponent(match.seed)}&scenario=${encodeURIComponent(match.simulatorScenarioId)}`,
  };
}

function buildGhostRisks(archetypes, score) {
  const risks = [];
  for (const item of archetypes) {
    if (item.winRate > 0.58) {
      risks.push(risk('archetype-dominance', 'orange', item, `${item.label} wins too often.`));
    }
    if (item.winRate < 0.08 && item.appearances >= 3) {
      risks.push(risk('archetype-dead-zone', 'yellow', item, `${item.label} rarely wins.`));
    }
    if (item.frustrationRisk > 62) {
      risks.push(risk('frustration-risk', 'orange', item, `${item.label} creates high frustration risk.`));
    }
    if (item.averageSabotageRate > 0.48) {
      risks.push(risk('sabotage-fatigue', 'yellow', item, `${item.label} leans heavily on sabotage.`));
    }
  }
  if (score.score < 60) {
    risks.push({
      id: 'ghost-overall-health',
      severity: 'red',
      category: 'ghosts',
      title: 'Ghost cast health is below target',
      evidence: [`Score ${score.score}/100`],
      impact: 'Player archetypes may not create consistently readable fun.',
      mitigation: 'Run a normal ghost batch and tune rules against archetype health.',
    });
  }
  return risks;
}

function risk(id, severity, archetype, title) {
  return {
    id: `${id}-${archetype.archetypeId}`,
    severity,
    category: 'ghosts',
    archetypeId: archetype.archetypeId,
    title,
    evidence: [
      `Win rate ${(archetype.winRate * 100).toFixed(1)}%`,
      `Fun ${archetype.funContribution}`,
      `Frustration ${archetype.frustrationRisk}`,
    ],
    impact: archetype.balanceRisks.join(', '),
    mitigation: `Review ${archetype.label} matchups and run Balance Autopilot with ghost scenarios.`,
  };
}

function buildGhostRecommendations(archetypes, risks, score) {
  const recommendations = [];
  if (score.frustrationRisk > 50) {
    recommendations.push(rec('reduce-frustration', 'balance', 'Reduce high-frustration archetype loops', 'Compare sabotage-heavy and stall-risk ghost scenarios before promoting the rules.'));
  }
  const weak = archetypes.find((item) => item.winRate < 0.08 && item.appearances >= 3);
  if (weak) {
    recommendations.push(rec('rescue-weak-archetype', 'balance', `Rescue ${weak.label}`, `${weak.label} needs a viable path to affect the vault race.`));
  }
  const dramatic = [...archetypes].sort((a, b) => b.funContribution - a.funContribution)[0];
  if (dramatic) {
    recommendations.push(rec('promote-dramatic-ghost', 'replay', `Promote ${dramatic.label} replay proof`, `${dramatic.label} currently creates the clearest story moments.`));
  }
  if (risks.some((item) => item.id.includes('archetype-dominance'))) {
    recommendations.push(rec('dominance-check', 'balance', 'Check archetype dominance before launch', 'No ghost should become the single correct way to play.'));
  }
  if (!recommendations.length) {
    recommendations.push(rec('keep-ghost-smoke', 'ops', 'Keep ghost smoke in the launch loop', 'The cast is healthy under the current smoke budget.'));
  }
  return recommendations.map((item, index) => ({ ...item, rank: index + 1 }));
}

function rec(id, category, title, rationale) {
  return {
    id: `ghost-rec-${id}`,
    category,
    title,
    rationale,
    command: category === 'balance'
      ? 'npm run ghosts:run -- --budget normal --markdown'
      : 'npm run ghosts:run -- --budget smoke --markdown',
  };
}

export function buildGhostBalanceScore(report) {
  const dominancePenalty = report.archetypes.filter((item) => item.winRate > 0.58).length * 18;
  const deadZonePenalty = report.archetypes.filter((item) => item.winRate < 0.08 && item.appearances >= 3).length * 12;
  const frustrationPenalty = Math.max(0, report.score.frustrationRisk - 45) * 0.45;
  return {
    score: Math.round(clamp(report.score.score - dominancePenalty - deadZonePenalty - frustrationPenalty, 0, 100)),
    dominancePenalty,
    deadZonePenalty,
    frustrationPenalty: Math.round(frustrationPenalty),
    archetypeViability: report.archetypes.map((item) => ({
      archetypeId: item.archetypeId,
      label: item.label,
      viable: item.healthScore >= 55 && item.winRate <= 0.58,
      healthScore: item.healthScore,
      winRate: item.winRate,
      frustrationRisk: item.frustrationRisk,
    })),
  };
}

export function buildGhostReplayMetadata(match) {
  const behavior = match.behavior || [];
  return {
    ghostRoster: match.roster,
    archetypes: behavior.map((item) => ({
      playerId: item.playerId,
      name: item.playerName,
      declaredArchetype: item.declaredArchetype,
      inferredArchetype: item.inferredArchetype,
      funContribution: item.funContribution,
      frustrationRisk: item.frustrationRisk,
      stayedInCharacterScore: item.stayedInCharacterScore,
    })),
    personalityMoments: behavior.flatMap((item) => item.personalityMoments.map((moment) => ({
      playerId: item.playerId,
      archetype: item.declaredArchetype,
      text: moment,
    }))).slice(0, 10),
  };
}

export function buildGhostHighlights(match) {
  return (match.behavior || [])
    .flatMap((item) => item.personalityMoments.map((text, index) => ({
      id: `ghost-${item.playerId}-${index}`,
      type: ghostHighlightType(item),
      category: 'ghost',
      round: Math.max(1, index + 1),
      replayLabel: item.declaredLabel,
      socialLabel: item.declaredLabel,
      text,
      importance: clamp(item.funContribution + item.stayedInCharacterScore * 0.2 - item.frustrationRisk * 0.15, 20, 100),
      ghost: {
        playerId: item.playerId,
        archetype: item.declaredArchetype,
        inferredArchetype: item.inferredArchetype,
      },
    })))
    .sort((a, b) => b.importance - a.importance);
}

function ghostHighlightType(item) {
  if (item.declaredArchetype === item.inferredArchetype && item.stayedInCharacterScore >= 80) return 'ghost-stays-in-character';
  if (item.declaredArchetype !== item.inferredArchetype) return 'ghost-breaks-character';
  if (item.declaredArchetype === 'revenge-saboteur') return 'revenge-sabotage';
  if (item.declaredArchetype === 'tool-hoarder') return 'greedy-hoard';
  if (item.declaredArchetype === 'comeback-hunter') return 'comeback-hunt';
  if (item.declaredArchetype === 'stall-breaker') return 'stall-break';
  if (item.declaredArchetype === 'reckless-picker') return 'reckless-finish';
  return 'ghost-personality';
}

export function exportGhostReportMarkdown(report) {
  return [
    '# Plundrix Player Telemetry Ghosts',
    '',
    `Generated: ${report.generatedAt}`,
    `Scenario: ${report.scenario}`,
    `Budget: ${report.budget}`,
    `Games: ${report.games}`,
    `Score: ${report.score.score}/100 (${report.score.grade})`,
    '',
    '## Cast Health',
    '',
    '| Archetype | Health | Win Rate | Fun | Frustration | Character |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...report.archetypes.map((item) => `| ${item.label} | ${item.healthScore} | ${(item.winRate * 100).toFixed(1)}% | ${item.funContribution} | ${item.frustrationRisk} | ${item.stayedInCharacter} |`),
    '',
    '## Archetype Fairness',
    '',
    `Overall: ${report.fairness?.overallScore ?? 'n/a'}/100 (${report.fairness?.grade ?? 'n/a'}) - ${report.fairness?.verdict ?? 'unknown'}`,
    '',
    '| Archetype | Fairness | Verdict | Win Viability | Agency | Frustration | Stun Risk | Sabotage Risk | Tool Waste | Counterplay |',
    '| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...(report.fairness?.rows || []).map((item) => `| ${item.label} | ${item.fairnessScore} | ${item.verdict} | ${item.winViability} | ${item.agency} | ${item.frustration} | ${item.stunRisk} | ${item.sabotageFatigueRisk} | ${item.toolWasteRisk} | ${item.counterplay} |`),
    '',
    '## Best Story',
    '',
    report.bestStory ? `${report.bestStory.headline} Seed: ${report.bestStory.seed}` : 'No story selected.',
    ...(report.bestStory?.proof || []).map((item) => `- ${item}`),
    '',
    '## Risks',
    '',
    ...(report.risks.length ? report.risks.map((item) => `- ${item.severity.toUpperCase()} ${item.title}: ${item.mitigation}`) : ['- No ghost risks detected.']),
    '',
    '## Recommendations',
    '',
    ...report.recommendations.map((item) => `${item.rank}. ${item.title} - ${item.rationale}`),
    '',
    '## Matchups',
    '',
    ...report.matchups.slice(0, 8).map((item) => `- ${item.signature}: drama ${item.dramaScore}, frustration ${item.frustrationRisk}, rounds ${item.rounds}`),
    '',
  ].join('\n');
}

export function exportGhostReportJson(report) {
  return JSON.stringify(report, null, 2);
}

export function exportGhostReportCsv(report) {
  const fairnessById = new Map((report.fairness?.rows || []).map((item) => [item.archetypeId, item]));
  const rows = [
    ['archetype', 'healthScore', 'fairnessScore', 'fairnessVerdict', 'winRate', 'winViability', 'agency', 'funContribution', 'frustrationRisk', 'stayedInCharacter', 'stunRisk', 'sabotageFatigueRisk', 'toolWasteRisk', 'counterplay', 'pickRate', 'searchRate', 'sabotageRate'],
    ...report.archetypes.map((item) => {
      const fairness = fairnessById.get(item.archetypeId) || {};
      return [
        item.label,
        item.healthScore,
        fairness.fairnessScore ?? '',
        fairness.verdict ?? '',
        item.winRate.toFixed(4),
        fairness.winViability ?? '',
        fairness.agency ?? '',
        item.funContribution,
        item.frustrationRisk,
        item.stayedInCharacter,
        fairness.stunRisk ?? '',
        fairness.sabotageFatigueRisk ?? '',
        fairness.toolWasteRisk ?? '',
        fairness.counterplay ?? '',
        item.averagePickRate.toFixed(4),
        item.averageSearchRate.toFixed(4),
        item.averageSabotageRate.toFixed(4),
      ];
    }),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

export function exportGhostRosterJson(roster) {
  return JSON.stringify(roster, null, 2);
}

export function importGhostRosterJson(text) {
  const roster = JSON.parse(text);
  validateGhostRoster(roster);
  return roster;
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function validateGhostProfile(profile) {
  const required = ['schemaVersion', 'id', 'name', 'archetypeId', 'simulatorStrategy'];
  for (const key of required) {
    if (!(key in profile)) throw new Error(`Ghost profile missing required field: ${key}`);
  }
  if (profile.schemaVersion !== GHOST_SCHEMA_VERSION) {
    throw new Error(`Unsupported ghost schema version: ${profile.schemaVersion}`);
  }
  if (!GHOST_ARCHETYPE_IDS.includes(profile.archetypeId)) {
    throw new Error(`Unknown ghost archetype: ${profile.archetypeId}`);
  }
  return true;
}

export function validateGhostRoster(roster) {
  if (!Array.isArray(roster) || roster.length < 2 || roster.length > 4) {
    throw new Error('Ghost roster must contain 2-4 ghosts.');
  }
  roster.forEach(validateGhostProfile);
  return true;
}

export function validateGhostMatch(match) {
  const required = ['schemaVersion', 'id', 'scenario', 'roster', 'state', 'summary', 'behavior'];
  for (const key of required) {
    if (!(key in match)) throw new Error(`Ghost match missing required field: ${key}`);
  }
  validateGhostRoster(match.roster);
  return true;
}

export function validateGhostReport(report) {
  const required = ['schemaVersion', 'id', 'generatedAt', 'scenario', 'score', 'archetypes', 'matchups', 'risks'];
  for (const key of required) {
    if (!(key in report)) throw new Error(`Ghost report missing required field: ${key}`);
  }
  if (report.schemaVersion !== GHOST_SCHEMA_VERSION) {
    throw new Error(`Unsupported ghost report schema version: ${report.schemaVersion}`);
  }
  return true;
}

export function migrateGhostReport(report) {
  if (report.schemaVersion === GHOST_SCHEMA_VERSION) return report;
  return {
    ...report,
    schemaVersion: GHOST_SCHEMA_VERSION,
    exports: report.exports || {},
  };
}

function readStorage(key) {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeStorage(key, value) {
  if (typeof localStorage === 'undefined') return false;
  localStorage.setItem(key, JSON.stringify(value));
  return true;
}

export function saveGhostRoster(roster) {
  validateGhostRoster(roster);
  const id = `roster-${hashString(JSON.stringify(roster)).toString(16)}`;
  const entry = { id, savedAt: nowIso(), roster };
  const rosters = [entry, ...readStorage(GHOST_ROSTER_KEY).filter((item) => item.id !== id)].slice(0, 40);
  writeStorage(GHOST_ROSTER_KEY, rosters);
  return rosters;
}

export function listGhostRosters() {
  return readStorage(GHOST_ROSTER_KEY);
}

export function saveGhostReport(report) {
  validateGhostReport(report);
  const reports = [report, ...readStorage(GHOST_REPORT_KEY).filter((item) => item.id !== report.id)].slice(0, 30);
  writeStorage(GHOST_REPORT_KEY, reports);
  return reports;
}

export function listGhostReports() {
  return readStorage(GHOST_REPORT_KEY).map(migrateGhostReport);
}

export function pinGhost(ghost) {
  validateGhostProfile(ghost);
  const pinned = [ghost, ...readStorage(GHOST_PINNED_KEY).filter((item) => item.id !== ghost.id)].slice(0, 24);
  writeStorage(GHOST_PINNED_KEY, pinned);
  return pinned;
}

export function listPinnedGhosts() {
  return readStorage(GHOST_PINNED_KEY);
}
