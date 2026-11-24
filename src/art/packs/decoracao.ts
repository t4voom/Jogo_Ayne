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
import type { ArtPack } from '../types';

const GOLD = FIXED.gold;

/** Chama de vela tremulando (classe de animação a-flicker). */
function flame(cx: number, baseY: number, s = 1): string {
  return g(
    path(
      `M${cx} ${baseY - 22 * s} Q${cx + 8 * s} ${baseY - 10 * s} ${cx + 5 * s} ${baseY - 3 * s} Q${cx} ${baseY + 2 * s} ${cx - 5 * s} ${baseY - 3 * s} Q${cx - 8 * s} ${baseY - 10 * s} ${cx} ${baseY - 22 * s}Z`,
      { fill: 'url(#k-flame)' },
    ) + ellipse(cx, baseY - 6 * s, 2.2 * s, 4 * s, { fill: '#fff' }),
    { class: 'a-flicker' },
  );
}

function crystal(cx: number, cy: number, s = 1): string {
  return (
    path(
      `M${cx} ${cy - 9 * s} L${cx + 5 * s} ${cy} L${cx} ${cy + 11 * s} L${cx - 5 * s} ${cy}Z`,
      fs('url(#k-glass)', FIXED.glass.line, 1.4 * s),
    ) + path(`M${cx - 1.5 * s} ${cy - 4 * s} L${cx - 3 * s} ${cy}`, st('#fff', 1.4 * s))
  );
}

const lustre = {
  w: 240,
  h: 220,
  light: { x: 120, y: 120, r: 140 },
  draw: ({ ramp: c }) => {
    const arms = [40, 80, 160, 200];
    let out =
      // corrente
      path('M120 0 L120 40', st(GOLD.line, 5)) +
      path('M120 0 L120 40', st('#f6d27a', 2.5)) +
      circle(120, 44, 9, fs('url(#k-gold)', GOLD.line, 2)) +
      // braços
      path('M120 100 Q70 130 40 104', st(GOLD.line, 7)) +
      path('M120 100 Q170 130 200 104', st(GOLD.line, 7)) +
      path('M120 100 Q90 126 80 104', st(GOLD.line, 7)) +
      path('M120 100 Q150 126 160 104', st(GOLD.line, 7)) +
      path('M120 100 Q70 130 40 104', st('#f6d27a', 3.5)) +
      path('M120 100 Q170 130 200 104', st('#f6d27a', 3.5)) +
      path('M120 100 Q90 126 80 104', st('#f6d27a', 3.5)) +
      path('M120 100 Q150 126 160 104', st('#f6d27a', 3.5));
    // corpo central
    out +=
      path(
        'M100 52 Q120 44 140 52 L134 110 Q120 122 106 110Z',
        fs('url(#k-gold)', GOLD.line, 2.5),
      ) +
      ellipse(120, 82, 13, 18, fs(c.base, c.line, 2)) +
      shine('M114 72 Q118 66 122 66 L118 86Z', 0.7);
    for (const x of arms) {
      out +=
        rect(x - 10, 96, 20, 8, 4, fs('url(#k-gold)', GOLD.line, 1.6)) +
        rect(x - 6, 76, 12, 22, 3, fs('#fffaf3', c.line, 1.6)) +
        flame(x, 76, 0.9);
    }
    // gotas de cristal
    const drops: [number, number][] = [
      [52, 128],
      [74, 136],
      [96, 140],
      [120, 146],
      [144, 140],
      [166, 136],
      [188, 128],
      [108, 160],
      [132, 160],
      [120, 178],
    ];
    for (const [x, y] of drops)
      out += path(`M${x} ${y - 14} L${x} ${y - 6}`, st(GOLD.line, 1)) + crystal(x, y);
    out += pearl(120, 196, 7) + sparkle(64, 58, 6) + sparkle(182, 70, 5);
    return out;
  },
} satisfies ArtPack[string];

const espelhoOval = {
  w: 150,
  h: 210,
  draw: ({ ramp: c }) =>
    ellipse(75, 112, 62, 84, fs('url(#k-gold)', GOLD.line, 3)) +
    ellipse(75, 112, 62, 84, st('#fff1c2', 2, 0.6)) +
    ellipse(75, 112, 50, 72, { fill: 'url(#k-glass)', stroke: GOLD.line, 'stroke-width': 2 }) +
    shine('M44 92 Q50 60 74 46 L66 64 Q54 82 52 112Z', 0.8) +
    shine('M94 162 Q106 152 112 136 L114 152 Q106 168 96 172Z', 0.45) +
    // ornamentos da moldura
    pearl(75, 28, 6) +
    pearl(75, 196, 6) +
    pearl(13, 112, 5) +
    pearl(137, 112, 5) +
    // laço
    path('M75 24 Q52 6 44 18 Q40 30 75 28Z', fs(c.base, c.line, 2.2)) +
    path('M75 24 Q98 6 106 18 Q110 30 75 28Z', fs(c.base, c.line, 2.2)) +
    path('M70 28 Q62 42 56 50', st(c.line, 5)) +
    path('M70 28 Q62 42 56 50', st(c.base, 3)) +
    path('M80 28 Q88 42 94 50', st(c.line, 5)) +
    path('M80 28 Q88 42 94 50', st(c.base, 3)) +
    circle(75, 26, 6, fs(c.shade, c.line, 2)) +
    sparkle(108, 70, 6),
} satisfies ArtPack[string];

