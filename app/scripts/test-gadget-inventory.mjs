import assert from 'node:assert/strict';
import {
  CALIBRATIONS,
  CRAFTING_MATERIALS,
  GADGET_BLUEPRINT_COUNT,
  GADGET_CATALOG,
  GADGET_CHASSIS,
  HERO_BUILDS,
  MATERIAL_FINISHES,
  STARTER_GADGET_IDS,
  blueprintIdToGadgetId,
  gadgetIdToBlueprintId,
} from '../src/data/gadgetInventory.js';
import {
  craftGadgetState,
  createDefaultInventory,
  dismantleGadgetState,
  equipGadgetState,
  grantMatchSalvageState,
  normalizeInventory,
  toggleFavoriteGadgetState,
} from '../src/lib/inventoryStore.js';

assert.equal(GADGET_BLUEPRINT_COUNT, 1200, 'catalog must contain exactly 1,200 blueprints');
assert.equal(GADGET_CATALOG.length, GADGET_CHASSIS.length * MATERIAL_FINISHES.length * CALIBRATIONS.length);
assert.equal(new Set(GADGET_CATALOG.map((gadget) => gadget.id)).size, 1200, 'blueprint ids must be unique');
assert.equal(new Set(GADGET_CATALOG.map((gadget) => gadget.serial)).size, 1200, 'serials must be unique');
assert.equal(new Set(GADGET_CATALOG.map((gadget) => gadget.name)).size, 1200, 'display names must identify one configuration');
assert.equal(HERO_BUILDS.length, 30, 'each chassis must expose three authored signature builds');
assert.equal(gadgetIdToBlueprintId('gdt-0001'), 1n);
assert.equal(gadgetIdToBlueprintId('gdt-1200'), 1200n);
assert.equal(blueprintIdToGadgetId(1n), 'gdt-0001');
assert.equal(blueprintIdToGadgetId(1200n), 'gdt-1200');
assert.equal(gadgetIdToBlueprintId('gdt-1201'), null);

const combinations = new Set(GADGET_CATALOG.map((gadget) => `${gadget.chassisId}:${gadget.finishId}:${gadget.calibrationId}`));
assert.equal(combinations.size, 1200, 'every modular combination must appear exactly once');

const materialIds = new Set(CRAFTING_MATERIALS.map((material) => material.id));
for (const gadget of GADGET_CATALOG) {
  assert.ok(['precision-kit', 'signal-scanner', 'firewall'].includes(gadget.protocol), `${gadget.id} must use a tested protocol`);
  assert.ok(gadget.recipe.length >= 1 && gadget.recipe.length <= 3, `${gadget.id} recipe must stay readable`);
  for (const cost of gadget.recipe) {
    assert.ok(materialIds.has(cost.materialId), `${gadget.id} references an unknown material`);
    assert.ok(Number.isInteger(cost.amount) && cost.amount > 0, `${gadget.id} must use positive integer costs`);
  }
  assert.ok(gadget.effectName && gadget.effectTrigger, `${gadget.id} must expose its chassis signature`);
  assert.equal('stats' in gadget, false, `${gadget.id} must not imply unused combat stats`);
}
assert.equal(new Set(GADGET_CHASSIS.map((chassis) => chassis.effectName)).size, 10, 'every chassis must have a distinct signature');

const starting = createDefaultInventory();
assert.deepEqual(starting.ownedIds, STARTER_GADGET_IDS);
assert.ok(starting.ownedIds.includes(starting.equippedId));

const target = GADGET_CATALOG.find((gadget) => !starting.ownedIds.includes(gadget.id));
const crafted = craftGadgetState(starting, target.id);
assert.equal(crafted.ok, true, 'a starter material wallet should assemble a field blueprint');
assert.ok(crafted.next.ownedIds.includes(target.id));
assert.equal(crafted.next.craftedCount, 1);

const equipped = equipGadgetState(crafted.next, target.id);
assert.equal(equipped.ok, true);
assert.equal(equipped.next.equippedId, target.id);

const favorited = toggleFavoriteGadgetState(equipped.next, target.id);
assert.ok(favorited.favoriteIds.includes(target.id));
const reclaimed = dismantleGadgetState(favorited, target.id);
assert.equal(reclaimed.ok, true);
assert.ok(!reclaimed.next.ownedIds.includes(target.id));
assert.ok(!reclaimed.next.favoriteIds.includes(target.id));
assert.equal(reclaimed.next.craftedCount, 0);

const reward = grantMatchSalvageState(equipped.next, { matchId: 'inventory-test-match', won: true, rounds: 8 });
assert.equal(reward.awarded, true);
assert.ok(reward.drops.length >= 1 && reward.drops.length <= 2);
const duplicate = grantMatchSalvageState(reward.next, { matchId: 'inventory-test-match', won: true, rounds: 8 });
assert.equal(duplicate.awarded, false, 'one match cannot pay salvage twice');

const depleted = normalizeInventory({ ...starting, materials: Object.fromEntries(CRAFTING_MATERIALS.map((material) => [material.id, 0])) });
assert.ok(Object.values(depleted.materials).every((amount) => amount === 0), 'zero material balances must survive normalization');

console.log('Gadget inventory valid: 1,200 unique blueprints, 10 chassis, 10 finishes, 12 calibrations, 6 crafting materials.');
