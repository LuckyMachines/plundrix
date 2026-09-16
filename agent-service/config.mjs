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

function getEnvBigInt(keys, fallback) {
  for (const key of keys) {
    const value = process.env[key];
    if (value === undefined) continue;
    try {
      return BigInt(value);
    } catch {
      // Use the safe fallback when an optional budget value is malformed.
    }
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
  workshopAddress: getEnvAddress(
    'AGENT_WORKSHOP_ADDRESS',
    'VITE_WORKSHOP_ADDRESS'
  ),
  historyLookbackBlocks: BigInt(
    getEnvNumber(['AGENT_HISTORY_LOOKBACK_BLOCKS'], 5000)
  ),
  allowOrigin: getEnvString('AGENT_ALLOW_ORIGIN') || '*',
  rawApiEnabled:
    getEnvString('AGENT_ENABLE_RAW_API')?.toLowerCase() === 'true',
  competitionCacheMs: getEnvNumber(['AGENT_COMPETITION_CACHE_MS'], 15000),
  seasonLengthDays: getEnvNumber(['AGENT_SEASON_LENGTH_DAYS'], 30),
  seasonEpochSeconds: getEnvNumber(
    ['AGENT_SEASON_EPOCH_SECONDS'],
    1735689600
  ),
  playerRegistryPath:
    getEnvString('AGENT_PLAYER_REGISTRY_PATH') ||
    resolve(process.cwd(), 'agent-service', 'data', 'player-registry.json'),
  sessionRelayEnabled:
    getEnvString('AGENT_ENABLE_SESSION_RELAY')?.toLowerCase() === 'true',
  sessionRelayPrivateKey: getEnvString('AGENT_SESSION_RELAY_PRIVATE_KEY'),
  managedPlayEnabled:
    getEnvString('AGENT_ENABLE_MANAGED_PLAY')?.toLowerCase() === 'true',
  managedSponsorPrivateKey: getEnvString('AGENT_SPONSOR_PRIVATE_KEY'),
  managedCustodySecret: getEnvString('AGENT_CUSTODY_SECRET'),
  managedSessionSecret: getEnvString('AGENT_SESSION_SECRET'),
  managedChainId: getEnvNumber(['AGENT_MANAGED_CHAIN_ID'], 11155111),
  managedMaxGasPriceWei: getEnvBigInt(['AGENT_MAX_GAS_PRICE_WEI'], 2_000_000_000n),
  managedMaxTransactionWei: getEnvBigInt(['AGENT_MAX_TRANSACTION_WEI'], 500_000_000_000_000n),
  managedDailyBudgetWei: getEnvBigInt(['AGENT_DAILY_BUDGET_WEI'], 10_000_000_000_000_000n),
  managedSponsorReserveWei: getEnvBigInt(['AGENT_SPONSOR_RESERVE_WEI'], 20_000_000_000_000_000n),
  managedMinimumFundingWei: getEnvBigInt(['AGENT_MIN_PLAYER_FUNDING_WEI'], 100_000_000_000_000n),
  managedMaximumPlayerBalanceWei: getEnvBigInt(['AGENT_MAX_PLAYER_BALANCE_WEI'], 1_000_000_000_000_000n),
  managedFundingMultiplier: getEnvNumber(['AGENT_FUNDING_MULTIPLIER'], 3),
  managedSessionMaxAgeSeconds: getEnvNumber(['AGENT_SESSION_MAX_AGE_SECONDS'], 15_552_000),
  managedBudgetPath:
    getEnvString('AGENT_SPONSOR_BUDGET_PATH') ||
    resolve(process.cwd(), 'agent-service', 'data', 'sponsor-budget.json'),
  managedOperationsPath:
    getEnvString('AGENT_MANAGED_OPERATIONS_PATH') ||
    resolve(process.cwd(), 'agent-service', 'data', 'managed-operations.json'),
  weeklyVaultScoresPath:
    getEnvString('AGENT_WEEKLY_VAULT_SCORES_PATH') ||
    resolve(process.cwd(), 'agent-service', 'data', 'weekly-vault-scores.json'),
  managedSweepIntervalMs: getEnvNumber(['AGENT_MANAGED_SWEEP_INTERVAL_MS'], 15_000),
};

export function validateAgentConfig() {
  if (!agentConfig.contractAddress) {
    throw new Error(
      'Missing AGENT_CONTRACT_ADDRESS or VITE_CONTRACT_ADDRESS for agent service'
    );
  }
  if (
    agentConfig.sessionRelayEnabled &&
    !/^0x[a-fA-F0-9]{64}$/.test(agentConfig.sessionRelayPrivateKey || '')
  ) {
    throw new Error(
      'AGENT_ENABLE_SESSION_RELAY requires AGENT_SESSION_RELAY_PRIVATE_KEY'
    );
  }
  if (agentConfig.managedPlayEnabled) {
    if (!agentConfig.workshopAddress) {
      throw new Error('AGENT_ENABLE_MANAGED_PLAY requires AGENT_WORKSHOP_ADDRESS');
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(agentConfig.managedSponsorPrivateKey || '')) {
      throw new Error('AGENT_ENABLE_MANAGED_PLAY requires AGENT_SPONSOR_PRIVATE_KEY');
    }
    if ((agentConfig.managedCustodySecret || '').length < 32) {
      throw new Error('AGENT_ENABLE_MANAGED_PLAY requires a 32+ character AGENT_CUSTODY_SECRET');
    }
    if ((agentConfig.managedSessionSecret || '').length < 32) {
      throw new Error('AGENT_ENABLE_MANAGED_PLAY requires a 32+ character AGENT_SESSION_SECRET');
    }
    if (agentConfig.managedCustodySecret === agentConfig.managedSessionSecret) {
      throw new Error('AGENT_CUSTODY_SECRET and AGENT_SESSION_SECRET must be different');
    }
    if (process.env.NODE_ENV === 'production' && agentConfig.allowOrigin === '*') {
      throw new Error('Managed play in production requires an exact AGENT_ALLOW_ORIGIN');
    }
    if (agentConfig.managedMaxGasPriceWei <= 0n || agentConfig.managedMaxTransactionWei <= 0n) {
      throw new Error('Managed gas and transaction ceilings must be positive');
    }
    if (agentConfig.managedMinimumFundingWei <= 0n || agentConfig.managedMaximumPlayerBalanceWei <= 0n) {
      throw new Error('Managed player funding limits must be positive');
    }
    if (agentConfig.managedMinimumFundingWei > agentConfig.managedMaximumPlayerBalanceWei) {
      throw new Error('AGENT_MIN_PLAYER_FUNDING_WEI must not exceed AGENT_MAX_PLAYER_BALANCE_WEI');
    }
    if (agentConfig.managedMaxTransactionWei > agentConfig.managedMaximumPlayerBalanceWei) {
      throw new Error('AGENT_MAX_TRANSACTION_WEI must not exceed AGENT_MAX_PLAYER_BALANCE_WEI');
    }
    if (agentConfig.managedMaximumPlayerBalanceWei > agentConfig.managedDailyBudgetWei) {
      throw new Error('AGENT_MAX_PLAYER_BALANCE_WEI must not exceed AGENT_DAILY_BUDGET_WEI');
    }
    if (!Number.isFinite(agentConfig.managedFundingMultiplier) || agentConfig.managedFundingMultiplier < 1) {
      throw new Error('AGENT_FUNDING_MULTIPLIER must be at least 1');
    }
    if (agentConfig.managedSweepIntervalMs < 5_000) {
      throw new Error('AGENT_MANAGED_SWEEP_INTERVAL_MS must be at least 5000');
    }
  }
}
