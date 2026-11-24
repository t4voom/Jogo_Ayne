import {
  circle,
  ellipse,
  fs,
  g,
  gem,
  heart,
  path,
  pearl,
  rect,
  shadow,
  shine,
  sparkle,
  st,
} from '../kit';
import { FIXED } from '../palette';
import type { ArtPack, ItemArt } from '../types';
import {
  GOLD,
  cabinet,
  crownTop,
  drawer,
  flame,
  goldFill,
  goldLeg,
  scallops,
  tufts,
  woodLeg,
} from './common';

const W = FIXED.wood;

const berco: ItemArt = {
  w: 200,
  h: 200,
  draw: ({ ramp: c }) => {
    let bars = '';
    for (let x = 40; x <= 160; x += 15)
      bars += rect(x - 3, 92, 6, 64, 3, fs('#fffaf6', c.line, 1.5));
    return (
      shadow(100, 190, 86, 8) +
      path(
        'M24 160 L24 70 Q24 50 44 50 Q66 26 100 26 Q134 26 156 50 Q176 50 176 70 L176 160Z',
        fs(c.base, c.line, 3),
      ) +
      path('M38 156 L38 76 Q38 64 50 64 Q70 42 100 42 Q130 42 150 64 Q162 64 162 76 L162 156Z', {
        fill: c.light,
        opacity: 0.6,
      }) +
      sparkle(100, 58, 10, '#fff6c9') +
      circle(70, 72, 3, { fill: '#fff' }) +
      circle(130, 72, 3, { fill: '#fff' }) +
      rect(26, 88, 148, 10, 5, goldFill(2)) +
      bars +
      rect(30, 128, 140, 24, 10, fs('#fff', c.line, 2)) +
      path('M30 136 Q100 126 170 136 L170 150 Q100 158 30 150Z', fs(c.base, c.line, 2)) +
      path(scallops(32, 168, 150, 7, 7), st(c.shade, 2.5)) +
      rect(20, 154, 160, 14, 7, goldFill(2.5)) +
      goldLeg(32, 166, 18, -1, 6) +
      goldLeg(168, 166, 18, 1, 6) +
      heart(100, 108, 8, fs(c.shade, c.line, 1.5))
    );
  },
};

const guardaRoupa: ItemArt = {
  w: 180,
  h: 280,
  draw: ({ ramp: c }) =>
    shadow(90, 270, 80, 9) +
    path(
      'M18 70 Q18 40 50 36 Q70 14 90 14 Q110 14 130 36 Q162 40 162 70 L162 250 L18 250Z',
      fs(c.base, c.line, 3),
    ) +
    path('M24 70 Q26 48 52 46', st(c.light, 4, 0.8)) +
    crownTop(90, 22, 0.9) +
    rect(30, 70, 58, 166, 12, fs(c.light, c.line, 2)) +
    rect(92, 70, 58, 166, 12, fs(c.light, c.line, 2)) +
    path('M40 110 Q59 84 78 110 Q78 160 59 180 Q40 160 40 110Z', {
      fill: 'url(#k-glass)',
      stroke: GOLD.line,
      'stroke-width': 2,
    }) +
    path('M102 110 Q121 84 140 110 Q140 160 121 180 Q102 160 102 110Z', {
      fill: 'url(#k-glass)',
      stroke: GOLD.line,
      'stroke-width': 2,
    }) +
    shine('M46 112 Q52 98 60 94 L54 118Z', 0.8) +
    shine('M108 112 Q114 98 122 94 L116 118Z', 0.8) +
    circle(82, 158, 4.5, goldFill(1.5)) +
    circle(98, 158, 4.5, goldFill(1.5)) +
    drawer(34, 196, 112, 30, c) +
    rect(10, 244, 160, 14, 7, goldFill(2.5)) +
    goldLeg(26, 256, 14, -1) +
    goldLeg(154, 256, 14, 1),
};

const comoda: ItemArt = {
  w: 210,
  h: 180,
  draw: ({ ramp: c }) =>
    shadow(105, 172, 92, 8) +
    cabinet(24, 46, 162, 104, c) +
    drawer(36, 58, 138, 26, c) +
    drawer(36, 88, 66, 26, c, 'gem') +
    drawer(108, 88, 66, 26, c, 'gem') +
    drawer(36, 118, 138, 26, c) +
    path(scallops(24, 186, 150, 6, 8), st(c.line, 3)) +
    goldLeg(34, 148, 18, -1) +
    goldLeg(176, 148, 18, 1) +
    pearl(24, 40, 4.5) +
    pearl(186, 40, 4.5),
};

