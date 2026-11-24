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
    starterItems: [],
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
    starterItems: [],
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
    starterItems: [],
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
    starterItems: [],
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
    starterItems: [],
  },
  {
    id: 'jardim',
    name: 'Jardim Encantado',
    emoji: '🌷',
    starter: false,
    cost: 70,
    defaultDecor: { kind: 'exterior', castleColor: 'perola', roofColor: 'lilas', ground: 'flores' },
    starterItems: [],
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
