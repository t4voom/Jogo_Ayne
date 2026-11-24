import type { ColorVariant } from '../core/model';
import type { Ramp } from './palette';

export interface ArtContext {
  readonly ramp: Ramp;
  readonly variant: ColorVariant;
  /** Prefixo único para ids de gradientes locais (evita colisão entre itens). */
  readonly key: string;
}

/** Arte de um item: um SVG com viewBox 0 0 w h. */
export interface ItemArt {
  readonly w: number;
  readonly h: number;
  draw(ctx: ArtContext): string;
  /** Ponto de luz (em coordenadas do viewBox) que brilha à noite. */
  readonly light?: { readonly x: number; readonly y: number; readonly r: number };
}

export type ArtPack = Readonly<Record<string, ItemArt>>;
