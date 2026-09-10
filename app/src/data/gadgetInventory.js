export const GADGET_PROTOCOLS = Object.freeze({
  'precision-kit': Object.freeze({ id: 'precision-kit', label: 'Precision', action: 'Pick', summary: 'A one-use advantage applied to a qualifying Pick.' }),
  'signal-scanner': Object.freeze({ id: 'signal-scanner', label: 'Signal', action: 'Search', summary: 'A one-use advantage applied to a qualifying Search.' }),
  firewall: Object.freeze({ id: 'firewall', label: 'Guard', action: 'Sabotage', summary: 'A one-use response to an incoming Sabotage.' }),
});

export const GADGET_CHASSIS = Object.freeze([
  {
    id: 'precision-kit', label: 'Precision Kit', image: '/images/parts/precision-kit.webp', protocol: 'precision-kit', role: 'Measured entry',
    description: 'A fitted set of fine tools for a deliberate first attack.', effectName: 'Clean Entry',
    effect: '+10 percentage points to your first unstunned Pick.', trigger: 'First unstunned Pick',
    heroBuilds: [
      ['brassbound', 'steady', 'First Principle', 'The workshop standard: quiet hands, warm brass, no wasted movement.'],
      ['cipher-smoke', 'keen', 'Glass Needle', 'A fine-entry instrument tuned for operators who trust one exact opening.'],
      ['tungsten-black', 'guarded', 'Night Locksmith', 'Dense, low-glare tools made for a hostile table.'],
    ],
  },
  {
    id: 'signal-scanner', label: 'Signal Scanner', image: '/images/parts/signal-scanner.webp', protocol: 'signal-scanner', role: 'Signal discovery',
    description: 'An analog lens assembly that finds a useful route through the noise.', effectName: 'Clear Frequency',
    effect: '+20 percentage points to your first Search.', trigger: 'First Search',
    heroBuilds: [
      ['cipher-smoke', 'listening', 'Whisper Index', 'A smoked-glass scanner that rewards the operator willing to listen first.'],
      ['blueprint-blue', 'steady', 'Blue Lantern', 'Its cool lens keeps one reliable route visible through table noise.'],
      ['oxide-green', 'prototype', 'Verdant Echo', 'An experimental lens whose strange clarity made it worth preserving.'],
    ],
  },
  {
    id: 'firewall', label: 'Firewall', image: '/images/parts/firewall.webp', protocol: 'firewall', role: 'Interference defense',
    description: 'Layered shutters built to absorb one incoming disruption.', effectName: 'Hard Stop',
    effect: 'Blocks the first Sabotage against you.', trigger: 'First incoming Sabotage',
    heroBuilds: [
      ['tungsten-black', 'anchored', 'Black Bastion', 'A dense shutter stack that refuses the first hostile signal.'],
      ['signal-red', 'guarded', 'Red Rebuff', 'Warning enamel marks the exact plate designed to take the hit.'],
      ['vault-patina', 'masterwork', 'Old Door Doctrine', 'A veteran assembly built from the same patience as the vault itself.'],
    ],
  },
  {
    id: 'torque-driver', label: 'Torque Driver', image: '/images/inventory/torque-driver.webp', protocol: 'precision-kit', role: 'Stored momentum',
    description: 'A weighty flywheel that turns patient setup into decisive pressure.', effectName: 'Loaded Turn',
    effect: '+18 percentage points to your first Pick while carrying a tool.', trigger: 'First Pick with 1+ tools',
    heroBuilds: [
      ['brassbound', 'patient', 'Long Turn', 'A heavy flywheel that makes preparation feel inevitable.'],
      ['copper-weave', 'volatile', 'Copper Breaker', 'Hot windings trade restraint for one forceful release.'],
      ['midnight-steel', 'masterwork', 'Quiet Torque', 'A balanced drive whose power arrives without spectacle.'],
    ],
  },
  {
    id: 'echo-coil', label: 'Echo Coil', image: '/images/inventory/echo-coil.webp', protocol: 'signal-scanner', role: 'Delayed insight',
    description: 'Paired coils tuned to catch useful echoes after the table develops.', effectName: 'Late Resonance',
    effect: '+26 percentage points to your first Search from round 3 onward.', trigger: 'First Search on round 3+',
    heroBuilds: [
      ['copper-weave', 'listening', 'Second Voice', 'Twin coils wait for the table to reveal a pattern worth following.'],
      ['cipher-smoke', 'quiet', 'Hush Circuit', 'Muted glass and patient windings keep late information clean.'],
      ['blueprint-blue', 'masterwork', 'Afterimage', 'A planning-room prototype calibrated around what everyone else already missed.'],
    ],
  },
  {
    id: 'decoy-relay', label: 'Decoy Relay', image: '/images/inventory/decoy-relay.webp', protocol: 'firewall', role: 'Pressure reversal',
    description: 'A branching relay that sends hostile pressure back through the wrong path.', effectName: 'False Route',
    effect: 'Blocks the first Sabotage and strips one tool from its attacker when possible.', trigger: 'First incoming Sabotage',
    heroBuilds: [
      ['signal-red', 'volatile', 'Red Herring', 'A conspicuous line invites the exact mistake the relay was built to punish.'],
      ['cipher-smoke', 'quiet', 'Dead Channel', 'A silent branch waits for hostile pressure, then closes behind it.'],
      ['tungsten-black', 'guarded', 'Return Address', 'Armored routing plates turn one attack into immediate regret.'],
    ],
  },
  {
    id: 'counterweight', label: 'Counterweight', image: '/images/inventory/counterweight.webp', protocol: 'firewall', role: 'Comeback stability',
    description: 'A balanced recovery mechanism for operators playing from behind.', effectName: 'Level the Table',
    effect: 'Blocks the first Sabotage and grants one tool when the attacker is ahead.', trigger: 'First incoming Sabotage',
    heroBuilds: [
      ['brassbound', 'anchored', 'Equal Measure', 'A simple mass that turns an opponent\'s lead into your next opening.'],
      ['vault-patina', 'salvaged', 'Last Ounce', 'Mismatched weights assembled by an operator who never concedes the table.'],
      ['amber-sealed', 'patient', 'Second Wind', 'Resin-bound pivots hold one reserve of comeback momentum.'],
    ],
  },
  {
    id: 'quickset-clamp', label: 'Quickset Clamp', image: '/images/inventory/quickset-clamp.webp', protocol: 'precision-kit', role: 'Fast setup',
    description: 'Spring-loaded jaws hold an opening line steady under pressure.', effectName: 'First Grip',
    effect: '+14 percentage points to your first Pick while you have zero cracked locks.', trigger: 'Opening Pick at 0 locks',
    heroBuilds: [
      ['copper-weave', 'nimble', 'Snapline', 'A lively spring and narrow jaws made for the first seam.'],
      ['signal-red', 'keen', 'Starting Gun', 'Red enamel announces a build that only cares about the opening.'],
      ['brassbound', 'masterwork', 'Bench Record', 'A master-set clamp tuned to begin cleanly every time.'],
    ],
  },
  {
    id: 'cache-siphon', label: 'Cache Siphon', image: '/images/inventory/cache-siphon.webp', protocol: 'signal-scanner', role: 'Tool recovery',
    description: 'A compact intake that converts one successful scan into extra usable equipment.', effectName: 'Deep Salvage',
    effect: '+12 percentage points to your first Search; success finds up to two tools.', trigger: 'First Search below tool capacity',
    heroBuilds: [
      ['oxide-green', 'salvaged', 'Green Pocket', 'A patched reservoir that always seems to hold one more useful part.'],
      ['amber-sealed', 'patient', 'Slow Draw', 'A sealed intake built to recover more by rushing less.'],
      ['vault-patina', 'prototype', 'Forgotten Dividend', 'An eccentric salvage rig whose surplus justified every odd joint.'],
    ],
  },
  {
    id: 'route-compass', label: 'Route Compass', image: '/images/inventory/route-compass.webp', protocol: 'signal-scanner', role: 'Interference navigation',
    description: 'Three unmarked vanes keep a useful route visible while interference closes in.', effectName: 'Route Through Noise',
    effect: 'Your first Search ignores the stunned penalty and gains 10 percentage points.', trigger: 'First Search, including while stunned',
    heroBuilds: [
      ['blueprint-blue', 'steady', 'Open Route', 'Three cool vanes hold a clean plan when the table turns noisy.'],
      ['midnight-steel', 'quiet', 'Dark Meridian', 'A low-glare selector made for finding direction under pressure.'],
      ['cipher-smoke', 'listening', 'Third Way', 'A smoked center keeps an overlooked route alive until it matters.'],
    ],
  },
].map((chassis, index) => Object.freeze({ ...chassis, index, heroBuilds: Object.freeze(chassis.heroBuilds.map(Object.freeze)) })));

