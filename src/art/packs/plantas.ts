import { circle, flower, fs, g, heart, leaf, path, rect, rose, shadow, shine, st } from '../kit';
import { FIXED } from '../palette';
import type { ArtPack } from '../types';
import extra from './plantas-extra';

const GOLD = FIXED.gold;
const L = FIXED.leaf;

const vasoRosas = {
  w: 150,
  h: 220,
  draw: ({ ramp: c }) =>
    shadow(75, 212, 46, 7) +
    // hastes
    g(
      path('M75 140 Q70 100 46 64', st(L.line, 4)) +
        path('M75 140 Q78 96 76 46', st(L.line, 4)) +
        path('M75 140 Q84 100 108 66', st(L.line, 4)) +
        path('M75 140 Q60 110 30 100', st(L.line, 4)) +
        path('M75 140 Q92 112 122 102', st(L.line, 4)) +
        leaf(60, 108, 22, -150, L.base, L.line) +
        leaf(90, 104, 22, -30, L.base, L.line) +
        leaf(66, 84, 18, -120, L.light, L.line) +
        leaf(84, 80, 18, -60, L.light, L.line) +
        rose(46, 60, 17, c.base, c.shade, c.line) +
        rose(108, 62, 17, c.base, c.shade, c.line) +
        rose(76, 40, 19, c.base, c.shade, c.line) +
        rose(30, 98, 14, c.light, c.shade, c.line) +
        rose(122, 100, 14, c.light, c.shade, c.line),
      { class: 'a-sway' },
    ) +
    // vaso
    path(
      'M44 140 L106 140 Q112 170 98 196 Q92 206 75 206 Q58 206 52 196 Q38 170 44 140Z',
      fs('#fffaf6', '#dcc6d3', 3),
    ) +
    rect(38, 132, 74, 14, 7, fs('url(#k-gold)', GOLD.line, 2)) +
    heart(75, 172, 10, fs(c.base, c.line, 1.8)) +
    shine('M52 150 Q50 172 58 192 Q52 178 54 150Z', 0.8),
} satisfies ArtPack[string];

const arbustoCoracao = {
  w: 180,
  h: 240,
  draw: ({ ramp: c }) => {
    const dots: [number, number][] = [
      [62, 64],
      [110, 52],
      [130, 96],
      [72, 116],
      [100, 136],
      [50, 92],
      [92, 84],
      [124, 128],
    ];
    return (
      shadow(90, 230, 54, 8) +
      // tronco
      path('M86 170 L86 196 M94 170 L94 196', st(FIXED.wood.line, 6)) +
      rect(84, 160, 12, 40, 4, fs(FIXED.wood.base, FIXED.wood.line, 2)) +
      // copa em coração
      g(
        path(
          'M90 172 C20 130 4 88 26 56 C46 28 80 34 90 58 C100 34 134 28 154 56 C176 88 160 130 90 172Z',
          fs(L.base, L.line, 3),
        ) +
          path('M90 156 C40 122 28 92 42 70', st(L.shade, 5, 0.6)) +
          path('M30 72 C40 48 66 44 80 60', st(L.light, 5, 0.9)) +
          circle(54, 84, 8, { fill: L.light, opacity: 0.8 }) +
          circle(120, 70, 7, { fill: L.light, opacity: 0.7 }) +
          circle(108, 116, 9, { fill: L.shade, opacity: 0.5 }) +
          dots.map(([x, y]) => flower(x, y, 8, c.base, GOLD.base)).join(''),
        { class: 'a-sway' },
      ) +
      // vaso
      path(
        'M50 196 L130 196 L120 228 Q118 234 110 234 L70 234 Q62 234 60 228Z',
        fs('#fffaf6', '#dcc6d3', 3),
      ) +
      rect(44, 188, 92, 14, 7, fs('url(#k-gold)', GOLD.line, 2)) +
      heart(90, 216, 7, fs(c.base, c.line, 1.5)) +
      shine('M66 204 L72 228 L68 228Z', 0.7)
    );
  },
} satisfies ArtPack[string];

export default {
  ...extra,
  'vaso-rosas': vasoRosas,
  'arbusto-coracao': arbustoCoracao,
} satisfies ArtPack;