const sofaReal: ItemArt = {
  w: 280,
  h: 180,
  draw: ({ ramp: c }) =>
    shadow(140, 170, 124, 9) +
    path(
      'M40 118 L36 58 Q36 30 70 28 Q104 10 140 22 Q176 10 210 28 Q244 30 244 58 L240 118Z',
      fs(c.base, c.line, 3),
    ) +
    tufts(70, 52, 6, 3, 28, 20, c.shade) +
    path('M54 60 Q58 40 80 36', st(c.light, 4, 0.8)) +
    heart(140, 26, 8, goldFill(1.6)) +
    path(
      'M12 104 Q10 78 34 78 Q58 78 56 104 L56 146 L16 146 Q12 146 12 140Z',
      fs(c.base, c.line, 3),
    ) +
    path(
      'M268 104 Q270 78 246 78 Q222 78 224 104 L224 146 L264 146 Q268 146 268 140Z',
      fs(c.base, c.line, 3),
    ) +
    circle(34, 98, 12, fs(c.light, c.line, 2.5)) +
    circle(246, 98, 12, fs(c.light, c.line, 2.5)) +
    path(
      'M54 112 Q54 100 68 100 L136 100 Q140 104 140 112 L140 128 L54 128Z',
      fs(c.light, c.line, 2.5),
    ) +
    path(
      'M140 112 Q140 104 144 100 L212 100 Q226 100 226 112 L226 128 L140 128Z',
      fs(c.light, c.line, 2.5),
    ) +
    rect(14, 126, 252, 24, 11, fs(c.base, c.line, 3)) +
    path(scallops(18, 262, 148, 9, 7), st(c.shade, 2.5)) +
    path('M22 132 L258 132', st('url(#k-gold-h)', 3)) +
    goldLeg(30, 148, 16, -1) +
    goldLeg(250, 148, 16, 1) +
    goldLeg(140, 148, 12, 1, 6),
};

const diva: ItemArt = {
  w: 250,
  h: 160,
  draw: ({ ramp: c }) =>
    shadow(125, 150, 110, 8) +
    path(
      'M20 118 L20 50 Q20 22 48 24 Q72 26 76 52 L80 92 L232 92 Q240 92 240 100 L240 122 L20 122Z',
      fs(c.base, c.line, 3),
    ) +
    path('M30 60 Q34 34 52 36', st(c.light, 4, 0.8)) +
    tufts(36, 58, 2, 3, 18, 16, c.shade) +
    rect(70, 94, 168, 22, 11, fs(c.light, c.line, 2.5)) +
    path('M84 102 L228 102', st('#fff', 3, 0.7)) +
    ellipse(206, 88, 26, 12, fs(c.shade, c.line, 2.5)) +
    path('M184 86 L180 82 M228 86 L232 82', st(GOLD.line, 2)) +
    ellipse(206, 88, 6, 10, { fill: c.base }) +
    rect(14, 114, 232, 18, 9, fs(c.base, c.line, 3)) +
    path(scallops(18, 242, 130, 8, 6), st(c.shade, 2.5)) +
    goldLeg(30, 130, 14, -1) +
    goldLeg(230, 130, 14, 1),
};

const mesaCha: ItemArt = {
  w: 190,
  h: 150,
  draw: ({ ramp: c }) =>
    shadow(95, 142, 70, 7) +
    path('M80 70 Q86 100 70 128 L120 128 Q104 100 110 70Z', goldFill(2.5)) +
    ellipse(95, 128, 34, 8, goldFill(2)) +
    ellipse(95, 56, 84, 18, fs('#fff', c.line, 2.5)) +
    path(
      'M11 56 Q12 84 30 88 Q40 80 50 90 Q62 80 72 92 Q84 82 95 92 Q106 82 118 92 Q128 80 140 90 Q150 80 160 88 Q178 84 179 56',
      fs(c.base, c.line, 2.5),
    ) +
    path('M24 70 Q95 86 166 70', st(c.light, 3, 0.8)) +
    ellipse(95, 52, 64, 11, { fill: '#fff', opacity: 0.6 }) +
    circle(30, 88, 3, { fill: '#fff' }) +
    circle(160, 88, 3, { fill: '#fff' }),
};

