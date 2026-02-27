import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const artifactPath = resolve(
  root,
  'out',
  'PlundrixGame.sol',
  'PlundrixGame.json'
);
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
const abi = JSON.stringify(artifact.abi, null, 2) + '\n';

writeFileSync(resolve(root, 'abi', 'PlundrixGame.json'), abi);
writeFileSync(resolve(root, 'app', 'src', 'config', 'PlundrixGame.json'), abi);

console.log('Synced ABI to abi/ and app/src/config/.');
