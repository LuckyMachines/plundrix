import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerReadTools } from './tools/read-tools.js';
import { registerWriteTools } from './tools/write-tools.js';

const server = new McpServer({
  name: 'plundrix',
  version: '0.1.0',
});

// Free read tools — call contract directly
registerReadTools(server);

// Paid write tools — proxy to x402 sidecar
registerWriteTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[plundrix-mcp] Server running on stdio');
}

main().catch((err) => {
  console.error('[plundrix-mcp] Fatal:', err);
  process.exit(1);
});
