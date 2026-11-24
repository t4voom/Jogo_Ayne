import type * as z from 'zod/mini';
import { createLogger, type Logger } from '../core/log';
import { FutureVersionError } from '../core/migrations';
import { ROOM_IDS, type Room, type RoomId } from '../core/model';
import type { Profile } from '../core/profile';
import { parseProfile, parseRoom, serializeProfile, serializeRoom } from '../core/save';
import { Database } from './idb';
import type { OutboxEntry, OutboxStore } from './sync-engine';

/**
 * Repositório local (IndexedDB). É a primeira e mais importante camada de
 * salvamento: tudo grava aqui antes de qualquer rede.
 *
 * Leitura defensiva: registro inválido nunca derruba o jogo nem é apagado —
 * vai para a "quarentena" (store `backups`) e o cômodo volta ao padrão.
 */

export const DB_NAME = 'castelo-da-ayne';
export const DB_VERSION = 1;

export const STORES = {
  rooms: 'rooms',
  profile: 'profile',
  meta: 'meta',
  outbox: 'outbox',
  backups: 'backups',
  photos: 'photos',
} as const;

const PROFILE_KEY = 'main';

export type BackupReason = 'conflict' | 'corrupt' | 'future-version' | 'manual';

export interface BackupRecord {
  readonly id?: number;
  readonly kind: 'room' | 'profile';
  readonly key: string;
  readonly reason: BackupReason;
  readonly savedAt: number;
  /** Conteúdo original (serializado), exatamente como estava. */
  readonly data: unknown;
}

export interface PhotoRecord {
  readonly id: string;
  readonly roomId: string;
  readonly createdAt: number;
  /** Foto completa (PNG). null = veio do outro aparelho (só miniatura). */
  readonly image: Blob | null;
  /** Miniatura JPEG em data URL (é o que vai para a planilha). */
  readonly thumbnail: string;
}

/**
 * Como a foto fica no IndexedDB: bytes em ArrayBuffer em vez de Blob. O Safari
 * em navegação privada (e outros WebKits efêmeros) recusa guardar Blob no
 * IndexedDB; ArrayBuffer funciona em todo lugar.
 */
interface StoredPhoto extends Omit<PhotoRecord, 'image'> {
  readonly image: { readonly bytes: ArrayBuffer; readonly type: string } | Blob | null;
}

async function toStoredPhoto(photo: PhotoRecord): Promise<StoredPhoto> {
  if (!photo.image) return { ...photo, image: null };
  return { ...photo, image: { bytes: await photo.image.arrayBuffer(), type: photo.image.type } };
}

function fromStoredPhoto(stored: StoredPhoto): PhotoRecord {
  const { image } = stored;
  if (image === null || image instanceof Blob) return { ...stored, image };
  return { ...stored, image: new Blob([image.bytes], { type: image.type }) };
}

export interface LoadedRooms {
  readonly rooms: Room[];
  /** Cômodos que não puderam ser lidos (foram para a quarentena). */
  readonly quarantined: RoomId[];
}

function upgrade(db: IDBDatabase, oldVersion: number): void {
  if (oldVersion < 1) {
    db.createObjectStore(STORES.rooms, { keyPath: 'id' });
    db.createObjectStore(STORES.profile);
    db.createObjectStore(STORES.meta);
    db.createObjectStore(STORES.outbox, { keyPath: 'key' });
    const backups = db.createObjectStore(STORES.backups, { keyPath: 'id', autoIncrement: true });
    backups.createIndex('byKey', 'key');
    db.createObjectStore(STORES.photos, { keyPath: 'id' });
  }
}

export class LocalRepository {
  private constructor(
    readonly db: Database,
    private readonly log: Logger,
    private readonly now: () => number,
  ) {}

  static async open(
    factory: IDBFactory = indexedDB,
    options: { now?: () => number; logger?: Logger } = {},
  ): Promise<LocalRepository> {
    const log = options.logger ?? createLogger('local');
    let db: Database;
    try {
      db = await Database.open(factory, DB_NAME, DB_VERSION, upgrade);
    } catch (first) {
      // O Safari às vezes falha na primeira abertura após atualizar: tenta de novo.
      log.warn('Primeira abertura do IndexedDB falhou; tentando de novo', first);
      db = await Database.open(factory, DB_NAME, DB_VERSION, upgrade);
    }
    return new LocalRepository(db, log, options.now ?? Date.now);
  }

  close(): void {
    this.db.close();
  }

  // ------------------------------------------------------------------ cômodos

  async loadRooms(): Promise<LoadedRooms> {
    const raws = await this.db.getAll(STORES.rooms);
    const rooms: Room[] = [];
    const quarantined: RoomId[] = [];
    for (const raw of raws) {
      try {
        rooms.push(parseRoom(raw));
      } catch (error) {
        const key = keyOf(raw);
        this.log.error(`Cômodo salvo ilegível (${key}); guardando na quarentena`, error);
        await this.addBackup({
          kind: 'room',
          key,
          reason: error instanceof FutureVersionError ? 'future-version' : 'corrupt',
          data: raw,
        });
        if (isRoomIdLike(key)) quarantined.push(key);
      }
    }
    return { rooms, quarantined };
  }

