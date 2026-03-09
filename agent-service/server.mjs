import { createServer } from 'node:http';
import { agentConfig, validateAgentConfig } from './config.mjs';
import {
  getBadgeCatalog,
  getCompetitionOverview,
  getCompetitionProfile,
  getCompetitionSessions,
  getLeaderboard,
} from './competition.mjs';
import {
  getGameHistory,
  getGameSnapshot,
  listGames,
  parsePlayerAddress,
} from './contract.mjs';
import { buildAvailableActions, recommendAction } from './strategy.mjs';

validateAgentConfig();

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': agentConfig.allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
  try {
    const method = req.method || 'GET';
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname;

    if (method === 'OPTIONS') {
      writeJson(res, 204, {});
      return;
    }

    if (method === 'GET' && path === '/health') {
      writeJson(res, 200, {
        ok: true,
        service: 'plundrix-agent-service',
        rpcUrl: agentConfig.rpcUrl,
        contractAddress: agentConfig.contractAddress,
      });
      return;
    }

    if (method === 'GET' && path === '/api/games') {
      const result = await listGames(...Object.values(parseListQuery(url)));
      writeJson(res, 200, result);
      return;
    }

    if (method === 'GET' && path === '/api/competition/overview') {
      writeJson(res, 200, await getCompetitionOverview());
      return;
    }

    if (method === 'GET' && path === '/api/competition/leaderboard') {
      const { limit, queue } = parseCompetitionQuery(url);
      writeJson(res, 200, await getLeaderboard({ limit, queue }));
      return;
    }

    if (method === 'GET' && path === '/api/competition/agent-ladder') {
      const { limit } = parseCompetitionQuery(url);
      writeJson(res, 200, await getLeaderboard({ limit, queue: 'agent_ladder' }));
      return;
    }

    if (method === 'GET' && path === '/api/competition/sessions') {
      const { limit, queue, state } = parseCompetitionQuery(url);
      writeJson(res, 200, await getCompetitionSessions({ limit, queue, state }));
      return;
    }

    if (method === 'GET' && path === '/api/competition/badges') {
      writeJson(res, 200, await getBadgeCatalog());
      return;
    }

    const profileRouteMatch = path.match(
      /^\/api\/competition\/profiles\/(0x[a-fA-F0-9]{40})$/
    );
    if (method === 'GET' && profileRouteMatch) {
      writeJson(
        res,
        200,
        await getCompetitionProfile(parsePlayerAddress(profileRouteMatch[1]))
      );
      return;
    }

    const gameRouteMatch = path.match(/^\/api\/games\/(\d+)$/);
    if (method === 'GET' && gameRouteMatch) {
      const snapshot = await getGameSnapshot(gameRouteMatch[1]);
      writeJson(res, 200, snapshot);
      return;
    }

    const availableActionsRouteMatch = path.match(
      /^\/api\/games\/(\d+)\/available-actions\/(0x[a-fA-F0-9]{40})$/
    );
    if (method === 'GET' && availableActionsRouteMatch) {
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
    if (method === 'GET' && historyRouteMatch) {
      const fromBlock = url.searchParams.get('fromBlock');
      const toBlock = url.searchParams.get('toBlock');
      const history = await getGameHistory(historyRouteMatch[1], {
        fromBlock: fromBlock ? BigInt(fromBlock) : undefined,
        toBlock: toBlock ? BigInt(toBlock) : undefined,
      });
      writeJson(res, 200, history);
      return;
    }

    if (method === 'POST' && path === '/api/recommend-action') {
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

    writeJson(res, 404, {
      error: 'Not found',
      routes: [
        'GET /health',
        'GET /api/games',
        'GET /api/competition/overview',
        'GET /api/competition/leaderboard',
        'GET /api/competition/agent-ladder',
        'GET /api/competition/sessions',
        'GET /api/competition/badges',
        'GET /api/competition/profiles/:playerAddress',
        'GET /api/games/:gameId',
        'GET /api/games/:gameId/available-actions/:playerAddress',
        'GET /api/games/:gameId/history',
        'POST /api/recommend-action',
      ],
    });
  } catch (error) {
    writeJson(res, 400, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

server.listen(agentConfig.port, '0.0.0.0', () => {
  console.log(
    `Plundrix agent service listening on http://0.0.0.0:${agentConfig.port}`
  );
});
