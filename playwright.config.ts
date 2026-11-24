import { defineConfig, devices } from '@playwright/test';

/**
 * E2E em dois aparelhos-alvo: iPhone 14 (Safari) e Galaxy Tab S9 (Chrome).
 *
 * No CI o iPhone roda no WebKit (motor do Safari). Em ambientes sem WebKit
 * instalado, defina E2E_WEBKIT=0 para emular o iPhone no Chromium.
 */
const useWebkit = process.env.E2E_WEBKIT !== '0';
const port = 4173;
const base = '/Jogo_Ayne/';

export default defineConfig({
  testDir: './tests/e2e',
  // Prints para conferência visual só rodam com VISUAL=1.
  testIgnore: process.env.VISUAL ? [] : ['**/*.visual.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: `http://localhost:${port}${base}`,
    trace: 'off',
    screenshot: 'only-on-failure',
    serviceWorkers: 'allow',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    {
      name: 'iphone-14',
      use: useWebkit
        ? { ...devices['iPhone 14'] }
        : { ...devices['iPhone 14'], browserName: 'chromium', defaultBrowserType: 'chromium' },
    },
    {
      name: 'galaxy-tab',
      use: { ...devices['Galaxy Tab S9 landscape'] },
    },
  ],
  webServer: {
    // Os e2e usam uma "planilha" falsa (tests/e2e/fake-sheets.ts) nesta URL.
    command: process.env.E2E_SKIP_BUILD
      ? `npx vite preview --outDir dist-e2e --port ${port} --strictPort`
      : `npm run build -- --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${port} --strictPort`,
    env: { VITE_SHEETS_API_URL: 'https://planilha.teste/exec' },
    url: `http://localhost:${port}${base}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
