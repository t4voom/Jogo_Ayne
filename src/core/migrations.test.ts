import { describe, expect, it } from 'vitest';
import {
  FutureVersionError,
  MigrationError,
  assertMigrationChain,
  migrate,
  versionOf,
  type Migration,
} from './migrations';

const chain: Migration[] = [
  {
    from: 0,
    to: 1,
    description: 'renomeia nome → title',
    up: ({ nome, ...rest }) => ({ ...rest, title: nome }),
  },
  {
    from: 1,
    to: 2,
    description: 'adiciona tags',
    up: (d) => ({ ...d, tags: [] }),
  },
];

describe('migrate', () => {
  it('trata registro sem schemaVersion como versão 0 e migra em sequência', () => {
    const raw = { nome: 'Quarto' };
    const out = migrate(raw, chain, 2);
    expect(out).toEqual({ title: 'Quarto', tags: [], schemaVersion: 2 });
    expect(raw).toEqual({ nome: 'Quarto' }); // não muta a entrada
  });

  it('não faz nada quando já está na versão alvo', () => {
    expect(migrate({ schemaVersion: 2, title: 'x', tags: [1] }, chain, 2)).toEqual({
      schemaVersion: 2,
      title: 'x',
      tags: [1],
    });
  });

  it('recusa rebaixar dados de uma versão futura', () => {
    expect(() => migrate({ schemaVersion: 3 }, chain, 2)).toThrow(FutureVersionError);
  });

  it('falha claramente com buraco na cadeia', () => {
    expect(() => migrate({ schemaVersion: 0 }, [chain[1]!], 2)).toThrow(MigrationError);
  });

  it('valida schemaVersion', () => {
    expect(() => versionOf(null)).toThrow(MigrationError);
    expect(() => versionOf([])).toThrow(MigrationError);
    expect(() => versionOf({ schemaVersion: -1 })).toThrow(MigrationError);
    expect(() => versionOf({ schemaVersion: '2' })).toThrow(MigrationError);
    expect(versionOf({ schemaVersion: 4 })).toBe(4);
  });
});

describe('assertMigrationChain', () => {
  it('aceita cadeia completa', () => {
    expect(() => assertMigrationChain(chain, 0, 2)).not.toThrow();
  });
  it('detecta cadeia quebrada', () => {
    expect(() => assertMigrationChain([chain[0]!], 0, 2)).toThrow(MigrationError);
  });
});
