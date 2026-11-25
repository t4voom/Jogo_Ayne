import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/dancing-script/latin-700.css';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/components.css';
import './ui/styles/cloud.css';

import { installSharedDefs } from './art/defs';
import { AudioEngine } from './audio/engine';
import { ArtRegistry } from './art/registry';
import { CONTA_DA_AYNE } from './content/carta';
import { LEGACY_ACCOUNT_ID, isAyneAccount, localDbName, type Session } from './core/account';
import { randomId } from './core/ids';
import { createLogger, logHub } from './core/log';
import type { Room, RoomId } from './core/model';
import { createProfile } from './core/profile';
import { createRoom } from './core/rooms';
import { PhotoStore } from './app/album';
import { Progression } from './app/progression';
import { setupSync } from './app/sync-wiring';
import { Autosaver } from './persistence/autosave';
import { LocalRepository, requestPersistentStorage } from './persistence/local-repository';
import { deviceStore, sessionStore } from './persistence/session-store';
import { fetchTransport } from './persistence/sheets-api';
import { GameActions } from './state/actions';
import { Store, type GameState } from './state/store';
import type { GameContext } from './ui/context';
import { showFatalError } from './ui/fatal-error';
import { installGlobalErrorHandlers } from './ui/global-errors';
import { Haptics } from './ui/haptics';
import { setupPwa } from './ui/pwa';
import { captureInstallPrompt } from './ui/install-banner';
import { installRewardFeedback } from './ui/reward-feedback';
import { Router, routeToHash, type Route, type Screen } from './ui/router';
import { createOpeningScreen } from './ui/screens/opening';
import { Toaster } from './ui/toast';

const log = createLogger('main');

logHub.addSink((e) => {
  // Em produção só erros vão para o console (diagnóstico pelo DevTools/CI).
  if (!import.meta.env.DEV && e.level !== 'error') return;
  const fn = e.level === 'error' ? console.error : e.level === 'warn' ? console.warn : console.info;
  fn(`[${e.scope}] ${e.message}`, e.detail ?? '');
});

function hideBootScreen(): void {
  const boot = document.getElementById('boot');
  if (!boot) return;
  boot.classList.add('is-done');
  window.setTimeout(() => {
    boot.remove();
  }, 600);
}

/** Este aparelho (o mesmo para todas as contas). */
function resolveDeviceId(): string {
  const known = deviceStore.get();
  if (known) return known;
  const id = randomId();
  deviceStore.set(id);
  return id;
}

/** Abre o banco local da conta; se o navegador não deixar, segue só em memória. */
async function openRepository(toast: Toaster, name: string): Promise<LocalRepository | null> {
  try {
    return await LocalRepository.open(indexedDB, { name });
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

  captureInstallPrompt();
  const toast = new Toaster();
  installGlobalErrorHandlers(() => {
    toast.show('Ops! Algo deu errado, mas seu castelo está salvo 💕', { tone: 'warn' });
  });
  installSharedDefs();

  // iOS: impede o zoom da página com pinça fora do palco.
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });

  // ------------------------------------------------------------ conta
  // Com a planilha configurada, cada pessoa entra com a própria conta e tem o
  // próprio castelo (e o próprio banco no aparelho). Sem planilha, joga-se
  // só neste aparelho, no castelo de sempre.
  const url = import.meta.env.VITE_SHEETS_API_URL?.trim() ?? '';
  const transport = url ? fetchTransport(url) : null;
  const deviceId = resolveDeviceId();
  let session: Session | null = transport ? sessionStore.load() : null;
  let justEntered = false;
  if (transport && !session) {
    hideBootScreen();
    const { runAuthScreen } = await import('./ui/screens/auth');
    session = await runAuthScreen(app, { transport, deviceId, contaDaAyne: CONTA_DA_AYNE });
    if (!sessionStore.save(session)) {
      toast.show(
        'Não consegui lembrar a sua conta neste navegador; vai pedir para entrar de novo.',
        {
          tone: 'warn',
        },
      );
    }
    justEntered = true;
  }
  const forAyne = session ? isAyneAccount(session, CONTA_DA_AYNE) : true;

  // ------------------------------------------------------------ dados
  const repo = await openRepository(toast, localDbName(session?.accountId ?? LEGACY_ACCOUNT_ID));
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
  const sound = new AudioEngine();
  const applySound = () => {
    const s = store.getState().profile.settings;
    sound.setMusic(s.music);
    sound.setSfx(s.sfx);
  };
  applySound();
  sound.installUnlock();
  store.subscribe((e) => {
    if (e.type === 'profile' && e.prev.settings !== e.next.settings) applySound();
  });

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
  const photos = new PhotoStore(repo);
  const cloud = await setupSync({
    store,
    repo,
    toast,
    photos,
    flushLocal: () => flushLocal(),
    transport,
    session,
    deviceId,
  });
  const progression = new Progression(store, () => cloud.deviceId, { forAyne });
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
        return createOpeningScreen(() => c.router.go({ name: 'map' }));
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
      case 'album': {
        const { createAlbumScreen } = await import('./ui/screens/album');
        return createAlbumScreen(c);
      }
      case 'map': {
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
    sound,
    router,
    newId: randomId,
    cloud,
    progression,
    photos,
    repo,
    ensureRoom,
    isRoomUnlocked,
    playerName: session?.nome ?? null,
    forAyne,
    saveNow: async () => {
      await flushLocal();
      if (!cloud.enabled) return;
      await Promise.race([
        cloud.engine.flushNow().catch(() => undefined),
        new Promise((r) => window.setTimeout(r, 4000)),
      ]);
    },
  };

  installRewardFeedback({ progression, toast, haptics, router, sound });
  router.onChange(() => {
    sound.play('page');
  });
  progression.evaluate();
  // Acabou de entrar: vai direto para o mapa (a abertura já foi a tela de entrar).
  if (justEntered) history.replaceState(null, '', routeToHash({ name: 'map' }));
  await router.start();
  hideBootScreen();
  if (justEntered && session) {
    toast.show(
      forAyne
        ? `Bem-vinda ao seu castelo, ${session.nome}! 👑`
        : `Boas-vindas, ${session.nome}! 👑`,
      { tone: 'love', icon: 'heart' },
    );
  }

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
