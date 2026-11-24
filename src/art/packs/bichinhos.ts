import { circle, ellipse, fs, g, gem, heart, leaf, path, rect, shadow, sparkle, st } from '../kit';
import { FIXED } from '../palette';
import type { ArtPack } from '../types';

const GOLD = FIXED.gold;
const goldFill = (w = 2) => fs('url(#k-gold)', GOLD.line, w);
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

const MANE = ['#f9b8d4', '#d7c1f6', '#b9def7', '#b5e7d0', '#fadc8e'];

const cachorro = {
  w: 180,
  h: 170,
  draw: ({ ramp: c }) =>
    shadow(90, 160, 66, 8) +
    g(
      path('M128 120 Q160 110 156 84', st(c.line, 14)) +
        path('M128 120 Q160 110 156 84', st(c.base, 9)),
      { class: 'a-tail' },
    ) +
    g(
      path('M50 156 Q40 112 66 96 L114 96 Q140 112 130 156Z', fs(c.base, c.line, 3)) +
        ellipse(90, 130, 22, 22, { fill: c.light }) +
        ellipse(66, 154, 16, 9, fs(c.light, c.line, 2.5)) +
        ellipse(114, 154, 16, 9, fs(c.light, c.line, 2.5)),
      { class: 'a-breathe' },
    ) +
    // orelhas caídas
    path('M44 44 Q20 50 22 86 Q26 104 44 96 Q52 70 56 52Z', fs(c.shade, c.line, 3)) +
    path('M136 44 Q160 50 158 86 Q154 104 136 96 Q128 70 124 52Z', fs(c.shade, c.line, 3)) +
    ellipse(90, 70, 48, 42, fs(c.base, c.line, 3)) +
    ellipse(90, 88, 24, 17, { fill: c.light }) +
    eyes(72, 108, 66, 7.5) +
    ellipse(90, 82, 9, 6, { fill: FIXED.eye }) +
    circle(87, 80, 2.2, { fill: '#fff' }) +
    path('M84 92 Q90 98 96 92', st(EYE, 2)) +
    g(path('M88 96 Q90 108 96 104 Q98 98 92 96Z', fs('#ff9eb5', '#e0708e', 1.2)), {
      class: 'a-nose',
    }) +
    ellipse(60, 84, 8, 5, { fill: FIXED.blush, opacity: 0.55 }) +
    ellipse(120, 84, 8, 5, { fill: FIXED.blush, opacity: 0.55 }) +
    path('M58 110 Q90 122 122 110', st(c.deep, 7)) +
    gem(90, 118, 5, GOLD.base, GOLD.line),
} satisfies ArtPack[string];

