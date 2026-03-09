import { agentConfig } from './config.mjs';
import {
  getGameHistory,
  getGameSnapshot,
  getTotalGames,
} from './contract.mjs';
import {
  buildRegistryMap,
  getRegisteredProfile,
  loadPlayerRegistry,
} from './registry.mjs';

const BADGE_CATALOG = [
  {
    id: 'first-win',
    label: 'First Win',
    description: 'Won a live Plundrix session.',
  },
  {
    id: 'vaultbreaker',
    label: 'Vaultbreaker',
    description: 'Reached 5 career wins.',
  },
  {
    id: 'locksmith',
    label: 'Locksmith',
    description: 'Cracked 25 locks across sessions.',
  },
  {
    id: 'saboteur',
    label: 'Saboteur',
    description: 'Landed 10 sabotages.',
  },
  {
    id: 'ghost',
    label: 'Ghost',
    description: 'Completed 5 sessions without a missed action.',
  },
  {
    id: 'hot-streak',
    label: 'Hot Streak',
    description: 'Won 3 sessions in a row.',
  },
  {
    id: 'field-tested',
    label: 'Field Tested',
    description: 'Played 10 sessions.',
  },
  {
    id: 'synthetic-mind',
    label: 'Synthetic Mind',
    description: 'Agent or bot with 3 ladder wins.',
  },
];

const competitionCache = {
  expiresAt: 0,
  value: null,
};

function toLower(address) {
  return address.toLowerCase();
}

function sortByRecency(left, right) {
  return (right.completedAt || right.startedAt || right.createdAt || 0) -
    (left.completedAt || left.startedAt || left.createdAt || 0);
}

function makeDefaultProfile(address, registryEntry) {
  return {
    address,
    displayName:
      registryEntry?.displayName || `${address.slice(0, 6)}...${address.slice(-4)}`,
    type: registryEntry?.type || 'human',
    team: registryEntry?.team || null,
    bio: registryEntry?.bio || null,
    labels: registryEntry?.labels || [],
    season: makeStatBucket(),
    allTime: makeStatBucket(),
    recentSessions: [],
    recentForm: [],
    badges: [],
    title: 'Vault Rookie',
  };
}

function makeStatBucket() {
  return {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    points: 0,
    locksCracked: 0,
    toolsFound: 0,
    sabotages: 0,
    stunsReceived: 0,
    noSubmissions: 0,
    perfectSessions: 0,
    bestWinStreak: 0,
    currentWinStreak: 0,
    queueBreakdown: {
      open: 0,
      mixed: 0,
      agent_ladder: 0,
    },
    ladderWins: 0,
    ladderGames: 0,
  };
}

export function classifyQueue(players) {
  const participantTypes = players.map((player) => player.type || 'human');
  const nonHumans = participantTypes.filter((type) => type !== 'human').length;

  if (nonHumans === 0) return 'open';
  if (nonHumans === players.length) return 'agent_ladder';
  return 'mixed';
}

function getSeasonForTimestamp(timestamp) {
  const epoch = agentConfig.seasonEpochSeconds;
  const lengthSeconds = agentConfig.seasonLengthDays * 24 * 60 * 60;
  const safeTimestamp = Math.max(timestamp || epoch, epoch);
  const seasonIndex = Math.floor((safeTimestamp - epoch) / lengthSeconds);
  const startedAt = epoch + seasonIndex * lengthSeconds;
  const endsAt = startedAt + lengthSeconds;

  return {
    id: `season-${seasonIndex + 1}`,
    label: `Season ${seasonIndex + 1}`,
    index: seasonIndex + 1,
    startedAt,
    endsAt,
    durationDays: agentConfig.seasonLengthDays,
  };
}

function getCurrentSeason(nowSeconds = Math.floor(Date.now() / 1000)) {
  return getSeasonForTimestamp(nowSeconds);
}

function deriveTitle(points) {
  if (points >= 900) return 'Vault Legend';
  if (points >= 600) return 'Heist Architect';
  if (points >= 350) return 'Lock Runner';
  if (points >= 175) return 'Crew Tactician';
  return 'Vault Rookie';
}

export function derivePointsForSession(session, playerStats) {
  if (session.state !== 'COMPLETE') {
    return 0;
  }

  let points = 12;
  points += playerStats.locksCracked * 14;
  points += playerStats.toolsFound * 3;
  points += playerStats.sabotages * 6;

  if (session.winner?.toLowerCase() === playerStats.address.toLowerCase()) {
    points += 90;
  }

  if (playerStats.noSubmissions === 0) {
    points += 10;
  }

  if (session.queue === 'agent_ladder') {
    points += 8;
  } else if (session.queue === 'mixed') {
    points += 4;
  }

  return points;
}

