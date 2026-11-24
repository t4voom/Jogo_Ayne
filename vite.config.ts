/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * O GitHub Pages serve o site em https://<usuario>.github.io/<repositorio>/,
 * então o `base` precisa ser o nome do repositório. Pode ser sobrescrito por
 * VITE_BASE (ex.: "/" para servir na raiz de outro domínio).
 */
const REPO_BASE = '/Jogo_Ayne/';
const base = process.env.VITE_BASE ?? REPO_BASE;

const THEME_COLOR = '#f4a6c6';
const BACKGROUND_COLOR = '#fff4f9';

export default defineConfig({
  base,
  build: {
    target: ['es2022', 'safari16.4', 'chrome111'],
    cssTarget: ['safari16.4', 'chrome111'],
    sourcemap: true,
    assetsInlineLimit: 2048,
  },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        id: base,
        name: 'O Castelo da Aynebrenda',
        short_name: 'Castelo da Ayne',
        description: 'Decore o castelo da princesa Ayne, cômodo por cômodo. 👑',
        lang: 'pt-BR',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'any',
        theme_color: THEME_COLOR,
        background_color: BACKGROUND_COLOR,
        categories: ['games', 'entertainment'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache de TUDO que o jogo precisa para funcionar offline (inclusive a
        // arte carregada sob demanda e as fontes woff2 auto-hospedadas).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        // Ícones grandes só são usados pelo sistema na instalação: fora do precache.
        globIgnores: ['**/splash/**', '**/icons/icon-512.png', '**/icons/maskable-512.png'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            // Splash screens do iOS: só baixadas quando o iOS pede.
            urlPattern: ({ url }) => url.pathname.includes('/splash/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'splash',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts', 'apps-script/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: [
        'src/core/**',
        'src/state/**',
        'src/persistence/**',
        'src/progression/**',
        'src/catalog/**',
      ],
      exclude: ['**/*.test.ts', '**/index.ts'],
      reporter: ['text-summary', 'html'],
    },
  },
});
