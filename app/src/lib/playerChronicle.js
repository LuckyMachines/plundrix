const CHRONICLE_STORAGE_KEY = 'plundrix-rival-chronicle-v1';
const RIVALS = ['Rook', 'Mara', 'Vesper'];

function blankRival() {
  return { encounters: 0, playerWins: 0, rivalWins: 0, sabotagesGiven: 0, sabotagesReceived: 0, toolsStolen: 0, toolsLost: 0, grudge: 0 };
}

export function createChronicle() {
  return { version: 1, matches: 0, rivals: Object.fromEntries(RIVALS.map((name) => [name, blankRival()])) };
}

export function normalizeChronicle(value) {
  const fallback = createChronicle();
  if (!value || typeof value !== 'object') return fallback;
  return {
    version: 1,
    matches: Math.max(0, Math.floor(Number(value.matches) || 0)),
    rivals: Object.fromEntries(RIVALS.map((name) => {
      const record = value.rivals?.[name] || {};
      return [name, {
        encounters: Math.max(0, Math.floor(Number(record.encounters) || 0)),
        playerWins: Math.max(0, Math.floor(Number(record.playerWins) || 0)),
        rivalWins: Math.max(0, Math.floor(Number(record.rivalWins) || 0)),
        sabotagesGiven: Math.max(0, Math.floor(Number(record.sabotagesGiven) || 0)),
        sabotagesReceived: Math.max(0, Math.floor(Number(record.sabotagesReceived) || 0)),
        toolsStolen: Math.max(0, Math.floor(Number(record.toolsStolen) || 0)),
        toolsLost: Math.max(0, Math.floor(Number(record.toolsLost) || 0)),
        grudge: Math.max(0, Math.min(5, Math.floor(Number(record.grudge) || 0))),
      }];
    })),
  };
}

export function readChronicle(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return createChronicle();
  try {
    return normalizeChronicle(JSON.parse(storage.getItem(CHRONICLE_STORAGE_KEY)));
  } catch {
    return createChronicle();
  }
}

export function writeChronicle(value, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const next = normalizeChronicle(value);
  if (storage) storage.setItem(CHRONICLE_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function recordRivalryMatch(value, state) {
  const current = normalizeChronicle(value);
  const next = { ...current, matches: current.matches + 1, rivals: { ...current.rivals } };
  const events = state?.events || [];
  RIVALS.forEach((name, index) => {
    const rivalId = `player-${index + 2}`;
    const prior = current.rivals[name];
    const playerHits = events.filter((event) => event.type === 'PlayerSabotaged' && event.actor === 'player-1' && event.target === rivalId).length;
    const rivalHits = events.filter((event) => event.type === 'PlayerSabotaged' && event.actor === rivalId && event.target === 'player-1').length;
    const rivalWon = state?.winner === rivalId;
    const playerWon = state?.winner === 'player-1';
    const toolsStolen = events.filter((event) => event.type === 'ActionOutcome' && event.actor === 'player-1' && event.target === rivalId && event.reason === 'SABOTAGE_SUCCESS_STEAL').length;
    const toolsLost = events.filter((event) => event.type === 'ActionOutcome' && event.actor === rivalId && event.target === 'player-1' && event.reason === 'SABOTAGE_SUCCESS_STEAL').length;
    next.rivals[name] = {
      encounters: prior.encounters + 1,
      playerWins: prior.playerWins + (playerWon ? 1 : 0),
      rivalWins: prior.rivalWins + (rivalWon ? 1 : 0),
      sabotagesGiven: prior.sabotagesGiven + playerHits,
      sabotagesReceived: prior.sabotagesReceived + rivalHits,
      toolsStolen: prior.toolsStolen + toolsStolen,
      toolsLost: prior.toolsLost + toolsLost,
      grudge: Math.max(0, Math.min(5, prior.grudge + playerHits + rivalHits + (rivalWon ? 1 : 0) - (playerWon && !playerHits ? 1 : 0))),
    };
  });
  return next;
}

export function rivalTaunt(name, record = blankRival()) {
  if (!record.encounters) return `${name} has not learned your bad habits yet.`;
  if (record.grudge >= 4) return `${name} remembers every crossed wire. Especially yours.`;
  if (record.sabotagesGiven > record.sabotagesReceived) return `${name} is watching your hands, not the vault.`;
  if (record.rivalWins > record.playerWins) return `${name} calls the lead "temporary ownership."`;
  if (record.playerWins > record.rivalWins) return `${name} brought a new plan and an old grievance.`;
  return `${name} insists the score is merely suspicious.`;
}

export { CHRONICLE_STORAGE_KEY, RIVALS as RIVAL_NAMES };
