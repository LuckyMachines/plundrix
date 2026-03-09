import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { isAddress } from 'viem';

loadEnv({ path: resolve(process.cwd(), '.env') });
loadEnv({ path: resolve(process.cwd(), 'app', '.env.local'), override: false });

function getEnvAddress(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (isAddress(value)) return value;
  }
  return null;
}

function getEnvString(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return null;
}

function getEnvNumber(keys, fallback) {
  for (const key of keys) {
    const value = process.env[key];
    if (value === undefined) continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export const agentConfig = {
  port: getEnvNumber(['AGENT_PORT', 'PORT'], 8787),
  rpcUrl:
    getEnvString(
      'AGENT_RPC_URL',
      'VITE_FOUNDRY_RPC_URL',
      'VITE_RPC_URL',
      'SEPOLIA_RPC_URL',
      'ANVIL_RPC_URL'
    ) || 'http://127.0.0.1:18645',
  contractAddress: getEnvAddress(
    'AGENT_CONTRACT_ADDRESS',
    'VITE_CONTRACT_ADDRESS'
  ),
  historyLookbackBlocks: BigInt(
    getEnvNumber(['AGENT_HISTORY_LOOKBACK_BLOCKS'], 5000)
  ),
  allowOrigin: getEnvString('AGENT_ALLOW_ORIGIN') || '*',
  competitionCacheMs: getEnvNumber(['AGENT_COMPETITION_CACHE_MS'], 15000),
  seasonLengthDays: getEnvNumber(['AGENT_SEASON_LENGTH_DAYS'], 30),
  seasonEpochSeconds: getEnvNumber(
    ['AGENT_SEASON_EPOCH_SECONDS'],
    1735689600
  ),
  playerRegistryPath:
    getEnvString('AGENT_PLAYER_REGISTRY_PATH') ||
    resolve(process.cwd(), 'agent-service', 'data', 'player-registry.json'),
};

export function validateAgentConfig() {
  if (!agentConfig.contractAddress) {
    throw new Error(
      'Missing AGENT_CONTRACT_ADDRESS or VITE_CONTRACT_ADDRESS for agent service'
    );
  }
}
