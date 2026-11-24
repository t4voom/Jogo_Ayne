import { describe, expect, it } from 'vitest';
import { defaultPosition } from './placement';

const base = { width: 20, aspect: 1, floorLine: 64.6, existing: [] };

describe('defaultPosition', () => {
  it('móveis ficam no chão, quadros na parede, lustres no teto', () => {
    const floor = defaultPosition({ ...base, placement: 'floor' });
    const wall = defaultPosition({ ...base, placement: 'wall' });
    const ceiling = defaultPosition({ ...base, placement: 'ceiling' });
    expect(floor.y + 10).toBeCloseTo(80.6); // base 16% abaixo do rodapé
    expect(wall.y).toBeLessThan(64.6);
    expect(ceiling.y).toBe(13);
    expect(floor.x).toBe(50);
  });

  it('não empilha no mesmo lugar', () => {
    const first = defaultPosition({ ...base, placement: 'floor' });
    const second = defaultPosition({ ...base, placement: 'floor', existing: [first] });
    const third = defaultPosition({ ...base, placement: 'floor', existing: [first, second] });
    expect(second.x).toBe(57);
    expect(third.x).toBe(43);
  });

  it('itens enormes continuam dentro do palco', () => {
    const p = defaultPosition({ ...base, width: 90, aspect: 1.3, placement: 'floor' });
    expect(p.y).toBeGreaterThanOrEqual(45);
    expect(p.y).toBeLessThanOrEqual(55);
  });
});
