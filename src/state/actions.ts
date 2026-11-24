import type { IdGenerator } from '../core/ids';
import type {
  Ambience,
  ColorVariant,
  Decor,
  ExteriorDecor,
  InteriorDecor,
  PlacedItem,
  RoomId,
} from '../core/model';
import { SCALE_STEP, canAddItem, findItem, indexOfItem } from '../core/rules';
import {
  addItemCommand,
  batchCommand,
  removeItemCommand,
  reorderItemCommand,
  setAmbienceCommand,
  setDecorCommand,
  updateItemCommand,
  type ItemPatch,
} from './commands';
import type { Store } from './store';

export type DecorPatch =
  Partial<Omit<InteriorDecor, 'kind'>> | Partial<Omit<ExteriorDecor, 'kind'>>;

/** Deslocamento do item duplicado (% do palco). */
const DUPLICATE_OFFSET = 4;

/**
 * Ações de alto nível usadas pela interface e pelos gestos. Cada ação lê o
 * estado atual, monta o Command com o "antes" capturado e o executa.
 */
export class GameActions {
  constructor(
    private readonly store: Store,
    private readonly newId: IdGenerator,
  ) {}

  private item(roomId: RoomId, uid: string): PlacedItem | undefined {
    const room = this.store.getRoom(roomId);
    return room ? findItem(room, uid) : undefined;
  }

  add(roomId: RoomId, init: Omit<PlacedItem, 'uid'>, index?: number): PlacedItem | null {
    const room = this.store.getRoom(roomId);
    if (!room || !canAddItem(room)) return null;
    const item: PlacedItem = { ...init, uid: this.newId() };
    const ok = this.store.execute(addItemCommand(roomId, item, index));
    return ok ? (findItem(this.store.getRoom(roomId) ?? room, item.uid) ?? null) : null;
  }

  /** Altera propriedades. Itens travados só aceitam destravar. */
  transform(roomId: RoomId, uid: string, after: ItemPatch, kind = 'update'): boolean {
    const current = this.item(roomId, uid);
    if (!current) return false;
    if (current.locked && !('locked' in after)) return false;
    const before: ItemPatch = {};
    for (const key of Object.keys(after) as (keyof ItemPatch)[]) {
      Object.assign(before, { [key]: current[key] });
    }
    return this.store.execute(updateItemCommand(roomId, uid, before, after, kind));
  }

  /**
   * Grava um gesto (arrastar/pinça) como UM passo de desfazer: `before` é o
   * estado no início do gesto (o store ainda não viu os quadros intermediários).
   */
  commitGesture(roomId: RoomId, uid: string, before: ItemPatch, after: ItemPatch): boolean {
    const current = this.item(roomId, uid);
    if (!current || current.locked) return false;
    return this.store.execute(updateItemCommand(roomId, uid, before, after, 'gesture'));
  }

  remove(roomId: RoomId, uid: string): boolean {
    const room = this.store.getRoom(roomId);
    if (!room) return false;
    const idx = indexOfItem(room, uid);
    const item = room.items[idx];
    if (!item) return false;
    return this.store.execute(removeItemCommand(roomId, item, idx));
  }

  duplicate(roomId: RoomId, uid: string): PlacedItem | null {
    const room = this.store.getRoom(roomId);
    const source = this.item(roomId, uid);
    if (!room || !source) return null;
    const dx = source.x + DUPLICATE_OFFSET > 96 ? -DUPLICATE_OFFSET : DUPLICATE_OFFSET;
    const dy = source.y + DUPLICATE_OFFSET > 96 ? -DUPLICATE_OFFSET : DUPLICATE_OFFSET;
    const { uid: _uid, ...rest } = source;
    return this.add(
      roomId,
      { ...rest, x: source.x + dx, y: source.y + dy, locked: false },
      indexOfItem(room, uid) + 1,
    );
  }

  scale(roomId: RoomId, uid: string, direction: 1 | -1): boolean {
    const current = this.item(roomId, uid);
    if (!current) return false;
    const factor = direction === 1 ? SCALE_STEP : 1 / SCALE_STEP;
    return this.transform(roomId, uid, { w: current.w * factor }, 'scale');
  }

  flip(roomId: RoomId, uid: string): boolean {
    const current = this.item(roomId, uid);
    if (!current) return false;
    return this.transform(roomId, uid, { flip: !current.flip }, 'flip');
  }

  setColor(roomId: RoomId, uid: string, color: ColorVariant): boolean {
    return this.transform(roomId, uid, { color }, 'color');
  }

  toggleLock(roomId: RoomId, uid: string): boolean {
    const current = this.item(roomId, uid);
    if (!current) return false;
    return this.transform(roomId, uid, { locked: !current.locked }, 'lock');
  }

  /** Muda a profundidade: +1 = uma camada para frente, 'front' = topo. */
  reorder(roomId: RoomId, uid: string, to: 'front' | 'back' | 1 | -1): boolean {
    const room = this.store.getRoom(roomId);
    if (!room) return false;
    const from = indexOfItem(room, uid);
    if (from === -1) return false;
    const last = room.items.length - 1;
    const target =
      to === 'front' ? last : to === 'back' ? 0 : Math.max(0, Math.min(last, from + to));
    if (target === from) return false;
    return this.store.execute(reorderItemCommand(roomId, uid, from, target));
  }

  paint(roomId: RoomId, patch: DecorPatch): boolean {
    const room = this.store.getRoom(roomId);
    if (!room) return false;
    // Só vale o que existe neste tipo de cômodo (parede não existe na fachada).
    const current = room.decor as unknown as Record<string, unknown>;
    const entries = Object.entries(patch).filter(([k, v]) => k in current && current[k] !== v);
    if (entries.length === 0) return false;
    const next: Decor = { ...room.decor, ...Object.fromEntries(entries) };
    return this.store.execute(setDecorCommand(roomId, room.decor, next));
  }

  setAmbience(roomId: RoomId, ambience: Ambience): boolean {
    const room = this.store.getRoom(roomId);
    if (!room || room.ambience === ambience) return false;
    return this.store.execute(setAmbienceCommand(roomId, room.ambience, ambience));
  }

  /** Remove todos os itens destravados (um passo de desfazer). */
  clearRoom(roomId: RoomId): boolean {
    const room = this.store.getRoom(roomId);
    if (!room) return false;
    const removals = room.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.locked)
      .reverse()
      .map(({ item, index }) => removeItemCommand(roomId, item, index));
    if (removals.length === 0) return false;
    return this.store.execute(batchCommand(roomId, removals, 'clear'));
  }
}
