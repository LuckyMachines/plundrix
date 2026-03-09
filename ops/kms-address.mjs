import { getKmsAddress, getKmsKeyConfig } from './kms-lib.mjs';

const config = getKmsKeyConfig();
const address = getKmsAddress(config);

console.log(`key=${config.key}`);
console.log(`version=${config.version}`);
console.log(`address=${address}`);
