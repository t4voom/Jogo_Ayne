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
import { GOLD, crownTop, scallops } from './common';
import extra from './moveis-extra';

const camaDossel = {
  w: 260,
  h: 290,
  draw: ({ ramp: c }) => {
    const curtain = g(
      path(
        'M20 66 Q46 64 58 74 Q44 130 50 172 Q32 206 26 248 L14 248 Q10 150 20 66Z',
        fs(c.light, c.line, 2.5),
      ) +
        path('M30 80 Q26 150 22 236', st(c.shade, 3, 0.8)) +
        path('M42 84 Q36 140 40 176', st(c.shade, 2.5, 0.6)) +
        rect(30, 166, 24, 9, 4.5, fs('url(#k-gold)', GOLD.line, 1.5)),
    );
    return (
      shadow(130, 276, 122, 13) +
      // postes do dossel
      rect(20, 54, 11, 214, 5.5, fs('url(#k-gold)', GOLD.line, 2)) +
      rect(229, 54, 11, 214, 5.5, fs('url(#k-gold)', GOLD.line, 2)) +
      // tecido do fundo
      path('M30 66 L230 66 L230 160 Q130 186 30 160Z', { fill: c.light, opacity: 0.75 }) +
      // cabeceira
      path(
        'M60 196 L60 124 Q60 94 92 94 Q110 66 130 66 Q150 66 168 94 Q200 94 200 124 L200 196Z',
        fs(c.base, c.line, 3),
      ) +
      path(
        'M74 190 L74 128 Q74 108 96 108 Q112 84 130 84 Q148 84 164 108 Q186 108 186 128 L186 190',
        st(c.shade, 3, 0.9),
      ) +
      circle(104, 132, 3.2, { fill: c.shade }) +
      circle(130, 118, 3.2, { fill: c.shade }) +
      circle(156, 132, 3.2, { fill: c.shade }) +
      circle(117, 154, 3.2, { fill: c.shade }) +
      circle(143, 154, 3.2, { fill: c.shade }) +
      heart(130, 92, 9, fs('url(#k-gold)', GOLD.line, 1.8)) +
      // colchão
      rect(34, 176, 192, 46, 20, fs('#ffffff', c.line, 2.5)) +
      // travesseiros
      path(
        'M58 178 Q56 160 80 160 L108 160 Q130 160 128 178 Q128 190 106 190 L80 190 Q58 190 58 178Z',
        fs('#fff', c.line, 2.5),
      ) +
      path(
        'M132 178 Q130 160 154 160 L182 160 Q204 160 202 178 Q202 190 180 190 L154 190 Q132 190 132 178Z',
        fs('#fff', c.line, 2.5),
      ) +
      path('M70 170 Q90 164 110 168', st(c.light, 3)) +
      path('M144 170 Q164 164 184 168', st(c.light, 3)) +
      // colcha
      path(
        'M32 198 Q130 188 228 198 L228 232 Q228 244 214 244 L46 244 Q32 244 32 232Z',
        fs(c.base, c.line, 3),
      ) +
      path('M32 198 Q130 188 228 198 L228 210 Q130 200 32 210Z', { fill: c.light }) +
      path(scallops(34, 226, 236, 8, 10), st(c.shade, 3)) +
      path('M60 222 Q130 214 200 222', st(c.light, 4, 0.8)) +
      // pés da cama
      rect(26, 236, 208, 14, 7, fs('url(#k-gold)', GOLD.line, 2)) +
      circle(40, 258, 7, fs('url(#k-gold)', GOLD.line, 2)) +
      circle(220, 258, 7, fs('url(#k-gold)', GOLD.line, 2)) +
      // cortinas
      curtain +
      g(curtain, { transform: 'translate(260 0) scale(-1 1)' }) +
      // sanefa do dossel
      path(
        `M12 62 Q130 18 248 62 L248 70 ${scallops(248, 12, 70, 7, 14).replace(/^M[^Q]+/, '')} Z`,
        fs(c.base, c.line, 3),
      ) +
      path('M14 60 Q130 16 246 60', st('url(#k-gold-h)', 5)) +
      path('M40 56 Q130 26 220 56', st(c.light, 3, 0.8)) +
      crownTop(130, 24, 1.1) +
      sparkle(206, 40, 6, '#fff', { opacity: 0.9 })
    );
  },
} satisfies ArtPack[string];