const cadeira: ItemArt = {
  w: 120,
  h: 200,
  draw: ({ ramp: c }) =>
    shadow(60, 192, 44, 6) +
    path(
      'M28 112 L24 40 Q24 14 48 14 Q60 22 60 22 Q60 22 72 14 Q96 14 96 40 L92 112Z',
      goldFill(2.5),
    ) +
    heart(60, 66, 30, fs(c.base, c.line, 2.5)) +
    tufts(48, 52, 2, 2, 24, 18, c.shade) +
    path(
      'M18 120 Q18 106 34 106 L86 106 Q102 106 102 120 L102 132 L18 132Z',
      fs(c.base, c.line, 2.5),
    ) +
    path('M26 116 Q60 108 94 116', st(c.light, 3)) +
    rect(14, 128, 92, 12, 6, goldFill(2)) +
    goldLeg(24, 138, 48, -1, 6) +
    goldLeg(96, 138, 48, 1, 6) +
    goldLeg(44, 138, 44, -1, 5) +
    goldLeg(76, 138, 44, 1, 5),
};

const estante: ItemArt = {
  w: 180,
  h: 270,
  draw: ({ ramp: c }) => {
    const colors = ['#f6a9cb', '#c8b0f0', '#9fd3f2', '#a6e2c4', '#ffd98a', '#f4b6a6'];
    let books = '';
    const shelf = (y: number, seed: number) => {
      let x = 36;
      let i = seed;
      while (x < 140) {
        const w = 10 + ((i * 7) % 6);
        const h = 40 + ((i * 13) % 14);
        const color = colors[i % colors.length] ?? '#f6a9cb';
        books +=
          rect(x, y - h, w, h, 2.5, fs(color, c.line, 1.5)) +
          path(`M${x + 2} ${y - h + 7} L${x + w - 2} ${y - h + 7}`, st('#fff1c2', 1.5));
        x += w + 1.5;
        i++;
      }
    };
    shelf(118, 1);
    shelf(184, 4);
    return (
      shadow(90, 262, 82, 8) +
      path('M18 250 L18 64 Q18 18 90 18 Q162 18 162 64 L162 250Z', fs(c.base, c.line, 3)) +
      path('M30 246 L30 70 Q30 32 90 32 Q150 32 150 70 L150 246Z', fs(W.light, W.line, 2)) +
      heart(90, 48, 9, goldFill(1.5)) +
      rect(26, 118, 128, 8, 4, fs(c.light, c.line, 2)) +
      rect(26, 184, 128, 8, 4, fs(c.light, c.line, 2)) +
      books +
      // vasinho e coroa na prateleira de baixo
      path('M44 240 L46 222 L66 222 L68 240Z', fs('#fffaf6', '#dcc6d3', 2)) +
      circle(52, 212, 8, { fill: FIXED.leaf.base }) +
      circle(62, 208, 9, { fill: FIXED.leaf.shade }) +
      crownTop(118, 232, 0.8) +
      rect(10, 244, 160, 14, 7, goldFill(2.5)) +
      sparkle(132, 60, 6)
    );
  },
};

const banheira: ItemArt = {
  w: 260,
  h: 180,
  draw: ({ ramp: c }) => {
    let bubbles = '';
    const bub: [number, number, number][] = [
      [70, 64, 14],
      [96, 56, 18],
      [124, 62, 13],
      [150, 54, 17],
      [176, 62, 12],
      [200, 58, 15],
      [112, 40, 8],
      [168, 38, 9],
    ];
    for (const [x, y, r] of bub)
      bubbles +=
        circle(x, y, r, fs('#fff', '#d8e9f7', 1.5)) +
        circle(x - r * 0.35, y - r * 0.35, r * 0.25, { fill: '#e6f4ff' });
    return (
      shadow(130, 170, 116, 9) +
      // torneira
      path('M42 70 L42 36 Q42 24 54 24 L66 24', st(GOLD.line, 8)) +
      path('M42 70 L42 36 Q42 24 54 24 L66 24', st('#f6d27a', 4)) +
      circle(66, 28, 6, goldFill(1.5)) +
      `<g class="a-float">${bubbles}</g>` +
      path('M18 78 L242 78 Q240 140 196 148 L64 148 Q20 140 18 78Z', fs(c.base, c.line, 3)) +
      path('M18 78 L242 78 Q242 90 228 90 L32 90 Q18 90 18 78Z', fs('#fffaf6', c.line, 2.5)) +
      path('M36 104 Q40 132 70 138', st(c.light, 5, 0.9)) +
      path(scallops(60, 200, 120, 7, 8), st(c.shade, 2.5, 0.8)) +
      heart(130, 118, 9, goldFill(1.5)) +
      // pés de garra
      path('M56 146 Q46 160 40 166 L64 166 Q66 156 72 148Z', goldFill(2)) +
      path('M204 146 Q214 160 220 166 L196 166 Q194 156 188 148Z', goldFill(2)) +
      // patinho
      `<g class="a-bob">${ellipse(212, 72, 14, 10, fs('#ffe28a', '#e0b14a', 2))}${circle(204, 60, 8, fs('#ffe28a', '#e0b14a', 2))}${path('M196 60 L190 62 L196 64Z', { fill: '#ff9e6b' })}${circle(203, 58, 1.5, { fill: FIXED.eye })}</g>`
    );
  },
};

