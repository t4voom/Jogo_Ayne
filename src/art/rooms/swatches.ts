import type { FloorPattern, Ground, PaintColor, WallPattern } from '../../core/model';
import { circle, flower, rect } from '../kit';
import { PAINTS } from '../palette';
import { floor, wallPattern } from './interior';

const svg = (viewBox: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${body}</svg>`;

const cache = new Map<string, string>();
function memo(key: string, make: () => string): string {
  let out = cache.get(key);
  if (out === undefined) {
    out = make();
    cache.set(key, out);
  }
  return out;
}

/** Amostra quadradinha de um padrão de parede numa cor. */
export function wallSwatchSvg(pattern: WallPattern, color: PaintColor): string {
  return memo(`w|${pattern}|${color}`, () => {
    const p = PAINTS[color];
    const id = `sw-w-${pattern}-${color}`;
    const defs = wallPattern(id, pattern, p);
    return svg(
      '0 0 120 120',
      (defs ? `<defs>${defs}</defs>` : '') +
        rect(0, 0, 120, 120, 0, { fill: p.base }) +
        (defs ? rect(0, 0, 120, 120, 0, { fill: `url(#${id})` }) : ''),
    );
  });
}

/** Amostra de chão em perspectiva (recorte do chão do cômodo). */
export function floorSwatchSvg(pattern: FloorPattern, color: PaintColor): string {
  return memo(`f|${pattern}|${color}`, () =>
    svg(
      '330 680 340 320',
      floor(
        {
          kind: 'interior',
          wallColor: 'rosa',
          wallPattern: 'lisa',
          floorColor: color,
          floorPattern: pattern,
        },
        `sw-f-${pattern}-${color}`,
      ),
    ),
  );
}

/** Amostra de chão externo. */
export function groundSwatchSvg(ground: Ground): string {
  return memo(`g|${ground}`, () => {
    let body = rect(0, 0, 120, 120, 0, { fill: '#a6dc92' });
    if (ground === 'pedras') {
      for (let y = 6; y < 120; y += 28) {
        for (let x = (y / 28) % 2 === 0 ? 6 : -10; x < 120; x += 36) {
          body += rect(x, y, 30, 22, 9, { fill: '#fbf7f8', stroke: '#d8cbd2', 'stroke-width': 2 });
        }
      }
    } else if (ground === 'flores') {
      const pts: [number, number, string][] = [
        [24, 26, '#f9b8d4'],
        [70, 18, '#d9c3f6'],
        [100, 52, '#ffffff'],
        [40, 70, '#ffe28a'],
        [84, 92, '#f9b8d4'],
        [18, 104, '#d9c3f6'],
        [60, 48, '#ffc6b3'],
      ];
      for (const [x, y, c] of pts) body += flower(x, y, 12, c, '#ffd86b');
    } else {
      for (let i = 0; i < 9; i++)
        body += circle(14 + (i % 3) * 40, 20 + Math.floor(i / 3) * 40, 3, { fill: '#7fc47a' });
    }
    return svg('0 0 120 120', body);
  });
}
