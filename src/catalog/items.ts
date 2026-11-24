import { COLOR_VARIANTS, type Category, type ColorVariant, type RoomId } from '../core/model';
import type { AnimKind, CatalogItem, Placement } from './types';

const ALL = COLOR_VARIANTS;

interface Def {
  name: string;
  category: Category;
  tags: string[];
  rooms: RoomId[];
  width: number;
  placement: Placement;
  behind?: boolean;
  colors?: readonly ColorVariant[];
  defaultColor?: ColorVariant;
  cost?: number;
  anim?: AnimKind[];
  art?: string;
}

function define(defs: Record<string, Def>): CatalogItem[] {
  return Object.entries(defs).map(([id, d]) => ({
    id,
    name: d.name,
    category: d.category,
    tags: d.tags,
    rooms: d.rooms,
    width: d.width,
    colors: d.colors ?? ALL,
    defaultColor: d.defaultColor ?? 'rosa',
    cost: d.cost ?? 0,
    placement: d.placement,
    behind: d.behind ?? d.placement === 'wall',
    anim: d.anim ?? [],
    art: d.art ?? id,
  }));
}

export const ITEMS: readonly CatalogItem[] = define({
  // ------------------------------------------------------------- Móveis
  'cama-dossel': {
    name: 'Cama com dossel',
    category: 'moveis',
    tags: ['cama', 'dormir', 'quarto', 'princesa'],
    rooms: ['quarto'],
    width: 44,
    placement: 'floor',
  },
  penteadeira: {
    name: 'Penteadeira com espelho',
    category: 'moveis',
    tags: ['espelho', 'maquiagem', 'quarto', 'closet'],
    rooms: ['quarto', 'closet'],
    width: 28,
    placement: 'floor',
    defaultColor: 'perola',
  },
  trono: {
    name: 'Trono real',
    category: 'moveis',
    tags: ['trono', 'rainha', 'coroa', 'cadeira'],
    rooms: ['trono'],
    width: 28,
    placement: 'floor',
    defaultColor: 'rosa',
  },
  poltrona: {
    name: 'Poltrona fofinha',
    category: 'moveis',
    tags: ['cadeira', 'sentar', 'sala'],
    rooms: ['quarto', 'trono', 'closet'],
    width: 26,
    placement: 'floor',
    defaultColor: 'lilas',
  },
  'criado-mudo': {
    name: 'Criado-mudo',
    category: 'moveis',
    tags: ['mesinha', 'gaveta', 'quarto'],
    rooms: ['quarto'],
    width: 17,
    placement: 'floor',
    defaultColor: 'perola',
  },
  // ---------------------------------------------------------- Decoração
  'lustre-cristal': {
    name: 'Lustre de cristal',
    category: 'decoracao',
    tags: ['luz', 'teto', 'cristal', 'brilho'],
    rooms: ['baile', 'trono', 'quarto'],
    width: 34,
    placement: 'ceiling',
    defaultColor: 'rosa',
    anim: ['flicker'],
  },
  'espelho-oval': {
    name: 'Espelho oval dourado',
    category: 'decoracao',
    tags: ['espelho', 'parede', 'dourado'],
    rooms: ['quarto', 'closet', 'banheiro'],
    width: 16,
    placement: 'wall',
  },
  'tapete-redondo': {
    name: 'Tapete redondo',
    category: 'decoracao',
    tags: ['tapete', 'chão', 'coração'],
    rooms: ['quarto', 'trono', 'closet'],
    width: 48,
    placement: 'floor',
    behind: true,
    defaultColor: 'lilas',
  },
  abajur: {
    name: 'Abajur',
    category: 'decoracao',
    tags: ['luz', 'lâmpada', 'mesa'],
    rooms: ['quarto'],
    width: 12,
    placement: 'stand',
  },
  'janela-arco': {
    name: 'Janela em arco com cortina',
    category: 'decoracao',
    tags: ['janela', 'cortina', 'parede'],
    rooms: ['quarto', 'trono', 'baile', 'cozinha'],
    width: 26,
    placement: 'wall',
  },
  castical: {
    name: 'Castiçal com vela',
    category: 'decoracao',
    tags: ['vela', 'luz', 'fogo'],
    rooms: ['trono', 'baile', 'quarto'],
    width: 9,
    placement: 'stand',
    anim: ['flicker'],
  },
  'coroa-almofada': {
    name: 'Coroa na almofada',
    category: 'decoracao',
    tags: ['coroa', 'rainha', 'joia'],
    rooms: ['trono', 'quarto'],
    width: 15,
    placement: 'stand',
  },
  // ------------------------------------------------------------- Plantas
  'vaso-rosas': {
    name: 'Vaso de rosas',
    category: 'plantas',
    tags: ['flor', 'rosa', 'vaso'],
    rooms: ['quarto', 'trono', 'baile'],
    width: 12,
    placement: 'stand',
    anim: ['sway'],
  },
  'arbusto-coracao': {
    name: 'Arbusto de coração',
    category: 'plantas',
    tags: ['arbusto', 'coração', 'jardim', 'planta'],
    rooms: ['fachada', 'jardim'],
    width: 18,
    placement: 'floor',
    defaultColor: 'rosa',
    anim: ['sway'],
  },
  // ----------------------------------------------------------- Bichinhos
  gatinho: {
    name: 'Gatinho',
    category: 'bichinhos',
    tags: ['gato', 'gatinho', 'pet', 'miau'],
    rooms: ['quarto', 'closet', 'trono'],
    width: 14,
    placement: 'floor',
    defaultColor: 'perola',
    anim: ['breathe', 'blink', 'tail'],
  },
  coelho: {
    name: 'Coelhinho',
    category: 'bichinhos',
    tags: ['coelho', 'pet', 'jardim'],
    rooms: ['jardim', 'quarto'],
    width: 12,
    placement: 'floor',
    defaultColor: 'perola',
    anim: ['breathe', 'blink'],
  },
  // ------------------------------------------------------------ Externos
  fonte: {
    name: 'Fonte encantada',
    category: 'externos',
    tags: ['água', 'fonte', 'jardim'],
    rooms: ['fachada', 'jardim'],
    width: 30,
    placement: 'floor',
    defaultColor: 'azul',
    anim: ['water'],
  },
});

const BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

export function getItem(id: string): CatalogItem | undefined {
  return BY_ID.get(id);
}

export function itemsByCategory(category: Category): CatalogItem[] {
  return ITEMS.filter((i) => i.category === category);
}

/** Remove acentos e caixa para busca ("Abajúr" acha "abajur"). */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function searchItems(query: string, items: readonly CatalogItem[] = ITEMS): CatalogItem[] {
  const q = normalize(query);
  if (!q) return [...items];
  const words = q.split(/\s+/);
  return items.filter((item) => {
    const hay = normalize(`${item.name} ${item.tags.join(' ')}`);
    return words.every((w) => hay.includes(w));
  });
}
