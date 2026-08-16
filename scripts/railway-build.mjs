import { spawnSync } from 'node:child_process';

const service = process.env.RAILWAY_SERVICE_NAME || '';

if (service === 'plundrix-agent') {
  console.log('Agent service uses the root dependency install; no asset build required.');
  process.exit(0);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
for (const args of [
  ['--prefix', 'app', 'ci'],
  ['--prefix', 'app', 'run', 'build'],
]) {
  const result = spawnSync(npm, args, { stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) process.exit(result.status || 1);
}
