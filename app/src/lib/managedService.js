import { fetchAgentService } from '../config/service';

let playerPromise = null;

export function ensureManagedPlayer() {
  if (!playerPromise) {
    playerPromise = fetchAgentService('/api/player/session', { method: 'POST' })
      .then((payload) => payload.player)
      .catch((error) => {
        playerPromise = null;
        throw error;
      });
  }
  return playerPromise;
}

async function request(path, options = {}) {
  await ensureManagedPlayer();
  return fetchAgentService(path, {
    ...options,
    headers: options.body
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers,
  });
}

export async function listManagedOperations() {
  const payload = await request('/api/play/operations');
  return payload.operations || [];
}

export async function createManagedOperation(pace) {
  const payload = await request('/api/play/operations', {
    method: 'POST',
    body: JSON.stringify({ pace }),
  });
  return payload.operation;
}

export async function getManagedOperation(operationId) {
  const payload = await request(`/api/play/operations/${operationId}`);
  return payload.operation;
}

export async function commandManagedOperation(operationId, command, body = {}) {
  const payload = await request(`/api/play/operations/${operationId}/${command}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return payload.operation;
}

export async function getManagedWorkshop() {
  const payload = await request('/api/play/workshop');
  return payload.workshop;
}

export async function commandManagedWorkshop(operation, blueprintId) {
  const payload = await request('/api/play/workshop', {
    method: 'POST',
    body: JSON.stringify({ operation, blueprintId }),
  });
  return payload.workshop;
}
