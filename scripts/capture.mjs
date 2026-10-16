import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
const baseURL = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
mkdirSync('docs/screenshots', { recursive: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(baseURL);
await page.waitForSelector('[data-state="ready"]', { timeout: 45000 });
await page.waitForFunction(() => performance.now() - window.__SPATIAL_LAB__.readyMs >= 1200);
await page.screenshot({ path: 'docs/screenshots/desktop-reveal.png' });
await page.locator('canvas').screenshot({ path: 'docs/screenshots/desktop-canvas.png' });
await page.evaluate(() =>
  document.getElementById('material-lab').scrollIntoView({ behavior: 'instant' }),
);
await page.screenshot({ path: 'docs/screenshots/desktop-lab.png' });
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.waitForFunction(
  () => Math.abs(window.__SPATIAL_LAB__.width - innerWidth * window.__SPATIAL_LAB__.dpr) < 2,
);
await page.screenshot({ path: 'docs/screenshots/mobile-reveal.png' });
await page.locator('canvas').screenshot({ path: 'docs/screenshots/mobile-canvas.png' });
// Active requestAnimationFrame scroll workload. Frame intervals are end-to-end CPU/browser scheduling, not GPU queries.
await page.setViewportSize({ width: 1440, height: 1000 });
await page.evaluate(async () => {
  window.__SPATIAL_LAB__.frames = [];
  const maximum = document.documentElement.scrollHeight - innerHeight;
  await new Promise((resolve) => {
    const started = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - started) / 8000);
      window.scrollTo({
        top: (0.5 - 0.5 * Math.cos(p * Math.PI * 2)) * maximum,
        behavior: 'instant',
      });
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
});
const evidence = await page.evaluate(() => ({
  render: window.__SPATIAL_LAB__,
  userAgent: navigator.userAgent,
  viewport: { width: innerWidth, height: innerHeight },
  navigation: performance.getEntriesByType('navigation')[0]?.toJSON(),
}));
const samples = evidence.render.frames.slice().sort((a, b) => a - b);
const percentile = (p) =>
  samples[Math.min(samples.length - 1, Math.ceil(p * samples.length) - 1)] ?? null;
writeFileSync(
  'docs/browser-evidence.json',
  JSON.stringify(
    {
      browser: await browser.version(),
      ...evidence,
      sampleCount: samples.length,
      medianMs: percentile(0.5),
      p95Ms: percentile(0.95),
      errors,
    },
    null,
    2,
  ) + '\n',
);
await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
