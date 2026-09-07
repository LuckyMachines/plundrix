import { ART_ASSETS } from '../../art/assets.mjs';
import { ART_FAMILIES } from '../../art/families.mjs';

export const DESIGN_SECTIONS = Object.freeze([
  { id: 'principles', label: 'Principles', group: 'Foundation' },
  { id: 'color', label: 'Color', group: 'Foundation' },
  { id: 'type', label: 'Typography', group: 'Foundation' },
  { id: 'space', label: 'Space + shape', group: 'Foundation' },
  { id: 'controls', label: 'Controls', group: 'Components' },
  { id: 'feedback', label: 'Status + feedback', group: 'Components' },
  { id: 'gameplay', label: 'Gameplay shell', group: 'Game' },
  { id: 'actions', label: 'Action states', group: 'Game' },
  { id: 'journeys', label: 'Journey states', group: 'Game' },
  { id: 'inventory', label: 'Inventory + crafting', group: 'Game' },
  { id: 'responsive', label: 'Responsive', group: 'System' },
  { id: 'motion', label: 'Motion + sound', group: 'System' },
  { id: 'voice', label: 'Voice + terms', group: 'System' },
  { id: 'assets', label: 'Asset library', group: 'System' },
  { id: 'coverage', label: 'Coverage', group: 'Governance' },
]);

export const COLOR_TOKENS = Object.freeze([
  { label: 'Vault dark', token: '--color-vault-dark', value: '#0A0A0F', role: 'Page ground', usage: 'Behind every primary play surface.' },
  { label: 'Vault surface', token: '--color-vault-surface', value: '#14141F', role: 'Section surface', usage: 'Large grouped regions and cards.' },
  { label: 'Vault panel', token: '--color-vault-panel', value: '#1A1A2E', role: 'Raised panel', usage: 'Interactive modules and focused states.' },
  { label: 'Vault border', token: '--color-vault-border', value: '#2A2A3E', role: 'Structure', usage: 'Dividers and default boundaries.' },
  { label: 'Vault text', token: '--color-vault-text', value: '#C8C8D4', role: 'Primary copy', usage: 'Body text and essential labels.' },
  { label: 'Dim text', token: '--color-vault-text-dim', value: '#8B8A9E', role: 'Secondary copy', usage: 'Metadata, hints, and supporting text.' },
  { label: 'Tungsten', token: '--color-tungsten', value: '#C4956A', role: 'Primary action', usage: 'Pick, focus, progress, and brand emphasis.' },
  { label: 'Tungsten bright', token: '--color-tungsten-bright', value: '#E8B078', role: 'Peak emphasis', usage: 'Wins, selected actions, and active values.' },
  { label: 'Oxide green', token: '--color-oxide-green', value: '#40A080', role: 'Success + Search', usage: 'Confirmation, healthy state, and discovery.' },
  { label: 'Oxide green dim', token: '--color-oxide-green-dim', value: '#2A7058', role: 'Success surface', usage: 'Tint and border support, not small text.' },
  { label: 'Signal red', token: '--color-signal-red', value: '#F06A6A', role: 'Danger + Sabotage', usage: 'Failure, threat, destructive action, and urgency.' },
  { label: 'Signal red dim', token: '--color-signal-red-dim', value: '#DC6060', role: 'Secondary danger', usage: 'Readable subdued threat labels.' },
  { label: 'Blueprint', token: '--color-blueprint', value: '#3A7CC4', role: 'Information', usage: 'System guidance, committed state, and neutral links.' },
  { label: 'Blueprint dim', token: '--color-blueprint-dim', value: '#1E4A7A', role: 'Information surface', usage: 'Tint and border support, not small text.' },
]);

export const TYPE_STYLES = Object.freeze([
  { id: 'display-xl', label: 'Display XL', sample: 'CRACK THE VAULT', className: 'font-display text-6xl font-bold uppercase leading-[0.9] tracking-[0.02em]', use: 'Page promise or victory only' },
  { id: 'display-lg', label: 'Display LG', sample: 'Choose your breach.', className: 'font-display text-4xl font-semibold leading-none', use: 'Primary section headline' },
  { id: 'display-md', label: 'Display MD', sample: 'Operation briefing', className: 'font-display text-2xl font-semibold uppercase tracking-[0.08em]', use: 'Card and panel titles' },
  { id: 'body', label: 'Body', sample: 'Every choice resolves with the rest of the table.', className: 'font-display text-base leading-7', use: 'Explanations and narrative' },
  { id: 'mono', label: 'Interface', sample: 'ROUND 07 / 4 OPERATORS / ACTIVE', className: 'font-mono text-xs uppercase tracking-[0.14em]', use: 'Controls, status, and compact data' },
  { id: 'micro', label: 'Micro label', sample: 'LAST RESOLUTION', className: 'label', use: 'Eyebrows and supporting metadata' },
]);

export const SPACING_TOKENS = Object.freeze([
  { label: '2xs', value: 4, use: 'Icon internals' },
  { label: 'xs', value: 8, use: 'Tight related content' },
  { label: 'sm', value: 12, use: 'Control and chip gaps' },
  { label: 'md', value: 16, use: 'Card padding' },
  { label: 'lg', value: 24, use: 'Section rhythm' },
  { label: 'xl', value: 32, use: 'Major content separation' },
  { label: '2xl', value: 48, use: 'Page-level breathing room' },
]);

