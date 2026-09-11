export const PREFERENCE_SCHEMA_VERSION = 2;
export const PREFERENCE_STORAGE_KEY = 'plundrix-preferences-v2';

export const LEGACY_PREFERENCE_KEYS = Object.freeze({
  readabilityMode: 'plundrix_readability_mode',
  reducedMotion: 'plundrix_reduced_motion',
  soundEnabled: 'plundrix_sound_enabled',
  backgroundTurnAlerts: 'plundrix-background-turn-alerts',
});

export const PREFERENCE_GROUPS = Object.freeze([
  {
    id: 'display',
    label: 'Display',
    eyebrow: 'Clarity',
    description: 'Tune density, contrast, and reading comfort without changing the rules.',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    eyebrow: 'Feel',
    description: 'Control motion, sound, volume, and tactile cues.',
  },
  {
    id: 'gameplay',
    label: 'Gameplay',
    eyebrow: 'Assistance',
    description: 'Choose what the game remembers and when it may call you back.',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    eyebrow: 'Data',
    description: 'Keep anonymous product signals under your control.',
  },
]);

export const PREFERENCE_DEFINITIONS = Object.freeze([
  {
    id: 'readabilityMode',
    group: 'display',
    type: 'switch',
    label: 'Readable text',
    description: 'Raises the type scale and weight across the interface.',
    defaultValue: false,
    searchTerms: ['large text', 'font', 'readability'],
  },
  {
    id: 'highContrast',
    group: 'display',
    type: 'switch',
    label: 'High contrast',
    description: 'Strengthens text, borders, focus rings, and interactive states.',
    defaultValue: false,
    searchTerms: ['color', 'borders', 'visibility'],
  },
  {
    id: 'interfaceDensity',
    group: 'display',
    type: 'select',
    label: 'Interface spacing',
    description: 'Comfortable keeps the cinematic rhythm; compact fits more intelligence on screen.',
    defaultValue: 'comfortable',
    options: [
      { value: 'comfortable', label: 'Comfortable' },
      { value: 'compact', label: 'Compact' },
    ],
    searchTerms: ['spacing', 'compact', 'density'],
  },
  {
    id: 'reducedMotion',
    group: 'feedback',
    type: 'switch',
    label: 'Reduced motion',
    description: 'Shortens or removes decorative movement while preserving state changes.',
    defaultValue: false,
    searchTerms: ['animation', 'accessibility', 'movement'],
  },
  {
    id: 'soundEnabled',
    group: 'feedback',
    type: 'switch',
    label: 'Interface sound',
    description: 'Plays concise cues for commits, reveals, tools, and wins.',
    defaultValue: true,
    searchTerms: ['audio', 'mute', 'effects'],
  },
  {
    id: 'masterVolume',
    group: 'feedback',
    type: 'range',
    label: 'Cue volume',
    description: 'Adjusts every generated interface and signature sound.',
    defaultValue: 70,
    min: 0,
    max: 100,
    step: 5,
    suffix: '%',
    searchTerms: ['audio', 'sound', 'loudness'],
  },
  {
    id: 'hapticsEnabled',
    group: 'feedback',
    type: 'switch',
    label: 'Tactile cues',
    description: 'Uses supported device vibration for rare signature gadget moments.',
    defaultValue: true,
    searchTerms: ['vibration', 'haptics', 'touch'],
  },
  {
    id: 'matchRecovery',
    group: 'gameplay',
    type: 'switch',
    label: 'Remember active practice',
    description: 'Restores an unfinished Instant Play operation on this device.',
    defaultValue: true,
    searchTerms: ['save', 'resume', 'local storage'],
  },
  {
    id: 'backgroundTurnAlerts',
    group: 'gameplay',
    type: 'switch',
    label: 'Background turn alerts',
    description: 'Notifies you when a live table advances while this tab is hidden.',
    defaultValue: false,
    capability: 'notifications',
    searchTerms: ['notification', 'round', 'browser'],
  },
  {
    id: 'keyboardHints',
    group: 'gameplay',
    type: 'switch',
    label: 'Keyboard hints',
    description: 'Shows compact shortcut reminders where they are useful.',
    defaultValue: true,
    searchTerms: ['keys', 'shortcut', 'commands'],
  },
  {
    id: 'analyticsEnabled',
    group: 'privacy',
    type: 'switch',
    label: 'Anonymous product signals',
    description: 'Allows bounded interaction events with no names, wallet addresses, seeds, or free text.',
    defaultValue: true,
    searchTerms: ['analytics', 'telemetry', 'tracking', 'privacy'],
  },
]);

