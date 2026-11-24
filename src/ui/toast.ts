import { h, icon } from './dom';
import type { IconName } from './icons';
import './styles/toast.css';

export interface ToastOptions {
  icon?: IconName;
  /** ms; 0 = fica até tocar. */
  duration?: number;
  tone?: 'info' | 'love' | 'warn' | 'error';
  action?: { label: string; run: () => void };
}

/** Mensagens curtinhas no topo (pílulas). Uma de cada vez, em fila. */
export class Toaster {
  private readonly root: HTMLDivElement;
  private current: HTMLElement | null = null;
  private readonly queue: { text: string; options: ToastOptions }[] = [];

  constructor(parent: HTMLElement = document.body) {
    this.root = h('div', { class: 'toasts', attrs: { 'aria-live': 'polite', role: 'status' } });
    parent.append(this.root);
  }

  show(text: string, options: ToastOptions = {}): void {
    this.queue.push({ text, options });
    if (!this.current) this.next();
  }

  private next(): void {
    const entry = this.queue.shift();
    if (!entry) {
      this.current = null;
      return;
    }
    const { text, options } = entry;
    const toast = h(
      'div',
      { class: `toast toast-${options.tone ?? 'info'}` },
      options.icon ? icon(options.icon, 'icon toast-icon') : null,
      h('span', { class: 'toast-text', text }),
    );
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      toast.classList.add('is-leaving');
      window.setTimeout(() => {
        toast.remove();
        this.next();
      }, 260);
    };
    if (options.action) {
      const { label, run } = options.action;
      toast.append(
        h('button', {
          class: 'toast-action',
          text: label,
          attrs: { type: 'button' },
          on: {
            click: () => {
              run();
              close();
            },
          },
        }),
      );
    }
    toast.addEventListener('click', (e) => {
      if (!(e.target instanceof HTMLButtonElement)) close();
    });
    this.current = toast;
    this.root.append(toast);
    const duration = options.duration ?? 2600;
    if (duration > 0) window.setTimeout(close, duration);
  }
}
