import { CARTA, PLACEHOLDER } from '../content/carta';
import { confetti } from '../fx/confetti';
import { h } from './dom';
import { openSheet } from './sheet';

/** A carta surpresa: envelope abre, o papel sobe e o texto aparece. */
export function openLetter(onOpened?: () => void): void {
  openSheet(
    (close) => {
      const paper = h(
        'article',
        { class: 'letter-paper' },
        h('h2', { class: 'letter-title', text: CARTA.titulo }),
        ...CARTA.paragrafos.map((p, i) =>
          h('p', { class: 'letter-p', text: p, style: { '--i': String(i) } }),
        ),
        h('p', {
          class: 'letter-sign',
          text: CARTA.assinatura,
          style: { '--i': String(CARTA.paragrafos.length) },
        }),
        PLACEHOLDER
          ? h('p', {
              class: 'letter-note',
              text: '(Esta carta ainda está sendo escrita pelo Gustavo 💌)',
            })
          : '',
      );
      const envelope = h(
        'button',
        { class: 'letter-envelope', attrs: { type: 'button', 'aria-label': 'Abrir a carta' } },
        h('span', { class: 'env-back' }),
        h('span', { class: 'env-flap' }),
        h('span', { class: 'env-front' }),
        h('span', { class: 'env-seal', text: '💖' }),
      );
      const wrap = h(
        'div',
        { class: 'letter' },
        h('p', { class: 'letter-hint', text: 'Uma carta para você 💌 Toque para abrir' }),
        envelope,
        paper,
        h('button', {
          class: 'btn btn-secondary letter-close',
          text: 'Fechar',
          attrs: { type: 'button' },
          on: { click: close },
        }),
      );
      envelope.addEventListener(
        'click',
        () => {
          wrap.classList.add('is-open');
          confetti({ count: 50 });
          onOpened?.();
        },
        { once: true },
      );
      return wrap;
    },
    { label: 'Carta surpresa', className: 'letter-sheet' },
  );
}