const pia: ItemArt = {
  w: 150,
  h: 220,
  draw: ({ ramp: c }) =>
    shadow(75, 212, 44, 7) +
    path('M60 110 Q54 170 46 204 L104 204 Q96 170 90 110Z', fs('#fffaf6', c.line, 3)) +
    path('M66 120 Q62 170 58 198', st(c.light, 4)) +
    rect(40, 200, 70, 10, 5, goldFill(2)) +
    path('M14 84 L136 84 Q132 118 100 122 L50 122 Q18 118 14 84Z', fs(c.base, c.line, 3)) +
    ellipse(75, 86, 54, 10, fs('#fff', c.line, 2)) +
    ellipse(75, 88, 40, 6, { fill: '#dff1ff' }) +
    path('M30 98 Q75 116 120 98', st(c.light, 3, 0.8)) +
    // torneira
    path('M75 78 L75 56 Q75 46 85 46 L94 46 L94 54', st(GOLD.line, 7)) +
    path('M75 78 L75 56 Q75 46 85 46 L94 46 L94 54', st('#f6d27a', 3.5)) +
    circle(64, 70, 5, goldFill(1.5)) +
    circle(86, 70, 5, goldFill(1.5)) +
    // sabonete
    rect(108, 70, 18, 12, 5, fs('#ffd3e6', c.line, 1.5)) +
    circle(112, 66, 3, { fill: '#fff' }) +
    circle(118, 62, 2, { fill: '#fff' }),
};

const armarioCozinha: ItemArt = {
  w: 210,
  h: 250,
  draw: ({ ramp: c }) => {
    let plates = '';
    for (const x of [54, 82, 128, 156])
      plates += circle(x, 76, 13, fs('#fff', '#dcc6d3', 2)) + circle(x, 76, 7, st(c.shade, 2));
    return (
      shadow(105, 242, 92, 8) +
      // parte de cima com pratos
      path('M28 112 L28 50 Q28 24 105 24 Q182 24 182 50 L182 112Z', fs(c.base, c.line, 3)) +
      rect(38, 44, 134, 64, 8, fs(W.light, W.line, 2)) +
      plates +
      rect(38, 92, 134, 6, 3, fs(c.light, c.line, 1.5)) +
      heart(105, 34, 7, goldFill(1.4)) +
      // bancada
      rect(14, 124, 182, 16, 6, fs('#fffaf6', c.line, 2.5)) +
      path('M20 128 L190 128', st('url(#k-gold-h)', 2.5)) +
      // parte de baixo
      rect(22, 140, 166, 90, 10, fs(c.base, c.line, 3)) +
      rect(34, 152, 66, 66, 8, fs(c.light, c.line, 2)) +
      rect(110, 152, 66, 66, 8, fs(c.light, c.line, 2)) +
      heart(67, 184, 6, goldFill(1.3)) +
      heart(143, 184, 6, goldFill(1.3)) +
      // pote de biscoitos
      path('M150 124 L152 102 Q164 96 176 102 L178 124Z', fs('#fff', c.line, 2)) +
      circle(164, 98, 5, fs(c.shade, c.line, 1.5)) +
      circle(160, 112, 3, { fill: '#e0a96b' }) +
      circle(168, 116, 3, { fill: '#e0a96b' }) +
      rect(14, 226, 182, 10, 5, goldFill(2))
    );
  },
};

