/**
 * Modelo do domínio. Tudo imutável (readonly): mudanças produzem objetos
 * novos, o que dá desfazer/refazer barato e diffs por identidade no palco.
 *
 * Coordenadas: o palco é QUADRADO (ver ADR 0005). `x`, `y` (centro do item) e
 * `w` (largura) são porcentagens do lado do palco, então o cômodo fica idêntico
 * em qualquer tela.
 */

export const ROOM_IDS = [
  'fachada',
  'quarto',
  'trono',
  'banheiro',
  'cozinha',
  'baile',
  'closet',
  'jardim',
] as const;
export type RoomId = (typeof ROOM_IDS)[number];

export const CATEGORIES = ['moveis', 'decoracao', 'plantas', 'bichinhos', 'externos'] as const;
export type Category = (typeof CATEGORIES)[number];

export const COLOR_VARIANTS = ['rosa', 'lilas', 'azul', 'menta', 'dourado', 'perola'] as const;
export type ColorVariant = (typeof COLOR_VARIANTS)[number];

/** Cores de tinta para paredes, chão, castelo e telhado. */
export const PAINT_COLORS = [
  'rosa',
  'rosa-choque',
  'lilas',
  'lavanda',
  'azul',
  'menta',
  'pessego',
  'amarelo',
  'creme',
  'perola',
  'coral',
  'vinho',
] as const;
export type PaintColor = (typeof PAINT_COLORS)[number];

export const WALL_PATTERNS = [
  'lisa',
  'listras',
  'bolinhas',
  'coracoes',
  'losangos',
  'floral',
  'damasco',
] as const;
export type WallPattern = (typeof WALL_PATTERNS)[number];

export const FLOOR_PATTERNS = [
  'madeira-clara',
  'madeira-rosa',
  'xadrez',
  'marmore',
  'carpete',
  'ladrilho',
] as const;
export type FloorPattern = (typeof FLOOR_PATTERNS)[number];

export const AMBIENCES = ['dia', 'entardecer', 'noite'] as const;
export type Ambience = (typeof AMBIENCES)[number];

export const GROUNDS = ['grama', 'pedras', 'flores'] as const;
export type Ground = (typeof GROUNDS)[number];

export interface PlacedItem {
  /** Id único da instância no cômodo. */
  readonly uid: string;
  /** Id do item no catálogo. */
  readonly itemId: string;
  /** Centro horizontal, % do lado do palco (0–100). */
  readonly x: number;
  /** Centro vertical, % do lado do palco (0–100). */
  readonly y: number;
  /** Largura, % do lado do palco. A altura vem da proporção da arte. */
  readonly w: number;
  /** Rotação em graus, normalizada para (-180, 180]. */
  readonly rot: number;
  /** Espelhado horizontalmente. */
  readonly flip: boolean;
  readonly color: ColorVariant;
  readonly locked: boolean;
}

export interface InteriorDecor {
  readonly kind: 'interior';
  readonly wallColor: PaintColor;
  readonly wallPattern: WallPattern;
  readonly floorColor: PaintColor;
  readonly floorPattern: FloorPattern;
}

export interface ExteriorDecor {
  readonly kind: 'exterior';
  readonly castleColor: PaintColor;
  readonly roofColor: PaintColor;
  readonly ground: Ground;
}

export type Decor = InteriorDecor | ExteriorDecor;

export interface Room {
  readonly id: RoomId;
  readonly decor: Decor;
  /** Iluminação: dia / entardecer / noite (no externo, é o céu). */
  readonly ambience: Ambience;
  /** Ordem do array = ordem de profundidade (último fica na frente). */
  readonly items: readonly PlacedItem[];
  /** Última modificação local (ms desde a época). */
  readonly updatedAt: number;
  /** Revisão do servidor em que esta cópia se baseia (0 = nunca sincronizado). */
  readonly revision: number;
}

export type RoomKind = Decor['kind'];

export function isInterior(decor: Decor): decor is InteriorDecor {
  return decor.kind === 'interior';
}
