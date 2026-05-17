import {
  SIM_ACTION,
  SIM_ACTION_LABEL,
  SIM_DEFAULT_RULES,
  buildFunCurve,
  buildReplayConfig,
  compareRulesets,
  normalizeRuleset,
  runBatch,
  runSimulation,
  summarizeSimulation,
} from './plundrixEngine.js';
import {
  buildGhostHighlights,
  buildGhostReplayMetadata,
  runGhostMatch,
} from './playerTelemetryGhosts.js';

export const REPLAY_SCHEMA_VERSION = 1;
export const REPLAY_LIBRARY_KEY = 'plundrix-replay-library:v1';

export const REPLAY_CAPTURE_PRESETS = Object.freeze({
  desktop: { width: 1440, height: 1100 },
  mobile: { width: 390, height: 844 },
  socialSquare: { width: 1080, height: 1080 },
  socialVertical: { width: 1080, height: 1920 },
});

const SUBJECTIVE_FIELDS = ['funny', 'tense', 'confusing', 'tooSlow', 'satisfyingFinish', 'goodMarketingClip'];
const OFFICIAL_STATES = ['generated', 'reviewed', 'pinned', 'gallery', 'marketing', 'archived'];

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

function encodeBase64(text) {
  if (typeof btoa === 'function') {
    return btoa(text);
  }
  return Buffer.from(text, 'utf8').toString('base64');
}

