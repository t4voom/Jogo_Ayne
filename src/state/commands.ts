import type { Ambience, Decor, PlacedItem, Room, RoomId } from '../core/model';
import { indexOfItem, sanitizeItem } from '../core/rules';

/**
 * Padrão Command: toda alteração da jogadora é um objeto que sabe se aplicar e
 * se desfazer. Commands são puros (Room → Room) e capturam o "antes" no
 * momento da criação, então desfazer é exato mesmo após vários passos.
 *
 * Um Command que não encontra seu alvo (ex.: item já removido) devolve o
 * cômodo inalterado — o store trata isso como "nada aconteceu".
 */
export interface Command {
  readonly kind: string;
  readonly roomId: RoomId;
  apply(room: Room): Room;
  revert(room: Room): Room;
}

export type ItemPatch = Partial<
  Pick<PlacedItem, 'x' | 'y' | 'w' | 'rot' | 'flip' | 'color' | 'locked'>
>;

function withItems(room: Room, items: readonly PlacedItem[]): Room {
  return { ...room, items };
}

function patchItem(room: Room, uid: string, patch: ItemPatch): Room {
  const idx = indexOfItem(room, uid);
  const current = room.items[idx];
  if (!current) return room;
  const next = sanitizeItem({ ...current, ...patch });
  if (shallowEqualItem(current, next)) return room;
  const items = room.items.slice();
  items[idx] = next;
  return withItems(room, items);
}

function shallowEqualItem(a: PlacedItem, b: PlacedItem): boolean {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.w === b.w &&
    a.rot === b.rot &&
    a.flip === b.flip &&
    a.color === b.color &&
    a.locked === b.locked
  );
}

function insertAt(room: Room, item: PlacedItem, index: number): Room {
  if (indexOfItem(room, item.uid) !== -1) return room;
  const items = room.items.slice();
  items.splice(Math.max(0, Math.min(index, items.length)), 0, sanitizeItem(item));
  return withItems(room, items);
}

function removeByUid(room: Room, uid: string): Room {
  const idx = indexOfItem(room, uid);
  if (idx === -1) return room;
  const items = room.items.slice();
  items.splice(idx, 1);
  return withItems(room, items);
}

function moveIndex(room: Room, uid: string, to: number): Room {
  const from = indexOfItem(room, uid);
  if (from === -1) return room;
  const target = Math.max(0, Math.min(to, room.items.length - 1));
  if (from === target) return room;
  const items = room.items.slice();
  const [item] = items.splice(from, 1);
  if (!item) return room;
  items.splice(target, 0, item);
  return withItems(room, items);
}

/** Adiciona um item (no topo por padrão, ou em `index`). */
export function addItemCommand(roomId: RoomId, item: PlacedItem, index?: number): Command {
  return {
    kind: 'add',
    roomId,
    apply: (room) => insertAt(room, item, index ?? room.items.length),
    revert: (room) => removeByUid(room, item.uid),
  };
}

/** Remove um item; desfazer o devolve à mesma profundidade. */
export function removeItemCommand(roomId: RoomId, item: PlacedItem, index: number): Command {
  return {
    kind: 'remove',
    roomId,
    apply: (room) => removeByUid(room, item.uid),
    revert: (room) => insertAt(room, item, index),
  };
}

/** Altera propriedades de um item (mover, redimensionar, girar, cor, travar…). */
export function updateItemCommand(
  roomId: RoomId,
  uid: string,
  before: ItemPatch,
  after: ItemPatch,
  kind = 'update',
): Command {
  return {
    kind,
    roomId,
    apply: (room) => patchItem(room, uid, after),
    revert: (room) => patchItem(room, uid, before),
  };
}

/** Muda a profundidade (frente/trás) de um item. */
export function reorderItemCommand(
  roomId: RoomId,
  uid: string,
  fromIndex: number,
  toIndex: number,
): Command {
  return {
    kind: 'reorder',
    roomId,
    apply: (room) => moveIndex(room, uid, toIndex),
    revert: (room) => moveIndex(room, uid, fromIndex),
  };
}

/** Pinta parede/chão (interno) ou castelo/telhado/chão (externo). */
export function setDecorCommand(roomId: RoomId, before: Decor, after: Decor): Command {
  return {
    kind: 'decor',
    roomId,
    apply: (room) => ({ ...room, decor: after }),
    revert: (room) => ({ ...room, decor: before }),
  };
}

export function setAmbienceCommand(roomId: RoomId, before: Ambience, after: Ambience): Command {
  return {
    kind: 'ambience',
    roomId,
    apply: (room) => (room.ambience === after ? room : { ...room, ambience: after }),
    revert: (room) => (room.ambience === before ? room : { ...room, ambience: before }),
  };
}

/** Vários commands como um passo só de desfazer. */
export function batchCommand(
  roomId: RoomId,
  commands: readonly Command[],
  kind = 'batch',
): Command {
  return {
    kind,
    roomId,
    apply: (room) => commands.reduce((r, c) => c.apply(r), room),
    revert: (room) => commands.reduceRight((r, c) => c.revert(r), room),
  };
}
