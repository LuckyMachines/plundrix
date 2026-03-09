import { spawnSync } from 'child_process';
import { createPublicKey } from 'crypto';
import {
  concatHex,
  encodeAbiParameters,
  encodeFunctionData,
  getAddress,
  hexToBigInt,
  http,
  keccak256,
  padHex,
  parseAbiParameters,
  recoverAddress,
  serializeTransaction,
  toBytes,
  toHex,
  createPublicClient,
} from 'viem';
import { base, baseSepolia, mainnet, sepolia } from 'viem/chains';

const SECP256K1_N = BigInt(
  '0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141'
);
const SECP256K1_HALF_N = SECP256K1_N / 2n;

export function getEnv(name, fallback = undefined) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export function resolveChain(chainName) {
  switch ((chainName || 'mainnet').toLowerCase()) {
    case 'mainnet':
    case 'ethereum':
      return mainnet;
    case 'sepolia':
      return sepolia;
    case 'base':
    case 'base-mainnet':
      return base;
    case 'base-sepolia':
      return baseSepolia;
    default:
      throw new Error(`Unsupported chain ${chainName}`);
  }
}

export function createChainClient({ chainName, rpcUrl }) {
  const chain = resolveChain(chainName);
  return createPublicClient({
    chain,
    transport: http(rpcUrl || getEnv('RPC_URL'), {
      timeout: 30000,
      retryCount: 2,
    }),
  });
}

export function publicKeyPemToAddress(pem) {
  const jwk = createPublicKey(pem).export({ format: 'jwk' });
  const x = Buffer.from(jwk.x, 'base64url');
  const y = Buffer.from(jwk.y, 'base64url');
  const uncompressed = Buffer.concat([Buffer.from([4]), x, y]);
  const hash = keccak256(toHex(uncompressed.subarray(1)));
  return getAddress(`0x${hash.slice(-40)}`);
}

function gcloud(commandArgs) {
  const result =
    process.platform === 'win32'
      ? spawnSync('cmd.exe', ['/d', '/s', '/c', 'gcloud', ...commandArgs], {
          encoding: 'utf8',
        })
      : spawnSync('gcloud', commandArgs, {
          encoding: 'utf8',
        });
  if (result.status !== 0) {
    const reason =
      result.stderr ||
      result.stdout ||
      result.error?.message ||
      'gcloud command failed';
    throw new Error(reason);
  }
  return result.stdout.trim();
}

export function getKmsKeyConfig(overrides = {}) {
  return {
    project: overrides.project || getEnv('GCP_PROJECT', 'racerverse-custody'),
    location: overrides.location || getEnv('GCP_KMS_LOCATION', 'us-east1'),
    keyring: overrides.keyring || getEnv('GCP_KMS_KEYRING', 'ethereum-keys'),
    key: overrides.key || getEnv('GCP_KMS_KEY'),
    version: overrides.version || getEnv('GCP_KMS_KEY_VERSION', '1'),
  };
}

export function getKmsKeyVersionName(config) {
  return [
    'projects',
    config.project,
    'locations',
    config.location,
    'keyRings',
    config.keyring,
    'cryptoKeys',
    config.key,
    'cryptoKeyVersions',
    config.version,
  ].join('/');
}

export function getKmsPublicKeyPem(overrides = {}) {
  const config = getKmsKeyConfig(overrides);
  return gcloud([
    'kms',
    'keys',
    'versions',
    'get-public-key',
    config.version,
    `--key=${config.key}`,
    `--keyring=${config.keyring}`,
    `--location=${config.location}`,
    `--project=${config.project}`,
    '--output-file=-',
  ]);
}

export function getKmsAddress(overrides = {}) {
  return publicKeyPemToAddress(getKmsPublicKeyPem(overrides));
}

async function getAccessToken() {
  return gcloud(['auth', 'print-access-token']);
}

function parseDerSignature(signatureBytes) {
  let offset = 0;
  if (signatureBytes[offset++] !== 0x30) {
    throw new Error('Invalid DER sequence');
  }
  const seqLen = signatureBytes[offset++];
  if (seqLen + 2 !== signatureBytes.length) {
    throw new Error('Unexpected DER sequence length');
  }
  if (signatureBytes[offset++] !== 0x02) {
    throw new Error('Missing DER r marker');
  }
  const rLen = signatureBytes[offset++];
  const rBytes = signatureBytes.subarray(offset, offset + rLen);
  offset += rLen;
  if (signatureBytes[offset++] !== 0x02) {
    throw new Error('Missing DER s marker');
  }
  const sLen = signatureBytes[offset++];
  const sBytes = signatureBytes.subarray(offset, offset + sLen);

  const r = hexToBigInt(toHex(rBytes));
  const s = hexToBigInt(toHex(sBytes));
  return { r, s };
}

