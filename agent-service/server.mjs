import { createServer } from 'node:http';
import { agentConfig, validateAgentConfig } from './config.mjs';
import {
  getBadgeCatalog,
  getPublicCompetitionOverview,
  getPublicCompetitionProfile,
  getPublicCompetitionSessions,
  getPublicLeaderboard,
} from './competition.mjs';
import {
  getGameHistory,
  getGameSnapshot,
  listGames,
  parsePlayerAddress,
} from './contract.mjs';
import { buildAvailableActions, recommendAction } from './strategy.mjs';
import { relaySessionAction } from './session-relay.mjs';
import { getWeeklyVaultBoard, submitWeeklyVaultScore } from './weekly-challenge.mjs';
import {
  createManagedOperation,
  createManagedSession,
  getManagedOperation,
  getManagedWorkshop,
  joinManagedOperation,
  listManagedOperations,
  managedCookie,
  managedError,
  managedPlayStatus,
  ManagedPlayError,
  readManagedSession,
  startManagedOperation,
  startManagedPlayMaintenance,
  submitManagedAction,
  updateManagedWorkshop,
} from './managed-play.mjs';

validateAgentConfig();
startManagedPlayMaintenance();

const requestBuckets = new Map();

function clientAddress(req) {
  const cloudflare = String(req.headers['cf-connecting-ip'] || '').trim();
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return cloudflare || forwarded || req.socket.remoteAddress || 'unknown';
}

function enforceRateLimit(req, { scope = 'write', identity = '', limit = 10, windowMs = 60_000 } = {}) {
  const client = identity || clientAddress(req);
  const key = `${scope}:${client}`;
  const now = Date.now();
  const recent = (requestBuckets.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) throw new Error('Game service rate limit exceeded');
  recent.push(now);
  requestBuckets.set(key, recent);
}

function enforceManagedOrigin(req) {
  const origin = String(req.headers.origin || '').replace(/\/$/, '');
  const allowed = String(agentConfig.allowOrigin || '').replace(/\/$/, '');
  if (origin && allowed !== '*' && origin !== allowed) {
    throw new ManagedPlayError('Request origin is not allowed.', 403);
  }
}

