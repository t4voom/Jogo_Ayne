import type { FloorPattern, InteriorDecor, WallPattern } from '../../core/model';
import { circle, ellipse, flower, fs, g, heart, mix, path, rect, st } from '../kit';
import { FIXED, PAINTS, type Paint } from '../palette';
import { seeded } from './random';

/**
 * Fundo de cômodo interno num viewBox 1000×1000: parede com padrão, rodapé e
 * moldura dourada, e chão desenhado EM PERSPECTIVA (linhas convergindo para um
 * ponto de fuga), tudo em SVG puro para exportar fotos sem perder nada.
 */

export const WALL_BOTTOM = 646;
const RAIL_Y = 470;
const BASE_Y = 616;
const HORIZON = 420;
const NEAR_Y = 1000;

// ------------------------------------------------------------------ parede

export function wallPattern(id: string, pattern: WallPattern, p: Paint): string {
  const pat = (w: number, h: number, body: string) =>
    `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${body}</pattern>`;
  switch (pattern) {
    case 'lisa':
      return '';
    case 'listras':
      return pat(
        64,
        64,
        rect(0, 0, 32, 64, 0, { fill: p.light, opacity: 0.85 }) +
          rect(31, 0, 2, 64, 0, { fill: p.accent, opacity: 0.35 }) +
          circle(48, 32, 2.2, { fill: p.accent, opacity: 0.35 }),
      );
    case 'bolinhas':
      return pat(
        64,
        64,
        circle(16, 16, 7, { fill: p.light, opacity: 0.95 }) +
          circle(48, 48, 7, { fill: p.light, opacity: 0.95 }) +
          circle(16, 16, 7, {
            fill: 'none',
            stroke: p.accent,
            'stroke-width': 1.2,
            opacity: 0.35,
          }) +
          circle(48, 48, 7, { fill: 'none', stroke: p.accent, 'stroke-width': 1.2, opacity: 0.35 }),
      );
    case 'coracoes':
      return pat(
        84,
        84,
        heart(21, 22, 9, { fill: p.accent, opacity: 0.45 }) +
          heart(63, 64, 9, { fill: p.light, opacity: 0.95 }) +
          circle(63, 22, 2, { fill: p.accent, opacity: 0.4 }) +
          circle(21, 64, 2, { fill: p.accent, opacity: 0.4 }),
      );
    case 'losangos':
      return pat(
        80,
        100,
        path('M40 0 L80 50 L40 100 L0 50Z', { fill: p.light, opacity: 0.8 }) +
          path('M40 0 L80 50 L40 100 L0 50Z', st(p.accent, 1.4, 0.4)) +
          circle(40, 0, 3, { fill: p.accent, opacity: 0.55 }) +
          circle(0, 50, 3, { fill: p.accent, opacity: 0.55 }) +
          circle(80, 50, 3, { fill: p.accent, opacity: 0.55 }) +
          circle(40, 100, 3, { fill: p.accent, opacity: 0.55 }),
      );
    case 'floral':
      return pat(
        110,
        110,
        g(flower(27, 27, 12, p.light, p.accent) + flower(82, 82, 12, p.light, p.accent)) +
          path('M42 34 Q50 30 54 38', st(FIXED.leaf.shade, 2, 0.5)) +
          path('M68 76 Q60 72 56 80', st(FIXED.leaf.shade, 2, 0.5)) +
          circle(82, 26, 2.5, { fill: p.accent, opacity: 0.45 }) +
          circle(26, 84, 2.5, { fill: p.accent, opacity: 0.45 }),
      );
    case 'damasco': {
      const motif = (cx: number, cy: number) =>
        path(
          `M${cx} ${cy - 46} C${cx + 14} ${cy - 30} ${cx + 30} ${cy - 22} ${cx + 30} ${cy} C${cx + 30} ${cy + 22} ${cx + 14} ${cy + 30} ${cx} ${cy + 46} C${cx - 14} ${cy + 30} ${cx - 30} ${cy + 22} ${cx - 30} ${cy} C${cx - 30} ${cy - 22} ${cx - 14} ${cy - 30} ${cx} ${cy - 46}Z`,
          { fill: p.shade, opacity: 0.45 },
        ) +
        path(
          `M${cx} ${cy - 26} C${cx + 10} ${cy - 12} ${cx + 12} ${cy} ${cx} ${cy + 26} C${cx - 12} ${cy} ${cx - 10} ${cy - 12} ${cx} ${cy - 26}Z`,
          { fill: p.light, opacity: 0.8 },
        ) +
        path(
          `M${cx - 30} ${cy} Q${cx - 46} ${cy - 18} ${cx - 40} ${cy - 34}`,
          st(p.shade, 3, 0.5),
        ) +
        path(
          `M${cx + 30} ${cy} Q${cx + 46} ${cy - 18} ${cx + 40} ${cy - 34}`,
          st(p.shade, 3, 0.5),
        ) +
        circle(cx, cy, 4, { fill: p.accent, opacity: 0.5 });
      return pat(120, 160, motif(60, 60) + motif(0, 140) + motif(120, 140));
    }
  }
}

