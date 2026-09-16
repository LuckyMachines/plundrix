import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { agentConfig } from '../agent-service/config.mjs';

const source = resolve(process.env.AGENT_WEEKLY_VAULT_SCORES_PATH || agentConfig.weeklyVaultScoresPath);
if (!existsSync(source)) throw new Error(`Weekly vault score store does not exist: ${source}`);
const contents = readFileSync(source);
const parsed = JSON.parse(contents.toString('utf8'));
if (parsed.schemaVersion !== 1 || !parsed.challenges || typeof parsed.challenges !== 'object') throw new Error('Weekly vault score store is not a supported export');

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const destination = resolve(process.env.PLUNDRIX_BACKUP_OUTPUT || `backups/weekly-vault/${stamp}-${basename(source)}`);
mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);
const checksum = createHash('sha256').update(contents).digest('hex');
writeFileSync(`${destination}.sha256`, `${checksum}  ${basename(destination)}\n`, 'utf8');
console.log(JSON.stringify({ source, destination, checksum, challengeCount: Object.keys(parsed.challenges).length }, null, 2));