const unicornio = {
  w: 210,
  h: 210,
  draw: ({ ramp: c }) => {
    const mane = MANE.map((col, i) =>
      path(
        `M${118 - i * 4} ${44 + i * 14} Q${148 - i * 2} ${54 + i * 16} ${140 - i * 6} ${78 + i * 16}`,
        st(col, 11),
      ),
    ).join('');
    return (
      shadow(110, 202, 80, 8) +
      // rabo
      g(
        MANE.map((col, i) =>
          path(
            `M170 ${112 + i * 3} Q${200 - i * 2} ${130 + i * 4} ${184 - i * 3} ${172 + i * 3}`,
            st(col, 8),
          ),
        ).join(''),
        { class: 'a-tail' },
      ) +
      g(
        ellipse(132, 132, 54, 34, fs('#fffaf6', c.line, 3)) +
          rect(92, 146, 16, 48, 8, fs('#fffaf6', c.line, 2.5)) +
          rect(116, 150, 16, 46, 8, fs('#fffaf6', c.line, 2.5)) +
          rect(148, 150, 16, 46, 8, fs('#fffaf6', c.line, 2.5)) +
          rect(170, 146, 16, 46, 8, fs('#fffaf6', c.line, 2.5)) +
          rect(92, 186, 16, 10, 4, fs(GOLD.base, GOLD.line, 1.5)) +
          rect(116, 188, 16, 10, 4, fs(GOLD.base, GOLD.line, 1.5)) +
          rect(148, 188, 16, 10, 4, fs(GOLD.base, GOLD.line, 1.5)) +
          rect(170, 186, 16, 10, 4, fs(GOLD.base, GOLD.line, 1.5)) +
          heart(140, 126, 8, { fill: c.base, opacity: 0.8 }),
        { class: 'a-breathe' },
      ) +
      // pescoço e cabeça
      path('M96 120 Q82 84 74 60 L116 50 Q120 90 128 112Z', fs('#fffaf6', c.line, 3)) +
      path(
        'M44 66 Q40 36 74 30 Q108 26 116 56 Q118 82 92 88 Q60 94 48 82Z',
        fs('#fffaf6', c.line, 3),
      ) +
      ellipse(56, 76, 14, 10, { fill: '#ffe1ec' }) +
      circle(52, 74, 2, { fill: c.line }) +
      mane +
      // chifre
      path('M74 32 L62 -2 L86 28Z', fs('url(#k-gold)', GOLD.line, 2)) +
      path('M66 10 L80 14 M70 20 L82 22', st(GOLD.line, 1.5)) +
      path('M96 34 L104 18 L108 38Z', fs('#fffaf6', c.line, 2)) +
      eyes(82, 82, 56, 7) +
      ellipse(84, 70, 8, 4.5, { fill: FIXED.blush, opacity: 0.55 }) +
      `<g class="a-twinkle">${sparkle(30, 30, 8, '#fff6c9')}${sparkle(180, 70, 6, '#fff6c9')}</g>`
    );
  },
} satisfies ArtPack[string];

const ponei = {
  w: 180,
  h: 180,
  draw: ({ ramp: c }) =>
    shadow(92, 172, 66, 7) +
    g(
      path('M140 100 Q170 110 160 150', st(c.deep, 14)) +
        path('M140 100 Q170 110 160 150', st(c.shade, 8)),
      { class: 'a-tail' },
    ) +
    g(
      ellipse(110, 110, 44, 30, fs(c.base, c.line, 3)) +
        rect(78, 122, 14, 42, 7, fs(c.base, c.line, 2.5)) +
        rect(98, 126, 14, 40, 7, fs(c.base, c.line, 2.5)) +
        rect(122, 126, 14, 40, 7, fs(c.base, c.line, 2.5)) +
        rect(140, 122, 14, 42, 7, fs(c.base, c.line, 2.5)) +
        heart(112, 108, 7, fs(c.light, c.line, 1.2)) +
        sparkle(126, 96, 6, '#fff'),
      { class: 'a-breathe' },
    ) +
    path('M80 104 Q68 74 62 54 L98 46 Q100 80 106 98Z', fs(c.base, c.line, 3)) +
    path('M30 60 Q28 34 58 28 Q90 24 96 52 Q98 74 74 80 Q46 86 34 74Z', fs(c.base, c.line, 3)) +
    ellipse(42, 70, 12, 9, { fill: c.light }) +
    path('M58 28 Q76 6 96 26 Q108 44 100 70 Q92 54 84 40 Q72 38 58 28Z', fs(c.shade, c.line, 2.5)) +
    path('M70 26 L66 12 L80 22Z', fs(c.base, c.line, 2)) +
    eyes(68, 68, 50, 6.5) +
    ellipse(70, 64, 7, 4, { fill: FIXED.blush, opacity: 0.55 }) +
    circle(40, 68, 1.8, { fill: c.line }) +
    path('M88 32 Q96 28 100 36', st('#fff', 3, 0.7)),
} satisfies ArtPack[string];

