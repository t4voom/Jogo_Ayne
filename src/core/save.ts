import { z } from 'zod';
import { assertMigrationChain, migrate, type Json, type Migration } from './migrations';
import type { Room } from './model';
import type { Profile } from './profile';
import { RoomSchema } from './schema';

/**
 * Formato persistido (IndexedDB e planilha). Cada registro leva
 * `schemaVersion`; ler = migrar até a versão atual + validar com zod.
 */

export const ROOM_SCHEMA_VERSION = 1;
export const PROFILE_SCHEMA_VERSION = 1;

export const ROOM_MIGRATIONS: readonly Migration[] = [];
export const PROFILE_MIGRATIONS: readonly Migration[] = [];

assertMigrationChain(ROOM_MIGRATIONS, ROOM_SCHEMA_VERSION, ROOM_SCHEMA_VERSION);
assertMigrationChain(PROFILE_MIGRATIONS, PROFILE_SCHEMA_VERSION, PROFILE_SCHEMA_VERSION);

export const SettingsSchema = z.object({
  music: z.boolean(),
  sfx: z.boolean(),
  haptics: z.boolean(),
  snap: z.boolean(),
});

export const ProfileSchema = z.object({
  settings: SettingsSchema,
  tutorialDone: z.boolean(),
  updatedAt: z.number(),
  revision: z.number().int().min(0),
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
