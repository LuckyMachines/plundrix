export const OBSERVATION_STORAGE_KEY = 'plundrix-first-run-observations-v1';

export const DELIGHT_MOMENTS = Object.freeze([
  'gadget-trigger', 'sabotage-swing', 'double-lock', 'rival-reaction', 'vault-win', 'none-yet',
]);

export function normalizeObservation(input = {}) {
  return {
    id: String(input.id || `obs-${Date.now().toString(36)}`).slice(0, 40),
    participantCode: String(input.participantCode || 'P-01').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 12),
    completedFirstAction: Boolean(input.completedFirstAction),
    understoodGoal: Boolean(input.understoodGoal),
    noticedGadget: Boolean(input.noticedGadget),
    wantedReplay: Boolean(input.wantedReplay),
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
  const count = records.length;
  const rate = (key) => count ? Math.round((records.filter((item) => item[key]).length / count) * 100) : 0;
  const averageSeconds = count ? Math.round(records.reduce((sum, item) => sum + item.secondsToFirstAction, 0) / count) : 0;
  return { count, firstActionRate: rate('completedFirstAction'), goalRate: rate('understoodGoal'), gadgetRate: rate('noticedGadget'), replayRate: rate('wantedReplay'), averageSeconds };
}
