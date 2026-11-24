import type { Ambience, ExteriorDecor, RoomId } from '../../core/model';
import { circle, ellipse, flower, fs, g, heart, mix, path, rect, sparkle, st } from '../kit';
import { FIXED, PAINTS, type Paint } from '../palette';
import { seeded } from './random';

/**
 * Fundo externo (Fachada e Jardim) num viewBox 1000×1000: céu conforme a hora
 * (dia / entardecer / noite estrelada com lua), colinas, o castelo pintado com
 * as cores escolhidas e o chão (grama, caminho de pedras ou campo de flores).
 */

export const GROUND_Y = 720;

const SKY: Record<Ambience, [string, string, string]> = {
  dia: ['#8fcbf3', '#cfeaff', '#fff1f7'],
  entardecer: ['#a995e0', '#f4a9c6', '#ffd9b8'],
  noite: ['#25245a', '#433a80', '#86689f'],
};

const HILLS: Record<Ambience, [string, string]> = {
  dia: ['#bfe6b4', '#a7dba0'],
  entardecer: ['#d9b9d6', '#c7a7cf'],
  noite: ['#4a4f86', '#3d4278'],
};

function sky(a: Ambience, key: string): string {
  const [top, mid, bottom] = SKY[a];
  let out =
    `<defs><linearGradient id="${key}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".55" stop-color="${mid}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>` +
    rect(0, 0, 1000, GROUND_Y + 10, 0, { fill: `url(#${key}-sky)` });
  if (a === 'dia') {
    out +=
      circle(840, 150, 110, { fill: '#fff6c9', opacity: 0.35 }) +
      circle(840, 150, 58, fs('#fff1a8', '#ffd86b', 4));
    out += cloud(170, 170, 1.1) + cloud(560, 110, 0.8) + cloud(380, 250, 0.6);
  } else if (a === 'entardecer') {
    out +=
      circle(800, 600, 200, { fill: '#ffe0b8', opacity: 0.45 }) +
      circle(800, 600, 80, { fill: '#ffd59a', opacity: 0.95 });
    out += cloud(200, 200, 1, '#ffe3ee') + cloud(620, 150, 0.75, '#ffe3ee');
  } else {
    const rnd = seeded(42);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * 1000;
      const y = rnd() * 560;
      const r = 1 + rnd() * 2.4;
      out += circle(Number(x.toFixed(0)), Number(y.toFixed(0)), Number(r.toFixed(1)), {
        fill: '#fff',
        opacity: (0.5 + rnd() * 0.5).toFixed(2),
        class: i % 4 === 0 ? 'a-twinkle' : undefined,
      });
    }
    out += sparkle(140, 120, 14, '#fff', { class: 'a-twinkle' });
    out += sparkle(660, 80, 10, '#fff', { class: 'a-twinkle' });
    // lua crescente
    out +=
      circle(830, 160, 120, { fill: '#fff6d6', opacity: 0.12 }) +
      `<defs><mask id="${key}-moon"><rect width="1000" height="1000" fill="#fff"/><circle cx="858" cy="140" r="58" fill="#000"/></mask></defs>` +
      circle(830, 160, 62, { fill: '#fff4c8', mask: `url(#${key}-moon)` });
  }
  return out;
}

function cloud(x: number, y: number, s: number, fill = '#ffffff'): string {
  return (
    g(
      path('M-90 20 Q-96 -8 -62 -10 Q-56 -44 -16 -40 Q8 -70 44 -46 Q84 -50 84 -14 Q106 -6 96 20Z', {
        fill,
        opacity: 0.92,
      }),
      { class: 'a-drift' },
    ).replace(/^/, `<g transform="translate(${x} ${y}) scale(${s})">`) + '</g>'
  );
}

function hills(a: Ambience): string {
  const [back, front] = HILLS[a];
  return (
    path(
      `M0 640 Q150 560 320 610 Q480 540 650 600 Q830 540 1000 610 L1000 ${GROUND_Y + 10} L0 ${GROUND_Y + 10}Z`,
      {
        fill: back,
      },
    ) +
    path(
      `M0 690 Q200 630 420 680 Q640 640 820 680 Q920 660 1000 676 L1000 ${GROUND_Y + 10} L0 ${GROUND_Y + 10}Z`,
      {
        fill: front,
      },
    )
  );
}

