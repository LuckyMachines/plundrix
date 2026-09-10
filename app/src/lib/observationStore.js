export const OBSERVATION_STORAGE_KEY = 'plundrix-first-run-observations-v1';

export const DELIGHT_MOMENTS = Object.freeze([
  'gadget-trigger', 'sabotage-swing', 'double-lock', 'rival-reaction', 'vault-win', 'none-yet',
]);

export function normalizeObservation(input = {}) {
  return {
    schemaVersion: 2,
    id: String(input.id || `obs-${Date.now().toString(36)}`).slice(0, 40),
    createdAt: input.createdAt || new Date().toISOString(),
    participantCode: String(input.participantCode || 'P-01').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 12),
    observerConfirmed: Boolean(input.observerConfirmed),
    returningPlayer: Boolean(input.returningPlayer),
    completedFirstAction: Boolean(input.completedFirstAction),
    understoodGoal: Boolean(input.understoodGoal),
    understoodWhy: Boolean(input.understoodWhy),
    noticedGadget: Boolean(input.noticedGadget),
    wantedReplay: Boolean(input.wantedReplay),
    joyScore: Math.max(1, Math.min(5, Math.floor(Number(input.joyScore) || 3))),
    delightMoment: DELIGHT_MOMENTS.includes(input.delightMoment) ? input.delightMoment : 'none-yet',
    friction: ['none', 'setup', 'action-choice', 'odds', 'resolution', 'result'].includes(input.friction) ? input.friction : 'none',
    secondsToFirstAction: Math.max(0, Math.min(900, Math.floor(Number(input.secondsToFirstAction) || 0))),
  };
}

export function readObservations(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return [];
  try {
    const value = JSON.parse(storage.getItem(OBSERVATION_STORAGE_KEY));
    return Array.isArray(value) ? value.map(normalizeObservation).slice(-100) : [];
  } catch {
    return [];
  }
}

export function saveObservation(input, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const record = normalizeObservation(input);
  const next = [...readObservations(storage), record].slice(-100);
  if (storage) storage.setItem(OBSERVATION_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function summarizeObservations(records = []) {
  const normalized = records.map(normalizeObservation);
  const count = normalized.length;
  const rate = (key) => count ? Math.round((normalized.filter((item) => item[key]).length / count) * 100) : 0;
  const averageSeconds = count ? Math.round(normalized.reduce((sum, item) => sum + item.secondsToFirstAction, 0) / count) : 0;
  const averageJoy = count ? Math.round((normalized.reduce((sum, item) => sum + item.joyScore, 0) / count) * 10) / 10 : 0;
  return {
    count,
    firstActionRate: rate('completedFirstAction'),
    goalRate: rate('understoodGoal'),
    whyRate: rate('understoodWhy'),
    gadgetRate: rate('noticedGadget'),
    replayRate: rate('wantedReplay'),
    returningCount: normalized.filter((item) => item.returningPlayer).length,
    averageSeconds,
    averageJoy,
  };
}
