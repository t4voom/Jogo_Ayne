import { createLogger, describeError } from '../core/log';
import { showFatalError } from './fatal-error';

const log = createLogger('global');

/** Erros não tratados em sequência curta indicam um estado quebrado. */
const BURST_WINDOW_MS = 10_000;
const BURST_LIMIT = 3;

/**
 * Captura global: todo erro não tratado é registrado. Um erro isolado não
 * interrompe a brincadeira (o estado é salvo continuamente); uma rajada de
 * erros mostra a página amigável com o botão de recarregar.
 */
export function installGlobalErrorHandlers(onNonFatal?: (message: string) => void): void {
  const recent: number[] = [];

  const handle = (error: unknown): void => {
    log.error('Erro não tratado', error);
    const now = Date.now();
    recent.push(now);
    while (recent.length > 0 && (recent[0] ?? 0) < now - BURST_WINDOW_MS) recent.shift();
    if (recent.length >= BURST_LIMIT) {
      showFatalError(error);
    } else {
      onNonFatal?.(describeError(error));
    }
  };

  window.addEventListener('error', (event) => {
    // Erros de carregamento de recurso (img/script) chegam sem `error`.
    handle(event.error ?? event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    handle(event.reason);
  });
}
