import { expect, test, type Page } from '@playwright/test';
import { createFakeAppsScript } from '../../apps-script/test/fake-apps-script';
import { FAKE_PIN, connectFakeSheets } from './fake-sheets';
import { items, skipTutorial } from './helpers';

async function enterWithPin(page: Page, pin: string) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Entrar no castelo' }).click({ force: true });
  await expect(page.getByRole('dialog', { name: 'Código do castelo' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Código do castelo' }).fill(pin);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

test.describe('sincronização com a planilha', () => {
  test('código errado mostra erro; certo entra no castelo', async ({ page, context }) => {
    await connectFakeSheets(context);
    await enterWithPin(page, '000000');
    await expect(page.getByRole('alert')).toContainText('incorreto');
    await page.getByRole('textbox', { name: 'Código do castelo' }).fill(FAKE_PIN);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Meu Castelo' })).toBeVisible();
  });

  test('o castelo aparece igual no outro aparelho', async ({ browser }) => {
    const server = createFakeAppsScript({ pin: FAKE_PIN });
    const tablet = await browser.newContext();
    await connectFakeSheets(tablet, server);
    const pageA = await tablet.newPage();
    await enterWithPin(pageA, FAKE_PIN);
    await pageA.getByRole('button', { name: 'Abrir Quarto da Princesa' }).click();
    await skipTutorial(pageA);
    await pageA.getByRole('button', { name: 'Adicionar Trono real' }).click({ force: true });
    // Espera o debounce (~3 s) e o envio.
    await expect(pageA.locator('.room-screen .sync-pill')).toHaveAttribute(
      'data-status',
      'synced',
      { timeout: 15_000 },
    );
    expect(server.spreadsheet.getSheetByName('saves')!.dataRows().length).toBeGreaterThan(0);

    const phone = await browser.newContext();
    await connectFakeSheets(phone, server);
    const pageB = await phone.newPage();
    await enterWithPin(pageB, FAKE_PIN);
    await pageB.getByRole('button', { name: 'Abrir Quarto da Princesa' }).click();
    await expect(pageB.locator('.stage-items .item[data-item-id="trono"]')).toHaveCount(1);
    await expect(items(pageB)).toHaveCount(await items(pageA).count());
    await tablet.close();
    await phone.close();
  });

  test('offline: salva no aparelho e sincroniza quando a internet volta', async ({
    page,
    context,
  }) => {
    const network = { offline: false };
    const server = await connectFakeSheets(context, undefined, network);
    await enterWithPin(page, FAKE_PIN);
    await page.getByRole('button', { name: 'Abrir Quarto da Princesa' }).click();
    await skipTutorial(page);
    network.offline = true;
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Adicionar Poltrona fofinha' }).click({ force: true });
    await expect(page.locator('.room-screen .sync-pill')).toHaveAttribute(
      'data-status',
      'offline',
      { timeout: 15_000 },
    );
    expect(server.spreadsheet.getSheetByName('saves')?.dataRows().length ?? 0).toBe(0);
    network.offline = false;
    await context.setOffline(false);
    await expect(page.locator('.room-screen .sync-pill')).toHaveAttribute('data-status', 'synced', {
      timeout: 15_000,
    });
    expect(server.spreadsheet.getSheetByName('saves')!.dataRows().length).toBeGreaterThan(0);
  });
});
