import { readPreferenceSnapshot } from '../data/preferences.js';
import { readAcquisitionSnapshot } from './acquisition.js';

export const PRODUCT_EVENT_SCHEMA_VERSION = 2;

const ALLOWED_PROPERTIES = new Set([
  'mode', 'action', 'result', 'surface', 'state', 'roundBucket', 'stage', 'gadget',
  'bargain', 'weekly', 'outcome', 'rival', 'source', 'chassis', 'rarity', 'protocol',
  'schema', 'release', 'ruleset', 'experiment', 'variant', 'cohort', 'latency', 'destination',
  'site', 'channel', 'medium', 'campaign', 'creative', 'landing', 'referrer',
]);

function safeProperties(properties = {}) {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([key, value]) => ALLOWED_PROPERTIES.has(key) && ['string', 'number', 'boolean'].includes(typeof value))
      .map(([key, value]) => [key, String(value).slice(0, 48)]),
  );
}

export function trackProductEvent(name, properties = {}) {
  if (typeof window === 'undefined') return;
  if (!readPreferenceSnapshot(window.localStorage).analyticsEnabled) return;
  const params = new URLSearchParams(window.location.search);
  const props = safeProperties({
    schema: PRODUCT_EVENT_SCHEMA_VERSION,
    site: 'game',
    release: import.meta.env?.VITE_RELEASE_ID || 'unversioned',
    ruleset: import.meta.env?.VITE_RULESET_ID || 'default',
    experiment: params.get('experiment') || undefined,
    variant: params.get('variant') || undefined,
    ...readAcquisitionSnapshot(),
    ...properties,
  });
  window.dispatchEvent(new CustomEvent('plundrix:analytics', { detail: { name, props } }));
  if (!import.meta.env.PROD) return;
  window.plausible = window.plausible || function plausible(...args) {
    (window.plausible.q = window.plausible.q || []).push(args);
  };
  window.plausible(name, { props });
}

export function latencyBucket(milliseconds) {
  const seconds = Math.max(0, Number(milliseconds) || 0) / 1000;
  if (seconds <= 30) return '0-30s';
  if (seconds <= 60) return '31-60s';
  if (seconds <= 120) return '61-120s';
  return '121s+';
}

export function analyticsRoute(pathname) {
  if (pathname.startsWith('/game/')) return '/game/:id';
  if (pathname.startsWith('/profile/')) return '/profile/:address';
  if (pathname.startsWith('/replay/')) return '/replay/:id';
  if (pathname.startsWith('/compare/')) return '/compare/:slug';
  return pathname;
}
