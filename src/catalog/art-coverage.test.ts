import { describe, expect, it } from 'vitest';
import { ITEMS } from './items';
import { CATEGORIES, COLOR_VARIANTS, type Category } from '../core/model';
import bichinhos from '../art/packs/bichinhos';
import decoracao from '../art/packs/decoracao';
import externos from '../art/packs/externos';
import moveis from '../art/packs/moveis';
import plantas from '../art/packs/plantas';
import { itemSvg } from '../art/registry';
import type { ArtPack } from '../art/types';

const PACKS: Record<Category, ArtPack> = { moveis, decoracao, plantas, bichinhos, externos };

describe('arte do catálogo', () => {
  it('tem pelo menos 100 itens', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(100);
  });

  it('cada categoria tem itens suficientes', () => {
    for (const c of CATEGORIES)
      expect(ITEMS.filter((i) => i.category === c).length, c).toBeGreaterThanOrEqual(10);
  });

  it('todo item tem desenho no pacote da sua categoria', () => {
    for (const item of ITEMS) expect(PACKS[item.category][item.art], item.id).toBeDefined();
  });

  it('nenhum desenho órfão (sem item no catálogo)', () => {
    const arts = new Set(ITEMS.map((i) => i.art));
    for (const pack of Object.values(PACKS)) {
      for (const id of Object.keys(pack)) expect(arts.has(id), id).toBe(true);
    }
  });

  it('desenhos válidos em todas as cores (sem NaN/undefined)', () => {
    for (const item of ITEMS) {
      const art = PACKS[item.category][item.art];
      if (!art) continue;
      expect(art.w, item.id).toBeGreaterThan(0);
      expect(art.h, item.id).toBeGreaterThan(0);
      for (const color of COLOR_VARIANTS) {
        const svg = itemSvg(art, color, `${item.art}-${color}`);
        expect(svg, `${item.id}/${color}`).not.toMatch(/NaN|undefined|null|\[object/);
        expect(svg.startsWith('<svg')).toBe(true);
        // tags balanceadas (g e svg)
        expect((svg.match(/<g[\s>]/g) ?? []).length, `${item.id} <g>`).toBe(
          (svg.match(/<\/g>/g) ?? []).length,
        );
      }
    }
  });
});
