import { createLogger } from '../core/log';
import type { LocalRepository, PhotoRecord } from '../persistence/local-repository';
import type { RemotePhoto } from '../persistence/sheets-api';

const log = createLogger('album');

/**
 * Fotos do álbum: guardadas no aparelho (IndexedDB) e espelhadas na planilha
 * só como miniatura. Fotos que vieram do outro aparelho têm `image = null`.
 */
export class PhotoStore {
  private readonly memory = new Map<string, PhotoRecord>();
  private readonly listeners = new Set<() => void>();

  constructor(private readonly repo: LocalRepository | null) {}

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private changed(): void {
    for (const l of this.listeners) l();
  }

  async list(): Promise<PhotoRecord[]> {
    if (this.repo) return this.repo.listPhotos();
    return [...this.memory.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  async get(id: string): Promise<PhotoRecord | undefined> {
    return this.repo ? this.repo.getPhoto(id) : this.memory.get(id);
  }

  async save(photo: PhotoRecord): Promise<void> {
    if (this.repo) await this.repo.savePhoto(photo);
    else this.memory.set(photo.id, photo);
    this.changed();
  }

  async remove(id: string): Promise<void> {
    if (this.repo) await this.repo.deletePhoto(id);
    else this.memory.delete(id);
    this.changed();
  }

  /** Para o sync: a miniatura de uma foto local. */
  async remote(id: string): Promise<RemotePhoto | null> {
    const p = await this.get(id);
    return p
      ? { photoId: p.id, roomId: p.roomId, createdAt: p.createdAt, thumbnail: p.thumbnail }
      : null;
  }

  /** Espelha o álbum da planilha: traz as fotos do outro aparelho. */
  async applyRemote(remote: readonly RemotePhoto[]): Promise<void> {
    try {
      const local = await this.list();
      const byId = new Map(local.map((p) => [p.id, p]));
      const remoteIds = new Set(remote.map((r) => r.photoId));
      let changed = false;
      for (const r of remote) {
        if (byId.has(r.photoId)) continue;
        const record: PhotoRecord = {
          id: r.photoId,
          roomId: r.roomId,
          createdAt: r.createdAt,
          image: null,
          thumbnail: r.thumbnail,
        };
        if (this.repo) await this.repo.savePhoto(record);
        else this.memory.set(record.id, record);
        changed = true;
      }
      // Fotos do outro aparelho que sumiram da planilha foram apagadas lá.
      for (const p of local) {
        if (p.image === null && !remoteIds.has(p.id)) {
          if (this.repo) await this.repo.deletePhoto(p.id);
          else this.memory.delete(p.id);
          changed = true;
        }
      }
      if (changed) this.changed();
    } catch (error) {
      log.error('Falha ao trazer fotos do outro aparelho', error);
    }
  }
}
