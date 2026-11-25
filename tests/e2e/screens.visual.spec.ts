import { test } from './fixtures';
import { FAKE_PIN } from './fake-sheets';

// Não roda no CI (sufixo .visual.ts): uso manual para conferir o visual.
const out = process.env.SHOTS_DIR ?? 'test-results/shots';

test.use({ loggedIn: false });

test('prints de telas', async ({ page }, info) => {
  const tag = info.project.name;
  await page.goto('./');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${tag}-entrar.png` });
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByRole('textbox', { name: 'Nome de usuário' }).fill('Ayne');
  await page.getByLabel('Senha', { exact: true }).fill('coroa123');
  await page.getByLabel('Código de convite', { exact: true }).fill('1111');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${tag}-criar-erro.png` });
  await page.getByLabel('Código de convite', { exact: true }).fill(FAKE_PIN);
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${tag}-mapa.png` });
  await page.getByRole('button', { name: 'Configurações' }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${tag}-config.png` });
  await page.getByRole('button', { name: 'Trocar senha' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${tag}-senha.png` });
});
