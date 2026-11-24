import type { Decor, PlacedItem, Room, RoomId } from './model';

export interface RoomInfo {
  readonly id: RoomId;
  readonly name: string;
  /** Emoji usado em botões e no mapa quando não há miniatura. */
  readonly emoji: string;
  /** Liberado desde o começo? */
  readonly starter: boolean;
  /** Estrelinhas para liberar (0 para os iniciais). */
  readonly cost: number;
  readonly defaultDecor: Decor;
  readonly starterItems: readonly Omit<PlacedItem, 'uid'>[];
}

const base = { rot: 0, flip: false, locked: false } as const;

export const ROOMS: readonly RoomInfo[] = [
  {
    id: 'fachada',
    name: 'Fachada do Castelo',
    emoji: '🏰',
    starter: true,
    cost: 0,
    defaultDecor: { kind: 'exterior', castleColor: 'perola', roofColor: 'rosa', ground: 'grama' },
    starterItems: [
      { ...base, itemId: 'arbusto-coracao', x: 16, y: 80, w: 18, color: 'menta' },
      { ...base, itemId: 'arbusto-coracao', x: 84, y: 80, w: 18, color: 'menta', flip: true },
    ],
  },
  {
    id: 'quarto',
    name: 'Quarto da Princesa',
    emoji: '🛏️',
    starter: true,
    cost: 0,
    defaultDecor: {
      kind: 'interior',
      wallColor: 'rosa',
      wallPattern: 'listras',
      floorColor: 'creme',
      floorPattern: 'madeira-clara',
    },
    starterItems: [
      { ...base, itemId: 'janela-arco', x: 50, y: 30, w: 26, color: 'perola' },
      { ...base, itemId: 'tapete-redondo', x: 50, y: 82, w: 46, color: 'lilas' },
    ],
  },
  {
    id: 'trono',
    name: 'Sala do Trono',
    emoji: '👑',
    starter: true,
    cost: 0,
    defaultDecor: {
      kind: 'interior',
      wallColor: 'lavanda',
      wallPattern: 'damasco',
      floorColor: 'perola',
      floorPattern: 'marmore',
    },
    starterItems: [
      { ...base, itemId: 'vitral', x: 50, y: 27, w: 22, color: 'rosa' },
      { ...base, itemId: 'tapete-retangular', x: 50, y: 82, w: 50, color: 'rosa' },
      { ...base, itemId: 'trono', x: 50, y: 61, w: 28, color: 'rosa' },
    ],
  },
  {
    id: 'banheiro',
    name: 'Banheiro Real',
    emoji: '🛁',
    starter: false,
    cost: 15,
    defaultDecor: {
      kind: 'interior',
      wallColor: 'azul',
      wallPattern: 'lisa',
      floorColor: 'perola',
      floorPattern: 'ladrilho',
    },
    starterItems: [
      { ...base, itemId: 'espelho-oval', x: 50, y: 28, w: 16, color: 'azul' },
      { ...base, itemId: 'banheira', x: 46, y: 67, w: 40, color: 'rosa' },
      { ...base, itemId: 'samambaia', x: 85, y: 72, w: 16, color: 'perola' },
    ],
  },
  {
    id: 'cozinha',
    name: 'Cozinha Encantada',
    emoji: '🧁',
    starter: false,
    cost: 25,
    defaultDecor: {
      kind: 'interior',
      wallColor: 'menta',
      wallPattern: 'bolinhas',
      floorColor: 'rosa',
      floorPattern: 'xadrez',
    },
    starterItems: [
      { ...base, itemId: 'janela-arco', x: 68, y: 30, w: 24, color: 'menta' },
      { ...base, itemId: 'armario-cozinha', x: 26, y: 63, w: 30, color: 'menta' },
      { ...base, itemId: 'fogao', x: 68, y: 67, w: 26, color: 'azul' },
    ],
  },
  {
    id: 'baile',
    name: 'Salão de Baile',
    emoji: '💃',
    starter: false,
    cost: 40,
    defaultDecor: {
      kind: 'interior',
      wallColor: 'creme',
      wallPattern: 'floral',
      floorColor: 'perola',
      floorPattern: 'marmore',
    },
    starterItems: [
      { ...base, itemId: 'cortina', x: 12, y: 36, w: 16, color: 'lilas' },
      { ...base, itemId: 'cortina', x: 88, y: 36, w: 16, color: 'lilas', flip: true },
      { ...base, itemId: 'lustre-cristal', x: 50, y: 19, w: 34, color: 'rosa' },
    ],
  },
  {
    id: 'closet',
    name: 'Closet da Princesa',
    emoji: '👗',
    starter: false,
    cost: 55,
    defaultDecor: {
      kind: 'interior',
      wallColor: 'lilas',
      wallPattern: 'coracoes',
      floorColor: 'rosa',
      floorPattern: 'carpete',
    },
    starterItems: [
      { ...base, itemId: 'tapete-coracao', x: 52, y: 84, w: 42, color: 'rosa' },
      { ...base, itemId: 'guarda-roupa', x: 24, y: 60, w: 26, color: 'perola' },
      { ...base, itemId: 'espelho-chao', x: 78, y: 64, w: 16, color: 'rosa' },
    ],
  },
  {
    id: 'jardim',
    name: 'Jardim Encantado',
    emoji: '🌷',
    starter: false,
    cost: 70,
    defaultDecor: { kind: 'exterior', castleColor: 'perola', roofColor: 'lilas', ground: 'flores' },
    starterItems: [
      { ...base, itemId: 'arco-flores', x: 50, y: 66, w: 36, color: 'rosa' },
      { ...base, itemId: 'canteiro', x: 20, y: 86, w: 34, color: 'rosa' },
      { ...base, itemId: 'borboletas', x: 78, y: 22, w: 16, color: 'rosa' },
    ],
  },
];

const BY_ID = new Map(ROOMS.map((r) => [r.id, r]));

export function roomInfo(id: RoomId): RoomInfo {
  const info = BY_ID.get(id);
  if (!info) throw new Error(`Cômodo desconhecido: ${id}`);
  return info;
}

export function createRoom(id: RoomId, newId: () => string, now: number): Room {
  const info = roomInfo(id);
  return {
    id,
    decor: info.defaultDecor,
    ambience: 'dia',
    items: info.starterItems.map((i) => ({ ...i, uid: newId() })),
    updatedAt: now,
    revision: 0,
  };
}
