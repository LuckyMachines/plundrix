const ACQUISITION_KEY = 'plundrix-acquisition-v1';
const VALUE_LIMIT = 48;

const SEARCH_HOSTS = ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'brave.'];
const SOCIAL_HOSTS = ['x.com', 'twitter.com', 'youtube.com', 'youtu.be', 'reddit.com', 'discord.com', 'tiktok.com', 'instagram.com', 'facebook.com', 'linkedin.com'];

function clean(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, VALUE_LIMIT);
}

function hostname(value) {
  try {
    return clean(new URL(value).hostname.replace(/^www\./, ''));
  } catch {
    return '';
  }
}

function classifyChannel({ medium, referrer }) {
  if (medium) {
    if (/cpc|ppc|paid|display/.test(medium)) return 'paid';
    if (/email|newsletter/.test(medium)) return 'email';
    if (/social/.test(medium)) return 'social';
    return medium;
  }
  if (!referrer) return 'direct';
  if (referrer === 'plundrix.com' || referrer.endsWith('.plundrix.com')) return 'marketing';
  if (SEARCH_HOSTS.some((part) => referrer.includes(part))) return 'organic';
  if (SOCIAL_HOSTS.some((part) => referrer === part || referrer.endsWith(`.${part}`))) return 'social';
  return 'referral';
}

function safeParse(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed?.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function createAcquisitionSnapshot({ href, referrer = '' }) {
  const url = new URL(href, 'https://game.plundrix.com');
  const params = url.searchParams;
  const medium = clean(params.get('utm_medium'));
  const referrerHost = hostname(referrer);
  return {
    version: 1,
    channel: classifyChannel({ medium, referrer: referrerHost }),
    medium,
    campaign: clean(params.get('utm_campaign')),
    creative: clean(params.get('utm_content')),
    source: clean(params.get('utm_source')) || (referrerHost === 'plundrix.com' ? 'plundrix-marketing' : referrerHost),
    landing: clean(url.pathname === '/' ? 'player-hub' : url.pathname.slice(1)),
    referrer: referrerHost,
  };
}

export function readAcquisitionSnapshot({
  location = typeof window !== 'undefined' ? window.location : null,
  referrer = typeof document !== 'undefined' ? document.referrer : '',
  storage = typeof window !== 'undefined' ? window.sessionStorage : null,
} = {}) {
  if (!location) return {};
  const existing = storage ? safeParse(storage.getItem(ACQUISITION_KEY)) : null;
  const snapshot = existing || createAcquisitionSnapshot({ href: location.href, referrer });
  if (!existing && storage) {
    try {
      storage.setItem(ACQUISITION_KEY, JSON.stringify(snapshot));
    } catch {
      // Attribution remains available for this event when session storage is unavailable.
    }
  }
  return Object.fromEntries(
    Object.entries(snapshot).filter(([key, value]) => key !== 'version' && value),
  );
}

export { ACQUISITION_KEY };
