import type { ArtRegistry } from '../art/registry';
import type { IdGenerator } from '../core/ids';
import type { Room, RoomId } from '../core/model';
import type { GameActions } from '../state/actions';
import type { Store } from '../state/store';
import type { Haptics } from './haptics';
import type { Router } from './router';
import type { Toaster } from './toast';

/** Tudo que as telas precisam, montado em main.ts (raiz de composição). */
export interface GameContext {
  readonly store: Store;
  readonly actions: GameActions;
  readonly art: ArtRegistry;
  readonly toast: Toaster;
  readonly haptics: Haptics;
  readonly router: Router;
  readonly newId: IdGenerator;
  /** Garante que o cômodo existe no estado (cria com a decoração inicial). */
  ensureRoom(roomId: RoomId): Room;
  isRoomUnlocked(roomId: RoomId): boolean;
}
