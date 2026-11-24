// Gera as splash screens do iPhone (apple-touch-startup-image) com o
// Chromium do Playwright. Uso: npm run splash
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/splash');
const crown = await readFile(resolve(root, 'public/icons/crown.svg'), 'utf8');
const font = await readFile(
  resolve(
    root,
    'node_modules/@fontsource/dancing-script/files/dancing-script-latin-700-normal.woff2',
  ),
);
const crownUrl = `data:image/svg+xml;base64,${Buffer.from(crown).toString('base64')}`;
const fontUrl = `data:font/woff2;base64,${font.toString('base64')}`;

// [largura CSS, altura CSS, densidade] dos iPhones (retrato).
const DEVICES = [
  [440, 956, 3],
  [402, 874, 3],
  [430, 932, 3],
  [393, 852, 3],
  [428, 926, 3],
  [390, 844, 3],
  [375, 812, 3],
  [414, 896, 3],
  [414, 896, 2],
  [414, 736, 3],
  [375, 667, 2],
];

const html = (w, h) => `<!doctype html><html><head><style>
@font-face{font-family:'Dancing Script';src:url(${fontUrl}) format('woff2');font-weight:700}
html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
body{display:grid;place-items:center;align-content:center;gap:${w * 0.04}px;
 background:radial-gradient(circle at 50% 42%,#fff 0,#ffe6f1 38%,#f6c6dd 70%,#dcc7f5 100%)}
img{width:${w * 0.42}px;height:${w * 0.42}px;filter:drop-shadow(0 ${w * 0.02}px ${w * 0.03}px rgba(158,47,99,.3))}
h1{margin:0;font:700 ${w * 0.1}px 'Dancing Script',cursive;color:#c2407c;text-align:center;line-height:1.05}
</style></head><body><img src="${crownUrl}" alt=""><h1>O Castelo da<br>Aynebrenda</h1></body></html>`;

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const links = [];
try {
  for (const [cw, ch, dpr] of DEVICES) {
    const w = cw * dpr;
    const h = ch * dpr;
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.setContent(html(w, h));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction('document.querySelector("img")?.complete === true');
    const file = `splash-${w}x${h}.jpg`;
    await page.screenshot({ path: resolve(out, file), type: 'jpeg', quality: 84 });
    await page.close();
    links.push(
      `    <link rel="apple-touch-startup-image" href="/splash/${file}" media="(device-width: ${cw}px) and (device-height: ${ch}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)" />`,
    );
    console.info(`✓ ${file}`);
  }
} finally {
  await browser.close();
}

// Atualiza o bloco de links no index.html.
const indexPath = resolve(root, 'index.html');
const index = await readFile(indexPath, 'utf8');
const block = `<!-- splash-screens -->\n${links.join('\n')}\n    <!-- /splash-screens -->`;
const next = index.includes('<!-- /splash-screens -->')
  ? index.replace(/<!-- splash-screens -->[\s\S]*?<!-- \/splash-screens -->/, block)
  : index.replace('<!-- splash-screens -->', block);
await writeFile(indexPath, next);