const cisne = {
  w: 190,
  h: 160,
  draw: ({ ramp: c }) =>
    `<g class="a-bob">` +
    ellipse(100, 140, 82, 12, { fill: FIXED.water.base, opacity: 0.55 }) +
    path(
      'M38 112 Q34 74 76 76 L136 80 Q176 82 172 112 Q150 140 100 140 Q56 140 38 112Z',
      fs('#fffaf6', '#d6c1c8', 3),
    ) +
    path('M92 86 Q120 70 160 92 Q134 112 96 108Z', fs('#ffffff', '#d6c1c8', 2)) +
    path('M100 94 Q126 86 148 96', st(c.base, 2.5, 0.7)) +
    path(
      'M54 96 Q40 50 60 30 Q80 14 92 34 Q96 46 84 50 Q72 50 72 70 Q72 86 80 96',
      fs('none', '#d6c1c8', 14),
    ) +
    path(
      'M54 96 Q40 50 60 30 Q80 14 92 34 Q96 46 84 50 Q72 50 72 70 Q72 86 80 96',
      st('#fffaf6', 9),
    ) +
    path('M88 32 L104 38 L90 44Z', fs('#ffb36b', '#e08a3e', 1.5)) +
    g(circle(80, 34, 2.6, { fill: EYE }) + circle(79, 33, 0.9, { fill: '#fff' }), {
      class: 'a-blink',
    }) +
    crownTop2(74, 22) +
    heart(120, 124, 6, { fill: c.base, opacity: 0.8 }) +
    `</g>`,
} satisfies ArtPack[string];

function crownTop2(x: number, y: number): string {
  return path(
    `M${x - 8} ${y + 4} L${x - 9} ${y - 4} L${x - 4} ${y} L${x} ${y - 6} L${x + 4} ${y} L${x + 9} ${y - 4} L${x + 8} ${y + 4}Z`,
    fs('url(#k-gold)', GOLD.line, 1.2),
  );
}

const borboletas = {
  w: 170,
  h: 130,
  draw: ({ ramp: c }) => {
    const fly = (x: number, y: number, s: number, a: string, b: string, delay: number) =>
      `<g class="a-flutter" style="animation-delay:${delay}s">` +
      g(
        path('M0 0 Q-26 -30 -34 -6 Q-36 10 0 4Z', fs(a, c.line, 1.8)) +
          path('M0 4 Q-24 14 -18 28 Q-6 30 0 8Z', fs(b, c.line, 1.8)) +
          path('M0 0 Q26 -30 34 -6 Q36 10 0 4Z', fs(a, c.line, 1.8)) +
          path('M0 4 Q24 14 18 28 Q6 30 0 8Z', fs(b, c.line, 1.8)) +
          circle(-18, -6, 4, { fill: '#fff', opacity: 0.8 }) +
          circle(18, -6, 4, { fill: '#fff', opacity: 0.8 }) +
          ellipse(0, 8, 3, 12, { fill: FIXED.eye }) +
          path('M-1 -4 Q-6 -16 -10 -18 M1 -4 Q6 -16 10 -18', st(FIXED.eye, 1.4)),
        { transform: `translate(${x} ${y}) scale(${s})` },
      ) +
      `</g>`;
    return (
      fly(56, 60, 1.1, c.base, c.light, 0) +
      fly(126, 40, 0.8, '#c8b0f0', '#ffe28a', 0.4) +
      fly(120, 100, 0.6, '#9fd3f2', c.light, 0.8)
    );
  },
} satisfies ArtPack[string];

const passarinho = {
  w: 140,
  h: 120,
  draw: ({ ramp: c }) =>
    shadow(70, 112, 40, 5) +
    path('M20 106 L120 106', st(FIXED.wood.line, 8)) +
    path('M20 106 L120 106', st(FIXED.wood.base, 5)) +
    leaf(26, 104, 20, -150, FIXED.leaf.base, FIXED.leaf.line) +
    `<g class="a-bob">` +
    path('M104 64 L132 50 L124 70Z', fs(c.shade, c.line, 2)) +
    ellipse(72, 66, 40, 32, fs(c.base, c.line, 3)) +
    ellipse(66, 78, 22, 16, { fill: c.light }) +
    path('M78 58 Q100 50 104 72 Q92 82 78 74Z', fs(c.shade, c.line, 2)) +
    path('M36 58 L22 62 L36 68Z', fs('#ffb36b', '#e08a3e', 1.5)) +
    g(circle(50, 54, 4.5, { fill: EYE }) + circle(48, 52, 1.5, { fill: '#fff' }), {
      class: 'a-blink',
    }) +
    ellipse(48, 66, 6, 3.5, { fill: FIXED.blush, opacity: 0.6 }) +
    path('M62 98 L60 108 M78 98 L80 108', st('#e08a3e', 2.5)) +
    path('M70 34 Q74 22 82 26', st(c.line, 2.5)) +
    `</g>` +
    `<g class="a-twinkle">${path('M108 28 L108 12 L118 10 L118 24', st(c.line, 2))}${circle(105, 28, 3, { fill: c.line })}${circle(115, 24, 3, { fill: c.line })}</g>`,
} satisfies ArtPack[string];

