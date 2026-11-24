import type { PlacedItem } from '../core/model';
import { clamp, round2 } from '../core/rules';
import type { Placement } from './types';

export interface PlacementInput {
  readonly placement: Placement;
  /** Largura padrão do item (% do palco). */
  readonly width: number;
  /** Altura/largura da arte. */
  readonly aspect: number;
  /** Linha parede/chão (% do palco). */
  readonly floorLine: number;
  readonly existing: readonly Pick<PlacedItem, 'x' | 'y'>[];
}

/**
 * Onde um item aparece ao ser tocado no catálogo: no centro da "zona" dele
 * (chão, parede, teto, céu). Se já houver algo exatamente ali, desloca para o
 * lado, para nunca empilhar itens invisíveis uns sobre os outros.
 */
export function defaultPosition(input: PlacementInput): { x: number; y: number } {
  const h = input.width * input.aspect;
  let y: number;
  switch (input.placement) {
    case 'floor':
      y = input.floorLine + 16 - h / 2;
      break;
    case 'stand':
      y = input.floorLine + 10 - h / 2;
      break;
    case 'wall':
      y = Math.min(input.floorLine - 6 - h / 2, 34);
      break;
    case 'ceiling':
      y = 3 + h / 2;
      break;
    case 'sky':
      y = 20;
      break;
  }
  y = clamp(y, h / 2 > 50 ? 50 : h / 2, 100 - Math.min(h / 2, 50));
  const offsets = [0, 7, -7, 14, -14, 21, -21, 28, -28];
  for (const dx of offsets) {
    const x = 50 + dx;
    const taken = input.existing.some((i) => Math.abs(i.x - x) < 2.5 && Math.abs(i.y - y) < 2.5);
    if (!taken) return { x: round2(x), y: round2(y) };
  }
  return { x: 50, y: round2(y) };
}
