import { buildFunTelemetry, scoreFunTelemetry } from './funSystems.js';

export const SIM_MIN_PLAYERS = 2;
export const SIM_MAX_PLAYERS = 4;
export const SIM_ROUND_TIMEOUT_SECONDS = 5 * 60;

export const SIM_DEFAULT_RULES = Object.freeze({
  totalLocks: 5,
  maxTools: 5,
  pickBaseChance: 40,
  pickToolBonus: 15,
  pickChanceCap: 95,
  searchChance: 60,
  stunnedSearchChance: 30,
  minHealthyRounds: 8,
  maxHealthyRounds: 22,
  runawayLeadRound: 4,
  runawayLeadLocks: 2,
});

export const SIM_ACTION = Object.freeze({
  NONE: 0,
  PICK: 1,
  SEARCH: 2,
  SABOTAGE: 3,
});

export const SIM_ACTION_LABEL = Object.freeze({
  [SIM_ACTION.NONE]: 'None',
  [SIM_ACTION.PICK]: 'Pick',
  [SIM_ACTION.SEARCH]: 'Search',
  [SIM_ACTION.SABOTAGE]: 'Sabotage',
});

export const SIM_OUTCOME_REASON = Object.freeze({
  NONE: 'NONE',
  PICK_SUCCESS: 'PICK_SUCCESS',
  PICK_FAILED_STUNNED: 'PICK_FAILED_STUNNED',
  PICK_FAILED_ROLL: 'PICK_FAILED_ROLL',
  SEARCH_SUCCESS: 'SEARCH_SUCCESS',
  SEARCH_FAILED_ROLL: 'SEARCH_FAILED_ROLL',
  SEARCH_FAILED_MAX_TOOLS: 'SEARCH_FAILED_MAX_TOOLS',
  SABOTAGE_FAILED_INVALID_TARGET: 'SABOTAGE_FAILED_INVALID_TARGET',
  SABOTAGE_SUCCESS_STEAL: 'SABOTAGE_SUCCESS_STEAL',
  SABOTAGE_SUCCESS_STUN_ONLY: 'SABOTAGE_SUCCESS_STUN_ONLY',
  SABOTAGE_SUCCESS_NO_TOOL: 'SABOTAGE_SUCCESS_NO_TOOL',
  NO_SUBMISSION: 'NO_SUBMISSION',
});

export const SIM_STRATEGIES = Object.freeze([
  { id: 'balanced', label: 'Balanced' },
  { id: 'picker', label: 'Picker' },
  { id: 'searcher', label: 'Searcher' },
  { id: 'saboteur', label: 'Saboteur' },
  { id: 'random', label: 'Random' },
  { id: 'human', label: 'Human' },
]);

export const SIM_DEFAULT_STRATEGY_PROFILE = Object.freeze({
  aggression: 55,
  searchGreed: 45,
  sabotageThreshold: 70,
  riskTolerance: 55,
});

export const SIM_SCENARIOS = Object.freeze([
  {
    id: 'new-player-table',
    label: 'New player table',
    seed: 'new-player-table',
    playerCount: 4,
    strategies: ['balanced', 'balanced', 'balanced', 'balanced'],
    description: 'Evenly matched default table for onboarding and readability checks.',
  },
  {
    id: 'all-aggressive',
    label: 'All aggressive',
    seed: 'all-aggressive',
    playerCount: 4,
    strategies: ['picker', 'picker', 'picker', 'picker'],
    profile: { aggression: 85, searchGreed: 20, sabotageThreshold: 90, riskTolerance: 80 },
    description: 'Fast finish pressure and low-search pacing.',
  },
  {
    id: 'all-searchers',
    label: 'All searchers',
    seed: 'all-searchers',
    playerCount: 4,
    strategies: ['searcher', 'searcher', 'searcher', 'searcher'],
    profile: { aggression: 30, searchGreed: 85, sabotageThreshold: 65, riskTolerance: 45 },
    description: 'Tool economy stress test.',
  },
  {
    id: 'comeback-test',
    label: 'Comeback test',
    seed: 'comeback-test',
    playerCount: 4,
    strategies: ['balanced', 'saboteur', 'searcher', 'picker'],
    playerPatches: [
      { locksCracked: 0, tools: 1 },
      { locksCracked: 3, tools: 0 },
      { locksCracked: 1, tools: 3 },
      { locksCracked: 2, tools: 1, stunned: true },
    ],
    scoreProfile: {
      mode: 'asymmetric-comeback',
      leaderPlayerId: 'player-2',
      comebackPlayerIds: ['player-1', 'player-3', 'player-4'],
      minHealthyRounds: 6,
      maxHealthyRounds: 28,
    },
    description: 'A leader, a trailing player with tools, and a stunned contender.',
  },
  {
    id: 'stall-test',
    label: 'Stall test',
    seed: 'stall-test',
    playerCount: 4,
    strategies: ['saboteur', 'saboteur', 'saboteur', 'searcher'],
    profile: { aggression: 25, searchGreed: 70, sabotageThreshold: 35, riskTolerance: 30 },
    description: 'Checks whether sabotage loops drag games past the target duration.',
  },
  {
    id: 'human-vs-bots',
    label: 'Human vs bots',
    seed: 'human-vs-bots',
    playerCount: 4,
    strategies: ['human', 'balanced', 'searcher', 'saboteur'],
    description: 'Manual player one with bot opponents.',
  },
  {
    id: 'marketing-snapshot',
    label: 'Snapshot state',
    seed: 'marketing-snapshot',
    playerCount: 4,
    strategies: ['balanced', 'picker', 'searcher', 'saboteur'],
    playerPatches: [
      { locksCracked: 4, tools: 2 },
      { locksCracked: 3, tools: 4 },
      { locksCracked: 2, tools: 5, stunned: true },
      { locksCracked: 1, tools: 1 },
    ],
    description: 'High-tension state for screenshots and marketing proof.',
  },
]);

const DEFAULT_STRATEGIES = ['balanced', 'picker', 'searcher', 'saboteur'];

function clampNumber(value, min, max, fallback, round = true) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const next = Math.min(max, Math.max(min, parsed));
  return round ? Math.floor(next) : next;
}

function makeAddress(index) {
  return `0x${String(index).padStart(40, '0')}`;
}

function hashString(input) {
  let hash = 2166136261;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return hash >>> 0;
}

function deterministicRoll(parts) {
  return hashString(parts.join(':')) % 100;
}

function clonePlayers(players) {
  return players.map((player) => ({ ...player }));
}

