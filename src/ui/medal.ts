import { RAMPS } from '../art/palette';
import type { ColorVariant } from '../core/model';
import { ICONS, type IconName } from './icons';

/** Medalha ilustrada (SVG) com fita e emblema. */
export function medalSvg(tone: ColorVariant, iconName: string, unlocked: boolean): string {
  const r = RAMPS[tone];
  const icon = (iconName in ICONS ? ICONS[iconName as IconName] : ICONS.star).replaceAll(
    'currentColor',
    unlocked ? '#ffffff' : '#c9b8c4',
  );
  const disc = unlocked ? r.base : '#efe6ec';
  const ring = unlocked ? 'url(#k-gold)' : '#ddd0d8';
  const line = unlocked ? '#c48a2c' : '#c9b8c4';
  return `<svg viewBox="0 0 100 120" aria-hidden="true" focusable="false">
  <path d="M30 62 L18 112 L34 104 L42 118 L50 70Z" fill="${unlocked ? r.shade : '#e3d8df'}" stroke="${unlocked ? r.line : '#cfc2ca'}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M70 62 L82 112 L66 104 L58 118 L50 70Z" fill="${unlocked ? r.base : '#ebe2e8'}" stroke="${unlocked ? r.line : '#cfc2ca'}" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="50" cy="46" r="40" fill="${ring}" stroke="${line}" stroke-width="2.5"/>
  <circle cx="50" cy="46" r="31" fill="${disc}" stroke="${line}" stroke-width="2"/>
  <circle cx="50" cy="46" r="31" fill="url(#k-shine)" opacity="${unlocked ? 0.35 : 0}"/>
  <g transform="translate(32 28) scale(1.5)">${icon}</g>
  ${unlocked ? '<path d="M24 26 Q30 14 44 12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>' : ''}
</svg>`;
}
