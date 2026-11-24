import { circle, ellipse, fs, gem, heart, path, pearl, rect, st } from '../kit';
import { FIXED, type Ramp } from '../palette';

/**
 * Peças de desenho compartilhadas pelos pacotes de arte (pés dourados,
 * gavetas, coroinhas, babados…). Mantêm o estilo coeso entre os 100+ itens.
 */

export const GOLD = FIXED.gold;
export const goldFill = (w = 2) => fs('url(#k-gold)', GOLD.line, w);

/** Coroa dourada pequena (remate de móveis). */
export function crownTop(cx: number, cy: number, s: number): string {
  const d = `M${cx - 14 * s} ${cy + 8 * s} L${cx - 16 * s} ${cy - 6 * s} L${cx - 7 * s} ${cy + 1 * s} L${cx} ${cy - 10 * s} L${cx + 7 * s} ${cy + 1 * s} L${cx + 16 * s} ${cy - 6 * s} L${cx + 14 * s} ${cy + 8 * s}Z`;
  return (
    path(d, fs('url(#k-gold)', GOLD.line, 2 * s)) +
    circle(cx, cy - 11 * s, 2.6 * s, { fill: '#fff', stroke: GOLD.line, 'stroke-width': s }) +
    circle(cx - 16 * s, cy - 7 * s, 2 * s, { fill: '#fff' }) +
    circle(cx + 16 * s, cy - 7 * s, 2 * s, { fill: '#fff' })
  );
}

/** Babado ondulado entre x0 e x1. */
export function scallops(x0: number, x1: number, y: number, n: number, depth: number): string {
  const step = (x1 - x0) / n;
  let d = `M${x0} ${y}`;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * step;
    d += ` Q${a + step / 2} ${y + depth} ${a + step} ${y}`;
  }
  return d;
}

/** Pé curvo dourado (de x,y descendo `h`, curvando para `dir`). */
export function goldLeg(x: number, y: number, h: number, dir: -1 | 1, w = 7): string {
  const d = `M${x} ${y} Q${x - dir * 2} ${y + h * 0.6} ${x + dir * (h * 0.28)} ${y + h}`;
  return path(d, st(GOLD.line, w)) + path(d, st('#f6d27a', w * 0.55));
}

/** Pé reto de madeira clara. */
export function woodLeg(x: number, y: number, h: number, w = 7): string {
  const d = `M${x} ${y} L${x} ${y + h}`;
  return path(d, st(FIXED.wood.line, w)) + path(d, st(FIXED.wood.base, w * 0.55));
}

/** Gaveta com puxador de coração dourado. */
export function drawer(
  x: number,
  y: number,
  w: number,
  h: number,
  c: Ramp,
  knob: 'heart' | 'gem' = 'heart',
): string {
  return (
    rect(x, y, w, h, Math.min(8, h / 3), fs(c.light, c.line, 2)) +
    path(`M${x + 6} ${y + h - 4} L${x + w - 6} ${y + h - 4}`, st(c.shade, 2, 0.5)) +
    (knob === 'heart'
      ? heart(x + w / 2, y + h / 2, Math.min(6, h / 4), fs('url(#k-gold)', GOLD.line, 1.3))
      : gem(x + w / 2, y + h / 2, Math.min(4.5, h / 5), GOLD.base, GOLD.line))
  );
}

/** Corpo de armário: tampo + caixa com faixa de sombra. */
export function cabinet(x: number, y: number, w: number, h: number, c: Ramp, top = true): string {
  return (
    (top ? rect(x - 6, y - 12, w + 12, 14, 7, fs(c.light, c.line, 2.5)) : '') +
    rect(x, y, w, h, 10, fs(c.base, c.line, 3)) +
    rect(x + 2, y + 2, w - 4, 10, 5, { fill: c.shade, opacity: 0.45 }) +
    path(`M${x + 8} ${y + 18} L${x + 8} ${y + h - 10}`, st(c.light, 3, 0.7))
  );
}

/** Almofadinha estofada (losango de capitonê). */
export function tufts(
  x0: number,
  y0: number,
  cols: number,
  rows: number,
  dx: number,
  dy: number,
  color: string,
): string {
  let out = '';
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const off = r % 2 === 0 ? 0 : dx / 2;
      if (r % 2 === 1 && k === cols - 1) continue;
      out += circle(x0 + k * dx + off, y0 + r * dy, 3.2, { fill: color });
    }
  }
  return out;
}

/** Vaso de planta (branco pérola com friso dourado e coraçãozinho). */
export function pot(cx: number, top: number, w: number, h: number, c: Ramp): string {
  const half = w / 2;
  return (
    path(
      `M${cx - half} ${top} L${cx + half} ${top} L${cx + half * 0.78} ${top + h - 6} Q${cx + half * 0.76} ${top + h} ${cx + half * 0.66} ${top + h} L${cx - half * 0.66} ${top + h} Q${cx - half * 0.76} ${top + h} ${cx - half * 0.78} ${top + h - 6}Z`,
      fs('#fffaf6', '#dcc6d3', 3),
    ) +
    rect(cx - half - 5, top - 7, w + 10, 13, 6.5, goldFill(2)) +
    heart(cx, top + h * 0.52, Math.min(9, w * 0.14), fs(c.base, c.line, 1.5)) +
    path(`M${cx - half * 0.6} ${top + 10} L${cx - half * 0.5} ${top + h - 8}`, st('#fff', 3, 0.8))
  );
}

/** Moldura dourada retangular arredondada. */
export function goldFrame(x: number, y: number, w: number, h: number, inner: string): string {
  return (
    rect(x, y, w, h, 10, goldFill(3)) +
    rect(x + 6, y + 6, w - 12, h - 12, 6, {
      fill: '#fff',
      stroke: GOLD.line,
      'stroke-width': 1.5,
    }) +
    inner +
    pearl(x + 8, y + 8, 4) +
    pearl(x + w - 8, y + 8, 4) +
    pearl(x + 8, y + h - 8, 4) +
    pearl(x + w - 8, y + h - 8, 4)
  );
}

/** Livro em pé (lombada). */
export function book(
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  line: string,
): string {
  return (
    rect(x, y, w, h, 2.5, fs(color, line, 1.6)) +
    path(
      `M${x + 2} ${y + 6} L${x + w - 2} ${y + 6} M${x + 2} ${y + h - 7} L${x + w - 2} ${y + h - 7}`,
      st('#fff1c2', 1.6, 0.9),
    )
  );
}

/** Pequena chama (com animação a-flicker). */
export function flame(cx: number, baseY: number, s = 1): string {
  return (
    `<g class="a-flicker">` +
    path(
      `M${cx} ${baseY - 22 * s} Q${cx + 8 * s} ${baseY - 10 * s} ${cx + 5 * s} ${baseY - 3 * s} Q${cx} ${baseY + 2 * s} ${cx - 5 * s} ${baseY - 3 * s} Q${cx - 8 * s} ${baseY - 10 * s} ${cx} ${baseY - 22 * s}Z`,
      { fill: 'url(#k-flame)' },
    ) +
    ellipse(cx, baseY - 6 * s, 2.2 * s, 4 * s, { fill: '#fff' }) +
    `</g>`
  );
}