const fogao: ItemArt = {
  w: 190,
  h: 200,
  draw: ({ ramp: c }) =>
    shadow(95, 192, 82, 8) +
    // chaleira
    path('M54 50 Q50 26 74 26 Q98 26 94 50Z', fs('#fff', c.line, 2.5)) +
    path('M94 40 L108 30', st(c.line, 4)) +
    path('M60 26 Q74 10 88 26', st(GOLD.line, 3)) +
    `<g class="a-steam">${path('M110 24 Q104 14 112 6 Q118 0 112 -6', st('#fff', 4, 0.8))}</g>` +
    // tampo e bocas
    rect(14, 52, 162, 16, 6, fs('#fffaf6', c.line, 2.5)) +
    ellipse(132, 56, 18, 4, fs('#6b5a66', '#4a3d47', 1.5)) +
    // corpo
    rect(20, 66, 150, 108, 14, fs(c.base, c.line, 3)) +
    path('M28 80 L28 160', st(c.light, 4, 0.8)) +
    circle(46, 82, 6, goldFill(1.5)) +
    circle(70, 82, 6, goldFill(1.5)) +
    circle(120, 82, 6, goldFill(1.5)) +
    circle(144, 82, 6, goldFill(1.5)) +
    rect(42, 98, 106, 64, 12, fs('#fffaf6', c.line, 2.5)) +
    rect(54, 108, 82, 40, 10, { fill: '#3d2e38', opacity: 0.85 }) +
    path('M60 136 Q95 116 130 136', st('#ffb347', 4, 0.8)) +
    shine('M60 112 L80 112 L66 130Z', 0.35) +
    rect(64, 100, 62, 5, 2.5, goldFill(1.2)) +
    rect(12, 170, 166, 12, 6, goldFill(2)) +
    goldLeg(26, 180, 10, -1) +
    goldLeg(164, 180, 10, 1),
};

const geladeira: ItemArt = {
  w: 130,
  h: 250,
  draw: ({ ramp: c }) =>
    shadow(65, 242, 54, 7) +
    path('M14 232 L14 52 Q14 14 65 14 Q116 14 116 52 L116 232Z', fs(c.base, c.line, 3)) +
    path('M24 60 Q26 30 52 24', st(c.light, 5, 0.8)) +
    path('M14 98 L116 98', st(c.line, 2.5)) +
    rect(96, 50, 8, 34, 4, fs('#f4f4f6', '#b9b2bd', 1.8)) +
    rect(96, 112, 8, 56, 4, fs('#f4f4f6', '#b9b2bd', 1.8)) +
    heart(56, 64, 12, fs('#fff', c.line, 1.8)) +
    // ímãs fofos
    circle(40, 130, 7, fs('#ffe28a', '#e0b14a', 1.5)) +
    heart(66, 150, 7, fs('#f6a9cb', '#d9659b', 1.5)) +
    sparkle(44, 176, 7, '#c8b0f0') +
    rect(10, 228, 110, 10, 5, goldFill(2)) +
    goldLeg(22, 236, 8, -1, 6) +
    goldLeg(108, 236, 8, 1, 6),
};

const mesaJantar: ItemArt = {
  w: 280,
  h: 170,
  draw: ({ ramp: c }) =>
    shadow(140, 160, 120, 9) +
    woodLeg(44, 90, 62, 9) +
    woodLeg(236, 90, 62, 9) +
    woodLeg(86, 96, 54, 8) +
    woodLeg(194, 96, 54, 8) +
    path('M20 70 L260 70 Q258 102 240 108 L40 108 Q22 102 20 70Z', fs('#fff', c.line, 2.5)) +
    path(scallops(34, 246, 108, 9, 10), fs(c.base, c.line, 2)) +
    path('M40 108 L240 108', st(c.base, 3)) +
    rect(18, 60, 244, 14, 7, fs(c.light, c.line, 2.5)) +
    // centro de mesa: vaso com flores e velas
    path('M126 60 L130 42 L150 42 L154 60Z', fs('#fffaf6', '#dcc6d3', 2)) +
    circle(132, 36, 8, fs(c.base, c.line, 1.5)) +
    circle(148, 34, 8, fs(c.shade, c.line, 1.5)) +
    circle(140, 26, 8, fs(c.light, c.line, 1.5)) +
    rect(90, 34, 8, 26, 2, fs('#fffaf6', c.line, 1.5)) +
    rect(182, 34, 8, 26, 2, fs('#fffaf6', c.line, 1.5)) +
    flame(94, 34, 0.6) +
    flame(186, 34, 0.6),
};

const piano: ItemArt = {
  w: 280,
  h: 220,
  draw: ({ ramp: c }) => {
    let keys = '';
    for (let i = 0; i < 14; i++)
      keys += rect(40 + i * 9, 120, 8.4, 20, 1.5, fs('#fff', '#d8ccd4', 1));
    for (const i of [0, 1, 3, 4, 5, 7, 8, 10, 11, 12])
      keys += rect(46 + i * 9, 120, 5, 12, 1, { fill: '#4a3d47' });
    return (
      shadow(150, 210, 126, 10) +
      // tampa levantada
      path('M60 112 L190 28 Q236 18 254 60 L170 112Z', fs(c.light, c.line, 2.5)) +
      path('M196 34 L150 106', st(GOLD.line, 3)) +
      // corpo curvo
      path(
        'M34 112 L262 112 Q270 112 270 124 Q270 150 230 156 Q200 160 190 150 Q170 142 140 150 L34 150Z',
        fs(c.base, c.line, 3),
      ) +
      path('M46 118 L250 118', st(c.light, 3, 0.8)) +
      rect(36, 116, 132, 28, 4, fs('#fffaf6', c.line, 2)) +
      keys +
      // estante de partitura
      rect(70, 92, 70, 22, 4, fs('#fff', c.line, 2)) +
      path('M78 100 L130 100 M78 106 L122 106', st('#9b6b8f', 1.4, 0.6)) +
      heart(150, 136, 6, goldFill(1.3)) +
      goldLeg(50, 150, 48, -1, 9) +
      goldLeg(248, 150, 46, 1, 9) +
      goldLeg(176, 152, 42, 1, 8) +
      // pedais
      rect(112, 186, 26, 10, 4, goldFill(1.5)) +
      sparkle(236, 46, 7)
    );
  },
};

