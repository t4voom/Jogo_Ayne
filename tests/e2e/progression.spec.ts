import { expect, test } from '@playwright/test';
import { skipTutorial } from './helpers';

test.describe('progressão', () => {
  test('presente diário dá estrelinhas e libera o Banheiro Real', async ({ page }) => {
    await page.goto('./#/mapa');
    await expect(page.getByRole('heading', { name: 'Meu Castelo' })).toBeVisible();
    await expect(page.locator('.map-screen .stars-pill')).toContainText('0');
    await page.getByRole('button', { name: 'Presente do dia' }).click();
    await page.getByRole('button', { name: 'Abrir o baú surpresa' }).click({ force: true });
    await expect(page.getByText('+15 estrelinhas')).toBeVisible();
    await page.getByRole('button', { name: /Obrigada/ }).click();
    await expect(page.locator('.map-screen .stars-pill')).toContainText('15');

    // O baú de hoje já foi aberto.
    await page.getByRole('button', { name: 'Presente do dia' }).click();
    await expect(page.getByText(/já foi aberto/)).toBeVisible();

    await page.getByRole('button', { name: /Banheiro Real — bloqueado/ }).click();
    await page.getByRole('button', { name: 'Abrir por 15 ⭐' }).click();
    await expect(page.getByRole('heading', { name: /Banheiro Real/ })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('.room-screen .stars-pill')).toContainText('0');
  });

  test('missão cumprida rende estrelinhas', async ({ page }) => {
    await page.goto('./#/comodo/quarto');
    await skipTutorial(page);
    await page.getByRole('button', { name: 'Adicionar Cama com dossel' }).click({ force: true });
    await expect(page.getByText('Missão cumprida: Uma cama de princesa! 🏆')).toBeVisible();
    // +1 por decorar e +10 da medalha "Primeiro toque"
    await expect(page.locator('.room-screen .stars-pill')).toContainText('11');
    await page.getByRole('button', { name: 'Voltar ao mapa do castelo' }).click();
    await page.getByRole('button', { name: 'Conquistas e missões' }).click();
    await page.getByRole('button', { name: '+5' }).click({ force: true });
    await expect(page.locator('.achievements-screen .stars-pill')).toContainText('16');
    await expect(page.getByRole('heading', { name: /Missões · 1 de/ })).toBeVisible();
  });

  test('item bloqueado pede estrelinhas', async ({ page }) => {
    await page.goto('./#/comodo/quarto');
    await skipTutorial(page);
    await page.getByRole('button', { name: /Piano de cauda \(bloqueado/ }).click({ force: true });
    await expect(page.getByText(/Piano de cauda abre com 12 ⭐/)).toBeVisible();
  });
});
