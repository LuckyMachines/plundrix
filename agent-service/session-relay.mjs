import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { agentConfig } from './config.mjs';

const abi = JSON.parse(readFileSync(resolve(process.cwd(), 'abi', 'PlundrixGame.json'), 'utf8'));
const transport = http(agentConfig.rpcUrl);
const publicClient = createPublicClient({ transport });
const account = agentConfig.sessionRelayEnabled
  ? privateKeyToAccount(agentConfig.sessionRelayPrivateKey)
  : null;
const walletClient = account ? createWalletClient({ account, transport }) : null;

function parseRequest(body) {
  if (!agentConfig.sessionRelayEnabled || !walletClient) {
    throw new Error('Session relay is disabled');
  }
  const gameId = BigInt(body.gameId);
  const action = Number(body.action);
  const deadline = BigInt(body.deadline);
  if (gameId <= 0n) throw new Error('Invalid gameId');
  if (![1, 2, 3].includes(action)) throw new Error('Invalid action');
  if (!isAddress(body.player)) throw new Error('Invalid player');
  if (!isAddress(body.sabotageTarget)) throw new Error('Invalid sabotageTarget');
  if (!/^0x[a-fA-F0-9]{130}$/.test(body.signature || '')) throw new Error('Invalid signature');
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (deadline <= now) throw new Error('Session action expired');
  if (deadline > now + 180n) throw new Error('Session deadline too far in the future');
  return { gameId, player: body.player, action, sabotageTarget: body.sabotageTarget, deadline, signature: body.signature };
}

export function getSessionRelayStatus() {
  return {
    enabled: Boolean(agentConfig.sessionRelayEnabled && walletClient),
    relayer: account?.address || null,
  };
}

export async function relaySessionAction(body) {
  const request = parseRequest(body);
  const args = [
    request.gameId,
    request.player,
    request.action,
    request.sabotageTarget,
    request.deadline,
    request.signature,
  ];
  const { request: transaction } = await publicClient.simulateContract({
    account,
    address: agentConfig.contractAddress,
    abi,
    functionName: 'submitActionWithSession',
    args,
  });
  const hash = await walletClient.writeContract(transaction);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw new Error('Relayed action reverted');
  return { hash, blockNumber: receipt.blockNumber.toString(), status: receipt.status };
}
