import {
  circle,
  ellipse,
  flower,
  fs,
  heart,
  leaf,
  path,
  rect,
  shadow,
  shine,
  sparkle,
  st,
} from '../kit';
import { FIXED } from '../palette';
import type { ArtPack, ItemArt } from '../types';
import { GOLD, crownTop, flame, goldFill, scallops } from './common';

const S = FIXED.stone;
const W = FIXED.wood;
const L = FIXED.leaf;
const EYE = FIXED.eye;

const face = (x: number, y: number, s: number, sleepy = false): string =>
  (sleepy
    ? path(
        `M${x - 10 * s} ${y} Q${x - 6 * s} ${y + 4 * s} ${x - 2 * s} ${y} M${x + 2 * s} ${y} Q${x + 6 * s} ${y + 4 * s} ${x + 10 * s} ${y}`,
        st(EYE, 2 * s),
      )
    : `<g class="a-blink">${circle(x - 7 * s, y, 3 * s, { fill: EYE })}${circle(x + 7 * s, y, 3 * s, { fill: EYE })}${circle(x - 8 * s, y - 1 * s, 1 * s, { fill: '#fff' })}${circle(x + 6 * s, y - 1 * s, 1 * s, { fill: '#fff' })}</g>`) +
  ellipse(x - 13 * s, y + 6 * s, 4 * s, 2.5 * s, { fill: FIXED.blush, opacity: 0.6 }) +
  ellipse(x + 13 * s, y + 6 * s, 4 * s, 2.5 * s, { fill: FIXED.blush, opacity: 0.6 }) +
  path(
    `M${x - 4 * s} ${y + 8 * s} Q${x} ${y + 12 * s} ${x + 4 * s} ${y + 8 * s}`,
    st(EYE, 1.8 * s),
  );

const torre: ItemArt = {
  w: 140,
  h: 290,
  draw: ({ ramp: c }) =>
    shadow(70, 282, 56, 7) +
    rect(24, 110, 92, 168, 8, fs('#fffaf6', '#d6c1c8', 3)) +
    rect(24, 110, 24, 168, 0, { fill: '#fff', opacity: 0.6 }) +
    path('M40 150 l22 0 M80 190 l20 0 M36 230 l24 0 M76 250 l18 0', st('#e2d2da', 3)) +
    path('M54 180 L54 154 A16 16 0 0 1 86 154 L86 180Z', fs('url(#k-sky-window)', '#d6c1c8', 2.5)) +
    path('M70 140 L70 180', st('#fffaf6', 2)) +
    rect(16, 100, 108, 16, 6, goldFill(2)) +
    path('M12 104 Q40 70 70 22 Q100 70 128 104Z', fs(c.base, c.line, 3)) +
    path(scallops(22, 118, 84, 6, 10), st(c.shade, 2.4)) +
    path(scallops(36, 104, 62, 4, 9), st(c.shade, 2.4)) +
    path('M30 98 Q46 64 66 30', st(c.light, 5, 0.7)) +
    circle(70, 20, 7, goldFill(1.5)) +
    path('M70 14 L70 -16', st(GOLD.line, 3)) +
    `<g class="a-flag">${path('M70 -16 Q92 -14 108 -4 Q90 2 70 4Z', fs(c.shade, c.line, 2))}</g>` +
    path('M52 278 L52 248 Q52 234 70 234 Q88 234 88 248 L88 278Z', fs(W.base, W.line, 2)),
};

const bandeirolas: ItemArt = {
  w: 300,
  h: 100,
  draw: ({ ramp: c }) => {
    const colors = [c.base, '#fffaf6', '#ffe28a', c.light, '#fffaf6', c.shade];
    let flags = '';
    for (let i = 0; i < 10; i++) {
      const x = 22 + i * 26;
      const y = 18 + Math.sin(((i + 0.5) / 10) * Math.PI) * 34;
      flags += path(
        `M${x} ${y} L${x + 24} ${y + 2} L${x + 12} ${y + 34}Z`,
        fs(colors[i % colors.length] ?? '#fff', c.line, 2),
      );
      if (i % 2 === 0) flags += heart(x + 12, y + 12, 4, { fill: c.line, opacity: 0.6 });
    }
    return (
      `<g class="a-sway">` +
      path('M8 14 Q150 90 292 14', st('#6b5a66', 2.4)) +
      flags +
      `</g>` +
      circle(8, 14, 5, goldFill(1.5)) +
      circle(292, 14, 5, goldFill(1.5))
    );
  },
};