const tapeteRedondo = {
  w: 300,
  h: 130,
  draw: ({ ramp: c }) => {
    let fringe = '';
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const x = 150 + Math.cos(a) * 146;
      const y = 65 + Math.sin(a) * 60;
      const x2 = 150 + Math.cos(a) * 154;
      const y2 = 65 + Math.sin(a) * 64;
      fringe += path(
        `M${x.toFixed(1)} ${y.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`,
        st(c.shade, 2.2),
      );
    }
    return (
      fringe +
      ellipse(150, 65, 146, 60, fs(c.base, c.line, 3)) +
      ellipse(150, 65, 124, 50, fs(c.light, c.line, 2)) +
      ellipse(150, 65, 104, 41, st(c.shade, 6, 0.8)) +
      ellipse(150, 65, 80, 31, fs(c.base, c.line, 2)) +
      ellipse(150, 65, 56, 21, fs(c.light, c.line, 1.5)) +
      heart(150, 66, 13, fs(c.shade, c.line, 1.5)) +
      g(
        [0, 60, 120, 180, 240, 300]
          .map((deg) => {
            const a = (deg * Math.PI) / 180;
            return heart(150 + Math.cos(a) * 114, 65 + Math.sin(a) * 45.5, 5, {
              fill: c.deep,
              opacity: 0.8,
            });
          })
          .join(''),
      ) +
      ellipse(130, 50, 60, 14, { fill: '#fff', opacity: 0.25 })
    );
  },
} satisfies ArtPack[string];

const abajur = {
  w: 130,
  h: 210,
  light: { x: 65, y: 60, r: 110 },
  draw: ({ ramp: c }) =>
    shadow(65, 202, 46, 6) +
    // base
    path('M44 196 Q40 184 50 178 L80 178 Q90 184 86 196Z', fs('url(#k-gold)', GOLD.line, 2.2)) +
    path(
      'M54 180 Q30 150 46 124 Q56 110 65 110 Q74 110 84 124 Q100 150 76 180Z',
      fs(c.base, c.line, 3),
    ) +
    shine('M52 132 Q58 120 64 118 Q56 134 56 156Z', 0.6) +
    heart(65, 148, 8, fs(c.light, c.line, 1.5)) +
    rect(60, 92, 10, 20, 3, fs('url(#k-gold)', GOLD.line, 1.6)) +
    // cúpula
    path('M30 96 L44 30 Q65 22 86 30 L100 96 Q65 106 30 96Z', fs(c.light, c.line, 3)) +
    path('M34 84 Q65 94 96 84', st(c.shade, 2.5, 0.8)) +
    path('M44 30 Q65 22 86 30', st('url(#k-gold-h)', 4)) +
    path('M30 96 Q65 106 100 96', st('url(#k-gold-h)', 4)) +
    path('M54 34 L46 90', st('#fff', 3, 0.6)) +
    pearl(65, 22, 5),
} satisfies ArtPack[string];

