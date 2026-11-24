// Passeio visual pelo jogo (dev): abre, entra, mapa, cômodo, adiciona item.
// Uso: node scripts/tour.mjs <baseUrl> <outDir> [iphone|tablet]
import { chromium, devices } from '@playwright/test';
const [base, out, kind = 'iphone'] = process.argv.slice(2);
const device = kind === 'tablet' ? devices['Galaxy Tab S9 landscape'] : devices['iPhone 14'];
const browser = await chromium.launch();
const context = await browser.newContext({ ...device, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.type(), m.text());
});
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto(base);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/${kind}-1-abertura.png` });
await page.getByRole('button', { name: 'Entrar no castelo' }).click({ force: true });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/${kind}-2-mapa.png` });
await page.getByRole('button', { name: 'Abrir Quarto da Princesa' }).click({ force: true });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/${kind}-3-quarto.png` });
await page.getByRole('button', { name: 'Adicionar Cama com dossel' }).click({ force: true });
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/${kind}-4-cama.png` });
await page.getByRole('tab', { name: 'Pintar' }).click({ force: true });
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/${kind}-5-pintar.png` });
await browser.close();
