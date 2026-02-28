export const Action = { NONE: 0, PICK: 1, SEARCH: 2, SABOTAGE: 3 };
export const GameState = { OPEN: 0, ACTIVE: 1, COMPLETE: 2 };
export const OutcomeReason = {
  NONE: 0,
  PICK_SUCCESS: 1,
  PICK_FAILED_STUNNED: 2,
  PICK_FAILED_ROLL: 3,
  SEARCH_SUCCESS: 4,
  SEARCH_FAILED_ROLL: 5,
  SEARCH_FAILED_MAX_TOOLS: 6,
  SABOTAGE_FAILED_INVALID_TARGET: 7,
  SABOTAGE_SUCCESS_STEAL: 8,
  SABOTAGE_SUCCESS_STUN_ONLY: 9,
  SABOTAGE_SUCCESS_NO_TOOL: 10,
  NO_SUBMISSION: 11,
};
export const TOTAL_LOCKS = 5;
export const MAX_TOOLS = 5;
export const MAX_GAME_PLAYERS = 4;
export const MIN_GAME_PLAYERS = 2;
export const ROUND_TIMEOUT = 300; // 5 minutes in seconds

export const ACTION_LABELS = {
  [Action.NONE]: 'No Action',
  [Action.PICK]: 'Set Tension',
  [Action.SEARCH]: 'Sweep Compartment',
  [Action.SABOTAGE]: 'Cut Line',
};

export const OUTCOME_REASON_LABELS = {
  [OutcomeReason.PICK_SUCCESS]: 'Lock cracked',
  [OutcomeReason.PICK_FAILED_STUNNED]: 'Stunned: pick auto-failed',
  [OutcomeReason.PICK_FAILED_ROLL]: 'Lock held this round',
  [OutcomeReason.SEARCH_SUCCESS]: 'Tool recovered',
  [OutcomeReason.SEARCH_FAILED_ROLL]: 'No tool found',
  [OutcomeReason.SEARCH_FAILED_MAX_TOOLS]: 'Tool tray full',
  [OutcomeReason.SABOTAGE_FAILED_INVALID_TARGET]: 'Target invalid',
  [OutcomeReason.SABOTAGE_SUCCESS_STEAL]: 'Target stunned and tool stolen',
  [OutcomeReason.SABOTAGE_SUCCESS_STUN_ONLY]: 'Target stunned',
  [OutcomeReason.SABOTAGE_SUCCESS_NO_TOOL]: 'Target stunned, no tool to steal',
  [OutcomeReason.NO_SUBMISSION]: 'No action submitted',
};

export const STATE_LABELS = {
  [GameState.OPEN]: 'OPEN',
  [GameState.ACTIVE]: 'ACTIVE',
  [GameState.COMPLETE]: 'COMPLETE',
};

export const TOOL_NAMES = [
  'Torsion Wrench',
  'Rake',
  'Probe',
  'Shim',
  'Pick Gun',
];