// ----------------------------------------------------------------- castelo

function windowArch(x: number, y: number, w: number, h: number, a: Ambience, wall: Paint): string {
  const r = w / 2;
  const d = `M${x - r} ${y + h} L${x - r} ${y + r} A${r} ${r} 0 0 1 ${x + r} ${y + r} L${x + r} ${y + h}Z`;
  const glass = a === 'noite' ? '#ffe7a3' : a === 'entardecer' ? '#ffd2b0' : 'url(#k-sky-window)';
  let out = path(d, fs(glass, mix(wall.shade, '#000000', 0.12), 3));
  if (a === 'noite') out += ellipse(x, y + h / 2, w, h * 0.7, { fill: '#ffe7a3', opacity: 0.25 });
  out += path(`M${x} ${y + 4} L${x} ${y + h}`, st('#fffaf6', 3));
  out += path(`M${x - r} ${y + h * 0.55} L${x + r} ${y + h * 0.55}`, st('#fffaf6', 3));
  out += rect(x - r - 6, y + h - 2, w + 12, 8, 4, fs('#fffaf6', wall.shade, 1.5));
  return out;
}

function cone(
  cx: number,
  baseY: number,
  halfW: number,
  apexY: number,
  roof: Paint,
  key: string,
  id: string,
): string {
  const d = `M${cx - halfW} ${baseY} Q${cx - halfW * 0.4} ${(baseY + apexY) / 2} ${cx} ${apexY} Q${cx + halfW * 0.4} ${(baseY + apexY) / 2} ${cx + halfW} ${baseY}Z`;
  const clip = `${key}-${id}`;
  let shingles = '';
  const rows = 6;
  for (let i = 1; i <= rows; i++) {
    const y = apexY + ((baseY - apexY) * i) / (rows + 0.4);
    const n = 3 + i;
    const w = (halfW * 2 * 1.2) / n;
    let dd = `M${cx - halfW * 1.2} ${y.toFixed(1)}`;
    for (let k = 0; k < n; k++) dd += ` q${(w / 2).toFixed(1)} 14 ${w.toFixed(1)} 0`;
    shingles += path(dd, st(roof.shade, 2.4, 0.8));
  }
  return (
    `<defs><clipPath id="${clip}"><path d="${d}"/></clipPath></defs>` +
    path(d, fs(roof.base, mix(roof.shade, '#000000', 0.1), 3)) +
    g(shingles, { 'clip-path': `url(#${clip})` }) +
    path(
      `M${cx - halfW * 0.55} ${baseY - 10} Q${cx - halfW * 0.2} ${(baseY + apexY) / 2} ${cx - 4} ${apexY + 16}`,
      st(roof.light, 5, 0.7),
    ) +
    rect(
      cx - halfW - 6,
      baseY - 4,
      halfW * 2 + 12,
      12,
      6,
      fs('url(#k-gold-h)', FIXED.gold.line, 2),
    ) +
    circle(cx, apexY - 6, 8, fs('url(#k-gold)', FIXED.gold.line, 2)) +
    path(`M${cx} ${apexY - 12} L${cx} ${apexY - 60}`, st(FIXED.gold.line, 3)) +
    g(
      path(
        `M${cx} ${apexY - 60} Q${cx + 26} ${apexY - 58} ${cx + 44} ${apexY - 48} Q${cx + 24} ${apexY - 42} ${cx} ${apexY - 40}Z`,
        fs(roof.accent, roof.shade, 2),
      ),
      {
        class: 'a-flag',
      },
    )
  );
}

function stones(x: number, y: number, w: number, h: number, wall: Paint, seed: number): string {
  const rnd = seeded(seed);
  let out = '';
  for (let row = y + 26; row < y + h - 10; row += 30) {
    const shift = rnd() * 40;
    for (let col = x + shift; col < x + w - 30; col += 60 + rnd() * 30) {
      out += path(
        `M${col.toFixed(0)} ${row} l${(22 + rnd() * 16).toFixed(0)} 0`,
        st(wall.shade, 3, 0.55),
      );
    }
  }
  return out;
}