function normalizeSignature({ r, s }) {
  if (s > SECP256K1_HALF_N) {
    return { r, s: SECP256K1_N - s };
  }
  return { r, s };
}

async function recoverSignature({ digestHex, address, r, s }) {
  const normalized = normalizeSignature({ r, s });
  const expected = getAddress(address);

  for (const yParity of [0, 1]) {
    const recovered = await recoverAddress({
      hash: digestHex,
      signature: {
        r: padHex(toHex(normalized.r), { size: 32 }),
        s: padHex(toHex(normalized.s), { size: 32 }),
        yParity,
      },
    });

    if (getAddress(recovered) === expected) {
      return {
        r: padHex(toHex(normalized.r), { size: 32 }),
        s: padHex(toHex(normalized.s), { size: 32 }),
        yParity,
      };
    }
  }

  throw new Error('Unable to recover expected signer from KMS signature');
}

export async function signDigestWithKms({ digestHex, address, ...overrides }) {
  const config = getKmsKeyConfig(overrides);
  const token = await getAccessToken();
  const response = await fetch(
    `https://cloudkms.googleapis.com/v1/${getKmsKeyVersionName(config)}:asymmetricSign`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        digest: {
          // Cloud KMS expects a 32-byte digest payload in this field. For
          // Ethereum transactions we pass the keccak256 digest bytes here.
          sha256: Buffer.from(toBytes(digestHex)).toString('base64'),
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`KMS sign failed: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  const signatureBytes = Buffer.from(payload.signature, 'base64');
  const { r, s } = parseDerSignature(signatureBytes);
  return recoverSignature({ digestHex, address, r, s });
}

export async function signTransactionWithKms({ transaction, address, ...overrides }) {
  const digestHex = keccak256(serializeTransaction(transaction));
  const signature = await signDigestWithKms({
    digestHex,
    address,
    ...overrides,
  });
  return serializeTransaction(transaction, signature);
}

export async function prepareTransaction({
  client,
  address,
  to,
  data = '0x',
  value = 0n,
  gas,
  nonce,
  maxFeePerGas,
  maxPriorityFeePerGas,
}) {
  const [resolvedNonce, feeEstimate] = await Promise.all([
    nonce !== undefined
      ? Promise.resolve(nonce)
      : client.getTransactionCount({ address }),
    client.estimateFeesPerGas(),
  ]);

  const request = {
    account: address,
    chain: client.chain,
    chainId: client.chain.id,
    to,
    data,
    value,
    nonce: resolvedNonce,
    type: 'eip1559',
    maxFeePerGas: maxFeePerGas ?? feeEstimate.maxFeePerGas,
    maxPriorityFeePerGas:
      maxPriorityFeePerGas ?? feeEstimate.maxPriorityFeePerGas,
  };

  const resolvedGas =
    gas ??
    (await client.estimateGas({
      ...request,
    }));

  return {
    ...request,
    gas: resolvedGas,
  };
}

export async function sendTransactionWithKms({
  client,
  address,
  to,
  data = '0x',
  value = 0n,
  gas,
  nonce,
  maxFeePerGas,
  maxPriorityFeePerGas,
  ...overrides
}) {
  const transaction = await prepareTransaction({
    client,
    address,
    to,
    data,
    value,
    gas,
    nonce,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
  const serializedTransaction = await signTransactionWithKms({
    transaction,
    address,
    ...overrides,
  });
  return client.sendRawTransaction({
    serializedTransaction,
  });
}

export async function writeContractWithKms({
  client,
  address,
  contractAddress,
  abi,
  functionName,
  args = [],
  value = 0n,
  ...overrides
}) {
  return sendTransactionWithKms({
    client,
    address,
    to: contractAddress,
    value,
    data: encodeFunctionData({
      abi,
      functionName,
      args,
    }),
    ...overrides,
  });
}

export async function deployContractWithKms({
  client,
  address,
  bytecode,
  constructorTypes = '',
  constructorArgs = [],
  ...overrides
}) {
  const encodedArgs = constructorTypes
    ? encodeAbiParameters(parseAbiParameters(constructorTypes), constructorArgs)
    : '0x';
  const data =
    constructorTypes && encodedArgs !== '0x'
      ? concatHex([bytecode, encodedArgs])
      : bytecode;

  return sendTransactionWithKms({
    client,
    address,
    data,
    ...overrides,
  });
}
