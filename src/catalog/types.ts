import type { Category, ColorVariant, RoomId } from '../core/model';

/** Onde o item "mora": define a posição inicial e o encaixe do ímã. */
export type Placement = 'floor' | 'stand' | 'wall' | 'ceiling' | 'sky';

export type AnimKind = 'breathe' | 'blink' | 'sway' | 'flicker' | 'water' | 'tail' | 'none';

export interface CatalogItem {
  readonly id: string;
  /** Nome em português, como aparece para a jogadora. */
  readonly name: string;
  readonly category: Category;
  readonly tags: readonly string[];
  /** Cômodos sugeridos (pode ser usado em qualquer um). */
  readonly rooms: readonly RoomId[];
  /** Largura padrão (% do palco). */
  readonly width: number;
  readonly colors: readonly ColorVariant[];
  readonly defaultColor: ColorVariant;
  /** Estrelinhas para liberar (0 = já vem liberado). */
  readonly cost: number;
  readonly placement: Placement;
  /** Entra atrás dos outros itens (tapetes, janelas, quadros). */
  readonly behind: boolean;
  readonly anim: readonly AnimKind[];
  /** Id da arte (normalmente igual ao id). */
  readonly art: string;
}