function decodeBase64(text) {
  if (typeof atob === 'function') {
    return atob(text);
  }
  return Buffer.from(text, 'base64').toString('utf8');
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function playerById(players = [], id) {
  return players.find((player) => player.id === id);
}

function leaderFromPlayers(players = []) {
  const sorted = [...players].sort((a, b) => b.locksCracked - a.locksCracked || b.tools - a.tools);
  const leader = sorted[0] || null;
  const second = sorted[1] || null;
  return {
    leader,
    lead: leader ? leader.locksCracked - (second?.locksCracked || 0) : 0,
  };
}

export function getReplayId(config = {}) {
  const payload = JSON.stringify({
    seed: config.seed,
    scenarioId: config.scenarioId,
    rules: normalizeRuleset(config.rules || SIM_DEFAULT_RULES),
    strategies: config.strategies || [],
  });
  return `replay-${hashString(payload).toString(16).padStart(8, '0')}`;
}

function replayConfigFromState(state, options = {}) {
  return {
    seed: state.seed,
    scenarioId: state.scenarioId,
    rules: state.rules,
    strategies: options.strategies || ['balanced', 'picker', 'searcher', 'saboteur'],
    maxRounds: options.maxRounds || state.roundHistory.length || 40,
  };
}

function actionText(item) {
  const actor = item.playerName || 'A player';
  const target = item.targetName ? ` ${item.targetName}` : '';
  if (item.action === SIM_ACTION.PICK && item.success) {
    if (item.after?.locksCracked >= item.rules.totalLocks - 1) {
      return `${actor} cracked lock ${item.after.locksCracked} and moved within one of victory.`;
    }
    return `${actor} cracked a lock.`;
  }
  if (item.action === SIM_ACTION.PICK) {
    return item.before?.locksCracked >= item.rules.totalLocks - 1
      ? `${actor} missed a clutch pick at the edge of victory.`
      : `${actor} failed to pick the vault.`;
  }
  if (item.action === SIM_ACTION.SEARCH && item.success) {
    return `${actor} found a tool and improved their next pick chance.`;
  }
  if (item.action === SIM_ACTION.SEARCH) {
    return `${actor} searched but came up empty.`;
  }
  if (item.action === SIM_ACTION.SABOTAGE && item.success) {
    return item.reason === 'SABOTAGE_SUCCESS_STEAL'
      ? `${actor} stunned${target} and stole a tool.`
      : `${actor} stunned${target}.`;
  }
  if (item.action === SIM_ACTION.SABOTAGE) {
    return `${actor} wasted a sabotage attempt.`;
  }
  return item.message || `${actor} did not act.`;
}

function roundSnapshot(state, round) {
  const curve = buildFunCurve(state);
  const point = curve[round.round - 1] || {};
  const after = round.players || [];
  const before = round.beforePlayers || after;
  const { leader, lead } = leaderFromPlayers(after);
  return {
    round: round.round,
    beforePlayers: before,
    afterPlayers: after,
    leader: leader?.id || null,
    leaderName: leader?.name || null,
    lead,
    tension: point.tension || 0,
    tensionLabel: labelTension(point.tension || 0, round.round, state.roundHistory.length),
  };
}

export function buildReplayTimeline(state) {
  const timeline = [];
  for (const round of state.roundHistory || []) {
    const snapshot = roundSnapshot(state, round);
    for (const event of round.events || []) {
      if (!['ActionOutcome', 'LockCracked', 'ToolFound', 'PlayerSabotaged', 'PlayerStunned', 'GameWon', 'RoundResolved'].includes(event.type)) {
        continue;
      }
      const before = playerById(snapshot.beforePlayers, event.actor);
      const after = playerById(snapshot.afterPlayers, event.actor);
      const targetBefore = playerById(snapshot.beforePlayers, event.target);
      const targetAfter = playerById(snapshot.afterPlayers, event.target);
      const item = {
        round: round.round,
        playerId: event.actor || null,
        playerName: before?.name || after?.name || null,
        type: event.type,
        action: event.action ?? null,
        actionLabel: event.action ? SIM_ACTION_LABEL[event.action] : event.type,
        targetId: event.target || null,
        targetName: targetBefore?.name || targetAfter?.name || null,
        success: Boolean(event.success),
        reason: event.reason || null,
        roll: event.roll ?? null,
        chance: event.chance ?? null,
        before,
        after,
        targetBefore,
        targetAfter,
        snapshot,
        rules: state.rules,
        message: event.message,
        text: event.message || '',
        importance: 0,
      };
      item.text = actionText(item);
      item.importance = timelineEventImportance(item, state);
      timeline.push(item);
    }
  }
  return timeline;
}

function timelineEventImportance(item, state) {
  let score = 10;
  if (item.type === 'GameWon') score += 90;
  if (item.action === SIM_ACTION.PICK && item.success) score += 20;
  if (item.action === SIM_ACTION.PICK && item.after?.locksCracked >= state.rules.totalLocks - 1) score += 28;
  if (item.action === SIM_ACTION.PICK && !item.success && item.before?.locksCracked >= state.rules.totalLocks - 1) score += 35;
  if (item.action === SIM_ACTION.SABOTAGE && item.success) score += 24;
  if (item.reason === 'SABOTAGE_SUCCESS_STEAL') score += 16;
  if (item.snapshot.tension >= 80) score += 18;
  if (item.roll !== null && item.chance !== null && Math.abs(item.chance - item.roll) <= 4) score += 14;
  return Math.min(100, score);
}

export function labelTension(tension, round = 1, totalRounds = 1) {
  if (round >= totalRounds - 1 && tension >= 65) return 'finale';
  if (tension >= 85) return 'critical';
  if (tension >= 68) return 'volatile';
  if (tension >= 45) return 'building';
  return 'quiet';
}

function makeHighlight(type, item, extra = {}) {
  const labels = {
    firstLock: 'First lock cracked',
    firstLeader: 'First leader',
    leadChange: 'Lead change',
    tieForLead: 'Tie for lead',
    nearWin: 'Near win',
    finalRound: 'Final round',
    comebackStart: 'Comeback turn',
    sabotageSwing: 'Sabotage swing',
    wastedSabotage: 'Wasted sabotage',
    clutchPick: 'Clutch pick',
    failedClutchPick: 'Failed clutch pick',
    maxTools: 'Max tools',
    stunChain: 'Stun chain',
    longStall: 'Long stall',
    fastWin: 'Fast win',
    closeFinish: 'Close finish',
  };
  const social = {
    firstLock: 'The vault opens first',
    firstLeader: 'First breakaway',
    leadChange: 'The lead flips',
    tieForLead: 'Dead even',
    nearWin: 'One lock left',
    finalRound: 'Final vault crack',
    comebackStart: 'Comeback begins',
    sabotageSwing: 'Sabotage changes everything',
    wastedSabotage: 'Bad read',
    clutchPick: 'Clutch',
    failedClutchPick: 'Heartbreak',
    maxTools: 'Fully loaded',
    stunChain: 'Stun chain',
    longStall: 'Vault refuses to fall',
    fastWin: 'Speed run',
    closeFinish: 'Photo finish',
  };
  return {
    id: `${type}-${item.round}-${hashString(item.text || item.type).toString(16)}`,
    round: item.round,
    type,
    category: highlightCategory(type),
    replayLabel: labels[type] || type,
    socialLabel: social[type] || labels[type] || type,
    text: extra.text || item.text,
    importance: Math.min(100, extra.importance ?? item.importance ?? 50),
    timelineItem: item,
    ...extra,
  };
}

function highlightCategory(type) {
  if (['sabotageSwing', 'wastedSabotage', 'stunChain'].includes(type)) return 'sabotage';
  if (['clutchPick', 'failedClutchPick', 'nearWin', 'finalRound'].includes(type)) return 'clutch';
  if (['comebackStart', 'leadChange', 'tieForLead'].includes(type)) return 'momentum';
  if (['longStall', 'fastWin', 'closeFinish'].includes(type)) return 'pace';
  return 'setup';
}

export function detectReplayHighlights(state, timeline = buildReplayTimeline(state)) {
  const highlights = [];
  const seen = new Set();
  const add = (type, item, extra) => {
    const key = `${type}-${item.round}-${item.playerId || ''}-${item.targetId || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      highlights.push(makeHighlight(type, item, extra));
    }
  };
  let previousLeader = null;
  let firstLockAdded = false;
  const rounds = state.roundHistory || [];

  for (const item of timeline) {
    if (!firstLockAdded && item.type === 'LockCracked') {
      firstLockAdded = true;
      add('firstLock', item, { importance: 72 });
    }
    if (item.snapshot.leader && !previousLeader) {
      previousLeader = item.snapshot.leader;
      add('firstLeader', item, { text: `${item.snapshot.leaderName} became the first clear leader.`, importance: 58 });
    } else if (item.snapshot.leader && previousLeader && item.snapshot.leader !== previousLeader) {
      previousLeader = item.snapshot.leader;
      add('leadChange', item, { text: `${item.snapshot.leaderName} took over the lead.`, importance: 78 });
    }
    const leaders = item.snapshot.afterPlayers.filter((player) => player.locksCracked === Math.max(...item.snapshot.afterPlayers.map((p) => p.locksCracked)));
    if (leaders.length > 1 && leaders[0]?.locksCracked > 0) {
      add('tieForLead', item, { text: `${leaders.length} players tied for the vault lead.`, importance: 52 });
    }
    if (item.after?.locksCracked >= state.rules.totalLocks - 1) {
      add('nearWin', item, { importance: 82 });
    }
    if (item.action === SIM_ACTION.SABOTAGE && item.success && (item.targetBefore?.locksCracked >= state.rules.totalLocks - 1 || item.reason === 'SABOTAGE_SUCCESS_STEAL')) {
      add('sabotageSwing', item, { importance: 88 });
    }
    if (item.reason === 'SABOTAGE_SUCCESS_NO_TOOL') {
      add('wastedSabotage', item, { importance: 36 });
    }
    if (item.action === SIM_ACTION.PICK && item.success && item.before?.locksCracked >= state.rules.totalLocks - 1) {
      add('clutchPick', item, { importance: 94 });
    }
    if (item.action === SIM_ACTION.PICK && !item.success && item.before?.locksCracked >= state.rules.totalLocks - 1) {
      add('failedClutchPick', item, { importance: 91 });
    }
    if (item.after?.tools >= state.rules.maxTools) {
      add('maxTools', item, { importance: 46 });
    }
  }

  const finalItem = timeline.findLast?.((item) => item.type === 'GameWon') || timeline[timeline.length - 1];
  if (finalItem) {
    add('finalRound', finalItem, { importance: 100 });
  }
  if (isCloseFinish(state)) {
    add('closeFinish', finalItem || { round: rounds.length, text: 'Close finish', type: 'closeFinish' }, {
      text: 'At least two players were within one lock of winning near the end.',
      importance: 86,
    });
  }
  if (hasComebackArc(state)) {
    const midpoint = Math.max(0, Math.floor(rounds.length / 2) - 1);
    const item = timeline.find((entry) => entry.round >= rounds[midpoint]?.round) || finalItem;
    add('comebackStart', item, { text: 'The eventual winner began a comeback after trailing at midpoint.', importance: 84 });
  }
  const stunRounds = rounds.filter((round) => round.events.filter((event) => event.type === 'PlayerStunned').length >= 2);
  if (stunRounds.length) {
    const item = timeline.find((entry) => entry.round === stunRounds[0].round) || finalItem;
    add('stunChain', item, { text: 'Multiple stuns landed in the same round.', importance: 64 });
  }
  if (rounds.length > state.rules.maxHealthyRounds) {
    add('longStall', finalItem || { round: rounds.length, text: 'Long stall', type: 'longStall' }, {
      text: `The vault held for ${rounds.length} rounds.`,
      importance: 62,
    });
  }
  if (rounds.length < state.rules.minHealthyRounds) {
    add('fastWin', finalItem || { round: rounds.length, text: 'Fast win', type: 'fastWin' }, {
      text: `The vault fell in only ${rounds.length} rounds.`,
      importance: 58,
    });
  }

  return highlights.sort((a, b) => b.importance - a.importance);
}

export function isCloseFinish(state) {
  const finalRound = state.roundHistory[state.roundHistory.length - 1];
  if (!finalRound) return false;
  return finalRound.players.filter((player) => player.locksCracked >= state.rules.totalLocks - 1).length >= 2;
}

export function hasComebackArc(state) {
  if (!state.winner || state.roundHistory.length < 4) return false;
  const midpoint = state.roundHistory[Math.floor(state.roundHistory.length / 2)];
  const winnerMid = playerById(midpoint.players, state.winner);
  const leaderLocks = Math.max(...midpoint.players.map((player) => player.locksCracked));
  return Boolean(winnerMid && leaderLocks - winnerMid.locksCracked >= 2);
}

export function scoreReplayDrama(state, timeline = buildReplayTimeline(state), highlights = detectReplayHighlights(state, timeline)) {
  const curve = buildFunCurve(state);
  const leadChanges = curve.reduce((sum, point) => sum + point.leadChange, 0);
  const nearWins = highlights.filter((item) => item.type === 'nearWin').length;
  const sabotageSwings = highlights.filter((item) => item.type === 'sabotageSwing').length;
  const clutch = highlights.filter((item) => ['clutchPick', 'failedClutchPick'].includes(item.type)).length;
  const closeFinish = isCloseFinish(state) ? 1 : 0;
  const comeback = hasComebackArc(state) ? 1 : 0;
  const avgTension = average(curve.map((point) => point.tension));
  const stallPenalty = state.roundHistory.length > state.rules.maxHealthyRounds ? 12 : 0;
  const shortPenalty = state.roundHistory.length < state.rules.minHealthyRounds ? 8 : 0;
  return Math.max(
    0,
    Math.min(
      100,
      avgTension * 0.42 +
        leadChanges * 7 +
        nearWins * 5 +
        sabotageSwings * 9 +
        clutch * 8 +
        closeFinish * 12 +
        comeback * 14 -
        stallPenalty -
        shortPenalty,
    ),
  );
}

export function extractReplayBeats(state, timeline, highlights) {
  const sorted = [...highlights].sort((a, b) => a.round - b.round || b.importance - a.importance);
  const finalHighlight = highlights.find((item) => item.type === 'finalRound') || sorted[sorted.length - 1];
  const beats = [
    { id: 'setup', label: 'Setup', round: 1, text: `${state.players.length} players enter the vault race.` },
  ];
  for (const highlight of sorted) {
    if (beats.length >= 7) break;
    if (['firstLock', 'leadChange', 'sabotageSwing', 'comebackStart', 'failedClutchPick', 'clutchPick', 'nearWin'].includes(highlight.type)) {
      beats.push({
        id: `${highlight.type}-${highlight.round}`,
        label: highlight.replayLabel,
        round: highlight.round,
        text: highlight.text,
      });
    }
  }
  if (finalHighlight && !beats.some((beat) => beat.id === `finish-${finalHighlight.round}`)) {
    beats.push({
      id: `finish-${finalHighlight.round}`,
      label: 'Finish',
      round: finalHighlight.round,
      text: finalHighlight.text,
    });
  }
  return beats.slice(0, 8);
}

function buildReplayTitle(state, highlights) {
  const winner = playerById(state.players, state.winner);
  if (highlights.some((item) => item.type === 'comebackStart')) {
    return `${winner?.name || 'A player'}'s comeback run`;
  }
  const sabotage = highlights.find((item) => item.type === 'sabotageSwing');
  if (sabotage) {
    return `The round ${sabotage.round} sabotage swing`;
  }
  const failed = highlights.find((item) => item.type === 'failedClutchPick');
  if (failed) {
    return `One failed pick from victory`;
  }
  if (isCloseFinish(state)) {
    return `A vault race decided at the wire`;
  }
  return `${winner?.name || 'The winner'} cracks the vault`;
}

function buildReplaySubtitle(state, highlights) {
  const winner = playerById(state.players, state.winner);
  const primary = highlights[0]?.replayLabel || 'Replay';
  return `${state.scenarioId} / ${state.roundHistory.length} rounds / ${winner?.name || 'no winner'} / ${primary}`;
}

function buildReplaySummary(state, highlights, dramaticScore) {
  const winner = playerById(state.players, state.winner);
  const leadChanges = buildFunCurve(state).reduce((sum, point) => sum + point.leadChange, 0);
  const primary = highlights[0]?.text || 'The vault race resolved cleanly.';
  return `${primary} ${winner?.name || 'No player'} finished after ${state.roundHistory.length} rounds with a Replay Director score of ${dramaticScore.toFixed(1)} and ${leadChanges} lead changes.`;
}

function replayTags(state, highlights) {
  const tags = new Set();
  if (hasComebackArc(state)) tags.add('comeback');
  if (isCloseFinish(state)) tags.add('close-finish');
  if (highlights.some((item) => item.type === 'sabotageSwing')) tags.add('sabotage-heavy');
  if (state.roundHistory.length < state.rules.minHealthyRounds) tags.add('short');
  if (state.roundHistory.length > state.rules.maxHealthyRounds) tags.add('long');
  if (highlights.some((item) => item.type === 'wastedSabotage')) tags.add('weird');
  if (highlights.some((item) => item.type === 'clutchPick')) tags.add('clean-ending');
  if (average(buildFunCurve(state).map((point) => point.tension)) >= 70) tags.add('high-tension');
  return [...tags];
}

export function buildShareUrl(config = {}, basePath = '/replay') {
  const payload = {
    seed: config.seed,
    scenarioId: config.scenarioId,
    strategies: config.strategies,
    rules: normalizeRuleset(config.rules || SIM_DEFAULT_RULES),
    highlightedRound: config.highlightedRound || null,
  };
  const replay = encodeBase64(JSON.stringify(payload));
  const id = getReplayId(payload);
  return `${basePath}/${id}?replay=${encodeURIComponent(replay)}`;
}

export function parseReplayPayload(search = '') {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const encoded = params.get('replay');
  if (!encoded) return null;
  return JSON.parse(decodeBase64(decodeURIComponent(encoded)));
}

export function buildReplayFromSimulation(state, options = {}) {
  const config = replayConfigFromState(state, options);
  const timeline = buildReplayTimeline(state);
  const ghostHighlights = options.ghostMatch ? buildGhostHighlights(options.ghostMatch) : [];
  const highlights = [...detectReplayHighlights(state, timeline), ...ghostHighlights]
    .sort((a, b) => b.importance - a.importance);
  const dramaticScore = scoreReplayDrama(state, timeline, highlights);
  const beats = extractReplayBeats(state, timeline, highlights);
  const id = getReplayId(config);
  const shareUrl = buildShareUrl(config);
  const replay = {
    schemaVersion: REPLAY_SCHEMA_VERSION,
    id,
    sourceType: options.sourceType || 'single simulation',
    seed: state.seed,
    scenarioId: state.scenarioId,
    rules: state.rules,
    strategies: config.strategies,
    summary: summarizeSimulation(state),
    title: buildReplayTitle(state, highlights),
    subtitle: buildReplaySubtitle(state, highlights),
    description: buildReplaySummary(state, highlights, dramaticScore),
    timeline,
    highlights,
    beats,
    tags: replayTags(state, highlights),
    dramaticScore,
    replayDirectorScore: dramaticScore,
    shareUrl,
    capturePlan: buildReplayCapturePlan({ id, shareUrl, highlights, timeline }),
    exportFormats: ['json', 'markdown', 'csv', 'capture-plan'],
    marketingProof: {
      usable: dramaticScore >= 65,
      suggestedPlacement: dramaticScore >= 80 ? 'homepage proof strip' : 'replay gallery',
      socialLabel: highlights[0]?.socialLabel || 'Vault replay',
    },
    library: {
      pinned: false,
      officialState: 'generated',
      notes: '',
      subjective: Object.fromEntries(SUBJECTIVE_FIELDS.map((field) => [field, false])),
    },
    ghosts: options.ghostMatch ? buildGhostReplayMetadata(options.ghostMatch) : null,
  };
  validateReplay(replay);
  return replay;
}

export function buildReplayFromSeed(config = {}) {
  const ghostMatch = config.ghostRoster || config.ghostScenario
    ? runGhostMatch({
        seed: config.seed || 'replay-director',
        scenario: config.ghostScenario || 'balanced-cast',
        roster: config.ghostRoster,
        simulatorScenarioId: config.scenarioId,
        rules: config.rules || SIM_DEFAULT_RULES,
        maxRounds: config.maxRounds || 40,
      })
    : null;
  const state = ghostMatch?.state || runSimulation({
    seed: config.seed || 'replay-director',
    scenarioId: config.scenarioId || 'new-player-table',
    strategies: config.strategies || ['balanced', 'picker', 'searcher', 'saboteur'],
    rules: config.rules || SIM_DEFAULT_RULES,
    maxRounds: config.maxRounds || 40,
  });
  return buildReplayFromSimulation(state, {
    sourceType: config.sourceType || 'manually selected seed',
    strategies: config.strategies,
    maxRounds: config.maxRounds,
    ghostMatch,
  });
}

export function buildReplaysFromBatch(batchResult, options = {}) {
  const states = batchResult.states?.length
    ? batchResult.states
    : (batchResult.summaries || []).slice(0, options.limit || 10).map((summary) =>
        runSimulation({
          seed: summary.seed,
          scenarioId: summary.scenarioId || options.scenarioId || 'new-player-table',
          strategies: batchResult.strategies,
          rules: batchResult.rules,
          maxRounds: options.maxRounds || 40,
        }),
      );
  return states
    .map((state) => buildReplayFromSimulation(state, {
      sourceType: 'batch result',
      strategies: batchResult.strategies,
      maxRounds: options.maxRounds,
    }))
    .sort((a, b) => b.dramaticScore - a.dramaticScore)
    .slice(0, options.limit || 12);
}

export function buildReplaysFromAutopilot(report, options = {}) {
  const replays = [];
  for (const candidate of report.topCandidates?.slice(0, options.candidates || 3) || []) {
    for (const scenario of candidate.scenarios?.slice(0, 2) || []) {
      replays.push(
        buildReplayFromSeed({
          seed: `${report.config.seed}-${candidate.id}-${scenario.scenarioId}`,
          scenarioId: scenario.scenarioId,
          strategies: report.config.strategies,
          rules: candidate.rules,
          sourceType: 'autopilot report',
          maxRounds: report.config.maxRounds,
        }),
      );
    }
  }
  for (const candidate of report.worstCandidates?.slice(0, 2) || []) {
    replays.push(
      buildReplayFromSeed({
        seed: `${report.config.seed}-${candidate.id}-failure`,
        scenarioId: report.config.scenarios?.[0] || 'new-player-table',
        strategies: report.config.strategies,
        rules: candidate.rules,
        sourceType: 'autopilot report',
        maxRounds: report.config.maxRounds,
      }),
    );
  }
  return replays.sort((a, b) => b.dramaticScore - a.dramaticScore).slice(0, options.limit || 10);
}

export function buildPairedReplayComparison(options = {}) {
  const baseline = buildReplayFromSeed({
    ...options,
    rules: options.baselineRules || SIM_DEFAULT_RULES,
    sourceType: 'paired baseline replay',
  });
  const tuned = buildReplayFromSeed({
    ...options,
    rules: options.candidateRules || options.rules || SIM_DEFAULT_RULES,
    sourceType: 'paired tuned replay',
  });
  const comparison = compareRulesets({
    games: options.games || 20,
    scenarioId: options.scenarioId || 'new-player-table',
    seed: options.seed || 'paired-replay',
    strategies: options.strategies,
    baselineRules: options.baselineRules || SIM_DEFAULT_RULES,
    candidateRules: options.candidateRules || options.rules || SIM_DEFAULT_RULES,
    maxRounds: options.maxRounds || 40,
  });
  return {
    id: `paired-${hashString(`${baseline.id}:${tuned.id}`).toString(16)}`,
    baseline,
    tuned,
    comparison,
    timelineComparison: buildPairedTimelineComparison(baseline, tuned),
    scoreDelta: tuned.dramaticScore - baseline.dramaticScore,
  };
}

export function buildPairedTimelineComparison(baseline, tuned) {
  const maxRounds = Math.max(
    ...baseline.timeline.map((item) => item.round),
    ...tuned.timeline.map((item) => item.round),
  );
  return Array.from({ length: maxRounds }, (_, index) => {
    const round = index + 1;
    const baseEvents = baseline.timeline.filter((item) => item.round === round);
    const tunedEvents = tuned.timeline.filter((item) => item.round === round);
    return {
      round,
      baselineEvents: baseEvents.length,
      tunedEvents: tunedEvents.length,
      baselineHighlights: baseline.highlights.filter((item) => item.round === round).length,
      tunedHighlights: tuned.highlights.filter((item) => item.round === round).length,
      changed: baseEvents.map((item) => item.text).join('|') !== tunedEvents.map((item) => item.text).join('|'),
    };
  });
}

export function filterReplays(replays, filter = 'all') {
  if (filter === 'all') return replays;
  return replays.filter((replay) => replay.tags.includes(filter));
}

export function buildTopReplayTable(replays) {
  return replays
    .slice()
    .sort((a, b) => b.dramaticScore - a.dramaticScore)
    .map((replay, index) => ({
      rank: index + 1,
      id: replay.id,
      title: replay.title,
      score: replay.dramaticScore,
      rounds: replay.summary.rounds,
      winner: replay.summary.winnerName,
      comeback: replay.summary.comeback,
      leadChanges: replay.summary.leadChanges,
      sabotageSwings: replay.highlights.filter((item) => item.type === 'sabotageSwing').length,
      share: replay.shareUrl,
      tags: replay.tags,
    }));
}

export function buildReplayCapturePlan({ id, shareUrl, highlights, timeline }) {
  const important = [...highlights]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 4);
  const steps = [
    { id: 'opening-board', label: 'opening board', frame: 'opening', round: 1 },
    ...important.map((highlight) => ({
      id: highlight.type,
      label: highlight.replayLabel.toLowerCase(),
      frame: highlight.type,
      round: highlight.round,
    })),
    {
      id: 'winner-reveal',
      label: 'winner reveal',
      frame: 'winner',
      round: timeline[timeline.length - 1]?.round || 1,
    },
  ];
  return {
    viewport: REPLAY_CAPTURE_PRESETS.desktop,
    route: shareUrl,
    steps: dedupeBy(steps, 'id'),
    screenshots: dedupeBy(steps, 'id').map((step) => ({
      name: step.label,
      url: `/replay/${id}?frame=${step.frame}`,
      round: step.round,
      output: `app/public/replays/${id}-${step.frame}.png`,
    })),
    videoSuggested: important.length >= 3,
    socialCuts: important.map((highlight) => ({
      label: highlight.socialLabel,
      startRound: Math.max(1, highlight.round - 1),
      endRound: highlight.round + 1,
    })),
    presets: REPLAY_CAPTURE_PRESETS,
  };
}

function dedupeBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item[key])) return false;
    seen.add(item[key]);
    return true;
  });
}

export function chooseReplayThumbnail(replay) {
  return bestReplayFrame(replay).url;
}

export function scoreReplayFrame(replay, frame) {
  const highlight = replay.highlights.find((item) => item.type === frame.frame || item.round === frame.round);
  return (highlight?.importance || 30) + (frame.frame === 'winner' ? 18 : 0) + (frame.frame === 'opening' ? 4 : 0);
}

export function bestReplayFrame(replay) {
  return replay.capturePlan.screenshots
    .map((frame) => ({ ...frame, score: scoreReplayFrame(replay, frame) }))
    .sort((a, b) => b.score - a.score)[0];
}

export function exportReplayJson(replay) {
  return JSON.stringify(replay, null, 2);
}

export function exportReplayMarkdown(replay) {
  return [
    `# ${replay.title}`,
    '',
    replay.subtitle,
    '',
    replay.description,
    '',
    `Replay Director score: ${replay.dramaticScore.toFixed(1)}`,
    `Share URL: ${replay.shareUrl}`,
    '',
    '## Highlights',
    '',
    ...replay.highlights.slice(0, 10).map((highlight) => `- Round ${highlight.round}: ${highlight.replayLabel} - ${highlight.text}`),
    '',
    '## Story Beats',
    '',
    ...replay.beats.map((beat) => `- Round ${beat.round}: ${beat.label} - ${beat.text}`),
    '',
    '## Capture Plan',
    '',
    ...replay.capturePlan.screenshots.map((shot) => `- ${shot.name}: ${shot.url}`),
    '',
  ].join('\n');
}

