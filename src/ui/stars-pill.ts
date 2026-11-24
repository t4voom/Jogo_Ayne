import type { Progression } from '../app/progression';
import type { Store } from '../state/store';
import { h, icon } from './dom';

/** Contador de estrelinhas no topo, com "+N" saltitante ao ganhar. */
export function createStarsPill(
  store: Store,
  progression: Progression,
  onClick?: () => void,
): { el: HTMLElement; destroy: () => void } {
  const value = h('span', { class: 'stars-value', text: String(progression.stars) });
  const el = h(
    'button',
    {
      class: 'stars-pill',
      attrs: { type: 'button', 'aria-label': `${progression.stars} estrelinhas` },
      on: {
        click: () => {
          onClick?.();
        },
      },
    },
    icon('starFill', 'icon stars-icon'),
    value,
  );
  let shown = progression.stars;
  const render = () => {
    const now = progression.stars;
    if (now === shown) return;
    const diff = now - shown;
    shown = now;
    value.textContent = String(now);
    el.setAttribute('aria-label', `${now} estrelinhas`);
    el.classList.remove('is-bump');
    void el.getBoundingClientRect();
    el.classList.add('is-bump');
    if (diff > 0) {
      const chip = h('span', { class: 'stars-plus', text: `+${diff}` });
      el.append(chip);
      window.setTimeout(() => chip.remove(), 1200);
    }
  };
  const unsubscribe = store.subscribe((e) => {
    if (e.type === 'profile') render();
  });
  return { el, destroy: unsubscribe };
}
