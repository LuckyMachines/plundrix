import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Combined launcher: starts both the MCP stdio server and the x402 sidecar.
 *
 * Usage: tsx src/start.ts
 *
 * The MCP server runs as a child process on stdio (so an MCP client
 * can connect to it), while the sidecar runs in this process.
 */

// Start sidecar in this process
import('./sidecar.js');

// Start MCP server as a child process (stdio passthrough)
const mcp = spawn(
  process.execPath,
  [
    '--import', 'tsx',
    resolve(import.meta.dirname, 'index.ts'),
  ],
  {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: process.env,
  }
);

// Pipe parent stdin → MCP stdin, MCP stdout → parent stdout
process.stdin.pipe(mcp.stdin!);
mcp.stdout!.pipe(process.stdout);

mcp.on('exit', (code) => {
  console.error(`[plundrix-start] MCP server exited with code ${code}`);
  process.exit(code ?? 1);
});

process.on('SIGINT', () => {
  mcp.kill('SIGINT');
  process.exit(0);
});