export function exportReplayCsv(replays) {
  const list = Array.isArray(replays) ? replays : [replays];
  const rows = [
    ['id', 'title', 'score', 'seed', 'scenario', 'rounds', 'winner', 'tags', 'shareUrl'],
    ...list.map((replay) => [
      replay.id,
      replay.title,
      replay.dramaticScore.toFixed(2),
      replay.seed,
      replay.scenarioId,
      replay.summary.rounds,
      replay.summary.winnerName || '',
      replay.tags.join('|'),
      replay.shareUrl,
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

export function validateReplay(replay) {
  const required = ['schemaVersion', 'id', 'seed', 'scenarioId', 'summary', 'timeline', 'highlights', 'shareUrl'];
  for (const key of required) {
    if (!(key in replay)) {
      throw new Error(`Replay missing required field: ${key}`);
    }
  }
  if (replay.schemaVersion !== REPLAY_SCHEMA_VERSION) {
    throw new Error(`Unsupported replay schema version: ${replay.schemaVersion}`);
  }
  return true;
}

export function migrateReplay(replay) {
  if (replay.schemaVersion === REPLAY_SCHEMA_VERSION) return replay;
  return {
    ...replay,
    schemaVersion: REPLAY_SCHEMA_VERSION,
    library: replay.library || {
      pinned: false,
      officialState: 'generated',
      notes: '',
      subjective: Object.fromEntries(SUBJECTIVE_FIELDS.map((field) => [field, false])),
    },
  };
}

export function loadReplayFromSearch(search, fallbackConfig = {}) {
  const payload = parseReplayPayload(search);
  if (!payload) return buildReplayFromSeed(fallbackConfig);
  return buildReplayFromSeed({
    seed: payload.seed,
    scenarioId: payload.scenarioId,
    strategies: payload.strategies,
    rules: payload.rules,
  });
}

function readLibrary() {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(REPLAY_LIBRARY_KEY);
  return raw ? JSON.parse(raw).map(migrateReplay) : [];
}

function writeLibrary(items) {
  if (typeof localStorage === 'undefined') return false;
  localStorage.setItem(REPLAY_LIBRARY_KEY, JSON.stringify(items));
  return true;
}

export function listReplayLibrary() {
  return readLibrary();
}

export function saveReplayToLibrary(replay) {
  validateReplay(replay);
  const library = readLibrary();
  const next = [replay, ...library.filter((item) => item.id !== replay.id)];
  writeLibrary(next);
  return next;
}

export function updateReplayLibraryItem(id, patch) {
  const library = readLibrary();
  const next = library.map((item) => item.id === id ? { ...item, ...patch, library: { ...item.library, ...(patch.library || {}) } } : item);
  writeLibrary(next);
  return next;
}

export function pinReplay(id, pinned = true) {
  return updateReplayLibraryItem(id, { library: { pinned } });
}

export function setReplayOfficialState(id, officialState) {
  if (!OFFICIAL_STATES.includes(officialState)) {
    throw new Error(`Invalid replay official state: ${officialState}`);
  }
  return updateReplayLibraryItem(id, { library: { officialState } });
}

export function exportReplayLibraryJson() {
  return JSON.stringify(readLibrary(), null, 2);
}

export function importReplayLibraryJson(text) {
  const imported = JSON.parse(text).map(migrateReplay);
  for (const replay of imported) validateReplay(replay);
  writeLibrary(imported);
  return imported;
}

export function buildReplayGalleryData(replays) {
  return buildTopReplayTable(replays).map((item) => ({
    ...item,
    marketingProof: item.score >= 65,
  }));
}

export function buildRecurringReplayReport(replays, date = new Date().toISOString()) {
  const table = buildTopReplayTable(replays).slice(0, 10);
  return [
    '# Replay Director Weekly Report',
    '',
    `Generated: ${date}`,
    '',
    ...table.map((item) => `- #${item.rank} ${item.title} (${item.score.toFixed(1)}) - ${item.share}`),
    '',
  ].join('\n');
}

export function addReplayDirectorScoresToAutopilotReport(report) {
  return {
    ...report,
    topCandidates: report.topCandidates.map((candidate) => {
      const replay = buildReplayFromSeed({
        seed: `${report.config.seed}-${candidate.id}-director`,
        scenarioId: report.config.scenarios?.[0] || 'new-player-table',
        strategies: report.config.strategies,
        rules: candidate.rules,
        maxRounds: report.config.maxRounds,
      });
      return {
        ...candidate,
        replayDirectorScore: replay.dramaticScore,
        replayDirectorSample: {
          title: replay.title,
          shareUrl: replay.shareUrl,
          tags: replay.tags,
        },
      };
    }),
  };
}

export function buildLiveReplayPlaceholder(indexedEvents = []) {
  return {
    schemaVersion: REPLAY_SCHEMA_VERSION,
    sourceType: 'live-game replay',
    indexedEventCount: indexedEvents.length,
    supported: false,
    message: 'Live replay conversion is ready to receive indexed on-chain events when the indexer surface is connected.',
  };
}
