import { expect, test } from '@playwright/test';
import { openRoom } from './helpers';

test('tira foto do cômodo e ela aparece no álbum', async ({ page }) => {
  await openRoom(page);
  await page.getByRole('button', { name: 'Tirar foto do cômodo' }).click();
  await expect(page.getByText('Foto guardada no álbum 📸')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Ver', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Álbum de fotos' })).toBeVisible();
  await expect(page.locator('.album-photo')).toHaveCount(1);
  await expect(page.getByText('1 lembrança')).toBeVisible();
  await page.locator('.album-photo').first().click();
  const viewer = page.getByRole('dialog', { name: 'Foto' });
  await expect(viewer.locator('img')).toBeVisible();
  // a foto completa é um PNG de verdade
  const natural = await viewer
    .locator('img')
    .evaluate((img) => (img as HTMLImageElement).naturalWidth);
  expect(natural).toBe(1080);
});
