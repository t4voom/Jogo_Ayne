import { getItem } from '../../catalog/items';
import { CATEGORIES, type RoomId } from '../../core/model';
import { ROOMS, createRoom, roomInfo } from '../../core/rooms';
import { composeRoomSvg } from '../../render/compose';
import type { GameContext } from '../context';
import { h, icon, iconButton } from '../dom';
import type { Screen } from '../router';
import { confetti } from '../../fx/confetti';
import { openDailyGift } from '../daily-gift';
import { confirmSheet } from '../sheet';
import { createStarsPill } from '../stars-pill';
import { createSyncIndicator } from '../sync-indicator';
import '../styles/map.css';
import '../styles/progression.css';

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
            } else if (ctx.progression.stars >= info.cost) {
              void confirmSheet({
                title: `Abrir ${info.name}?`,
                message: `Usar ${info.cost} estrelinhas para abrir este cômodo. Você tem ${ctx.progression.stars} ⭐`,
                confirm: `Abrir por ${info.cost} ⭐`,
              }).then((ok) => {
                if (!ok || !ctx.progression.unlockRoom(roomId)) return;
                ctx.haptics.play('success');
                confetti();
                card.classList.add('is-unlocking');
                window.setTimeout(() => {
                  void ctx.router.go({ name: 'room', roomId });
                }, 900);
              });
            } else {
              ctx.haptics.play('medium');
              card.classList.remove('is-shaking');
              void card.getBoundingClientRect();
              card.classList.add('is-shaking');
              const missing = info.cost - ctx.progression.stars;
              ctx.toast.show(`Faltam ${missing} estrelinhas para abrir ${info.name} ⭐`, {
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
  const pill = createStarsPill(ctx.store, ctx.progression, () => {
    void ctx.router.go({ name: 'achievements' });
  });
  const gift = iconButton(
    'gift',
    'Presente do dia',
    () => {
      if (ctx.progression.dailyAvailable) {
        openDailyGift(ctx.progression, refreshGift);
      } else {
        ctx.toast.show('O baú de hoje já foi aberto. Volte amanhã para outro presente! 🎁', {
          icon: 'gift',
        });
      }
    },
    { className: 'gift-btn' },
  );
  const refreshGift = () => {
    gift.classList.toggle('is-available', ctx.progression.dailyAvailable);
  };
  refreshGift();
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
      pill.el,
      gift,
      iconButton('trophy', 'Conquistas e missões', () => {
        void ctx.router.go({ name: 'achievements' });
      }),
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
      pill.destroy();
      el.remove();
    },
  };
}
