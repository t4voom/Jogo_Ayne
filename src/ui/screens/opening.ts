import { roomBackgroundSvg } from '../../art/rooms';
import { createRoom } from '../../core/rooms';
import { h, icon } from '../dom';
import type { Screen } from '../router';
import '../styles/opening.css';

const CROWN_URL = `${import.meta.env.BASE_URL}icons/crown.svg`;

/** Estrelinhas espalhadas (posições fixas para ficar sempre bonito). */
const STARS: readonly [number, number, number, number][] = [
  [8, 10, 10, 0],
  [22, 22, 6, 1.2],
  [84, 8, 12, 0.4],
  [70, 18, 7, 2],
  [92, 30, 6, 0.8],
  [14, 36, 7, 1.6],
  [50, 6, 8, 2.4],
  [38, 16, 5, 0.6],
  [62, 30, 5, 1.9],
  [4, 52, 6, 2.8],
];

/** Céu, estrelinhas e o castelo ao entardecer (fundo da abertura e da tela de entrar). */
export function openingBackdrop(): HTMLElement[] {
  const scene = h('div', {
    class: 'opening-scene',
    html: roomBackgroundSvg({ ...createRoom('fachada', () => 'x', 0), ambience: 'entardecer' }),
  });
  const stars = h(
    'div',
    { class: 'opening-stars', attrs: { 'aria-hidden': 'true' } },
    ...STARS.map(([x, y, s, d]) =>
      h('span', {
        class: 'opening-star',
        style: { left: `${x}%`, top: `${y}%`, '--s': `${s}px`, 'animation-delay': `${d}s` },
      }),
    ),
  );
  return [scene, stars];
}

/** Coroa brilhando + título "O Castelo da Aynebrenda". */
export function openingHeader(subtitle: string): HTMLElement {
  const crown = h(
    'div',
    { class: 'opening-crown', attrs: { 'aria-hidden': 'true' } },
    h('span', { class: 'opening-crown-glow' }),
    h('img', { attrs: { src: CROWN_URL, alt: '', width: 120, height: 120, draggable: 'false' } }),
    h('span', { class: 'opening-sparkle s1' }),
    h('span', { class: 'opening-sparkle s2' }),
    h('span', { class: 'opening-sparkle s3' }),
  );
  return h(
    'div',
    { class: 'opening-content' },
    crown,
    h(
      'h1',
      { id: 'opening-title', class: 'opening-title' },
      h('span', { class: 'opening-title-small', text: 'O Castelo da' }),
      h('span', { class: 'opening-title-name', text: 'Aynebrenda' }),
    ),
    h('p', { class: 'opening-subtitle', text: subtitle }),
  );
}

export function createOpeningScreen(onEnter: () => void | Promise<void>): Screen {
  const enter = h(
    'button',
    {
      class: 'btn btn-primary opening-enter',
      attrs: { type: 'button' },
      on: {
        click: () => {
          void onEnter();
        },
      },
    },
    icon('castle'),
    h('span', { text: 'Entrar no castelo' }),
  );
  const el = h(
    'main',
    { class: 'opening', attrs: { 'aria-labelledby': 'opening-title' } },
    ...openingBackdrop(),
    openingHeader('Decore cada cantinho do seu reino ✨'),
    h(
      'div',
      { class: 'opening-bottom' },
      enter,
      h(
        'p',
        { class: 'opening-footer' },
        'Feito com ',
        h('span', { class: 'opening-heart', text: '💖' }),
        ' pelo Gustavo',
      ),
    ),
  );
  return {
    el,
    mounted() {
      enter.focus({ preventScroll: true });
    },
    destroy() {
      el.remove();
    },
  };
}