const harpa: ItemArt = {
  w: 160,
  h: 250,
  draw: ({ ramp: c }) => {
    let strings = '';
    for (let i = 0; i < 9; i++) {
      const x = 52 + i * 10;
      const top = 56 + i * 9;
      strings += path(`M${x} ${top} L${x} 214`, st(i % 3 === 0 ? c.shade : '#fff6d6', 1.6));
    }
    return (
      shadow(80, 242, 56, 7) +
      strings +
      path(
        'M30 226 L30 52 Q30 24 54 32 Q92 46 124 100 Q140 128 134 150',
        fs('none', GOLD.line, 12),
      ) +
      path('M30 226 L30 52 Q30 24 54 32 Q92 46 124 100 Q140 128 134 150', st('#f6d27a', 7)) +
      path('M42 220 L138 152', st(GOLD.line, 10)) +
      path('M42 220 L138 152', st('#f6d27a', 5)) +
      crownTop(32, 30, 0.8) +
      heart(30, 120, 9, fs(c.base, c.line, 1.8)) +
      gem(30, 160, 5, c.base, c.line) +
      path('M14 236 Q30 214 46 236Z', goldFill(2)) +
      rect(10, 232, 140, 10, 5, goldFill(2)) +
      sparkle(108, 70, 6)
    );
  },
};

const cabideiro: ItemArt = {
  w: 120,
  h: 260,
  draw: ({ ramp: c }) =>
    shadow(60, 252, 40, 6) +
    path('M60 40 L60 236', st(GOLD.line, 9)) +
    path('M60 40 L60 236', st('#f6d27a', 5)) +
    path(
      'M60 60 Q40 50 30 64 M60 60 Q80 50 90 64 M60 90 Q42 84 34 96 M60 90 Q78 84 86 96',
      st(GOLD.line, 4),
    ) +
    circle(60, 32, 8, goldFill(2)) +
    // chapéu
    ellipse(34, 70, 24, 6, fs(c.base, c.line, 2)) +
    path('M20 70 Q20 48 34 48 Q48 48 48 70Z', fs(c.base, c.line, 2)) +
    path('M20 64 L48 64', st(c.shade, 4)) +
    circle(44, 58, 5, fs('#fff', c.line, 1.5)) +
    // cachecol
    path('M84 96 Q96 130 88 170 L100 170 Q108 130 92 96Z', fs(c.light, c.line, 2)) +
    path('M86 164 L86 176 M92 166 L92 178 M98 166 L98 176', st(c.shade, 2)) +
    // bolsinha
    path('M30 108 Q34 96 44 104', st(GOLD.line, 2)) +
    path('M22 108 L50 108 L46 132 L26 132Z', fs(c.shade, c.line, 2)) +
    heart(36, 120, 4, goldFill(1)) +
    path('M36 236 L16 248 M60 236 L60 250 M84 236 L104 248', st(GOLD.line, 7)) +
    path('M36 236 L16 248 M60 236 L60 250 M84 236 L104 248', st('#f6d27a', 3.5)),
};

