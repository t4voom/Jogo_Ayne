import type { ItemArt } from '../art/types';
import type { PlacedItem } from '../core/model';

export interface LightSpot {
  readonly uid: string;
  /** Centro do brilho (% do palco). */
  readonly x: number;
  readonly y: number;
  /** Raio (% do lado do palco). */
  readonly r: number;
  readonly flicker: boolean;
}

/**
 * Onde fica o brilho de um item que acende à noite, levando em conta
 * tamanho, espelhamento e rotação do item.
 */
export function lightOf(item: PlacedItem, art: ItemArt, flicker: boolean): LightSpot | null {
  const light = art.light;
  if (!light) return null;
  const scale = item.w / art.w; // % do palco por unidade do desenho
  let dx = (light.x - art.w / 2) * scale;
  const dy = (light.y - art.h / 2) * scale;
  if (item.flip) dx = -dx;
  const a = (item.rot * Math.PI) / 180;
  const rx = dx * Math.cos(a) - dy * Math.sin(a);
  const ry = dx * Math.sin(a) + dy * Math.cos(a);
  return { uid: item.uid, x: item.x + rx, y: item.y + ry, r: light.r * scale, flicker };
}
