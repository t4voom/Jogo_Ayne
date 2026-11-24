// Mede FPS ao arrastar um item com a CPU 4x mais lenta (aparelho médio).
// Uso: node scripts/fps.mjs <baseUrl>
import { chromium, devices } from '@playwright/test';
const [base] = process.argv.slice(2);
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['iPhone 14'], deviceScaleFactor: 3 });
const page = await context.newPage();
await page.goto(`${base}#/comodo/quarto`);
await page
  .getByRole('button', { name: 'Pular' })
  .click({ timeout: 6000 })
  .catch(() => {});
await page.waitForTimeout(800);
// Enche o quarto para ser um teste honesto.
for (const name of [
  'Cama com dossel',
  'Penteadeira com espelho',
  'Poltrona fofinha',
  'Criado-mudo',
  'Cômoda',
  'Cadeira de coração',
  'Mesinha redonda',
  'Pufe fofinho',
]) {
  await page.getByRole('button', { name: `Adicionar ${name}` }).click({ force: true });
  await page.waitForTimeout(120);
}
await page.keyboard.press('Escape');
await page.waitForTimeout(600);
const cdp = await context.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const result = await page.evaluate(async () => {
  const stage = document.querySelector('.stage');
  const item = document.querySelector('.stage-items .item[data-item-id="poltrona"]');
  const r = item.getBoundingClientRect();
  const start = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  const fire = (type, x, y) =>
    stage.dispatchEvent(
      new PointerEvent(type, {
        pointerId: 7,
        pointerType: 'touch',
        isPrimary: true,
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        buttons: type === 'pointerup' ? 0 : 1,
      }),
    );
  fire('pointerdown', start.x, start.y);
  const frames = [];
  let last = performance.now();
  await new Promise((done) => {
    let i = 0;
    const tick = (t) => {
      frames.push(t - last);
      last = t;
      i++;
      const a = (i / 120) * Math.PI * 2;
      fire('pointermove', start.x + Math.cos(a) * 80 - 80, start.y + Math.sin(a) * 60);
      if (i < 180) requestAnimationFrame(tick);
      else done();
    };
    requestAnimationFrame(tick);
  });
  fire('pointerup', start.x, start.y);
  const f = frames.slice(5).sort((a, b) => a - b);
  const avg = f.reduce((s, v) => s + v, 0) / f.length;
  return { avgFps: 1000 / avg, p95ms: f[Math.floor(f.length * 0.95)], worstMs: f[f.length - 1] };
});
console.log(JSON.stringify(result));
await browser.close();