const sapateira: ItemArt = {
  w: 190,
  h: 170,
  draw: ({ ramp: c }) => {
    const heel = (x: number, y: number, color: string, line: string) =>
      path(
        `M${x} ${y} Q${x} ${y - 14} ${x + 10} ${y - 16} L${x + 26} ${y - 10} Q${x + 34} ${y - 6} ${x + 34} ${y} Z`,
        fs(color, line, 1.8),
      ) +
      path(`M${x + 2} ${y} L${x + 4} ${y + 6}`, st(line, 2.5)) +
      circle(x + 22, y - 9, 2.5, { fill: '#fff' });
    return (
      shadow(95, 162, 84, 8) +
      cabinet(20, 34, 150, 110, c) +
      rect(30, 46, 130, 40, 8, fs(c.light, c.line, 2)) +
      rect(30, 94, 130, 40, 8, fs(c.light, c.line, 2)) +
      heel(38, 80, '#f6a9cb', '#d9659b') +
      heel(80, 80, '#ffd98a', '#d49c33') +
      heel(120, 80, '#c8b0f0', '#9a7bcf') +
      heel(38, 128, '#9fd3f2', '#5aa6dc') +
      heel(80, 128, '#fff', '#c9b3a7') +
      heel(120, 128, c.base, c.line) +
      goldLeg(32, 142, 14, -1) +
      goldLeg(158, 142, 14, 1)
    );
  },
};

const manequim: ItemArt = {
  w: 160,
  h: 280,
  draw: ({ ramp: c }) =>
    shadow(80, 272, 50, 7) +
    path('M80 210 L80 262', st(GOLD.line, 7)) +
    path('M80 210 L80 262', st('#f6d27a', 3.5)) +
    path('M50 268 L80 256 L110 268', st(GOLD.line, 6)) +
    circle(80, 26, 8, goldFill(1.5)) +
    // busto
    path('M58 40 Q80 30 102 40 L98 70 Q80 76 62 70Z', fs('#f6e9e2', '#d8c3b8', 2)) +
    // vestido
    path('M60 64 Q80 74 100 64 L104 92 Q80 100 56 92Z', fs(c.base, c.line, 2.5)) +
    path(
      'M56 92 Q80 100 104 92 Q140 160 148 226 Q80 244 12 226 Q20 160 56 92Z',
      fs(c.base, c.line, 3),
    ) +
    path('M60 112 Q48 170 40 218', st(c.light, 5, 0.8)) +
    path('M80 104 Q78 170 80 232', st(c.shade, 3, 0.6)) +
    path('M100 110 Q116 160 122 220', st(c.shade, 3, 0.6)) +
    path(scallops(14, 146, 226, 9, 10), st(c.shade, 3)) +
    path('M60 94 Q80 104 100 94', st('url(#k-gold-h)', 4)) +
    heart(80, 82, 6, goldFill(1.2)) +
    sparkle(44, 160, 5) +
    sparkle(116, 190, 6) +
    sparkle(84, 140, 4),
};

const lareira: ItemArt = {
  w: 240,
  h: 230,
  draw: ({ ramp: c }) =>
    shadow(120, 222, 110, 8) +
    rect(20, 70, 200, 150, 10, fs('#fbf3f0', '#d6c1c8', 3)) +
    path('M20 70 L220 70 L220 84 L20 84Z', { fill: c.light, opacity: 0.6 }) +
    rect(8, 56, 224, 20, 8, fs(c.base, c.line, 3)) +
    path('M14 62 L226 62', st('url(#k-gold-h)', 3)) +
    // boca da lareira
    path(
      'M58 220 L58 140 Q58 106 120 106 Q182 106 182 140 L182 220Z',
      fs('#4a3340', '#3a2833', 3),
    ) +
    path('M66 220 L66 142 Q66 116 120 116 Q174 116 174 142 L174 220', st(c.base, 6)) +
    // lenha e fogo
    path('M84 212 L156 200 M86 200 L154 214', st(FIXED.wood.line, 9)) +
    path('M84 212 L156 200 M86 200 L154 214', st(FIXED.wood.base, 5)) +
    flame(104, 204, 1.3) +
    flame(124, 202, 1.7) +
    flame(142, 206, 1.2) +
    ellipse(120, 190, 40, 22, { fill: '#ffb347', opacity: 0.25 }) +
    // enfeites no console
    heart(120, 40, 14, fs(c.base, c.line, 2)) +
    rect(36, 22, 10, 34, 3, fs('#fffaf6', c.line, 1.5)) +
    rect(194, 22, 10, 34, 3, fs('#fffaf6', c.line, 1.5)) +
    flame(41, 22, 0.7) +
    flame(199, 22, 0.7) +
    pearl(30, 92, 5) +
    pearl(210, 92, 5),
};

const mesinha: ItemArt = {
  w: 120,
  h: 150,
  draw: ({ ramp: c }) =>
    shadow(60, 142, 40, 6) +
    path('M54 64 Q58 104 44 132 L76 132 Q62 104 66 64Z', goldFill(2)) +
    ellipse(60, 132, 22, 6, goldFill(2)) +
    ellipse(60, 52, 50, 13, fs('#fff', c.line, 2.5)) +
    path(
      'M10 52 Q12 72 26 74 Q34 66 42 76 Q52 66 60 76 Q68 66 78 76 Q86 66 94 74 Q108 72 110 52',
      fs(c.base, c.line, 2),
    ) +
    ellipse(60, 49, 38, 7, { fill: '#fff', opacity: 0.6 }),
};

