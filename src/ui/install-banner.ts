import { h, icon } from './dom';
import { openSheet } from './sheet';
import './styles/install.css';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'castelo:install-dismissed-at';
const DISMISS_DAYS = 7;

let deferred: BeforeInstallPromptEvent | null = null;

/** Captura cedo o convite de instalação do Chrome/Android. */
export function captureInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    document.querySelector('.install-banner')?.remove();
  });
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function rememberDismiss(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Sem armazenamento (aba anônima): o banner volta da próxima vez, tudo bem.
  }
}

/** Passo a passo do iPhone (Safari não tem botão de instalar). */
function openIosSteps(): void {
  openSheet(
    (close) =>
      h(
        'div',
        { class: 'install-steps' },
        h('h2', { class: 'sheet-title', text: 'Instalar no iPhone 👑' }),
        h(
          'ol',
          { class: 'install-list' },
          h(
            'li',
            {},
            h('span', { class: 'install-num', text: '1' }),
            'Abra este site no ',
            h('strong', { text: 'Safari' }),
            '.',
          ),
          h(
            'li',
            {},
            h('span', { class: 'install-num', text: '2' }),
            'Toque em ',
            h('span', { class: 'install-chip' }, icon('share'), 'Compartilhar'),
            ' (embaixo ou no topo).',
          ),
          h(
            'li',
            {},
            h('span', { class: 'install-num', text: '3' }),
            'Escolha ',
            h('span', { class: 'install-chip' }, icon('plus'), 'Adicionar à Tela de Início'),
            '.',
          ),
          h(
            'li',
            {},
            h('span', { class: 'install-num', text: '4' }),
            'Abra pela coroa 👑 na tela inicial: fica em tela cheia, como um app.',
          ),
        ),
        h(
          'div',
          { class: 'sheet-actions' },
          h('button', {
            class: 'btn btn-primary',
            text: 'Entendi 💕',
            attrs: { type: 'button' },
            on: { click: close },
          }),
        ),
      ),
    { label: 'Como instalar no iPhone' },
  );
}

/**
 * Banner que ensina a instalar — só fora do modo app (standalone), com
 * botão de verdade no Android e passo a passo no iPhone.
 */
export function maybeShowInstallBanner(parent: HTMLElement): void {
  if (isStandalone() || dismissedRecently() || document.querySelector('.install-banner')) return;
  const ios = isIos();
  if (!ios && !deferred) return;
  const banner = h(
    'aside',
    { class: 'install-banner glass', attrs: { 'aria-label': 'Instalar o jogo' } },
    h('span', { class: 'install-crown', attrs: { 'aria-hidden': 'true' }, text: '👑' }),
    h(
      'span',
      { class: 'install-text' },
      h('strong', { text: 'Leve o castelo para a tela inicial' }),
      h('small', {
        text: ios ? 'Abre em tela cheia e funciona sem internet' : 'Instale como um app, rapidinho',
      }),
    ),
    h('button', {
      class: 'btn btn-primary install-go',
      text: ios ? 'Como?' : 'Instalar',
      attrs: { type: 'button' },
      on: {
        click: () => {
          if (ios) {
            openIosSteps();
            return;
          }
          const ev = deferred;
          if (!ev) return;
          void ev.prompt().then(async () => {
            const choice = await ev.userChoice;
            if (choice.outcome === 'accepted') banner.remove();
            deferred = null;
          });
        },
      },
    }),
    h(
      'button',
      {
        class: 'install-close',
        attrs: { type: 'button', 'aria-label': 'Agora não' },
        on: {
          click: () => {
            rememberDismiss();
            banner.classList.add('is-leaving');
            window.setTimeout(() => banner.remove(), 260);
          },
        },
      },
      icon('close'),
    ),
  );
  parent.append(banner);
}