const ponte: ItemArt = {
  w: 290,
  h: 150,
  draw: ({ ramp: c }) => {
    let rails = '';
    for (let x = 40; x <= 250; x += 21) {
      const y = 46 + Math.pow((x - 145) / 105, 2) * 30;
      rails += rect(x - 3, y, 6, 26, 3, fs('#fffaf6', '#d6c1c8', 1.5));
    }
    return (
      ellipse(145, 138, 130, 12, { fill: FIXED.water.base, opacity: 0.6 }) +
      path(
        'M14 140 L14 100 Q145 30 276 100 L276 140 L224 140 Q145 70 66 140Z',
        fs(S.base, S.line, 3),
      ) +
      path('M30 104 Q145 46 260 104', st(S.light, 5)) +
      path('M66 140 Q145 70 224 140', st(S.shade, 3)) +
      path('M90 118 l14 -6 M180 110 l14 6 M134 92 l16 0', st(S.shade, 3)) +
      rails +
      path('M30 74 Q145 18 260 74', st(c.base, 7)) +
      path('M30 74 Q145 18 260 74', st(c.light, 2.5)) +
      rect(20, 54, 16, 50, 6, fs('#fffaf6', '#d6c1c8', 2)) +
      rect(254, 54, 16, 50, 6, fs('#fffaf6', '#d6c1c8', 2)) +
      circle(28, 50, 8, goldFill(1.5)) +
      circle(262, 50, 8, goldFill(1.5)) +
      flower(52, 92, 7, c.base, GOLD.base) +
      flower(240, 92, 7, c.base, GOLD.base)
    );
  },
};

const lago: ItemArt = {
  w: 320,
  h: 150,
  draw: ({ ramp: c }) => {
    const pad = (x: number, y: number, r: number) =>
      path(
        `M${x} ${y} L${x + r} ${y - r * 0.2} A${r} ${r * 0.55} 0 1 1 ${x + r * 0.7} ${y + r * 0.4}Z`,
        fs(L.base, L.line, 1.8),
      );
    return (
      ellipse(160, 84, 156, 62, fs(S.base, S.line, 3)) +
      ellipse(160, 82, 140, 52, { fill: 'url(#k-water)' }) +
      `<g class="a-ripple">${ellipse(140, 80, 60, 14, st('#fff', 2, 0.6))}${ellipse(196, 96, 30, 7, st('#fff', 2, 0.5))}</g>` +
      pad(70, 92, 18) +
      pad(236, 70, 15) +
      flower(82, 86, 7, c.base, GOLD.base) +
      // cisnes
      `<g class="a-bob">${ellipse(150, 70, 24, 12, fs('#fffaf6', '#d6c1c8', 2))}${path('M132 66 Q124 44 134 36 Q142 32 144 40', st('#fffaf6', 6))}${path('M144 40 L152 42 L144 45Z', { fill: '#ffb36b' })}${heart(156, 66, 4, { fill: c.base })}</g>` +
      `<g class="a-bob" style="animation-delay:.6s">${ellipse(196, 80, 20, 10, fs('#fffaf6', '#d6c1c8', 2))}${path('M212 76 Q220 56 212 48 Q204 44 202 52', st('#fffaf6', 5))}${path('M202 52 L195 54 L202 57Z', { fill: '#ffb36b' })}</g>` +
      // juncos
      path('M24 82 Q20 50 28 30 M34 84 Q34 56 40 40', st(L.line, 3)) +
      ellipse(28, 34, 4, 10, { fill: W.shade }) +
      ellipse(40, 44, 4, 10, { fill: W.shade }) +
      leaf(290, 86, 26, -70, L.base, L.line) +
      leaf(298, 90, 22, -100, L.light, L.line) +
      shine('M90 60 Q130 46 180 50 Q130 56 96 66Z', 0.5)
    );
  },
};