const penteadeira = {
  w: 200,
  h: 250,
  draw: ({ ramp: c }) =>
    shadow(100, 240, 88, 9) +
    // espelho
    ellipse(100, 68, 46, 56, fs('url(#k-gold)', GOLD.line, 3)) +
    ellipse(100, 68, 36, 46, { fill: 'url(#k-glass)', stroke: GOLD.line, 'stroke-width': 2 }) +
    shine('M78 46 Q86 30 100 26 L92 40 Q84 52 82 70Z', 0.75) +
    shine('M112 98 Q120 90 124 80 L126 92 Q120 104 112 108Z', 0.45) +
    heart(100, 14, 8, fs(c.base, c.line, 2)) +
    pearl(54, 64, 5) +
    pearl(146, 64, 5) +
    // suporte do espelho
    rect(92, 120, 16, 18, 4, fs('url(#k-gold)', GOLD.line, 2)) +
    // tampo
    rect(18, 134, 164, 16, 8, fs(c.light, c.line, 2.5)) +
    // corpo
    path(
      'M26 148 L174 148 L170 196 Q170 204 162 204 L38 204 Q30 204 30 196Z',
      fs(c.base, c.line, 3),
    ) +
    path('M30 148 L170 148 L169 160 L31 160Z', { fill: c.shade, opacity: 0.55 }) +
    rect(42, 166, 52, 28, 8, fs(c.light, c.line, 2)) +
    rect(106, 166, 52, 28, 8, fs(c.light, c.line, 2)) +
    gem(68, 180, 4, GOLD.base, GOLD.line) +
    gem(132, 180, 4, GOLD.base, GOLD.line) +
    // pernas curvas
    path('M40 202 Q36 222 28 236', st(GOLD.line, 7)) +
    path('M40 202 Q36 222 28 236', st('#f6d27a', 4)) +
    path('M160 202 Q164 222 172 236', st(GOLD.line, 7)) +
    path('M160 202 Q164 222 172 236', st('#f6d27a', 4)) +
    // frasquinhos
    path(
      'M40 134 L40 118 Q40 112 46 112 L50 112 Q56 112 56 118 L56 134Z',
      fs('#e8d9ff', '#a98ad8', 2),
    ) +
    rect(44, 104, 8, 9, 2, fs('url(#k-gold)', GOLD.line, 1.5)) +
    ellipse(156, 126, 12, 9, fs('#ffd3e6', c.line, 2)) +
    circle(156, 114, 5, fs('url(#k-gold)', GOLD.line, 1.5)) +
    sparkle(160, 24, 5, '#fff'),
} satisfies ArtPack[string];

const trono = {
  w: 200,
  h: 280,
  draw: ({ ramp: c }) =>
    shadow(100, 268, 90, 10) +
    // encosto
    path(
      'M40 190 L36 86 Q34 50 64 40 Q80 18 100 18 Q120 18 136 40 Q166 50 164 86 L160 190Z',
      fs('url(#k-gold)', GOLD.line, 3),
    ) +
    path(
      'M54 186 L52 90 Q52 64 74 58 Q86 40 100 40 Q114 40 126 58 Q148 64 148 90 L146 186Z',
      fs(c.base, c.line, 2.5),
    ) +
    path('M62 120 Q100 108 138 120', st(c.shade, 3, 0.7)) +
    circle(80, 92, 3.4, { fill: c.shade }) +
    circle(120, 92, 3.4, { fill: c.shade }) +
    circle(100, 74, 3.4, { fill: c.shade }) +
    circle(100, 112, 3.4, { fill: c.shade }) +
    circle(80, 140, 3.4, { fill: c.shade }) +
    circle(120, 140, 3.4, { fill: c.shade }) +
    shine('M60 96 Q62 70 80 62 Q70 80 68 110Z', 0.45) +
    heart(100, 30, 8, fs(c.base, c.line, 2)) +
    crownTop(100, 8, 0.9) +
    // braços
    path(
      'M20 160 Q20 140 40 140 L52 140 L52 210 L30 210 Q20 210 20 196Z',
      fs('url(#k-gold)', GOLD.line, 3),
    ) +
    path(
      'M180 160 Q180 140 160 140 L148 140 L148 210 L170 210 Q180 210 180 196Z',
      fs('url(#k-gold)', GOLD.line, 3),
    ) +
    circle(30, 150, 9, fs('url(#k-gold)', GOLD.line, 2.5)) +
    circle(170, 150, 9, fs('url(#k-gold)', GOLD.line, 2.5)) +
    gem(30, 150, 4, c.base, c.line) +
    gem(170, 150, 4, c.base, c.line) +
    // assento
    path(
      'M40 196 Q40 178 60 178 L140 178 Q160 178 160 196 L160 214 L40 214Z',
      fs(c.base, c.line, 3),
    ) +
    path('M48 190 Q100 180 152 190', st(c.light, 4, 0.9)) +
    rect(30, 210, 140, 22, 10, fs('url(#k-gold)', GOLD.line, 3)) +
    path(scallops(36, 164, 230, 6, 8), st(GOLD.line, 2.5)) +
    // pés
    path('M44 230 Q40 248 34 258 L52 258 Q54 244 58 232Z', fs('url(#k-gold)', GOLD.line, 2.5)) +
    path(
      'M156 230 Q160 248 166 258 L148 258 Q146 244 142 232Z',
      fs('url(#k-gold)', GOLD.line, 2.5),
    ) +
    sparkle(150, 46, 6, '#fff'),
} satisfies ArtPack[string];

