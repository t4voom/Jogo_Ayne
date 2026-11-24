import {
  circle,
  ellipse,
  flower,
  fs,
  g,
  heart,
  leaf,
  path,
  rect,
  rose,
  shadow,
  sparkle,
  st,
} from '../kit';
import { FIXED } from '../palette';
import type { ArtPack, ItemArt } from '../types';
import { GOLD, goldFill, pot } from './common';

const L = FIXED.leaf;
const LD = FIXED.leafDark;
const W = FIXED.wood;

function tulip(
  x: number,
  y: number,
  s: number,
  color: string,
  shade: string,
  line: string,
): string {
  return (
    path(
      `M${x - 10 * s} ${y} Q${x - 12 * s} ${y - 18 * s} ${x - 6 * s} ${y - 24 * s} L${x - 3 * s} ${y - 14 * s} L${x} ${y - 26 * s} L${x + 3 * s} ${y - 14 * s} L${x + 6 * s} ${y - 24 * s} Q${x + 12 * s} ${y - 18 * s} ${x + 10 * s} ${y} Q${x} ${y + 6 * s} ${x - 10 * s} ${y}Z`,
      fs(color, line, 1.8 * s),
    ) + path(`M${x} ${y - 20 * s} L${x} ${y + 2 * s}`, st(shade, 2 * s, 0.7))
  );
}

const tulipas: ItemArt = {
  w: 150,
  h: 220,
  draw: ({ ramp: c }) =>
    shadow(75, 212, 44, 7) +
    g(
      path(
        'M75 150 Q62 110 44 72 M75 150 Q76 100 76 54 M75 150 Q90 110 108 74 M75 150 Q66 120 58 100 M75 150 Q86 120 94 104',
        st(L.line, 4),
      ) +
        leaf(70, 140, 40, -110, L.base, L.line) +
        leaf(80, 140, 40, -70, L.light, L.line) +
        tulip(44, 74, 1, c.base, c.shade, c.line) +
        tulip(76, 56, 1.1, c.light, c.shade, c.line) +
        tulip(108, 76, 1, c.base, c.shade, c.line) +
        tulip(58, 102, 0.8, c.shade, c.base, c.line) +
        tulip(94, 106, 0.8, c.light, c.shade, c.line),
      { class: 'a-sway' },
    ) +
    pot(75, 150, 64, 58, c),
};

const girassois: ItemArt = {
  w: 160,
  h: 240,
  draw: ({ ramp: c }) => {
    const sun = (x: number, y: number, r: number) => {
      let petals = '';
      for (let i = 0; i < 12; i++) {
        const a = (i * 30 * Math.PI) / 180;
        petals += ellipse(
          Number((x + Math.cos(a) * r * 0.75).toFixed(1)),
          Number((y + Math.sin(a) * r * 0.75).toFixed(1)),
          r * 0.42,
          r * 0.2,
          {
            fill: '#ffd34d',
            stroke: '#e0a92a',
            'stroke-width': 1.2,
            transform: `rotate(${i * 30} ${(x + Math.cos(a) * r * 0.75).toFixed(1)} ${(y + Math.sin(a) * r * 0.75).toFixed(1)})`,
          },
        );
      }
      return (
        petals +
        circle(x, y, r * 0.45, fs('#a8743f', '#7d5230', 1.5)) +
        circle(x - r * 0.12, y - r * 0.12, r * 0.12, { fill: '#c99460' })
      );
    };
    return (
      shadow(80, 232, 46, 7) +
      g(
        path(
          'M80 170 Q66 120 50 74 M80 170 Q84 110 100 56 M80 170 Q92 130 118 100',
          st(L.line, 5),
        ) +
          leaf(66, 130, 36, -150, L.base, L.line) +
          leaf(90, 120, 36, -30, L.base, L.line) +
          leaf(100, 150, 30, -20, L.light, L.line) +
          sun(50, 70, 26) +
          sun(100, 52, 30) +
          sun(120, 100, 22),
        { class: 'a-sway' },
      ) +
      pot(80, 172, 66, 58, c)
    );
  },
};

