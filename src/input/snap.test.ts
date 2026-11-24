import { describe, expect, it } from 'vitest';
import { snap, snapAngle } from './snap';

describe('snap', () => {
  it('puxa para o centro do palco', () => {
    const r = snap({ x: 49, y: 30, w: 10, h: 10 }, [], { threshold: 1.5 });
    expect(r.x).toBe(50);
    expect(r.guides).toEqual([{ axis: 'x', at: 50 }]);
  });

  it('não puxa quando está longe', () => {
    const r = snap({ x: 40, y: 30, w: 10, h: 10 }, [], { threshold: 1.5 });
    expect(r).toEqual({ x: 40, y: 30, guides: [] });
  });

  it('alinha centros e bases com outros itens', () => {
    const other = { x: 20, y: 70, w: 20, h: 20 };
    const r = snap({ x: 21, y: 75.5, w: 10, h: 10 }, [other], { threshold: 1.5 });
    expect(r.x).toBe(20);
    expect(r.y).toBe(75); // base em 80, igual à do outro
    expect(r.guides).toContainEqual({ axis: 'y', at: 80 });
  });

  it('encosta móveis no rodapé', () => {
    const r = snap({ x: 30, y: 57, w: 20, h: 20 }, [], { threshold: 1.5, floorLine: 64.6 });
    expect(r.y).toBeCloseTo(57.6);
  });

  it('snapAngle', () => {
    expect(snapAngle(4)).toBe(0);
    expect(snapAngle(-88)).toBe(-90);
    expect(snapAngle(20)).toBe(20);
  });
});
