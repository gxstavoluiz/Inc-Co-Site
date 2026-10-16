import { test, expect } from '@playwright/test';

async function openSite(page) {
  await page.goto('./');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('html')).toHaveAttribute('data-motion', /on|off/);
}

async function galleryBounds(page) {
  return page.locator('#projetos').evaluate(element => ({
    top: element.getBoundingClientRect().top + window.scrollY,
    travel: element.offsetHeight - element.querySelector('.projects-pin').offsetHeight,
  }));
}

async function jump(page, top) {
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), top);
}

async function heroScale(page) {
  return page.locator('.hero-surface').evaluate(el => el.getBoundingClientRect().width / el.offsetWidth);
}

test('whole hero shrinks while pinned, reverses and releases into the next section', async ({ page }) => {
  await openSite(page);
  const stage = page.locator('.hero-stage');
  await expect(stage).toHaveClass(/is-pinned/);
  expect(await heroScale(page)).toBeCloseTo(1, 2);
  const bounds = await stage.evaluate(el => ({
    top: el.getBoundingClientRect().top + scrollY,
    travel: el.offsetHeight - el.firstElementChild.offsetHeight,
    height: el.offsetHeight,
  }));
  await jump(page, bounds.top + bounds.travel / 2);
  await expect.poll(() => heroScale(page)).toBeCloseTo(.91, 2);
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  await jump(page, bounds.top + bounds.travel);
  await expect.poll(() => heroScale(page)).toBeCloseTo(.82, 2);
  await expect(page.locator('.hero-surface')).toHaveCSS('border-radius', '36px');
  await jump(page, bounds.top + bounds.height);
  await expect(page.locator('.hero-surface')).not.toBeInViewport();
  await expect(page.locator('#sobre')).toBeInViewport();
  await jump(page, 0);
  await expect.poll(() => heroScale(page)).toBeCloseTo(1, 2);
  await page.locator('.hero-actions .button').click();
  await expect(page.locator('#contato')).toBeInViewport();
});

test('mobile hero shrinks gently without pinning and preserves the menu and anchor links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openSite(page);
  await expect(page.locator('.hero-stage')).not.toHaveClass(/is-pinned/);
  const end = await page.locator('.hero-stage').evaluate(el => el.offsetTop + el.offsetHeight * .75);
  await jump(page, end);
  await expect.poll(() => heroScale(page)).toBeCloseTo(.94, 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await jump(page, 0);
  await expect.poll(() => heroScale(page)).toBeCloseTo(1, 2);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.locator('#navigation')).toBeInViewport();
  await page.locator('#navigation a[href="#sobre"]').click();
  await expect(page.locator('#navigation')).not.toHaveClass(/is-open/);
  await expect(page.locator('#sobre')).toBeInViewport();
});