function cloneState(state) {
  return {
    ...state,
    rules: { ...state.rules },
    players: clonePlayers(state.players),
    events: [...(state.events || [])],
    roundHistory: [...(state.roundHistory || [])],
  };
}

function findScenario(id) {
  return SIM_SCENARIOS.find((scenario) => scenario.id === id) || SIM_SCENARIOS[0];
}

function findPlayer(state, idOrAddress) {
  return state.players.find(
    (player) =>
      player.id === idOrAddress ||
      player.address === idOrAddress ||
      String(player.index) === String(idOrAddress),
  );
}

function normalizeActionEntry(entry) {
  if (!entry) {
    return null;
  }
  if (typeof entry === 'number') {
    return { action: entry, sabotageTarget: null };
  }
  if (typeof entry === 'string') {
    return { action: Number(entry), sabotageTarget: null };
  }
  return {
    action: Number(entry.action),
    sabotageTarget: entry.sabotageTarget || null,
  };
}

function actionForPlayer(actionMap, player) {
  return normalizeActionEntry(
    actionMap[player.id] ?? actionMap[player.address] ?? actionMap[player.index],
  );
}

function makeEvent(type, round, payload = {}) {
  return {
    id: `${round}-${type}-${hashString(JSON.stringify(payload)).toString(16)}`,
    type,
    round,
    ...payload,
  };
}

function playerName(state, id) {
  return state.players.find((player) => player.id === id)?.name || id || 'none';
}

function outcomeMessage(player, action, success, reason, target) {
  const actionLabel = SIM_ACTION_LABEL[action] || 'Action';
  if (action === SIM_ACTION.PICK && success) {
    return `${player.name} cracked a lock.`;
  }
  if (action === SIM_ACTION.SEARCH && success) {
    return `${player.name} found a tool.`;
  }
  if (action === SIM_ACTION.SABOTAGE && success) {
    return target
      ? `${player.name} sabotaged ${target.name}.`
      : `${player.name} landed sabotage.`;
  }
  if (reason === SIM_OUTCOME_REASON.NO_SUBMISSION) {
    return `${player.name} did not submit.`;
  }
  return `${player.name} failed ${actionLabel.toLowerCase()}.`;
}

export function normalizeRuleset(rules = {}) {
  return {
    totalLocks: clampNumber(rules.totalLocks, 3, 9, SIM_DEFAULT_RULES.totalLocks),
    maxTools: clampNumber(rules.maxTools, 1, 9, SIM_DEFAULT_RULES.maxTools),
    pickBaseChance: clampNumber(
      rules.pickBaseChance,
      5,
      95,
      SIM_DEFAULT_RULES.pickBaseChance,
    ),
    pickToolBonus: clampNumber(
      rules.pickToolBonus,
      0,
      50,
      SIM_DEFAULT_RULES.pickToolBonus,
    ),
    pickChanceCap: clampNumber(rules.pickChanceCap, 5, 99, SIM_DEFAULT_RULES.pickChanceCap),
    searchChance: clampNumber(rules.searchChance, 5, 95, SIM_DEFAULT_RULES.searchChance),
    stunnedSearchChance: clampNumber(
      rules.stunnedSearchChance,
      0,
      95,
      SIM_DEFAULT_RULES.stunnedSearchChance,
    ),
    minHealthyRounds: clampNumber(
      rules.minHealthyRounds,
      1,
      100,
      SIM_DEFAULT_RULES.minHealthyRounds,
    ),
    maxHealthyRounds: clampNumber(
      rules.maxHealthyRounds,
      2,
      160,
      SIM_DEFAULT_RULES.maxHealthyRounds,
    ),
    runawayLeadRound: clampNumber(
      rules.runawayLeadRound,
      1,
      50,
      SIM_DEFAULT_RULES.runawayLeadRound,
    ),
    runawayLeadLocks: clampNumber(
      rules.runawayLeadLocks,
      1,
      6,
      SIM_DEFAULT_RULES.runawayLeadLocks,
    ),
  };
}

export function normalizeStrategyProfile(profile = {}) {
  return {
    aggression: clampNumber(
      profile.aggression,
      0,
      100,
      SIM_DEFAULT_STRATEGY_PROFILE.aggression,
    ),
    searchGreed: clampNumber(
      profile.searchGreed,
      0,
      100,
      SIM_DEFAULT_STRATEGY_PROFILE.searchGreed,
    ),
    sabotageThreshold: clampNumber(
      profile.sabotageThreshold,
      0,
      100,
      SIM_DEFAULT_STRATEGY_PROFILE.sabotageThreshold,
    ),
    riskTolerance: clampNumber(
      profile.riskTolerance,
      0,
      100,
      SIM_DEFAULT_STRATEGY_PROFILE.riskTolerance,
    ),
  };
}

export function getScenarioConfig(scenarioId) {
  return findScenario(scenarioId);
}

export function getScenarioOptions(scenarioId) {
  const scenario = findScenario(scenarioId);
  return {
    scenarioId: scenario.id,
    playerCount: scenario.playerCount,
    seed: scenario.seed,
    strategies: scenario.strategies,
    strategyProfile: scenario.profile || SIM_DEFAULT_STRATEGY_PROFILE,
    scoreProfile: scenario.scoreProfile || null,
  };
}

export function createInitialSimulation(options = {}) {
  const scenario = options.scenarioId ? findScenario(options.scenarioId) : null;
  const playerCount = clampNumber(
    options.playerCount ?? scenario?.playerCount,
    SIM_MIN_PLAYERS,
    SIM_MAX_PLAYERS,
    SIM_MAX_PLAYERS,
  );
  const seed = options.seed ?? scenario?.seed ?? 'plundrix-default-seed';
  const rules = normalizeRuleset({ ...SIM_DEFAULT_RULES, ...(options.rules || {}) });
  const playerPatches = options.playerPatches || scenario?.playerPatches || [];

  return {
    gameId: options.gameId || `sim-${hashString(seed).toString(16)}`,
    scenarioId: options.scenarioId || scenario?.id || 'custom',
    seed,
    entropy: options.entropy || 0,
    rules,
    state: 'ACTIVE',
    currentRound: 1,
    roundStartTime: options.roundStartTime || 0,
    winner: null,
    players: Array.from({ length: playerCount }, (_, index) => ({
      id: `player-${index + 1}`,
      address: makeAddress(index + 1),
      index: index + 1,
      name: options.names?.[index] || `Player ${index + 1}`,
      locksCracked: 0,
      tools: 0,
      stunned: false,
      registered: true,
      ...(playerPatches[index] || {}),
    })),
    events: [
      makeEvent('GameStarted', 1, {
        message: `Simulation started with ${playerCount} players.`,
      }),
    ],
    roundHistory: [],
  };
}

