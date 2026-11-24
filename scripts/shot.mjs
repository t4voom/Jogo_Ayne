// Tira um print de uma URL do servidor de desenvolvimento (uso: node scripts/shot.mjs url saida.png [largura] [altura])
import { chromium } from '@playwright/test';
const [url, out, w = '1300', h = '900'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 1,
});
page.on('console', (m) => {
  if (m.type() === 'error') console.error('console:', m.text());
});
page.on('pageerror', (e) => console.error('pageerror:', e.message));
await page.goto(url);
await page.waitForSelector('[data-ready="1"]', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(400);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
