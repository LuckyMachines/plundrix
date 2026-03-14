import {
  createWalletClient,
  http,
  type Address,
  type WalletClient,
  encodeFunctionData,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { mcpConfig } from './config.js';
import { abi, client as publicClient } from './contract-read.js';

let walletClient: WalletClient | null = null;
let signerAddress: Address | null = null;

/**
 * Initialize the relay signer.
 * For now supports RELAY_PRIVATE_KEY. KMS support uses the same
 * pattern as ops/kms-lib.mjs but is deferred to production setup.
 */
export function initSigner(): Address {
  if (signerAddress) return signerAddress;

  if (mcpConfig.relayPrivateKey) {
    const account = privateKeyToAccount(mcpConfig.relayPrivateKey as `0x${string}`);
    walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(mcpConfig.rpcUrl),
    });
    signerAddress = account.address;
    return signerAddress;
  }

  throw new Error('No relay signer configured. Set RELAY_PRIVATE_KEY.');
}

export function getSignerAddress(): Address {
  if (!signerAddress) initSigner();
  return signerAddress!;
}

async function writeContract(
  functionName: string,
  args: unknown[],
  value?: bigint
): Promise<string> {
  if (!walletClient) initSigner();

  const data = encodeFunctionData({ abi, functionName, args });

  const hash = await walletClient!.sendTransaction({
    account: signerAddress!,
    to: mcpConfig.contractAddress!,
    data,
    value: value ?? 0n,
    chain: sepolia,
  });

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt.transactionHash;
}

export async function createGame(): Promise<{ txHash: string }> {
  const txHash = await writeContract('createGame', []);
  return { txHash };
}

export async function registerPlayer(gameId: number): Promise<{ txHash: string }> {
  const txHash = await writeContract('registerPlayer', [BigInt(gameId)]);
  return { txHash };
}

export async function submitAction(
  gameId: number,
  action: number,
  sabotageTarget: Address = '0x0000000000000000000000000000000000000000'
): Promise<{ txHash: string }> {
  const txHash = await writeContract('submitAction', [
    BigInt(gameId),
    action,
    sabotageTarget,
  ]);
  return { txHash };
}

export async function resolveRound(gameId: number): Promise<{ txHash: string }> {
  const txHash = await writeContract('resolveRound', [BigInt(gameId)]);
  return { txHash };
}
