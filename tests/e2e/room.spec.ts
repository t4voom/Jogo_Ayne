import { expect, test } from '@playwright/test';
import { centerOf, items, openRoom, touchGesture } from './helpers';

test.describe('cômodo', () => {
  test('adiciona item pelo catálogo, com seleção e barra do item', async ({ page }) => {
    await openRoom(page);
    const before = await items(page).count();
    await page.getByRole('button', { name: 'Adicionar Cama com dossel' }).click({ force: true });
    await expect(items(page)).toHaveCount(before + 1);
    await expect(page.locator('.stage-items .item.is-selected')).toHaveCount(1);
    await expect(page.getByRole('toolbar', { name: 'Ajustes do item' })).toBeVisible();
  });

  test('move com um dedo e desfaz', async ({ page }) => {
    await openRoom(page);
    await page.getByRole('button', { name: 'Adicionar Trono real' }).click({ force: true });
    const sel = '.stage-items .item[data-item-id="trono"]';
    const start = await centerOf(page, sel);
    const styleBefore = await page.locator(sel).getAttribute('style');
    await touchGesture(page, [[start, { x: start.x - 60, y: start.y - 30 }]]);
    const end = await centerOf(page, sel);
    expect(end.x).toBeLessThan(start.x - 40);
    await page.getByRole('button', { name: 'Desfazer' }).click();
    await expect(page.locator(sel)).toHaveAttribute('style', styleBefore ?? '');
  });

  test('pinça com dois dedos redimensiona', async ({ page }) => {
    await openRoom(page);
    await page.getByRole('button', { name: 'Adicionar Poltrona fofinha' }).click({ force: true });
    const sel = '.stage-items .item[data-item-id="poltrona"]';
    const box0 = await page.locator(sel).boundingBox();
    const c = await centerOf(page, sel);
    await touchGesture(page, [
      [
        { x: c.x - 20, y: c.y },
        { x: c.x - 70, y: c.y },
      ],
      [
        { x: c.x + 20, y: c.y },
        { x: c.x + 70, y: c.y },
      ],
    ]);
    const box1 = await page.locator(sel).boundingBox();
    expect(box1!.width).toBeGreaterThan(box0!.width * 1.5);
  });

  test('aumenta, espelha e exclui pela barra; excluir pode ser desfeito', async ({ page }) => {
    await openRoom(page);
    await page.getByRole('tab', { name: 'Decoração' }).click();
    await page.getByRole('button', { name: 'Adicionar Abajur' }).click({ force: true });
    const sel = '.stage-items .item[data-item-id="abajur"]';
    const w0 = (await page.locator(sel).boundingBox())!.width;
    await page.getByRole('button', { name: 'Maior' }).click();
    expect((await page.locator(sel).boundingBox())!.width).toBeGreaterThan(w0);
    await page.getByRole('button', { name: 'Espelhar' }).click();
    await expect(page.locator(sel)).toHaveAttribute('style', /scaleX\(-1\)/);
    await page.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.locator(sel)).toHaveCount(0);
    await page.getByRole('button', { name: 'Desfazer' }).first().click();
    await expect(page.locator(sel)).toHaveCount(1);
  });

  test('pinta parede e chão', async ({ page }) => {
    await openRoom(page);
    await page.getByRole('tab', { name: 'Pintar' }).click();
    await page.getByRole('radio', { name: 'Menta' }).first().click();
    await expect(page.getByRole('radio', { name: 'Menta' }).first()).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await page.getByRole('button', { name: 'Corações' }).click();
    await expect(page.getByRole('button', { name: 'Corações' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Xadrez' }).click();
    await expect(page.getByRole('button', { name: 'Xadrez' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Desfazer' }).click();
    await expect(page.getByRole('button', { name: 'Madeira clara' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('salva no aparelho: recarregar mantém tudo', async ({ page }) => {
    await openRoom(page);
    await page.getByRole('tab', { name: 'Bichinhos' }).click();
    await page.getByRole('button', { name: 'Adicionar Gatinho' }).click({ force: true });
    await page.getByRole('tab', { name: 'Pintar' }).click();
    await page.getByRole('button', { name: 'Noite' }).click();
    await expect(page.locator('.stage')).toHaveAttribute('data-ambience', 'noite');
    const count = await items(page).count();
    // dá tempo do salvamento automático (agrupa ~250 ms)
    await page.waitForTimeout(700);
    await page.reload();
    await expect(page.locator('.stage .stage-bg svg')).toBeVisible();
    await expect(items(page)).toHaveCount(count);
    await expect(page.locator('.stage-items .item[data-item-id="gatinho"]')).toHaveCount(1);
    await expect(page.locator('.stage')).toHaveAttribute('data-ambience', 'noite');
  });

  test('arrastar para a lixeira exclui', async ({ page }) => {
    await openRoom(page);
    await page.getByRole('button', { name: 'Adicionar Criado-mudo' }).click({ force: true });
    const sel = '.stage-items .item[data-item-id="criado-mudo"]';
    const start = await centerOf(page, sel);
    const stage = (await page.locator('.stage').boundingBox())!;
    await touchGesture(page, [[start, { x: start.x, y: stage.y + stage.height + 120 }]]);
    await expect(page.locator(sel)).toHaveCount(0);
  });
});

test('abertura → mapa → cômodo', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Entrar no castelo' }).click({ force: true });
  await page.getByRole('button', { name: 'Jogar só neste aparelho' }).click();
  await expect(page.getByRole('heading', { name: 'Meu Castelo' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir Quarto da Princesa' }).click();
  await expect(page.getByRole('heading', { name: /Quarto da Princesa/ })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar ao mapa do castelo' }).click();
  await expect(page.getByRole('heading', { name: 'Meu Castelo' })).toBeVisible();
});

test('cômodo bloqueado não abre', async ({ page }) => {
  await page.goto('./#/comodo/baile');
  await expect(page.getByRole('heading', { name: 'Meu Castelo' })).toBeVisible();
});
