import { createLogger, type Logger } from '../core/log';
import type { Room, RoomId } from '../core/model';
import type { Profile } from '../core/profile';

export interface AutosaveTarget {
  saveRoom(room: Room): Promise<void>;
  saveProfile(profile: Profile): Promise<void>;
}

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'error';

export interface AutosaveOptions {
  /** Espera após a última mudança antes de gravar (agrupa rajadas). */
  readonly delayMs?: number;
  readonly retryMs?: number;
  readonly logger?: Logger;
  readonly onStatus?: (status: AutosaveStatus) => void;
  /** Chamado após gravar com sucesso (o sync usa para marcar pendências). */
  readonly onRoomSaved?: (room: Room) => void;
  readonly onProfileSaved?: (profile: Profile) => void;
}

/**
 * Grava no IndexedDB logo depois de cada mudança, agrupando rajadas e
 * guardando apenas o ÚLTIMO estado de cada cômodo. Falhas não perdem nada: o
 * estado pendente continua na fila e é regravado depois.
 */
export class Autosaver {
  private readonly rooms = new Map<RoomId, Room>();
  private profileState: Profile | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running: Promise<void> | null = null;
  private status: AutosaveStatus = 'idle';
  private readonly delayMs: number;
  private readonly retryMs: number;
  private readonly log: Logger;

  constructor(
    private readonly target: AutosaveTarget,
    private readonly options: AutosaveOptions = {},
  ) {
    this.delayMs = options.delayMs ?? 250;
    this.retryMs = options.retryMs ?? 3000;
    this.log = options.logger ?? createLogger('autosave');
  }

  get pending(): boolean {
    return this.rooms.size > 0 || this.profileState !== null;
  }

  room(room: Room): void {
    this.rooms.set(room.id, room);
    this.schedule(this.delayMs);
  }

  profile(profile: Profile): void {
    this.profileState = profile;
    this.schedule(this.delayMs);
  }

  /** Grava tudo agora (ex.: app indo para segundo plano). */
  async flush(): Promise<void> {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.running) await this.running;
    if (!this.pending) return;
    this.running = this.writeAll();
    try {
      await this.running;
    } finally {
      this.running = null;
    }
  }

  dispose(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule(ms: number): void {
    this.setStatus('pending');
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, ms);
  }

  private async writeAll(): Promise<void> {
    this.setStatus('saving');
    const rooms = [...this.rooms.values()];
    const profile = this.profileState;
    this.rooms.clear();
    this.profileState = null;
    let failed = false;

    for (const room of rooms) {
      try {
        await this.target.saveRoom(room);
        this.options.onRoomSaved?.(room);
      } catch (error) {
        failed = true;
        this.log.error(`Falha ao salvar o cômodo ${room.id} no aparelho`, error);
        // Só volta para a fila se nada mais novo chegou nesse meio-tempo.
        if (!this.rooms.has(room.id)) this.rooms.set(room.id, room);
      }
    }
    if (profile) {
      try {
        await this.target.saveProfile(profile);
        this.options.onProfileSaved?.(profile);
      } catch (error) {
        failed = true;
        this.log.error('Falha ao salvar o perfil no aparelho', error);
        this.profileState ??= profile;
      }
    }

    if (failed) {
      this.setStatus('error');
      this.schedule(this.retryMs);
    } else if (this.pending) {
      this.schedule(this.delayMs);
    } else {
      this.setStatus('idle');
    }
  }

  private setStatus(status: AutosaveStatus): void {
    if (this.status === status) return;
    // 'error' só é limpo por um salvamento bem-sucedido.
    if (this.status === 'error' && status === 'pending') return;
    this.status = status;
    this.options.onStatus?.(status);
  }
}
