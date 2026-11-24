// Prints da progressão (dev): mapa, presente diário, conquistas.
import { chromium, devices } from '@playwright/test';
const [base, out, kind = 'iphone'] = process.argv.slice(2);
const device = kind === 'tablet' ? devices['Galaxy Tab S9 landscape'] : devices['iPhone 14'];
const browser = await chromium.launch();
const page = await (await browser.newContext({ ...device, deviceScaleFactor: 1 })).newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('console:', m.text());
});
await page.goto(`${base}#/mapa`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/${kind}-p1-mapa.png` });
await page.getByRole('button', { name: 'Presente do dia' }).click({ force: true });
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/${kind}-p2-bau.png` });
await page.getByRole('button', { name: 'Abrir o baú surpresa' }).click({ force: true });
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/${kind}-p3-bau-aberto.png` });
await page.getByRole('button', { name: /Obrigada/ }).click({ force: true });
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Conquistas e missões' }).click({ force: true });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${out}/${kind}-p4-conquistas.png`, fullPage: false });
await browser.close();
