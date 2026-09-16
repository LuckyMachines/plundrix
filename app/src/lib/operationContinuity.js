export const RECENT_OPERATION_KEY = 'plundrix-recent-operation-v1';
export const RECENT_OPERATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function rememberOperation(operation, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const id = Number(operation?.id ?? operation);
  if (!storage || !Number.isSafeInteger(id) || id <= 0) return null;
  const record = {
    id,
    state: ['OPEN', 'ACTIVE', 'COMPLETE'].includes(operation?.state) ? operation.state : null,
    savedAt: new Date().toISOString(),
  };
  storage.setItem(RECENT_OPERATION_KEY, JSON.stringify(record));
  return record;
}

export function readRecentOperation(storage = typeof window !== 'undefined' ? window.localStorage : null, now = Date.now()) {
  if (!storage) return null;
  try {
    const record = JSON.parse(storage.getItem(RECENT_OPERATION_KEY));
    const id = Number(record?.id);
    const savedAt = Date.parse(record?.savedAt || '');
    const state = ['OPEN', 'ACTIVE', 'COMPLETE'].includes(record?.state) ? record.state : null;
    if (!Number.isSafeInteger(id) || id <= 0 || !state || !Number.isFinite(savedAt) || now - savedAt > RECENT_OPERATION_MAX_AGE_MS) return null;
    return { id, state, savedAt: record.savedAt };
  } catch {
    return null;
  }
}
