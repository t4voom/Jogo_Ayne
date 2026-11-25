import { test as base, expect } from '@playwright/test';
import type { FakeEnv } from '../../apps-script/test/fake-apps-script';
import {
  connectFakeSheets,
  createAccount,
  seedSession,
  SENHA,
  type FakeNetwork,
} from './fake-sheets';

interface Fixtures {
  /** Liga/desliga a "internet" da planilha falsa. */
  network: FakeNetwork;
  /** Planilha falsa (Code.gs de verdade) ligada ao contexto do teste. */
  backend: FakeEnv;
}

interface Options {
  /** true: o aparelho já entra na conta da Ayne; false: começa na tela de entrar. */
  loggedIn: boolean;
}

/**
 * `test` dos e2e: todo teste tem a sua planilha falsa e, por padrão, já está
 * logado na conta da Ayne (a maioria dos testes é sobre o jogo, não o login).
 */
export const test = base.extend<Fixtures & Options>({
  loggedIn: [true, { option: true }],
  // eslint-disable-next-line no-empty-pattern
  network: async ({}, use) => {
    await use({ offline: false });
  },
  backend: [
    async ({ context, loggedIn, network }, use) => {
      const env = await connectFakeSheets(context, undefined, network);
      if (loggedIn) await seedSession(context, createAccount(env, 'Ayne', SENHA, { legado: true }));
      await use(env);
    },
    { auto: true },
  ],
});

export { expect };