const cerca: ItemArt = {
  w: 280,
  h: 120,
  draw: ({ ramp: c }) => {
    let pickets = '';
    for (let x = 14; x < 270; x += 30) {
      pickets +=
        path(
          `M${x} 112 L${x} 36 L${x + 11} 22 L${x + 22} 36 L${x + 22} 112Z`,
          fs('#fffaf6', '#d6c1c8', 2.2),
        ) + heart(x + 11, 46, 4.5, { fill: c.base });
    }
    return (
      shadow(140, 114, 132, 5) +
      rect(4, 60, 272, 12, 4, fs('#fffaf6', '#d6c1c8', 2)) +
      rect(4, 92, 272, 12, 4, fs('#fffaf6', '#d6c1c8', 2)) +
      pickets +
      path('M58 66 Q70 76 82 66 M178 66 Q190 76 202 66', st(c.base, 4)) +
      flower(30, 108, 8, c.base, GOLD.base) +
      flower(250, 108, 8, c.light, GOLD.base) +
      leaf(120, 112, 18, -60, L.base, L.line)
    );
  },
};

const portao: ItemArt = {
  w: 230,
  h: 240,
  draw: ({ ramp: c }) => {
    let bars = '';
    for (let x = 46; x <= 184; x += 15) {
      const top = 70 - Math.sin(((x - 46) / 138) * Math.PI) * 40;
      bars +=
        path(`M${x} 224 L${x} ${top}`, st(GOLD.line, 5)) +
        path(`M${x} 224 L${x} ${top}`, st('#f6d27a', 2.5));
      bars += path(`M${x - 4} ${top + 2} L${x} ${top - 8} L${x + 4} ${top + 2}Z`, goldFill(1));
    }
    return (
      shadow(115, 232, 104, 7) +
      bars +
      path('M40 120 Q115 90 190 120', st(GOLD.line, 5)) +
      path('M40 170 L190 170', st(GOLD.line, 5)) +
      heart(80, 146, 12, st(GOLD.line, 3)) +
      heart(150, 146, 12, st(GOLD.line, 3)) +
      heart(115, 140, 16, fs(c.base, c.line, 2.5)) +
      path(
        'M60 196 Q75 182 90 196 Q75 210 60 196Z M140 196 Q155 182 170 196 Q155 210 140 196Z',
        st(GOLD.line, 3),
      ) +
      rect(14, 60, 30, 168, 6, fs('#fffaf6', '#d6c1c8', 3)) +
      rect(186, 60, 30, 168, 6, fs('#fffaf6', '#d6c1c8', 3)) +
      circle(29, 52, 14, goldFill(2)) +
      circle(201, 52, 14, goldFill(2)) +
      crownTop(115, 26, 1)
    );
  },
};

const carruagem: ItemArt = {
  w: 290,
  h: 240,
  draw: ({ ramp: c }) => {
    const wheel = (x: number, y: number, r: number) => {
      let spokes = '';
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        spokes += path(
          `M${x} ${y} L${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}`,
          st(GOLD.line, 3),
        );
      }
      return (
        circle(x, y, r, st(GOLD.line, 7)) +
        circle(x, y, r, st('#f6d27a', 3.5)) +
        spokes +
        circle(x, y, 7, goldFill(1.5))
      );
    };
    return (
      shadow(145, 232, 128, 9) +
      wheel(70, 192, 38) +
      wheel(222, 196, 34) +
      // abóbora
      path(
        'M50 150 Q34 60 112 54 Q146 40 180 54 Q258 60 242 150 Q220 196 146 196 Q72 196 50 150Z',
        fs(c.base, c.line, 3),
      ) +
      path('M100 64 Q84 120 100 190 M146 52 L146 196 M192 64 Q208 120 192 190', st(c.shade, 3)) +
      path('M62 120 Q60 80 96 70', st(c.light, 6, 0.8)) +
      // janela
      path(
        'M120 132 L120 104 Q120 84 146 84 Q172 84 172 104 L172 132Z',
        fs('url(#k-sky-window)', GOLD.line, 3),
      ) +
      path('M146 86 L146 132 M120 112 L172 112', st('#fffaf6', 2.5)) +
      heart(146, 156, 9, goldFill(1.5)) +
      // cabinho e coroa
      path('M146 54 Q140 34 152 24', st(L.line, 6)) +
      leaf(152, 30, 24, -20, L.base, L.line) +
      crownTop(146, 22, 1) +
      // arabescos dourados
      path('M40 176 Q24 170 22 150 M252 176 Q268 170 270 150', st(GOLD.line, 4)) +
      sparkle(232, 70, 8) +
      sparkle(60, 60, 6)
    );
  },
};

