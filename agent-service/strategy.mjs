const ACTION_NAMES = ['NONE', 'PICK', 'SEARCH', 'SABOTAGE'];
const GAME_STATE_NAMES = ['OPEN', 'ACTIVE', 'COMPLETE'];

function pickTopTarget(player, opponents, totalLocks) {
  if (opponents.length === 0) return null;

  return [...opponents].sort((left, right) => {
    const rightWinThreat = right.locksCracked >= totalLocks - 1 ? 1 : 0;
    const leftWinThreat = left.locksCracked >= totalLocks - 1 ? 1 : 0;
    if (rightWinThreat !== leftWinThreat) return rightWinThreat - leftWinThreat;
    if (right.locksCracked !== left.locksCracked) {
      return right.locksCracked - left.locksCracked;
    }
    if (right.tools !== left.tools) return right.tools - left.tools;
    return left.index - right.index;
  })[0];
}

export function buildAvailableActions(
  snapshot,
  playerAddress,
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  const player = snapshot.players.find(
    (entry) => entry.address.toLowerCase() === playerAddress.toLowerCase()
  );
  const sabotageTargets = snapshot.players
    .filter(
      (entry) =>
        entry.address.toLowerCase() !== playerAddress.toLowerCase() &&
        entry.registered
    )
    .map((entry) => entry.address);

  const base = {
    canCreateGame: !snapshot.paused,
    canRegister: false,
    canStart: false,
    canSubmitAction: false,
    canResolveRound: false,
    availableActions: [],
    sabotageTargets,
    status: 'unknown',
  };

  if (snapshot.paused) {
    return { ...base, status: 'paused' };
  }

  if (snapshot.game.state === 'OPEN') {
    const alreadyRegistered = Boolean(player?.registered);
    return {
      ...base,
      canRegister:
        !alreadyRegistered &&
        snapshot.game.playerCount < snapshot.constants.maxGamePlayers,
      canStart:
        alreadyRegistered &&
        snapshot.game.playerCount >= snapshot.constants.minGamePlayers,
      status: 'open',
    };
  }

  if (snapshot.game.state === 'COMPLETE') {
    return { ...base, status: 'complete' };
  }

  if (!player?.registered) {
    const canResolveRound =
      snapshot.game.state === 'ACTIVE' &&
      (snapshot.allActionsSubmitted || nowSeconds >= snapshot.game.roundEndsAt);

    return {
      ...base,
      canResolveRound,
      status: 'spectator',
    };
  }

  const canResolveRound =
    snapshot.game.state === 'ACTIVE' &&
    (snapshot.allActionsSubmitted || nowSeconds >= snapshot.game.roundEndsAt);

  if (player.actionSubmitted) {
    return {
      ...base,
      canResolveRound,
      status: 'submitted',
    };
  }

  return {
    ...base,
    canResolveRound,
    canSubmitAction: true,
    availableActions: ACTION_NAMES.slice(1),
    status: 'ready',
  };
}

