const TELEMETRY_STORAGE_KEY = 'plundrix-balance-telemetry-v1';

export function createBalanceTelemetry() {
  return { version: 1, samples: 0, gadgets: {}, modes: {}, bargains: {}, bargainWins: {} };
}

export function normalizeBalanceTelemetry(value) {
  const safeCounts = (source) => Object.fromEntries(Object.entries(source || {})
    .filter(([key]) => /^[a-z0-9-]{1,32}$/.test(key))
    .map(([key, item]) => [key, {
      plays: Math.max(0, Number(item?.plays) || 0),
      wins: Math.max(0, Number(item?.wins) || 0),
      activations: Math.max(0, Number(item?.activations) || 0),
      rounds: Math.max(0, Number(item?.rounds) || 0),
    }]));
  if (!value || typeof value !== 'object') return createBalanceTelemetry();
  return {
    version: 1,
    samples: Math.max(0, Number(value.samples) || 0),
    gadgets: safeCounts(value.gadgets),
    modes: Object.fromEntries(Object.entries(value.modes || {}).filter(([key]) => /^[a-z0-9-]{1,32}$/.test(key)).map(([key, count]) => [key, Math.max(0, Number(count) || 0)])),
    bargains: Object.fromEntries(Object.entries(value.bargains || {}).filter(([key]) => /^[a-z0-9-]{1,32}$/.test(key)).map(([key, count]) => [key, Math.max(0, Number(count) || 0)])),
    bargainWins: Object.fromEntries(Object.entries(value.bargainWins || {}).filter(([key]) => /^[a-z0-9-]{1,32}$/.test(key)).map(([key, count]) => [key, Math.max(0, Number(count) || 0)])),
  };
}

export function readBalanceTelemetry(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return createBalanceTelemetry();
  try {
    return normalizeBalanceTelemetry(JSON.parse(storage.getItem(TELEMETRY_STORAGE_KEY)));
  } catch {
    return createBalanceTelemetry();
  }
}

export function recordLocalBalanceSample(sample, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const current = readBalanceTelemetry(storage);
  const id = /^[a-z0-9-]{1,32}$/.test(sample?.gadgetId || '') ? sample.gadgetId : 'none';
  const previous = current.gadgets[id] || { plays: 0, wins: 0, activations: 0, rounds: 0 };
  const next = {
    ...current,
    samples: current.samples + 1,
    gadgets: {
      ...current.gadgets,
      [id]: {
        plays: previous.plays + 1,
        wins: previous.wins + (sample.won ? 1 : 0),
        activations: previous.activations + (sample.activated ? 1 : 0),
        rounds: previous.rounds + Math.max(1, Math.floor(Number(sample.rounds) || 1)),
      },
    },
    modes: { ...current.modes, [sample.mode || 'unknown']: (current.modes[sample.mode || 'unknown'] || 0) + 1 },
    bargains: { ...current.bargains },
    bargainWins: { ...current.bargainWins },
  };
  (sample.bargains || []).forEach((bargain) => {
    if (/^[a-z0-9-]{1,32}$/.test(bargain)) next.bargains[bargain] = (next.bargains[bargain] || 0) + 1;
  });
  (sample.bargainOutcomes || []).forEach(({ id, success }) => {
    if (success && /^[a-z0-9-]{1,32}$/.test(id || '')) next.bargainWins[id] = (next.bargainWins[id] || 0) + 1;
  });
  if (storage) storage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export { TELEMETRY_STORAGE_KEY };
