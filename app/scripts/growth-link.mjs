import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildTrackedUrl } from '../src/lib/growthSystem.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, token, index, list) => {
  if (token.startsWith('--')) pairs.push([token.slice(2), list[index + 1]?.startsWith('--') ? true : list[index + 1]]);
  return pairs;
}, []));
const registry = JSON.parse(await readFile(resolve('growth', 'campaigns.json'), 'utf8'));
const campaign = registry.campaigns.find((item) => item.id === args.campaign);
if (!campaign) throw new Error(`Unknown campaign. Use --campaign with one of: ${registry.campaigns.map((item) => item.id).join(', ')}`);
console.log(buildTrackedUrl(campaign, args.destination || campaign.destination));
