import { registerSW } from 'virtual:pwa-register';
import { createLogger } from '../core/log';

const log = createLogger('pwa');

export interface PwaHooks {
  /** Uma versão nova foi baixada e está esperando; chame `update()` para aplicar. */
  onUpdateReady?: (update: () => Promise<void>) => void;
  onOfflineReady?: () => void;
}

/**
 * Registra o service worker (modo "prompt": a nova versão só entra quando a
 * jogadora toca em "atualizar", para nunca recarregar no meio da decoração).
 */
export function setupPwa(hooks: PwaHooks = {}): void {
  if (!('serviceWorker' in navigator)) {
    log.warn('Service worker indisponível neste navegador');
    return;
  }
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      log.info('Nova versão disponível');
      hooks.onUpdateReady?.(() => updateSW(true));
    },
    onOfflineReady() {
      log.info('Pronto para funcionar offline');
      hooks.onOfflineReady?.();
    },
    onRegisterError(error: unknown) {
      log.error('Falha ao registrar o service worker', error);
    },
  });
}
