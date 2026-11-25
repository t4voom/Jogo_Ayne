// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { deviceStore, sessionStore } from './session-store';

const session = {
  accountId: 'c1',
  usuario: 'ayne',
  nome: 'Ayne',
  token: 'c1.1.5.' + 'A'.repeat(44),
};

describe('sessão no aparelho', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda, lê e apaga', () => {
    expect(sessionStore.load()).toBeNull();
    sessionStore.save(session);
    expect(sessionStore.load()).toEqual(session);
    sessionStore.clear();
    expect(sessionStore.load()).toBeNull();
  });

  it('sessão estragada vira "sem sessão"', () => {
    localStorage.setItem('castelo:sessao', '{"accountId":"../x"}');
    expect(sessionStore.load()).toBeNull();
    localStorage.setItem('castelo:sessao', 'não é json');
    expect(sessionStore.load()).toBeNull();
  });

  it('identificador do aparelho', () => {
    expect(deviceStore.get()).toBeNull();
    deviceStore.set('tablet_01');
    expect(deviceStore.get()).toBe('tablet_01');
    localStorage.setItem('castelo:aparelho', 'com espaço');
    expect(deviceStore.get()).toBeNull();
  });
});