function writeJson(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': agentConfig.allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...(agentConfig.allowOrigin === '*' ? {} : { 'Access-Control-Allow-Credentials': 'true' }),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    Vary: 'Origin',
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 64 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

function parseListQuery(url) {
  const limit = url.searchParams.get('limit');
  const offset = url.searchParams.get('offset');
  return {
    limit: limit ? Number(limit) : 20,
    offset: offset ? Number(offset) : 0,
  };
}

function parseCompetitionQuery(url) {
  return {
    limit: Number(url.searchParams.get('limit') || 20),
    queue: url.searchParams.get('queue') || 'all',
    state: url.searchParams.get('state') || 'all',
  };
}

const server = createServer(async (req, res) => {
  let requestPath = '/';
  try {
    const method = req.method || 'GET';
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname;
    requestPath = path;

    if (method === 'OPTIONS') {
      writeJson(res, 204, {});
      return;
    }

    if (method === 'GET' && path === '/health') {
      writeJson(res, 200, {
        ok: true,
        service: 'plundrix-game-service',
        play: managedPlayStatus(),
      });
      return;
    }

    if (method === 'POST' && path === '/api/player/session') {
      enforceManagedOrigin(req);
      let player;
      let cookie;
      try {
        const session = readManagedSession(req.headers.cookie);
        player = { displayName: session.displayName };
      } catch {
        enforceRateLimit(req, { scope: 'session', limit: 60, windowMs: 60 * 60_000 });
        const created = createManagedSession();
        player = created.player;
        cookie = managedCookie(created.token);
      }
      writeJson(res, 201, { player }, cookie ? { 'Set-Cookie': cookie } : {});
      return;
    }

    if (method === 'GET' && path === '/api/player/session') {
      const session = readManagedSession(req.headers.cookie);
      writeJson(res, 200, { player: { displayName: session.displayName } });
      return;
    }

    if (method === 'GET' && path === '/api/play/operations') {
      readManagedSession(req.headers.cookie);
      writeJson(res, 200, await listManagedOperations());
      return;
    }

    if (method === 'POST' && path === '/api/play/operations') {
      enforceManagedOrigin(req);
      const session = readManagedSession(req.headers.cookie);
      enforceRateLimit(req, { scope: 'managed-write', identity: session.id });
      writeJson(res, 201, { operation: await createManagedOperation(session, await readBody(req)) });
      return;
    }

    const managedOperationMatch = path.match(/^\/api\/play\/operations\/(\d+)$/);
    if (method === 'GET' && managedOperationMatch) {
      const session = readManagedSession(req.headers.cookie);
      writeJson(res, 200, { operation: await getManagedOperation(managedOperationMatch[1], session) });
      return;
    }

    const managedCommandMatch = path.match(/^\/api\/play\/operations\/(\d+)\/(join|start|actions)$/);
    if (method === 'POST' && managedCommandMatch) {
      enforceManagedOrigin(req);
      const session = readManagedSession(req.headers.cookie);
      enforceRateLimit(req, { scope: 'managed-write', identity: session.id });
      const [, gameId, command] = managedCommandMatch;
      const body = await readBody(req);
      const operation = command === 'join'
        ? await joinManagedOperation(gameId, session)
        : command === 'start'
          ? await startManagedOperation(gameId, session)
          : await submitManagedAction(gameId, session, body);
      writeJson(res, 200, { operation });
      return;
    }

    if (method === 'GET' && path === '/api/play/workshop') {
      const session = readManagedSession(req.headers.cookie);
      writeJson(res, 200, { workshop: await getManagedWorkshop(session) });
      return;
    }

    if (method === 'POST' && path === '/api/play/workshop') {
      enforceManagedOrigin(req);
      const session = readManagedSession(req.headers.cookie);
      enforceRateLimit(req, { scope: 'managed-write', identity: session.id });
      writeJson(res, 200, { workshop: await updateManagedWorkshop(session, await readBody(req)) });
      return;
    }

    if (agentConfig.rawApiEnabled && method === 'GET' && path === '/api/games') {
      const result = await listGames(...Object.values(parseListQuery(url)));
      writeJson(res, 200, result);
      return;
    }

    if (method === 'GET' && path === '/api/competition/overview') {
      writeJson(res, 200, await getPublicCompetitionOverview());
      return;
    }

    if (method === 'GET' && path === '/api/competition/leaderboard') {
      const { limit, queue } = parseCompetitionQuery(url);
      writeJson(res, 200, await getPublicLeaderboard({ limit, queue }));
      return;
    }

    if (method === 'GET' && path === '/api/competition/agent-ladder') {
      const { limit } = parseCompetitionQuery(url);
      writeJson(res, 200, await getPublicLeaderboard({ limit, queue: 'agent_ladder' }));
      return;
    }

    if (method === 'GET' && path === '/api/competition/sessions') {
      const { limit, queue, state } = parseCompetitionQuery(url);
      writeJson(res, 200, await getPublicCompetitionSessions({ limit, queue, state }));
      return;
    }

    if (method === 'GET' && path === '/api/competition/badges') {
      writeJson(res, 200, await getBadgeCatalog());
      return;
    }

    const profileRouteMatch = path.match(/^\/api\/competition\/profiles\/(op-[a-f0-9]{12})$/);
    if (method === 'GET' && profileRouteMatch) {
      writeJson(
        res,
        200,
        await getPublicCompetitionProfile(profileRouteMatch[1])
      );
      return;
    }

    const gameRouteMatch = path.match(/^\/api\/games\/(\d+)$/);
    if (agentConfig.rawApiEnabled && method === 'GET' && gameRouteMatch) {
      const snapshot = await getGameSnapshot(gameRouteMatch[1]);
      writeJson(res, 200, snapshot);
      return;
    }

    const availableActionsRouteMatch = path.match(
      /^\/api\/games\/(\d+)\/available-actions\/(0x[a-fA-F0-9]{40})$/
    );
    if (agentConfig.rawApiEnabled && method === 'GET' && availableActionsRouteMatch) {
      const snapshot = await getGameSnapshot(availableActionsRouteMatch[1]);
      const playerAddress = parsePlayerAddress(availableActionsRouteMatch[2]);
      const availableActions = buildAvailableActions(snapshot, playerAddress);
      writeJson(res, 200, {
        gameId: snapshot.gameId,
        playerAddress,
        availableActions,
      });
      return;
    }

    const historyRouteMatch = path.match(/^\/api\/games\/(\d+)\/history$/);
    if (agentConfig.rawApiEnabled && method === 'GET' && historyRouteMatch) {
      const fromBlock = url.searchParams.get('fromBlock');
      const toBlock = url.searchParams.get('toBlock');
      const history = await getGameHistory(historyRouteMatch[1], {
        fromBlock: fromBlock ? BigInt(fromBlock) : undefined,
        toBlock: toBlock ? BigInt(toBlock) : undefined,
      });
      writeJson(res, 200, history);
      return;
    }

    if (agentConfig.rawApiEnabled && method === 'POST' && path === '/api/recommend-action') {
      const body = await readBody(req);
      const snapshot = await getGameSnapshot(body.gameId);
      const playerAddress = parsePlayerAddress(body.playerAddress);
      const recommendation = recommendAction(snapshot, playerAddress);
      writeJson(res, 200, {
        gameId: snapshot.gameId,
        playerAddress,
        recommendation,
      });
      return;
    }

    if (method === 'GET' && path === '/api/weekly-vault') {
      writeJson(res, 200, getWeeklyVaultBoard());
      return;
    }

    if (method === 'POST' && path === '/api/weekly-vault/scores') {
      enforceRateLimit(req);
      const body = await readBody(req);
      writeJson(res, 201, submitWeeklyVaultScore(body));
      return;
    }

    if (agentConfig.rawApiEnabled && method === 'POST' && path === '/api/session-actions') {
      enforceRateLimit(req, { scope: 'relay' });
      const body = await readBody(req);
      writeJson(res, 201, await relaySessionAction(body));
      return;
    }

    writeJson(res, 404, {
      error: 'Not found',
      routes: [
        'GET /health',
        'POST /api/player/session',
        'GET /api/player/session',
        'GET /api/play/operations',
        'POST /api/play/operations',
        'GET /api/play/operations/:operationId',
        'POST /api/play/operations/:operationId/join',
        'POST /api/play/operations/:operationId/start',
        'POST /api/play/operations/:operationId/actions',
        'GET /api/play/workshop',
        'POST /api/play/workshop',
        'GET /api/weekly-vault',
        'POST /api/weekly-vault/scores',
        'GET /api/competition/overview',
        'GET /api/competition/leaderboard',
        'GET /api/competition/agent-ladder',
        'GET /api/competition/sessions',
        'GET /api/competition/badges',
        'GET /api/competition/profiles/:operatorId',
      ],
    });
  } catch (error) {
    console.error('[plundrix-game-service]', requestPath, error?.shortMessage || error?.message || error);
    const safeError = requestPath.startsWith('/api/play/') || requestPath === '/api/player/session'
      ? managedError(error)
      : error;
    writeJson(res, safeError?.statusCode || 400, {
      error: safeError instanceof Error ? safeError.message : 'Unknown error',
    });
  }
});

server.listen(agentConfig.port, '0.0.0.0', () => {
  console.log(
    `Plundrix agent service listening on http://0.0.0.0:${agentConfig.port}`
  );
});
