import assert from 'node:assert/strict';
import {
  PREFERENCE_DEFINITIONS,
  PREFERENCE_SCHEMA_VERSION,
  PREFERENCE_STORAGE_KEY,
  exportPreferenceBundle,
  importPreferenceBundle,
  loadPreferences,
  normalizePreferences,
  preferenceDefaults,
  savePreferences,
} from '../src/data/preferences.js';

class MemoryStorage {
  constructor(entries = {}) {
    this.entries = new Map(Object.entries(entries));
  }

  getItem(key) {
    return this.entries.has(key) ? this.entries.get(key) : null;
  }

  setItem(key, value) {
    this.entries.set(key, String(value));
  }
}

const ids = PREFERENCE_DEFINITIONS.map((definition) => definition.id);
assert.equal(new Set(ids).size, ids.length, 'Preference ids must be unique');
assert.ok(PREFERENCE_DEFINITIONS.every((definition) => definition.group && definition.label && definition.description));

const defaults = preferenceDefaults({ prefersReducedMotion: true });
assert.equal(defaults.reducedMotion, true, 'Device motion preference should inform first-run defaults');
assert.equal(defaults.soundEnabled, true);
assert.equal(defaults.masterVolume, 70);

const normalized = normalizePreferences({
  masterVolume: 103,
  interfaceDensity: 'microscopic',
  soundEnabled: 'yes',
  unknownSetting: true,
});
assert.equal(normalized.masterVolume, 100, 'Ranges should clamp to their declared maximum');
assert.equal(normalized.interfaceDensity, 'comfortable', 'Unknown select options should fall back safely');
assert.equal(normalized.soundEnabled, true, 'Invalid types should fall back to the declared default');
assert.equal(Object.hasOwn(normalized, 'unknownSetting'), false, 'Unknown settings must never enter the saved payload');

const legacyStorage = new MemoryStorage({
  plundrix_readability_mode: 'true',
  plundrix_reduced_motion: 'false',
  plundrix_sound_enabled: 'false',
  'plundrix-background-turn-alerts': 'true',
});
const legacy = loadPreferences(legacyStorage);
assert.equal(legacy.status, 'migrated');
assert.equal(legacy.values.readabilityMode, true);
assert.equal(legacy.values.soundEnabled, false);
assert.equal(legacy.values.backgroundTurnAlerts, true);

const damaged = loadPreferences(new MemoryStorage({ [PREFERENCE_STORAGE_KEY]: '{not-json' }));
assert.equal(damaged.status, 'recovered');
assert.deepEqual(damaged.values, preferenceDefaults());

const stored = new MemoryStorage();
const save = savePreferences(stored, { ...defaults, masterVolume: 35, highContrast: true }, '2026-09-10T00:00:00.000Z');
assert.equal(save.ok, true);
assert.equal(save.payload.schemaVersion, PREFERENCE_SCHEMA_VERSION);
assert.equal(loadPreferences(stored).values.masterVolume, 35);

const bundle = exportPreferenceBundle({ ...defaults, interfaceDensity: 'compact' }, '2026-09-10T00:00:00.000Z');
assert.equal(importPreferenceBundle(bundle).interfaceDensity, 'compact');
assert.throws(() => importPreferenceBundle('{broken'), /valid JSON/);
assert.throws(() => importPreferenceBundle(JSON.stringify({ product: 'Another game', values: {} })), /not a Plundrix/);
assert.throws(() => importPreferenceBundle(JSON.stringify({
  product: 'Plundrix',
  schemaVersion: PREFERENCE_SCHEMA_VERSION + 1,
  values: {},
})), /newer Plundrix build/);

console.log(`Preference system passed: ${PREFERENCE_DEFINITIONS.length} schema-driven controls, migration, recovery, and portable exports.`);
