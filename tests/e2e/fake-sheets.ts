import type { BrowserContext } from '@playwright/test';
import { createFakeAppsScript, type FakeEnv } from '../../apps-script/test/fake-apps-script';

/** URL usada no build dos testes (ver playwright.config.ts). */
export const FAKE_SHEETS_URL = 'https://planilha.teste/exec';
export const FAKE_PIN = '246810';

/**
 * "Planilha" de mentira para os e2e: intercepta as chamadas do jogo e
 * responde com o Code.gs DE VERDADE rodando no Node.
 */
export interface FakeNetwork {
  offline: boolean;
}

export async function connectFakeSheets(
  context: BrowserContext,
  env?: FakeEnv,
  network: FakeNetwork = { offline: false },
): Promise<FakeEnv> {
  const server = env ?? createFakeAppsScript({ pin: FAKE_PIN });
  await context.route(`${FAKE_SHEETS_URL}**`, async (route) => {
    // A interceptação passa por cima do modo offline do navegador: simulamos aqui.
    if (network.offline) {
      await route.abort('internetdisconnected');
      return;
    }
    const req = route.request();
    let body: string;
    if (req.method() === 'POST') {
      body = server.gs.doPost({ postData: { contents: req.postData() ?? '' } }).getContent();
    } else {
      const action = new URL(req.url()).searchParams.get('action') ?? '';
      body = server.gs.doGet({ parameter: { action } }).getContent();
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body,
    });
  });
  return server;
}