function buildSession(snapshot, history, registryMap) {
  const players = snapshot.players.map((player) => {
    const registered = getRegisteredProfile(registryMap, player.address);
    return {
      address: player.address,
      displayName:
        registered?.displayName ||
        `${player.address.slice(0, 6)}...${player.address.slice(-4)}`,
      type: registered?.type || 'human',
      labels: registered?.labels || [],
      team: registered?.team || null,
      locksCracked: player.locksCracked,
      tools: player.tools,
      stunned: player.stunned,
      registered: player.registered,
      actionSubmitted: player.actionSubmitted,
    };
  });

  const createdAt =
    history.events.find((event) => event.name === 'GameCreated')?.args?.timeStamp || 0;
  const startedAt =
    history.events.find((event) => event.name === 'GameStarted')?.args?.timeStamp ||
    snapshot.game.roundStartTime ||
    createdAt;
  const wonEvent = history.events.find((event) => event.name === 'GameWon');
  const completedAt = wonEvent?.args?.timeStamp || null;
  const rounds =
    wonEvent?.args?.rounds ||
    history.events.filter((event) => event.name === 'RoundResolved').length ||
    snapshot.game.currentRound;
  const queue = classifyQueue(players);
  const season = getSeasonForTimestamp(completedAt || startedAt || createdAt);
  const statsByPlayer = new Map(
    players.map((player) => [
      toLower(player.address),
      {
        address: player.address,
        locksCracked: 0,
        toolsFound: 0,
        sabotages: 0,
        stunsReceived: 0,
        noSubmissions: 0,
      },
    ])
  );

  let locksCrackedTotal = 0;
  let toolsFoundTotal = 0;
  let sabotagesTotal = 0;
  let noSubmissionsTotal = 0;

  for (const event of history.events) {
    if (event.name === 'LockCracked') {
      locksCrackedTotal += 1;
      const stat = statsByPlayer.get(toLower(event.args.player));
      if (stat) stat.locksCracked += 1;
    }

    if (event.name === 'ToolFound') {
      toolsFoundTotal += 1;
      const stat = statsByPlayer.get(toLower(event.args.player));
      if (stat) stat.toolsFound += 1;
    }

    if (event.name === 'PlayerSabotaged') {
      sabotagesTotal += 1;
      const attacker = statsByPlayer.get(toLower(event.args.attacker));
      if (attacker) attacker.sabotages += 1;
      const victim = statsByPlayer.get(toLower(event.args.victim));
      if (victim) victim.stunsReceived += 1;
    }

    if (event.name === 'ActionOutcome' && event.args.reasonCode === 11) {
      noSubmissionsTotal += 1;
      const stat = statsByPlayer.get(toLower(event.args.player));
      if (stat) stat.noSubmissions += 1;
    }
  }

  const playerRows = players.map((player) => {
    const stat = statsByPlayer.get(toLower(player.address));
    const result =
      snapshot.game.state === 'COMPLETE'
        ? snapshot.game.winner.toLowerCase() === player.address.toLowerCase()
          ? 'winner'
          : 'finished'
        : snapshot.game.state === 'ACTIVE'
          ? 'active'
          : 'waiting';

    return {
      ...player,
      ...stat,
      points: derivePointsForSession(
        {
          state: snapshot.game.state,
          queue,
          winner: snapshot.game.winner,
        },
        stat
      ),
      result,
    };
  });

  return {
    gameId: snapshot.gameId,
    state: snapshot.game.state,
    queue,
    season,
    createdAt,
    startedAt,
    completedAt,
    winner: snapshot.game.winner,
    rounds,
    playerCount: players.length,
    players: playerRows,
    metrics: {
      locksCrackedTotal,
      toolsFoundTotal,
      sabotagesTotal,
      noSubmissionsTotal,
      roundResolutions: history.events.filter((event) => event.name === 'RoundResolved')
        .length,
    },
  };
}

function applySessionToBucket(bucket, session, player, winState) {
  bucket.gamesPlayed += 1;
  bucket.points += player.points;
  bucket.locksCracked += player.locksCracked;
  bucket.toolsFound += player.toolsFound;
  bucket.sabotages += player.sabotages;
  bucket.stunsReceived += player.stunsReceived;
  bucket.noSubmissions += player.noSubmissions;
  bucket.queueBreakdown[session.queue] += 1;

  if (session.queue === 'agent_ladder') {
    bucket.ladderGames += 1;
  }

  if (player.noSubmissions === 0 && session.state === 'COMPLETE') {
    bucket.perfectSessions += 1;
  }

  if (winState === 'win') {
    bucket.wins += 1;
    bucket.currentWinStreak += 1;
    bucket.bestWinStreak = Math.max(bucket.bestWinStreak, bucket.currentWinStreak);
    if (session.queue === 'agent_ladder') {
      bucket.ladderWins += 1;
    }
  } else if (session.state === 'COMPLETE') {
    bucket.losses += 1;
    bucket.currentWinStreak = 0;
  }
}

