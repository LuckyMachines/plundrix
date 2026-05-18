import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import {
  buildPlaytestMission,
  createImportedPlaytestSession,
  exportPlaytestReportMarkdown,
  generatePlaytestReport,
} from '../src/lib/playtestCoach.js';

function readArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

async function writeOutput(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((item) => item.trim());
}

function coerceCell(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const number = Number(value);
  return value !== '' && Number.isFinite(number) ? number : value;
}

function readCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const headers = parseCsvLine(lines.shift() || '');
  const sessions = lines.map((line) => Object.fromEntries(parseCsvLine(line).map((cell, index) => [headers[index], coerceCell(cell)])));
  return {
    mission: {
      sourceType: sessions[0]?.sourceType || 'manual-design-question',
      category: sessions[0]?.category || 'onboarding',
      question: sessions[0]?.question || 'Imported playtest session.',
      title: sessions[0]?.title || 'Imported Playtest',
      seed: sessions[0]?.seed || 'imported-playtest',
      scenario: sessions[0]?.scenario || 'new-player-table',
      testers: sessions.length,
    },
    sessions,
  };
}

function readInput(text, path) {
  if (extname(path).toLowerCase() === '.csv') return readCsv(text);
  return JSON.parse(text);
}

function validateImportPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Playtest import must be an object.');
  if (!payload.mission || typeof payload.mission !== 'object') throw new Error('Playtest import missing mission.');
  if (!Array.isArray(payload.sessions) || !payload.sessions.length) throw new Error('Playtest import requires at least one session.');
  for (const session of payload.sessions) {
    if (!session.testerId && !session.tester) throw new Error('Each playtest session requires testerId.');
    if (!['facilitated', 'live-session'].includes(session.evidenceType)) throw new Error('Imported playtest sessions must be facilitated or live-session evidence.');
  }
}

const args = readArgs(process.argv.slice(2));
if (!args.file) throw new Error('Usage: npm run playtest:import -- --file app/data/playtests/sample-session.json --markdown');

const requestedPath = join(process.cwd(), args.file);
const inputPath = existsSync(requestedPath) || !String(args.file).startsWith('app/')
  ? requestedPath
  : join(process.cwd(), String(args.file).slice(4));
const inputText = await readFile(inputPath, 'utf8');
const payload = readInput(inputText, args.file);
validateImportPayload(payload);

const mission = buildPlaytestMission({
  ...payload.mission,
  sourceType: payload.mission.sourceType || 'manual-design-question',
  category: payload.mission.category || 'onboarding',
  question: payload.mission.question || payload.mission.title || 'Imported playtest session.',
  testers: payload.sessions.length,
});
const sessions = payload.sessions.map((session) => createImportedPlaytestSession(mission, session));
const report = generatePlaytestReport(mission, sessions);

const baseName = `${report.generatedAt.slice(0, 10)}-${report.id}`;
const jsonPath = join(process.cwd(), 'reports', 'playtest', 'imported', `${baseName}.json`);
const markdownPath = join(process.cwd(), 'reports', 'playtest', 'imported', `${baseName}.md`);
await writeOutput(jsonPath, JSON.stringify({ mission, sessions, report }, null, 2));
await writeOutput(markdownPath, exportPlaytestReportMarkdown(report));

if (args.json) {
  console.log(JSON.stringify(report, null, 2));
} else if (args.markdown) {
  console.log(exportPlaytestReportMarkdown(report));
} else {
  console.log(`Imported playtest report: ${report.id}`);
  console.log(`Evidence type: ${report.evidenceType}`);
  console.log(`Result: ${report.result}`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`Markdown: ${markdownPath}`);
}
