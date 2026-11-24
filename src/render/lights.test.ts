import { describe, expect, it } from 'vitest';
import type { ItemArt } from '../art/types';
import type { PlacedItem } from '../core/model';
import { lightOf } from './lights';

const art: ItemArt = { w: 100, h: 200, light: { x: 50, y: 20, r: 40 }, draw: () => '' };
const item: PlacedItem = {
  uid: 'a',
  itemId: 'abajur',
  x: 50,
  y: 50,
  w: 10,
  rot: 0,
  flip: false,
  color: 'rosa',
  locked: false,
};

describe('lightOf', () => {
  it('posiciona o brilho relativo ao item', () => {
    expect(lightOf(item, art, false)).toEqual({ uid: 'a', x: 50, y: 42, r: 4, flicker: false });
  });

  it('acompanha a rotação', () => {
    const l = lightOf({ ...item, rot: 90 }, art, true)!;
    expect(l.x).toBeCloseTo(58);
    expect(l.y).toBeCloseTo(50);
  });

  it('itens sem luz não brilham', () => {
    expect(lightOf(item, { ...art, light: undefined } as unknown as ItemArt, false)).toBeNull();
  });
});
