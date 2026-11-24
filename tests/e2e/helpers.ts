import { expect, type Page } from '@playwright/test';

export interface Pt {
  x: number;
  y: number;
}

/** Abre o jogo direto num cômodo (pula a abertura e o tutorial). */
export async function openRoom(page: Page, roomId = 'quarto'): Promise<void> {
  await page.goto(`./#/comodo/${roomId}`);
  await expect(page.locator('.stage .stage-bg svg')).toBeVisible();
  await expect(page.locator('#boot')).toHaveCount(0, { timeout: 10_000 });
  await skipTutorial(page);
}

/** O tutorial da fadinha aparece na primeira visita a um cômodo. */
export async function skipTutorial(page: Page): Promise<void> {
  const skip = page
    .getByRole('dialog', { name: 'Tutorial' })
    .getByRole('button', { name: 'Pular' });
  await skip.waitFor({ state: 'visible', timeout: 8_000 });
  // O cartão tem animações contínuas (fadinha); não precisamos esperar "parar".
  await skip.click({ force: true });
  await expect(page.getByRole('dialog', { name: 'Tutorial' })).toHaveCount(0);
}

export function items(page: Page) {
  return page.locator('.stage-items .item:not(.is-leaving)');
}

/** Centro (em px de tela) de um item do palco. */
export async function centerOf(page: Page, selector: string): Promise<Pt> {
  // Espera o desenho do item carregar (a arte vem em pedaços sob demanda).
  await page.locator(`${selector} svg`).first().waitFor({ state: 'visible' });
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`sem caixa para ${selector}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Gesto de toque sintético com Pointer Events (funciona igual no WebKit e no
 * Chromium, inclusive multitoque). `paths` = trajetória de cada dedo.
 */
export async function touchGesture(page: Page, paths: Pt[][], steps = 8): Promise<void> {
  await page.evaluate(
    async ({ paths, steps }) => {
      const stage = document.querySelector('.stage');
      if (!stage) throw new Error('sem palco');
      const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
      // Entre os passos, um intervalo curto de relógio (não de quadro): no WebKit
      // do CI um quadro pode demorar centenas de ms e o "toque longo" (480 ms)
      // dispararia antes do dedo "andar" — um dedo de verdade é bem mais rápido.
      const tick = () => new Promise((r) => setTimeout(r, 12));
      const fire = (type: string, id: number, p: { x: number; y: number }) => {
        stage.dispatchEvent(
          new PointerEvent(type, {
            pointerId: id,
            pointerType: 'touch',
            isPrimary: id === 1,
            clientX: p.x,
            clientY: p.y,
            bubbles: true,
            cancelable: true,
            button: 0,
            buttons: type === 'pointerup' ? 0 : 1,
          }),
        );
      };
      const at = (path: { x: number; y: number }[], t: number) => {
        const seg = (path.length - 1) * t;
        const i = Math.min(path.length - 2, Math.floor(seg));
        const f = seg - i;
        const a = path[i]!;
        const b = path[i + 1] ?? a;
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
      };
      paths.forEach((path, k) => fire('pointerdown', k + 1, path[0]!));
      await tick();
      for (let s = 1; s <= steps; s++) {
        paths.forEach((path, k) => fire('pointermove', k + 1, at(path, s / steps)));
        await tick();
      }
      paths.forEach((path, k) => fire('pointerup', k + 1, path[path.length - 1]!));
      await frame();
    },
    { paths, steps },
  );
}
