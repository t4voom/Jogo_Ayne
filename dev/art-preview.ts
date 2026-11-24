import { installSharedDefs } from '../src/art/defs';
import { ArtRegistry } from '../src/art/registry';
import { roomBackgroundSvg } from '../src/art/rooms';
import { ITEMS } from '../src/catalog/items';
import { CATEGORIES, COLOR_VARIANTS, type Room } from '../src/core/model';
import { createRoom } from '../src/core/rooms';
import { sequentialIds } from '../src/core/ids';

installSharedDefs();
const reg = new ArtRegistry();
await reg.loadMany(CATEGORIES);
const params = new URLSearchParams(location.search);
const allColors = params.has('cores');
const itemsEl = document.getElementById('items')!;
for (const item of ITEMS) {
  const colors = allColors ? COLOR_VARIANTS : [item.defaultColor];
  for (const c of colors) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `${reg.svg(item.art, c) ?? '??'}<p>${item.name} · ${c}</p>`;
    itemsEl.append(card);
  }
}
const roomsEl = document.getElementById('rooms')!;
const ids = sequentialIds();
const variants: Room[] = [];
const quarto = createRoom('quarto', ids, 0);
for (const floorPattern of [
  'madeira-clara',
  'madeira-rosa',
  'xadrez',
  'marmore',
  'carpete',
  'ladrilho',
] as const) {
  const wallPattern = (
    ['listras', 'bolinhas', 'coracoes', 'losangos', 'floral', 'damasco'] as const
  )[variants.length % 6]!;
  variants.push({
    ...quarto,
    decor: { kind: 'interior', wallColor: 'rosa', wallPattern, floorColor: 'lilas', floorPattern },
  });
}
const fachada = createRoom('fachada', ids, 0);
variants.push(
  fachada,
  {
    ...fachada,
    ambience: 'entardecer',
    decor: { ...fachada.decor, ground: 'pedras' } as Room['decor'],
  },
  { ...fachada, ambience: 'noite', decor: { ...fachada.decor, ground: 'flores' } as Room['decor'] },
);
variants.push(createRoom('jardim', ids, 0));
for (const r of variants) {
  const d = document.createElement('div');
  d.innerHTML = roomBackgroundSvg(r);
  roomsEl.append(d);
}
document.body.dataset['ready'] = '1';