const janelaArco = {
  w: 230,
  h: 280,
  draw: ({ ramp: c }) => {
    const curtain = g(
      path(
        'M14 56 Q44 50 62 60 Q46 130 58 176 Q40 220 34 268 L10 268 Q4 160 14 56Z',
        fs(c.base, c.line, 2.5),
      ) +
        path('M24 74 Q20 160 20 256', st(c.shade, 3, 0.8)) +
        path('M40 72 Q34 130 44 176', st(c.shade, 2.5, 0.6)) +
        path('M18 62 Q28 66 38 62', st(c.light, 3)) +
        rect(36, 170, 28, 10, 5, fs('url(#k-gold)', GOLD.line, 1.5)) +
        circle(64, 176, 5, fs('url(#k-gold)', GOLD.line, 1.5)),
    );
    return (
      // moldura
      path('M36 250 L36 110 Q36 30 115 30 Q194 30 194 110 L194 250Z', fs('#fffaf6', '#dcc6d3', 3)) +
      path('M50 244 L50 112 Q50 46 115 46 Q180 46 180 112 L180 244Z', {
        fill: 'url(#k-sky-window)',
        stroke: '#e5cfdc',
        'stroke-width': 2,
      }) +
      // nuvenzinhas e sol
      circle(146, 96, 14, { fill: '#fff3b8', opacity: 0.9 }) +
      path(
        'M66 150 Q70 138 84 140 Q90 128 104 134 Q118 132 116 146 Q126 150 118 158 L72 158 Q60 158 66 150Z',
        {
          fill: '#fff',
          opacity: 0.9,
        },
      ) +
      // caixilhos
      path('M115 46 L115 244', st('#fffaf6', 6)) +
      path('M50 150 L180 150', st('#fffaf6', 6)) +
      path('M115 46 L115 244', st('#e5cfdc', 1.5)) +
      path('M50 150 L180 150', st('#e5cfdc', 1.5)) +
      shine('M62 120 Q66 72 100 56 L92 76 Q74 96 74 130Z', 0.55) +
      // parapeito
      rect(26, 244, 178, 16, 8, fs('#fffaf6', '#dcc6d3', 2.5)) +
      path('M34 250 L196 250', st('url(#k-gold-h)', 2.5)) +
      // cortinas
      curtain +
      g(curtain, { transform: 'translate(230 0) scale(-1 1)' }) +
      // sanefa
      path(
        'M6 50 Q115 14 224 50 L224 62 Q196 76 170 62 Q143 76 115 62 Q87 76 60 62 Q33 76 6 62Z',
        fs(c.base, c.line, 2.5),
      ) +
      path('M8 48 Q115 12 222 48', st('url(#k-gold-h)', 4)) +
      gem(115, 28, 6, c.light, c.line)
    );
  },
} satisfies ArtPack[string];

const castical = {
  w: 110,
  h: 190,
  light: { x: 55, y: 40, r: 80 },
  draw: ({ ramp: c }) =>
    shadow(55, 182, 40, 6) +
    ellipse(55, 174, 36, 9, fs('url(#k-gold)', GOLD.line, 2.2)) +
    path('M46 170 Q50 150 52 120 L58 120 Q60 150 64 170Z', fs('url(#k-gold)', GOLD.line, 2)) +
    circle(55, 136, 8, fs('url(#k-gold)', GOLD.line, 2)) +
    gem(55, 136, 3.5, c.base, c.line) +
    ellipse(55, 118, 22, 7, fs('url(#k-gold)', GOLD.line, 2)) +
    // vela
    rect(44, 52, 22, 66, 6, fs('#fffaf3', c.line, 2.2)) +
    path('M48 56 L48 112', st(c.light, 4)) +
    path('M58 52 Q60 64 56 70', st('#fffaf3', 5)) +
    path('M58 52 Q60 64 56 70', st(c.line, 1.2, 0.5)) +
    path('M55 52 L55 44', st('#6b4a5e', 2)) +
    flame(55, 46, 1.05),
} satisfies ArtPack[string];

const coroaAlmofada = {
  w: 170,
  h: 150,
  draw: ({ ramp: c }) =>
    shadow(85, 140, 74, 8) +
    // almofada
    path(
      'M14 112 Q10 84 40 82 L130 82 Q160 84 156 112 Q160 136 130 136 L40 136 Q10 136 14 112Z',
      fs(c.base, c.line, 3),
    ) +
    path('M28 98 Q85 86 142 98', st(c.light, 4, 0.9)) +
    circle(16, 86, 8, fs('url(#k-gold)', GOLD.line, 1.6)) +
    circle(154, 86, 8, fs('url(#k-gold)', GOLD.line, 1.6)) +
    circle(16, 132, 8, fs('url(#k-gold)', GOLD.line, 1.6)) +
    circle(154, 132, 8, fs('url(#k-gold)', GOLD.line, 1.6)) +
    path('M8 80 L4 70 M24 80 L26 70', st(GOLD.line, 2)) +
    // coroa
    path(
      'M44 98 L36 40 Q35 32 42 36 L62 54 L80 22 Q85 14 90 22 L108 54 L128 36 Q135 32 134 40 L126 98Z',
      fs('url(#k-gold)', GOLD.line, 3),
    ) +
    path('M50 88 L44 50 L62 66Z', { fill: '#fff6d6', opacity: 0.6 }) +
    rect(40, 86, 90, 18, 8, fs('url(#k-gold)', GOLD.line, 2.5)) +
    gem(85, 95, 6, c.base, c.line) +
    gem(60, 95, 4, FIXED.glass.base, FIXED.glass.line) +
    gem(110, 95, 4, FIXED.glass.base, FIXED.glass.line) +
    pearl(38, 34, 5) +
    pearl(85, 16, 6) +
    pearl(132, 34, 5) +
    sparkle(146, 50, 7) +
    sparkle(24, 58, 5),
} satisfies ArtPack[string];

export default {
  'lustre-cristal': lustre,
  'espelho-oval': espelhoOval,
  'tapete-redondo': tapeteRedondo,
  abajur,
  'janela-arco': janelaArco,
  castical,
  'coroa-almofada': coroaAlmofada,
} satisfies ArtPack;
