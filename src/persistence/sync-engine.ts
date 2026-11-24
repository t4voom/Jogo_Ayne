import { createLogger, type Logger } from '../core/log';
import { FutureVersionError } from '../core/migrations';
import type { Room, RoomId } from '../core/model';
import { ROOM_IDS } from '../core/model';
import { mergeProfiles, type Profile } from '../core/profile';
import { serializeProfile, serializeRoom } from '../core/save';
import {
  ApiError,
  conflictProfile,
  conflictRoom,
  type RemotePhoto,
  type RemoteProfile,
  type RemoteRoom,
  type SheetsApi,
} from './sheets-api';
import { decodeProfile, decodeRoom, encodeProfile, encodeRoom } from './wire';

/**
 * Motor de sincronização offline-first.
 *
 *   mudança → IndexedDB (autosave) → marca "pendente" na fila persistente
 *           → espera ~3 s sem mudanças (ou o app ir para segundo plano)
 *           → envia SÓ o último estado de cada cômodo (respeita cotas)
 *
 * Falhas de rede ficam na fila com retry e backoff exponencial; ao voltar a
 * conexão (`online`) tudo é reenviado. Ao abrir, o remoto é buscado em
 * paralelo e reconciliado cômodo a cômodo pela revisão:
 *  - remoto mais novo e nada pendente aqui → aplica ("Atualizado do outro aparelho ✨")
 *  - os dois mudaram (conflito real) → fica o de `updatedAt` mais recente e o
 *    outro vira "versão anterior" restaurável. Nada é perdido.
 */

export type SyncStatus = 'disabled' | 'needs-pin' | 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncSnapshot {
  readonly status: SyncStatus;
  readonly pending: number;
  readonly lastSyncAt: number | null;
  readonly lastError: string | null;
}

export type OutboxKind = 'room' | 'profile' | 'photo' | 'deletePhoto';

export interface OutboxEntry {
  readonly key: string;
  readonly kind: OutboxKind;
  readonly id: string;
  readonly attempts: number;
  readonly nextAttemptAt: number;
  /** Momento em que ficou pendente (detecta mudanças durante o envio). */
  readonly dirtyAt: number;
}

export interface OutboxStore {
  list(): Promise<OutboxEntry[]>;
  put(entry: OutboxEntry): Promise<void>;
  remove(key: string): Promise<void>;
}

/** O que o motor precisa do resto do jogo (implementado em main.ts). */
export interface SyncHost {
  getRoom(roomId: RoomId): Room | undefined;
  applyRemoteRoom(room: Room): void;
  setRoomRevision(roomId: RoomId, revision: number): void;
  getProfile(): Profile;
  applyRemoteProfile(profile: Profile): void;
  starBalance(profile: Profile): number;
  backup(kind: 'room' | 'profile', key: string, data: unknown): Promise<void>;
  /** Um cômodo/perfil veio do outro aparelho. */
  remoteApplied(kind: 'room' | 'profile', id: string, reason: 'newer' | 'conflict'): void;
  /** Dados remotos de uma versão mais nova do app. */
  futureVersion(): void;
  getPhoto?(photoId: string): Promise<RemotePhoto | null>;
  applyRemotePhotos?(photos: RemotePhoto[]): void;
}

export interface SyncOptions {
  readonly debounceMs?: number;
  readonly now?: () => number;
  readonly random?: () => number;
  readonly logger?: Logger;
  readonly isOnline?: () => boolean;
}

const BACKOFF_BASE_MS = 2_000;
const BACKOFF_MAX_MS = 5 * 60_000;
const ERROR_AFTER_ATTEMPTS = 3;

export function backoffDelay(attempts: number, random: () => number = Math.random): number {
  const base = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempts - 1));
  return Math.round(base * (0.8 + random() * 0.4));
}

const isRoomId = (id: string): id is RoomId => (ROOM_IDS as readonly string[]).includes(id);

export class SyncEngine {
  private readonly entries = new Map<string, OutboxEntry>();
  private readonly listeners = new Set<(s: SyncSnapshot) => void>();
  private snapshot: SyncSnapshot;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running: Promise<void> | null = null;
  private again = false;
  private blocked: string | null = null;
  private failure: { kind: 'network' | 'error'; message: string } | null = null;
  private pulling = false;
  private started = false;
  private readonly debounceMs: number;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly log: Logger;
  private readonly isOnline: () => boolean;