export function recommendAction(
  snapshot,
  playerAddress,
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  const availableActions = buildAvailableActions(
    snapshot,
    playerAddress,
    nowSeconds
  );
  const player = snapshot.players.find(
    (entry) => entry.address.toLowerCase() === playerAddress.toLowerCase()
  );

  if (!player?.registered) {
    return {
      actionable: false,
      action: null,
      target: null,
      confidence: 0,
      rationale: ['Player is not registered in this game.'],
      availableActions,
    };
  }

  if (snapshot.game.state !== 'ACTIVE') {
    return {
      actionable: false,
      action: null,
      target: null,
      confidence: 0,
      rationale: [`Game is not active (${snapshot.game.state}).`],
      availableActions,
    };
  }

  if (snapshot.paused) {
    return {
      actionable: false,
      action: null,
      target: null,
      confidence: 0,
      rationale: ['Game is paused.'],
      availableActions,
    };
  }

  if (player.actionSubmitted) {
    return {
      actionable: false,
      action: null,
      target: null,
      confidence: 0,
      rationale: ['Player already submitted an action this round.'],
      availableActions,
    };
  }

  const opponents = snapshot.players.filter(
    (entry) =>
      entry.address.toLowerCase() !== playerAddress.toLowerCase() &&
      entry.registered
  );
  const leader = pickTopTarget(player, opponents, snapshot.constants.totalLocks);
  const pickChance = player.stunned
    ? 0
    : Math.min(95, 40 + player.tools * 15);
  const searchChance = player.stunned ? 30 : 60;
  const behindBy = leader ? leader.locksCracked - player.locksCracked : 0;

  if (player.locksCracked >= snapshot.constants.totalLocks - 1 && !player.stunned) {
    return {
      actionable: true,
      action: 'PICK',
      target: null,
      confidence: 0.95,
      rationale: ['One successful pick ends the game immediately.'],
      availableActions,
      metrics: { pickChance, searchChance, behindBy },
    };
  }

  if (
    leader &&
    leader.locksCracked >= snapshot.constants.totalLocks - 1 &&
    availableActions.sabotageTargets.includes(leader.address)
  ) {
    return {
      actionable: true,
      action: 'SABOTAGE',
      target: leader.address,
      confidence: 0.92,
      rationale: ['Leading rival is one lock away from winning.'],
      availableActions,
      metrics: { pickChance, searchChance, behindBy },
    };
  }

  if (
    player.stunned &&
    leader &&
    availableActions.sabotageTargets.includes(leader.address)
  ) {
    return {
      actionable: true,
      action: 'SABOTAGE',
      target: leader.address,
      confidence: 0.74,
      rationale: [
        'Pick is disabled while stunned and search success is reduced.',
        'Sabotage still works while stunned and slows the leader.',
      ],
      availableActions,
      metrics: { pickChance, searchChance, behindBy },
    };
  }

  if (player.tools >= 3 && !player.stunned) {
    return {
      actionable: true,
      action: 'PICK',
      target: null,
      confidence: Math.max(0.7, pickChance / 100),
      rationale: ['Tool stack is strong enough to convert into lock progress.'],
      availableActions,
      metrics: { pickChance, searchChance, behindBy },
    };
  }

  if (
    leader &&
    behindBy >= 2 &&
    availableActions.sabotageTargets.includes(leader.address) &&
    (leader.tools > 0 || leader.locksCracked > player.locksCracked)
  ) {
    return {
      actionable: true,
      action: 'SABOTAGE',
      target: leader.address,
      confidence: 0.68,
      rationale: ['Leader has opened a meaningful gap.'],
      availableActions,
      metrics: { pickChance, searchChance, behindBy },
    };
  }

  if (player.tools === 0 || (player.tools <= 1 && pickChance < 70)) {
    return {
      actionable: true,
      action: 'SEARCH',
      target: null,
      confidence: Math.max(0.56, searchChance / 100),
      rationale: ['Current pick odds are weak; search improves future pressure.'],
      availableActions,
      metrics: { pickChance, searchChance, behindBy },
    };
  }

  if (player.tools >= 1 && !player.stunned) {
    return {
      actionable: true,
      action: 'PICK',
      target: null,
      confidence: pickChance / 100,
      rationale: ['Moderate tool count makes forward progress the best default.'],
      availableActions,
      metrics: { pickChance, searchChance, behindBy },
    };
  }

  return {
    actionable: true,
    action: 'SEARCH',
    target: null,
    confidence: searchChance / 100,
    rationale: ['Defaulting to search to improve next-round leverage.'],
    availableActions,
    metrics: { pickChance, searchChance, behindBy },
  };
}

export function normalizeActionCode(actionCode) {
  return ACTION_NAMES[actionCode] || 'UNKNOWN';
}

export function normalizeGameStateCode(stateCode) {
  return GAME_STATE_NAMES[stateCode] || 'UNKNOWN';
}
