export const AGENT_SERVICE_URL =
  import.meta.env.VITE_AGENT_SERVICE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
export const AGENT_SERVICE_CONFIGURED = Boolean(AGENT_SERVICE_URL);

export async function fetchAgentService(path, options = {}) {
  if (!AGENT_SERVICE_URL) {
    throw new Error('Agent service not configured');
  }

  const response = await fetch(`${AGENT_SERVICE_URL}${path}`, {
    credentials: 'include',
    ...options,
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : {};

  if (!response.ok) {
    throw new Error(payload?.error || `Service request failed (${response.status})`);
  }

  return payload;
}
