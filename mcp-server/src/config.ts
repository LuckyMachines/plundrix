import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { isAddress, type Address } from 'viem';

loadEnv({ path: resolve(process.cwd(), '.env') });
loadEnv({ path: resolve(process.cwd(), 'app', '.env.local'), override: false } as any);

function getEnvAddress(...keys: string[]): Address | null {
  for (const key of keys) {
    const value = process.env[key];
    if (value && isAddress(value)) return value;
  }
  return null;
}

function getEnvString(...keys: string[]): string | null {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return null;
}

function getEnvNumber(keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = process.env[key];
    if (value === undefined) continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export const mcpConfig = {
  // Game contract
  rpcUrl:
    getEnvString('MCP_RPC_URL', 'VITE_RPC_URL', 'SEPOLIA_RPC_URL') ||
    'https://rpc.sepolia.org',
  contractAddress: getEnvAddress('MCP_CONTRACT_ADDRESS', 'VITE_CONTRACT_ADDRESS'),
  historyLookbackBlocks: BigInt(
    getEnvNumber(['MCP_HISTORY_LOOKBACK_BLOCKS'], 5000)
  ),

  // Sidecar
  sidecarPort: getEnvNumber(['MCP_SIDECAR_PORT'], 4402),
  sidecarHost: getEnvString('MCP_SIDECAR_HOST') || 'http://localhost',

  // x402 payments (Base Sepolia USDC)
  paymentChainId: getEnvNumber(['MCP_PAYMENT_CHAIN_ID'], 84532),
  facilitatorUrl:
    getEnvString('MCP_FACILITATOR_URL') ||
    'https://x402.org/facilitator',

  // Relay signer — either a raw private key (dev) or GCP KMS config (prod)
  relayPrivateKey: getEnvString('RELAY_PRIVATE_KEY'),
  gcpProject: getEnvString('GCP_PROJECT') || 'racerverse-custody',
  gcpKmsLocation: getEnvString('GCP_KMS_LOCATION') || 'us-east1',
  gcpKmsKeyring: getEnvString('GCP_KMS_KEYRING') || 'ethereum-keys',
  gcpKmsKey: getEnvString('GCP_KMS_KEY'),
  gcpKmsKeyVersion: getEnvString('GCP_KMS_KEY_VERSION') || '1',
};

export function getSidecarUrl(): string {
  return `${mcpConfig.sidecarHost}:${mcpConfig.sidecarPort}`;
}

export function validateConfig(): void {
  if (!mcpConfig.contractAddress) {
    throw new Error(
      'Missing MCP_CONTRACT_ADDRESS or VITE_CONTRACT_ADDRESS'
    );
  }
  if (!mcpConfig.relayPrivateKey && !mcpConfig.gcpKmsKey) {
    throw new Error(
      'Relay signer required: set RELAY_PRIVATE_KEY or GCP_KMS_KEY'
    );
  }
}
