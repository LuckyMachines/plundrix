export function createStaleWhileRefreshCache({
  freshMs,
  staleMs,
  refresh,
  load = () => null,
  save = () => {},
  clock = () => Date.now(),
}) {
  let hydrated = false;
  let value = null;
  let refreshedAt = 0;
  let source = 'empty';
  let refreshPromise = null;
  let lastError = null;

  function hydrate() {
    if (hydrated) return;
    hydrated = true;
    try {
      const snapshot = load();
      if (!snapshot?.value || !Number.isFinite(snapshot.savedAt)) return;
      value = snapshot.value;
      refreshedAt = snapshot.savedAt;
      source = 'disk';
    } catch (error) {
      lastError = error;
    }
  }

  function ageMs() {
    return value ? Math.max(0, clock() - refreshedAt) : null;
  }

  function status() {
    hydrate();
    const age = ageMs();
    let state = 'cold';
    if (value && age <= freshMs) state = 'fresh';
    else if (value && age <= staleMs) state = 'stale';
    else if (value) state = 'expired';
    if (refreshPromise) state = value ? 'refreshing' : 'loading';
    return {
      state,
      source,
      ageSeconds: age === null ? null : Math.round(age / 1000),
      refreshing: Boolean(refreshPromise),
      lastError: lastError ? String(lastError.message || lastError) : null,
    };
  }

  async function runRefresh() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = Promise.resolve()
      .then(refresh)
      .then((nextValue) => {
        value = nextValue;
        refreshedAt = clock();
        source = 'network';
        lastError = null;
        try {
          save({ savedAt: refreshedAt, value: nextValue });
        } catch (error) {
          lastError = error;
        }
        return value;
      })
      .finally(() => {
        refreshPromise = null;
      });
    return refreshPromise;
  }

  async function get() {
    hydrate();
    const age = ageMs();
    if (value && age <= freshMs) return value;
    if (value && age <= staleMs) {
      void runRefresh().catch(() => {});
      return value;
    }
    try {
      return await runRefresh();
    } catch (error) {
      lastError = error;
      if (value) return value;
      throw error;
    }
  }

  return { get, status };
}