export function getPickChance(player, rules = SIM_DEFAULT_RULES) {
  const normalized = normalizeRuleset(rules);
  if (player.stunned) {
    return 0;
  }
  return Math.min(
    normalized.pickChanceCap,
    normalized.pickBaseChance + player.tools * normalized.pickToolBonus,
  );
}

export function getSearchChance(player, rules = SIM_DEFAULT_RULES) {
  const normalized = normalizeRuleset(rules);
  return player.stunned ? normalized.stunnedSearchChance : normalized.searchChance;
}

export function resolveSimulationRound(state, actionMap = {}, options = {}) {
  const next = cloneState(state);
  if (next.state !== 'ACTIVE') {
    return next;
  }

  const round = next.currentRound;
  const timedOut = Boolean(options.timedOut);
  const roundEvents = [];
  const pendingById = new Map();
  const beforePlayers = clonePlayers(next.players);

  const emit = (type, payload = {}) => {
    const event = makeEvent(type, round, payload);
    roundEvents.push(event);
    next.events.push(event);
    return event;
  };

  for (const player of next.players) {
    let pending = actionForPlayer(actionMap, player);
    if (!pending) {
      if (timedOut) {
        pending = { action: SIM_ACTION.PICK, sabotageTarget: null };
        emit('DefaultActionAssigned', {
          actor: player.id,
          action: SIM_ACTION.PICK,
          message: `${player.name} timed out and defaulted to pick.`,
        });
      } else {
        emit('ActionOutcome', {
          actor: player.id,
          action: SIM_ACTION.NONE,
          success: false,
          reason: SIM_OUTCOME_REASON.NO_SUBMISSION,
          locksCracked: player.locksCracked,
          tools: player.tools,
          stunned: player.stunned,
          message: outcomeMessage(
            player,
            SIM_ACTION.NONE,
            false,
            SIM_OUTCOME_REASON.NO_SUBMISSION,
          ),
        });
        continue;
      }
    }
    pendingById.set(player.id, pending);
  }

  for (const player of next.players) {
    const pending = pendingById.get(player.id);
    if (!pending) {
      continue;
    }

    const roll = deterministicRoll([
      next.seed,
      next.gameId,
      round,
      next.entropy,
      player.index,
    ]);

    if (pending.action === SIM_ACTION.PICK) {
      let success = false;
      let reason = SIM_OUTCOME_REASON.PICK_FAILED_ROLL;
      const chance = getPickChance(player, next.rules);

      if (player.stunned) {
        reason = SIM_OUTCOME_REASON.PICK_FAILED_STUNNED;
      } else if (roll < chance) {
        success = true;
        reason = SIM_OUTCOME_REASON.PICK_SUCCESS;
        player.locksCracked += 1;
        emit('LockCracked', {
          actor: player.id,
          locksCracked: player.locksCracked,
          message: `${player.name} cracked lock ${player.locksCracked}.`,
        });
      }

      emit('ActionOutcome', {
        actor: player.id,
        action: SIM_ACTION.PICK,
        success,
        reason,
        roll,
        chance,
        locksCracked: player.locksCracked,
        tools: player.tools,
        stunned: player.stunned,
        message: outcomeMessage(player, SIM_ACTION.PICK, success, reason),
      });
    } else if (pending.action === SIM_ACTION.SEARCH) {
      let success = false;
      let reason = SIM_OUTCOME_REASON.SEARCH_FAILED_ROLL;
      const chance = getSearchChance(player, next.rules);

      if (roll < chance) {
        if (player.tools >= next.rules.maxTools) {
          reason = SIM_OUTCOME_REASON.SEARCH_FAILED_MAX_TOOLS;
        } else {
          success = true;
          reason = SIM_OUTCOME_REASON.SEARCH_SUCCESS;
          player.tools += 1;
          emit('ToolFound', {
            actor: player.id,
            tools: player.tools,
            message: `${player.name} found tool ${player.tools}.`,
          });
        }
      }

      emit('ActionOutcome', {
        actor: player.id,
        action: SIM_ACTION.SEARCH,
        success,
        reason,
        roll,
        chance,
        locksCracked: player.locksCracked,
        tools: player.tools,
        stunned: player.stunned,
        message: outcomeMessage(player, SIM_ACTION.SEARCH, success, reason),
      });
    }
  }

  for (const player of next.players) {
    player.stunned = false;
  }

  for (const player of next.players) {
    const pending = pendingById.get(player.id);
    if (!pending || pending.action !== SIM_ACTION.SABOTAGE) {
      continue;
    }

    const target = findPlayer(next, pending.sabotageTarget);
    if (!target || target.id === player.id) {
      emit('ActionOutcome', {
        actor: player.id,
        target: pending.sabotageTarget,
        action: SIM_ACTION.SABOTAGE,
        success: false,
        reason: SIM_OUTCOME_REASON.SABOTAGE_FAILED_INVALID_TARGET,
        locksCracked: player.locksCracked,
        tools: player.tools,
        stunned: player.stunned,
        message: `${player.name} chose an invalid sabotage target.`,
      });
      continue;
    }

    target.stunned = true;
    emit('PlayerSabotaged', {
      actor: player.id,
      target: target.id,
      message: `${player.name} sabotaged ${target.name}.`,
    });
    emit('PlayerStunned', {
      actor: target.id,
      message: `${target.name} is stunned for the next round.`,
    });

    let reason = SIM_OUTCOME_REASON.SABOTAGE_SUCCESS_NO_TOOL;
    if (target.tools > 0 && player.tools < next.rules.maxTools) {
      target.tools -= 1;
      player.tools += 1;
      reason = SIM_OUTCOME_REASON.SABOTAGE_SUCCESS_STEAL;
    } else if (target.tools > 0) {
      reason = SIM_OUTCOME_REASON.SABOTAGE_SUCCESS_STUN_ONLY;
    }

    emit('ActionOutcome', {
      actor: player.id,
      target: target.id,
      action: SIM_ACTION.SABOTAGE,
      success: true,
      reason,
      locksCracked: player.locksCracked,
      tools: player.tools,
      stunned: player.stunned,
      message: outcomeMessage(player, SIM_ACTION.SABOTAGE, true, reason, target),
    });
  }

  emit('RoundResolved', {
    message: `Round ${round} resolved.`,
  });

  const winner = next.players.find((player) => player.locksCracked >= next.rules.totalLocks);
  if (winner) {
    next.state = 'COMPLETE';
    next.winner = winner.id;
    emit('GameWon', {
      actor: winner.id,
      rounds: round,
      message: `${winner.name} won in ${round} rounds.`,
    });
  } else {
    next.currentRound += 1;
    next.roundStartTime += SIM_ROUND_TIMEOUT_SECONDS;
  }

  next.roundHistory.push({
    round,
    actions: Object.fromEntries(
      next.players.map((player) => [player.id, pendingById.get(player.id) || null]),
    ),
    beforePlayers,
    events: roundEvents,
    players: clonePlayers(next.players),
  });

  return next;
}

