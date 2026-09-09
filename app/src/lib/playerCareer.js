export const INSTANT_PROFILE_KEY = 'plundrix-instant-profile-v1';

export function createLocalProfile() {
  return { name: 'Operator', games: 0, wins: 0, xp: 0, streak: 0, firstPlayedAt: null, lastPlayedAt: null };
}

export function readLocalProfile(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return createLocalProfile();
  try {
    const value = JSON.parse(storage.getItem(INSTANT_PROFILE_KEY));
    const fallback = createLocalProfile();
    return {
      name: String(value?.name || fallback.name).slice(0, 20),
      games: Math.max(0, Math.floor(Number(value?.games) || 0)),
      wins: Math.max(0, Math.floor(Number(value?.wins) || 0)),
      xp: Math.max(0, Math.floor(Number(value?.xp) || 0)),
      streak: Math.max(0, Math.floor(Number(value?.streak) || 0)),
      firstPlayedAt: value?.firstPlayedAt || null,
      lastPlayedAt: value?.lastPlayedAt || null,
    };
  } catch {
    return createLocalProfile();
  }
}

export function playerCohort(profile, now = new Date()) {
  if (!profile?.games) return 'new';
  const firstPlayed = Date.parse(profile.firstPlayedAt || '');
  if (!Number.isFinite(firstPlayed)) return 'returning-unknown';
  return new Date(now).getTime() - firstPlayed >= 7 * 86_400_000 ? 'returning-7d' : 'returning';
}

export function markProfilePlayed(profile, playedAt = new Date().toISOString()) {
  return {
    ...createLocalProfile(),
    ...profile,
    firstPlayedAt: profile?.firstPlayedAt || playedAt,
    lastPlayedAt: playedAt,
  };
}

export function localCareerRank(xp = 0) {
  const value = Math.max(0, Number(xp) || 0);
  if (value >= 1800) return { level: 5, title: 'Vault Myth', nextXp: null };
  if (value >= 900) return { level: 4, title: 'Ghost Architect', nextXp: 1800 };
  if (value >= 400) return { level: 3, title: 'Inside Operator', nextXp: 900 };
  if (value >= 150) return { level: 2, title: 'Lock Whisperer', nextXp: 400 };
  return { level: 1, title: 'Suspicious Newcomer', nextXp: 150 };
}

export function careerObjectives({ profile, inventory, replays = [], runs = [] }) {
  return [
    profile.games === 0
      ? { id: 'first-operation', label: 'Complete your first operation', detail: 'Learn Pick, Search, and Sabotage.', to: '/play' }
      : { id: 'win-streak', label: 'Build a three-win streak', detail: `${Math.min(profile.streak, 3)}/3 consecutive escapes.`, to: '/play' },
    inventory.craftedCount === 0
      ? { id: 'first-craft', label: 'Assemble a personal gadget', detail: 'Use earned salvage on one intentional build.', to: '/workshop' }
      : { id: 'collection', label: 'Expand the gadget locker', detail: `${inventory.ownedIds.length}/1200 configurations owned.`, to: '/workshop' },
    runs.some((run) => run.status === 'COMPLETE')
      ? { id: 'weekly', label: 'Leave a weekly calling card', detail: 'Run the shared seed and post a verifiable score.', to: '/vault-run?weekly=1' }
      : { id: 'vault-run', label: 'Escape a full Vault Run', detail: `${runs.filter((run) => run.status === 'COMPLETE').length} successful runs.`, to: '/vault-run' },
    replays.length === 0
      ? { id: 'replay', label: 'Create your first exact replay', detail: 'Finish any Instant Play operation.', to: '/play' }
      : { id: 'replay', label: 'Review your latest operation', detail: `${replays.length} replay${replays.length === 1 ? '' : 's'} saved locally.`, to: `/replay/${replays[0].id}` },
  ];
}
