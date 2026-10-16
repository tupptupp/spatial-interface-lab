import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4173',
    '--strictPort',
  ],
  { stdio: 'inherit' },
);
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error('Preview server exited before capture');
    try {
      ready = (await globalThis.fetch('http://127.0.0.1:4173')).ok;
    } catch {
      /* Server is still starting. */
    }
    if (ready) break;
    await setTimeout(100);
  }
  if (!ready) throw new Error('Preview server did not become ready');
  const capture = spawn(process.execPath, ['scripts/capture.mjs'], { stdio: 'inherit' });
  const status = await new Promise((resolve, reject) => {
    capture.once('error', reject);
    capture.once('exit', resolve);
  });
  if (status !== 0) throw new Error(`Capture exited with status ${status}`);
} finally {
  server.kill('SIGTERM');
}
