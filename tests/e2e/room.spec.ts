import { expect, test } from './fixtures';
import { centerOf, items, openRoom, skipTutorial, touchGesture } from './helpers';

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
    await page.waitForTimeout(700); // termina a animação de "pop"
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
    // tutorial já foi pulado: não aparece de novo
    await page.waitForTimeout(800);
    await expect(page.getByRole('dialog', { name: 'Tutorial' })).toHaveCount(0);
    await expect(items(page)).toHaveCount(count);
    await expect(page.locator('.stage-items .item[data-item-id="gatinho"]')).toHaveCount(1);
    await expect(page.locator('.stage')).toHaveAttribute('data-ambience', 'noite');
  });

  test('arrastar para a lixeira exclui', async ({ page }) => {
    await openRoom(page);
    await page.getByRole('button', { name: 'Adicionar Criado-mudo' }).click({ force: true });
    const sel = '.stage-items .item[data-item-id="criado-mudo"]';
    await page.waitForTimeout(700); // termina a animação de "pop"
    const start = await centerOf(page, sel);
    const stage = (await page.locator('.stage').boundingBox())!;
    await touchGesture(page, [[start, { x: start.x, y: stage.y + stage.height + 120 }]]);
    await expect(page.locator(sel)).toHaveCount(0);
  });
});

test('abertura → mapa → cômodo', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Entrar no castelo' }).click({ force: true });
  await expect(page.getByRole('heading', { name: 'Meu Castelo' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir Quarto da Princesa' }).click();
  await expect(page.getByRole('heading', { name: /Quarto da Princesa/ })).toBeVisible();
  await skipTutorial(page);
  // Com um item selecionado, o botão do mapa também volta direto ao mapa.
  await page.getByRole('button', { name: 'Adicionar Trono real' }).click({ force: true });
  await expect(page.locator('.stage-items .item.is-selected')).toHaveCount(1);
  await page.getByRole('button', { name: 'Voltar ao mapa do castelo' }).click();
  await expect(page.getByRole('heading', { name: 'Meu Castelo' })).toBeVisible();
});

test('cômodo bloqueado não abre', async ({ page }) => {
  await page.goto('./#/comodo/baile');
  await expect(page.getByRole('heading', { name: 'Meu Castelo' })).toBeVisible();
});

test('tutorial da fadinha: 4 passos e não volta mais', async ({ page }) => {
  await page.goto('./#/comodo/quarto');
  const dialog = page.getByRole('dialog', { name: 'Tutorial' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Fadinha Luz');
  for (let i = 0; i < 3; i++) await dialog.getByRole('button', { name: 'Próximo' }).click();
  await dialog.getByRole('button', { name: /Começar/ }).click();
  await expect(dialog).toHaveCount(0);
  await page.waitForTimeout(700);
  await page.reload();
  await expect(page.locator('.stage .stage-bg svg')).toBeVisible();
  await page.waitForTimeout(900);
  await expect(page.getByRole('dialog', { name: 'Tutorial' })).toHaveCount(0);
});

test.describe('mais interações', () => {
  test('arrasta um item direto do catálogo para o palco', async ({ page }) => {
    await openRoom(page);
    const before = await items(page).count();
    const card = page.getByRole('button', { name: 'Adicionar Poltrona fofinha' });
    const stage = (await page.locator('.stage').boundingBox())!;
    const target = { x: stage.x + stage.width * 0.3, y: stage.y + stage.height * 0.7 };
    await card.evaluate(async (el, t) => {
      const r = el.getBoundingClientRect();
      const sideways =
        getComputedStyle(el.closest('.drawer')!).getPropertyValue('--drawer-side').trim() === '1';
      const from = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      const fire = (type: string, x: number, y: number) =>
        el.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 9,
            pointerType: 'touch',
            isPrimary: true,
            clientX: x,
            clientY: y,
            bubbles: true,
            buttons: type === 'pointerup' ? 0 : 1,
          }),
        );
      const frame = () => new Promise((res) => requestAnimationFrame(() => res(null)));
      fire('pointerdown', from.x, from.y);
      // primeiro um movimento claro "em direção ao palco", depois até o destino
      fire('pointermove', sideways ? from.x - 40 : from.x, sideways ? from.y : from.y - 40);
      await frame();
      for (let i = 1; i <= 6; i++) {
        fire('pointermove', from.x + ((t.x - from.x) * i) / 6, from.y + ((t.y - from.y) * i) / 6);
        await frame();
      }
      fire('pointerup', t.x, t.y);
    }, target);
    await expect(items(page)).toHaveCount(before + 1);
    const box = (await page.locator('.stage-items .item[data-item-id="poltrona"]').boundingBox())!;
    expect(Math.abs(box.x + box.width / 2 - target.x)).toBeLessThan(8);
  });

  test('toque longo abre o menu rápido', async ({ page }) => {
    await openRoom(page);
    await page.getByRole('button', { name: 'Adicionar Trono real' }).click({ force: true });
    const c = await centerOf(page, '.stage-items .item[data-item-id="trono"]');
    await page.evaluate(async (p) => {
      const stage = document.querySelector('.stage')!;
      stage.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerId: 3,
          pointerType: 'touch',
          isPrimary: true,
          clientX: p.x,
          clientY: p.y,
          bubbles: true,
          buttons: 1,
        }),
      );
      await new Promise((r) => setTimeout(r, 650));
      stage.dispatchEvent(
        new PointerEvent('pointerup', {
          pointerId: 3,
          pointerType: 'touch',
          isPrimary: true,
          clientX: p.x,
          clientY: p.y,
          bubbles: true,
        }),
      );
    }, c);
    const menu = page.getByRole('menu', { name: 'Ações do item' });
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: 'Duplicar' }).click();
    await expect(
      page.locator('.stage-items .item[data-item-id="trono"]:not(.is-leaving)'),
    ).toHaveCount(2);
  });

  test('modo Ver esconde a interface e volta', async ({ page }) => {
    await openRoom(page);
    await page.getByRole('button', { name: 'Modo ver: esconder os botões' }).click();
    await expect(page.locator('.drawer')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Desfazer' })).toBeHidden();
    await page.getByRole('button', { name: 'Sair do modo ver' }).click();
    await expect(page.locator('.drawer')).toBeVisible();
  });
});