const lirios: ItemArt = {
  w: 150,
  h: 220,
  draw: ({ ramp: c }) => {
    const lily = (x: number, y: number, s: number) => {
      let out = '';
      for (let i = 0; i < 6; i++) {
        out += path(
          `M${x} ${y} Q${x - 6 * s} ${y - 14 * s} ${x} ${y - 26 * s} Q${x + 6 * s} ${y - 14 * s} ${x} ${y}Z`,
          {
            ...fs('#fffaf6', c.line, 1.5),
            transform: `rotate(${i * 60} ${x} ${y})`,
          },
        );
        out += path(`M${x} ${y} L${x} ${y - 18 * s}`, {
          ...st(c.base, 3 * s, 0.8),
          transform: `rotate(${i * 60} ${x} ${y})`,
        });
      }
      return (
        out +
        circle(x, y, 4 * s, { fill: GOLD.base }) +
        circle(x + 4 * s, y - 4 * s, 2 * s, { fill: '#c2703a' }) +
        circle(x - 4 * s, y - 2 * s, 2 * s, { fill: '#c2703a' })
      );
    };
    return (
      shadow(75, 212, 44, 7) +
      g(
        path('M75 150 Q60 110 46 76 M75 150 Q80 100 84 58 M75 150 Q92 120 110 98', st(L.line, 4)) +
          leaf(68, 132, 44, -120, L.base, L.line) +
          leaf(82, 128, 40, -60, LD.base, LD.line) +
          lily(46, 76, 1) +
          lily(84, 58, 1.1) +
          lily(110, 98, 0.85),
        { class: 'a-sway' },
      ) +
      pot(75, 150, 64, 58, c)
    );
  },
};

const samambaia: ItemArt = {
  w: 190,
  h: 200,
  draw: ({ ramp: c }) => {
    const frond = (deg: number, len: number) => {
      let leaves = '';
      for (let i = 1; i < 9; i++) {
        const t = i / 9;
        const x = t * len;
        const w = (1 - t) * 14 + 4;
        leaves += ellipse(x, -w / 2, w * 0.45, w * 0.7, {
          fill: i % 2 ? L.base : L.light,
          transform: `rotate(-30 ${x} ${-w / 2})`,
        });
        leaves += ellipse(x, w / 2, w * 0.45, w * 0.7, {
          fill: i % 2 ? L.light : L.base,
          transform: `rotate(30 ${x} ${w / 2})`,
        });
      }
      return g(path(`M0 0 Q${len / 2} -6 ${len} 0`, st(L.line, 2.5)) + leaves, {
        transform: `translate(95 118) rotate(${deg})`,
      });
    };
    return (
      shadow(95, 192, 48, 7) +
      g(
        [-160, -130, -105, -80, -55, -25, -170, -10]
          .map((d, i) => frond(d, 70 + (i % 3) * 14))
          .join(''),
        { class: 'a-sway' },
      ) +
      pot(95, 126, 72, 60, c)
    );
  },
};

