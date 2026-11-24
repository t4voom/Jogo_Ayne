import { getItem } from '../catalog/items';
import type { Category, PlacedItem, Room, RoomId } from '../core/model';
import type { Profile } from '../core/profile';

/** O que as regras de missão/conquista enxergam do jogo. */
export interface Snapshot {
  readonly rooms: Readonly<Partial<Record<RoomId, Room>>>;
  readonly profile: Profile;
}

export interface Progress {
  readonly value: number;
  readonly goal: number;
}

export const progress = (value: number, goal: number): Progress => ({
  value: Math.min(value, goal),
  goal,
});
export const isComplete = (p: Progress): boolean => p.value >= p.goal;

export function itemsIn(s: Snapshot, roomId: RoomId): readonly PlacedItem[] {
  return s.rooms[roomId]?.items ?? [];
}

export function allItems(s: Snapshot): PlacedItem[] {
  return Object.values(s.rooms).flatMap((r) => [...r.items]);
}

export function hasAny(s: Snapshot, roomId: RoomId, ids: readonly string[]): boolean {
  return itemsIn(s, roomId).some((i) => ids.includes(i.itemId));
}

export function countCategory(items: readonly PlacedItem[], category: Category): number {
  return items.filter((i) => getItem(i.itemId)?.category === category).length;
}