function wall(decor: InteriorDecor, key: string): string {
  const p = PAINTS[decor.wallColor];
  const pid = `${key}-wp`;
  const defs = wallPattern(pid, decor.wallPattern, p);
  const lower = mix(p.base, p.shade, 0.35);
  let out = defs ? `<defs>${defs}</defs>` : '';
  out += rect(0, 0, 1000, WALL_BOTTOM, 0, { fill: p.base });
  if (defs) out += rect(0, 0, 1000, RAIL_Y, 0, { fill: `url(#${pid})` });
  // luz suave vinda do alto
  out += ellipse(500, 180, 620, 360, { fill: '#fff', opacity: 0.22 });
  // lambri (parte de baixo da parede)
  out += rect(0, RAIL_Y, 1000, BASE_Y - RAIL_Y, 0, { fill: lower });
  for (let x = 30; x < 1000; x += 190) {
    out += rect(x, RAIL_Y + 26, 150, 98, 14, { fill: p.base, opacity: 0.7 });
    out += rect(x, RAIL_Y + 26, 150, 98, 14, st(p.light, 3, 0.9));
    out += rect(x + 6, RAIL_Y + 32, 138, 86, 10, st(p.shade, 1.6, 0.5));
  }
  // moldura do lambri (chair rail)
  out += rect(0, RAIL_Y - 8, 1000, 16, 0, fs('#fffaf6', mix('#fffaf6', p.shade, 0.6), 2));
  out += rect(0, RAIL_Y - 1, 1000, 3, 0, { fill: 'url(#k-gold-h)' });
  // sanca dourada no teto
  out += rect(0, 0, 1000, 30, 0, { fill: '#fffaf6' });
  out += rect(0, 30, 1000, 6, 0, { fill: 'url(#k-gold-h)' });
  for (let x = 12; x < 1000; x += 36)
    out += rect(x, 8, 16, 14, 3, { fill: mix('#fffaf6', p.shade, 0.5) });
  // rodapé
  out += rect(
    0,
    BASE_Y,
    1000,
    WALL_BOTTOM - BASE_Y,
    0,
    fs('#fffaf6', mix('#fffaf6', p.shade, 0.7), 2),
  );
  out += rect(0, BASE_Y + 4, 1000, 3, 0, { fill: 'url(#k-gold-h)' });
  return out;
}

// -------------------------------------------------------------------- chão

/** y na tela para uma profundidade z (1 = borda de baixo). */
function yAt(z: number): number {
  return HORIZON + (NEAR_Y - HORIZON) / z;
}
const Z_FAR = (NEAR_Y - HORIZON) / (WALL_BOTTOM - HORIZON);

/** x na tela de uma linha que na borda de baixo está em `x0`. */
function xAt(x0: number, y: number): number {
  return 500 + (x0 - 500) * ((y - HORIZON) / (NEAR_Y - HORIZON));
}

function quad(x0: number, x1: number, za: number, zb: number): string {
  const ya = yAt(za);
  const yb = yAt(zb);
  const f = (n: number) => n.toFixed(1);
  return `M${f(xAt(x0, ya))} ${f(ya)} L${f(xAt(x1, ya))} ${f(ya)} L${f(xAt(x1, yb))} ${f(yb)} L${f(xAt(x0, yb))} ${f(yb)}Z`;
}