const aquario = {
  w: 170,
  h: 170,
  draw: ({ ramp: c }) => {
    const fish = (x: number, y: number, color: string, dir: 1 | -1, cls: string) =>
      `<g class="${cls}">` +
      g(
        path('M0 0 Q12 -10 24 0 Q12 10 0 0Z', fs(color, '#d9659b', 1.5)) +
          path('M0 0 L-10 -7 L-10 7Z', fs(color, '#d9659b', 1.5)) +
          circle(17, -2, 1.8, { fill: EYE }),
        { transform: `translate(${x} ${y}) scale(${dir} 1)` },
      ) +
      `</g>`;
    return (
      shadow(85, 162, 60, 7) +
      rect(30, 142, 110, 18, 6, fs(c.base, c.line, 2.5)) +
      heart(85, 151, 5, goldFill(1)) +
      path('M36 40 Q20 90 36 136 L134 136 Q150 90 134 40Z', {
        fill: 'url(#k-water)',
        stroke: FIXED.glass.line,
        'stroke-width': 3,
        opacity: 0.92,
      }) +
      ellipse(85, 40, 52, 8, fs('#e6f4ff', FIXED.glass.line, 2)) +
      path('M44 128 Q85 116 126 128 L126 134 L44 134Z', { fill: '#ffe9a8' }) +
      leaf(56, 130, 30, -100, FIXED.leaf.base, FIXED.leaf.line) +
      leaf(112, 130, 24, -80, FIXED.leaf.light, FIXED.leaf.line) +
      circle(98, 126, 6, fs('#f6a9cb', '#d9659b', 1)) +
      fish(62, 76, '#ffb36b', 1, 'a-swim') +
      fish(108, 100, c.base, -1, 'a-swim a-swim-2') +
      `<g class="a-float">${circle(92, 66, 3.5, st('#fff', 1.5))}${circle(96, 56, 2.5, st('#fff', 1.5))}${circle(70, 100, 3, st('#fff', 1.5))}</g>` +
      path('M46 52 Q40 80 46 110', st('#fff', 4, 0.7))
    );
  },
} satisfies ArtPack[string];

const ourico = {
  w: 150,
  h: 120,
  draw: ({ ramp: c }) => {
    let spikes = '';
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (0.95 + i * 0.09);
      const x = 86 + Math.cos(a) * 52;
      const y = 76 + Math.sin(a) * 44;
      const x2 = 86 + Math.cos(a) * 70;
      const y2 = 76 + Math.sin(a) * 60;
      spikes += path(
        `M${(x - 8).toFixed(1)} ${y.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} L${(x + 8).toFixed(1)} ${(y + 4).toFixed(1)}Z`,
        fs(c.shade, c.line, 1.8),
      );
    }
    return (
      shadow(76, 112, 56, 6) +
      g(
        spikes + path('M30 92 Q30 30 90 28 Q140 30 136 92 Q86 110 30 92Z', fs(c.shade, c.line, 3)),
        { class: 'a-breathe' },
      ) +
      path('M14 84 Q18 54 50 56 Q72 60 74 90 Q50 108 14 84Z', fs('#f6e1cf', '#d8b89e', 2.5)) +
      circle(12, 80, 4, { fill: FIXED.eye }) +
      g(circle(38, 72, 4, { fill: EYE }) + circle(37, 70, 1.4, { fill: '#fff' }), {
        class: 'a-blink',
      }) +
      ellipse(46, 84, 6, 3.5, { fill: FIXED.blush, opacity: 0.6 }) +
      path('M46 106 L46 112 M100 106 L100 112', st('#d8b89e', 5)) +
      // maçãzinha nas costas
      circle(96, 34, 11, fs('#ff7f9e', '#d9506f', 2)) +
      leaf(96, 24, 10, -60, FIXED.leaf.base, FIXED.leaf.line)
    );
  },
} satisfies ArtPack[string];