function assignBadges(profile) {
  const badges = [];
  const stats = profile.allTime;

  if (stats.wins >= 1) badges.push('first-win');
  if (stats.wins >= 5) badges.push('vaultbreaker');
  if (stats.locksCracked >= 25) badges.push('locksmith');
  if (stats.sabotages >= 10) badges.push('saboteur');
  if (stats.perfectSessions >= 5) badges.push('ghost');
  if (stats.bestWinStreak >= 3) badges.push('hot-streak');
  if (stats.gamesPlayed >= 10) badges.push('field-tested');
  if (profile.type !== 'human' && stats.ladderWins >= 3) {
    badges.push('synthetic-mind');
  }

  profile.badges = BADGE_CATALOG.filter((badge) => badges.includes(badge.id));
  profile.title = deriveTitle(profile.season.points);
}

export function buildCompetitionIndexFromGames(
  sessions,
  registry,
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  const registryMap = buildRegistryMap(registry);
  const profiles = new Map();
  const currentSeason = getCurrentSeason(nowSeconds);

  for (const session of [...sessions].sort((left, right) => {
    const leftTs = left.completedAt || left.startedAt || left.createdAt || 0;
    const rightTs = right.completedAt || right.startedAt || right.createdAt || 0;
    return leftTs - rightTs;
  })) {
    for (const player of session.players) {
      const lower = toLower(player.address);
      if (!profiles.has(lower)) {
        profiles.set(
          lower,
          makeDefaultProfile(player.address, getRegisteredProfile(registryMap, player.address))
        );
      }

      const profile = profiles.get(lower);
      const winState =
        session.state === 'COMPLETE'
          ? session.winner?.toLowerCase() === lower
            ? 'win'
            : 'loss'
          : 'pending';

      applySessionToBucket(profile.allTime, session, player, winState);

      if (session.season.id === currentSeason.id) {
        applySessionToBucket(profile.season, session, player, winState);
      }

      profile.recentSessions.unshift({
        gameId: session.gameId,
        queue: session.queue,
        state: session.state,
        result: winState,
        points: player.points,
        completedAt: session.completedAt,
        startedAt: session.startedAt,
      });
      profile.recentSessions = profile.recentSessions.slice(0, 8);

      if (winState !== 'pending') {
        profile.recentForm.unshift(winState === 'win' ? 'W' : 'L');
        profile.recentForm = profile.recentForm.slice(0, 5);
      }
    }
  }

  const profileList = [...profiles.values()].map((profile) => {
    assignBadges(profile);
    return {
      ...profile,
      season: {
        ...profile.season,
        winRate:
          profile.season.gamesPlayed > 0
            ? profile.season.wins / profile.season.gamesPlayed
            : 0,
      },
      allTime: {
        ...profile.allTime,
        winRate:
          profile.allTime.gamesPlayed > 0
            ? profile.allTime.wins / profile.allTime.gamesPlayed
            : 0,
      },
    };
  });

  const leaderboard = [...profileList]
    .sort((left, right) => {
      if (right.season.points !== left.season.points) {
        return right.season.points - left.season.points;
      }
      if (right.season.wins !== left.season.wins) {
        return right.season.wins - left.season.wins;
      }
      if (right.season.locksCracked !== left.season.locksCracked) {
        return right.season.locksCracked - left.season.locksCracked;
      }
      return left.address.localeCompare(right.address);
    })
    .map((profile, index) => ({
      rank: index + 1,
      address: profile.address,
      displayName: profile.displayName,
      type: profile.type,
      title: profile.title,
      points: profile.season.points,
      wins: profile.season.wins,
      gamesPlayed: profile.season.gamesPlayed,
      locksCracked: profile.season.locksCracked,
      sabotages: profile.season.sabotages,
      recentForm: profile.recentForm,
      badges: profile.badges.slice(0, 3),
    }));

  const agentLadder = [...profileList]
    .filter((profile) => profile.type !== 'human')
    .sort((left, right) => {
      if (right.season.ladderWins !== left.season.ladderWins) {
        return right.season.ladderWins - left.season.ladderWins;
      }
      if (right.season.points !== left.season.points) {
        return right.season.points - left.season.points;
      }
      return left.address.localeCompare(right.address);
    })
    .map((profile, index) => ({
      rank: index + 1,
      address: profile.address,
      displayName: profile.displayName,
      type: profile.type,
      ladderWins: profile.season.ladderWins,
      ladderGames: profile.season.ladderGames,
      points: profile.season.points,
      title: profile.title,
      badges: profile.badges.slice(0, 3),
    }));

  const queueBreakdown = sessions.reduce(
    (acc, session) => {
      acc[session.queue] += 1;
      return acc;
    },
    { open: 0, mixed: 0, agent_ladder: 0 }
  );

  return {
    season: currentSeason,
    generatedAt: nowSeconds,
    overview: {
      totalProfiles: profileList.length,
      totalSessions: sessions.length,
      completeSessions: sessions.filter((session) => session.state === 'COMPLETE').length,
      activeSessions: sessions.filter((session) => session.state === 'ACTIVE').length,
      queueBreakdown,
      totalPointsAwarded: leaderboard.reduce((sum, entry) => sum + entry.points, 0),
    },
    leaderboard,
    agentLadder,
    sessions: [...sessions].sort(sortByRecency),
    profiles: profileList.sort((left, right) =>
      left.displayName.localeCompare(right.displayName)
    ),
    badges: BADGE_CATALOG,
  };
}