function leaderExcluding(state, player) {
  return [...state.players]
    .filter((candidate) => candidate.id !== player.id)
    .sort((a, b) => {
      if (b.locksCracked !== a.locksCracked) {
        return b.locksCracked - a.locksCracked;
      }
      return b.tools - a.tools;
    })[0];
}

function richestTarget(state, player) {
  return [...state.players]
    .filter((candidate) => candidate.id !== player.id)
    .sort((a, b) => b.tools - a.tools || b.locksCracked - a.locksCracked)[0];
}

function strategyId(strategy) {
  return typeof strategy === 'string' ? strategy : strategy?.id || 'balanced';
}

export function chooseStrategyAction(
  state,
  player,
  strategy = 'balanced',
  strategyProfile = SIM_DEFAULT_STRATEGY_PROFILE,
) {
  const profile = normalizeStrategyProfile(strategyProfile);
  const id = strategyId(strategy);
  const leader = leaderExcluding(state, player);
  const richTarget = richestTarget(state, player);
  const target = leader || richTarget;
  const behindLeader = Math.max(0, (leader?.locksCracked || 0) - player.locksCracked);
  const nearLeaderWin = leader && leader.locksCracked >= state.rules.totalLocks - 1;
  const sabotageRoll = deterministicRoll([
    state.seed,
    state.currentRound,
    player.index,
    id,
    'sabotage',
  ]);
  const roleAllowsInventorySabotage = ['saboteur', 'leader-hunter', 'tool-hoarder', 'random'].includes(id);
  const wantsSabotage =
    target &&
    id !== 'human' &&
    sabotageRoll < profile.sabotageThreshold &&
    (nearLeaderWin ||
      behindLeader >= 2 ||
      (roleAllowsInventorySabotage && target.tools > 1) ||
      (id === 'saboteur' && target.locksCracked >= player.locksCracked));

  if (id === 'human') {
    return {
      action: SIM_ACTION.PICK,
      sabotageTarget: target?.id || null,
    };
  }

  if (id === 'picker') {
    if (wantsSabotage && profile.aggression < 80) {
      return { action: SIM_ACTION.SABOTAGE, sabotageTarget: target.id };
    }
    return {
      action: player.stunned && player.tools < state.rules.maxTools ? SIM_ACTION.SEARCH : SIM_ACTION.PICK,
      sabotageTarget: target?.id || null,
    };
  }

  if (id === 'searcher') {
    const desiredTools = Math.max(1, Math.round(1 + profile.searchGreed / 25));
    if (wantsSabotage && player.tools >= desiredTools) {
      return { action: SIM_ACTION.SABOTAGE, sabotageTarget: target.id };
    }
    return {
      action: player.tools < desiredTools ? SIM_ACTION.SEARCH : SIM_ACTION.PICK,
      sabotageTarget: target?.id || null,
    };
  }

  if (id === 'tool-hoarder') {
    const cashOutTools = player.locksCracked >= state.rules.totalLocks - 2 ? 1 : 2;
    const leaderThreat = leader && leader.locksCracked >= state.rules.totalLocks - 1;

    if (leaderThreat && target && target.tools > 0 && player.tools < state.rules.maxTools) {
      return { action: SIM_ACTION.SABOTAGE, sabotageTarget: target.id };
    }
    if (player.stunned && player.tools < state.rules.maxTools) {
      return { action: SIM_ACTION.SEARCH, sabotageTarget: target?.id || null };
    }
    if (player.tools < cashOutTools && player.locksCracked < state.rules.totalLocks - 1) {
      return { action: SIM_ACTION.SEARCH, sabotageTarget: target?.id || null };
    }
    return { action: SIM_ACTION.PICK, sabotageTarget: target?.id || null };
  }

  if (id === 'leader-hunter') {
    const leaderAlreadyStunned = Boolean(leader?.stunned);
    const canCatchByPicking = player.locksCracked >= Math.max(0, (leader?.locksCracked || 0) - 1);
    const needsClosingProgress = player.locksCracked >= state.rules.totalLocks - 2 || canCatchByPicking;
    const disruptiveTarget =
      target &&
      !leaderAlreadyStunned &&
      (nearLeaderWin || behindLeader >= 2 || (target.tools > 0 && player.tools < state.rules.maxTools));

    if (disruptiveTarget && !needsClosingProgress) {
      return { action: SIM_ACTION.SABOTAGE, sabotageTarget: target.id };
    }
    if (player.stunned && player.tools < state.rules.maxTools) {
      return { action: SIM_ACTION.SEARCH, sabotageTarget: target?.id || null };
    }
    if (player.tools === 0 && player.locksCracked < state.rules.totalLocks - 2 && behindLeader >= 2) {
      return { action: SIM_ACTION.SEARCH, sabotageTarget: target?.id || null };
    }
    if (disruptiveTarget && nearLeaderWin && player.locksCracked < state.rules.totalLocks - 1) {
      return { action: SIM_ACTION.SABOTAGE, sabotageTarget: target.id };
    }
    return { action: SIM_ACTION.PICK, sabotageTarget: target?.id || null };
  }

  if (id === 'saboteur') {
    if (target && (wantsSabotage || target.tools > 0 || target.locksCracked >= player.locksCracked)) {
      return { action: SIM_ACTION.SABOTAGE, sabotageTarget: target.id };
    }
    return {
      action: player.tools < 2 ? SIM_ACTION.SEARCH : SIM_ACTION.PICK,
      sabotageTarget: target?.id || null,
    };
  }

  if (id === 'random') {
    const roll = deterministicRoll([state.seed, state.currentRound, player.index, 'strategy']);
    if (roll < 34) {
      return { action: SIM_ACTION.PICK, sabotageTarget: target?.id || null };
    }
    if (roll < 67) {
      return { action: SIM_ACTION.SEARCH, sabotageTarget: target?.id || null };
    }
    return { action: SIM_ACTION.SABOTAGE, sabotageTarget: target?.id || null };
  }

  if (wantsSabotage) {
    return { action: SIM_ACTION.SABOTAGE, sabotageTarget: target.id };
  }
  if (player.tools === 0 && player.locksCracked < Math.max(2, state.rules.totalLocks - 2)) {
    return { action: SIM_ACTION.SEARCH, sabotageTarget: target?.id || null };
  }
  if (player.stunned && player.tools < state.rules.maxTools) {
    return { action: SIM_ACTION.SEARCH, sabotageTarget: target?.id || null };
  }
  if (
    player.tools >= 3 ||
    player.locksCracked >= state.rules.totalLocks - 2 ||
    profile.aggression > 70
  ) {
    return { action: SIM_ACTION.PICK, sabotageTarget: target?.id || null };
  }
  return {
    action:
      deterministicRoll([state.seed, state.currentRound, player.index, 'balanced']) <
      profile.riskTolerance
        ? SIM_ACTION.PICK
        : SIM_ACTION.SEARCH,
    sabotageTarget: target?.id || null,
  };
}