export const PREFERENCE_BY_ID = Object.freeze(Object.fromEntries(
  PREFERENCE_DEFINITIONS.map((definition) => [definition.id, definition]),
));

function safeGet(storage, key) {
  try {
    return storage?.getItem?.(key) ?? null;
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage?.setItem?.(key, value);
    return true;
  } catch {
    return false;
  }
}

function legacyBoolean(storage, key) {
  const value = safeGet(storage, key);
  return value === null ? undefined : value === 'true';
}

function sanitizeValue(definition, value) {
  if (definition.type === 'switch') return typeof value === 'boolean' ? value : definition.defaultValue;
  if (definition.type === 'range') {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return definition.defaultValue;
    const stepped = Math.round(numeric / definition.step) * definition.step;
    return Math.min(definition.max, Math.max(definition.min, stepped));
  }
  if (definition.type === 'select') {
    return definition.options.some((option) => option.value === value) ? value : definition.defaultValue;
  }
  return definition.defaultValue;
}

export function preferenceDefaults({ prefersReducedMotion = false } = {}) {
  const defaults = Object.fromEntries(
    PREFERENCE_DEFINITIONS.map((definition) => [definition.id, definition.defaultValue]),
  );
  defaults.reducedMotion = Boolean(prefersReducedMotion);
  return defaults;
}

export function normalizePreferences(candidate = {}, environment = {}) {
  const defaults = preferenceDefaults(environment);
  return Object.fromEntries(PREFERENCE_DEFINITIONS.map((definition) => [
    definition.id,
    sanitizeValue(definition, candidate[definition.id] ?? defaults[definition.id]),
  ]));
}

function legacyPreferences(storage, environment) {
  const values = preferenceDefaults(environment);
  let migrated = false;
  for (const [id, key] of Object.entries(LEGACY_PREFERENCE_KEYS)) {
    const value = legacyBoolean(storage, key);
    if (value !== undefined) {
      values[id] = value;
      migrated = true;
    }
  }
  return { values, migrated };
}

export function loadPreferences(storage, environment = {}) {
  const raw = safeGet(storage, PREFERENCE_STORAGE_KEY);
  if (raw === null) {
    const legacy = legacyPreferences(storage, environment);
    return { values: normalizePreferences(legacy.values, environment), status: legacy.migrated ? 'migrated' : 'ready' };
  }

  try {
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object' || typeof payload.values !== 'object') throw new Error('Invalid preference payload');
    if (Number(payload.schemaVersion) > PREFERENCE_SCHEMA_VERSION) throw new Error('Preference payload is newer than this build');
    return {
      values: normalizePreferences(payload.values, environment),
      status: Number(payload.schemaVersion) === PREFERENCE_SCHEMA_VERSION ? 'ready' : 'migrated',
    };
  } catch {
    return { values: preferenceDefaults(environment), status: 'recovered' };
  }
}

export function savePreferences(storage, values, now = new Date().toISOString()) {
  const payload = {
    schemaVersion: PREFERENCE_SCHEMA_VERSION,
    updatedAt: now,
    values: normalizePreferences(values),
  };
  return { ok: safeSet(storage, PREFERENCE_STORAGE_KEY, JSON.stringify(payload)), payload };
}

export function exportPreferenceBundle(values, now = new Date().toISOString()) {
  return `${JSON.stringify({
    product: 'Plundrix',
    schemaVersion: PREFERENCE_SCHEMA_VERSION,
    exportedAt: now,
    values: normalizePreferences(values),
  }, null, 2)}\n`;
}

export function importPreferenceBundle(source, environment = {}) {
  let payload;
  try {
    payload = typeof source === 'string' ? JSON.parse(source) : source;
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!payload || payload.product !== 'Plundrix' || typeof payload.values !== 'object') {
    throw new Error('That file is not a Plundrix preference export.');
  }
  if (Number(payload.schemaVersion) > PREFERENCE_SCHEMA_VERSION) {
    throw new Error('Those preferences were created by a newer Plundrix build.');
  }
  return normalizePreferences(payload.values, environment);
}

export function readPreferenceSnapshot(storage, environment = {}) {
  return loadPreferences(storage, environment).values;
}
