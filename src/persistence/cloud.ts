import type { Session } from '../core/account';
import { createLogger } from '../core/log';
import { ApiError, SheetsApi, type Credentials, type Transport } from './sheets-api';
import type { SyncEngine } from './sync-engine';

const log = createLogger('cloud');

export type AuthResult =
  | { readonly ok: true; readonly session: Session }
  | { readonly ok: false; readonly message: string };

/** Onde a sessão fica guardada (localStorage no app; memória nos testes). */
export interface SessionPort {
  save(session: Session): boolean;
  clear(): void;
}

/**
 * Fachada da "nuvem" para a interface: a conta logada neste aparelho, trocar
 * a senha, sair e o motor de sync. A senha nunca fica guardada: só o token
 * assinado pela planilha.
 */
export class Cloud {
  private current: Session | null;

  constructor(
    readonly engine: SyncEngine,
    private readonly transport: Transport | null,
    readonly deviceId: string,
    session: Session | null,
    private readonly sessions: SessionPort,
  ) {
    this.current = session;
  }

  /** Monta o motor já ligado às credenciais desta nuvem. */
  static create(
    engineFactory: (credentials: () => Credentials | null) => SyncEngine,
    transport: Transport | null,
    deviceId: string,
    session: Session | null,
    sessions: SessionPort,
  ): Cloud {
    const holder: { cloud: Cloud | null } = { cloud: null };
    const engine = engineFactory(() => {
      const s = holder.cloud?.current;
      return s ? { token: s.token, deviceId } : null;
    });
    const cloud = new Cloud(engine, transport, deviceId, session, sessions);
    holder.cloud = cloud;
    return cloud;
  }

  /** Há planilha configurada (VITE_SHEETS_API_URL)? */
  get enabled(): boolean {
    return this.transport !== null;
  }

  /** Quem está jogando (null sem planilha configurada). */
  get session(): Session | null {
    return this.current;
  }

  async changePassword(current: string, next: string): Promise<AuthResult> {
    const session = this.current;
    if (!this.transport || !session) {
      return { ok: false, message: 'A sincronização não está ligada neste aparelho.' };
    }
    const api = new SheetsApi(this.transport, () => ({
      token: session.token,
      deviceId: this.deviceId,
    }));
    try {
      const updated = await api.changePassword(current, next);
      this.current = updated;
      this.sessions.save(updated);
      void this.engine.credentialsChanged();
      return { ok: true, session: updated };
    } catch (error) {
      return { ok: false, message: authMessage(error) };
    }
  }

  /** Sai da conta neste aparelho (o castelo continua guardado aqui e na planilha). */
  logout(): void {
    this.current = null;
    this.sessions.clear();
  }
}

/** Erro de entrar/criar conta/trocar senha em português de gente. */
export function authMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    log.error('Falha inesperada na conta', error);
    return 'Algo deu errado. Tente de novo.';
  }
  switch (error.code) {
    case 'network':
    case 'http':
      return 'Sem conexão com a planilha. Confira a internet e tente de novo.';
    case 'locked':
      return `Muitas tentativas. Espere ${Math.ceil((error.retryAfter ?? 900) / 60)} minutinhos e tente de novo.`;
    case 'not_configured':
      return 'O código de convite ainda não foi definido na planilha (veja o passo a passo do Gustavo).';
    case 'invalid_response':
      return 'A planilha não respondeu direito. Confira a URL publicada.';
    case 'bad_request':
      // Planilha com o Code.gs antigo (antes das contas) ainda pede o PIN.
      return /pin/i.test(error.message)
        ? 'A planilha está com a versão antiga do script. Atualize o Code.gs (veja o passo a passo).'
        : error.message;
    case 'upgrade_required':
    case 'unauthorized':
    case 'wrong_password':
    case 'taken':
    case 'conflict':
    case 'busy':
    case 'too_large':
    case 'server_error':
      return error.message || 'Não consegui falar com a planilha.';
  }
}
