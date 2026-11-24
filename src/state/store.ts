import { createLogger, type Logger } from '../core/log';
import type { Room, RoomId } from '../core/model';
import type { Profile } from '../core/profile';
import { HISTORY_LIMIT, findItem } from '../core/rules';
import type { Command } from './commands';
import { History } from './history';

/**
 * Store central: a ÚNICA fonte da verdade do jogo. Mudanças entram por:
 *  - `execute(command)`  → alteração da jogadora (vai para o desfazer)
 *  - `undo` / `redo`
 *  - `replaceRoom`       → carga local ou atualização vinda do outro aparelho
 *  - `updateProfile`     → configurações/progresso
 *  - `select`            → seleção (efêmera, não salva)
 *
 * Cada mudança emite um evento tipado; render, persistência e progressão
 * reagem a eles. Ninguém muta o estado por fora.
 */

export type ChangeSource = 'user' | 'undo' | 'redo' | 'load' | 'remote' | 'restore';

export interface Selection {
  readonly roomId: RoomId;
  readonly uid: string;
}

export interface GameState {
  readonly rooms: Readonly<Partial<Record<RoomId, Room>>>;
  readonly profile: Profile;
  readonly selection: Selection | null;
}

export type StoreEvent =
  | {
      readonly type: 'room';
      readonly roomId: RoomId;
      readonly prev: Room | undefined;
      readonly next: Room;
      readonly source: ChangeSource;
      /** Command que gerou a mudança (user/undo/redo). */
      readonly command?: Command;
    }
  | {
      readonly type: 'profile';
      readonly prev: Profile;
      readonly next: Profile;
      readonly source: ChangeSource;
    }
  | { readonly type: 'selection'; readonly prev: Selection | null; readonly next: Selection | null }
  | {
      readonly type: 'history';
      readonly roomId: RoomId;
      readonly canUndo: boolean;
      readonly canRedo: boolean;
    };

export type StoreListener = (event: StoreEvent, state: GameState) => void;

export interface StoreOptions {
  readonly now?: () => number;
  readonly historyLimit?: number;
  readonly logger?: Logger;
}

export class Store {
  private state: GameState;
  private readonly listeners = new Set<StoreListener>();
  private readonly histories = new Map<RoomId, History>();
  private readonly now: () => number;
  private readonly historyLimit: number;
  private readonly log: Logger;

  constructor(initial: GameState, options: StoreOptions = {}) {
    this.state = initial;
    this.now = options.now ?? Date.now;
    this.historyLimit = options.historyLimit ?? HISTORY_LIMIT;
    this.log = options.logger ?? createLogger('store');
  }

  getState(): GameState {
    return this.state;
  }

  getRoom(roomId: RoomId): Room | undefined {
    return this.state.rooms[roomId];
  }

  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ---------------------------------------------------------------- commands

  /** Aplica um command da jogadora. Devolve false se nada mudou. */
  execute(command: Command): boolean {
    const changed = this.applyCommand(command, 'apply', 'user');
    if (!changed) return false;
    this.history(command.roomId).push(command);
    this.emitHistory(command.roomId);
    return true;
  }

  undo(roomId: RoomId): boolean {
    const h = this.history(roomId);
    const cmd = h.popUndo();
    if (!cmd) return false;
    const changed = this.applyCommand(cmd, 'revert', 'undo');
    if (!changed) {
      // O alvo sumiu (ex.: atualização remota); descarta e tenta o próximo.
      h.dropLastRedo();
      this.emitHistory(roomId);
      return this.undo(roomId);
    }
    this.emitHistory(roomId);
    return true;
  }

  redo(roomId: RoomId): boolean {
    const h = this.history(roomId);
    const cmd = h.popRedo();
    if (!cmd) return false;
    const changed = this.applyCommand(cmd, 'apply', 'redo');
    if (!changed) {
      h.dropLastUndo();
      this.emitHistory(roomId);
      return this.redo(roomId);
    }
    this.emitHistory(roomId);
    return true;
  }

