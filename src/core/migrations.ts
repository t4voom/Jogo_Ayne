/**
 * Migrações de versão dos dados salvos.
 *
 * Todo registro persistido (cômodo, perfil) carrega `schemaVersion`. Ao ler,
 * aplicamos as migrações em sequência até a versão atual e só então validamos
 * com zod. Registros sem `schemaVersion` são tratados como versão 0.
 *
 * Um registro de versão MAIOR que a suportada (ex.: o tablet atualizou e o
 * celular ainda não) nunca é rebaixado nem sobrescrito: lançamos
 * `FutureVersionError` para quem chamou decidir (normalmente: pedir para
 * atualizar o app e manter a cópia local).
 */

export type Json = Record<string, unknown>;

export interface Migration {
  readonly from: number;
  readonly to: number;
  readonly description: string;
  up(data: Json): Json;
}

export class MigrationError extends Error {
  override readonly name = 'MigrationError';
}

export class FutureVersionError extends Error {
  override readonly name = 'FutureVersionError';
  constructor(
    readonly found: number,
    readonly supported: number,
  ) {
    super(`Dados na versão ${found}, mas este app só entende até a ${supported}`);
  }
}

function isJson(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function versionOf(raw: unknown): number {
  if (!isJson(raw)) throw new MigrationError('Registro salvo não é um objeto');
  const v = raw['schemaVersion'];
  if (v === undefined) return 0;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
    throw new MigrationError(`schemaVersion inválida: ${JSON.stringify(v)}`);
  }
  return v;
}

/**
 * Leva `raw` até `target` aplicando `migrations`. Devolve uma cópia (nunca
 * muta a entrada) já com `schemaVersion = target`.
 */
export function migrate(raw: unknown, migrations: readonly Migration[], target: number): Json {
  let version = versionOf(raw);
  if (version > target) throw new FutureVersionError(version, target);
  let data: Json = structuredClone(raw as Json);
  while (version < target) {
    const step = migrations.find((m) => m.from === version);
    if (!step) throw new MigrationError(`Falta migração a partir da versão ${version}`);
    if (step.to <= step.from) throw new MigrationError(`Migração ${step.from}→${step.to} inválida`);
    data = step.up(data);
    version = step.to;
    data['schemaVersion'] = version;
  }
  data['schemaVersion'] = target;
  return data;
}

/** Verifica a cadeia: começa em 0 (ou 1) e chega a `target` sem buracos. */
export function assertMigrationChain(
  migrations: readonly Migration[],
  firstVersion: number,
  target: number,
): void {
  let v = firstVersion;
  while (v < target) {
    const step = migrations.find((m) => m.from === v);
    if (!step) throw new MigrationError(`Cadeia de migrações quebrada na versão ${v}`);
    v = step.to;
  }
  if (v !== target) throw new MigrationError(`Cadeia termina em ${v}, esperado ${target}`);
}