export function buildStrategyActionMap(
  state,
  strategies = DEFAULT_STRATEGIES,
  strategyProfile = SIM_DEFAULT_STRATEGY_PROFILE,
) {
  return Object.fromEntries(
    state.players.map((player, index) => [
      player.id,
      chooseStrategyAction(
        state,
        player,
        strategies[index] || strategies[0] || 'balanced',
        strategyProfile,
      ),
    ]),
  );
}

export function runSimulation(options = {}) {
  const maxRounds = clampNumber(options.maxRounds, 1, 500, 40);
  const scenarioOptions = options.scenarioId ? getScenarioOptions(options.scenarioId) : {};
  let state = createInitialSimulation({
    ...scenarioOptions,
    ...options,
    rules: normalizeRuleset({ ...SIM_DEFAULT_RULES, ...(options.rules || {}) }),
  });
  const strategies = options.strategies || scenarioOptions.strategies || DEFAULT_STRATEGIES;
  const strategyProfile = normalizeStrategyProfile(
    options.strategyProfile || scenarioOptions.strategyProfile || SIM_DEFAULT_STRATEGY_PROFILE,
  );

  while (state.state === 'ACTIVE' && state.currentRound <= maxRounds) {
    state = resolveSimulationRound(
      state,
      buildStrategyActionMap(state, strategies, strategyProfile),
      { timedOut: false },
    );
  }

  if (state.state !== 'COMPLETE') {
    state = {
      ...state,
      state: 'COMPLETE',
      winner: null,
      events: [
        ...state.events,
        makeEvent('GameStopped', state.currentRound, {
          message: `Simulation stopped after ${maxRounds} rounds.`,
        }),
      ],
    };
  }

  return state;
}

export function buildFunCurve(state) {
  let previousLeader = null;
  return state.roundHistory.map((round) => {
    const sorted = [...round.players].sort((a, b) => b.locksCracked - a.locksCracked);
    const leader = sorted[0];
    const second = sorted[1];
    const lead = leader ? leader.locksCracked - (second?.locksCracked || 0) : 0;
    const nearWinCount = round.players.filter(
      (player) => player.locksCracked >= state.rules.totalLocks - 1,
    ).length;
    const stuns = round.events.filter((event) => event.type === 'PlayerStunned').length;
    const leadChange = previousLeader && previousLeader !== leader?.id ? 1 : 0;
    previousLeader = leader?.id || null;
    const tension = Math.min(100, Math.max(0, 70 - lead * 18 + nearWinCount * 20 + stuns * 6));
    return {
      round: round.round,
      leader: leader?.id || null,
      leaderName: leader?.name || 'None',
      lead,
      tension,
      nearWinCount,
      stuns,
      leadChange,
    };
  });
}

function analyzeComebackAndRunaway(state) {
  const curve = buildFunCurve(state);
  const winner = state.winner;
  const winnerName = playerName(state, winner);
  const firstLead = curve.find((point) => point.leader);
  const midRound = curve[Math.floor(curve.length / 2)];
  const winnerMidState = state.roundHistory[Math.floor(state.roundHistory.length / 2)]?.players.find(
    (player) => player.id === winner,
  );
  const midLeaderLocks = midRound
    ? Math.max(
        ...state.roundHistory[Math.max(0, midRound.round - 1)].players.map(
          (player) => player.locksCracked,
        ),
      )
    : 0;
  const comeback =
    Boolean(winner) &&
    Boolean(winnerMidState) &&
    midLeaderLocks - winnerMidState.locksCracked >= 2;
  const runaway =
    Boolean(winner) &&
    curve.some(
      (point) =>
        point.round <= state.rules.runawayLeadRound &&
        point.leader === winner &&
        point.lead >= state.rules.runawayLeadLocks,
    );

  return {
    comeback,
    runaway,
    firstLeader: firstLead?.leader || null,
    firstLeaderName: firstLead?.leaderName || null,
    winnerName,
    leadChanges: curve.reduce((sum, point) => sum + point.leadChange, 0),
    averageTension:
      curve.length > 0
        ? curve.reduce((sum, point) => sum + point.tension, 0) / curve.length
        : 0,
    nearWinMoments: curve.reduce((sum, point) => sum + point.nearWinCount, 0),
    stunMoments: curve.reduce((sum, point) => sum + point.stuns, 0),
  };
}

function actionValueFromEvent(event) {
  if (event.action === SIM_ACTION.PICK) {
    return event.success ? 1 : 0;
  }
  if (event.action === SIM_ACTION.SEARCH) {
    return event.success ? 0.35 : 0;
  }
  if (event.action === SIM_ACTION.SABOTAGE) {
    if (!event.success) {
      return -0.1;
    }
    if (event.reason === SIM_OUTCOME_REASON.SABOTAGE_SUCCESS_STEAL) {
      return 0.55;
    }
    if (event.reason === SIM_OUTCOME_REASON.SABOTAGE_SUCCESS_STUN_ONLY) {
      return 0.35;
    }
    return 0.2;
  }
  return 0;
}