test('desktop scroll moves projects horizontally and releases the following section', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openSite(page);
  await expect(page.locator('#projetos')).toHaveClass(/is-pinned/);
  const bounds = await galleryBounds(page);
  expect(bounds.travel).toBeGreaterThan(200);
  await jump(page, bounds.top);
  await expect.poll(() => page.locator('.projects-pin').evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(2);
  const firstX = await page.locator('.project').first().evaluate(el => el.getBoundingClientRect().x);
  await jump(page, bounds.top + bounds.travel * .8);
  await expect.poll(() => page.locator('.project').first().evaluate(el => el.getBoundingClientRect().x)).toBeLessThan(firstX - bounds.travel * .7);
  await jump(page, bounds.top + bounds.travel + 300);
  await expect.poll(() => page.locator('#contato').evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(800);
  expect(errors).toEqual([]);
});

test('gallery arrows, project dialog, filters and keyboard navigation work together', async ({ page }) => {
  await openSite(page);
  const bounds = await galleryBounds(page);
  await jump(page, bounds.top);
  await page.getByRole('button', { name: 'Próximo projeto' }).click();
  await expect(page.locator('.project-counter')).toHaveText('02 / 07');
  await page.locator('[data-project="1"]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#project-title')).toContainText('Robinho Jr.');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Saúde', exact: true }).click();
  await expect(page.locator('.project:visible')).toHaveCount(1);
  await expect(page.locator('#projetos')).not.toHaveClass(/is-pinned/);
  await expect(page.locator('.project-next')).toBeDisabled();
  await expect(page.locator('.project-counter')).toHaveText('01 / 01');
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await expect(page.locator('#projetos')).toHaveClass(/is-pinned/);
  await page.locator('.project-viewport').focus();
  await page.keyboard.press('End');
  await expect(page.locator('.project-counter')).toHaveText('07 / 07');
  await page.getByRole('button', { name: 'Público', exact: true }).click();
  await expect(page.locator('.project:visible')).toHaveCount(2);
  await expect(page.locator('.project-counter')).toHaveText('01 / 02');
  await expect.poll(() => page.locator('.projects-pin').evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(2);
});

test('hero reacts to pointer with real liquid displacement then settles', async ({ page }) => {
  await openSite(page);
  await page.locator('.hero-art').hover({ position: { x: 150, y: 160 } });
  await page.mouse.move(1100, 400, { steps: 5 });
  await expect.poll(() => page.locator('#inc-liquid feDisplacementMap').getAttribute('scale')).not.toBe('0');
  await expect(page.locator('.amp')).toHaveClass(/is-liquid/);
  await page.mouse.move(10, 10);
  await expect(page.locator('.amp')).not.toHaveClass(/is-liquid/, { timeout: 6000 });
});

test('pause persists and disables liquid and pinned motion', async ({ page }) => {
  await openSite(page);
  await page.getByRole('button', { name: 'Pausar efeitos' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(page.locator('.hero-stage')).not.toHaveClass(/is-pinned/);
  await expect(page.locator('.hero-surface')).toHaveCSS('transform', 'none');
  await expect(page.locator('#projetos')).not.toHaveClass(/is-pinned/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Ativar efeitos' })).toBeVisible();
  await expect(page.locator('.amp')).toHaveCSS('filter', 'none');
  await page.getByRole('button', { name: 'Ativar efeitos' }).click();
  await expect(page.locator('#projetos')).toHaveClass(/is-pinned/);
});

test('reduced-motion keeps all content and gallery controls usable, including live changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSite(page);
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(page.getByRole('button', { name: 'Movimento reduzido' })).toBeDisabled();
  await expect(page.locator('.hero-stage')).not.toHaveClass(/is-pinned/);
  await jump(page, 300);
  expect(await heroScale(page)).toBeCloseTo(1, 2);
  await expect(page.locator('#projetos')).not.toHaveClass(/is-pinned/);
  await expect(page.locator('.amp')).toHaveCSS('filter', 'none');
  await page.getByRole('button', { name: 'Próximo projeto' }).click();
  await expect(page.locator('.project-counter')).toHaveText('02 / 07');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.hero-stage')).toHaveClass(/is-pinned/);
  await expect(page.locator('#projetos')).toHaveClass(/is-pinned/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.hero-stage')).not.toHaveClass(/is-pinned/);
  await expect(page.locator('.hero-surface')).toHaveCSS('transform', 'none');
  await expect(page.locator('#projetos')).not.toHaveClass(/is-pinned/);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`responsive gallery stays within the page at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openSite(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width <= 900) {
      await expect(page.locator('#projetos')).not.toHaveClass(/is-pinned/);
      await page.getByRole('button', { name: 'Próximo projeto' }).click();
      await expect(page.locator('.project-counter')).toHaveText('02 / 07');
      await expect.poll(() => page.locator('.project-viewport').evaluate(el => el.scrollLeft)).toBeGreaterThan(20);
      await page.locator('[data-project="1"]').click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });
}

test('short desktop uses native scroll; resizing keeps gallery usable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  await openSite(page);
  await expect(page.locator('#projetos')).not.toHaveClass(/is-pinned/);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator('#projetos')).toHaveClass(/is-pinned/);
  const bounds = await galleryBounds(page);
  await jump(page, bounds.top + bounds.travel);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#projetos')).not.toHaveClass(/is-pinned/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('without JavaScript all projects remain available by native horizontal scrolling', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4175/Inc-Co-Site/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#projetos')).not.toHaveClass(/is-pinned/);
  await expect(page.locator('.project')).toHaveCount(7);
  await context.close();
});
