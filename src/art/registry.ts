import type { Category, ColorVariant } from '../core/model';
import { createLogger } from '../core/log';
import { RAMPS } from './palette';
import type { ArtPack, ItemArt } from './types';

const log = createLogger('art');

/**
 * Arte carregada sob demanda: cada categoria é um chunk separado (o bundle
 * inicial não carrega nenhum desenho). O service worker faz precache de todos
 * os chunks, então depois da primeira visita tudo funciona offline.
 */
const LOADERS: Record<Category, () => Promise<{ default: ArtPack }>> = {
  moveis: () => import('./packs/moveis'),
  decoracao: () => import('./packs/decoracao'),
  plantas: () => import('./packs/plantas'),
  bichinhos: () => import('./packs/bichinhos'),
  externos: () => import('./packs/externos'),
};

export class ArtRegistry {
  private readonly arts = new Map<string, ItemArt>();
  private readonly loading = new Map<Category, Promise<void>>();
  private readonly markup = new Map<string, string>();

  get(artId: string): ItemArt | undefined {
    return this.arts.get(artId);
  }

  isLoaded(category: Category): boolean {
    return this.loading.has(category) && this.arts.size > 0;
  }

  load(category: Category): Promise<void> {
    let p = this.loading.get(category);
    if (!p) {
      p = LOADERS[category]()
        .then((mod) => {
          for (const [id, art] of Object.entries(mod.default)) this.arts.set(id, art);
        })
        .catch((error: unknown) => {
          this.loading.delete(category);
          log.error(`Falha ao carregar a arte de "${category}"`, error);
          throw error;
        });
      this.loading.set(category, p);
    }
    return p;
  }

  async loadMany(categories: Iterable<Category>): Promise<void> {
    await Promise.all([...new Set(categories)].map((c) => this.load(c)));
  }

  /** Marcação SVG completa de um item (memorizada por arte + cor). */
  svg(artId: string, variant: ColorVariant): string | undefined {
    const art = this.arts.get(artId);
    if (!art) return undefined;
    const key = `${artId}|${variant}`;
    let out = this.markup.get(key);
    if (out === undefined) {
      out = itemSvg(art, variant, `${artId}-${variant}`);
      this.markup.set(key, out);
    }
    return out;
  }
}

export function itemSvg(art: ItemArt, variant: ColorVariant, key: string): string {
  const body = art.draw({ ramp: RAMPS[variant], variant, key });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.w} ${art.h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${body}</svg>`;
}
