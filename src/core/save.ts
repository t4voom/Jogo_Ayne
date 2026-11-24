import * as z from 'zod/mini';
import { assertMigrationChain, migrate, type Json, type Migration } from './migrations';
import type { Room } from './model';
import type { Profile } from './profile';
import { RoomSchema } from './schema';

/**
 * Formato persistido (IndexedDB e planilha). Cada registro leva
 * `schemaVersion`; ler = migrar até a versão atual + validar com zod.
 */

export const ROOM_SCHEMA_VERSION = 1;
export const PROFILE_SCHEMA_VERSION = 2;

export const ROOM_MIGRATIONS: readonly Migration[] = [];
export const PROFILE_MIGRATIONS: readonly Migration[] = [
  {
    from: 1,
    to: 2,
    description: 'Fase 5: estrelinhas, desbloqueios, missões, conquistas, presente diário',
    up: (data) => ({
      ...data,
      stars: { earned: {}, spent: {} },
      unlocked: [],
      missions: {},
      achievements: {},
      daily: { lastDay: null, streak: 0 },
      decorStars: { day: '', count: 0 },
      stats: {},
      letterSeen: false,
    }),
  },
];

assertMigrationChain(ROOM_MIGRATIONS, ROOM_SCHEMA_VERSION, ROOM_SCHEMA_VERSION);
assertMigrationChain(PROFILE_MIGRATIONS, 1, PROFILE_SCHEMA_VERSION);

export const SettingsSchema = z.object({
  music: z.boolean(),
  sfx: z.boolean(),
  haptics: z.boolean(),
  snap: z.boolean(),
});

const CounterSchema = z.record(z.string().check(z.maxLength(64)), z.int().check(z.minimum(0)));
const DayKey = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/));

export const ProfileSchema = z.object({
  settings: SettingsSchema,
  tutorialDone: z.boolean(),
  stars: z.object({ earned: CounterSchema, spent: CounterSchema }),
  unlocked: z.array(z.string().check(z.maxLength(64))).check(z.maxLength(500)),
  missions: z.record(
    z.string().check(z.maxLength(64)),
    z.object({ done: z.boolean(), claimed: z.boolean() }),
  ),
  achievements: z.record(z.string().check(z.maxLength(64)), z.number()),
  daily: z.object({ lastDay: z.nullable(DayKey), streak: z.int().check(z.minimum(0)) }),
  decorStars: z.object({
    day: z.union([DayKey, z.literal('')]),
    count: z.int().check(z.minimum(0)),
  }),
  stats: z.record(z.string().check(z.maxLength(64)), CounterSchema),
  letterSeen: z.boolean(),
  updatedAt: z.number(),
  revision: z.int().check(z.minimum(0)),
});
// Garantia em tempo de compilação: o schema produz um Profile válido.
type Assert<T extends true> = T;
export type ProfileSchemaMatches = Assert<
  z.infer<typeof ProfileSchema> extends Profile ? true : false
>;

export type Versioned<T> = T & { readonly schemaVersion: number };

export function serializeRoom(room: Room): Versioned<Room> {
  return { ...room, schemaVersion: ROOM_SCHEMA_VERSION };
}

export function serializeProfile(profile: Profile): Versioned<Profile> {
  return { ...profile, schemaVersion: PROFILE_SCHEMA_VERSION };
}

function strip(data: Json): Json {
  const { schemaVersion: _v, ...rest } = data;
  return rest;
}

/** Lê um cômodo salvo (qualquer versão suportada). Lança se for inválido. */
export function parseRoom(raw: unknown): Room {
  const migrated = migrate(raw, ROOM_MIGRATIONS, ROOM_SCHEMA_VERSION);
  return RoomSchema.parse(strip(migrated));
}

/** Lê um perfil salvo (qualquer versão suportada). Lança se for inválido. */
export function parseProfile(raw: unknown): Profile {
  const migrated = migrate(raw, PROFILE_MIGRATIONS, PROFILE_SCHEMA_VERSION);
  return ProfileSchema.parse(strip(migrated));
}
