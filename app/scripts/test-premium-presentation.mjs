import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PREMIUM_PRESENTATION,
  cuesForOutcome,
  deriveRoundPresentation,
  normalizePresentationAction,
  presentationTimings,
} from '../src/data/presentationDirector.js';
import { GADGET_CINEMATICS } from '../src/data/gadgetCinematics.js';
import { GADGET_CHASSIS } from '../src/data/gadgetInventory.js';

const appDir = resolve(process.cwd());
assert.equal(PREMIUM_PRESENTATION.schemaVersion, 1);
assert.deepEqual(PREMIUM_PRESENTATION.phases, ['planning', 'sealed', 'revealing', 'impact', 'recovery']);
assert.deepEqual(Object.keys(PREMIUM_PRESENTATION.actions), ['pick', 'search', 'sabotage']);
assert.equal(normalizePresentationAction(1), 'pick');
assert.equal(normalizePresentationAction(2), 'search');
assert.equal(normalizePresentationAction(3), 'sabotage');
assert.ok(presentationTimings(false).recoveryMs <= PREMIUM_PRESENTATION.budgets.maxBlockingSequenceMs);
assert.ok(presentationTimings(true).settleMs < presentationTimings(false).revealMs);
assert.equal(Object.keys(GADGET_CINEMATICS).length, GADGET_CHASSIS.length);
assert.ok(GADGET_CHASSIS.every(({ id }) => GADGET_CINEMATICS[id]), 'Every gadget needs bespoke cinematic direction');

const players = [
  { id: 'player-1', name: 'Operator' },
  { id: 'player-2', name: 'Rook' },
];
const impact = deriveRoundPresentation({
  phase: 'impact',
  action: 1,
  outcome: { action: 3, actor: 'player-1', target: 'player-2', success: true, message: 'Circuit crossed.' },
  players,
  round: 4,
});
assert.equal(impact.route, 'sabotage');
assert.equal(impact.title, 'Circuit crossed');
assert.equal(impact.actorName, 'Operator');
assert.equal(impact.targetName, 'Rook');
assert.deepEqual(cuesForOutcome({ action: 2, success: false }, 'pick'), ['round.impact', 'signal.lost']);
assert.deepEqual(cuesForOutcome({ action: 1, success: true }, 'pick', { winner: true, gadget: true }), ['round.impact', 'lock.crack', 'gadget.signature', 'game.win']);

for (const path of [
  'presentation/manifest.json',
  'src/data/presentationDirector.js',
  'src/components/gameplay/RoundTheater.jsx',
  'src/components/gameplay/OperationCeremony.jsx',
  '../docs/premium-aaa-roadmap.md',
]) assert.ok(existsSync(resolve(appDir, path)), `Missing premium-presentation file: ${path}`);

const theater = readFileSync(resolve(appDir, 'src/components/gameplay/RoundTheater.jsx'), 'utf8');
const audio = readFileSync(resolve(appDir, 'src/components/shared/SessionAudioBridge.jsx'), 'utf8');
const signatureMoment = readFileSync(resolve(appDir, 'src/components/game/SignatureMoment.jsx'), 'utf8');
const instant = readFileSync(resolve(appDir, 'src/pages/InstantPlayPage.jsx'), 'utf8');
const vaultRun = readFileSync(resolve(appDir, 'src/pages/VaultRunPage.jsx'), 'utf8');
const managedGame = readFileSync(resolve(appDir, 'src/pages/ManagedGamePage.jsx'), 'utf8');
const actionDeck = readFileSync(resolve(appDir, 'src/components/gameplay/UnifiedActionDeck.jsx'), 'utf8');
const liveResolution = readFileSync(resolve(appDir, 'src/components/resolution/ResolveSequence.jsx'), 'utf8');
const styles = readFileSync(resolve(appDir, 'src/styles/caper.css'), 'utf8');
assert.match(theater, /data-theater-phase/);
assert.match(theater, /round-theater__gadget/);
assert.match(theater, /round-theater__route-gesture/);
assert.match(theater, /data-gadget-motion/);
assert.match(audio, /round\.seal/);
assert.match(audio, /sabotage\.blocked/);
assert.doesNotMatch(signatureMoment, /emitPresentationCues/);
assert.match(instant, /presentationTimings/);
assert.match(instant, /cuesForOutcome/);
assert.match(instant, /gadget: Boolean\(gadgetEvent\)/);
assert.match(vaultRun, /<RoundTheater/);
assert.match(vaultRun, /presentationTimings/);
assert.match(vaultRun, /disabled=\{resolving\}/);
assert.match(vaultRun, /gadget: Boolean\(gadgetEvent\)/);
assert.match(actionDeck, /data-gameplay-interface="unified"/);
assert.match(actionDeck, /modeLabel/);
assert.match(instant, /modeLabel=\{MODES\[mode\]\.label\}/);
assert.match(vaultRun, /modeLabel="Vault run"/);
assert.match(managedGame, /modeLabel="Live table"/);
assert.match(instant, /commitLabel=\{`Commit \$\{ACTION_LABELS\[selectedAction\]\}`\}/);
assert.match(liveResolution, /premium-resolve-sequence/);
assert.match(liveResolution, /emitPresentationCues/);
assert.match(styles, /premium-camera-push/);
assert.match(styles, /premium-camera-pick/);
assert.match(styles, /operation-ceremony/);
assert.match(styles, /transaction-theater/);
assert.match(styles, /prefers-reduced-motion: reduce/);
assert.match(styles, /pointer-events: none/);

console.log(`Premium presentation passed: ${PREMIUM_PRESENTATION.phases.length} phases / ${Object.keys(PREMIUM_PRESENTATION.actions).length} actions`);
