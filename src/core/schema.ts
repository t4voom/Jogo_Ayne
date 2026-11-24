import * as z from 'zod/mini';
import {
  AMBIENCES,
  COLOR_VARIANTS,
  FLOOR_PATTERNS,
  GROUNDS,
  PAINT_COLORS,
  ROOM_IDS,
  WALL_PATTERNS,
  type Room,
} from './model';

/**
 * Schemas zod: tudo que entra no jogo vindo de fora (IndexedDB, rede, saves
 * antigos) passa por aqui. Os tipos do modelo continuam sendo a referência; os
 * schemas são verificados contra eles em tempo de compilação (ver `satisfies`).
 */

const finite = z.number().check(z.refine(Number.isFinite, 'número inválido'));

export const RoomIdSchema = z.enum(ROOM_IDS);
export const ColorVariantSchema = z.enum(COLOR_VARIANTS);
export const PaintColorSchema = z.enum(PAINT_COLORS);

export const PlacedItemSchema = z.object({
  uid: z.string().check(z.minLength(1), z.maxLength(64)),
  itemId: z.string().check(z.minLength(1), z.maxLength(64)),
  x: finite,
  y: finite,
  w: z.number().check(z.refine((v) => Number.isFinite(v) && v > 0, 'largura deve ser positiva')),
  rot: finite,
  flip: z.boolean(),
  color: ColorVariantSchema,
  locked: z.boolean(),
});

export const InteriorDecorSchema = z.object({
  kind: z.literal('interior'),
  wallColor: PaintColorSchema,
  wallPattern: z.enum(WALL_PATTERNS),
  floorColor: PaintColorSchema,
  floorPattern: z.enum(FLOOR_PATTERNS),
});

export const ExteriorDecorSchema = z.object({
  kind: z.literal('exterior'),
  castleColor: PaintColorSchema,
  roofColor: PaintColorSchema,
  ground: z.enum(GROUNDS),
});

export const DecorSchema = z.discriminatedUnion('kind', [InteriorDecorSchema, ExteriorDecorSchema]);

export const RoomSchema = z.object({
  id: RoomIdSchema,
  decor: DecorSchema,
  ambience: z.enum(AMBIENCES),
  items: z.array(PlacedItemSchema).check(z.maxLength(500)),
  updatedAt: finite,
  revision: z.int().check(z.minimum(0)),
});

// Garantia em tempo de compilação: o que o schema produz é um Room válido.
type Assert<T extends true> = T;
export type RoomSchemaMatches = Assert<z.infer<typeof RoomSchema> extends Room ? true : false>;
