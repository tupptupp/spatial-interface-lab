// Capture the sculpture concept comparison frames from the development-only explore page.
// Usage: start `npm run dev -- --port 5173`, then `node scripts/capture-concepts.mjs`.
// Refined Concept B: CONCEPTS=refined VIEWS=hero,alt,detail,spatial CAPTURE_DIR=docs/concepts/refined
// EXPLORE_URL overrides the page; CHROMIUM_PATH selects a preinstalled browser binary.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const base = process.env.EXPLORE_URL || 'http://127.0.0.1:5173/explore.html';
const out = process.env.CAPTURE_DIR || 'docs/concepts';
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const rig = process.env.RIG || 'concept';
// CONCEPTS / VIEWS select a subset, e.g. CONCEPTS=refined VIEWS=hero,alt,detail,spatial.
const concepts = (process.env.CONCEPTS || 'monolith,interlocked,tension').split(',');
const views = (process.env.VIEWS || 'hero,detail,spatial').split(',');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const errors = [];
const manifest = [];
async function shoot(page, concept, view, name) {
  const url = `${base}?concept=${concept}&view=${view}&rig=${rig}&fidelity=high&ui=0`;
  await page.goto(url);
  await page.waitForFunction(
    (prefix) => document.documentElement.dataset.frame?.startsWith(prefix),
    `${concept}:${view}:`,
    { timeout: 180000 },
  );
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 90 }).toFile(`${out}/${name}.webp`);
  manifest.push({ name, url, viewport: page.viewportSize() });
  console.log('captured', name);
}

const desktop = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
});
desktop.on('pageerror', (e) => errors.push(e.message));
for (const concept of concepts)
  for (const view of views) {
    const name = `${concept}-${view}${rig === 'baseline' ? '-baseline' : ''}`;
    if (!only || only.includes(name)) await shoot(desktop, concept, view, name);
  }
if (!only && !process.env.SKIP_MOBILE) {
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  mobile.on('pageerror', (e) => errors.push(e.message));
  for (const concept of concepts) await shoot(mobile, concept, 'hero', `${concept}-hero-mobile`);
}
const renderer = await desktop.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  return gl.getParameter(debug.UNMASKED_RENDERER_WEBGL);
});
writeFileSync(
  `${out}/capture-${rig}.json`,
  JSON.stringify({ renderer, browser: browser.version(), errors, frames: manifest }, null, 2) +
    '\n',
);
await browser.close();
if (errors.length) {
  console.error(errors);
  process.exit(1);
}
