import { expect, test } from './fixtures';
import { SENHA, connectFakeSheets, createAccount, seedSession } from './fake-sheets';
import { items, skipTutorial } from './helpers';

test.describe('sincronização com a planilha', () => {
  test('o castelo aparece igual no outro aparelho da mesma conta', async ({ browser }) => {
    const tablet = await browser.newContext();
    const server = await connectFakeSheets(tablet);
    await seedSession(tablet, createAccount(server, 'ayne', SENHA, { legado: true }));
    const pageA = await tablet.newPage();
    await pageA.goto('./#/mapa');
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

    // No celular, a Ayne entra com usuário e senha.
    const phone = await browser.newContext();
    await connectFakeSheets(phone, server);
    const pageB = await phone.newPage();
    await pageB.goto('./');
    await pageB.getByRole('textbox', { name: 'Nome de usuário' }).fill('Ayne');
    await pageB.getByLabel('Senha', { exact: true }).fill(SENHA);
    await pageB.getByRole('button', { name: 'Entrar no castelo' }).click();
    await pageB.getByRole('button', { name: 'Abrir Quarto da Princesa' }).click();
    await expect(pageB.locator('.stage-items .item[data-item-id="trono"]')).toHaveCount(1);
    await expect(items(pageB)).toHaveCount(await items(pageA).count());
    await tablet.close();
    await phone.close();
  });

  test('offline: salva no aparelho e sincroniza quando a internet volta', async ({
    page,
    context,
    backend,
    network,
  }) => {
    await page.goto('./#/mapa');
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
    expect(backend.spreadsheet.getSheetByName('saves')?.dataRows().length ?? 0).toBe(0);
    network.offline = false;
    await context.setOffline(false);
    await expect(page.locator('.room-screen .sync-pill')).toHaveAttribute('data-status', 'synced', {
      timeout: 15_000,
    });
    expect(backend.spreadsheet.getSheetByName('saves')!.dataRows().length).toBeGreaterThan(0);
  });
});
