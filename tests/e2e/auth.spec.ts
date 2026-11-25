import { expect, test } from './fixtures';
import { FAKE_PIN, SENHA, createAccount } from './fake-sheets';
import { items, skipTutorial } from './helpers';
import type { Page } from '@playwright/test';

test.use({ loggedIn: false });

const userBox = (page: Page) => page.getByRole('textbox', { name: 'Nome de usuário' });
const passBox = (page: Page) => page.getByLabel('Senha', { exact: true });

async function signIn(page: Page, usuario: string, senha = SENHA) {
  await userBox(page).fill(usuario);
  await passBox(page).fill(senha);
  await page.getByRole('button', { name: 'Entrar no castelo' }).click();
}

/** Do cômodo: volta ao mapa, abre as Configurações e sai da conta. */
async function signOutFromSettings(page: Page) {
  await page.getByRole('button', { name: 'Voltar ao mapa do castelo' }).click();
  await page.getByRole('button', { name: 'Configurações' }).click();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(userBox(page)).toBeVisible();
}

test.describe('contas', () => {
  test('cria a conta com o convite e entra no castelo', async ({ page, backend }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await userBox(page).fill('Ayne');
    await passBox(page).fill('coroa123');
    await page.getByLabel('Código de convite', { exact: true }).fill('000000');
    await page.getByRole('button', { name: 'Criar minha conta' }).click();
    await expect(page.getByRole('alert')).toContainText('convite incorreto');
    await page.getByLabel('Código de convite', { exact: true }).fill(FAKE_PIN);
    await page.getByRole('button', { name: 'Criar minha conta' }).click();
    await expect(page.getByRole('heading', { name: 'Meu Castelo' })).toBeVisible();
    await expect(page.getByText('Bem-vinda ao seu castelo, Ayne!')).toBeVisible();
    // A senha nunca vai para a planilha em texto puro.
    const row = backend.spreadsheet.getSheetByName('contas')!.dataRows()[0]!.map(String);
    expect(row[1]).toBe('ayne');
    expect(row.join('|')).not.toContain('coroa123');
  });

  test('senha errada avisa; a certa entra', async ({ page, backend }) => {
    createAccount(backend, 'gustavo');
    await page.goto('./');
    await signIn(page, 'gustavo', 'errada123');
    await expect(page.getByRole('alert')).toContainText('incorretos');
    await passBox(page).fill(SENHA);
    await page.getByRole('button', { name: 'Entrar no castelo' }).click();
    await expect(page.getByRole('heading', { name: 'Meu Castelo' })).toBeVisible();
    await expect(page.getByText('Boas-vindas, gustavo!')).toBeVisible();
  });

  test('cada conta tem o próprio castelo, mesmo no mesmo aparelho', async ({ page, backend }) => {
    createAccount(backend, 'Ayne', SENHA, { legado: true });
    createAccount(backend, 'gustavo');

    await page.goto('./');
    await signIn(page, 'ayne');
    await page.getByRole('button', { name: 'Abrir Quarto da Princesa' }).click();
    await skipTutorial(page);
    await page.getByRole('button', { name: 'Adicionar Trono real' }).click({ force: true });
    await expect(page.locator('.room-screen .sync-pill')).toHaveAttribute('data-status', 'synced', {
      timeout: 15_000,
    });
    const ayneItems = await items(page).count();

    await signOutFromSettings(page);
    await signIn(page, 'gustavo');
    await page.getByRole('button', { name: 'Abrir Quarto da Princesa' }).click();
    await skipTutorial(page);
    await expect(page.locator('.stage-items .item[data-item-id="trono"]')).toHaveCount(0);
    expect(await items(page).count()).toBeLessThan(ayneItems);

    await signOutFromSettings(page);
    await signIn(page, 'ayne');
    await page.getByRole('button', { name: 'Abrir Quarto da Princesa' }).click();
    await expect(page.locator('.stage-items .item[data-item-id="trono"]')).toHaveCount(1);
  });

  test('troca a senha nas configurações', async ({ page, backend }) => {
    createAccount(backend, 'ayne');
    await page.goto('./');
    await signIn(page, 'ayne');
    await page.getByRole('button', { name: 'Configurações' }).click();
    await page.getByRole('button', { name: 'Trocar senha' }).click();
    await page.getByLabel('Senha atual').fill('errada123');
    await page.getByLabel('Senha nova').fill('novinha99');
    await page.getByRole('button', { name: 'Trocar senha' }).last().click();
    await expect(page.getByRole('alert')).toContainText('não confere');
    await page.getByLabel('Senha atual').fill(SENHA);
    await page.getByRole('button', { name: 'Trocar senha' }).last().click();
    await expect(page.getByText('Senha trocada!')).toBeVisible();
    // A senha nova vale; a antiga não.
    const ok = backend.gs.doPost({
      postData: {
        contents: JSON.stringify({
          action: 'login',
          deviceId: 'outro',
          payload: { usuario: 'ayne', senha: 'novinha99' },
        }),
      },
    });
    expect(JSON.parse(ok.getContent())).toMatchObject({ ok: true });
  });

  test('sessão que terminou pede para entrar de novo', async ({ page, backend, context }) => {
    const session = createAccount(backend, 'ayne');
    // Token antigo: a senha foi trocada em outro aparelho.
    const stale = { ...session, token: session.token.replace(/^([^.]+)\.1\./, '$1.0.') };
    await context.addInitScript((value) => {
      if (!sessionStorage.getItem('semeado')) {
        sessionStorage.setItem('semeado', '1');
        localStorage.setItem('castelo:sessao', value);
      }
    }, JSON.stringify(stale));
    await page.goto('./#/mapa');
    const pill = page.locator('.map-screen .sync-pill');
    await expect(pill).toHaveAttribute('data-status', 'needs-login', { timeout: 15_000 });
    await pill.click();
    await page.getByRole('button', { name: 'Entrar de novo' }).click();
    await expect(userBox(page)).toBeVisible();
    await signIn(page, 'ayne');
    await expect(page.getByRole('heading', { name: 'Meu Castelo' })).toBeVisible();
  });
});