export const GADGET_CHASSIS_BY_ID = Object.freeze(Object.fromEntries(GADGET_CHASSIS.map((chassis) => [chassis.id, chassis])));

export const MATERIAL_FINISHES = Object.freeze([
  { id: 'brassbound', label: 'Brassbound', color: '#C4956A', shadow: '#6e472c', pattern: 'rings', note: 'Warm, dependable workshop stock.', resourceId: 'brass-cogs' },
  { id: 'cipher-smoke', label: 'Cipher Smoke', color: '#4F9278', shadow: '#1f4739', pattern: 'glass', note: 'Smoked glass for quiet information work.', resourceId: 'cipher-glass' },
  { id: 'copper-weave', label: 'Copper Weave', color: '#C87855', shadow: '#713925', pattern: 'weave', note: 'Conductive windings with a lively response.', resourceId: 'flux-wire' },
  { id: 'tungsten-black', label: 'Tungsten Black', color: '#858998', shadow: '#333741', pattern: 'plate', note: 'Dense structure built to take a hit.', resourceId: 'tungsten-shard' },
  { id: 'oxide-green', label: 'Oxide Green', color: '#40A080', shadow: '#164c3b', pattern: 'speckle', note: 'Experimental coating for signal clarity.', resourceId: 'oxide-catalyst' },
  { id: 'amber-sealed', label: 'Amber Sealed', color: '#E8B078', shadow: '#74491f', pattern: 'seal', note: 'Resin-bonded joints with a warm edge.', resourceId: 'vault-resin' },
  { id: 'midnight-steel', label: 'Midnight Steel', color: '#59627B', shadow: '#202634', pattern: 'plate', note: 'Low-glare surfaces for patient operators.', resourceId: 'tungsten-shard' },
  { id: 'blueprint-blue', label: 'Blueprint Blue', color: '#3A7CC4', shadow: '#173d6a', pattern: 'grid', note: 'A cool planning finish with crisp seams.', resourceId: 'cipher-glass' },
  { id: 'signal-red', label: 'Signal Red', color: '#F06A6A', shadow: '#792929', pattern: 'stripe', note: 'A bold routing stripe for decisive tables.', resourceId: 'flux-wire' },
  { id: 'vault-patina', label: 'Vault Patina', color: '#86725A', shadow: '#40362b', pattern: 'wear', note: 'A seasoned finish assembled from mixed salvage.', resourceId: 'brass-cogs' },
].map(Object.freeze));

