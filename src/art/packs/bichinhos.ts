import { circle, ellipse, fs, g, heart, path, shadow, st } from '../kit';
import { FIXED } from '../palette';
import type { ArtPack } from '../types';

const GOLD = FIXED.gold;
const EYE = FIXED.eye;
const PINK = '#ffb3cf';

/** Olhos grandes e brilhantes que piscam (classe a-blink). */
function eyes(lx: number, rx: number, y: number, r: number): string {
  const one = (x: number) =>
    ellipse(x, y, r, r * 1.15, { fill: EYE }) +
    circle(x - r * 0.35, y - r * 0.4, r * 0.38, { fill: '#fff' }) +
    circle(x + r * 0.35, y + r * 0.35, r * 0.16, { fill: '#fff' });
  return g(one(lx) + one(rx), { class: 'a-blink' });
}

const gatinho = {
  w: 180,
  h: 170,
  draw: ({ ramp: c }) =>
    shadow(88, 160, 66, 8) +
    // rabo
    g(
      path('M126 140 Q170 136 164 96 Q160 76 146 84', st(c.line, 16)) +
        path('M126 140 Q170 136 164 96 Q160 76 146 84', st(c.base, 11)),
      {
        class: 'a-tail',
      },
    ) +
    // corpo
    g(
      path('M50 156 Q38 112 66 92 L110 92 Q138 112 126 156Z', fs(c.base, c.line, 3)) +
        path('M72 150 Q70 120 88 108 Q106 120 104 150Z', { fill: c.light }) +
        ellipse(66, 154, 16, 9, fs(c.light, c.line, 2.5)) +
        ellipse(110, 154, 16, 9, fs(c.light, c.line, 2.5)) +
        path(
          'M62 152 L62 158 M70 152 L70 158 M106 152 L106 158 M114 152 L114 158',
          st(c.line, 1.5, 0.6),
        ),
      { class: 'a-breathe' },
    ) +
    // cabeça
    path('M40 34 L52 82 L72 58Z', fs(c.base, c.line, 3)) +
    path('M136 34 L124 82 L104 58Z', fs(c.base, c.line, 3)) +
    path('M46 46 L54 72 L64 60Z', { fill: PINK }) +
    path('M130 46 L122 72 L112 60Z', { fill: PINK }) +
    ellipse(88, 74, 52, 42, fs(c.base, c.line, 3)) +
    path('M58 52 Q66 44 76 48', st(c.shade, 3, 0.8)) +
    path('M84 40 L84 50 M92 40 L92 50', st(c.shade, 3, 0.8)) +
    eyes(70, 106, 76, 8) +
    ellipse(56, 92, 9, 5, { fill: FIXED.blush, opacity: 0.55 }) +
    ellipse(120, 92, 9, 5, { fill: FIXED.blush, opacity: 0.55 }) +
    path('M84 88 L92 88 L88 93Z', fs(PINK, '#e58aac', 1.5)) +
    path('M80 97 Q84 101 88 96 Q92 101 96 97', st(EYE, 2)) +
    path('M40 86 L62 88 M40 96 L62 94 M136 86 L114 88 M136 96 L114 94', st(c.line, 1.6, 0.7)) +
    // coleira
    path('M56 110 Q88 122 120 110', st('#f08fb8', 7)) +
    circle(88, 120, 7, fs('url(#k-gold)', GOLD.line, 2)) +
    path('M84 122 L92 122', st(GOLD.line, 1.5)),
} satisfies ArtPack[string];

const coelho = {
  w: 160,
  h: 200,
  draw: ({ ramp: c }) =>
    shadow(80, 190, 56, 7) +
    // orelhas
    path('M58 84 Q40 30 52 10 Q66 0 72 24 Q78 52 74 84Z', fs(c.base, c.line, 3)) +
    path('M58 76 Q48 38 56 20 Q64 18 66 36 Q70 58 68 78Z', { fill: PINK }) +
    g(
      path('M88 84 Q100 40 120 30 Q140 22 138 40 Q132 60 104 86Z', fs(c.base, c.line, 3)) +
        path('M96 78 Q108 48 122 40 Q130 38 128 48 Q120 64 102 82Z', { fill: PINK }),
      { class: 'a-ear' },
    ) +
    // corpo
    g(
      ellipse(80, 148, 50, 42, fs(c.base, c.line, 3)) +
        ellipse(80, 156, 30, 28, { fill: c.light }) +
        circle(128, 160, 12, fs('#fff', c.line, 2)) +
        ellipse(58, 184, 18, 9, fs(c.light, c.line, 2.5)) +
        ellipse(102, 184, 18, 9, fs(c.light, c.line, 2.5)),
      { class: 'a-breathe' },
    ) +
    // cabeça
    ellipse(80, 102, 42, 36, fs(c.base, c.line, 3)) +
    eyes(64, 96, 100, 7) +
    ellipse(52, 116, 8, 4.5, { fill: FIXED.blush, opacity: 0.55 }) +
    ellipse(108, 116, 8, 4.5, { fill: FIXED.blush, opacity: 0.55 }) +
    g(path('M76 112 Q80 108 84 112 Q80 117 76 112Z', fs(PINK, '#e58aac', 1.5)), {
      class: 'a-nose',
    }) +
    path('M80 116 L80 120 M74 123 Q80 127 86 123', st(EYE, 1.8)) +
    // lacinho
    path('M62 72 Q46 62 46 76 Q48 86 62 78Z', fs('#f08fb8', '#d9659b', 2)) +
    path('M62 72 Q78 62 78 76 Q76 86 62 78Z', fs('#f08fb8', '#d9659b', 2)) +
    circle(62, 75, 4, fs('#f6a9cb', '#d9659b', 1.5)) +
    heart(80, 150, 6, { fill: c.shade, opacity: 0.5 }),
} satisfies ArtPack[string];

export default { gatinho, coelho } satisfies ArtPack;
