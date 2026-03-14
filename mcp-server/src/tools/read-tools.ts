import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  getContractStatus,
  getGameSnapshot,
  getGameHistory,
  listGames,
  getTotalGames,
} from '../contract-read.js';

export function registerReadTools(server: McpServer): void {
  server.tool(
    'plundrix_status',
    'Get contract status: paused state, total games, automation and fee settings',
    {},
    async () => {
      const status = await getContractStatus();
      return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
    }
  );

  server.tool(
    'plundrix_list_games',
    'List recent games with pagination',
    {
      limit: z.number().min(1).max(100).default(20).describe('Number of games to return'),
      offset: z.number().min(0).default(0).describe('Offset from most recent game'),
    },
    async ({ limit, offset }) => {
      const result = await listGames(limit, offset);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'plundrix_game_snapshot',
    'Get full snapshot of a game: state, players, actions, automation config',
    {
      gameId: z.number().int().positive().describe('Game ID'),
    },
    async ({ gameId }) => {
      const snapshot = await getGameSnapshot(gameId);
      return { content: [{ type: 'text', text: JSON.stringify(snapshot, null, 2) }] };
    }
  );

  server.tool(
    'plundrix_game_history',
    'Get event history for a game (GameCreated, PlayerJoined, ActionOutcome, etc.)',
    {
      gameId: z.number().int().positive().describe('Game ID'),
    },
    async ({ gameId }) => {
      const history = await getGameHistory(gameId);
      return { content: [{ type: 'text', text: JSON.stringify(history, null, 2) }] };
    }
  );

  server.tool(
    'plundrix_total_games',
    'Get the total number of games created',
    {},
    async () => {
      const total = await getTotalGames();
      return { content: [{ type: 'text', text: JSON.stringify({ totalGames: total }) }] };
    }
  );
}