export const DESIGN_PRINCIPLES = Object.freeze([
  { number: '01', title: 'The decision owns the screen', description: 'During a turn, Pick, Search, and Sabotage outrank history, settings, and supporting data.' },
  { number: '02', title: 'Pressure stays legible', description: 'Urgency comes from state, copy, and one semantic accent - never from constant animation or noise.' },
  { number: '03', title: 'Consequences are explicit', description: 'Before commitment, show odds, cost, target, protection, and what the player gives up.' },
  { number: '04', title: 'The table feels inhabited', description: 'Rivals have posture, identity, progress, and reactions without pretending bots are people.' },
  { number: '05', title: 'Proof beats promise', description: 'Use real states, replays, contract links, and concrete results instead of vague hype.' },
  { number: '06', title: 'Complexity opens on demand', description: 'Keep advanced analysis and technical controls behind drawers, details, or secondary routes.' },
]);

export const MOTION_TOKENS = Object.freeze([
  { label: 'Instant', value: '0-80ms', use: 'Pressed response and focus acknowledgement' },
  { label: 'Quick', value: '160-220ms', use: 'Hover, selection, drawer, and state changes' },
  { label: 'Reveal', value: '420-520ms', use: 'Round resolution and lock feedback' },
  { label: 'Ambient', value: '1.8-4.6s', use: 'Sparse vault presence, never required information' },
]);

export const VOICE_RULES = Object.freeze([
  { label: 'Action first', good: 'Commit and reveal', avoid: 'Submit action payload' },
  { label: 'Concrete stakes', good: 'Crack 3 locks before Rook', avoid: 'Achieve the win condition' },
  { label: 'State, then cause', good: 'Pick blocked - you were stunned', avoid: 'Transaction unsuccessful' },
  { label: 'Agents are labeled', good: 'Mara - scavenger agent', avoid: 'Another player joined' },
  { label: 'Chain is optional context', good: 'Confirmed on Sepolia', avoid: 'RPC write succeeded' },
  { label: 'No fabricated proof', good: 'Simulated practice replay', avoid: 'Player favorite' },
  { label: 'Stable nouns', good: 'Player for participants; operator for a named persona; operation for a match', avoid: 'Game, match, table, and operative mixed for the same object' },
]);

export const EXPERIENCE_COVERAGE = Object.freeze([
  { surface: 'Player hub', job: 'Choose instant or live play', priority: 'P0', patterns: 'Hero choice, live table list, empty/error states' },
  { surface: 'Instant setup', job: 'Choose pace and start', priority: 'P0', patterns: 'Mode cards, rules summary, primary CTA' },
  { surface: 'Instant active', job: 'Read table and commit', priority: 'P0', patterns: 'Vault, rival rail, action cards, reveal feedback' },
  { surface: 'Live lobby', job: 'Assemble and begin', priority: 'P0', patterns: 'Checklist, roster, transaction status' },
  { surface: 'Live active', job: 'Commit and resolve onchain', priority: 'P0', patterns: 'Status strip, vault stage, action dock, details drawer' },
  { surface: 'Resolution', job: 'Understand what changed', priority: 'P0', patterns: 'Outcome language, actor, consequence, continue' },
  { surface: 'Final briefing', job: 'Celebrate and continue', priority: 'P0', patterns: 'Winner, score, table report, rematch/share' },
  { surface: 'Workshop', job: 'Understand salvage, assemble a blueprint, and equip it', priority: 'P0', patterns: 'Material wallet, searchable catalog, recipes, ownership, equipped state' },
  { surface: 'Replays', job: 'Remember and inspect drama', priority: 'P1', patterns: 'Story art, filters, timeline, advanced drawer' },
  { surface: 'Sessions + ladder', job: 'Compare verified results', priority: 'P1', patterns: 'Filters, identity labels, honest missing data' },
  { surface: 'Profiles', job: 'Understand an operator', priority: 'P1', patterns: 'Type, form, badges, playstyle, history' },
  { surface: 'Support + legal', job: 'Answer trust questions', priority: 'P1', patterns: 'Plain language, glossary, terms, privacy' },
  { surface: 'Internal tools', job: 'Tune and validate the game', priority: 'Internal', patterns: 'Dense analysis, clear non-player routing' },
]);

export const ASSET_LIBRARY = Object.freeze(ART_ASSETS
  .filter((asset) => ['accepted', 'needs-revision'].includes(asset.status) && !asset.id.startsWith('social-'))
  .map((asset) => ({
    id: asset.id,
    src: asset.outputs[0].publicPath,
    label: asset.label,
    role: asset.role,
    kind: asset.family === 'replay-story' ? 'Narrative proof' : asset.family === 'transparent-part' ? 'Reusable part' : 'Atmosphere',
    family: asset.family,
    joy: asset.joy.target,
    status: asset.status,
    reviewNote: asset.reviewNote,
    alt: asset.alt,
  })));

export const ART_FAMILY_LIBRARY = Object.freeze(ART_FAMILIES.map((family) => ({
  id: family.id,
  label: family.label,
  role: family.role,
  composition: family.composition,
})));

export const ART_PART_QUEUE = Object.freeze(ART_ASSETS
  .filter((asset) => asset.family === 'transparent-part')
  .map((asset) => ({
    id: asset.id,
    label: asset.label,
    role: asset.role,
    joy: asset.joy.target,
    source: asset.source,
    status: asset.status,
  })));

export const ART_PIPELINE_SUMMARY = Object.freeze({
  accepted: ART_ASSETS.filter((asset) => asset.status === 'accepted').length,
  needsRevision: ART_ASSETS.filter((asset) => asset.status === 'needs-revision').length,
  briefed: ART_ASSETS.filter((asset) => asset.status === 'briefed').length,
  partsReady: ART_ASSETS.filter((asset) => asset.family === 'transparent-part' && asset.status === 'accepted').length,
  families: new Set(ART_ASSETS.map((asset) => asset.family)).size,
});
