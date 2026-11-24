import type { PlacedItem, Room } from './model';

/** Limites de tamanho de um item (% do lado do palco). */
export const MIN_ITEM_WIDTH = 3;
export const MAX_ITEM_WIDTH = 100;
/** Quantos itens cabem num cômodo (desempenho e tamanho do save). */
export const MAX_ITEMS_PER_ROOM = 120;
/** Passos de desfazer por cômodo. */
export const HISTORY_LIMIT = 50;
/** Fator dos botões aumentar/diminuir. */
export const SCALE_STEP = 1.15;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Arredonda para 2 casas: saves menores e comparações estáveis. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Normaliza um ângulo para (-180, 180]. */
export function normalizeAngle(deg: number): number {
  let a = deg % 360;
  if (a <= -180) a += 360;
  if (a > 180) a -= 360;
  return round2(a === 0 ? 0 : a); // evita -0
}

/** Garante que um item tem valores válidos (centro dentro do palco etc.). */
export function sanitizeItem(item: PlacedItem): PlacedItem {
  const x = round2(clamp(item.x, 0, 100));
  const y = round2(clamp(item.y, 0, 100));
  const w = round2(clamp(item.w, MIN_ITEM_WIDTH, MAX_ITEM_WIDTH));
  const rot = normalizeAngle(item.rot);
  if (x === item.x && y === item.y && w === item.w && rot === item.rot) return item;
  return { ...item, x, y, w, rot };
}

export function findItem(room: Room, uid: string): PlacedItem | undefined {
  return room.items.find((i) => i.uid === uid);
}

export function indexOfItem(room: Room, uid: string): number {
  return room.items.findIndex((i) => i.uid === uid);
}

export function canAddItem(room: Room): boolean {
  return room.items.length < MAX_ITEMS_PER_ROOM;
}