const cerejeira: ItemArt = {
  w: 250,
  h: 290,
  draw: ({ ramp: c }) => {
    const blossom: [number, number, number][] = [
      [70, 90, 46],
      [125, 66, 54],
      [182, 92, 46],
      [96, 130, 44],
      [158, 132, 44],
      [44, 132, 32],
      [206, 136, 30],
      [126, 112, 40],
    ];
    let cloud = '';
    for (const [x, y, r] of blossom)
      cloud += circle(x, y, r, { fill: c.base, stroke: c.line, 'stroke-width': 2.5 });
    let inner = '';
    for (const [x, y, r] of blossom) inner += circle(x, y - 4, r - 6, { fill: c.base });
    let flowers = '';
    const spots: [number, number][] = [
      [60, 80],
      [100, 60],
      [140, 50],
      [180, 84],
      [90, 122],
      [150, 118],
      [120, 92],
      [200, 130],
      [50, 130],
      [170, 150],
    ];
    for (const [x, y] of spots) flowers += flower(x, y, 9, c.light, c.shade);
    return (
      shadow(125, 280, 70, 9) +
      path(
        'M114 276 Q118 220 104 180 Q96 160 76 150 M120 276 Q130 210 150 180 Q162 162 182 156 M118 220 Q118 180 126 140',
        fs('none', W.line, 16),
      ) +
      path(
        'M114 276 Q118 220 104 180 Q96 160 76 150 M120 276 Q130 210 150 180 Q162 162 182 156 M118 220 Q118 180 126 140',
        st(W.base, 11),
      ) +
      g(cloud + inner + flowers + sparkle(90, 50, 6), { class: 'a-sway' }) +
      `<g class="a-petals">${heart(40, 200, 5, { fill: c.base })}${heart(200, 220, 5, { fill: c.light })}${heart(160, 250, 4, { fill: c.base })}${heart(70, 240, 4, { fill: c.light })}</g>` +
      ellipse(117, 278, 40, 6, { fill: L.shade, opacity: 0.6 })
    );
  },
};

const arbustoCoroa: ItemArt = {
  w: 190,
  h: 240,
  draw: ({ ramp: c }) =>
    shadow(95, 232, 56, 8) +
    rect(88, 150, 14, 44, 4, fs(W.base, W.line, 2)) +
    g(
      path(
        'M24 156 L16 70 Q16 58 28 64 L60 92 L86 40 Q95 26 104 40 L130 92 L162 64 Q174 58 174 70 L166 156Z',
        fs(L.base, L.line, 3),
      ) +
        path('M30 140 L26 84 L58 110', st(L.light, 6, 0.8)) +
        circle(22, 62, 10, fs(c.base, c.line, 2)) +
        circle(95, 32, 12, fs(c.base, c.line, 2)) +
        circle(168, 62, 10, fs(c.base, c.line, 2)) +
        rect(24, 136, 142, 22, 11, fs(LD.base, LD.line, 2.5)) +
        flower(60, 147, 7, c.light, GOLD.base) +
        flower(95, 147, 7, c.base, GOLD.base) +
        flower(130, 147, 7, c.light, GOLD.base),
      { class: 'a-sway' },
    ) +
    pot(95, 194, 92, 40, c),
};

const arcoFlores: ItemArt = {
  w: 250,
  h: 270,
  draw: ({ ramp: c }) => {
    let fl = '';
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI - (i / 16) * Math.PI;
      const x = 125 + Math.cos(a) * 96;
      const y = 140 - Math.sin(a) * 110;
      fl +=
        i % 3 === 0
          ? rose(x, y, 11, c.base, c.shade, c.line)
          : flower(x, y, 9, i % 2 ? c.light : '#fff', GOLD.base);
    }
    const side = (x: number) => {
      let s = '';
      for (let y = 150; y < 250; y += 22)
        s +=
          flower(x + (y % 44 === 0 ? -6 : 6), y, 8, y % 3 ? c.light : c.base, GOLD.base) +
          leaf(x, y + 10, 16, y % 44 ? 30 : 150, L.base, L.line);
      return s;
    };
    return (
      shadow(125, 262, 110, 8) +
      path('M29 258 L29 140 Q29 30 125 30 Q221 30 221 140 L221 258', fs('none', '#fffaf6', 14)) +
      path('M29 258 L29 140 Q29 30 125 30 Q221 30 221 140 L221 258', st('#e5d3dc', 2)) +
      path('M29 140 Q29 30 125 30 Q221 30 221 140', st(L.base, 18, 0.95)) +
      path('M29 140 Q29 30 125 30 Q221 30 221 140', st(L.light, 6, 0.8)) +
      side(29) +
      side(221) +
      g(fl, { class: 'a-sway' }) +
      heart(125, 30, 12, fs(c.shade, c.line, 2)) +
      rect(14, 252, 30, 12, 4, fs('#fffaf6', '#dcc6d3', 2)) +
      rect(206, 252, 30, 12, 4, fs('#fffaf6', '#dcc6d3', 2))
    );
  },
};

