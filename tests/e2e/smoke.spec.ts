import { expect, test } from '@playwright/test';

test('abre o castelo e mostra o título', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'O Castelo da Aynebrenda' })).toBeVisible();
  await expect(page).toHaveTitle('O Castelo da Aynebrenda');
});

test('publica o manifest do PWA', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const res = await request.get(new URL(href ?? '', page.url()).toString());
  expect(res.ok()).toBe(true);
  const manifest = (await res.json()) as { display: string; icons: { purpose?: string }[] };
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
});