function merlons(x0: number, x1: number, y: number, wall: Paint): string {
  let out = '';
  for (let x = x0; x < x1 - 10; x += 44) {
    out += rect(x, y - 26, 30, 30, 5, fs(wall.base, wall.shade, 3));
  }
  return out;
}

function castle(decor: ExteriorDecor, a: Ambience, key: string): string {
  const wall = PAINTS[decor.castleColor];
  const roof = PAINTS[decor.roofColor];
  const line = mix(wall.shade, '#000000', 0.1);
  const W = (x: number, y: number, w: number, h: number) =>
    rect(x, y, w, h, 6, fs(wall.base, line, 3));
  let out = '';
  // torres laterais
  for (const cx of [250, 750]) {
    out += W(cx - 52, 330, 104, GROUND_Y - 330);
    out += rect(cx - 52, 330, 26, GROUND_Y - 330, 0, { fill: wall.light, opacity: 0.6 });
    out += stones(cx - 52, 330, 104, GROUND_Y - 330, wall, cx);
    out += windowArch(cx, 400, 36, 58, a, wall);
    out += windowArch(cx, 540, 36, 58, a, wall);
    out += cone(cx, 334, 66, 168, roof, key, `t${cx}`);
  }
  // muralha
  out += merlons(292, 708, 440, wall);
  out += W(290, 436, 420, GROUND_Y - 436);
  out += stones(290, 436, 420, GROUND_Y - 436, wall, 9);
  out += windowArch(345, 500, 40, 64, a, wall);
  out += windowArch(655, 500, 40, 64, a, wall);
  // estandartes
  for (const bx of [380, 620]) {
    out += path(
      `M${bx - 22} 470 L${bx + 22} 470 L${bx + 22} 560 L${bx} 546 L${bx - 22} 560Z`,
      fs(roof.base, roof.shade, 2.5),
    );
    out += heart(bx, 506, 9, fs('url(#k-gold)', FIXED.gold.line, 1.5));
    out += rect(bx - 26, 464, 52, 8, 4, fs('url(#k-gold-h)', FIXED.gold.line, 1.5));
  }
  // torre central
  out += W(410, 262, 180, GROUND_Y - 262);
  out += rect(410, 262, 40, GROUND_Y - 262, 0, { fill: wall.light, opacity: 0.6 });
  out += stones(410, 262, 180, GROUND_Y - 262, wall, 77);
  out += cone(500, 266, 104, 78, roof, key, 'tc');
  // rosácea
  const glass = a === 'noite' ? '#ffe7a3' : a === 'entardecer' ? '#ffd2b0' : '#cfe8fb';
  out += circle(500, 340, 40, fs('url(#k-gold)', FIXED.gold.line, 3));
  out += circle(500, 340, 31, { fill: glass });
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    out += path(
      `M500 340 L${(500 + Math.cos(ang) * 31).toFixed(1)} ${(340 + Math.sin(ang) * 31).toFixed(1)}`,
      st('#fffaf6', 2.5),
    );
  }
  out += heart(500, 342, 10, { fill: roof.base, stroke: roof.shade, 'stroke-width': 1.5 });
  out += windowArch(500, 420, 44, 70, a, wall);
  // porta
  out +=
    path(
      `M440 ${GROUND_Y} L440 616 A60 60 0 0 1 560 616 L560 ${GROUND_Y}Z`,
      fs('url(#k-gold)', FIXED.gold.line, 3),
    ) +
    path(
      `M452 ${GROUND_Y} L452 618 A48 48 0 0 1 548 618 L548 ${GROUND_Y}Z`,
      fs(FIXED.wood.base, FIXED.wood.line, 2.5),
    ) +
    path(`M500 572 L500 ${GROUND_Y}`, st(FIXED.wood.line, 2.5)) +
    path(
      `M464 640 L488 640 M512 640 L536 640 M464 690 L488 690 M512 690 L536 690`,
      st(FIXED.gold.line, 5),
    ) +
    circle(490, 668, 4, { fill: FIXED.gold.base }) +
    circle(510, 668, 4, { fill: FIXED.gold.base }) +
    heart(500, 590, 9, fs(roof.base, roof.shade, 1.5));
  // degraus
  out += rect(420, GROUND_Y - 6, 160, 14, 6, fs('#fffaf6', line, 2));
  return out;
}

