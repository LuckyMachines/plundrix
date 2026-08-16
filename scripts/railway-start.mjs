const service = process.env.RAILWAY_SERVICE_NAME || '';

if (service === 'plundrix-agent') {
  await import('../agent-service/server.mjs');
} else {
  await import('../app/scripts/serve-dist.mjs');
}
