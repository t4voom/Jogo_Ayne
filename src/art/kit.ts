/**
 * Kit de desenho: pequenas funções que geram trechos de SVG no estilo do jogo
 * (formas arredondadas, contorno suave, sombra de base, brilho, ouro).
 * Todas devolvem strings de marcação confiável (nunca dados da jogadora).
 */

export type Attrs = Record<string, string | number | undefined>;

export function attrs(a: Attrs): string {
  return Object.entries(a)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}="${String(v)}"`)
    .join(' ');
}

export const path = (d: string, a: Attrs = {}): string => `<path d="${d}" ${attrs(a)}/>`;
export const circle = (cx: number, cy: number, r: number, a: Attrs = {}): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs(a)}/>`;
export const ellipse = (cx: number, cy: number, rx: number, ry: number, a: Attrs = {}): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${attrs(a)}/>`;
export const rect = (x: number, y: number, w: number, h: number, r = 0, a: Attrs = {}): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${attrs(a)}/>`;
export const g = (content: string, a: Attrs = {}): string => `<g ${attrs(a)}>${content}</g>`;

/** Preenchimento + contorno suave. */
export const fs = (fill: string, stroke: string, width = 3): Attrs => ({
  fill,
  stroke,
  'stroke-width': width,
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
});

/** Só contorno (linhas de detalhe). */
export const st = (stroke: string, width = 3, opacity?: number): Attrs => ({
  fill: 'none',
  stroke,
  'stroke-width': width,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  opacity,
});

/** Sombra macia de base (gradiente radial compartilhado). */
export const shadow = (cx: number, cy: number, rx: number, ry = rx * 0.14): string =>
  ellipse(cx, cy, rx, ry, { fill: 'url(#k-shadow)' });

/** Reflexo de brilho branco. */
export const shine = (d: string, opacity = 0.6): string =>
  path(d, { fill: '#fff', opacity, 'pointer-events': 'none' });

/** Estrelinha de 4 pontas. */
export function sparkle(cx: number, cy: number, r: number, fill = '#fff', a: Attrs = {}): string {
  const k = r * 0.28;
  return path(
    `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`,
    { fill, ...a },
  );
}

/** Coração centrado em (cx, cy) com largura ~2r. */
export function heart(cx: number, cy: number, r: number, a: Attrs = {}): string {
  const t = cy - r * 0.35;
  return path(
    `M${cx} ${cy + r * 0.9} C${cx - r * 1.4} ${cy + r * 0.1} ${cx - r * 1.1} ${t - r * 0.9} ${cx} ${t - r * 0.15} C${cx + r * 1.1} ${t - r * 0.9} ${cx + r * 1.4} ${cy + r * 0.1} ${cx} ${cy + r * 0.9}Z`,
    a,
  );
}

/** Pérola/gema com brilho. */
export function gem(cx: number, cy: number, r: number, fill: string, line: string): string {
  return (
    circle(cx, cy, r, fs(fill, line, Math.max(1.2, r * 0.25))) +
    circle(cx - r * 0.35, cy - r * 0.35, r * 0.32, { fill: '#fff', opacity: 0.9 })
  );
}

/** Pérola usando o gradiente compartilhado. */
export const pearl = (cx: number, cy: number, r: number): string =>
  circle(cx, cy, r, { fill: 'url(#k-pearl)', stroke: '#e7bcd0', 'stroke-width': r * 0.18 });

/** Flor de 5 pétalas. */
export function flower(cx: number, cy: number, r: number, petal: string, center: string): string {
  let out = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * (Math.PI / 180);
    out += circle(round(cx + Math.cos(a) * r * 0.62), round(cy + Math.sin(a) * r * 0.62), r * 0.5, {
      fill: petal,
    });
  }
  return out + circle(cx, cy, r * 0.36, { fill: center });
}

/** Rosa vista de cima (espiral). */
export function rose(
  cx: number,
  cy: number,
  r: number,
  base: string,
  shade: string,
  line: string,
): string {
  return g(
    circle(cx, cy, r, fs(base, line, r * 0.12)) +
      path(
        `M${cx - r * 0.55} ${cy + r * 0.1} Q${cx - r * 0.5} ${cy - r * 0.6} ${cx + r * 0.1} ${cy - r * 0.55} Q${cx + r * 0.65} ${cy - r * 0.35} ${cx + r * 0.5} ${cy + r * 0.2}`,
        st(shade, r * 0.14),
      ) +
      path(
        `M${cx - r * 0.25} ${cy + r * 0.05} Q${cx - r * 0.15} ${cy - r * 0.3} ${cx + r * 0.15} ${cy - r * 0.15} Q${cx + r * 0.3} ${cy + r * 0.1} ${cx} ${cy + r * 0.25}`,
        st(shade, r * 0.12),
      ) +
      path(
        `M${cx - r * 0.75} ${cy + r * 0.35} Q${cx} ${cy + r * 0.95} ${cx + r * 0.75} ${cy + r * 0.35}`,
        st(shade, r * 0.12, 0.7),
      ),
  );
}

/** Folha simples apontando no ângulo `deg`. */
export function leaf(
  x: number,
  y: number,
  len: number,
  deg: number,
  fill: string,
  line: string,
): string {
  const w = len * 0.42;
  return path(`M0 0 Q${len * 0.5} ${-w} ${len} 0 Q${len * 0.5} ${w} 0 0Z`, {
    ...fs(fill, line, len * 0.06),
    transform: `translate(${x} ${y}) rotate(${deg})`,
  });
}

export function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Mistura duas cores hex (t=0 → a, t=1 → b). */
export function mix(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const c = pa.map((v, i) => Math.round(v + ((pb[i] ?? 0) - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ];
}
