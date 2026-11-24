import { describe, expect, it } from 'vitest';
import { CATEGORIES, ROOM_IDS } from '../core/model';
import { ROOMS } from '../core/rooms';
import { ITEMS, getItem, itemsByCategory, normalize, searchItems } from './items';

describe('catálogo', () => {
  it('ids únicos e dados válidos', () => {
    const ids = new Set<string>();
    for (const item of ITEMS) {
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);
      expect(item.name.length).toBeGreaterThan(2);
      expect(item.width).toBeGreaterThan(0);
      expect(item.width).toBeLessThanOrEqual(100);
      expect(item.colors).toContain(item.defaultColor);
      expect(item.cost).toBeGreaterThanOrEqual(0);
      for (const r of item.rooms) expect(ROOM_IDS).toContain(r);
      expect(CATEGORIES).toContain(item.category);
    }
  });

  it('itens iniciais dos cômodos existem no catálogo', () => {
    for (const room of ROOMS) {
      for (const s of room.starterItems) expect(getItem(s.itemId), s.itemId).toBeDefined();
    }
  });

  it('toda categoria tem itens', () => {
    for (const c of CATEGORIES) expect(itemsByCategory(c).length).toBeGreaterThan(0);
  });

  it('busca ignora acentos, caixa e procura nas tags', () => {
    expect(normalize('  Castiçal ')).toBe('castical');
    expect(searchItems('CASTIÇAL').map((i) => i.id)).toContain('castical');
    expect(searchItems('miau').map((i) => i.id)).toEqual(['gatinho']);
    expect(searchItems('luz').length).toBeGreaterThan(1);
    expect(searchItems('')).toHaveLength(ITEMS.length);
    expect(searchItems('xyz')).toHaveLength(0);
  });
});
