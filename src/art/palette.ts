import type { ColorVariant, PaintColor } from '../core/model';

/**
 * Rampas de cor das variações de item. Sombreamento em 2 tons (base/shade) +
 * luz (light) + tom profundo (deep) e contorno suave na cor do objeto (line),
 * nunca preto.
 */
export interface Ramp {
  readonly light: string;
  readonly base: string;
  readonly shade: string;
  readonly deep: string;
  readonly line: string;
}

export const RAMPS: Record<ColorVariant, Ramp> = {
  rosa: { light: '#ffe6f1', base: '#f9bad5', shade: '#ef97bd', deep: '#da74a2', line: '#cf6f9a' },
  lilas: { light: '#f3eaff', base: '#d7c1f6', shade: '#bc9fea', deep: '#9c7bd4', line: '#9a7bcf' },
  azul: { light: '#e6f4ff', base: '#b9def7', shade: '#90c5eb', deep: '#67a6d6', line: '#6aa6d2' },
  menta: { light: '#e4f8ef', base: '#b5e7d0', shade: '#88d2b1', deep: '#5db690', line: '#5fb38f' },
  dourado: {
    light: '#fff5d2',
    base: '#fadc8e',
    shade: '#efc15c',
    deep: '#d49c33',
    line: '#c99133',
  },
  perola: { light: '#ffffff', base: '#faf4ef', shade: '#ebdfd7', deep: '#d2c0b4', line: '#c9b3a7' },
};

export const VARIANT_LABEL: Record<ColorVariant, string> = {
  rosa: 'Rosa',
  lilas: 'Lilás',
  azul: 'Azul bebê',
  menta: 'Menta',
  dourado: 'Dourado',
  perola: 'Branco pérola',
};

/** Cores fixas usadas em detalhes (ouro, madeira, folhas, vidro…). */
export const FIXED = {
  gold: { light: '#fff1c2', base: '#f6d27a', shade: '#e3ad48', line: '#c48a2c' },
  wood: { light: '#f2d2b5', base: '#dcaa82', shade: '#c18a62', line: '#a8714c' },
  leaf: { light: '#c9efc0', base: '#94d68c', shade: '#6bbd6d', line: '#4f9e58' },
  leafDark: { base: '#5fae68', shade: '#47935a', line: '#3b7d4d' },
  glass: { light: '#ffffff', base: '#dff1ff', shade: '#b8dcf5', line: '#8ec0e3' },
  water: { light: '#e9f7ff', base: '#a9dcf7', shade: '#7cc4ec', line: '#5aa9d8' },
  white: { base: '#ffffff', shade: '#f3e8ef', line: '#dcc6d3' },
  flame: { outer: '#ffb347', inner: '#fff3b0', core: '#ffffff' },
  blush: '#ff9ec4',
  eye: '#4a2341',
  stone: { light: '#f6f1f3', base: '#e7dfe4', shade: '#cfc3cb', line: '#b6a7b1' },
} as const;

/** Tintas de parede/chão/castelo. */
export interface Paint {
  readonly base: string;
  readonly light: string;
  readonly shade: string;
  readonly accent: string;
}

export const PAINTS: Record<PaintColor, Paint> = {
  rosa: { base: '#fbd5e5', light: '#fff0f6', shade: '#f2b5cf', accent: '#e98fb8' },
  'rosa-choque': { base: '#f8a9cb', light: '#ffd4e6', shade: '#ec86b3', accent: '#d9659b' },
  lilas: { base: '#e6d8fb', light: '#f6f0ff', shade: '#d0bbf3', accent: '#ad8fe3' },
  lavanda: { base: '#d9cef2', light: '#efe9fb', shade: '#c2b2e6', accent: '#9b86d2' },
  azul: { base: '#d4eafa', light: '#eef7ff', shade: '#b4d7f1', accent: '#86b9e2' },
  menta: { base: '#d3f2e3', light: '#effbf5', shade: '#b0e2c9', accent: '#7fc9a5' },
  pessego: { base: '#ffdcc8', light: '#fff1e8', shade: '#f6c0a2', accent: '#ec9f7a' },
  amarelo: { base: '#fff0c0', light: '#fffae6', shade: '#f6dc93', accent: '#e9be5d' },
  creme: { base: '#fbf2e2', light: '#fffaf2', shade: '#efdfc6', accent: '#d9bd92' },
  perola: { base: '#faf6f3', light: '#ffffff', shade: '#ece3dd', accent: '#d6c6bc' },
  coral: { base: '#f9bdb4', light: '#ffe0db', shade: '#f09d92', accent: '#de7b70' },
  vinho: { base: '#b9607f', light: '#d58aa4', shade: '#9a4766', accent: '#f3c6d5' },
};

export const PAINT_LABEL: Record<PaintColor, string> = {
  rosa: 'Rosa',
  'rosa-choque': 'Rosa choque',
  lilas: 'Lilás',
  lavanda: 'Lavanda',
  azul: 'Azul bebê',
  menta: 'Menta',
  pessego: 'Pêssego',
  amarelo: 'Amarelo manteiga',
  creme: 'Creme',
  perola: 'Branco pérola',
  coral: 'Coral',
  vinho: 'Vinho',
};