// -------------------------------------------------------------------- chão

function ground(decor: ExteriorDecor, a: Ambience, roomId: RoomId, key: string): string {
  const night = a === 'noite';
  const top = night ? '#5f7f8e' : a === 'entardecer' ? '#b9d39a' : '#b5e39f';
  const bottom = night ? '#3f5c6f' : a === 'entardecer' ? '#94bf86' : '#86cc78';
  let out =
    `<defs><linearGradient id="${key}-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>` +
    rect(0, GROUND_Y, 1000, 1000 - GROUND_Y, 0, { fill: `url(#${key}-ground)` });
  const rnd = seeded(roomId === 'jardim' ? 5 : 13);
  // tufos de grama
  for (let i = 0; i < 60; i++) {
    const x = rnd() * 1000;
    const y = GROUND_Y + 20 + rnd() * 270;
    const s = 0.5 + ((y - GROUND_Y) / 280) * 0.9;
    out += path(
      `M${(x - 6 * s).toFixed(1)} ${y.toFixed(1)} l${(3 * s).toFixed(1)} ${(-10 * s).toFixed(1)} l${(3 * s).toFixed(1)} ${(8 * s).toFixed(1)} l${(3 * s).toFixed(1)} ${(-12 * s).toFixed(1)} l${(3 * s).toFixed(1)} ${(12 * s).toFixed(1)}`,
      st(night ? '#38566a' : FIXED.leaf.shade, 2.2 * s, 0.7),
    );
  }
  if (decor.ground === 'pedras') {
    out += path(`M440 ${GROUND_Y} L560 ${GROUND_Y} L760 1000 L240 1000Z`, {
      fill: night ? '#8f8aa6' : '#efe6ea',
    });
    let y = GROUND_Y + 8;
    let h = 18;
    let row = 0;
    while (y < 1000) {
      const t = (y - GROUND_Y) / (1000 - GROUND_Y);
      const left = 440 - 200 * t;
      const right = 560 + 200 * t;
      const n = 3 + (row % 2);
      const w = (right - left) / n;
      for (let k = 0; k < n; k++) {
        out += rect(
          left + k * w + 3,
          y,
          w - 6,
          h,
          h * 0.45,
          fs(night ? '#b2adc6' : '#fbf7f8', night ? '#77728f' : '#d8cbd2', 2),
        );
      }
      y += h + 5;
      h *= 1.18;
      row++;
    }
  }
  if (decor.ground === 'flores') {
    const colors = ['#f9b8d4', '#d9c3f6', '#ffffff', '#ffe28a', '#ffc6b3'];
    for (let i = 0; i < 140; i++) {
      const x = rnd() * 1000;
      const y = GROUND_Y + 14 + rnd() * 280;
      const r = 4 + ((y - GROUND_Y) / 280) * 9;
      const c = colors[Math.floor(rnd() * colors.length)] ?? '#fff';
      out += flower(Number(x.toFixed(0)), Number(y.toFixed(0)), Number(r.toFixed(1)), c, '#ffd86b');
    }
  }
  return out;
}

function hedges(a: Ambience): string {
  const fill = a === 'noite' ? '#3e6a5f' : FIXED.leaf.shade;
  const line = a === 'noite' ? '#2f544b' : FIXED.leaf.line;
  let out = '';
  for (let x = -20; x < 1040; x += 90) {
    out += ellipse(x, GROUND_Y - 4, 60, 44, fs(fill, line, 3));
  }
  out += rect(0, GROUND_Y - 4, 1000, 20, 0, { fill });
  return out;
}

export function exteriorBackground(
  decor: ExteriorDecor,
  a: Ambience,
  roomId: RoomId,
  key: string,
): string {
  let out = sky(a, key) + hills(a);
  if (roomId === 'jardim') {
    out += g(castle(decor, a, key), { transform: 'translate(300 362) scale(.4)', opacity: 0.9 });
    out += hedges(a);
  } else {
    out += castle(decor, a, key);
  }
  return out + ground(decor, a, roomId, key);
}
