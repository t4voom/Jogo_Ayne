import { test } from '@playwright/test';

const out = process.env.SHOTS_DIR ?? 'test-results/shots';

test('prints da fase 6', async ({ page }, info) => {
  const tag = info.project.name;
  await page.goto('./#/comodo/quarto');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${tag}-tutorial.png` });
  await page.getByRole('button', { name: 'Pular' }).click();
  // monta um quarto noturno com luzes
  await page.getByRole('tab', { name: 'Decoração' }).click();
  for (const name of ['Abajur', 'Castiçal com vela', 'Lustre de cristal']) {
    await page.getByRole('button', { name: `Adicionar ${name}` }).click({ force: true });
    await page.waitForTimeout(200);
  }
  await page.getByRole('tab', { name: 'Móveis' }).click();
  await page.getByRole('button', { name: 'Adicionar Cama com dossel' }).click({ force: true });
  await page.getByRole('tab', { name: 'Pintar' }).click();
  await page.getByRole('button', { name: 'Noite' }).click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${tag}-noite.png` });
  await page.getByRole('button', { name: 'Tirar foto do cômodo' }).click();
  await page.waitForTimeout(1500);
  await page.goto('./#/album');
  await page.waitForTimeout(800);
  await page.locator('.album-photo').first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${tag}-foto.png` });
});