export const MATERIAL_FINISHES_BY_ID = Object.freeze(Object.fromEntries(MATERIAL_FINISHES.map((finish) => [finish.id, finish])));

export const CALIBRATIONS = Object.freeze([
  { id: 'steady', label: 'Steady', callout: 'Reliable under pressure', glyph: 'circle', module: 'Balanced collar' },
  { id: 'keen', label: 'Keen', callout: 'Fine opening response', glyph: 'needle', module: 'Needle sight' },
  { id: 'listening', label: 'Listening', callout: 'Reads the table early', glyph: 'wave', module: 'Echo vane' },
  { id: 'guarded', label: 'Guarded', callout: 'Built for hostile tables', glyph: 'shield', module: 'Shutter plate' },
  { id: 'patient', label: 'Patient', callout: 'Rewards a measured route', glyph: 'hourglass', module: 'Delay governor' },
  { id: 'volatile', label: 'Volatile', callout: 'High pressure, narrow margin', glyph: 'spark', module: 'Hot winding' },
  { id: 'quiet', label: 'Quiet', callout: 'Low-profile signal work', glyph: 'hush', module: 'Damped housing' },
  { id: 'anchored', label: 'Anchored', callout: 'Hard to knock off plan', glyph: 'anchor', module: 'Ballast foot' },
  { id: 'nimble', label: 'Nimble', callout: 'Quick to the first seam', glyph: 'chevron', module: 'Quick-return spring' },
  { id: 'salvaged', label: 'Salvaged', callout: 'Odd parts, excellent story', glyph: 'patch', module: 'Field patch' },
  { id: 'masterwork', label: 'Masterwork', callout: 'Balanced bench precision', glyph: 'diamond', module: 'Maker medallion' },
  { id: 'prototype', label: 'Prototype', callout: 'Strange, rare, and promising', glyph: 'orbit', module: 'Experimental regulator' },
].map((calibration, index) => Object.freeze({ ...calibration, index })));

