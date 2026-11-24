import {
  circle,
  ellipse,
  flower,
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
import { GOLD, crownTop, flame, goldFill, goldFrame, goldLeg, scallops } from './common';

const W = FIXED.wood;

const quadroRetrato: ItemArt = {
  w: 150,
  h: 190,
  draw: ({ ramp: c }) =>
    goldFrame(
      10,
      26,
      130,
      156,
      rect(18, 34, 114, 140, 4, { fill: c.light }) +
        circle(75, 160, 56, { fill: c.base }) +
        path('M40 174 Q42 128 75 124 Q108 128 110 174Z', fs(c.shade, c.line, 2)) +
        circle(75, 98, 24, fs('#fde7da', '#e2bfae', 2)) +
        path(
          'M50 104 Q48 70 75 70 Q102 70 100 104 Q98 86 75 84 Q52 86 50 104Z',
          fs('#b9805f', '#8f5d43', 1.5),
        ) +
        crownTop(75, 66, 0.7) +
        circle(67, 98, 2.4, { fill: FIXED.eye }) +
        circle(83, 98, 2.4, { fill: FIXED.eye }) +
        ellipse(63, 106, 4, 2.4, { fill: FIXED.blush, opacity: 0.6 }) +
        ellipse(87, 106, 4, 2.4, { fill: FIXED.blush, opacity: 0.6 }) +
        path('M70 110 Q75 114 80 110', st('#c26a7f', 1.8)),
    ) + heart(75, 18, 9, fs(c.base, c.line, 1.8)),
};

const quadroPaisagem: ItemArt = {
  w: 220,
  h: 160,
  draw: ({ ramp: c }) =>
    goldFrame(
      8,
      8,
      204,
      144,
      rect(16, 16, 188, 128, 4, { fill: 'url(#k-sky-window)' }) +
        circle(168, 48, 14, { fill: '#fff1a8' }) +
        path('M16 112 Q60 82 110 104 Q150 84 204 100 L204 144 L16 144Z', {
          fill: FIXED.leaf.light,
        }) +
        path('M16 126 Q80 104 204 124 L204 144 L16 144Z', { fill: FIXED.leaf.base }) +
        rect(92, 70, 32, 36, 2, { fill: '#fffaf6' }) +
        path('M88 72 L108 46 L128 72Z', { fill: c.base }) +
        rect(104, 88, 8, 18, 4, { fill: W.base }) +
        flower(44, 128, 6, c.base, GOLD.base) +
        flower(170, 132, 6, c.light, GOLD.base) +
        path('M40 40 Q46 34 52 40 Q58 34 64 40', st('#fff', 2.4)),
    ),
};

const tapeteRetangular: ItemArt = {
  w: 320,
  h: 130,
  draw: ({ ramp: c }) => {
    let fringe = '';
    for (let x = 30; x <= 290; x += 10)
      fringe += path(`M${x} 116 L${x - 4 + ((x / 10) % 2)} 126`, st(c.shade, 2));
    return (
      fringe +
      path('M48 14 L272 14 L312 116 L8 116Z', fs(c.base, c.line, 3)) +
      path('M64 26 L256 26 L288 104 L32 104Z', fs(c.light, c.line, 2)) +
      path('M82 38 L238 38 L262 92 L58 92Z', st(c.shade, 5, 0.8)) +
      heart(160, 66, 16, fs(c.base, c.line, 2)) +
      path(
        'M104 66 L124 56 L144 66 L124 76Z M176 66 L196 56 L216 66 L196 76Z',
        fs(c.shade, c.line, 1.5),
      ) +
      ellipse(150, 40, 80, 8, { fill: '#fff', opacity: 0.25 })
    );
  },
};

const tapeteCoracao: ItemArt = {
  w: 260,
  h: 140,
  draw: ({ ramp: c }) =>
    g(
      heart(130, 112, 104, fs(c.base, c.line, 5)) +
        heart(130, 116, 84, fs(c.light, c.line, 3)) +
        heart(130, 120, 60, st(c.shade, 8, 0.7)) +
        heart(130, 124, 30, fs(c.shade, c.line, 3)),
      { transform: 'translate(0 -18) scale(1 0.62)' },
    ) + ellipse(110, 40, 60, 10, { fill: '#fff', opacity: 0.25 }),
};

const velas: ItemArt = {
  w: 150,
  h: 160,
  light: { x: 75, y: 50, r: 90 },
  draw: ({ ramp: c }) =>
    shadow(75, 150, 62, 7) +
    ellipse(75, 140, 64, 12, goldFill(2.5)) +
    ellipse(75, 136, 50, 7, { fill: '#fff1c2', opacity: 0.6 }) +
    rect(28, 80, 26, 56, 8, fs('#fffaf6', c.line, 2)) +
    rect(62, 52, 28, 84, 8, fs(c.light, c.line, 2)) +
    rect(98, 94, 24, 42, 8, fs('#fffaf6', c.line, 2)) +
    path('M40 80 Q44 92 38 98', st('#fffaf6', 5)) +
    path('M76 52 Q80 66 74 72', st(c.light, 5)) +
    path('M41 80 L41 72 M76 52 L76 44 M110 94 L110 86', st('#6b4a5e', 2)) +
    flame(41, 74, 0.8) +
    flame(76, 46, 0.95) +
    flame(110, 88, 0.75) +
    heart(76, 100, 7, fs(c.base, c.line, 1.4)) +
    pearl(20, 138, 4) +
    pearl(130, 138, 4),
};

const bau: ItemArt = {
  w: 190,
  h: 170,
  draw: ({ ramp: c }) =>
    shadow(95, 160, 82, 8) +
    // brilho do tesouro
    `<g class="a-twinkle">${ellipse(95, 64, 60, 24, { fill: 'url(#k-glow)' })}</g>` +
    // tampa aberta
    path('M26 70 L36 22 Q95 0 154 22 L164 70Z', fs(W.base, W.line, 3)) +
    path('M56 66 L62 16 M134 66 L128 16', st('url(#k-gold-h)', 7)) +
    // joias
    circle(70, 74, 12, fs('#ffd98a', GOLD.line, 2)) +
    circle(92, 68, 13, fs('#ffe9a8', GOLD.line, 2)) +
    circle(116, 74, 12, fs('#ffd98a', GOLD.line, 2)) +
    gem(80, 62, 7, c.base, c.line) +
    gem(108, 60, 7, '#9fd3f2', '#5aa6dc') +
    pearl(130, 66, 6) +
    path('M54 72 Q70 60 86 72 Q102 84 118 72', st('#fffaf6', 3)) +
    // corpo
    rect(20, 74, 150, 76, 12, fs(W.base, W.line, 3)) +
    path('M28 84 L28 140', st(W.light, 4, 0.8)) +
    rect(20, 74, 150, 14, 7, goldFill(2)) +
    rect(52, 74, 14, 76, 4, goldFill(1.5)) +
    rect(124, 74, 14, 76, 4, goldFill(1.5)) +
    path('M80 100 L110 100 L110 124 Q95 132 80 124Z', goldFill(2)) +
    heart(95, 112, 6, fs(c.base, c.line, 1.3)) +
    sparkle(150, 30, 8) +
    sparkle(40, 40, 6),
};

const relogio: ItemArt = {
  w: 140,
  h: 230,
  draw: ({ ramp: c }) =>
    // caixa do pêndulo
    path('M36 110 L104 110 L98 204 Q70 222 42 204Z', fs(c.base, c.line, 3)) +
    path('M48 120 L92 120 L88 196 Q70 208 52 196Z', fs('#fff', c.line, 1.8)) +
    `<g class="a-pendulum">${path('M70 120 L70 176', st(GOLD.line, 2.5))}${circle(70, 182, 11, goldFill(2))}${heart(70, 183, 5, fs(c.base, c.line, 1))}</g>` +
    // mostrador
    circle(70, 74, 50, goldFill(3)) +
    circle(70, 74, 40, fs('#fffaf6', GOLD.line, 2)) +
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      .map((i) => {
        const a = (i * Math.PI) / 6;
        return circle(
          Number((70 + Math.sin(a) * 32).toFixed(1)),
          Number((74 - Math.cos(a) * 32).toFixed(1)),
          i % 3 === 0 ? 3 : 1.6,
          { fill: i % 3 === 0 ? c.shade : c.line },
        );
      })
      .join('') +
    path('M70 74 L70 50', st(c.line, 3.5)) +
    path('M70 74 L88 82', st(c.line, 3)) +
    circle(70, 74, 4, goldFill(1)) +
    crownTop(70, 18, 0.9),
};

const laco: ItemArt = {
  w: 170,
  h: 150,
  draw: ({ ramp: c }) =>
    path('M85 60 Q44 18 20 30 Q4 42 14 70 Q24 98 85 74Z', fs(c.base, c.line, 3)) +
    path('M85 60 Q126 18 150 30 Q166 42 156 70 Q146 98 85 74Z', fs(c.base, c.line, 3)) +
    path('M30 44 Q40 40 62 56', st(c.light, 4)) +
    path('M140 44 Q130 40 108 56', st(c.light, 4)) +
    path('M78 74 Q60 104 48 140 L66 134 L72 146 Q80 108 88 78Z', fs(c.base, c.line, 2.5)) +
    path('M92 74 Q110 104 122 140 L104 134 L98 146 Q90 108 82 78Z', fs(c.base, c.line, 2.5)) +
    rect(70, 54, 30, 26, 10, fs(c.shade, c.line, 2.5)) +
    gem(85, 67, 5, GOLD.base, GOLD.line),
};

const guirlanda: ItemArt = {
  w: 300,
  h: 100,
  draw: ({ ramp: c }) => {
    const colors = [c.base, '#fff1a8', '#c8b0f0', '#9fd3f2', '#f9b8d4', '#a6e2c4'];
    let bulbs = '';
    for (let i = 0; i < 11; i++) {
      const x = 20 + i * 26;
      const y = 24 + Math.sin((i / 10) * Math.PI) * 44;
      const color = colors[i % colors.length] ?? '#fff';
      bulbs +=
        rect(x - 3, y - 2, 6, 6, 1.5, goldFill(1)) +
        `<g class="a-twinkle" style="animation-delay:${(i % 4) * 0.4}s">${circle(x, y + 12, 13, { fill: 'url(#k-glow)' })}${ellipse(x, y + 12, 6, 8, fs(color, c.line, 1.5))}${circle(x - 2, y + 9, 2, { fill: '#fff' })}</g>`;
    }
    return (
      path('M8 20 Q150 110 292 20', st('#6b5a66', 2.4)) +
      bulbs +
      heart(10, 18, 7, goldFill(1.3)) +
      heart(290, 18, 7, goldFill(1.3))
    );
  },
};

const bolo: ItemArt = {
  w: 160,
  h: 210,
  light: { x: 80, y: 40, r: 70 },
  draw: ({ ramp: c }) =>
    shadow(80, 202, 56, 7) +
    path('M60 196 L64 176 L96 176 L100 196Z', goldFill(2)) +
    ellipse(80, 176, 62, 8, goldFill(2)) +
    // andares
    rect(26, 130, 108, 44, 12, fs('#fffaf6', c.line, 2.5)) +
    path(scallops(26, 134, 134, 6, 10), fs(c.base, c.line, 2)) +
    rect(40, 92, 80, 40, 12, fs(c.light, c.line, 2.5)) +
    path(scallops(40, 120, 96, 5, 9), fs('#fffaf6', c.line, 2)) +
    rect(54, 60, 52, 34, 10, fs('#fffaf6', c.line, 2.5)) +
    path(scallops(54, 106, 64, 4, 8), fs(c.base, c.line, 2)) +
    // morangos e pérolas
    heart(46, 160, 6, fs('#ff7f9e', '#d9506f', 1.5)) +
    heart(80, 162, 6, fs('#ff7f9e', '#d9506f', 1.5)) +
    heart(114, 160, 6, fs('#ff7f9e', '#d9506f', 1.5)) +
    pearl(56, 118, 3.5) +
    pearl(80, 120, 3.5) +
    pearl(104, 118, 3.5) +
    // velinhas
    rect(66, 38, 6, 22, 2, fs('#f6a9cb', c.line, 1)) +
    rect(88, 38, 6, 22, 2, fs('#c8b0f0', c.line, 1)) +
    flame(69, 38, 0.6) +
    flame(91, 38, 0.6) +
    sparkle(130, 70, 6),
};

const jogoCha: ItemArt = {
  w: 220,
  h: 140,
  draw: ({ ramp: c }) => {
    const cup = (x: number) =>
      path(
        `M${x - 18} 96 L${x + 18} 96 Q${x + 16} 120 ${x} 120 Q${x - 16} 120 ${x - 18} 96Z`,
        fs('#fff', c.line, 2),
      ) +
      path(`M${x + 16} 102 Q${x + 28} 104 ${x + 16} 114`, st(c.line, 2.5)) +
      ellipse(x, 122, 24, 5, fs(c.light, c.line, 1.5)) +
      heart(x, 107, 4, { fill: c.base });
    return (
      shadow(110, 132, 100, 7) +
      ellipse(110, 124, 104, 12, goldFill(2.5)) +
      // bule
      path('M70 102 Q60 50 104 48 Q148 50 138 102Z', fs('#fff', c.line, 2.5)) +
      path('M138 66 Q162 58 166 44', st(c.line, 5)) +
      path('M138 66 Q162 58 166 44', st('#fff', 2.5)) +
      path('M70 66 Q52 64 54 82 Q56 96 72 92', st(c.line, 4)) +
      ellipse(104, 48, 22, 6, fs(c.base, c.line, 2)) +
      circle(104, 38, 6, goldFill(1.5)) +
      path(scallops(72, 136, 80, 4, 7), st(c.base, 3)) +
      heart(104, 72, 7, fs(c.base, c.line, 1.5)) +
      cup(32) +
      cup(186) +
      shine('M80 58 Q84 52 92 52 L84 70Z', 0.7)
    );
  },
};

const portaJoias: ItemArt = {
  w: 150,
  h: 130,
  draw: ({ ramp: c }) =>
    shadow(75, 122, 60, 6) +
    path('M20 56 L30 22 Q75 8 120 22 L130 56Z', fs(c.base, c.line, 2.5)) +
    path('M30 50 L38 28 Q75 18 112 28 L120 50Z', fs('#fff', c.line, 1.5)) +
    ellipse(75, 40, 14, 9, { fill: 'url(#k-glass)', stroke: GOLD.line, 'stroke-width': 1.5 }) +
    rect(16, 56, 118, 56, 10, fs(c.base, c.line, 3)) +
    rect(16, 56, 118, 10, 5, goldFill(1.5)) +
    // colar de pérolas saindo
    [24, 34, 44, 54, 62, 68, 72].map((x, i) => pearl(x, 66 + i * 5.5, 4)).join('') +
    gem(72, 112, 6, '#9fd3f2', '#5aa6dc') +
    heart(100, 88, 8, goldFill(1.5)) +
    goldLeg(26, 110, 8, -1, 5) +
    goldLeg(124, 110, 8, 1, 5) +
    sparkle(120, 20, 6),
};

const caixinhaMusica: ItemArt = {
  w: 150,
  h: 200,
  draw: ({ ramp: c }) =>
    shadow(75, 192, 60, 6) +
    rect(16, 120, 118, 64, 12, fs(c.base, c.line, 3)) +
    rect(10, 112, 130, 16, 8, goldFill(2)) +
    path(scallops(20, 130, 164, 5, 8), st(c.shade, 2.5)) +
    heart(75, 150, 10, fs(c.light, c.line, 1.8)) +
    circle(140, 150, 8, goldFill(1.5)) +
    path('M140 150 L150 150', st(GOLD.line, 3)) +
    // bailarina
    `<g class="a-spin">` +
    circle(75, 108, 12, goldFill(1.5)) +
    path('M75 104 L75 58', st('#f6e9e2', 3)) +
    path('M58 78 Q75 64 92 78 Q90 90 75 88 Q60 90 58 78Z', fs(c.light, c.line, 2)) +
    path('M54 84 Q75 76 96 84 Q92 96 75 94 Q58 96 54 84Z', fs('#fff', c.line, 1.5)) +
    path('M68 66 Q75 60 82 66 L80 76 L70 76Z', fs(c.base, c.line, 1.5)) +
    path('M70 64 Q60 52 56 42 M80 64 Q90 52 94 42', st('#f6e9e2', 2.5)) +
    circle(75, 52, 7, fs('#fde7da', '#e2bfae', 1.5)) +
    path('M68 50 Q75 40 82 50', fs('#b9805f', '#8f5d43', 1)) +
    crownTop(75, 42, 0.35) +
    `</g>` +
    `<g class="a-twinkle">${path('M112 72 L112 52 L124 48 L124 68', st(c.line, 2.5))}${circle(108, 72, 4, { fill: c.line })}${circle(120, 68, 4, { fill: c.line })}${path('M30 60 L30 44', st(c.line, 2.5))}${circle(26, 60, 4, { fill: c.line })}</g>`,
};

const globoNeve: ItemArt = {
  w: 130,
  h: 160,
  draw: ({ ramp: c }) =>
    shadow(65, 152, 46, 6) +
    path('M24 120 L106 120 L114 146 L16 146Z', fs(c.base, c.line, 2.5)) +
    rect(20, 114, 90, 10, 5, goldFill(2)) +
    heart(65, 134, 6, goldFill(1.2)) +
    circle(65, 70, 50, {
      fill: 'url(#k-glass)',
      stroke: FIXED.glass.line,
      'stroke-width': 2.5,
      opacity: 0.95,
    }) +
    // castelinho dentro
    rect(48, 76, 34, 34, 2, fs('#fffaf6', '#d6c1c8', 1.5)) +
    path('M44 78 L56 58 L68 78Z M62 78 L74 58 L86 78Z', fs(c.base, c.line, 1.5)) +
    rect(60, 94, 10, 16, 5, { fill: W.base }) +
    path('M20 106 Q65 96 110 106 L110 112 L20 112Z', { fill: '#fff' }) +
    `<g class="a-snow">${[
      [40, 40],
      [58, 30],
      [84, 44],
      [72, 56],
      [36, 64],
      [94, 70],
      [50, 50],
    ]
      .map(([x, y]) => circle(x ?? 0, y ?? 0, 2.4, { fill: '#fff' }))
      .join('')}</g>` +
    shine('M32 50 Q36 30 54 24 L46 38 Q38 48 38 62Z', 0.85),
};

const livros: ItemArt = {
  w: 140,
  h: 120,
  draw: ({ ramp: c }) =>
    shadow(70, 112, 58, 6) +
    rect(14, 84, 112, 22, 4, fs('#c8b0f0', '#9a7bcf', 2)) +
    path('M18 90 L122 90', st('#fff1c2', 2)) +
    rect(22, 62, 100, 22, 4, fs(c.base, c.line, 2)) +
    path('M26 68 L118 68', st('#fff1c2', 2)) +
    rect(18, 42, 96, 20, 4, fs('#9fd3f2', '#5aa6dc', 2)) +
    path('M22 48 L110 48', st('#fff1c2', 2)) +
    rect(28, 24, 84, 18, 4, fs('#fffaf6', c.line, 2)) +
    heart(70, 33, 5, { fill: c.base }) +
    path('M96 42 L96 60 L100 56 L104 60 L104 42', fs(c.shade, c.line, 1.2)),
};

const almofadas: ItemArt = {
  w: 180,
  h: 120,
  draw: ({ ramp: c }) =>
    shadow(90, 112, 76, 6) +
    path(
      'M14 98 Q10 58 40 54 L82 54 Q102 58 98 98 Q98 108 56 108 Q14 108 14 98Z',
      fs(c.light, c.line, 2.5),
    ) +
    circle(56, 80, 4, { fill: c.shade }) +
    heart(120, 76, 34, fs(c.base, c.line, 2.5)) +
    path('M100 62 Q108 52 118 58', st(c.light, 3)) +
    circle(150, 92, 24, fs('#fffaf6', c.line, 2.5)) +
    circle(150, 92, 6, { fill: c.shade }) +
    path(scallops(126, 174, 92, 4, 0), st(c.shade, 1)) +
    path('M14 98 L8 104 M98 98 L104 104', st(GOLD.line, 2)),
};

const cortina: ItemArt = {
  w: 150,
  h: 290,
  draw: ({ ramp: c }) =>
    rect(6, 14, 138, 10, 5, goldFill(2)) +
    circle(6, 19, 7, goldFill(1.5)) +
    circle(144, 19, 7, goldFill(1.5)) +
    path('M14 24 Q60 30 96 24 Q74 120 92 170 Q60 220 46 282 L14 282Z', fs(c.base, c.line, 2.5)) +
    path('M28 36 Q24 160 26 270', st(c.shade, 3, 0.8)) +
    path('M50 34 Q44 120 56 172', st(c.shade, 2.5, 0.6)) +
    path('M20 30 Q24 120 20 200', st(c.light, 4, 0.8)) +
    path(
      'M96 24 Q136 24 136 24 L136 282 L104 282 Q100 220 112 170 Q96 110 96 24Z',
      fs(c.light, c.line, 2),
    ) +
    path(scallops(8, 142, 40, 5, 14), fs(c.shade, c.line, 2)) +
    rect(70, 164, 34, 10, 5, goldFill(1.5)) +
    path('M104 170 L112 196', st(GOLD.line, 3)) +
    path('M106 196 L118 196 L114 214 L110 214Z', goldFill(1.5)),
};

const prateleira: ItemArt = {
  w: 210,
  h: 130,
  draw: ({ ramp: c }) =>
    rect(10, 88, 190, 14, 7, fs(c.base, c.line, 2.5)) +
    path('M30 102 Q30 122 50 124 M180 102 Q180 122 160 124', st(GOLD.line, 5)) +
    path('M30 102 Q30 122 50 124 M180 102 Q180 122 160 124', st('#f6d27a', 2.5)) +
    // porta-retrato
    rect(26, 40, 44, 48, 6, goldFill(2)) +
    rect(32, 46, 32, 36, 3, { fill: c.light }) +
    heart(48, 62, 9, fs(c.base, c.line, 1.5)) +
    // vasinho
    path('M88 88 L90 66 L110 66 L112 88Z', fs('#fffaf6', '#dcc6d3', 2)) +
    circle(94, 56, 8, fs(c.base, c.line, 1.5)) +
    circle(106, 52, 8, fs(c.shade, c.line, 1.5)) +
    circle(100, 46, 7, fs(c.light, c.line, 1.5)) +
    // perfumes
    path('M130 88 L130 70 Q130 62 140 62 Q150 62 150 70 L150 88Z', fs('#e8d9ff', '#a98ad8', 2)) +
    rect(136, 50, 8, 12, 2, goldFill(1.2)) +
    circle(172, 76, 12, fs('#ffd3e6', c.line, 2)) +
    rect(168, 58, 8, 8, 2, goldFill(1.2)) +
    sparkle(160, 40, 5),
};

const espelhoChao: ItemArt = {
  w: 140,
  h: 280,
  draw: ({ ramp: c }) =>
    shadow(70, 272, 54, 7) +
    path('M20 244 L20 64 Q20 14 70 14 Q120 14 120 64 L120 244Z', goldFill(3)) +
    path('M30 236 L30 66 Q30 26 70 26 Q110 26 110 66 L110 236Z', {
      fill: 'url(#k-glass)',
      stroke: GOLD.line,
      'stroke-width': 2,
    }) +
    shine('M40 120 Q40 60 64 40 L56 66 Q48 90 50 150Z', 0.8) +
    shine('M92 210 L100 160 L102 200Z', 0.45) +
    heart(70, 16, 8, fs(c.base, c.line, 1.8)) +
    path('M70 10 Q50 -4 44 6 Q42 14 70 14 Q98 14 96 6 Q90 -4 70 10Z', fs(c.base, c.line, 2)) +
    pearl(20, 140, 5) +
    pearl(120, 140, 5) +
    goldLeg(30, 244, 24, -1, 8) +
    goldLeg(110, 244, 24, 1, 8) +
    sparkle(98, 60, 6),
};

const vitral: ItemArt = {
  w: 190,
  h: 190,
  draw: ({ ramp: c }) => {
    const colors = [
      c.base,
      '#9fd3f2',
      '#ffe28a',
      '#c8b0f0',
      '#a6e2c4',
      c.light,
      '#f6a9cb',
      '#9fd3f2',
    ];
    let petals = '';
    for (let i = 0; i < 8; i++) {
      const a0 = (i * Math.PI) / 4 - Math.PI / 8;
      const a1 = a0 + Math.PI / 4;
      const p = (a: number, r: number) =>
        `${(95 + Math.cos(a) * r).toFixed(1)} ${(95 + Math.sin(a) * r).toFixed(1)}`;
      petals += path(
        `M${p(a0, 26)} L${p(a0, 72)} A72 72 0 0 1 ${p(a1, 72)} L${p(a1, 26)} A26 26 0 0 0 ${p(a0, 26)}Z`,
        {
          fill: colors[i] ?? '#fff',
          stroke: '#6b5a66',
          'stroke-width': 3,
          opacity: 0.92,
        },
      );
    }
    return (
      circle(95, 95, 88, goldFill(4)) +
      circle(95, 95, 76, fs('#fffaf6', GOLD.line, 2)) +
      petals +
      circle(95, 95, 26, fs('#fff1a8', '#6b5a66', 3)) +
      heart(95, 97, 12, fs(c.base, c.line, 2)) +
      shine('M40 70 Q56 40 86 32 L78 46 Q56 56 50 80Z', 0.45) +
      `<g class="a-twinkle">${sparkle(150, 40, 8)}</g>`
    );
  },
};

const bandejaDoces: ItemArt = {
  w: 150,
  h: 190,
  draw: ({ ramp: c }) => {
    const cupcake = (x: number, y: number, top: string) =>
      path(
        `M${x - 13} ${y} L${x + 13} ${y} L${x + 10} ${y + 18} L${x - 10} ${y + 18}Z`,
        fs('#fffaf6', c.line, 1.5),
      ) +
      path(
        `M${x - 8} ${y + 2} L${x - 6} ${y + 16} M${x} ${y + 2} L${x} ${y + 16} M${x + 8} ${y + 2} L${x + 6} ${y + 16}`,
        st(c.shade, 1.2),
      ) +
      path(
        `M${x - 15} ${y + 1} Q${x - 16} ${y - 14} ${x} ${y - 18} Q${x + 16} ${y - 14} ${x + 15} ${y + 1}Z`,
        fs(top, c.line, 1.8),
      ) +
      circle(x, y - 20, 4, fs('#ff7f9e', '#d9506f', 1));
    const macaron = (x: number, y: number, color: string) =>
      ellipse(x, y, 11, 5, fs(color, c.line, 1.5)) +
      rect(x - 10, y - 1, 20, 3, 1.5, { fill: '#fff' }) +
      ellipse(x, y - 5, 11, 5, fs(color, c.line, 1.5));
    return (
      shadow(75, 182, 52, 6) +
      path('M75 30 L75 172', st(GOLD.line, 6)) +
      path('M75 30 L75 172', st('#f6d27a', 3)) +
      ellipse(75, 172, 30, 7, goldFill(2)) +
      ellipse(75, 132, 66, 10, fs('#fffaf6', c.line, 2.5)) +
      path(scallops(10, 140, 134, 8, 6), st(c.base, 2.5)) +
      ellipse(75, 74, 46, 8, fs('#fffaf6', c.line, 2.5)) +
      path(scallops(30, 120, 76, 6, 5), st(c.base, 2.5)) +
      cupcake(42, 106, c.base) +
      cupcake(108, 106, c.light) +
      macaron(75, 122, '#a6e2c4') +
      macaron(56, 66, '#c8b0f0') +
      macaron(94, 66, '#ffe28a') +
      heart(75, 22, 8, fs(c.base, c.line, 1.5))
    );
  },
};

export default {
  'quadro-retrato': quadroRetrato,
  'quadro-paisagem': quadroPaisagem,
  'tapete-retangular': tapeteRetangular,
  'tapete-coracao': tapeteCoracao,
  velas,
  bau,
  relogio,
  laco,
  guirlanda,
  bolo,
  'jogo-cha': jogoCha,
  'porta-joias': portaJoias,
  'caixinha-musica': caixinhaMusica,
  'globo-neve': globoNeve,
  livros,
  almofadas,
  cortina,
  prateleira,
  'espelho-chao': espelhoChao,
  vitral,
  'bandeja-doces': bandejaDoces,
} satisfies ArtPack;
