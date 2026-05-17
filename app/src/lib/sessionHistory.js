const STORAGE_KEY = 'plundrix.sessionHistory.v1';
const MAX_RECORDS = 600;

function normalizeAddress(address) {
  return address?.toLowerCase?.() || '';
}

function readRecords() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecords(records) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
  window.dispatchEvent(new CustomEvent('plundrix:session-history-updated'));
}

export function getSessionHistoryRecords() {
  return readRecords();
}

export function appendSessionCueRecord({ session, cue }) {
  if (!session?.gameId || !cue?.id) return;

  const records = readRecords();
  if (records.some((record) => record.id === cue.id && String(record.gameId) === String(session.gameId))) {
    return;
  }

  writeRecords([
    ...records,
    {
      id: cue.id,
      gameId: String(session.gameId),
      round: session.currentRound,
      timestamp: Date.now(),
      type: cue.type,
      sound: cue.sound,
      actor: cue.actor || null,
      target: cue.target || null,
      success: cue.success ?? null,
      reason: cue.reason ?? null,
      total: cue.total ?? null,
      mode: session.mode,
    },
  ]);
}

export function summarizeSessionHistory(records = []) {
  const byAddress = new Map();
  const byGame = new Map();

  const ensureAddress = (address) => {
    const key = normalizeAddress(address);
    if (!key) return null;
    if (!byAddress.has(key)) {
      byAddress.set(key, {
        address,
        games: new Set(),
        events: 0,
        locksCracked: 0,
        toolsFound: 0,
        sabotages: 0,
        stunned: 0,
        wins: 0,
        commits: 0,
        noSubmissions: 0,
        lastSeen: 0,
      });
    }
    return byAddress.get(key);
  };

  records.forEach((record) => {
    if (!byGame.has(record.gameId)) {
      byGame.set(record.gameId, {
        gameId: record.gameId,
        rounds: new Set(),
        players: new Set(),
        locks: 0,
        tools: 0,
        sabotages: 0,
        winner: null,
        lastSeen: 0,
      });
    }

    const game = byGame.get(record.gameId);
    if (record.round !== undefined) game.rounds.add(record.round);
    if (record.actor) game.players.add(normalizeAddress(record.actor));
    if (record.target) game.players.add(normalizeAddress(record.target));
    game.lastSeen = Math.max(game.lastSeen, record.timestamp || 0);

    const actor = ensureAddress(record.actor);
    if (actor) {
      actor.events += 1;
      actor.games.add(record.gameId);
      actor.lastSeen = Math.max(actor.lastSeen, record.timestamp || 0);
    }

    const target = ensureAddress(record.target);
    if (target) {
      target.games.add(record.gameId);
      target.lastSeen = Math.max(target.lastSeen, record.timestamp || 0);
    }

    if (record.type === 'lock.crack') {
      if (actor) actor.locksCracked += 1;
      game.locks += 1;
    }
    if (record.type === 'tool.found') {
      if (actor) actor.toolsFound += 1;
      game.tools += 1;
    }
    if (record.type === 'sabotage.hit') {
      if (actor) actor.sabotages += 1;
      if (target) target.stunned += 1;
      game.sabotages += 1;
    }
    if (record.type === 'player.stunned' && actor) {
      actor.stunned += 1;
    }
    if (record.type === 'action.commit' && actor) {
      actor.commits += 1;
    }
    if (record.type === 'action.outcome' && record.reason === 11 && actor) {
      actor.noSubmissions += 1;
    }
    if (record.type === 'game.win' && actor) {
      actor.wins += 1;
      game.winner = actor.address;
    }
  });

  const profiles = Array.from(byAddress.values()).map((stats) => ({
    ...stats,
    gamesPlayed: stats.games.size,
    games: undefined,
    playstyleScore:
      stats.wins * 25 +
      stats.locksCracked * 8 +
      stats.toolsFound * 5 +
      stats.sabotages * 7 -
      stats.noSubmissions * 4,
  }));

  const sessions = Array.from(byGame.values())
    .map((game) => ({
      ...game,
      rounds: game.rounds.size,
      playerCount: game.players.size,
      players: undefined,
    }))
    .sort((a, b) => b.lastSeen - a.lastSeen);

  return {
    profiles: profiles.sort((a, b) => b.playstyleScore - a.playstyleScore),
    sessions,
  };
}

export function getProfileHistory(address, records = readRecords()) {
  const key = normalizeAddress(address);
  const summary = summarizeSessionHistory(records);
  return summary.profiles.find((profile) => normalizeAddress(profile.address) === key) || null;
}
