// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
describe('draft deployment guard', () => {
  it.each(['preview', 'development', ''])('allows %s builds', (VERCEL_ENV) => {
    expect(
      spawnSync(process.execPath, ['scripts/guard-deployment.mjs'], { env: { VERCEL_ENV } }).status,
    ).toBe(0);
  });
  it('rejects a Vercel production build before compilation', () => {
    const result = spawnSync(process.execPath, ['scripts/guard-deployment.mjs'], {
      env: { VERCEL_ENV: 'production' },
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Production deployment is disabled');
  });
});
