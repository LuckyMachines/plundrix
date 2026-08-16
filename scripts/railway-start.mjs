const service = process.env.RAILWAY_SERVICE_NAME || '';

if (service === 'plundrix-agent') {
  await import('../agent-service/server.mjs');
} else {
  if (service === 'plundrix-spa') {
    process.env.AGENT_PORT ||= '8787';
    await import('../agent-service/server.mjs');
  }
  await import('../app/scripts/serve-dist.mjs');
}