const cogumelos: ItemArt = {
  w: 170,
  h: 140,
  draw: ({ ramp: c }) => {
    const shroom = (x: number, base: number, s: number) =>
      path(
        `M${x - 9 * s} ${base} L${x - 7 * s} ${base - 28 * s} L${x + 7 * s} ${base - 28 * s} L${x + 9 * s} ${base}Z`,
        fs('#fffaf6', '#dcc6d3', 2),
      ) +
      path(
        `M${x - 30 * s} ${base - 26 * s} Q${x - 30 * s} ${base - 64 * s} ${x} ${base - 64 * s} Q${x + 30 * s} ${base - 64 * s} ${x + 30 * s} ${base - 26 * s} Q${x} ${base - 20 * s} ${x - 30 * s} ${base - 26 * s}Z`,
        fs(c.base, c.line, 2.5),
      ) +
      circle(x - 14 * s, base - 44 * s, 5 * s, { fill: '#fff' }) +
      circle(x + 8 * s, base - 52 * s, 6 * s, { fill: '#fff' }) +
      circle(x + 18 * s, base - 36 * s, 4 * s, { fill: '#fff' }) +
      circle(x - 3 * s, base - 34 * s, 3 * s, { fill: '#fff' });
    return (
      shadow(85, 130, 70, 7) +
      ellipse(85, 128, 72, 10, { fill: L.base, opacity: 0.7 }) +
      shroom(54, 126, 1.05) +
      shroom(118, 128, 0.8) +
      shroom(150, 128, 0.5) +
      leaf(20, 124, 22, -40, L.base, L.line) +
      leaf(96, 128, 18, -150, L.light, L.line) +
      sparkle(100, 30, 6)
    );
  },
};

const vasoSuspenso: ItemArt = {
  w: 140,
  h: 240,
  draw: ({ ramp: c }) => {
    let vines = '';
    for (const [x, len] of [
      [44, 70],
      [70, 96],
      [96, 76],
    ] as const) {
      vines += path(`M${x} 176 Q${x - 10} ${176 + len / 2} ${x + 4} ${176 + len}`, st(L.line, 2.5));
      for (let y = 190; y < 176 + len; y += 16)
        vines += leaf(x - 2, y, 14, y % 32 ? 200 : -20, L.base, L.line);
      vines += flower(x + 4, 176 + len, 6, c.base, GOLD.base);
    }
    return (
      path('M70 6 L36 140 M70 6 L104 140 M70 6 L70 140', st('#e9d6c3', 3)) +
      circle(70, 8, 7, goldFill(1.5)) +
      path('M50 70 L90 70 M44 100 L96 100', st('#e9d6c3', 2.5)) +
      g(vines, { class: 'a-sway' }) +
      path('M30 138 L110 138 Q106 180 70 182 Q34 180 30 138Z', fs(c.base, c.line, 2.5)) +
      path('M38 148 Q42 170 60 176', st(c.light, 4)) +
      heart(70, 158, 8, fs('#fff', c.line, 1.5)) +
      circle(52, 132, 12, { fill: L.base }) +
      circle(86, 130, 13, { fill: L.shade }) +
      circle(70, 124, 11, { fill: L.light })
    );
  },
};

