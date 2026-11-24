// Gera os ícones PNG do PWA a partir de public/icons/crown.svg usando o
// Chromium do Playwright (sem dependências nativas como sharp).
//
// Uso: npm run icons
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'public/icons');
const crown = await readFile(resolve(outDir, 'crown.svg'), 'utf8');
const crownDataUrl = `data:image/svg+xml;base64,${Buffer.from(crown).toString('base64')}`;

/**
 * @param {number} size tamanho final em px
 * @param {number} crownScale fração do lado ocupada pela coroa
 * @param {boolean} rounded cantos arredondados (só para favicon)
 */
function iconHtml(size, crownScale, rounded) {
  const crownSize = Math.round(size * crownScale);
  return `<!doctype html><html><head><style>
    html,body{margin:0;width:${size}px;height:${size}px;overflow:hidden;background:transparent}
    .bg{position:absolute;inset:0;border-radius:${rounded ? size * 0.22 : 0}px;
      background:
        radial-gradient(circle at 50% 46%, rgba(255,255,255,.95) 0, rgba(255,255,255,0) ${size * 0.42}px),
        radial-gradient(circle at 20% 15%, #ffe3f0 0, transparent 55%),
        linear-gradient(160deg, #ffc4dd 0%, #f6a9cb 45%, #d8b8f2 100%);}
    img{position:absolute;left:${(size - crownSize) / 2}px;top:${(size - crownSize) / 2 + size * 0.01}px;
      width:${crownSize}px;height:${crownSize}px}
  </style></head><body>
    <div class="bg"></div>
    <img src="${crownDataUrl}" alt="">
  </body></html>`;
}

const targets = [
  { file: 'icon-192.png', size: 192, scale: 0.8, rounded: false },
  { file: 'icon-512.png', size: 512, scale: 0.8, rounded: false },
  // Maskable: a coroa precisa caber no círculo seguro (80% central).
  { file: 'maskable-512.png', size: 512, scale: 0.62, rounded: false },
  // iOS arredonda os cantos sozinho: o ícone deve ser quadrado e opaco.
  { file: 'apple-touch-icon-180.png', size: 180, scale: 0.78, rounded: false },
  { file: 'favicon-32.png', size: 32, scale: 0.92, rounded: true },
  { file: 'favicon-64.png', size: 64, scale: 0.9, rounded: true },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const t of targets) {
    await page.setViewportSize({ width: t.size, height: t.size });
    await page.setContent(iconHtml(t.size, t.scale, t.rounded));
    await page.waitForFunction('document.querySelector("img")?.complete === true');
    await page.screenshot({
      path: resolve(outDir, t.file),
      omitBackground: t.rounded,
      clip: { x: 0, y: 0, width: t.size, height: t.size },
    });
    console.info(`✓ ${t.file}`);
  }
} finally {
  await browser.close();
}
