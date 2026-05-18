import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  buildFocusedGhostValidation,
  exportFocusedGhostValidationMarkdown,
  runGhostBatch,
} from '../src/lib/playerTelemetryGhosts.js';
import { SIM_DEFAULT_RULES } from '../src/lib/plundrixEngine.js';

function readArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function parseJsonArg(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    const repaired = String(value).replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
    return JSON.parse(repaired);
  }
}

async function writeOutput(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

const args = readArgs(process.argv.slice(2));
const seed = args.seed || 'tool-hoarder-validation';
const budget = args.budget || 'smoke';
const games = args.games ? Number(args.games) : budget === 'normal' ? 48 : 12;
const rules = { ...SIM_DEFAULT_RULES, ...parseJsonArg(args.rules) };
const scenarios = String(args.scenarios || 'balanced-cast,greedy-table')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const reports = scenarios.map((scenario) => runGhostBatch({
  scenario,
  seed: `${seed}-${scenario}`,
  budget,
  games,
  rules,
  maxRounds: args['max-rounds'] ? Number(args['max-rounds']) : 40,
}));
const validation = buildFocusedGhostValidation(reports, args.archetype || 'tool-hoarder');

if (args.out) {
  await writeOutput(join(process.cwd(), args.out), args.json
    ? JSON.stringify(validation, null, 2)
    : exportFocusedGhostValidationMarkdown(validation));
}

if (args.report) {
  const base = `tool-hoarder-validation-${Date.now()}`;
  await writeOutput(join(process.cwd(), 'reports', 'ghosts', `${base}.json`), JSON.stringify(validation, null, 2));
  await writeOutput(join(process.cwd(), 'reports', 'ghosts', `${base}.md`), exportFocusedGhostValidationMarkdown(validation));
}

if (args.json) console.log(JSON.stringify(validation, null, 2));
else console.log(exportFocusedGhostValidationMarkdown(validation));
