import { confetti } from '../fx/confetti';
import { h } from './dom';
import './styles/tutorial.css';

/** Fadinha guia (SVG próprio). */
export const FAIRY_SVG = `<svg viewBox="0 0 160 180" aria-hidden="true" focusable="false">
  <g class="fairy-wings">
    <ellipse cx="52" cy="78" rx="34" ry="22" fill="#e6f4ff" stroke="#b9dcf5" stroke-width="2.5" opacity=".9" transform="rotate(-30 52 78)"/>
    <ellipse cx="108" cy="78" rx="34" ry="22" fill="#e6f4ff" stroke="#b9dcf5" stroke-width="2.5" opacity=".9" transform="rotate(30 108 78)"/>
    <ellipse cx="58" cy="104" rx="20" ry="13" fill="#f3eaff" stroke="#cbb1f4" stroke-width="2" opacity=".9" transform="rotate(20 58 104)"/>
    <ellipse cx="102" cy="104" rx="20" ry="13" fill="#f3eaff" stroke="#cbb1f4" stroke-width="2" opacity=".9" transform="rotate(-20 102 104)"/>
  </g>
  <path d="M80 92 Q56 128 52 160 Q80 172 108 160 Q104 128 80 92Z" fill="#f9bad5" stroke="#cf6f9a" stroke-width="3" stroke-linejoin="round"/>
  <path d="M58 150 Q80 160 102 150" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
  <path d="M66 96 Q80 104 94 96 L92 108 Q80 112 68 108Z" fill="#f391bf" stroke="#cf6f9a" stroke-width="2"/>
  <circle cx="80" cy="62" r="28" fill="#fde7da" stroke="#e2bfae" stroke-width="2.5"/>
  <path d="M52 64 Q50 30 80 30 Q110 30 108 64 Q100 46 80 44 Q60 46 52 64Z" fill="#f2b05a" stroke="#d48d38" stroke-width="2"/>
  <circle cx="80" cy="26" r="11" fill="#f2b05a" stroke="#d48d38" stroke-width="2"/>
  <g class="fairy-blink"><circle cx="70" cy="64" r="4" fill="#4a2341"/><circle cx="90" cy="64" r="4" fill="#4a2341"/><circle cx="69" cy="62.5" r="1.4" fill="#fff"/><circle cx="89" cy="62.5" r="1.4" fill="#fff"/></g>
  <ellipse cx="64" cy="73" rx="5" ry="3" fill="#ff9ec4" opacity=".6"/>
  <ellipse cx="96" cy="73" rx="5" ry="3" fill="#ff9ec4" opacity=".6"/>
  <path d="M74 76 Q80 81 86 76" stroke="#c26a7f" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M72 18 L74 10 L78 16 L80 8 L82 16 L86 10 L88 18Z" fill="url(#k-gold)" stroke="#c48a2c" stroke-width="1.4"/>
  <path d="M112 118 L138 70" stroke="#c48a2c" stroke-width="4" stroke-linecap="round"/>
  <g class="fairy-star"><path d="M140 52 L144 63 L156 64 L147 71 L150 83 L140 76 L130 83 L133 71 L124 64 L136 63Z" fill="#fff1a8" stroke="#e0b14a" stroke-width="2" stroke-linejoin="round"/></g>
</svg>`;

export interface TutorialStep {
  readonly text: string;
  /** Elemento a destacar (ou null para o centro). */
  readonly target: () => Element | null;
}

/** Tutorial em passos com a fadinha; resolve quando termina ou é pulado. */
export function runTutorial(
  steps: readonly TutorialStep[],
  options: { onFinish: (skipped: boolean) => void },
): () => void {
  let index = 0;
  const spot = h('div', { class: 'tut-spot' });
  const text = h('p', { class: 'tut-text', attrs: { 'aria-live': 'polite' } });
  const dots = h('div', { class: 'tut-dots', attrs: { 'aria-hidden': 'true' } });
  const next = h('button', { class: 'btn btn-primary tut-next', attrs: { type: 'button' } });
  const skip = h('button', {
    class: 'btn btn-ghost tut-skip',
    text: 'Pular',
    attrs: { type: 'button' },
  });
  const card = h(
    'div',
    { class: 'tut-card' },
    h('span', { class: 'tut-fairy', html: FAIRY_SVG }),
    h('div', { class: 'tut-bubble' }, text, dots, h('div', { class: 'tut-actions' }, skip, next)),
  );
  const root = h(
    'div',
    {
      class: 'tutorial',
      attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Tutorial' },
    },
    spot,
    card,
  );

  const place = () => {
    const step = steps[index];
    if (!step) return;
    const target = step.target();
    const r = target?.getBoundingClientRect();
    if (r && r.width > 0) {
      const pad = 10;
      spot.style.left = `${r.left - pad}px`;
      spot.style.top = `${r.top - pad}px`;
      spot.style.width = `${r.width + pad * 2}px`;
      spot.style.height = `${r.height + pad * 2}px`;
      spot.classList.remove('is-hidden');
      // Cartão do lado oposto ao destaque.
      const below = r.top + r.height / 2 < window.innerHeight / 2;
      card.classList.toggle('at-bottom', below);
      card.classList.toggle('at-top', !below);
    } else {
      spot.classList.add('is-hidden');
      card.classList.remove('at-bottom', 'at-top');
    }
  };

  const show = () => {
    const step = steps[index];
    if (!step) return;
    text.textContent = step.text;
    dots.replaceChildren(...steps.map((_, i) => h('span', { class: i === index ? 'is-on' : '' })));
    next.textContent = index === steps.length - 1 ? 'Começar! ✨' : 'Próximo';
    card.classList.remove('is-changing');
    void card.getBoundingClientRect();
    card.classList.add('is-changing');
    place();
    next.focus({ preventScroll: true });
  };

  let finished = false;
  const finish = (skipped: boolean) => {
    if (finished) return;
    finished = true;
    window.removeEventListener('resize', place);
    root.classList.add('is-leaving');
    window.setTimeout(() => root.remove(), 300);
    if (!skipped) confetti({ count: 40 });
    options.onFinish(skipped);
  };

  next.addEventListener('click', () => {
    if (index < steps.length - 1) {
      index++;
      show();
    } else {
      finish(false);
    }
  });
  skip.addEventListener('click', () => {
    finish(true);
  });
  window.addEventListener('resize', place);
  document.body.append(root);
  show();
  return () => {
    finish(true);
  };
}
