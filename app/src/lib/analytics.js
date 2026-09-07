const ALLOWED_PROPERTIES = new Set(['mode', 'action', 'result', 'surface', 'state', 'roundBucket']);

function safeProperties(properties = {}) {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([key, value]) => ALLOWED_PROPERTIES.has(key) && ['string', 'number', 'boolean'].includes(typeof value))
      .map(([key, value]) => [key, String(value).slice(0, 48)]),
  );
}

export function trackProductEvent(name, properties = {}) {
  if (typeof window === 'undefined') return;
  const props = safeProperties(properties);
  window.dispatchEvent(new CustomEvent('plundrix:analytics', { detail: { name, props } }));
  if (!import.meta.env.PROD) return;
  window.plausible = window.plausible || function plausible(...args) {
    (window.plausible.q = window.plausible.q || []).push(args);
  };
  window.plausible(name, { props });
}

export function analyticsRoute(pathname) {
  if (pathname.startsWith('/game/')) return '/game/:id';
  if (pathname.startsWith('/profile/')) return '/profile/:address';
  if (pathname.startsWith('/replay/')) return '/replay/:id';
  if (pathname.startsWith('/compare/')) return '/compare/:slug';
  return pathname;
}