const poste: ItemArt = {
  w: 100,
  h: 270,
  light: { x: 50, y: 50, r: 100 },
  draw: ({ ramp: c }) =>
    shadow(50, 262, 30, 5) +
    path('M50 84 L50 250', st(GOLD.line, 9)) +
    path('M50 84 L50 250', st('#f6d27a', 4)) +
    path('M30 260 L50 246 L70 260', st(GOLD.line, 8)) +
    path('M50 120 Q30 120 26 104 M50 120 Q70 120 74 104', st(GOLD.line, 3)) +
    rect(36, 78, 28, 10, 4, goldFill(1.5)) +
    `<g class="a-twinkle">${circle(50, 52, 34, { fill: 'url(#k-glow)' })}</g>` +
    path('M30 78 L26 34 L74 34 L70 78Z', {
      fill: 'url(#k-glass)',
      stroke: GOLD.line,
      'stroke-width': 2.5,
    }) +
    flame(50, 66, 0.9) +
    path('M22 36 Q50 6 78 36Z', fs(c.base, c.line, 2.5)) +
    circle(50, 12, 5, goldFill(1.2)) +
    heart(50, 24, 5, { fill: '#fff', opacity: 0.8 }),
};

const banco: ItemArt = {
  w: 230,
  h: 150,
  draw: ({ ramp: c }) =>
    shadow(115, 142, 100, 7) +
    path(
      'M30 92 L30 30 Q30 14 60 16 Q86 0 115 14 Q144 0 170 16 Q200 14 200 30 L200 92',
      fs('#fffaf6', '#d6c1c8', 3),
    ) +
    heart(115, 48, 20, fs(c.base, c.line, 2.5)) +
    path('M56 40 Q60 62 54 84 M174 40 Q170 62 176 84', st('#e2d2da', 3)) +
    rect(18, 86, 194, 22, 10, fs(c.light, c.line, 2.5)) +
    path('M28 92 L202 92', st('#fff', 3, 0.7)) +
    path('M28 106 L22 136 M202 106 L208 136 M56 108 L54 132 M174 108 L176 132', st(GOLD.line, 6)) +
    path('M28 106 L22 136 M202 106 L208 136', st('#f6d27a', 3)) +
    flower(32, 24, 8, c.base, GOLD.base) +
    flower(198, 24, 8, c.base, GOLD.base),
};

const balanco: ItemArt = {
  w: 190,
  h: 260,
  draw: ({ ramp: c }) => {
    let vines = '';
    for (let y = 70; y < 190; y += 22)
      vines +=
        flower(60, y, 6, y % 44 ? c.base : '#fff', GOLD.base) +
        flower(130, y + 11, 6, y % 44 ? '#fff' : c.base, GOLD.base);
    return (
      shadow(95, 252, 84, 7) +
      path('M20 250 L44 30 M170 250 L146 30', st(W.line, 12)) +
      path('M20 250 L44 30 M170 250 L146 30', st(W.base, 7)) +
      rect(30, 22, 130, 16, 8, fs(W.base, W.line, 2.5)) +
      leaf(48, 24, 22, -160, L.base, L.line) +
      leaf(142, 24, 22, -20, L.base, L.line) +
      `<g class="a-swing">` +
      path('M60 38 L60 196 M130 38 L130 196', st('#e9d6c3', 4)) +
      vines +
      rect(44, 192, 102, 16, 7, fs(c.base, c.line, 2.5)) +
      heart(95, 200, 5, goldFill(1)) +
      `</g>`
    );
  },
};

