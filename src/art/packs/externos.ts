import { circle, ellipse, fs, g, gem, path, shadow, shine, sparkle, st } from '../kit';
import { FIXED } from '../palette';
import type { ArtPack } from '../types';

const S = FIXED.stone;
const W = FIXED.water;
const GOLD = FIXED.gold;

const fonte = {
  w: 250,
  h: 250,
  draw: ({ ramp: c }) =>
    shadow(125, 238, 116, 12) +
    // bacia de baixo
    ellipse(125, 196, 112, 30, fs(S.base, S.line, 3)) +
    path('M13 196 L13 214 Q13 240 125 240 Q237 240 237 214 L237 196', fs(S.base, S.line, 3)) +
    path('M20 214 Q125 236 230 214', st(c.base, 6)) +
    ellipse(125, 194, 96, 22, { fill: 'url(#k-water)', stroke: W.line, 'stroke-width': 2 }) +
    g(
      ellipse(125, 196, 60, 12, st('#fff', 2, 0.7)) + ellipse(125, 196, 36, 7, st('#fff', 2, 0.5)),
      { class: 'a-ripple' },
    ) +
    // coluna
    path('M112 194 L108 132 L142 132 L138 194Z', fs(S.light, S.line, 3)) +
    path('M116 186 L114 140', st(S.shade, 3)) +
    // bacia do meio
    path('M60 122 Q125 166 190 122Z', fs(S.base, S.line, 3)) +
    ellipse(125, 122, 66, 14, fs(S.light, S.line, 3)) +
    ellipse(125, 121, 54, 9, { fill: 'url(#k-water)' }) +
    path('M70 132 Q125 158 180 132', st(c.base, 5)) +
    // topo
    path('M116 120 L118 76 L132 76 L134 120Z', fs(S.light, S.line, 2.5)) +
    path('M96 74 Q125 96 154 74Z', fs(S.base, S.line, 2.5)) +
    ellipse(125, 74, 30, 7, fs(S.light, S.line, 2.5)) +
    circle(125, 60, 10, fs('url(#k-gold)', GOLD.line, 2)) +
    gem(125, 60, 4, c.base, c.line) +
    // água caindo (animada)
    g(
      path('M125 48 Q120 30 104 40 Q92 50 96 74', st(W.base, 5)) +
        path('M125 48 Q130 30 146 40 Q158 50 154 74', st(W.base, 5)) +
        path('M66 124 Q50 150 52 186', st(W.base, 5)) +
        path('M184 124 Q200 150 198 186', st(W.base, 5)) +
        path('M98 82 Q86 100 84 122', st(W.base, 4)) +
        path('M152 82 Q164 100 166 122', st(W.base, 4)),
      { class: 'a-water' },
    ) +
    g(
      path('M125 48 Q120 30 104 40 Q92 50 96 74', st('#fff', 2, 0.9)) +
        path('M125 48 Q130 30 146 40 Q158 50 154 74', st('#fff', 2, 0.9)) +
        path('M66 124 Q50 150 52 186', st('#fff', 2, 0.9)) +
        path('M184 124 Q200 150 198 186', st('#fff', 2, 0.9)),
      { class: 'a-water a-water-2' },
    ) +
    circle(125, 44, 5, { fill: W.light }) +
    shine('M30 204 Q60 214 92 216 Q56 220 30 212Z', 0.5) +
    sparkle(92, 186, 6) +
    sparkle(170, 200, 5),
} satisfies ArtPack[string];

export default { fonte } satisfies ArtPack;