export const CALIBRATIONS_BY_ID = Object.freeze(Object.fromEntries(CALIBRATIONS.map((calibration) => [calibration.id, calibration])));

export const CRAFTING_MATERIALS = Object.freeze([
  { id: 'brass-cogs', label: 'Brass Cogs', image: '/images/inventory/brass-cogs.webp', description: 'Reliable mechanical stock.', start: 5 },
  { id: 'cipher-glass', label: 'Cipher Glass', image: '/images/inventory/cipher-glass.webp', description: 'Smoked optical inserts.', start: 4 },
  { id: 'flux-wire', label: 'Flux Wire', image: '/images/inventory/flux-wire.webp', description: 'Insulated signal windings.', start: 4 },
  { id: 'tungsten-shard', label: 'Tungsten Shards', image: '/images/inventory/tungsten-shard.webp', description: 'Dense structural offcuts.', start: 2 },
  { id: 'oxide-catalyst', label: 'Oxide Catalyst', image: '/images/inventory/oxide-catalyst.webp', description: 'Specialist tuning compound.', start: 2 },
  { id: 'vault-resin', label: 'Vault Resin', image: '/images/inventory/vault-resin.webp', description: 'Rare reinforced bonding resin.', start: 1 },
].map(Object.freeze));

export const GADGET_RARITIES = Object.freeze([
  { id: 'field', label: 'Field', threshold: 56, multiplier: 1, craftNote: 'Workshop-standard assembly' },
  { id: 'tuned', label: 'Tuned', threshold: 82, multiplier: 1.35, craftNote: 'Finer tolerances and detailing' },
  { id: 'rare', label: 'Rare', threshold: 95, multiplier: 1.75, craftNote: 'Scarce finish and specialist parts' },
  { id: 'masterwork', label: 'Masterwork', threshold: 101, multiplier: 2.25, craftNote: 'Highest cosmetic workmanship' },
].map(Object.freeze));

function rarityFor(chassisIndex, finishIndex, calibrationIndex) {
  const roll = (chassisIndex * 37 + finishIndex * 19 + calibrationIndex * 11 + 17) % 100;
  return GADGET_RARITIES.find((rarity) => roll < rarity.threshold);
}

function recipeFor(chassisIndex, finishIndex, calibrationIndex, rarity) {
  const primary = MATERIAL_FINISHES[finishIndex].resourceId;
  const secondary = CRAFTING_MATERIALS[(chassisIndex + calibrationIndex) % CRAFTING_MATERIALS.length].id;
  const specialist = CRAFTING_MATERIALS[(finishIndex * 2 + calibrationIndex + 3) % CRAFTING_MATERIALS.length].id;
  const costs = new Map();
  const add = (id, amount) => costs.set(id, (costs.get(id) || 0) + amount);
  add(primary, Math.ceil((3 + (calibrationIndex % 3)) * rarity.multiplier));
  add(secondary, Math.ceil((2 + (chassisIndex % 3)) * rarity.multiplier));
  if (rarity.id !== 'field' || specialist !== primary) add(specialist, Math.ceil((1 + (finishIndex % 2)) * rarity.multiplier));
  return Object.freeze([...costs].map(([materialId, amount]) => Object.freeze({ materialId, amount })));
}

