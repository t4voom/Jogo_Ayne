import * as z from 'zod/mini';
import { createLogger } from '../core/log';
import type { LocalRepository } from './local-repository';
import { ApiError, SheetsApi, type Transport } from './sheets-api';
import type { SyncEngine } from './sync-engine';

const log = createLogger('cloud');

export type PinResult =
  | { readonly ok: true; readonly offline: boolean }
  | { readonly ok: false; readonly message: string };

/**
 * Fachada da "nuvem" para a interface: código do castelo (PIN), pular, trocar
 * e o motor de sync. O PIN fica só no aparelho (IndexedDB) e na planilha
 * (Script Properties) — nunca no repositório.
 */
export class Cloud {
  private pin: string | null;
  private skipped: boolean;

  private constructor(
    readonly engine: SyncEngine,
    private readonly repo: LocalRepository | null,
    private readonly transport: Transport | null,
    readonly deviceId: string,
    state: { pin: string | null; skipped: boolean },
  ) {
    this.pin = state.pin;
    this.skipped = state.skipped;
  }

  static async load(
    engineFactory: (credentials: () => { pin: string; deviceId: string } | null) => SyncEngine,
    repo: LocalRepository | null,
    transport: Transport | null,
    newId: () => string,
  ): Promise<Cloud> {
    let deviceId = repo
      ? await repo.getMeta('deviceId', z.string().check(z.regex(/^[A-Za-z0-9_-]{1,64}$/)))
      : undefined;
    if (!deviceId) {
      deviceId = newId();
      await repo?.setMeta('deviceId', deviceId);
    }
    const pin =
      (repo
        ? await repo.getMeta('pin', z.string().check(z.minLength(1), z.maxLength(64)))
        : undefined) ?? null;
    const skipped = (repo ? await repo.getMeta('pinSkipped', z.boolean()) : undefined) ?? false;
    const holder: { cloud: Cloud | null } = { cloud: null };
    const id = deviceId;
    const engine = engineFactory(() => {
      const p = holder.cloud?.pin;
      return p ? { pin: p, deviceId: id } : null;
    });
    const cloud = new Cloud(engine, repo, transport, deviceId, { pin, skipped });
    holder.cloud = cloud;
    return cloud;
  }

  /** Há planilha configurada (VITE_SHEETS_API_URL)? */
  get enabled(): boolean {
    return this.transport !== null;
  }

  get hasPin(): boolean {
    return this.pin !== null;
  }

  /** Deve mostrar a tela "Digite o código do castelo"? */
  get shouldAskPin(): boolean {
    return this.enabled && this.pin === null && !this.skipped;
  }

  /** Confere o código com a planilha e, se der certo, guarda e sincroniza. */
  async submitPin(candidate: string): Promise<PinResult> {
    const pin = candidate.trim();
    if (!this.transport) return { ok: false, message: 'A sincronização não está configurada.' };
    if (pin.length < 4) return { ok: false, message: 'O código tem pelo menos 4 números.' };
    const probe = new SheetsApi(this.transport, () => ({ pin, deviceId: this.deviceId }));
    let offline = false;
    try {
      await probe.load();
    } catch (error) {
      if (error instanceof ApiError && (error.code === 'network' || error.code === 'http')) {
        // Sem internet agora: guarda e confere quando a conexão voltar.
        offline = true;
      } else if (error instanceof ApiError) {
        return { ok: false, message: friendly(error) };
      } else {
        log.error('Falha inesperada ao conferir o código', error);
        return { ok: false, message: 'Algo deu errado. Tente de novo.' };
      }
    }
    this.pin = pin;
    this.skipped = false;
    await this.repo?.setMeta('pin', pin);
    await this.repo?.setMeta('pinSkipped', false);
    void this.engine.credentialsChanged();
    return { ok: true, offline };
  }

  async skip(): Promise<void> {
    this.skipped = true;
    await this.repo?.setMeta('pinSkipped', true);
  }

  async forgetPin(): Promise<void> {
    this.pin = null;
    await this.repo?.deleteMeta('pin');
  }
}

function friendly(error: ApiError): string {
  switch (error.code) {
    case 'unauthorized':
      return error.message || 'Código incorreto.';
    case 'locked':
      return `Muitas tentativas. Espere ${Math.ceil((error.retryAfter ?? 900) / 60)} minutinhos e tente de novo.`;
    case 'not_configured':
      return 'O código ainda não foi definido na planilha (veja o passo a passo do Gustavo).';
    case 'invalid_response':
      return 'A planilha não respondeu direito. Confira a URL publicada.';
    default:
      return error.message || 'Não consegui falar com a planilha.';
  }
}