/** Linhas de x na borda de baixo que cobrem o chão inteiro até o fundo. */
function columns(step: number): number[] {
  const span = 500 / ((WALL_BOTTOM - HORIZON) / (NEAR_Y - HORIZON)) + step;
  const cols: number[] = [];
  for (let x = 500 - Math.ceil(span / step) * step; x <= 500 + span; x += step) cols.push(x);
  return cols;
}

function depths(rows: number): number[] {
  const zs: number[] = [];
  for (let i = 0; i <= rows; i++) zs.push(Z_FAR - ((Z_FAR - 1) * i) / rows);
  return zs; // do fundo (Z_FAR) para a frente (1)
}

const WOOD = {
  'madeira-clara': ['#f0d4b4', '#e8c6a2', '#f5dcc0', '#c99c74'],
  'madeira-rosa': ['#f0c3c6', '#e6aeb6', '#f6d2d4', '#c98993'],
} as const;

function woodFloor(kind: 'madeira-clara' | 'madeira-rosa', seed: number): string {
  const [a, b, c, line] = WOOD[kind];
  const tones = [a, b, c];
  const rnd = seeded(seed);
  const cols = columns(78);
  const zs = depths(10);
  let out = '';
  const rows = zs.length - 1;
  for (let j = 0; j < cols.length - 1; j++) {
    const x0 = cols[j] ?? 0;
    const x1 = cols[j + 1] ?? 0;
    // Tábuas de 3 linhas de comprimento, com emendas desencontradas por coluna.
    let from = 0;
    let to = 3 - ((j * 2) % 3);
    while (from < rows) {
      to = Math.min(rows, to);
      const za = zs[from] ?? 1;
      const zb = zs[to] ?? 1;
      const tone = tones[Math.floor(rnd() * tones.length)] ?? a;
      out += path(quad(x0, x1, za, zb), {
        fill: tone,
        stroke: line,
        'stroke-width': 1.4,
        'stroke-opacity': 0.55,
      });
      // veio da madeira
      const mid = x0 + (x1 - x0) * (0.3 + rnd() * 0.4);
      const ya = yAt(za);
      const yb = yAt(zb);
      out += path(
        `M${xAt(mid, ya).toFixed(1)} ${(ya + 4).toFixed(1)} L${xAt(mid, yb).toFixed(1)} ${(yb - 4).toFixed(1)}`,
        st(line, 1, 0.18),
      );
      from = to;
      to = from + 3;
    }
  }
  return out;
}

function checkerFloor(p: Paint): string {
  const cols = columns(110);
  const zs = depths(7);
  let out = rect(0, WALL_BOTTOM, 1000, NEAR_Y - WALL_BOTTOM, 0, { fill: '#fffaf6' });
  for (let j = 0; j < cols.length - 1; j++) {
    for (let i = 0; i < zs.length - 1; i++) {
      if ((i + j) % 2 === 0) continue;
      out += path(quad(cols[j] ?? 0, cols[j + 1] ?? 0, zs[i] ?? 1, zs[i + 1] ?? 1), {
        fill: p.base,
      });
    }
  }
  return out;
}

function tileFloor(p: Paint, seed: number): string {
  const rnd = seeded(seed);
  const cols = columns(62);
  const zs = depths(12);
  let out = rect(0, WALL_BOTTOM, 1000, NEAR_Y - WALL_BOTTOM, 0, { fill: '#ffffff' });
  for (let j = 0; j < cols.length - 1; j++) {
    for (let i = 0; i < zs.length - 1; i++) {
      const tone = rnd() < 0.5 ? p.base : p.light;
      out += path(quad((cols[j] ?? 0) + 3, (cols[j + 1] ?? 0) - 3, zs[i] ?? 1, zs[i + 1] ?? 1), {
        fill: tone,
      });
    }
  }
  return out;
}