function heroFor(chassis, finishId, calibrationId) {
  const hero = chassis.heroBuilds.find(([heroFinish, heroCalibration]) => heroFinish === finishId && heroCalibration === calibrationId);
  return hero ? Object.freeze({ name: hero[2], lore: hero[3] }) : null;
}

export const GADGET_CATALOG = Object.freeze(GADGET_CHASSIS.flatMap((chassis, chassisIndex) => (
  MATERIAL_FINISHES.flatMap((finish, finishIndex) => (
    CALIBRATIONS.map((calibration, calibrationIndex) => {
      const number = chassisIndex * MATERIAL_FINISHES.length * CALIBRATIONS.length + finishIndex * CALIBRATIONS.length + calibrationIndex + 1;
      const rarity = rarityFor(chassisIndex, finishIndex, calibrationIndex);
      const hero = heroFor(chassis, finish.id, calibration.id);
      return Object.freeze({
        id: `gdt-${String(number).padStart(4, '0')}`,
        serial: `PX-${String(number).padStart(4, '0')}`,
        name: hero?.name || `${finish.label} ${chassis.label} - ${calibration.label}`,
        configurationName: `${finish.label} / ${calibration.label}`,
        chassisId: chassis.id,
        chassisLabel: chassis.label,
        finishId: finish.id,
        finishLabel: finish.label,
        finishColor: finish.color,
        finishShadow: finish.shadow,
        finishPattern: finish.pattern,
        calibrationId: calibration.id,
        calibrationLabel: calibration.label,
        calibrationGlyph: calibration.glyph,
        calibrationModule: calibration.module,
        callout: calibration.callout,
        rarity: rarity.id,
        rarityLabel: rarity.label,
        rarityNote: rarity.craftNote,
        image: chassis.image,
        protocol: chassis.protocol,
        protocolFamilyLabel: GADGET_PROTOCOLS[chassis.protocol].label,
        protocolLabel: chassis.effect,
        effectName: chassis.effectName,
        effectTrigger: chassis.trigger,
        role: chassis.role,
        description: chassis.description,
        isHero: Boolean(hero),
        lore: hero?.lore || `${finish.note} ${calibration.module} gives this ${chassis.label.toLowerCase()} its ${calibration.label.toLowerCase()} workshop character.`,
        recipe: recipeFor(chassisIndex, finishIndex, calibrationIndex, rarity),
      });
    })
  ))
)));

export const GADGETS_BY_ID = Object.freeze(Object.fromEntries(GADGET_CATALOG.map((gadget) => [gadget.id, gadget])));
export const STARTER_GADGET_IDS = Object.freeze(['gdt-0001', 'gdt-0121', 'gdt-0241']);
export const GADGET_BLUEPRINT_COUNT = GADGET_CATALOG.length;
export const HERO_BUILDS = Object.freeze(GADGET_CATALOG.filter((gadget) => gadget.isHero));

export function getGadgetConfiguration(chassisId, finishId, calibrationId) {
  return GADGET_CATALOG.find((gadget) => (
    gadget.chassisId === chassisId && gadget.finishId === finishId && gadget.calibrationId === calibrationId
  )) || GADGET_CATALOG[0];
}

export function gadgetIdToBlueprintId(id) {
  const match = /^gdt-(\d{4})$/.exec(id || '');
  if (!match) return null;
  const blueprintId = Number(match[1]);
  return blueprintId >= 1 && blueprintId <= GADGET_BLUEPRINT_COUNT ? BigInt(blueprintId) : null;
}

export function blueprintIdToGadgetId(blueprintId) {
  const value = Number(blueprintId);
  if (!Number.isInteger(value) || value < 1 || value > GADGET_BLUEPRINT_COUNT) return null;
  return `gdt-${String(value).padStart(4, '0')}`;
}

export function getGadgetById(id) {
  return GADGETS_BY_ID[id] || GADGETS_BY_ID[STARTER_GADGET_IDS[0]];
}
