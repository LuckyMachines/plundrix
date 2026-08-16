const contractAddress = process.env.AGENT_CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS;
const rpcUrl = process.env.AGENT_RPC_URL || process.env.VITE_RPC_URL;

if (contractAddress && rpcUrl) {
  process.env.AGENT_CONTRACT_ADDRESS = contractAddress;
  process.env.AGENT_RPC_URL = rpcUrl;
  process.env.AGENT_PORT ||= '8787';
  await import('../agent-service/server.mjs');
}

await import('../app/scripts/serve-dist.mjs');
