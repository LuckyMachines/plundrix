import { fetchAgentService } from '../config/service';

export function getIsoWeek(date = new Date()) {
  const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  current.setUTCDate(current.getUTCDate() + 4 - (current.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((current - yearStart) / 86400000) + 1) / 7);
  return { year: current.getUTCFullYear(), week };
}

export function localWeeklyChallenge(date = new Date()) {
  const { year, week } = getIsoWeek(date);
  const variants = [
    { modifier: 'Hot Locks', note: 'Pick odds start 5 points lower. Scores run 10% hotter.' },
    { modifier: 'Loose Wires', note: 'Sabotage protection cools down immediately.' },
    { modifier: 'Deep Pockets', note: 'The run opens with one carried tool.' },
    { modifier: 'Searchlight', note: 'Search odds gain 10 points in every vault.' },
    { modifier: 'Long Fuse', note: 'Anti-chain-stun protection lasts one extra round.' },
    { modifier: 'Brittle Seams', note: 'Table pressure cracks two locks when only one lock behind.' },
  ];
  const variant = variants[week % variants.length];
  return {
    id: `${year}-w${String(week).padStart(2, '0')}`,
    seed: `weekly-vault-${year}-${week}`,
    title: `Weekly Vault ${String(week).padStart(2, '0')}`,
    ...variant,
  };
}

const RIVAL_BOARD = Object.freeze([
  { alias: 'Mara', score: 6420, rounds: 13 },
  { alias: 'Vesper', score: 5980, rounds: 15 },
  { alias: 'Rook', score: 5510, rounds: 17 },
]);
const LOCAL_BOARD_KEY = 'plundrix-weekly-board-v1';

function readLocalScores(challengeId) {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(LOCAL_BOARD_KEY));
    return value?.challengeId === challengeId && Array.isArray(value.scores) ? value.scores : [];
  } catch {
    return [];
  }
}

export async function loadWeeklyBoard() {
  try {
    return await fetchAgentService('/api/weekly-vault');
  } catch {
    const challenge = localWeeklyChallenge();
    return { challenge, scores: [...RIVAL_BOARD, ...readLocalScores(challenge.id)].sort((a, b) => b.score - a.score), durability: 'local-fallback', verification: 'practice-self-reported' };
  }
}

export async function submitWeeklyScore(entry) {
  try {
    return await fetchAgentService('/api/weekly-vault/scores', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch {
    const challenge = localWeeklyChallenge();
    if (entry.challengeId !== challenge.id || entry.result !== 'complete') throw new Error('Weekly score is not eligible');
    const scores = readLocalScores(challenge.id).filter((score) => score.runId !== entry.runId);
    scores.push({ runId: entry.runId, alias: String(entry.alias || 'Operator').slice(0, 20), score: Number(entry.score) || 0, rounds: Number(entry.rounds) || 1, verified: 'local' });
    if (typeof window !== 'undefined') window.localStorage.setItem(LOCAL_BOARD_KEY, JSON.stringify({ challengeId: challenge.id, scores: scores.slice(-25) }));
    return { challenge, scores: [...RIVAL_BOARD, ...scores].sort((a, b) => b.score - a.score), durability: 'local-device', verification: 'practice-self-reported' };
  }
}
