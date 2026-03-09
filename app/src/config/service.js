const defaultServiceUrl = 'http://127.0.0.1:8787';

export const AGENT_SERVICE_URL =
  import.meta.env.VITE_AGENT_SERVICE_URL || defaultServiceUrl;

export async function fetchAgentService(path) {
  const response = await fetch(`${AGENT_SERVICE_URL}${path}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || `Service request failed (${response.status})`);
  }

  return payload;
}
