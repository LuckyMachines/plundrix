import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { encodeFunctionData } from 'viem';
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
const proxyArtifact = JSON.parse(
  readFileSync(resolve(root, 'out/ERC1967Proxy.sol/ERC1967Proxy.json'), 'utf8')
);

const chainName = getEnv('CHAIN', 'mainnet');
const rpcUrl = getEnv('RPC_URL');
const signerConfig = getKmsKeyConfig({
  key: getEnv('GCP_KMS_KEY'),
});
const signerAddress = getKmsAddress(signerConfig);
const defaultAdmin = getEnv('DEFAULT_ADMIN_ADDRESS', signerAddress);
const gameMaster = getEnv('GAME_MASTER_ADDRESS', defaultAdmin);
const pauser = getEnv('PAUSER_ADDRESS', defaultAdmin);
const upgrader = getEnv('UPGRADER_ADDRESS', defaultAdmin);
const autoResolver = getEnv('AUTO_RESOLVER_ADDRESS', defaultAdmin);
const randomizer = getEnv('RANDOMIZER_ADDRESS', defaultAdmin);
const startPaused = getEnv('START_PAUSED', 'true').toLowerCase() === 'true';
const autoResolveEnabled =
  getEnv('AUTO_RESOLVE_ENABLED', 'true').toLowerCase() === 'true';
const autoResolveDelay = BigInt(getEnv('AUTO_RESOLVE_DELAY', '300'));
const requireExternalEntropy =
  getEnv('REQUIRE_EXTERNAL_ENTROPY', 'true').toLowerCase() === 'true';

const client = createChainClient({ chainName, rpcUrl });

console.log(`chain=${chainName}`);
console.log(`signer=${signerAddress}`);
console.log(`defaultAdmin=${defaultAdmin}`);
console.log(`gameMaster=${gameMaster}`);
console.log(`pauser=${pauser}`);
console.log(`upgrader=${upgrader}`);
console.log(`autoResolver=${autoResolver}`);
console.log(`randomizer=${randomizer}`);
console.log(`startPaused=${startPaused}`);
console.log(`autoResolveEnabled=${autoResolveEnabled}`);
console.log(`requireExternalEntropy=${requireExternalEntropy}`);

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

const initData = {
  defaultAdmin,
  gameMaster,
  pauser,
  upgrader,
  autoResolver,
  randomizer,
  startPaused,
};

const proxyHash = await deployContractWithKms({
  client,
  address: signerAddress,
  bytecode: proxyArtifact.bytecode.object,
  constructorTypes: 'address, bytes',
  constructorArgs: [
    implementationAddress,
    encodeFunctionData({
      abi: artifact.abi,
      functionName: 'initialize',
      args: [initData],
    }),
  ],
  ...signerConfig,
});
const proxyReceipt = await client.waitForTransactionReceipt({
  hash: proxyHash,
});
const proxyAddress = proxyReceipt.contractAddress;

if ((autoResolveEnabled || requireExternalEntropy) && signerAddress !== gameMaster) {
  throw new Error(
    'Signer must match GAME_MASTER_ADDRESS when applying automation settings at deploy time'
  );
}

if (autoResolveEnabled || requireExternalEntropy) {
  const configureHash = await writeContractWithKms({
    client,
    address: signerAddress,
    contractAddress: proxyAddress,
    abi: artifact.abi,
    functionName: 'configureAutomation',
    args: [autoResolveEnabled, autoResolveDelay, requireExternalEntropy],
    ...signerConfig,
  });
  await client.waitForTransactionReceipt({ hash: configureHash });
  console.log(`configureTx=${configureHash}`);
}

console.log(`implementationTx=${implementationHash}`);
console.log(`implementation=${implementationAddress}`);
console.log(`proxyTx=${proxyHash}`);
console.log(`proxy=${proxyAddress}`);