  async saveRoom(room: Room): Promise<void> {
    await this.db.put(STORES.rooms, serializeRoom(room));
  }

  async deleteRoom(roomId: RoomId): Promise<void> {
    await this.db.delete(STORES.rooms, roomId);
  }

  // ------------------------------------------------------------------- perfil

  async loadProfile(): Promise<Profile | null> {
    const raw = await this.db.get(STORES.profile, PROFILE_KEY);
    if (raw === undefined) return null;
    try {
      return parseProfile(raw);
    } catch (error) {
      this.log.error('Perfil salvo ilegível; guardando na quarentena', error);
      await this.addBackup({
        kind: 'profile',
        key: PROFILE_KEY,
        reason: error instanceof FutureVersionError ? 'future-version' : 'corrupt',
        data: raw,
      });
      return null;
    }
  }

  async saveProfile(profile: Profile): Promise<void> {
    await this.db.put(STORES.profile, serializeProfile(profile), PROFILE_KEY);
  }

  // --------------------------------------------------------------------- meta

  async getMeta<T>(key: string, schema: z.ZodMiniType<T>): Promise<T | undefined> {
    const raw = await this.db.get(STORES.meta, key);
    if (raw === undefined) return undefined;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      this.log.warn(`Meta "${key}" inválida; ignorando`, parsed.error.message);
      return undefined;
    }
    return parsed.data;
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    await this.db.put(STORES.meta, value, key);
  }

  async deleteMeta(key: string): Promise<void> {
    await this.db.delete(STORES.meta, key);
  }

  // ----------------------------------------------------------- fila de sync

  /** Fila persistente de pendências de sincronização. */
  readonly outbox: OutboxStore = {
    list: async () => (await this.db.getAll(STORES.outbox)) as OutboxEntry[],
    put: (entry) => this.db.put(STORES.outbox, entry),
    remove: (key) => this.db.delete(STORES.outbox, key),
  };

  // ------------------------------------------------------------------ álbum

  async listPhotos(): Promise<PhotoRecord[]> {
    const all = (await this.db.getAll(STORES.photos)) as StoredPhoto[];
    return all.map(fromStoredPhoto).sort((a, b) => b.createdAt - a.createdAt);
  }

  async getPhoto(id: string): Promise<PhotoRecord | undefined> {
    const stored = (await this.db.get(STORES.photos, id)) as StoredPhoto | undefined;
    return stored && fromStoredPhoto(stored);
  }

  async savePhoto(photo: PhotoRecord): Promise<void> {
    await this.db.put(STORES.photos, await toStoredPhoto(photo));
  }

  async deletePhoto(id: string): Promise<void> {
    await this.db.delete(STORES.photos, id);
  }

  // ------------------------------------------------- backups / versões antigas

  async addBackup(record: Omit<BackupRecord, 'id' | 'savedAt'>): Promise<void> {
    try {
      await this.db.add(STORES.backups, { ...record, savedAt: this.now() });
    } catch (error) {
      this.log.error('Não foi possível guardar o backup', error);
    }
  }

  async listBackups(): Promise<BackupRecord[]> {
    const all = (await this.db.getAll(STORES.backups)) as BackupRecord[];
    return all.sort((a, b) => b.savedAt - a.savedAt);
  }

  async deleteBackup(id: number): Promise<void> {
    await this.db.delete(STORES.backups, id);
  }

  /** Mantém só os `keep` backups mais recentes de cada chave. */
  async pruneBackups(keep: number): Promise<void> {
    const all = await this.listBackups();
    const seen = new Map<string, number>();
    for (const b of all) {
      const tag = `${b.kind}:${b.key}`;
      const count = (seen.get(tag) ?? 0) + 1;
      seen.set(tag, count);
      if (count > keep && b.id !== undefined) await this.deleteBackup(b.id);
    }
  }
}

function keyOf(raw: unknown): string {
  if (typeof raw === 'object' && raw !== null && 'id' in raw) {
    const id = raw.id;
    if (typeof id === 'string') return id;
  }
  return 'desconhecido';
}

function isRoomIdLike(key: string): key is RoomId {
  return (ROOM_IDS as readonly string[]).includes(key);
}

/** Pede ao navegador para não apagar os dados (importante no iOS). */
export async function requestPersistentStorage(log: Logger): Promise<boolean> {
  try {
    if (!('storage' in navigator) || typeof navigator.storage.persist !== 'function') return false;
    if (await navigator.storage.persisted()) return true;
    const granted = await navigator.storage.persist();
    log.info(`Armazenamento persistente: ${granted ? 'concedido' : 'negado'}`);
    return granted;
  } catch (error) {
    log.warn('Não foi possível pedir armazenamento persistente', error);
    return false;
  }
}
