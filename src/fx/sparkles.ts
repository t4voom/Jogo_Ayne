import './fx.css';

const COLORS = ['#fff6c9', '#ffd6ea', '#f9b8d4', '#e0cffb', '#ffffff', '#ffe08a'];

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Explosão de brilhinhos (estrelas de 4 pontas) num ponto da tela. Só CSS
 * (transform/opacity), sem canvas: barato e nítido.
 */
export function sparkleBurst(
  clientX: number,
  clientY: number,
  options: { count?: number; spread?: number; colors?: readonly string[] } = {},
): void {
  if (reducedMotion()) return;
  const count = options.count ?? 12;
  const spread = options.spread ?? 70;
  const colors = options.colors ?? COLORS;
  const layer = document.createElement('div');
  layer.className = 'fx-layer';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = i % 3 === 0 ? 'fx-dot' : 'fx-star';
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const dist = spread * (0.45 + Math.random() * 0.65);
    s.style.left = `${clientX}px`;
    s.style.top = `${clientY}px`;
    s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    s.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    s.style.setProperty('--size', `${8 + Math.random() * 12}px`);
    s.style.setProperty('--rot', `${Math.random() * 180}deg`);
    s.style.setProperty('--delay', `${Math.random() * 80}ms`);
    s.style.setProperty('--color', colors[i % colors.length] ?? '#fff');
    layer.append(s);
  }
  document.body.append(layer);
  window.setTimeout(() => layer.remove(), 1100);
}

/** Pequena nuvem de "puf" ao excluir. */
export function poof(clientX: number, clientY: number): void {
  sparkleBurst(clientX, clientY, {
    count: 8,
    spread: 46,
    colors: ['#ffffff', '#f3e6ef', '#e9dcf5'],
  });
}
