import test from 'node:test';
import assert from 'node:assert/strict';
import { createStaleWhileRefreshCache } from '../stale-cache.mjs';

test('cache coalesces concurrent cold refreshes', async () => {
  let calls = 0;
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const cache = createStaleWhileRefreshCache({
    freshMs: 100,
    staleMs: 1_000,
    refresh: async () => { calls += 1; await pending; return { id: calls }; },
  });

  const first = cache.get();
  const second = cache.get();
  release();
  assert.deepEqual(await first, { id: 1 });
  assert.deepEqual(await second, { id: 1 });
  assert.equal(calls, 1);
});

test('cache serves stale data while one background refresh runs', async () => {
  let now = 500;
  let calls = 0;
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const cache = createStaleWhileRefreshCache({
    freshMs: 100,
    staleMs: 1_000,
    clock: () => now,
    load: () => ({ savedAt: 0, value: { id: 'disk' } }),
    refresh: async () => { calls += 1; await pending; return { id: 'network' }; },
  });

  assert.deepEqual(await cache.get(), { id: 'disk' });
  assert.equal(calls, 1);
  assert.equal(cache.status().state, 'refreshing');
  assert.deepEqual(await cache.get(), { id: 'disk' });
  assert.equal(calls, 1);
  release();
  await pending;
  await new Promise((resolve) => setImmediate(resolve));
  now = 510;
  assert.deepEqual(await cache.get(), { id: 'network' });
  assert.equal(cache.status().state, 'fresh');
});

test('cache falls back to an expired snapshot when refresh fails', async () => {
  const cache = createStaleWhileRefreshCache({
    freshMs: 10,
    staleMs: 20,
    clock: () => 100,
    load: () => ({ savedAt: 0, value: { id: 'last-known-good' } }),
    refresh: async () => { throw new Error('rpc unavailable'); },
  });

  assert.deepEqual(await cache.get(), { id: 'last-known-good' });
  assert.equal(cache.status().lastError, 'rpc unavailable');
});
