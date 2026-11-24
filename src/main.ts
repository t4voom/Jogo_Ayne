import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/dancing-script/latin-700.css';
import './ui/styles/tokens.css';
import './ui/styles/base.css';

import { createLogger, logHub } from './core/log';
import { showFatalError } from './ui/fatal-error';
import { installGlobalErrorHandlers } from './ui/global-errors';
import { setupPwa } from './ui/pwa';

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

function boot(): void {
  installGlobalErrorHandlers();
  const app = document.getElementById('app');
  if (!app) throw new Error('Elemento #app não encontrado');

  const title = document.createElement('h1');
  title.textContent = 'O Castelo da Aynebrenda';
  title.style.cssText =
    'font-family:var(--font-display);color:var(--color-primary-strong);font-size:var(--fs-display);text-align:center;margin-top:30vh';
  app.append(title);
  hideBootScreen();
  setupPwa();
  log.info('Castelo pronto');
}

try {
  boot();
} catch (error) {
  log.error('Falha ao iniciar', error);
  showFatalError(error);
}
