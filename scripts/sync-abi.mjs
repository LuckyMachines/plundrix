import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
for (const contractName of ['PlundrixGame', 'PlundrixWorkshop']) {
  const artifactPath = resolve(
    root,
    'out',
    `${contractName}.sol`,
    `${contractName}.json`
  );
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
  const abi = JSON.stringify(artifact.abi, null, 2) + '\n';
  writeFileSync(resolve(root, 'abi', `${contractName}.json`), abi);
  writeFileSync(resolve(root, 'app', 'src', 'config', `${contractName}.json`), abi);
}

console.log('Synced game and workshop ABIs to abi/ and app/src/config/.');
