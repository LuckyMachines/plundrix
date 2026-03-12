import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  createChainClient,
  deployContractWithKms,
  getEnv,
  getKmsAddress,
  getKmsKeyConfig,
  writeContractWithKms,
} from './kms-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const artifact = JSON.parse(
  readFileSync(resolve(root, 'out/PlundrixGame.sol/PlundrixGame.json'), 'utf8')
);

const chainName = getEnv('CHAIN', 'mainnet');
const rpcUrl = getEnv('RPC_URL');
const proxyAddress = getEnv('PROXY_ADDRESS');
const signerConfig = getKmsKeyConfig({
  key: getEnv('GCP_KMS_KEY'),
});
const signerAddress = getKmsAddress(signerConfig);
const client = createChainClient({ chainName, rpcUrl });

console.log(`chain=${chainName}`);
console.log(`signer=${signerAddress}`);
console.log(`proxy=${proxyAddress}`);

// Deploy new implementation
const implementationHash = await deployContractWithKms({
  client,
  address: signerAddress,
  bytecode: artifact.bytecode.object,
  ...signerConfig,
});
const implementationReceipt = await client.waitForTransactionReceipt({
  hash: implementationHash,
});
const implementationAddress = implementationReceipt.contractAddress;

// Call upgradeTo on the proxy
const upgradeHash = await writeContractWithKms({
  client,
  address: signerAddress,
  contractAddress: proxyAddress,
  abi: artifact.abi,
  functionName: 'upgradeTo',
  args: [implementationAddress],
  ...signerConfig,
});
await client.waitForTransactionReceipt({ hash: upgradeHash });

console.log(`implementationTx=${implementationHash}`);
console.log(`implementation=${implementationAddress}`);
console.log(`upgradeTx=${upgradeHash}`);
console.log('Upgrade complete. No data migration needed.');
