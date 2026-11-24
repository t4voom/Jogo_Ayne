import { test } from '@playwright/test';
import { FAKE_PIN, connectFakeSheets } from './fake-sheets';

// Não roda no CI (sufixo .visual.ts): uso manual para conferir o visual.
const out = process.env.SHOTS_DIR ?? 'test-results/shots';

test('prints de telas', async ({ page, context }, info) => {
  await connectFakeSheets(context);
  const tag = info.project.name;
  await page.goto('./');
  await page.getByRole('button', { name: 'Entrar no castelo' }).click({ force: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${tag}-pin.png` });
  await page.getByRole('textbox', { name: 'Código do castelo' }).fill('1111');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${tag}-pin-erro.png` });
  await page.getByRole('textbox', { name: 'Código do castelo' }).fill(FAKE_PIN);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${tag}-mapa.png` });
  await page.getByRole('button', { name: 'Configurações' }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${tag}-config.png` });
  await page.locator('.settings-screen .sync-pill').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${tag}-sync.png` });
});