  canUndo(roomId: RoomId): boolean {
    return this.histories.get(roomId)?.canUndo ?? false;
  }

  canRedo(roomId: RoomId): boolean {
    return this.histories.get(roomId)?.canRedo ?? false;
  }

  // ------------------------------------------------------- mudanças externas

  /**
   * Substitui um cômodo inteiro (carga do IndexedDB, versão do outro aparelho,
   * restauração de versão anterior). Zera o desfazer daquele cômodo, porque os
   * commands antigos se referem a um estado que não existe mais.
   */
  replaceRoom(room: Room, source: Exclude<ChangeSource, 'user' | 'undo' | 'redo'>): void {
    const prev = this.state.rooms[room.id];
    if (prev === room) return;
    this.state = { ...this.state, rooms: { ...this.state.rooms, [room.id]: room } };
    const h = this.histories.get(room.id);
    if (h && (h.canUndo || h.canRedo)) {
      h.clear();
      this.emitHistory(room.id);
    }
    this.emit({ type: 'room', roomId: room.id, prev, next: room, source });
    this.fixSelection();
  }

  /** Marca a revisão do servidor sem gerar mudança visível (pós-sync). */
  setRoomRevision(roomId: RoomId, revision: number): void {
    const room = this.state.rooms[roomId];
    if (!room || room.revision === revision) return;
    const next = { ...room, revision };
    this.state = { ...this.state, rooms: { ...this.state.rooms, [roomId]: next } };
    this.emit({ type: 'room', roomId, prev: room, next, source: 'remote' });
  }

  updateProfile(
    update: (profile: Profile) => Profile,
    source: Exclude<ChangeSource, 'undo' | 'redo'> = 'user',
  ): void {
    const prev = this.state.profile;
    const updated = update(prev);
    if (updated === prev) return;
    const next = source === 'user' ? { ...updated, updatedAt: this.now() } : updated;
    this.state = { ...this.state, profile: next };
    this.emit({ type: 'profile', prev, next, source });
  }

  select(selection: Selection | null): void {
    const prev = this.state.selection;
    if (prev?.uid === selection?.uid && prev?.roomId === selection?.roomId) return;
    this.state = { ...this.state, selection };
    this.emit({ type: 'selection', prev, next: selection });
  }

  // ---------------------------------------------------------------- interno

  private applyCommand(
    command: Command,
    direction: 'apply' | 'revert',
    source: 'user' | 'undo' | 'redo',
  ): boolean {
    const room = this.state.rooms[command.roomId];
    if (!room) {
      this.log.warn(`Command ${command.kind} para cômodo não carregado: ${command.roomId}`);
      return false;
    }
    const result = direction === 'apply' ? command.apply(room) : command.revert(room);
    if (result === room) return false;
    const next: Room = { ...result, updatedAt: this.now() };
    this.state = { ...this.state, rooms: { ...this.state.rooms, [room.id]: next } };
    this.emit({ type: 'room', roomId: room.id, prev: room, next, source, command });
    this.fixSelection();
    return true;
  }

  /** Limpa a seleção se o item selecionado deixou de existir. */
  private fixSelection(): void {
    const sel = this.state.selection;
    if (!sel) return;
    const room = this.state.rooms[sel.roomId];
    if (!room || !findItem(room, sel.uid)) this.select(null);
  }

  private history(roomId: RoomId): History {
    let h = this.histories.get(roomId);
    if (!h) {
      h = new History(this.historyLimit);
      this.histories.set(roomId, h);
    }
    return h;
  }

  private emitHistory(roomId: RoomId): void {
    const h = this.history(roomId);
    this.emit({ type: 'history', roomId, canUndo: h.canUndo, canRedo: h.canRedo });
  }

  private emit(event: StoreEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event, this.state);
      } catch (error) {
        this.log.error(`Listener falhou ao tratar evento "${event.type}"`, error);
      }
    }
  }
}
