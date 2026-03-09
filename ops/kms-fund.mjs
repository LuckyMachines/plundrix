import { parseEther } from 'viem';
import {
  createChainClient,
  getEnv,
  getKmsAddress,
  getKmsKeyConfig,
  sendTransactionWithKms,
} from './kms-lib.mjs';

const chainName = getEnv('CHAIN', 'mainnet');
const rpcUrl = getEnv('RPC_URL');
const sourceConfig = getKmsKeyConfig({
  key: getEnv('GCP_KMS_KEY'),
});
const sourceAddress = getKmsAddress(sourceConfig);
const to = getEnv('TO_ADDRESS');
const amountEth = getEnv('AMOUNT_ETH');
const client = createChainClient({ chainName, rpcUrl });

const balanceBefore = await client.getBalance({ address: sourceAddress });
const destinationBalanceBefore = await client.getBalance({ address: to });
const value = parseEther(amountEth);

console.log(`chain=${chainName}`);
console.log(`from=${sourceAddress}`);
console.log(`to=${to}`);
console.log(`amountEth=${amountEth}`);
console.log(`fromBalanceBeforeWei=${balanceBefore}`);
console.log(`toBalanceBeforeWei=${destinationBalanceBefore}`);

const hash = await sendTransactionWithKms({
  client,
  address: sourceAddress,
  value,
  to,
  ...sourceConfig,
});

console.log(`txHash=${hash}`);

const receipt = await client.waitForTransactionReceipt({ hash });
const sourceBalanceAfter = await client.getBalance({ address: sourceAddress });
const destinationBalanceAfter = await client.getBalance({ address: to });

console.log(`status=${receipt.status}`);
console.log(`gasUsed=${receipt.gasUsed}`);
console.log(`effectiveGasPrice=${receipt.effectiveGasPrice}`);
console.log(`fromBalanceAfterWei=${sourceBalanceAfter}`);
console.log(`toBalanceAfterWei=${destinationBalanceAfter}`);
