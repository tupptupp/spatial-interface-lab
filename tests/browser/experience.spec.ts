import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

async function ready(page: Page) {
  await page.goto('/');
  // Cold SwiftShader startup measured >15s on the hosted runner. Still require a real
  // initialized scene within the application's explicit 30s startup budget.
  await expect(page.getByTestId('stage')).toHaveAttribute('data-state', 'ready', {
    timeout: 30000,
  });
}
async function travel(page: Page, id: string) {
  await page.evaluate((id) => {
    const node = document.getElementById(id)!;
    window.scrollTo({ top: Math.max(0, node.offsetTop - 100), behavior: 'instant' });
  }, id);
}

test('initializes WebGL without page errors and captures the real desktop render', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.locator('canvas').count()).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await testInfo.attach('desktop-reveal', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});

test('scroll and reverse scroll restore the same camera, including rapid interruption', async ({
  page,
}) => {
  await ready(page);
  const opening = await page.evaluate(() => window.__SPATIAL_LAB__!.camera);
  await travel(page, 'structure');
  await page.waitForFunction(() => Math.abs(window.__SPATIAL_LAB__!.progress - 2 / 3) < 0.001);
  expect(await page.evaluate(() => window.__SPATIAL_LAB__!.camera)).not.toEqual(opening);
  await travel(page, 'material-lab');
  await travel(page, 'reflection');
  await travel(page, 'reveal');
  await page.waitForFunction(() => window.__SPATIAL_LAB__!.progress === 0);
  expect(await page.evaluate(() => window.__SPATIAL_LAB__!.camera)).toEqual(opening);
});

test('keyboard material controls update, clamp and reset', async ({ page }, testInfo) => {
  await ready(page);
  await travel(page, 'material-lab');
  const slider = page.getByLabel('Surface roughness');
  await slider.focus();
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('0.13');
  await slider.press('End');
  await expect(slider).toHaveValue('0.48');
  await page.getByRole('button', { name: /Reset study/ }).click();
  await expect(slider).toHaveValue('0.12');
  await testInfo.attach('material-lab', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 740 },
  { width: 768, height: 1024 },
]) {
  test(`responsive composition and controls at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await ready(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await testInfo.attach('mobile-reveal', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await travel(page, 'material-lab');
    await expect(page.getByLabel('Surface roughness')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const box = await page.getByLabel('Surface roughness').boundingBox();
    expect(box!.width).toBeGreaterThan(200);
  });
}

test('reduced motion loads the static study without a canvas or scene chunk', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const sceneRequests: string[] = [];
  page.on('request', (request) => {
    if (/Experience-.*\.js/.test(request.url())) sceneRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByTestId('stage')).toHaveAttribute('data-state', 'static');
  expect(await page.locator('canvas').count()).toBe(0);
  expect(sceneRequests).toEqual([]);
  await expect(page.getByLabel('Surface roughness')).toBeDisabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('mode changes unmount and recreate the renderer', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: /Still mode/ }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: /Enable 3D/ }).click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-state', 'ready');
});

test('context loss activates fallback and permits a fresh context', async ({ page }) => {
  await ready(page);
  const supported = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const gl = canvas.getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.loseContext();
    return true;
  });
  test.skip(!supported, 'WEBGL_lose_context extension unavailable on this renderer');
  await expect(page.getByTestId('stage')).toHaveAttribute('data-state', 'static');
  await expect(page.getByRole('status', { name: 'Rendering status' })).toContainText(
    '3D unavailable',
  );
  await page.getByRole('button', { name: /Enable 3D/ }).click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-state', 'ready');
});

test('keyboard skip link and semantic controls pass automated accessibility checks', async ({
  page,
}) => {
  await ready(page);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to material lab' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: /CHANGE/ })).toBeInViewport();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('remains useful without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Beyond the Surface' })).toBeVisible();
  await expect(page.getByRole('img')).toBeVisible();
  await context.close();
});
