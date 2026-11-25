import { describe, expect, it } from 'vitest';
import {
  isAyneAccount,
  localDbName,
  normalizeUser,
  passwordProblem,
  userNameProblem,
} from './account';

describe('contas', () => {
  it('normaliza o usuário como o servidor', () => {
    expect(normalizeUser('  AYNÉ ')).toBe('ayne');
    expect(normalizeUser('Gustavo.M')).toBe('gustavo.m');
  });

  it('valida nome de usuário e senha', () => {
    expect(userNameProblem('Ayne')).toBeNull();
    expect(userNameProblem('Aynê_01')).toBeNull();
    expect(userNameProblem('ab')).toMatch(/pelo menos 3/);
    expect(userNameProblem('ayne brenda')).toMatch(/espaços/);
    expect(userNameProblem('ayne!')).toMatch(/letras, números/);
    expect(userNameProblem('a'.repeat(21))).toMatch(/no máximo/);
    expect(passwordProblem('12345')).toMatch(/pelo menos 6/);
    expect(passwordProblem('123456')).toBeNull();
  });

  it('reconhece a conta da Ayne sem ligar para maiúsculas e acentos', () => {
    expect(isAyneAccount({ usuario: 'ayne' }, 'Ayne')).toBe(true);
    expect(isAyneAccount({ usuario: 'gustavo' }, 'ayne')).toBe(false);
  });

  it('a conta herdeira usa o banco local antigo', () => {
    expect(localDbName('ayne')).toBe('castelo-da-ayne');
    expect(localDbName('c123')).toBe('castelo-da-ayne--c123');
  });
});