const arcoIris: ItemArt = {
  w: 300,
  h: 170,
  draw: () => {
    const colors = ['#f9a8c4', '#ffc9a3', '#ffe8a3', '#b5e7c8', '#a8d4f2', '#cdb6f2'];
    let bands = '';
    colors.forEach((col, i) => {
      const r = 132 - i * 14;
      bands += path(`M${150 - r} 150 A${r} ${r} 0 0 1 ${150 + r} 150`, st(col, 14));
    });
    const cloud = (x: number) =>
      path(
        `M${x - 40} 156 Q${x - 44} 132 ${x - 20} 130 Q${x - 12} 108 ${x + 12} 116 Q${x + 36} 112 ${x + 40} 136 Q${x + 54} 142 ${x + 46} 158Z`,
        fs('#fff', '#e2d6e8', 2.5),
      );
    return (
      bands + cloud(30) + cloud(268) + `<g class="a-twinkle">${sparkle(150, 22, 9, '#fff6c9')}</g>`
    );
  },
};

const nuvem: ItemArt = {
  w: 210,
  h: 120,
  draw: ({ ramp: c }) =>
    `<g class="a-drift-small">` +
    path(
      'M30 100 Q4 98 12 72 Q16 52 44 54 Q48 22 86 26 Q108 6 138 22 Q170 16 176 48 Q206 50 200 80 Q198 102 170 100Z',
      fs('#ffffff', '#e2d6e8', 3),
    ) +
    path('M48 60 Q56 40 78 40', st('#fff', 5)) +
    ellipse(120, 92, 70, 6, { fill: c.light, opacity: 0.5 }) +
    face(108, 66, 1.4) +
    `</g>`,
};

const lua: ItemArt = {
  w: 140,
  h: 150,
  light: { x: 70, y: 75, r: 90 },
  draw: ({ ramp: c }) =>
    `<g class="a-bob">` +
    circle(70, 74, 64, { fill: 'url(#k-glow)' }) +
    path('M96 18 A58 58 0 1 0 104 128 A46 46 0 1 1 96 18Z', fs('#fff4c8', '#e9c96b', 3)) +
    circle(46, 94, 6, { fill: '#f3dc96', opacity: 0.7 }) +
    circle(64, 116, 4, { fill: '#f3dc96', opacity: 0.7 }) +
    face(50, 70, 0.9, true) +
    // touquinha
    path('M64 22 Q84 0 110 6 L98 30Z', fs(c.base, c.line, 2)) +
    circle(112, 6, 6, fs('#fff', c.line, 1.5)) +
    `</g>` +
    `<g class="a-twinkle">${sparkle(118, 64, 8, '#fff6c9')}${sparkle(124, 108, 5, '#fff6c9')}</g>`,
};

const estrelas: ItemArt = {
  w: 170,
  h: 130,
  draw: ({ ramp: c }) => {
    const star = (x: number, y: number, r: number, color: string, delay: number) =>
      `<g class="a-twinkle" style="animation-delay:${delay}s">` +
      path(
        `M${x} ${y - r} L${x + r * 0.29} ${y - r * 0.4} L${x + r * 0.95} ${y - r * 0.31} L${x + r * 0.47} ${y + r * 0.15} L${x + r * 0.59} ${y + r * 0.81} L${x} ${y + r * 0.5} L${x - r * 0.59} ${y + r * 0.81} L${x - r * 0.47} ${y + r * 0.15} L${x - r * 0.95} ${y - r * 0.31} L${x - r * 0.29} ${y - r * 0.4}Z`,
        { ...fs(color, '#e0b14a', 2.5), 'stroke-linejoin': 'round' },
      ) +
      `</g>`;
    return (
      star(50, 60, 38, '#ffe9a8', 0) +
      face(50, 64, 0.8) +
      star(124, 36, 24, c.light, 0.7) +
      star(130, 98, 18, '#fff6c9', 1.3) +
      sparkle(96, 112, 6, '#fff')
    );
  },
};

