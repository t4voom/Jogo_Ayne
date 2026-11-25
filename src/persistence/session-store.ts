import * as z from 'zod/mini';
import type { Session } from '../core/account';
import { createLogger } from '../core/log';

const log = createLogger('sessao');

const SESSION_KEY = 'castelo:sessao';
const DEVICE_KEY = 'castelo:aparelho';

const ID = z.string().check(z.regex(/^[A-Za-z0-9_-]{1,64}$/));

const SessionSchema = z.object({
  accountId: ID,
  usuario: z.string().check(z.minLength(1), z.maxLength(40)),
  nome: z.string().check(z.minLength(1), z.maxLength(40)),
  token: z.string().check(z.minLength(20), z.maxLength(300)),
});

/** Acesso ao localStorage que nunca lança (aba anônima, armazenamento bloqueado…). */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): boolean {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return true;
  } catch (error) {
    log.warn(`Não consegui gravar "${key}" no aparelho`, error);
    return false;
  }
}

/**
 * Quem está jogando neste aparelho. Fica no localStorage (síncrono, lido antes
 * de abrir o banco da conta) e é validado ao ler.
 */
export const sessionStore = {
  load(): Session | null {
    const raw = read(SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = SessionSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
    } catch {
      // texto estragado: trata como sem sessão
    }
    log.warn('Sessão guardada ilegível; pedindo para entrar de novo');
    write(SESSION_KEY, null);
    return null;
  },
  save(session: Session): boolean {
    return write(SESSION_KEY, JSON.stringify(session));
  },
  clear(): void {
    write(SESSION_KEY, null);
  },
};

/** Identificador deste aparelho (o mesmo para todas as contas). */
export const deviceStore = {
  get(): string | null {
    const id = read(DEVICE_KEY);
    return id && ID.safeParse(id).success ? id : null;
  },
  set(id: string): void {
    write(DEVICE_KEY, id);
  },
};
