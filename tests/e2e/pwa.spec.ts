import { expect, test } from './fixtures';

test.describe('PWA', () => {
  test('funciona offline depois do primeiro acesso', async ({ page, context, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'O WebKit do Playwright no Linux não ativa service workers de forma confiável',
    );
    await page.goto('./');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    // Dá tempo do precache terminar (arte e telas sob demanda).
    await page.waitForTimeout(1500);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: /Aynebrenda/ })).toBeVisible();
    await page.getByRole('button', { name: 'Entrar no castelo' }).click({ force: true });
    await expect(page.getByRole('heading', { name: 'Meu Castelo' })).toBeVisible();
    await page.getByRole('button', { name: /Abrir.*Quarto da Princesa/ }).click();
    await expect(page.locator('.stage-items .item').first()).toBeVisible();
    await expect(page.locator('.stage-items .item.is-loading')).toHaveCount(0);
  });

  test('manifest com ícones, cor do tema e modo app', async ({ page, request }) => {
    await page.goto('./');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifest = (await (
      await request.get(new URL(href ?? '', page.url()).toString())
    ).json()) as {
      display: string;
      theme_color: string;
      start_url: string;
      icons: { sizes: string; purpose?: string }[];
    };
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/Jogo_Ayne/');
    expect(manifest.icons.map((i) => i.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    );
    expect(await page.locator('link[rel="apple-touch-icon"]').count()).toBe(1);
    expect(await page.locator('link[rel="apple-touch-startup-image"]').count()).toBeGreaterThan(5);
    expect(
      await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content'),
    ).toBe('yes');
  });
});

test.describe('banner de instalação', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('no iPhone ensina pelo Safari; dá para dispensar', async ({ page }, info) => {
    test.skip(info.project.name !== 'iphone-14', 'instruções do iPhone');
    await page.goto('./#/mapa');
    const banner = page.getByRole('complementary', { name: 'Instalar o jogo' });
    await expect(banner).toBeVisible({ timeout: 8000 });
    await banner.getByRole('button', { name: 'Como?' }).click();
    await expect(page.getByRole('dialog', { name: 'Como instalar no iPhone' })).toContainText(
      'Adicionar à Tela de Início',
    );
    await page.getByRole('button', { name: /Entendi/ }).click();
    await banner.getByRole('button', { name: 'Agora não' }).click();
    await expect(banner).toHaveCount(0);
    await page.reload();
    await page.waitForTimeout(5000);
    await expect(page.getByRole('complementary', { name: 'Instalar o jogo' })).toHaveCount(0);
  });
});
