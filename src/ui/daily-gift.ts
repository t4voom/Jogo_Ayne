import type { Progression } from '../app/progression';
import { getItem } from '../catalog/items';
import { confetti } from '../fx/confetti';
import { h, icon } from './dom';
import { openSheet } from './sheet';

const CHEST = `<svg viewBox="0 0 200 170" aria-hidden="true" focusable="false">
  <ellipse cx="100" cy="160" rx="80" ry="9" fill="url(#k-shadow)"/>
  <g class="chest-glow"><ellipse cx="100" cy="70" rx="70" ry="34" fill="url(#k-glow)"/></g>
  <g class="chest-lid">
    <path d="M26 76 L34 32 Q100 6 166 32 L174 76Z" fill="#f9bad5" stroke="#cf6f9a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M60 72 L66 24 M140 72 L134 24" stroke="url(#k-gold-h)" stroke-width="8" stroke-linecap="round"/>
    <path d="M100 30 C88 22 80 30 86 38 L100 50 L114 38 C120 30 112 22 100 30Z" fill="url(#k-gold)" stroke="#c48a2c" stroke-width="2"/>
  </g>
  <rect x="20" y="76" width="160" height="76" rx="12" fill="#f9bad5" stroke="#cf6f9a" stroke-width="3"/>
  <rect x="20" y="76" width="160" height="14" rx="7" fill="url(#k-gold)" stroke="#c48a2c" stroke-width="2"/>
  <rect x="54" y="76" width="14" height="76" rx="4" fill="url(#k-gold)" stroke="#c48a2c" stroke-width="1.5"/>
  <rect x="132" y="76" width="14" height="76" rx="4" fill="url(#k-gold)" stroke="#c48a2c" stroke-width="1.5"/>
  <path d="M86 100 L114 100 L114 124 Q100 132 86 124Z" fill="url(#k-gold)" stroke="#c48a2c" stroke-width="2"/>
  <circle cx="100" cy="112" r="4" fill="#cf6f9a"/>
</svg>`;

/** Baú surpresa do dia: toca para abrir, chovem estrelinhas. */
export function openDailyGift(
  progression: Progression,
  onDone?: () => void,
  onOpen?: () => void,
): void {
  openSheet(
    (close) => {
      const chest = h('button', {
        class: 'gift-chest',
        html: CHEST,
        attrs: { type: 'button', 'aria-label': 'Abrir o baú surpresa' },
      });
      const title = h('h2', { class: 'sheet-title', text: 'Presente do dia 🎁' });
      const text = h('p', { class: 'sheet-text', text: 'Toque no baú para abrir!' });
      const actions = h('div', { class: 'sheet-actions' });
      chest.addEventListener(
        'click',
        () => {
          const reward = progression.openDaily();
          if (!reward) {
            close();
            return;
          }
          chest.classList.add('is-open');
          onOpen?.();
          chest.disabled = true;
          confetti();
          const item = reward.itemId ? getItem(reward.itemId) : undefined;
          title.textContent = reward.welcome
            ? 'Bem-vinda ao castelo! 👑'
            : 'Que presente lindo! ✨';
          text.replaceChildren(
            h(
              'span',
              { class: 'gift-stars' },
              icon('starFill', 'icon'),
              `+${reward.stars} estrelinhas`,
            ),
            reward.streak > 1
              ? h('span', { class: 'gift-streak', text: `${reward.streak} dias seguidos! 💖` })
              : '',
            item
              ? h('span', { class: 'gift-item', text: `E de surpresa: ${item.name} liberado!` })
              : '',
          );
          actions.replaceChildren(
            h('button', {
              class: 'btn btn-primary',
              text: 'Obrigada! 💕',
              attrs: { type: 'button' },
              on: { click: close },
            }),
          );
          actions.querySelector('button')?.focus();
        },
        { once: true },
      );
      return h('div', { class: 'gift' }, title, chest, text, actions);
    },
    { label: 'Presente do dia', ...(onDone ? { onClose: onDone } : {}) },
  );
}