const orquidea: ItemArt = {
  w: 140,
  h: 220,
  draw: ({ ramp: c }) => {
    const orchid = (x: number, y: number, s: number) =>
      ellipse(x - 10 * s, y - 2 * s, 9 * s, 6 * s, fs(c.light, c.line, 1.5)) +
      ellipse(x + 10 * s, y - 2 * s, 9 * s, 6 * s, fs(c.light, c.line, 1.5)) +
      ellipse(x, y - 11 * s, 6 * s, 9 * s, fs(c.light, c.line, 1.5)) +
      ellipse(x - 6 * s, y + 8 * s, 6 * s, 7 * s, fs(c.light, c.line, 1.5)) +
      ellipse(x + 6 * s, y + 8 * s, 6 * s, 7 * s, fs(c.light, c.line, 1.5)) +
      path(
        `M${x - 5 * s} ${y + 2 * s} Q${x} ${y + 14 * s} ${x + 5 * s} ${y + 2 * s}Z`,
        fs(c.shade, c.line, 1.2),
      ) +
      circle(x, y, 2.5 * s, { fill: GOLD.base });
    return (
      shadow(70, 212, 42, 7) +
      path('M60 160 L60 50 Q60 30 82 30 Q104 30 108 52', st(W.line, 3)) +
      g(
        orchid(84, 36, 1) +
          orchid(106, 62, 0.9) +
          orchid(62, 70, 0.85) +
          orchid(62, 104, 0.75) +
          circle(108, 86, 5, fs(c.base, c.line, 1.2)),
        {
          class: 'a-sway',
        },
      ) +
      leaf(64, 158, 38, -170, LD.base, LD.line) +
      leaf(64, 158, 38, -10, L.base, L.line) +
      pot(70, 160, 56, 46, c)
    );
  },
};

const arbustoBola: ItemArt = {
  w: 140,
  h: 250,
  draw: ({ ramp: c }) =>
    shadow(70, 242, 40, 7) +
    rect(64, 70, 12, 130, 4, fs(W.base, W.line, 2)) +
    g(
      circle(70, 150, 34, fs(L.base, L.line, 3)) +
        path('M46 140 Q50 124 64 120', st(L.light, 5, 0.8)) +
        circle(70, 64, 44, fs(L.base, L.line, 3)) +
        path('M38 52 Q44 30 64 26', st(L.light, 6, 0.8)) +
        flower(52, 80, 7, c.base, GOLD.base) +
        flower(88, 48, 7, c.base, GOLD.base) +
        flower(80, 90, 6, c.light, GOLD.base) +
        flower(58, 158, 6, c.base, GOLD.base) +
        flower(84, 146, 6, c.light, GOLD.base) +
        rect(56, 104, 28, 10, 5, fs(c.base, c.line, 1.5)) +
        heart(70, 109, 5, goldFill(1)),
      { class: 'a-sway' },
    ) +
    pot(70, 198, 70, 40, c),
};

const canteiro: ItemArt = {
  w: 240,
  h: 150,
  draw: ({ ramp: c }) => {
    let fl = '';
    const pts: [number, number, string][] = [
      [36, 64, c.base],
      [64, 50, '#fff'],
      [92, 62, c.light],
      [120, 46, c.base],
      [148, 60, '#ffe28a'],
      [176, 48, c.light],
      [204, 62, c.base],
      [50, 80, c.light],
      [106, 78, '#fff'],
      [162, 78, c.base],
      [190, 80, '#fff'],
    ];
    for (const [x, y, col] of pts)
      fl += path(`M${x} ${y} L${x} 96`, st(L.line, 2.5)) + flower(x, y, 10, col, GOLD.base);
    return (
      shadow(120, 142, 110, 8) +
      g(
        fl +
          leaf(40, 92, 20, -60, L.base, L.line) +
          leaf(200, 92, 20, -120, L.base, L.line) +
          leaf(120, 94, 22, -90, L.light, L.line),
        { class: 'a-sway' },
      ) +
      rect(14, 90, 212, 46, 8, fs(W.base, W.line, 3)) +
      path('M14 104 L226 104 M14 120 L226 120', st(W.line, 1.5, 0.6)) +
      rect(10, 86, 220, 12, 6, fs(c.base, c.line, 2)) +
      heart(120, 120, 8, fs(c.light, c.line, 1.5))
    );
  },
};

export default {
  tulipas,
  girassois,
  lirios,
  samambaia,
  cerejeira,
  'arbusto-coroa': arbustoCoroa,
  'arco-flores': arcoFlores,
  cogumelos,
  'vaso-suspenso': vasoSuspenso,
  orquidea,
  'arbusto-bola': arbustoBola,
  canteiro,
} satisfies ArtPack;
