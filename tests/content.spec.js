import { test, expect } from '@playwright/test';

test('PDF content and all seven original client logos are available in production', async ({ page }) => {
  const failures = [];
  page.on('response', response => { if(response.status() >= 400) failures.push(response.url()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await expect(page.locator('h1')).toContainText('alta performance');
  await expect(page.locator('#sobre')).toContainText('Nossa equipe soma mais de 20 anos');
  await expect(page.locator('.service-list summary h3')).toHaveText(['Branding', 'Audiovisual', 'Sports', 'Public']);
  await expect(page.locator('.project')).toHaveCount(7);
  for (const image of await page.locator('.client-logo').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
    await expect(image).toHaveCSS('filter', 'brightness(0)');
  }
  await expect(page.locator('.client-art').first()).toHaveCSS('background-color', 'rgb(249, 255, 0)');
  await expect(page.locator('.site-footer address')).toContainText('Av. Senador Feijó, 686');
  expect(failures).toEqual([]);
});

test('each PDF sector filters the correct clients and cases show source details', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  for (const [category, count] of [['Público', 2], ['Esporte', 1], ['Franquia', 3], ['Saúde', 1], ['Todos', 7]]) {
    await page.getByRole('button', { name: category, exact: true }).click();
    await expect(page.locator('.project:visible')).toHaveCount(count);
  }
  await page.locator('[data-project="0"]').click();
  await expect(page.locator('#project-details')).toContainText('Guarujá + Compromisso com Você');
  await expect(page.locator('#project-logo')).toHaveAttribute('src', /logos\/guaruja.svg$/);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Franquia', exact: true }).click();
  await page.locator('[data-project="2"]').click();
  await expect(page.locator('#project-details')).toContainText('tráfego hiperlocal');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Saúde', exact: true }).click();
  await page.locator('[data-project="3"]').click();
  await expect(page.locator('#project-title')).toHaveText('Hospital Casa de Saúde');
  await expect(page.locator('#project-details')).toBeEmpty();
});