  constructor(
    private readonly api: SheetsApi | null,
    private readonly host: SyncHost,
    private readonly outbox: OutboxStore,
    options: SyncOptions = {},
  ) {
    this.debounceMs = options.debounceMs ?? 3_000;
    this.now = options.now ?? Date.now;
    this.random = options.random ?? Math.random;
    this.log = options.logger ?? createLogger('sync');
    this.isOnline =
      options.isOnline ?? (() => (typeof navigator === 'undefined' ? true : navigator.onLine));
    this.snapshot = {
      status: api ? 'synced' : 'disabled',
      pending: 0,
      lastSyncAt: null,
      lastError: null,
    };
  }

  get enabled(): boolean {
    return this.api !== null;
  }

  get state(): SyncSnapshot {
    return this.snapshot;
  }

  subscribe(listener: (s: SyncSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  /** Carrega a fila salva, busca o remoto e envia o que estiver pendente. */
  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    // Reabrir o app é motivo para tentar tudo de novo na hora.
    for (const e of await this.outbox.list()) this.entries.set(e.key, { ...e, nextAttemptAt: 0 });
    this.refresh();
    if (!this.api) return;
    await this.pull();
    await this.flushNow();
  }

  // ------------------------------------------------------------ pendências

  markRoomDirty(roomId: RoomId): void {
    void this.mark('room', roomId);
  }

  markProfileDirty(): void {
    void this.mark('profile', 'main');
  }

  markPhotoDirty(photoId: string): void {
    void this.mark('photo', photoId);
  }

  markPhotoDeleted(photoId: string): void {
    this.entries.delete(`photo:${photoId}`);
    void this.outbox.remove(`photo:${photoId}`);
    void this.mark('deletePhoto', photoId);
  }

  private async mark(kind: OutboxKind, id: string): Promise<void> {
    const key = `${kind}:${id}`;
    const entry: OutboxEntry = {
      key,
      kind,
      id,
      attempts: 0,
      nextAttemptAt: 0,
      dirtyAt: this.now(),
    };
    this.entries.set(key, entry);
    this.refresh();
    try {
      await this.outbox.put(entry);
    } catch (error) {
      this.log.error('Não consegui gravar a fila de sincronização', error);
    }
    this.schedule(this.debounceMs);
  }

  // --------------------------------------------------------------- envio

  /** Envia agora (ex.: app indo para segundo plano). */
  async flushNow(options: { keepalive?: boolean } = {}): Promise<void> {
    if (!this.api || this.blocked) return;
    this.clearTimer();
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = this.flushLoop(options.keepalive ?? false);
    this.refresh();
    try {
      await this.running;
    } finally {
      this.running = null;
      this.refresh();
      this.scheduleRetry();
    }
    if (this.again) {
      this.again = false;
      await this.flushNow(options);
    }
  }

  /** A jogadora tocou em "tentar de novo" ou a internet voltou. */
  retryNow(): Promise<void> {
    for (const [key, e] of this.entries) this.entries.set(key, { ...e, nextAttemptAt: 0 });
    return this.flushNow();
  }

  /** O código do castelo mudou: libera o motor e sincroniza tudo. */
  async credentialsChanged(): Promise<void> {
    this.blocked = null;
    this.failure = null;
    this.refresh();
    await this.pull();
    await this.retryNow();
  }

  private async flushLoop(keepalive: boolean): Promise<void> {
    const due = [...this.entries.values()]
      .filter((e) => e.nextAttemptAt <= this.now())
      .sort(
        (a, b) =>
          (a.kind === 'profile' ? 1 : 0) - (b.kind === 'profile' ? 1 : 0) || a.dirtyAt - b.dirtyAt,
      );
    for (const entry of due) {
      if (this.blocked) break;
      try {
        await this.push(entry, keepalive);
      } catch (error) {
        if (!(await this.handleFailure(entry, error))) break;
      }
    }
  }

  private async push(entry: OutboxEntry, keepalive: boolean): Promise<void> {
    const api = this.api;
    if (!api) return;
    switch (entry.kind) {
      case 'room': {
        if (!isRoomId(entry.id)) return this.done(entry);
        const room = this.host.getRoom(entry.id);
        if (!room) return this.done(entry);
        try {
          const res = await api.saveRoom(
            {
              roomId: room.id,
              data: encodeRoom(room),
              updatedAt: room.updatedAt,
              baseRevision: room.revision,
            },
            keepalive,
          );
          this.host.setRoomRevision(room.id, res.revision);
          await this.done(entry);
          return;
        } catch (error) {
          const remote =
            error instanceof ApiError && error.code === 'conflict' ? conflictRoom(error) : null;
          if (!remote) throw error;
          return this.resolveRoomConflict(remote);
        }
      }
      case 'profile': {
        const profile = this.host.getProfile();
        try {
          const res = await api.saveProfile(
            {
              ...encodeProfile(profile, this.host.starBalance(profile)),
              updatedAt: profile.updatedAt,
              baseRevision: profile.revision,
            },
            keepalive,
          );
          this.host.applyRemoteProfile({ ...this.host.getProfile(), revision: res.revision });
          await this.done(entry);
          return;
        } catch (error) {
          const remote =
            error instanceof ApiError && error.code === 'conflict' ? conflictProfile(error) : null;
          if (!remote) throw error;
          this.mergeRemoteProfile(remote, 'conflict');
          // Continua pendente: o perfil mesclado sobe na próxima rodada.
          this.entries.set(entry.key, { ...entry, nextAttemptAt: 0 });
          this.again = true;
          return;
        }
      }
      case 'photo': {
        const photo = await this.host.getPhoto?.(entry.id);
        if (photo) await api.savePhoto(photo);
        return this.done(entry);
      }
      case 'deletePhoto':
        await api.deletePhoto(entry.id);
        return this.done(entry);
    }
  }

  /** Tira da fila — só se nada mudou enquanto o envio acontecia. */
  private async done(sent: OutboxEntry): Promise<void> {
    const current = this.entries.get(sent.key);
    if (current && current.dirtyAt !== sent.dirtyAt) return;
    this.entries.delete(sent.key);
    this.failure = null;
    this.setStatus({ lastSyncAt: this.now() });
    try {
      await this.outbox.remove(sent.key);
    } catch (error) {
      this.log.error('Não consegui limpar a fila de sincronização', error);
    }
  }

  /** Devolve false quando não adianta continuar a rodada. */
  private async handleFailure(entry: OutboxEntry, error: unknown): Promise<boolean> {
    const api = error instanceof ApiError ? error : new ApiError('server_error', String(error));
    if (api.code === 'unauthorized' || api.code === 'not_configured') {
      this.blocked = api.message;
      this.refresh();
      return false;
    }
    const attempts = entry.attempts + 1;
    const wait =
      api.retryAfter !== undefined ? api.retryAfter * 1000 : backoffDelay(attempts, this.random);
    const permanent = api.code === 'bad_request' || api.code === 'too_large';
    const next: OutboxEntry = {
      ...entry,
      attempts,
      nextAttemptAt: this.now() + (permanent ? 60 * 60_000 : wait),
    };
    const current = this.entries.get(entry.key);
    // Se mudou durante o envio, mantém a versão nova (tenta já na próxima rodada).
    if (current?.dirtyAt === entry.dirtyAt) {
      this.entries.set(entry.key, next);
      try {
        await this.outbox.put(next);
      } catch (e) {
        this.log.error('Não consegui atualizar a fila', e);
      }
    }
    if (api.code === 'network' || !this.isOnline()) {
      this.failure = { kind: 'network', message: api.message };
      this.refresh();
      return false;
    }
    this.log.warn(`Falha ao sincronizar ${entry.key} (${api.code})`, api.message);
    if (permanent || attempts >= ERROR_AFTER_ATTEMPTS || api.code === 'locked') {
      this.failure = { kind: 'error', message: api.message };
      this.refresh();
    }
    return !permanent ? api.code !== 'locked' && api.code !== 'busy' : true;
  }

  // -------------------------------------------------------------- busca

  /** Busca o remoto e reconcilia cômodo a cômodo. */
  async pull(): Promise<void> {
    if (!this.api || this.blocked) return;
    this.pulling = true;
    this.refresh();
    try {
      let result;
      try {
        result = await this.api.load();
      } catch (error) {
        const api = error instanceof ApiError ? error : new ApiError('server_error', String(error));
        if (api.code === 'unauthorized' || api.code === 'not_configured') {
          this.blocked = api.message;
        } else if (api.code === 'network' || !this.isOnline()) {
          this.failure = { kind: 'network', message: api.message };
        } else {
          this.log.warn('Falha ao buscar da planilha', api.message);
          this.failure = { kind: 'error', message: api.message };
        }
        return;
      }
      for (const remote of result.rooms) await this.reconcileRoom(remote);
      if (result.profile) this.mergeRemoteProfile(result.profile, 'newer');
      if (result.album.length > 0) this.host.applyRemotePhotos?.(result.album);
      this.failure = null;
      this.setStatus({ lastSyncAt: this.now() });
    } finally {
      this.pulling = false;
      this.refresh();
    }
  }

  private decode(remote: RemoteRoom): Room | null {
    try {
      return decodeRoom(remote.data, remote);
    } catch (error) {
      if (error instanceof FutureVersionError) this.host.futureVersion();
      else
        this.log.error(`Cômodo remoto ${remote.roomId} ilegível; mantendo o deste aparelho`, error);
      return null;
    }
  }

  private async reconcileRoom(remote: RemoteRoom): Promise<void> {
    if (!isRoomId(remote.roomId)) return;
    const local = this.host.getRoom(remote.roomId);
    const dirty = this.entries.has(`room:${remote.roomId}`);
    if (remote.revision === local?.revision) return;
    if (local && remote.revision < local.revision) {
      // A planilha ficou para trás (ex.: restaurada): reenvia o deste aparelho.
      this.markRoomDirty(local.id);
      return;
    }
    if (!local || !dirty) {
      const room = this.decode(remote);
      if (!room) return;
      this.host.applyRemoteRoom(room);
      if (local) this.host.remoteApplied('room', room.id, 'newer');
      return;
    }
    await this.resolveRoomConflict(remote);
  }

  /** Os dois aparelhos mudaram o mesmo cômodo: fica o mais recente. */
  private async resolveRoomConflict(remote: RemoteRoom): Promise<void> {
    if (!isRoomId(remote.roomId)) return;
    const local = this.host.getRoom(remote.roomId);
    const theirs = this.decode(remote);
    if (!theirs) return;
    const key = `room:${remote.roomId}`;
    if (!local || theirs.updatedAt > local.updatedAt) {
      if (local) await this.host.backup('room', local.id, serializeRoom(local));
      this.entries.delete(key);
      await this.outbox.remove(key).catch((e: unknown) => {
        this.log.error('Fila', e);
      });
      this.host.applyRemoteRoom(theirs);
      this.host.remoteApplied('room', theirs.id, 'conflict');
    } else {
      await this.host.backup('room', theirs.id, serializeRoom(theirs));
      // Passa a se basear na revisão do servidor; o nosso sobe na próxima rodada.
      this.host.setRoomRevision(local.id, remote.revision);
      const entry = this.entries.get(key);
      this.entries.set(key, {
        key,
        kind: 'room',
        id: local.id,
        attempts: 0,
        nextAttemptAt: 0,
        dirtyAt: entry?.dirtyAt ?? this.now(),
      });
      this.again = true;
    }
  }

  private mergeRemoteProfile(remote: RemoteProfile, reason: 'newer' | 'conflict'): void {
    let theirs: Profile;
    try {
      theirs = decodeProfile(remote, remote);
    } catch (error) {
      if (error instanceof FutureVersionError) this.host.futureVersion();
      else this.log.error('Perfil remoto ilegível; mantendo o deste aparelho', error);
      return;
    }
    const local = this.host.getProfile();
    if (remote.revision <= local.revision && reason === 'newer') return;
    const dirty = this.entries.has('profile:main');
    if (!dirty && remote.updatedAt >= local.updatedAt) {
      this.host.applyRemoteProfile(theirs);
      this.host.remoteApplied('profile', 'main', 'newer');
      return;
    }
    void this.host.backup('profile', 'main', serializeProfile(theirs));
    this.host.applyRemoteProfile(mergeProfiles(local, theirs));
    if (!dirty) this.markProfileDirty();
  }

  // ------------------------------------------------------------ agenda

  private schedule(ms: number): void {
    if (!this.api || this.blocked) return;
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flushNow();
    }, ms);
    this.refresh();
  }

  private scheduleRetry(): void {
    if (this.entries.size === 0 || this.blocked) return;
    const next = Math.min(...[...this.entries.values()].map((e) => e.nextAttemptAt));
    this.schedule(Math.max(this.debounceMs, next - this.now()));
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  dispose(): void {
    this.clearTimer();
  }

  // ------------------------------------------------------------ status

  private refresh(): void {
    const pending = this.entries.size;
    let status: SyncStatus;
    if (!this.api) status = 'disabled';
    else if (this.blocked !== null) status = 'needs-pin';
    else if (this.running || this.pulling) status = 'syncing';
    else if (this.failure?.kind === 'network') status = 'offline';
    else if (this.failure?.kind === 'error') status = 'error';
    else if (pending > 0) status = 'syncing';
    else status = 'synced';
    this.setStatus({ status, pending, lastError: this.blocked ?? this.failure?.message ?? null });
  }

  private setStatus(patch: Partial<SyncSnapshot>): void {
    const next = { ...this.snapshot, ...patch, pending: patch.pending ?? this.entries.size };
    if (
      next.status === this.snapshot.status &&
      next.pending === this.snapshot.pending &&
      next.lastSyncAt === this.snapshot.lastSyncAt &&
      next.lastError === this.snapshot.lastError
    ) {
      return;
    }
    this.snapshot = next;
    for (const l of this.listeners) l(next);
  }
}
