const submissions = new Map();

export function getIsoWeek(date = new Date()) {
  const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  current.setUTCDate(current.getUTCDate() + 4 - (current.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  return { year: current.getUTCFullYear(), week: Math.ceil((((current - yearStart) / 86400000) + 1) / 7) };
}

export function weeklyChallengeForDate(date = new Date()) {
  const { year, week } = getIsoWeek(date);
  const variants = [
    { modifier: 'Hot Locks', note: 'Pick odds start 5 points lower. Scores run 10% hotter.' },
    { modifier: 'Loose Wires', note: 'Sabotage protection cools down immediately.' },
    { modifier: 'Deep Pockets', note: 'The run opens with one carried tool.' },
  ];
  return {
    id: `${year}-w${String(week).padStart(2, '0')}`,
    seed: `weekly-vault-${year}-${week}`,
    title: `Weekly Vault ${String(week).padStart(2, '0')}`,
    ...variants[week % variants.length],
  };
}

const BUILT_INS = Object.freeze([
  { alias: 'Mara', score: 6420, rounds: 13, verified: 'house-rival' },
  { alias: 'Vesper', score: 5980, rounds: 15, verified: 'house-rival' },
  { alias: 'Rook', score: 5510, rounds: 17, verified: 'house-rival' },
]);

function boardPayload(date = new Date()) {
  const challenge = weeklyChallengeForDate(date);
  const playerScores = submissions.get(challenge.id) || [];
  return {
    challenge,
    scores: [...BUILT_INS, ...playerScores].sort((a, b) => b.score - a.score || a.rounds - b.rounds).slice(0, 100),
    durability: 'service-session-beta',
    verification: 'practice-self-reported',
  };
}

export function getWeeklyVaultBoard(date = new Date()) {
  return boardPayload(date);
}

export function submitWeeklyVaultScore(body, date = new Date()) {
  const challenge = weeklyChallengeForDate(date);
  if (!body || body.challengeId !== challenge.id) throw new Error('Challenge is not the current weekly vault');
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(String(body.runId || ''))) throw new Error('Invalid run id');
  const alias = String(body.alias || '').trim();
  if (!/^[A-Za-z0-9 _-]{1,20}$/.test(alias)) throw new Error('Alias must use 1-20 letters, numbers, spaces, dashes, or underscores');
  const score = Number(body.score);
  const rounds = Number(body.rounds);
  if (!Number.isInteger(score) || score < 0 || score > 1_000_000) throw new Error('Score is outside the accepted range');
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 200) throw new Error('Rounds are outside the accepted range');
  if (body.result !== 'complete') throw new Error('Only completed weekly runs can be submitted');
  const current = submissions.get(challenge.id) || [];
  if (current.some((entry) => entry.runId === body.runId)) throw new Error('This run was already submitted');
  current.push({ runId: body.runId, alias, score, rounds, verified: 'self-reported' });
  submissions.set(challenge.id, current.slice(-250));
  return boardPayload(date);
}

export function resetWeeklyVaultScores() {
  submissions.clear();
}
