import type { BrowserContext } from '@playwright/test';
import { createFakeAppsScript, post, type FakeEnv } from '../../apps-script/test/fake-apps-script';
import type { Session } from '../../src/core/account';

/** URL usada no build dos testes (ver playwright.config.ts). */
export const FAKE_SHEETS_URL = 'https://planilha.teste/exec';
export const FAKE_PIN = '246810';
export const SENHA = 'coroa123';

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

/** Cria uma conta direto na planilha falsa (como se tivesse sido criada antes). */
export function createAccount(
  env: FakeEnv,
  usuario: string,
  senha = SENHA,
  options: { legado?: boolean } = {},
): Session {
  const res = post(env, {
    action: 'signup',
    deviceId: 'setup',
    payload: { usuario, senha, convite: FAKE_PIN, legado: options.legado ?? false },
  }) as { ok: boolean; data?: Session };
  if (!res.ok || !res.data) throw new Error(`Não criou a conta de teste: ${JSON.stringify(res)}`);
  return res.data;
}

/** Deixa o aparelho já logado nessa conta (antes de o jogo carregar). */
export async function seedSession(context: BrowserContext, session: Session): Promise<void> {
  await context.addInitScript((value) => {
    if (!localStorage.getItem('castelo:sessao')) localStorage.setItem('castelo:sessao', value);
  }, JSON.stringify(session));
}