export function summarizeSimulation(state) {
  const actionOutcomes = state.events.filter((event) => event.type === 'ActionOutcome');
  const comebackRunaway = analyzeComebackAndRunaway(state);
  const maxToolsHeld = Math.max(0, ...state.players.map((player) => player.tools));
  const funTelemetry = buildFunTelemetry({
    ...state,
    rounds: state.roundHistory.length,
    ...comebackRunaway,
  });
  const funScore = scoreFunTelemetry(funTelemetry);

  return {
    seed: state.seed,
    scenarioId: state.scenarioId,
    winner: state.winner,
    winnerName: state.players.find((player) => player.id === state.winner)?.name || null,
    rounds: state.roundHistory.length,
    completed: Boolean(state.winner),
    totalLocks: state.players.reduce((sum, player) => sum + player.locksCracked, 0),
    totalTools: state.players.reduce((sum, player) => sum + player.tools, 0),
    maxToolsHeld,
    picks: actionOutcomes.filter((event) => event.action === SIM_ACTION.PICK).length,
    searches: actionOutcomes.filter((event) => event.action === SIM_ACTION.SEARCH).length,
    sabotages: actionOutcomes.filter((event) => event.action === SIM_ACTION.SABOTAGE).length,
    pickSuccesses: actionOutcomes.filter(
      (event) => event.action === SIM_ACTION.PICK && event.success,
    ).length,
    searchSuccesses: actionOutcomes.filter(
      (event) => event.action === SIM_ACTION.SEARCH && event.success,
    ).length,
    sabotageSuccesses: actionOutcomes.filter(
      (event) => event.action === SIM_ACTION.SABOTAGE && event.success,
    ).length,
    wastedSabotages: actionOutcomes.filter(
      (event) =>
        event.action === SIM_ACTION.SABOTAGE &&
        !event.success,
    ).length,
    stunOnlySabotages: actionOutcomes.filter(
      (event) =>
        event.action === SIM_ACTION.SABOTAGE &&
        event.reason === SIM_OUTCOME_REASON.SABOTAGE_SUCCESS_NO_TOOL,
    ).length,
    comeback: comebackRunaway.comeback,
    runaway: comebackRunaway.runaway,
    leadChanges: comebackRunaway.leadChanges,
    averageTension: comebackRunaway.averageTension,
    nearWinMoments: comebackRunaway.nearWinMoments,
    stunMoments: comebackRunaway.stunMoments,
    funTelemetry,
    funScore,
    actionValue: {
      pick: average(
        actionOutcomes
          .filter((event) => event.action === SIM_ACTION.PICK)
          .map(actionValueFromEvent),
      ),
      search: average(
        actionOutcomes
          .filter((event) => event.action === SIM_ACTION.SEARCH)
          .map(actionValueFromEvent),
      ),
      sabotage: average(
        actionOutcomes
          .filter((event) => event.action === SIM_ACTION.SABOTAGE)
          .map(actionValueFromEvent),
      ),
    },
  };
}

function average(values) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function percentile(values, pct) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((pct / 100) * sorted.length));
  return sorted[index];
}

function countWinsByPlayer(summaries) {
  return summaries.reduce((counts, summary) => {
    if (summary.winner) {
      counts[summary.winner] = (counts[summary.winner] || 0) + 1;
    }
    return counts;
  }, {});
}

function buildWinRates(winCounts, games, playerCount = SIM_MAX_PLAYERS) {
  return Object.fromEntries(
    Array.from({ length: playerCount }, (_, index) => {
      const playerId = `player-${index + 1}`;
      return [playerId, (winCounts[playerId] || 0) / games];
    }),
  );
}

function gradeFromScore(score) {
  return score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
}

export function computeBalanceScorecard(batchResult) {
  const summaries = batchResult.summaries || [];
  const games = batchResult.games || summaries.length || 1;
  const winCounts = batchResult.winCounts || countWinsByPlayer(summaries);
  const winRates = buildWinRates(winCounts, games, batchResult.playerCount || SIM_MAX_PLAYERS);
  const rates = Object.values(winRates);
  const maxRate = rates.length ? Math.max(...rates) : 0;
  const minRate = rates.length ? Math.min(...rates) : 0;
  const roundValues = summaries.map((summary) => summary.rounds);
  const funScores = summaries
    .map((summary) => summary.funScore?.score ?? summary.funScore)
    .filter((value) => Number.isFinite(Number(value)))
    .map(Number);
  const funDimensionKeys = ['agency', 'drama', 'readability', 'rhythm', 'variety'];
  const funDimensions = Object.fromEntries(funDimensionKeys.map((key) => [
    key,
    average(
      summaries
        .map((summary) => summary.funScore?.dimensions?.[key])
        .filter((value) => Number.isFinite(Number(value)))
        .map(Number),
    ),
  ]));
  const averageRounds = average(roundValues);
  const scoreProfile = batchResult.scoreProfile || {};
  const minHealthyRounds = scoreProfile.minHealthyRounds || batchResult.rules?.minHealthyRounds || SIM_DEFAULT_RULES.minHealthyRounds;
  const maxHealthyRounds = scoreProfile.maxHealthyRounds || batchResult.rules?.maxHealthyRounds || SIM_DEFAULT_RULES.maxHealthyRounds;
  const tooFastRate = summaries.filter(
    (summary) => summary.rounds < minHealthyRounds,
  ).length / games;
  const tooLongRate = summaries.filter(
    (summary) => summary.rounds > maxHealthyRounds,
  ).length / games;
  const runawayRate = summaries.filter((summary) => summary.runaway).length / games;
  const comebackRate = summaries.filter((summary) => summary.comeback).length / games;
  const firstPlayerRate = (winCounts['player-1'] || 0) / games;
  const spread = maxRate - minRate;
  const isAsymmetricComeback = scoreProfile.mode === 'asymmetric-comeback';
  const leaderPlayerId = scoreProfile.leaderPlayerId || 'player-2';
  const comebackPlayerIds = scoreProfile.comebackPlayerIds || [];
  const comebackRates = comebackPlayerIds.map((playerId) => winRates[playerId] || 0);
  const viableComebackCount = comebackRates.filter((rate) => rate >= 0.08).length;
  const comebackWinRate = comebackRates.reduce((sum, rate) => sum + rate, 0);
  const leaderWinRate = winRates[leaderPlayerId] || 0;
  const dominantWinRate = maxRate;
  const score = isAsymmetricComeback
    ? Math.max(
      0,
      Math.min(
        100,
        100 -
          Math.max(0, leaderWinRate - 0.45) * 90 -
          Math.max(0, dominantWinRate - 0.55) * 100 -
          Math.max(0, 2 - viableComebackCount) * 15 -
          tooFastRate * 25 -
          tooLongRate * 25 -
          runawayRate * 45 +
          Math.min(comebackRate, 0.25) * 30 +
          Math.min(comebackWinRate, 0.75) * 8,
      ),
    )
    : Math.max(
      0,
      Math.min(
        100,
        100 -
          spread * 120 -
          tooFastRate * 35 -
          tooLongRate * 35 -
          runawayRate * 35 +
          Math.min(comebackRate, 0.3) * 20,
      ),
    );

  return {
    score,
    grade: gradeFromScore(score),
    scoreMode: isAsymmetricComeback ? 'asymmetric-comeback' : 'symmetric-seat-balance',
    winRates,
    winSpread: spread,
    dominantWinRate,
    leaderWinRate,
    comebackWinRate,
    viableComebackCount,
    averageRounds,
    averageFunScore: average(funScores),
    funGrade: gradeFromScore(average(funScores)),
    funDimensions,
    minHealthyRounds,
    maxHealthyRounds,
    medianRounds: percentile(roundValues, 50),
    p90Rounds: percentile(roundValues, 90),
    tooFastRate,
    tooLongRate,
    runawayRate,
    comebackRate,
    firstPlayerRate,
    completionRate: (batchResult.completed || 0) / games,
  };
}

