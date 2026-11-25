/**
 * Contas do castelo: cada pessoa entra com usuário e senha e tem o próprio
 * castelo (cômodos, estrelinhas, álbum). Regras puras, iguais às do Code.gs.
 */

/** Sessão guardada no aparelho depois de entrar. */
export interface Session {
  /** Identificador da conta na planilha (perfil dos dados). */
  readonly accountId: string;
  /** Nome de usuário normalizado (minúsculas, sem acentos). */
  readonly usuario: string;
  /** Nome como a pessoa digitou no cadastro (para mostrar). */
  readonly nome: string;
  /** Token assinado pelo servidor. */
  readonly token: string;
}

/** O castelo salvo antes das contas existirem pertencia a este perfil. */
export const LEGACY_ACCOUNT_ID = 'ayne';

export const USER_MIN = 3;
export const USER_MAX = 20;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 64;

const USER_RE = /^[a-z0-9._-]{3,20}$/;

/** "Ayne", " AYNÉ " → "ayne" (igual ao servidor). */
export function normalizeUser(name: string): string {
  return name.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Mensagem de erro do nome de usuário, ou null se estiver ok. */
export function userNameProblem(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < USER_MIN)
    return `O nome de usuário precisa ter pelo menos ${USER_MIN} letras.`;
  if (trimmed.length > USER_MAX) return `O nome de usuário pode ter no máximo ${USER_MAX} letras.`;
  if (/\s/.test(trimmed)) return 'O nome de usuário não pode ter espaços.';
  if (!USER_RE.test(normalizeUser(trimmed)))
    return 'Use só letras, números, ponto, hífen ou sublinhado.';
  return null;
}

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN)
    return `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`;
  if (password.length > PASSWORD_MAX)
    return `A senha pode ter no máximo ${PASSWORD_MAX} caracteres.`;
  return null;
}

/** É a conta da Ayne (a que recebe a carta e as mensagens carinhosas)? */
export function isAyneAccount(session: Pick<Session, 'usuario'>, contaDaAyne: string): boolean {
  return session.usuario === normalizeUser(contaDaAyne);
}

/**
 * Nome do banco local (IndexedDB) de cada conta. A conta que herdou o castelo
 * de antes das contas continua usando o banco antigo — nada se perde.
 */
export function localDbName(accountId: string): string {
  return accountId === LEGACY_ACCOUNT_ID ? 'castelo-da-ayne' : `castelo-da-ayne--${accountId}`;
}
