export const LIVE_TELEMETRY_SCHEMA_VERSION = 1;
export const LIVE_TELEMETRY_STORAGE_KEY = 'plundrix-live-telemetry-events:v1';

export const LIVE_EVENT_TYPES = Object.freeze([
  'GameCreated',
  'PlayerJoined',
  'GameStarted',
  'RoundStarted',
  'ActionSubmitted',
  'ActionOutcome',
  'PickResolved',
  'SearchResolved',
  'SabotageResolved',
  'LockCracked',
  'ToolFound',
  'PlayerStunned',
  'PlayerSabotaged',
  'RoundResolved',
  'GameWon',
  'ReplayGenerated',
]);

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
  return (hash >>> 0).toString(16);
}

function normalizeAction(action) {
  const value = String(action ?? '').toLowerCase();
  if (['0', 'none'].includes(value)) return 'none';
  if (['1', 'pick'].includes(value)) return 'pick';
  if (['2', 'search'].includes(value)) return 'search';
  if (['3', 'sabotage'].includes(value)) return 'sabotage';
  return value || 'unknown';
}

export function normalizeLiveEvent(input = {}) {
  const type = input.type || input.name || 'ActionOutcome';
  const args = input.args || {};
  const timestamp = input.timestamp || input.createdAt || nowIso();
  const event = {
    schemaVersion: LIVE_TELEMETRY_SCHEMA_VERSION,
    id: input.id || `live-event-${hashString(JSON.stringify({ type, args, timestamp, payload: input.payload }))}`,
    type,
    gameId: String(input.gameId ?? args.gameID ?? args.gameId ?? ''),
    round: Number(input.round ?? args.round ?? 0),
    player: input.player || args.player || args.winner || args.attacker || '',
    target: input.target || args.target || args.victim || '',
    action: normalizeAction(input.action ?? args.action),
    timestamp,
    source: input.source || 'local',
    payload: input.payload || args || {},
  };
  if (!LIVE_EVENT_TYPES.includes(event.type)) {
    event.type = 'ActionOutcome';
    event.payload.originalType = type;
  }
  return event;
}

function readStoredEvents() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  const raw = window.localStorage.getItem(LIVE_TELEMETRY_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeStoredEvents(events) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  window.localStorage.setItem(LIVE_TELEMETRY_STORAGE_KEY, JSON.stringify(events.slice(-1000)));
  window.dispatchEvent(new CustomEvent('plundrix:live-telemetry-updated'));
  return true;
}

export function recordGameEvent(input) {
  const event = normalizeLiveEvent(input);
  const events = [...readStoredEvents().filter((item) => item.id !== event.id), event];
  writeStoredEvents(events);
  return event;
}

export function listGameEvents() {
  return readStoredEvents().map(normalizeLiveEvent);
}

export function summarizeLiveEvents(events = []) {
  const normalized = events.map(normalizeLiveEvent);
  const games = new Map();
  const actionCounts = { pick: 0, search: 0, sabotage: 0, none: 0, unknown: 0 };
  let stuns = 0;
  let sabotages = 0;
  let replayGenerated = 0;

  for (const event of normalized) {
    const gameId = event.gameId || event.id;
    if (!games.has(gameId)) {
      games.set(gameId, { gameId, rounds: new Set(), players: new Set(), completed: false, winner: '', firstAt: event.timestamp, lastAt: event.timestamp });
    }
    const game = games.get(gameId);
    if (event.round) game.rounds.add(event.round);
    if (event.player) game.players.add(event.player);
    if (event.target) game.players.add(event.target);
    game.lastAt = event.timestamp;
    if (event.type === 'GameWon') {
      game.completed = true;
      game.winner = event.player;
    }
    if (event.type === 'ReplayGenerated') replayGenerated += 1;
    if (event.type === 'PlayerStunned') stuns += 1;
    if (event.type === 'PlayerSabotaged' || event.type === 'SabotageResolved') sabotages += 1;
    if (event.type === 'ActionSubmitted' || event.type === 'ActionOutcome') {
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
    }
  }

  const gameList = [...games.values()];
  const completedGames = gameList.filter((game) => game.completed);
  const totalRounds = gameList.reduce((sum, game) => sum + game.rounds.size, 0);
  return {
    eventCount: normalized.length,
    sessionsObserved: gameList.length,
    completedGames: completedGames.length,
    completionRate: gameList.length ? completedGames.length / gameList.length : 0,
    averageRounds: gameList.length ? totalRounds / gameList.length : 0,
    actionCounts,
    stunRate: normalized.length ? stuns / normalized.length : 0,
    sabotageRate: normalized.length ? sabotages / normalized.length : 0,
    replayGenerated,
    dropOffPoints: gameList.filter((game) => !game.completed).map((game) => ({ gameId: game.gameId, lastRound: Math.max(0, ...game.rounds) })),
  };
}

export function buildLiveHealthReport(events = []) {
  const summary = summarizeLiveEvents(events);
  const score = Math.round(Math.min(100, summary.sessionsObserved * 15 + summary.completionRate * 45 + Math.min(20, summary.replayGenerated * 10)));
  return {
    schemaVersion: LIVE_TELEMETRY_SCHEMA_VERSION,
    generatedAt: nowIso(),
    connected: summary.eventCount > 0,
    status: score >= 75 ? 'green' : score >= 50 ? 'yellow' : summary.eventCount ? 'orange' : 'red',
    score,
    summary,
  };
}
