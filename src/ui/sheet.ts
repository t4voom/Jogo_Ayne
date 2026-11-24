import { h } from './dom';

interface OpenSheet {
  readonly close: () => void;
  readonly dismissible: boolean;
}

const stack: OpenSheet[] = [];

/** Fecha o modal do topo (botão voltar do Android). */
export function closeTopSheet(): boolean {
  const top = stack.at(-1);
  if (!top?.dismissible) return top !== undefined;
  top.close();
  return true;
}

export interface SheetOptions {
  readonly label: string;
  readonly dismissible?: boolean;
  readonly className?: string;
  readonly onClose?: () => void;
}

export interface SheetHandle {
  readonly el: HTMLElement;
  close(): void;
}

const FOCUSABLE =
  'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

/** Modal em "folha" com foco preso, Esc e toque fora para fechar. */
export function openSheet(
  build: (close: () => void) => HTMLElement,
  options: SheetOptions,
): SheetHandle {
  const dismissible = options.dismissible ?? true;
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    const i = stack.indexOf(entry);
    if (i >= 0) stack.splice(i, 1);
    document.removeEventListener('keydown', onKey, true);
    backdrop.classList.add('is-leaving');
    window.setTimeout(() => backdrop.remove(), 220);
    previous?.focus({ preventScroll: true });
    sheet.firstElementChild?.dispatchEvent(new Event('sheet-closed'));
    options.onClose?.();
  };
  const sheet = h('div', {
    class: `sheet ${options.className ?? ''}`.trim(),
    attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': options.label },
  });
  sheet.append(build(close));
  const backdrop = h('div', { class: 'sheet-backdrop' }, sheet);
  backdrop.addEventListener('pointerdown', (e) => {
    if (e.target === backdrop && dismissible) close();
  });
  const onKey = (e: KeyboardEvent) => {
    if (stack.at(-1) !== entry) return;
    if (e.key === 'Escape' && dismissible) {
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') {
      const items = [...sheet.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  const entry: OpenSheet = { close, dismissible };
  stack.push(entry);
  document.addEventListener('keydown', onKey, true);
  document.body.append(backdrop);
  const autofocus =
    sheet.querySelector<HTMLElement>('[autofocus], input') ??
    sheet.querySelector<HTMLElement>(FOCUSABLE);
  autofocus?.focus({ preventScroll: true });
  return { el: sheet, close };
}

/** Pergunta de sim/não bonitinha. */
export function confirmSheet(options: {
  title: string;
  message: string;
  confirm: string;
  cancel?: string;
  danger?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    let answered = false;
    openSheet(
      (close) => {
        const answer = (v: boolean) => {
          answered = true;
          resolve(v);
          close();
        };
        return h(
          'div',
          { class: 'confirm' },
          h('h2', { class: 'sheet-title', text: options.title }),
          h('p', { class: 'sheet-text', text: options.message }),
          h(
            'div',
            { class: 'sheet-actions' },
            h('button', {
              class: 'btn btn-secondary',
              text: options.cancel ?? 'Cancelar',
              attrs: { type: 'button' },
              on: { click: () => answer(false) },
            }),
            h('button', {
              class: `btn ${options.danger ? 'btn-danger' : 'btn-primary'}`,
              text: options.confirm,
              attrs: { type: 'button' },
              on: { click: () => answer(true) },
            }),
          ),
        );
      },
      {
        label: options.title,
        onClose: () => {
          if (!answered) resolve(false);
        },
      },
    );
  });
}
