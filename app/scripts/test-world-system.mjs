import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { deriveVaultWorldState, VAULT_WORLD } from '../src/data/vaultWorld.js';

assert.equal(VAULT_WORLD.schemaVersion, 1);
assert.equal(VAULT_WORLD.deliveryMode, 'layered-2.5d');
assert.equal(VAULT_WORLD.truths.operatorCount, 4);
assert.equal(VAULT_WORLD.truths.rivalStationCount, 3);
assert.equal(VAULT_WORLD.truths.lockCount, 5);
assert.deepEqual(VAULT_WORLD.truths.actions, ['pick', 'search', 'sabotage']);
assert.deepEqual(VAULT_WORLD.planes.map(({ id }) => id), ['architecture', 'rivals', 'mechanism', 'workbench', 'interface']);
assert.equal(VAULT_WORLD.states.length, 5);
assert.ok(VAULT_WORLD.materials.length <= VAULT_WORLD.budgets.maxMaterials);

const planning = deriveVaultWorldState({ cracked: 0, total: 5, selectedAction: 'search', players: [{ id: 'player-2' }] });
assert.equal(planning.phase, 'planning');
assert.equal(planning.route, 'search');
assert.equal(planning.activeRivals, 1);

const reveal = deriveVaultWorldState({ cracked: 2, total: 5, resolving: true, selectedAction: 'sabotage' });
assert.equal(reveal.phase, 'revealing');
assert.equal(reveal.progress, 0.4);
assert.equal(deriveVaultWorldState({ cracked: 1, round: 8 }).damageLevel, 4);

const aftermath = deriveVaultWorldState({
  cracked: 3,
  total: 5,
  selectedAction: 'pick',
  latestOutcome: { action: 3, success: true, target: 'player-3' },
});
assert.equal(aftermath.phase, 'aftermath-success');
assert.equal(aftermath.route, 'sabotage');
assert.equal(aftermath.selectedRoute, 'pick');
assert.equal(aftermath.outcomeRoute, 'sabotage');
assert.equal(aftermath.affectedOperator, 'player-3');

const breached = deriveVaultWorldState({ cracked: 8, total: 5 });
assert.equal(breached.phase, 'breached');
assert.equal(breached.locksOpen, 5);
assert.equal(breached.progress, 1);

const appDir = resolve(process.cwd());
for (const path of [
  'world/manifest.json',
  'world/blender/build_vault_scene.py',
  'src/components/gameplay/VaultWorldScene.jsx',
  'scripts/world-pipeline.mjs',
  'scripts/build-world-derivatives.py',
  '../docs/3d-world-bible.md',
  '../docs/3d-world-improvement-checklist.md',
  '../docs/3d-world-report-card.md',
]) assert.ok(existsSync(resolve(appDir, path)), `Missing world-system file: ${path}`);

const mechanism = readFileSync(resolve(appDir, 'src/components/gameplay/VaultMechanism.jsx'), 'utf8');
const scene = readFileSync(resolve(appDir, 'src/components/gameplay/VaultWorldScene.jsx'), 'utf8');
const styles = readFileSync(resolve(appDir, 'src/styles/caper.css'), 'utf8');
assert.match(mechanism, /deriveVaultWorldState/);
assert.match(mechanism, /data-world-state/);
assert.match(scene, /data-plane="architecture"/);
assert.match(scene, /data-plane="rivals"/);
assert.match(scene, /data-plane="mechanism"/);
assert.match(scene, /data-plane="workbench"/);
assert.match(scene, /data-selected-route/);
assert.match(scene, /vault-world__rival/);
assert.match(scene, /vault-world__damage/);
assert.match(scene, /vault-world__practicals/);
assert.match(scene, /vault-world__reflections/);
assert.match(scene, /vault-world__smoke/);
assert.match(styles, /\.vault-world\[data-phase="breached"\]/);
assert.match(styles, /prefers-reduced-motion: reduce/);

const sourceStats = JSON.parse(readFileSync(resolve(appDir, 'assets/world-source/scene-stats.json'), 'utf8'));
assert.ok(sourceStats.triangles <= VAULT_WORLD.budgets.maxSourceTriangles);
assert.ok(sourceStats.materials <= VAULT_WORLD.budgets.maxMaterials);
assert.ok(sourceStats.dynamicLights <= VAULT_WORLD.budgets.maxDynamicLights);

console.log(`World system passed: ${VAULT_WORLD.states.length} states / ${VAULT_WORLD.planes.length} planes / ${VAULT_WORLD.materials.length} materials`);