async function computeCompetitionIndex() {
  const totalGames = await getTotalGames();
  const gameIds = Array.from({ length: totalGames }, (_, index) => index + 1);
  const registry = loadPlayerRegistry();
  const registryMap = buildRegistryMap(registry);
  const [snapshots, histories] = await Promise.all([
    Promise.all(gameIds.map((gameId) => getGameSnapshot(gameId))),
    Promise.all(gameIds.map((gameId) => getGameHistory(gameId, { fromBlock: 0n }))),
  ]);

  const sessions = snapshots.map((snapshot, index) =>
    buildSession(snapshot, histories[index], registryMap)
  );

  return buildCompetitionIndexFromGames(
    sessions,
    registry,
    Math.floor(Date.now() / 1000)
  );
}

export async function getCompetitionIndex() {
  const now = Date.now();
  if (competitionCache.value && now < competitionCache.expiresAt) {
    return competitionCache.value;
  }

  const nextValue = await computeCompetitionIndex();
  competitionCache.value = nextValue;
  competitionCache.expiresAt = now + agentConfig.competitionCacheMs;
  return nextValue;
}

export async function getCompetitionOverview() {
  const index = await getCompetitionIndex();
  return {
    season: index.season,
    generatedAt: index.generatedAt,
    overview: index.overview,
    featuredLeaderboard: index.leaderboard.slice(0, 5),
    featuredAgentLadder: index.agentLadder.slice(0, 5),
    featuredSessions: index.sessions.slice(0, 6),
  };
}

export async function getLeaderboard({
  queue = 'all',
  limit = 25,
} = {}) {
  const index = await getCompetitionIndex();

  const entries =
    queue === 'agent_ladder'
      ? index.agentLadder
      : index.leaderboard.filter((entry) => {
          if (queue === 'all') return true;
          if (queue === 'agents') return entry.type !== 'human';
          if (queue === 'humans') return entry.type === 'human';
          return true;
        });

  return {
    season: index.season,
    queue,
    count: Math.min(limit, entries.length),
    entries: entries.slice(0, Math.max(1, Math.min(100, Number(limit) || 25))),
  };
}

export async function getCompetitionSessions({
  state = 'all',
  queue = 'all',
  limit = 20,
} = {}) {
  const index = await getCompetitionIndex();
  const entries = index.sessions.filter((session) => {
    if (state !== 'all' && session.state.toLowerCase() !== state.toLowerCase()) {
      return false;
    }
    if (queue !== 'all' && session.queue !== queue) {
      return false;
    }
    return true;
  });

  return {
    season: index.season,
    state,
    queue,
    count: Math.min(limit, entries.length),
    sessions: entries.slice(0, Math.max(1, Math.min(100, Number(limit) || 20))),
  };
}

export async function getCompetitionProfile(address) {
  const index = await getCompetitionIndex();
  const profile = index.profiles.find(
    (entry) => entry.address.toLowerCase() === address.toLowerCase()
  );

  if (!profile) {
    throw new Error('Profile not found');
  }

  const seasonRank =
    index.leaderboard.find((entry) => entry.address.toLowerCase() === address.toLowerCase())
      ?.rank || null;
  const ladderRank =
    index.agentLadder.find((entry) => entry.address.toLowerCase() === address.toLowerCase())
      ?.rank || null;

  return {
    season: index.season,
    seasonRank,
    ladderRank,
    profile,
  };
}

export async function getBadgeCatalog() {
  return {
    badges: BADGE_CATALOG,
  };
}