const namoradeira: ItemArt = {
  w: 230,
  h: 180,
  draw: ({ ramp: c }) =>
    shadow(115, 170, 100, 9) +
    heart(115, 72, 64, fs(c.base, c.line, 3)) +
    heart(115, 74, 50, { fill: c.light, opacity: 0.55 }) +
    tufts(85, 52, 3, 3, 30, 20, c.shade) +
    path('M22 112 Q20 92 40 92 Q58 92 58 112 L58 146 L24 146 Z', fs(c.base, c.line, 3)) +
    path('M208 112 Q210 92 190 92 Q172 92 172 112 L172 146 L206 146 Z', fs(c.base, c.line, 3)) +
    path(
      'M54 118 Q54 104 70 104 L160 104 Q176 104 176 118 L176 132 L54 132Z',
      fs(c.light, c.line, 2.5),
    ) +
    rect(22, 128, 186, 22, 10, fs(c.base, c.line, 3)) +
    path(scallops(26, 204, 148, 7, 7), st(c.shade, 2.5)) +
    goldLeg(36, 148, 16, -1) +
    goldLeg(194, 148, 16, 1) +
    heart(115, 26, 7, goldFill(1.5)),
};

const biombo: ItemArt = {
  w: 240,
  h: 240,
  draw: ({ ramp: c }) => {
    const panel = (x: number, skew: number) =>
      path(`M${x} 220 L${x} 60 Q${x} 26 ${x + 38} 26 Q${x + 76} 26 ${x + 76} 60 L${x + 76} 220Z`, {
        ...fs(c.light, c.line, 2.5),
        transform: `skewY(${skew})`,
      }) +
      path(
        `M${x + 10} 212 L${x + 10} 64 Q${x + 10} 38 ${x + 38} 38 Q${x + 66} 38 ${x + 66} 64 L${x + 66} 212`,
        {
          ...st(GOLD.line, 2),
          transform: `skewY(${skew})`,
        },
      );
    return (
      shadow(120, 232, 108, 8) +
      g(panel(4, 4), { transform: 'translate(0 -8)' }) +
      panel(82, 0) +
      g(panel(160, -4), { transform: 'translate(0 12)' }) +
      // flores pintadas
      circle(120, 120, 16, fs(c.base, c.line, 2)) +
      circle(120, 120, 6, { fill: GOLD.base }) +
      path('M120 136 Q118 170 120 196', st(FIXED.leaf.line, 3)) +
      path('M120 160 Q104 150 98 160 Q108 170 120 164', fs(FIXED.leaf.base, FIXED.leaf.line, 1.5)) +
      heart(42, 110, 10, fs(c.base, c.line, 1.5)) +
      heart(198, 120, 10, fs(c.base, c.line, 1.5)) +
      sparkle(54, 160, 6, c.shade) +
      sparkle(188, 170, 6, c.shade)
    );
  },
};

const pufe: ItemArt = {
  w: 130,
  h: 100,
  draw: ({ ramp: c }) =>
    shadow(65, 92, 54, 6) +
    path(
      'M12 56 Q12 30 65 30 Q118 30 118 56 L114 76 Q110 88 65 88 Q20 88 16 76Z',
      fs(c.base, c.line, 3),
    ) +
    ellipse(65, 40, 50, 12, fs(c.light, c.line, 2)) +
    circle(65, 40, 4, { fill: c.shade }) +
    circle(42, 40, 3, { fill: c.shade }) +
    circle(88, 40, 3, { fill: c.shade }) +
    path(scallops(16, 114, 76, 6, 7), st(c.shade, 2.5)) +
    path('M14 60 L8 74 M116 60 L122 74', st(GOLD.line, 2.5)) +
    circle(8, 76, 4, goldFill(1.2)) +
    circle(122, 76, 4, goldFill(1.2)),
};

export default {
  berco,
  'guarda-roupa': guardaRoupa,
  comoda,
  'sofa-real': sofaReal,
  diva,
  'mesa-cha': mesaCha,
  cadeira,
  estante,
  banheira,
  pia,
  'armario-cozinha': armarioCozinha,
  fogao,
  geladeira,
  'mesa-jantar': mesaJantar,
  piano,
  harpa,
  cabideiro,
  sapateira,
  manequim,
  lareira,
  mesinha,
  namoradeira,
  biombo,
  pufe,
} satisfies ArtPack;