const coruja = {
  w: 130,
  h: 170,
  draw: ({ ramp: c }) =>
    shadow(65, 162, 40, 6) +
    path('M16 160 L114 160', st(FIXED.wood.line, 8)) +
    path('M16 160 L114 160', st(FIXED.wood.base, 5)) +
    g(
      path(
        'M20 120 Q12 50 40 32 L52 44 Q65 38 78 44 L90 32 Q118 50 110 120 Q104 152 65 152 Q26 152 20 120Z',
        fs(c.base, c.line, 3),
      ) +
        ellipse(65, 116, 30, 30, { fill: c.light }) +
        path(
          'M50 104 Q55 110 60 104 M66 112 Q71 118 76 112 M50 124 Q55 130 60 124 M70 126 Q75 132 80 126',
          st(c.shade, 2),
        ) +
        path('M20 90 Q8 114 26 132', fs(c.shade, c.line, 2.5)) +
        path('M110 90 Q122 114 104 132', fs(c.shade, c.line, 2.5)),
      { class: 'a-breathe' },
    ) +
    circle(46, 70, 18, fs('#fff', c.line, 2.5)) +
    circle(84, 70, 18, fs('#fff', c.line, 2.5)) +
    eyes(46, 84, 70, 8) +
    path('M60 84 L70 84 L65 94Z', fs('#ffb36b', '#e08a3e', 1.5)) +
    path('M58 162 L58 152 M72 162 L72 152', st('#e08a3e', 4)) +
    crownTop2(65, 36),
} satisfies ArtPack[string];

const patinho = {
  w: 120,
  h: 110,
  draw: ({ ramp: c }) =>
    shadow(60, 102, 40, 5) +
    g(
      ellipse(64, 72, 40, 28, fs('#ffe28a', '#e0b14a', 3)) +
        path('M70 62 Q92 54 98 76 Q86 86 72 78Z', fs('#ffd34d', '#e0b14a', 2)) +
        path('M98 66 L112 58 L108 76Z', fs('#ffd34d', '#e0b14a', 2)),
      { class: 'a-breathe' },
    ) +
    circle(40, 40, 22, fs('#ffe28a', '#e0b14a', 3)) +
    path('M18 42 L4 46 L18 52Z', fs('#ffb36b', '#e08a3e', 1.5)) +
    g(circle(34, 36, 3.5, { fill: EYE }) + circle(33, 34.5, 1.2, { fill: '#fff' }), {
      class: 'a-blink',
    }) +
    ellipse(32, 48, 5, 3, { fill: FIXED.blush, opacity: 0.6 }) +
    // lacinho
    path('M44 18 Q34 8 30 16 Q32 24 44 20Z', fs(c.base, c.line, 1.5)) +
    path('M44 18 Q54 8 58 16 Q56 24 44 20Z', fs(c.base, c.line, 1.5)) +
    circle(44, 19, 3, fs(c.shade, c.line, 1)) +
    path('M54 98 L50 104 M70 98 L74 104', st('#e08a3e', 3)),
} satisfies ArtPack[string];

export default {
  gatinho,
  coelho,
  cachorro,
  unicornio,
  ponei,
  cisne,
  borboletas,
  passarinho,
  aquario,
  ourico,
  coruja,
  patinho,
} satisfies ArtPack;