function marbleFloor(p: Paint, seed: number): string {
  const rnd = seeded(seed);
  const cols = columns(200);
  const zs = depths(4);
  let out = rect(0, WALL_BOTTOM, 1000, NEAR_Y - WALL_BOTTOM, 0, { fill: p.light });
  for (let j = 0; j < cols.length - 1; j++) {
    for (let i = 0; i < zs.length - 1; i++) {
      out += path(quad(cols[j] ?? 0, cols[j + 1] ?? 0, zs[i] ?? 1, zs[i + 1] ?? 1), {
        fill: (i + j) % 2 === 0 ? p.light : mix(p.light, p.base, 0.55),
        stroke: '#fff',
        'stroke-width': 2,
      });
    }
  }
  // veios
  for (let k = 0; k < 9; k++) {
    const x = rnd() * 1000;
    const y = WALL_BOTTOM + 30 + rnd() * 300;
    const len = 80 + rnd() * 160;
    out += path(
      `M${x.toFixed(0)} ${y.toFixed(0)} q${(len * 0.3).toFixed(0)} ${(-10 - rnd() * 20).toFixed(0)} ${(len * 0.6).toFixed(0)} ${(rnd() * 16).toFixed(0)} t${(len * 0.4).toFixed(0)} ${(-8 + rnd() * 16).toFixed(0)}`,
      st(p.accent, 1.6 + rnd() * 1.6, 0.25),
    );
  }
  // reflexo brilhante
  out += ellipse(500, 820, 420, 90, { fill: '#fff', opacity: 0.28 });
  return out;
}

function carpetFloor(p: Paint, key: string): string {
  const pid = `${key}-carpet`;
  return (
    `<defs><pattern id="${pid}" width="14" height="10" patternUnits="userSpaceOnUse">${circle(3, 3, 1.4, { fill: p.shade, opacity: 0.35 })}${circle(10, 8, 1.2, { fill: p.light, opacity: 0.6 })}</pattern></defs>` +
    rect(0, WALL_BOTTOM, 1000, NEAR_Y - WALL_BOTTOM, 0, { fill: p.base }) +
    rect(0, WALL_BOTTOM, 1000, NEAR_Y - WALL_BOTTOM, 0, { fill: `url(#${pid})` }) +
    path(`M0 ${WALL_BOTTOM + 26} L1000 ${WALL_BOTTOM + 26}`, st(p.accent, 6, 0.35)) +
    path(`M0 ${WALL_BOTTOM + 40} L1000 ${WALL_BOTTOM + 40}`, st(p.light, 3, 0.8))
  );
}

export function floor(decor: InteriorDecor, key: string): string {
  const p = PAINTS[decor.floorColor];
  const pattern: FloorPattern = decor.floorPattern;
  let body: string;
  switch (pattern) {
    case 'madeira-clara':
    case 'madeira-rosa':
      body = woodFloor(pattern, 7);
      break;
    case 'xadrez':
      body = checkerFloor(p);
      break;
    case 'ladrilho':
      body = tileFloor(p, 11);
      break;
    case 'marmore':
      body = marbleFloor(p, 3);
      break;
    case 'carpete':
      body = carpetFloor(p, key);
      break;
  }
  const clip = `${key}-floor`;
  return (
    `<defs><clipPath id="${clip}">${rect(0, WALL_BOTTOM, 1000, NEAR_Y - WALL_BOTTOM)}</clipPath>` +
    `<linearGradient id="${key}-depth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2a4c" stop-opacity=".28"/><stop offset=".35" stop-color="#5a2a4c" stop-opacity=".06"/><stop offset="1" stop-color="#5a2a4c" stop-opacity="0"/></linearGradient></defs>` +
    g(body, { 'clip-path': `url(#${clip})` }) +
    rect(0, WALL_BOTTOM, 1000, NEAR_Y - WALL_BOTTOM, 0, { fill: `url(#${key}-depth)` })
  );
}

export function interiorBackground(decor: InteriorDecor, key: string): string {
  return (
    wall(decor, key) +
    floor(decor, key) +
    // vinheta suave
    `<defs><radialGradient id="${key}-vig" cx=".5" cy=".45" r=".75"><stop offset=".65" stop-color="#4a2341" stop-opacity="0"/><stop offset="1" stop-color="#4a2341" stop-opacity=".16"/></radialGradient></defs>` +
    rect(0, 0, 1000, 1000, 0, { fill: `url(#${key}-vig)` })
  );
}