const poltrona = {
  w: 200,
  h: 190,
  draw: ({ ramp: c }) =>
    shadow(100, 180, 86, 9) +
    // encosto
    path(
      'M36 120 L34 58 Q34 22 70 20 Q100 6 130 20 Q166 22 166 58 L164 120Z',
      fs(c.base, c.line, 3),
    ) +
    path(
      'M50 116 L50 62 Q50 38 76 36 Q100 24 124 36 Q150 38 150 62 L150 116',
      st(c.shade, 3, 0.8),
    ) +
    circle(76, 60, 3.2, { fill: c.shade }) +
    circle(124, 60, 3.2, { fill: c.shade }) +
    circle(100, 48, 3.2, { fill: c.shade }) +
    circle(100, 80, 3.2, { fill: c.shade }) +
    circle(76, 96, 3.2, { fill: c.shade }) +
    circle(124, 96, 3.2, { fill: c.shade }) +
    shine('M48 70 Q50 44 70 34 Q60 52 58 84Z', 0.45) +
    // braços enrolados
    path(
      'M14 112 Q14 88 36 88 Q58 88 58 112 L58 156 L18 156 Q14 156 14 150Z',
      fs(c.base, c.line, 3),
    ) +
    path(
      'M186 112 Q186 88 164 88 Q142 88 142 112 L142 156 L182 156 Q186 156 186 150Z',
      fs(c.base, c.line, 3),
    ) +
    circle(36, 108, 12, fs(c.light, c.line, 2.5)) +
    circle(164, 108, 12, fs(c.light, c.line, 2.5)) +
    circle(36, 108, 5, { fill: c.shade }) +
    circle(164, 108, 5, { fill: c.shade }) +
    // almofada do assento
    path(
      'M50 126 Q50 112 66 112 L134 112 Q150 112 150 126 L150 140 L50 140Z',
      fs(c.light, c.line, 3),
    ) +
    path('M60 122 Q100 114 140 122', st('#fff', 3, 0.8)) +
    // saia
    rect(16, 138, 168, 22, 10, fs(c.base, c.line, 3)) +
    path(scallops(20, 180, 158, 7, 7), st(c.shade, 2.5)) +
    path('M24 144 L176 144', st('url(#k-gold-h)', 3)) +
    // pés
    path('M30 158 L26 176', st(FIXED.wood.line, 7)) +
    path('M30 158 L26 176', st(FIXED.wood.base, 4)) +
    path('M170 158 L174 176', st(FIXED.wood.line, 7)) +
    path('M170 158 L174 176', st(FIXED.wood.base, 4)) +
    heart(100, 22, 7, fs('url(#k-gold)', GOLD.line, 1.6)),
} satisfies ArtPack[string];

const criadoMudo = {
  w: 150,
  h: 170,
  draw: ({ ramp: c }) =>
    shadow(75, 162, 62, 8) +
    rect(14, 44, 122, 14, 7, fs(c.light, c.line, 2.5)) +
    path(
      'M20 56 L130 56 L128 132 Q128 140 120 140 L30 140 Q22 140 22 132Z',
      fs(c.base, c.line, 3),
    ) +
    path('M22 56 L128 56 L128 66 L22 66Z', { fill: c.shade, opacity: 0.55 }) +
    rect(32, 72, 86, 26, 8, fs(c.light, c.line, 2)) +
    rect(32, 104, 86, 26, 8, fs(c.light, c.line, 2)) +
    heart(75, 86, 5, fs('url(#k-gold)', GOLD.line, 1.4)) +
    heart(75, 118, 5, fs('url(#k-gold)', GOLD.line, 1.4)) +
    path('M30 138 Q26 150 22 158', st(GOLD.line, 6)) +
    path('M30 138 Q26 150 22 158', st('#f6d27a', 3)) +
    path('M120 138 Q124 150 128 158', st(GOLD.line, 6)) +
    path('M120 138 Q124 150 128 158', st('#f6d27a', 3)) +
    // vasinho com flor em cima
    path('M60 44 Q58 30 66 26 L84 26 Q92 30 90 44Z', fs('#fff', c.line, 2)) +
    path('M75 26 L75 12', st(FIXED.leaf.line, 2.5)) +
    circle(75, 10, 7, fs(c.shade, c.line, 1.5)) +
    circle(75, 10, 3, { fill: '#fff6c9' }),
} satisfies ArtPack[string];

export default {
  ...extra,
  'cama-dossel': camaDossel,
  penteadeira,
  trono,
  poltrona,
  'criado-mudo': criadoMudo,
} satisfies ArtPack;
