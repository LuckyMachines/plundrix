export const AGENT_SERVICE_URL = import.meta.env.VITE_AGENT_SERVICE_URL || '';

export async function fetchAgentService(path) {
  if (!AGENT_SERVICE_URL) {
    throw new Error('Agent service not configured');
  }

  const response = await fetch(`${AGENT_SERVICE_URL}${path}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || `Service request failed (${response.status})`);
  }

  return payload;
}
