import { SHARED_DEFS } from '../art/defs';
import type { ArtRegistry } from '../art/registry';
import { RAMPS } from '../art/palette';
import { roomBackgroundSvg } from '../art/rooms';
import type { CatalogItem } from '../catalog/types';
import type { Room } from '../core/model';

export interface ComposeOptions {
  /** Inclui os gradientes compartilhados (obrigatório fora do documento, ex.: foto). */
  readonly standalone?: boolean;
  /** Desenha sem animações (fotos). */
  readonly still?: boolean;
}

/**
 * Monta o cômodo inteiro como UM SVG (fundo + itens com posição, tamanho,
 * rotação e espelhamento). Usado nas miniaturas do mapa e nas fotos do álbum,
 * então a foto fica idêntica ao que se vê no palco.
 */
export function composeRoomSvg(
  room: Room,
  art: ArtRegistry,
  getItem: (id: string) => CatalogItem | undefined,
  options: ComposeOptions = {},
): string {
  const bg = roomBackgroundSvg(room)
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');
  let items = '';
  for (const item of room.items) {
    const cat = getItem(item.itemId);
    const a = cat ? art.get(cat.art) : undefined;
    if (!cat || !a) continue;
    const w = item.w * 10;
    const h = w * (a.h / a.w);
    const body = a.draw({
      ramp: RAMPS[item.color],
      variant: item.color,
      key: `${cat.art}-${item.color}`,
    });
    items +=
      `<g transform="translate(${(item.x * 10).toFixed(1)} ${(item.y * 10).toFixed(1)}) rotate(${item.rot}) scale(${item.flip ? -1 : 1} 1)">` +
      `<svg x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="0 0 ${a.w} ${a.h}" overflow="visible">${body}</svg></g>`;
  }
  const tint =
    room.ambience === 'noite'
      ? `<rect width="1000" height="1000" fill="rgb(92,88,170)" opacity=".32" style="mix-blend-mode:multiply"/>`
      : room.ambience === 'entardecer'
        ? `<rect width="1000" height="1000" fill="rgb(255,190,170)" opacity=".18" style="mix-blend-mode:multiply"/>`
        : '';
  const defs = options.standalone ? `<defs>${SHARED_DEFS}</defs>` : '';
  const still = options.still ? '<style>*{animation:none!important}</style>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">${defs}${still}${bg}${items}${tint}</svg>`;
}