export function computeActionValueReport(batchResult) {
  const summaries = batchResult.summaries || [];
  return {
    pick: average(summaries.map((summary) => summary.actionValue.pick)),
    search: average(summaries.map((summary) => summary.actionValue.search)),
    sabotage: average(summaries.map((summary) => summary.actionValue.sabotage)),
    wastedSabotageRate:
      sum(summaries.map((summary) => summary.wastedSabotages)) /
      Math.max(1, sum(summaries.map((summary) => summary.sabotages))),
    stunOnlySabotageRate:
      sum(summaries.map((summary) => summary.stunOnlySabotages || 0)) /
      Math.max(1, sum(summaries.map((summary) => summary.sabotages))),
    toolConversion:
      sum(summaries.map((summary) => summary.totalLocks)) /
      Math.max(1, sum(summaries.map((summary) => summary.totalTools))),
    averageToolsHeld: average(summaries.map((summary) => summary.totalTools)),
    averageMaxToolsHeld: average(summaries.map((summary) => summary.maxToolsHeld)),
    averageStuns: average(summaries.map((summary) => summary.stunMoments)),
  };
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

export function buildDesignerDashboard(batchResult) {
  const scorecard = computeBalanceScorecard(batchResult);
  const actionValue = computeActionValueReport(batchResult);
  const flags = [];

  if (scorecard.scoreMode === 'asymmetric-comeback') {
    if (scorecard.dominantWinRate > 0.58) {
      flags.push('One contender dominates the comeback lab; check starting state and strategy pressure.');
    }
    if (scorecard.leaderWinRate > 0.45) {
      flags.push('The starting leader wins too often for a comeback lab.');
    }
    if (scorecard.viableComebackCount < 2) {
      flags.push('Too few trailing players can convert the comeback state.');
    }
  } else if (scorecard.winSpread > 0.22) {
    flags.push('Win spread is high; compare player order and strategy dominance.');
  }
  if (scorecard.tooFastRate > 0.2) {
    flags.push('Too many games end before the healthy round target.');
  }
  if (scorecard.tooLongRate > 0.2) {
    flags.push('Too many games exceed the healthy round target.');
  }
  if (scorecard.runawayRate > 0.25) {
    flags.push('Runaway wins are common; comeback pressure may need help.');
  }
  if (actionValue.wastedSabotageRate > 0.35) {
    flags.push('Sabotage often hits empty targets; targeting incentives may need tuning.');
  }
  if (
    scorecard.scoreMode !== 'asymmetric-comeback' &&
    Math.abs(scorecard.firstPlayerRate - 0.25) > 0.15 &&
    batchResult.playerCount === 4
  ) {
    flags.push('First-player win rate is outside the target band.');
  }
  if (flags.length === 0) {
    flags.push('No critical balance warnings under the current batch.');
  }

  return {
    scorecard,
    actionValue,
    flags,
    nextKnobs: suggestRules(scorecard, actionValue, batchResult.rules),
  };
}

function suggestRules(scorecard, actionValue, rules = SIM_DEFAULT_RULES) {
  const suggestions = [];
  if (scorecard.tooFastRate > 0.2) {
    suggestions.push({
      label: 'Slow early picking',
      rules: normalizeRuleset({ ...rules, pickBaseChance: rules.pickBaseChance - 5 }),
    });
  }
  if (scorecard.tooLongRate > 0.2) {
    suggestions.push({
      label: 'Shorten long games',
      rules: normalizeRuleset({
        ...rules,
        pickToolBonus: rules.pickToolBonus + 5,
        searchChance: rules.searchChance + 5,
      }),
    });
  }
  if (scorecard.runawayRate > 0.25) {
    suggestions.push({
      label: 'Increase comeback tool access',
      rules: normalizeRuleset({ ...rules, stunnedSearchChance: rules.stunnedSearchChance + 5 }),
    });
  }
  if (actionValue.sabotage < actionValue.search * 0.75) {
    suggestions.push({
      label: 'Make sabotage less wasteful',
      rules: normalizeRuleset({ ...rules, maxTools: Math.max(2, rules.maxTools - 1) }),
    });
  }
  return suggestions.slice(0, 3);
}

export function runBatch(options = {}) {
  const games = clampNumber(options.games, 1, 10000, 100);
  const baseSeed = options.seed || 'plundrix-batch';
  const scenarioOptions = options.scenarioId ? getScenarioOptions(options.scenarioId) : {};
  const rules = normalizeRuleset({ ...SIM_DEFAULT_RULES, ...(options.rules || {}) });
  const summaries = [];
  const states = [];
  const winCounts = {};
  let totalRounds = 0;
  let completed = 0;

  for (let index = 0; index < games; index += 1) {
    const state = runSimulation({
      ...scenarioOptions,
      ...options,
      rules,
      seed: `${baseSeed}-${index + 1}`,
      gameId: `sim-${index + 1}`,
    });
    const summary = summarizeSimulation(state);
    summaries.push(summary);
    if (options.includeStates) {
      states.push(state);
    }
    totalRounds += summary.rounds;
    if (summary.winner) {
      completed += 1;
      winCounts[summary.winner] = (winCounts[summary.winner] || 0) + 1;
    }
  }

  const result = {
    games,
    playerCount: options.playerCount || scenarioOptions.playerCount || SIM_MAX_PLAYERS,
    completed,
    averageRounds: games > 0 ? totalRounds / games : 0,
    winCounts,
    summaries,
    states,
    rules,
    strategies: options.strategies || scenarioOptions.strategies || DEFAULT_STRATEGIES,
    scenarioId: options.scenarioId || scenarioOptions.id || summaries[0]?.scenarioId,
    scoreProfile: options.scoreProfile || scenarioOptions.scoreProfile || null,
    strategyProfile: normalizeStrategyProfile(
      options.strategyProfile || scenarioOptions.strategyProfile || SIM_DEFAULT_STRATEGY_PROFILE,
    ),
  };

  result.scorecard = computeBalanceScorecard(result);
  result.actionValue = computeActionValueReport(result);
  result.dashboard = buildDesignerDashboard(result);
  return result;
}

export function compareRulesets(options = {}) {
  const baseline = runBatch({
    ...options,
    rules: normalizeRuleset({ ...SIM_DEFAULT_RULES, ...(options.baselineRules || {}) }),
  });
  const candidate = runBatch({
    ...options,
    rules: normalizeRuleset({ ...SIM_DEFAULT_RULES, ...(options.candidateRules || options.rules || {}) }),
  });
  return {
    baseline,
    candidate,
    deltas: {
      score: candidate.scorecard.score - baseline.scorecard.score,
      averageRounds: candidate.scorecard.averageRounds - baseline.scorecard.averageRounds,
      winSpread: candidate.scorecard.winSpread - baseline.scorecard.winSpread,
      runawayRate: candidate.scorecard.runawayRate - baseline.scorecard.runawayRate,
      comebackRate: candidate.scorecard.comebackRate - baseline.scorecard.comebackRate,
    },
  };
}

export function recommendAction(state, playerId) {
  const player = findPlayer(state, playerId);
  if (!player) {
    return null;
  }
  const target = leaderExcluding(state, player) || richestTarget(state, player);
  const options = [
    { action: SIM_ACTION.PICK, sabotageTarget: target?.id || null },
    { action: SIM_ACTION.SEARCH, sabotageTarget: target?.id || null },
    { action: SIM_ACTION.SABOTAGE, sabotageTarget: target?.id || null },
  ];
  const scored = options.map((candidate) => {
    const actionMap = buildStrategyActionMap(state);
    actionMap[player.id] = candidate;
    const next = resolveSimulationRound(state, actionMap);
    const after = findPlayer(next, player.id);
    const targetAfter = target ? findPlayer(next, target.id) : null;
    const selfGain =
      (after?.locksCracked || 0) - player.locksCracked + ((after?.tools || 0) - player.tools) * 0.35;
    const targetDamage = target
      ? (target.tools - (targetAfter?.tools || 0)) * 0.25 +
        ((targetAfter?.stunned ? 1 : 0) - (target.stunned ? 1 : 0)) * 0.35
      : 0;
    const winBonus = next.winner === player.id ? 2 : 0;
    return {
      ...candidate,
      label: SIM_ACTION_LABEL[candidate.action],
      score: selfGain + targetDamage + winBonus,
      projected: after,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return {
    playerId: player.id,
    playerName: player.name,
    targetId: target?.id || null,
    targetName: target?.name || null,
    best: scored[0],
    options: scored,
  };
}

export function runWhatIf(state, playerId, action) {
  const player = findPlayer(state, playerId);
  if (!player) {
    return null;
  }
  const baselineActions = buildStrategyActionMap(state);
  const baseline = resolveSimulationRound(state, baselineActions);
  const candidateActions = {
    ...baselineActions,
    [player.id]: normalizeActionEntry(action),
  };
  const candidate = resolveSimulationRound(state, candidateActions);
  return {
    baseline,
    candidate,
    baselineSummary: summarizeSimulation(baseline),
    candidateSummary: summarizeSimulation(candidate),
  };
}

export function buildReplayConfig(options = {}) {
  const params = new URLSearchParams();
  params.set('seed', options.seed || 'plundrix-lab');
  params.set('players', String(options.playerCount || SIM_MAX_PLAYERS));
  if (options.scenarioId) {
    params.set('scenario', options.scenarioId);
  }
  if (options.strategies?.length) {
    params.set('strategies', options.strategies.join(','));
  }
  if (options.rules) {
    params.set('rules', btoa(JSON.stringify(normalizeRuleset(options.rules))));
  }
  return params.toString();
}

export function parseReplayConfig(search = '') {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const rules = params.get('rules');
  return {
    seed: params.get('seed') || undefined,
    playerCount: params.get('players') ? Number(params.get('players')) : undefined,
    scenarioId: params.get('scenario') || undefined,
    strategies: params.get('strategies')?.split(',').filter(Boolean),
    rules: rules ? normalizeRuleset(JSON.parse(atob(rules))) : undefined,
  };
}

export function exportBatchCsv(result) {
  const rows = [
    [
      'seed',
      'winner',
      'rounds',
      'completed',
      'comeback',
      'runaway',
      'leadChanges',
      'averageTension',
      'picks',
      'searches',
      'sabotages',
      'wastedSabotages',
    ],
    ...(result.summaries || []).map((summary) => [
      summary.seed,
      summary.winner || '',
      summary.rounds,
      summary.completed,
      summary.comeback,
      summary.runaway,
      summary.leadChanges,
      summary.averageTension.toFixed(2),
      summary.picks,
      summary.searches,
      summary.sabotages,
      summary.wastedSabotages,
    ]),
  ];
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell);
          return text.includes(',') ? `"${text.replaceAll('"', '""')}"` : text;
        })
        .join(','),
    )
    .join('\n');
}

export function getContractParityChecks(rules = SIM_DEFAULT_RULES) {
  const normalized = normalizeRuleset(rules);
  const checks = [
    ['totalLocks', normalized.totalLocks, 5],
    ['maxTools', normalized.maxTools, 5],
    ['pickBaseChance', normalized.pickBaseChance, 40],
    ['pickToolBonus', normalized.pickToolBonus, 15],
    ['pickChanceCap', normalized.pickChanceCap, 95],
    ['searchChance', normalized.searchChance, 60],
    ['stunnedSearchChance', normalized.stunnedSearchChance, 30],
  ];
  return checks.map(([key, actual, expected]) => ({
    key,
    actual,
    expected,
    pass: actual === expected,
  }));
}

export function createScenarioSnapshot(scenarioId = 'marketing-snapshot', options = {}) {
  return createInitialSimulation({
    ...getScenarioOptions(scenarioId),
    ...options,
    scenarioId,
  });
}
