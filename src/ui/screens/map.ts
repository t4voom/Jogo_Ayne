import { getItem } from '../../catalog/items';
import { CATEGORIES, type RoomId } from '../../core/model';
import { ROOMS, createRoom, roomInfo } from '../../core/rooms';
import { composeRoomSvg } from '../../render/compose';
import type { GameContext } from '../context';
import { h, icon, iconButton } from '../dom';
import type { Screen } from '../router';
import { createSyncIndicator } from '../sync-indicator';
import '../styles/map.css';

/** Ordem dos andares no corte do castelo (de cima para baixo). */
const FLOORS: readonly (readonly RoomId[])[] = [
  ['quarto', 'closet'],
  ['trono', 'baile'],
  ['cozinha', 'banheiro'],
];

export async function createMapScreen(ctx: GameContext): Promise<Screen> {
  await ctx.art.loadMany(CATEGORIES);

  const roomCard = (roomId: RoomId, variant: 'inside' | 'outside') => {
    const info = roomInfo(roomId);
    const unlocked = ctx.isRoomUnlocked(roomId);
    const room = ctx.store.getRoom(roomId) ?? createRoom(roomId, () => 'preview', 0);
    const thumb = h('div', {
      class: 'map-thumb',
      html: composeRoomSvg(room, ctx.art, getItem),
    });
    const card = h(
      'button',
      {
        class: `map-room map-room-${variant} ${unlocked ? '' : 'is-locked'}`.trim(),
        dataset: { room: roomId },
        attrs: {
          type: 'button',
          'aria-label': unlocked
            ? `Abrir ${info.name}`
            : `${info.name} — bloqueado, precisa de ${info.cost} estrelinhas`,
        },
        on: {
          click: () => {
            if (unlocked) {
              ctx.haptics.play('light');
              void ctx.router.go({ name: 'room', roomId });
            } else {
              ctx.haptics.play('medium');
              card.classList.remove('is-shaking');
              void card.getBoundingClientRect();
              card.classList.add('is-shaking');
              ctx.toast.show(`Faltam ${info.cost} estrelinhas para abrir ${info.name} ⭐`, {
                icon: 'lock',
              });
            }
          },
        },
      },
      h('span', { class: 'map-frame' }, thumb),
      unlocked
        ? null
        : h(
            'span',
            { class: 'map-lock' },
            icon('lock'),
            h(
              'span',
              { class: 'map-lock-cost' },
              icon('starFill', 'icon map-star'),
              String(info.cost),
            ),
          ),
      h(
        'span',
        { class: 'map-plate' },
        h('span', { class: 'map-emoji', text: info.emoji }),
        info.name,
      ),
    );
    return card;
  };

  const sync = createSyncIndicator(ctx.cloud);
  const header = h(
    'header',
    { class: 'map-top' },
    iconButton('back', 'Voltar para a abertura', () => {
      void ctx.router.go({ name: 'opening' });
    }),
    h('h1', { class: 'map-title title-display', text: 'Meu Castelo' }),
    h(
      'div',
      { class: 'map-top-actions' },
      sync.el,
      iconButton('gear', 'Configurações', () => {
        void ctx.router.go({ name: 'settings' });
      }),
    ),
  );

  const castle = h(
    'div',
    { class: 'map-castle' },
    h(
      'div',
      { class: 'map-roofs', attrs: { 'aria-hidden': 'true' } },
      h('span', { class: 'map-roof map-roof-l' }),
      h('span', { class: 'map-roof map-roof-c' }),
      h('span', { class: 'map-roof map-roof-r' }),
    ),
    h(
      'div',
      { class: 'map-body' },
      ...FLOORS.map((floor) =>
        h('div', { class: 'map-floor' }, ...floor.map((id) => roomCard(id, 'inside'))),
      ),
    ),
  );

  const outside = (id: RoomId) => h('div', { class: 'map-outside' }, roomCard(id, 'outside'));

  const scroller = h(
    'div',
    { class: 'map-scroll' },
    outside('fachada'),
    castle,
    outside('jardim'),
    h('p', {
      class: 'map-hint',
      text: `${ROOMS.filter((r) => ctx.isRoomUnlocked(r.id)).length} de ${ROOMS.length} cômodos abertos`,
    }),
  );

  const el = h('div', { class: 'map-screen' }, header, scroller);
  return {
    el,
    destroy() {
      sync.destroy();
      el.remove();
    },
  };
}
