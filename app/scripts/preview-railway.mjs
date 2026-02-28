import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const port = process.env.PORT || '4173';
const viteBin =
  process.platform === 'win32'
    ? resolve(process.cwd(), 'node_modules', '.bin', 'vite.cmd')
    : resolve(process.cwd(), 'node_modules', '.bin', 'vite');

const child =
  process.platform === 'win32'
    ? spawn(
        `"${viteBin}" preview --host 0.0.0.0 --port ${port}`,
        [],
        {
          stdio: 'inherit',
          env: process.env,
          shell: true,
        }
      )
    : spawn(viteBin, ['preview', '--host', '0.0.0.0', '--port', port], {
        stdio: 'inherit',
        env: process.env,
      });

child.on('close', (code) => {
  process.exit(code ?? 0);
});
