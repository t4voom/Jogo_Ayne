import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/dancing-script/latin-700.css';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/components.css';
import './ui/styles/cloud.css';

import { installSharedDefs } from './art/defs';
import { ArtRegistry } from './art/registry';
import { randomId } from './core/ids';
import { createLogger, logHub } from './core/log';
import type { Room, RoomId } from './core/model';
import { createProfile } from './core/profile';
import { createRoom } from './core/rooms';
import { Progression } from './app/progression';
import { setupSync } from './app/sync-wiring';
import { Autosaver } from './persistence/autosave';
import { LocalRepository, requestPersistentStorage } from './persistence/local-repository';
import { GameActions } from './state/actions';
import { Store, type GameState } from './state/store';
import type { GameContext } from './ui/context';
import { showFatalError } from './ui/fatal-error';
import { installGlobalErrorHandlers } from './ui/global-errors';
import { Haptics } from './ui/haptics';
import { setupPwa } from './ui/pwa';
import { installRewardFeedback } from './ui/reward-feedback';
import { Router, type Route, type Screen } from './ui/router';
import { createOpeningScreen } from './ui/screens/opening';
import { Toaster } from './ui/toast';

const log = createLogger('main');

if (import.meta.env.DEV) {
  logHub.addSink((e) => {
    const fn =
      e.level === 'error' ? console.error : e.level === 'warn' ? console.warn : console.info;
    fn(`[${e.scope}] ${e.message}`, e.detail ?? '');
  });
}

function hideBootScreen(): void {
  const boot = document.getElementById('boot');
  if (!boot) return;
  boot.classList.add('is-done');
  window.setTimeout(() => {
    boot.remove();
  }, 600);
}

/** Abre o banco local; se o navegador não deixar, segue só em memória. */
async function openRepository(toast: Toaster): Promise<LocalRepository | null> {
  try {
    return await LocalRepository.open();
  } catch (error) {
    log.error('IndexedDB indisponível; jogando sem salvar no aparelho', error);
    toast.show(
      'Não consegui salvar neste navegador 😢 Abra pelo Safari/Chrome normal (sem aba anônima).',
      {
        tone: 'warn',
        duration: 0,
      },
    );
    return null;
  }
}

async function boot(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) throw new Error('Elemento #app não encontrado');

  const toast = new Toaster();
  installGlobalErrorHandlers(() => {
    toast.show('Ops! Algo deu errado, mas seu castelo está salvo 💕', { tone: 'warn' });
  });
  installSharedDefs();

  // iOS: impede o zoom da página com pinça fora do palco.
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });

  // ------------------------------------------------------------ dados
  const repo = await openRepository(toast);
  const now = Date.now();
  const loaded = repo ? await repo.loadRooms() : { rooms: [], quarantined: [] };
  const profile = (repo ? await repo.loadProfile() : null) ?? createProfile(now);
  if (loaded.quarantined.length > 0) {
    toast.show('Recuperei seu castelo de um probleminha. Nada foi perdido 💕', { icon: 'restore' });
  }
  const rooms: Partial<Record<RoomId, Room>> = {};
  for (const r of loaded.rooms) rooms[r.id] = r;
  const initial: GameState = { rooms, profile, selection: null };

  const store = new Store(initial);
  const actions = new GameActions(store, randomId);
  const haptics = new Haptics(() => store.getState().profile.settings.haptics);
  const art = new ArtRegistry();

  // ------------------------------------------ salvamento automático local
  let flushLocal = (): Promise<void> => Promise.resolve();
  if (repo) {
    const autosaver = new Autosaver(repo, {
      onStatus: (status) => {
        if (status === 'error') {
          toast.show('Não consegui salvar no aparelho agora; vou tentar de novo.', {
            tone: 'warn',
          });
        }
      },
    });
    store.subscribe((event) => {
      if (event.type === 'room' && event.source !== 'load') autosaver.room(event.next);
      if (event.type === 'profile' && event.source !== 'load') autosaver.profile(event.next);
    });
    flushLocal = () => autosaver.flush();
    const flush = () => {
      void autosaver.flush();
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', flush);
    void requestPersistentStorage(log);
  }

  // ----------------------------------------- sincronização com a planilha
  const cloud = await setupSync({ store, repo, toast, flushLocal: () => flushLocal() });
  const progression = new Progression(store, () => cloud.deviceId);
  progression.attach();

  // ------------------------------------------------------------- telas
  const ensureRoom = (roomId: RoomId): Room => {
    const existing = store.getRoom(roomId);
    if (existing) return existing;
    const room = createRoom(roomId, randomId, Date.now());
    store.replaceRoom(room, 'load');
    return room;
  };
  const isRoomUnlocked = (roomId: RoomId) => progression.isRoomUnlocked(roomId);

  let ctx: GameContext | null = null;
  const loadScreen = async (route: Route): Promise<Screen> => {
    if (!ctx) throw new Error('Contexto ainda não criado');
    const c = ctx;
    switch (route.name) {
      case 'opening':
        return createOpeningScreen(async () => {
          if (c.cloud.shouldAskPin) {
            const { openPinDialog } = await import('./ui/pin-dialog');
            await openPinDialog(c.cloud, { canSkip: true });
          }
          await c.router.go({ name: 'map' });
        });
      case 'room': {
        const { createRoomScreen } = await import('./ui/screens/room');
        return createRoomScreen(c, route.roomId);
      }
      case 'settings': {
        const { createSettingsScreen } = await import('./ui/screens/settings');
        return createSettingsScreen(c);
      }
      case 'achievements': {
        const { createAchievementsScreen } = await import('./ui/screens/achievements');
        return createAchievementsScreen(c);
      }
      case 'map':
      case 'album': {
        const { createMapScreen } = await import('./ui/screens/map');
        return createMapScreen(c);
      }
    }
  };
  const guard = (route: Route): Route =>
    route.name === 'room' && !isRoomUnlocked(route.roomId) ? { name: 'map' } : route;
  const router = new Router(app, loadScreen, guard);
  ctx = {
    store,
    actions,
    art,
    toast,
    haptics,
    router,
    newId: randomId,
    cloud,
    progression,
    repo,
    ensureRoom,
    isRoomUnlocked,
  };

  installRewardFeedback({ progression, toast, haptics, router });
  progression.evaluate();
  await router.start();
  hideBootScreen();

  setupPwa({
    onUpdateReady: (update) => {
      toast.show('Nova versão disponível — toque para atualizar', {
        icon: 'sparkle',
        tone: 'love',
        duration: 0,
        action: {
          label: 'Atualizar',
          run: () => {
            void update();
          },
        },
      });
    },
  });
  // Pré-carrega a arte em segundo plano para a primeira abertura de cômodo ser instantânea.
  window.setTimeout(() => {
    void import('./ui/screens/room');
    void art.loadMany(['moveis', 'decoracao', 'plantas', 'bichinhos', 'externos']);
  }, 1500);
  log.info('Castelo pronto');
}

boot().catch((error: unknown) => {
  log.error('Falha ao iniciar', error);
  showFatalError(error);
});
