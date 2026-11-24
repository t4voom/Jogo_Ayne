import { randomId } from '../core/ids';
import { createLogger } from '../core/log';
import { roomInfo } from '../core/rooms';
import { balance } from '../progression/stars';
import { Cloud } from '../persistence/cloud';
import type { LocalRepository } from '../persistence/local-repository';
import { SheetsApi, fetchTransport } from '../persistence/sheets-api';
import {
  SyncEngine,
  type OutboxEntry,
  type OutboxStore,
  type SyncHost,
} from '../persistence/sync-engine';
import type { Store } from '../state/store';
import type { Toaster } from '../ui/toast';
import type { PhotoStore } from './album';

const log = createLogger('sync-wiring');

const PULL_EVERY_MS = 5 * 60_000;
const PULL_ON_RETURN_AFTER_MS = 30_000;

/** Fila em memória (quando o IndexedDB não está disponível). */
class MemoryOutbox implements OutboxStore {
  private readonly map = new Map<string, OutboxEntry>();
  list() {
    return Promise.resolve([...this.map.values()]);
  }
  put(e: OutboxEntry) {
    this.map.set(e.key, e);
    return Promise.resolve();
  }
  remove(key: string) {
    this.map.delete(key);
    return Promise.resolve();
  }
}

/**
 * Liga o motor de sync ao jogo: o store vira o "host", mudanças da jogadora
 * viram pendências, e eventos do navegador (online, segundo plano, voltar ao
 * app) disparam envio/busca.
 */
export async function setupSync(deps: {
  store: Store;
  repo: LocalRepository | null;
  toast: Toaster;
  photos: PhotoStore;
  flushLocal: () => Promise<void>;
}): Promise<Cloud> {
  const { store, repo, toast } = deps;
  const url = import.meta.env.VITE_SHEETS_API_URL?.trim() ?? '';
  const transport = url ? fetchTransport(url) : null;

  let lastNotice = 0;
  let futureWarned = false;
  const host: SyncHost = {
    getRoom: (id) => store.getRoom(id),
    applyRemoteRoom: (room) => {
      store.replaceRoom(room, 'remote');
    },
    setRoomRevision: (id, revision) => {
      store.setRoomRevision(id, revision);
    },
    getProfile: () => store.getState().profile,
    applyRemoteProfile: (profile) => {
      store.updateProfile(() => profile, 'remote');
    },
    starBalance: (profile) => balance(profile),
    backup: async (kind, key, data) => {
      await repo?.addBackup({ kind, key, reason: 'conflict', data });
      await repo?.pruneBackups(6);
    },
    remoteApplied: (kind, id, reason) => {
      const now = Date.now();
      if (now - lastNotice < 5_000) return;
      lastNotice = now;
      const what = kind === 'room' && id !== 'main' ? roomInfo(id as never).name : 'Seu progresso';
      toast.show(
        reason === 'conflict'
          ? `${what}: fiquei com a versão mais nova (a outra está em Configurações) ✨`
          : 'Atualizado do outro aparelho ✨',
        { icon: 'sparkle', tone: 'love' },
      );
    },
    getPhoto: (id) => deps.photos.remote(id),
    applyRemotePhotos: (list) => {
      void deps.photos.applyRemote(list);
    },
    futureVersion: () => {
      if (futureWarned) return;
      futureWarned = true;
      toast.show('O outro aparelho tem uma versão mais nova do jogo. Atualize este também ✨', {
        icon: 'info',
        duration: 6000,
      });
    },
  };

  const cloud = await Cloud.load(
    (credentials) =>
      new SyncEngine(
        transport ? new SheetsApi(transport, credentials) : null,
        host,
        repo?.outbox ?? new MemoryOutbox(),
      ),
    repo,
    transport,
    randomId,
  );
  const engine = cloud.engine;

  // Mudanças da jogadora → pendências.
  store.subscribe((event) => {
    if (event.type === 'room' && ['user', 'undo', 'redo', 'restore'].includes(event.source)) {
      engine.markRoomDirty(event.roomId);
    }
    if (event.type === 'profile' && (event.source === 'user' || event.source === 'restore')) {
      engine.markProfileDirty();
    }
  });

  if (!cloud.enabled) {
    await engine.start();
    return cloud;
  }

  let lastPull = Date.now();
  const pull = () => {
    lastPull = Date.now();
    void engine.pull().then(() => engine.flushNow());
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Grava no aparelho primeiro, depois tenta subir antes de o iOS congelar o app.
      void deps.flushLocal().then(() => engine.flushNow({ keepalive: true }));
    } else if (Date.now() - lastPull > PULL_ON_RETURN_AFTER_MS) {
      pull();
    }
  });
  window.addEventListener('pagehide', () => {
    void engine.flushNow({ keepalive: true });
  });
  window.addEventListener('online', () => {
    void engine.retryNow();
  });
  window.setInterval(() => {
    if (document.visibilityState === 'visible') pull();
  }, PULL_EVERY_MS);

  engine.start().catch((error: unknown) => {
    log.error('Falha ao iniciar a sincronização', error);
  });
  return cloud;
}
