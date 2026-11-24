import './fx.css';

const COLORS = ['#f9b8d4', '#e0cffb', '#b9def7', '#b5e7d0', '#fadc8e', '#ffffff', '#e86ea8'];

/** Chuva de confete (corações, estrelas e fitinhas) — só CSS. */
export function confetti(options: { count?: number; originY?: number } = {}): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const count = options.count ?? 70;
  const layer = document.createElement('div');
  layer.className = 'fx-layer';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    const kind = i % 3;
    s.className =
      kind === 0
        ? 'fx-confetti fx-heart'
        : kind === 1
          ? 'fx-confetti fx-star'
          : 'fx-confetti fx-ribbon';
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${(options.originY ?? -5) + Math.random() * 10}%`;
    s.style.setProperty('--color', COLORS[i % COLORS.length] ?? '#fff');
    s.style.setProperty('--size', `${10 + Math.random() * 12}px`);
    s.style.setProperty('--fall', `${70 + Math.random() * 40}vh`);
    s.style.setProperty('--drift', `${(Math.random() - 0.5) * 30}vw`);
    s.style.setProperty('--spin', `${(Math.random() - 0.5) * 900}deg`);
    s.style.setProperty('--delay', `${Math.random() * 400}ms`);
    s.style.setProperty('--dur', `${1800 + Math.random() * 1400}ms`);
    layer.append(s);
  }
  document.body.append(layer);
  window.setTimeout(() => layer.remove(), 4000);
}