const sol: ItemArt = {
  w: 170,
  h: 170,
  light: { x: 85, y: 85, r: 120 },
  draw: () => {
    let rays = '';
    for (let i = 0; i < 12; i++) {
      rays += path('M85 6 Q92 22 85 30 Q78 22 85 6Z', {
        fill: i % 2 ? '#ffd34d' : '#ffe9a8',
        stroke: '#e0a92a',
        'stroke-width': 1.5,
        transform: `rotate(${i * 30} 85 85)`,
      });
    }
    return (
      `<g class="a-rotate">${rays}</g>` +
      circle(85, 85, 52, { fill: 'url(#k-glow)' }) +
      circle(85, 85, 44, fs('#ffe27a', '#e0a92a', 3)) +
      path('M60 66 Q66 50 84 46', st('#fff6c9', 5)) +
      face(85, 88, 1.3)
    );
  },
};

const casinhaPassaro: ItemArt = {
  w: 120,
  h: 250,
  draw: ({ ramp: c }) =>
    shadow(60, 242, 30, 5) +
    path('M60 120 L60 236', st(W.line, 10)) +
    path('M60 120 L60 236', st(W.base, 6)) +
    leaf(60, 200, 22, -30, L.base, L.line) +
    rect(24, 58, 72, 66, 8, fs('#fffaf6', '#d6c1c8', 2.5)) +
    path('M14 64 L60 20 L106 64Z', fs(c.base, c.line, 3)) +
    path(scallops(18, 102, 60, 4, 8), st(c.shade, 2.5)) +
    circle(60, 90, 13, { fill: '#5a4252' }) +
    rect(48, 106, 24, 5, 2.5, goldFill(1)) +
    heart(60, 40, 6, goldFill(1.2)) +
    `<g class="a-bob">${ellipse(44, 106, 10, 8, fs('#9fd3f2', '#5aa6dc', 1.5))}${circle(38, 100, 6, fs('#9fd3f2', '#5aa6dc', 1.5))}${path('M33 100 L28 102 L33 104Z', { fill: '#ffb36b' })}${circle(37, 98, 1.3, { fill: EYE })}</g>`,
};

const poco: ItemArt = {
  w: 200,
  h: 230,
  draw: ({ ramp: c }) =>
    shadow(100, 222, 84, 8) +
    path('M40 70 L40 150 M160 70 L160 150', st(W.line, 10)) +
    path('M40 70 L40 150 M160 70 L160 150', st(W.base, 6)) +
    path('M18 74 L100 18 L182 74Z', fs(c.base, c.line, 3)) +
    path(scallops(24, 176, 70, 6, 10), st(c.shade, 2.5)) +
    heart(100, 50, 8, goldFill(1.5)) +
    path('M40 96 L160 96', st(W.line, 5)) +
    path('M100 96 L100 124', st('#e9d6c3', 2.5)) +
    path('M88 124 L112 124 L108 144 L92 144Z', fs(W.base, W.line, 2)) +
    // muro de pedra
    path('M24 150 L176 150 L170 214 Q100 226 30 214Z', fs(S.base, S.line, 3)) +
    ellipse(100, 150, 76, 14, fs(S.light, S.line, 3)) +
    ellipse(100, 152, 62, 9, { fill: 'url(#k-water)' }) +
    path(
      'M40 176 l22 0 M86 186 l26 0 M134 174 l22 0 M58 200 l20 0 M118 204 l24 0',
      st(S.shade, 3),
    ) +
    `<g class="a-twinkle">${circle(82, 152, 4, goldFill(1))}${circle(116, 150, 4, goldFill(1))}${sparkle(100, 140, 7)}</g>` +
    flower(30, 210, 8, c.base, GOLD.base) +
    flower(170, 210, 8, c.light, GOLD.base),
};

export default {
  torre,
  bandeirolas,
  ponte,
  lago,
  cerca,
  portao,
  carruagem,
  poste,
  banco,
  balanco,
  'arco-iris': arcoIris,
  nuvem,
  lua,
  estrelas,
  sol,
  'casinha-passaro': casinhaPassaro,
  poco,
} satisfies ArtPack;
