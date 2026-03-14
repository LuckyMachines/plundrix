import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getSidecarUrl } from '../config.js';

/**
 * Write tools proxy to the x402 sidecar.
 * Each tool calls the sidecar HTTP endpoint, passing the agent's
 * x402 payment header so the sidecar middleware can verify/settle.
 */

async function callSidecar(
  path: string,
  body: Record<string, unknown>,
  paymentHeader?: string
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = `${getSidecarUrl()}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (paymentHeader) {
    headers['X-PAYMENT'] = paymentHeader;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({ error: 'Non-JSON response' }));

  if (response.status === 402) {
    return {
      ok: false,
      status: 402,
      data: {
        message: 'Payment required. Include a valid x402 payment header.',
        paymentDetails: data,
      },
    };
  }

  return { ok: response.ok, status: response.status, data };
}

export function registerWriteTools(server: McpServer): void {
  server.tool(
    'plundrix_create_game',
    'Create a new Plundrix game (costs gas — requires x402 payment)',
    {
      paymentHeader: z
        .string()
        .optional()
        .describe('x402 payment header for gas cost coverage'),
    },
    async ({ paymentHeader }) => {
      const result = await callSidecar('/tx/create-game', {}, paymentHeader);
      if (!result.ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  server.tool(
    'plundrix_register_player',
    'Register the relay signer as a player in a game (costs gas — requires x402 payment)',
    {
      gameId: z.number().int().positive().describe('Game ID to join'),
      paymentHeader: z
        .string()
        .optional()
        .describe('x402 payment header for gas cost coverage'),
    },
    async ({ gameId, paymentHeader }) => {
      const result = await callSidecar(
        '/tx/register-player',
        { gameId },
        paymentHeader
      );
      if (!result.ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  server.tool(
    'plundrix_submit_action',
    'Submit a game action: 1=PICK, 2=SEARCH, 3=SABOTAGE (costs gas — requires x402 payment)',
    {
      gameId: z.number().int().positive().describe('Game ID'),
      action: z
        .number()
        .int()
        .min(1)
        .max(3)
        .describe('Action code: 1=PICK, 2=SEARCH, 3=SABOTAGE'),
      sabotageTarget: z
        .string()
        .optional()
        .describe('Target player address (required for SABOTAGE)'),
      paymentHeader: z
        .string()
        .optional()
        .describe('x402 payment header for gas cost coverage'),
    },
    async ({ gameId, action, sabotageTarget, paymentHeader }) => {
      const result = await callSidecar(
        '/tx/submit-action',
        { gameId, action, sabotageTarget },
        paymentHeader
      );
      if (!result.ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  server.tool(
    'plundrix_resolve_round',
    'Resolve a timed-out round (costs gas — requires x402 payment)',
    {
      gameId: z.number().int().positive().describe('Game ID'),
      paymentHeader: z
        .string()
        .optional()
        .describe('x402 payment header for gas cost coverage'),
    },
    async ({ gameId, paymentHeader }) => {
      const result = await callSidecar(
        '/tx/resolve-round',
        { gameId },
        paymentHeader
      );
      if (!result.ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    }
  );
}
