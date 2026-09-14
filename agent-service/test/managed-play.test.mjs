import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { agentConfig } from '../config.mjs';
import {
  ManagedPlayError,
  createSignedSession,
  verifySignedSession,
} from '../managed-play.mjs';
import { publicOperatorId } from '../competition.mjs';

const secret = 'managed-session-test-secret-32-bytes-minimum';
const playerId = '0123456789abcdef0123456789abcdef';

test('managed sessions are opaque, signed, expiring bearer records', () => {
  const token = createSignedSession(secret, { id: playerId, issuedAt: 1_000 });
  assert.equal(verifySignedSession(token, secret, { now: 1_001, maxAgeSeconds: 60 }).id, playerId);
  assert.throws(
    () => verifySignedSession(`${token.slice(0, -1)}x`, secret, { now: 1_001, maxAgeSeconds: 60 }),
    ManagedPlayError,
  );
  assert.throws(
    () => verifySignedSession(token, secret, { now: 2_000, maxAgeSeconds: 60 }),
    /expired/i,
  );
});

test('public operator identifiers do not disclose account addresses', () => {
  const address = '0x00000000000000000000000000000000000000a1';
  const identifier = publicOperatorId(address);
  assert.match(identifier, /^op-[a-f0-9]{12}$/);
  assert.doesNotMatch(identifier, /0x/i);
  assert.equal(identifier, publicOperatorId(address.toUpperCase()));
});

test('default sponsorship limits are conservative and raw APIs are closed', () => {
  assert.ok(agentConfig.managedMaximumPlayerBalanceWei <= 1_000_000_000_000_000n);
  assert.ok(agentConfig.managedMaxTransactionWei <= agentConfig.managedMaximumPlayerBalanceWei);
  assert.equal(agentConfig.rawApiEnabled, false);
  const server = readFileSync(resolve('agent-service', 'server.mjs'), 'utf8');
  const healthRoute = server.slice(server.indexOf("path === '/health'"), server.indexOf("path === '/api/player/session'"));
  assert.doesNotMatch(healthRoute, /rpcUrl|contractAddress|relayer/);
});

test('public gameplay uses the managed service rather than browser wallets', () => {
  const main = readFileSync(resolve('app', 'src', 'main.jsx'), 'utf8');
  const gamePage = readFileSync(resolve('app', 'src', 'pages', 'GamePage.jsx'), 'utf8');
  const hub = readFileSync(resolve('app', 'src', 'pages', 'PlayerHubPage.jsx'), 'utf8');
  assert.doesNotMatch(main, /Web3Provider|wagmi/);
  assert.match(gamePage, /ManagedGamePage/);
  assert.match(hub, /ManagedOperations/);
  assert.doesNotMatch(hub, /wallet|Sepolia|onchain/i);
});
