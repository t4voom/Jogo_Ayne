import { floorLine } from '../../art/rooms';
import { getItem } from '../../catalog/items';
import { defaultPosition } from '../../catalog/placement';
import type { CatalogItem } from '../../catalog/types';
import type { PlacedItem, Room, RoomId } from '../../core/model';
import { clamp, findItem } from '../../core/rules';
import { createLogger } from '../../core/log';
import { roomInfo } from '../../core/rooms';
import { poof, sparkleBurst } from '../../fx/sparkles';
import { StageGestures } from '../../input/stage-gestures';
import { StageView } from '../../render/stage';
import type { StoreEvent } from '../../state/store';
import type { GameContext } from '../context';
import { h, icon, iconButton } from '../dom';
import { CatalogDrawer } from '../room/catalog-drawer';
import { ItemToolbar, type ItemCommands } from '../room/item-toolbar';
import { openQuickMenu } from '../room/quick-menu';
import type { Screen } from '../router';
import { confirmSheet } from '../sheet';
import { createStarsPill } from '../stars-pill';
import { createSyncIndicator } from '../sync-indicator';
import '../styles/progression.css';
import '../styles/album.css';
import '../styles/room.css';

const photoLog = createLogger('foto');

export async function createRoomScreen(ctx: GameContext, roomId: RoomId): Promise<Screen> {
  const info = roomInfo(roomId);
  const initial = ctx.ensureRoom(roomId);
  // Carrega a arte dos itens já colocados antes do primeiro desenho.
  await ctx.art.loadMany(
    initial.items.map((i) => getItem(i.itemId)?.category).filter((c) => c !== undefined),
  );

  const room = (): Room => ctx.store.getRoom(roomId) ?? initial;
  const stage = new StageView({ art: ctx.art, getItem });
  const cleanups: (() => void)[] = [];
  let closeMenu: (() => void) | null = null;

  // ---------------------------------------------------------------- topo
  const undoBtn = iconButton('undo', 'Desfazer', () => {
    ctx.store.undo(roomId);
    ctx.haptics.play('light');
    ctx.sound.play('tick');
  });
  const redoBtn = iconButton('redo', 'Refazer', () => {
    ctx.store.redo(roomId);
    ctx.haptics.play('light');
    ctx.sound.play('tick');
  });
  const sync = createSyncIndicator(ctx.cloud, ctx.saveNow);
  cleanups.push(sync.destroy);
  const syncSlot = h('div', { class: 'room-sync-slot' }, sync.el);
  const pill = createStarsPill(ctx.store, ctx.progression);
  cleanups.push(pill.destroy);
  const top = h(
    'header',
    { class: 'room-top' },
    iconButton('map', 'Voltar ao mapa do castelo', () => {
      // O botão do mapa sempre vai ao mapa (o "voltar" do sistema é que
      // primeiro só tira a seleção).
      ctx.store.select(null);
      ctx.router.back({ name: 'map' });
    }),
    h(
      'h1',
      { class: 'room-title' },
      h('span', { class: 'room-emoji', text: info.emoji }),
      h('span', { class: 'room-name', text: info.name }),
    ),
    syncSlot,
    h(
      'div',
      { class: 'room-actions' },
      pill.el,
      undoBtn,
      redoBtn,
      iconButton('camera', 'Tirar foto do cômodo', () => {
        void takePhoto();
      }),
      iconButton('eye', 'Modo ver: esconder os botões', () => setViewing(true)),
    ),
  );

  // ------------------------------------------------------------- palco
  const trash = h('div', { class: 'room-trash', attrs: { 'aria-hidden': 'true' } }, icon('trash'));
  const stageWrap = h('div', { class: 'room-stage-wrap' }, stage.el);

  const selectedItem = (): PlacedItem | undefined => {
    const sel = ctx.store.getState().selection;
    return sel?.roomId === roomId ? findItem(room(), sel.uid) : undefined;
  };

  const screenPoint = (item: PlacedItem) => {
    const r = stage.el.getBoundingClientRect();
    return { x: r.left + (item.x / 100) * r.width, y: r.top + (item.y / 100) * r.height };
  };

  const commands: ItemCommands = {
    grow: () => withSel((uid) => ctx.actions.scale(roomId, uid, 1)),
    shrink: () => withSel((uid) => ctx.actions.scale(roomId, uid, -1)),
    flip: () => withSel((uid) => ctx.actions.flip(roomId, uid)),
    front: () => withSel((uid) => ctx.actions.reorder(roomId, uid, 'front')),
    back: () => withSel((uid) => ctx.actions.reorder(roomId, uid, 'back')),
    duplicate: () =>
      withSel((uid) => {
        const copy = ctx.actions.duplicate(roomId, uid);
        if (copy) {
          ctx.store.select({ roomId, uid: copy.uid });
          const p = screenPoint(copy);
          sparkleBurst(p.x, p.y, { count: 8, spread: 50 });
        }
        return copy !== null;
      }),
    setColor: (color) =>
      withSel((uid) => {
        const ok = ctx.actions.setColor(roomId, uid, color);
        const item = selectedItem();
        if (ok && item) {
          const p = screenPoint(item);
          sparkleBurst(p.x, p.y, { count: 10, spread: 60 });
          ctx.sound.play('sparkle');
        }
        return ok;
      }),
    toggleLock: () => withSel((uid) => ctx.actions.toggleLock(roomId, uid)),
    remove: () => withSel((uid) => deleteItem(uid)),
  };

  function withSel(run: (uid: string) => boolean): void {
    const item = selectedItem();
    if (!item) return;
    if (run(item.uid)) ctx.haptics.play('light');
  }

  function deleteItem(uid: string): boolean {
    const item = findItem(room(), uid);
    if (!item) return false;
    const p = screenPoint(item);
    const ok = ctx.actions.remove(roomId, uid);
    if (ok) {
      poof(p.x, p.y);
      ctx.sound.play('whoosh');
      ctx.toast.show('Item guardado de volta no baú', {
        icon: 'trash',
        action: {
          label: 'Desfazer',
          run: () => {
            ctx.store.undo(roomId);
          },
        },
      });
    }
    return ok;
  }

  const toolbar = new ItemToolbar(commands);

  // --------------------------------------------------------- adicionar
  const backIndex = (r: Room): number => {
    let i = 0;
    while (i < r.items.length && getItem(r.items[i]?.itemId ?? '')?.behind) i++;
    return i;
  };

  function addItem(item: CatalogItem, at?: { x: number; y: number }): void {
    const r = room();
    const art = ctx.art.get(item.art);
    const aspect = art ? art.h / art.w : 1;
    const pos =
      at ??
      defaultPosition({
        placement: item.placement,
        width: item.width,
        aspect,
        floorLine: floorLine(r),
        existing: r.items,
      });
    const placed = ctx.actions.add(
      roomId,
      {
        itemId: item.id,
        x: clamp(pos.x, 0, 100),
        y: clamp(pos.y, 0, 100),
        w: item.width,
        rot: 0,
        flip: false,
        color: item.defaultColor,
        locked: false,
      },
      item.behind ? backIndex(r) : undefined,
    );
    if (!placed) {
      ctx.toast.show('Este cômodo já está cheinho! Que tal guardar algum item? 💕', {
        icon: 'info',
      });
      return;
    }
    ctx.store.select({ roomId, uid: placed.uid });
    ctx.haptics.play('light');
    ctx.sound.play('pop');
    const p = screenPoint(placed);
    sparkleBurst(p.x, p.y);
  }

  const drawer = new CatalogDrawer({
    ctx,
    getRoom: room,
    onPick: (item) => {
      addItem(item);
    },
    onDrop: (item, x, y) => {
      if (!isOverStage(x, y)) return false;
      addItem(item, stage.toStage(x, y));
      return true;
    },
    isOverStage,
    ghostWidth: (item) => (item.width / 100) * stage.pixelSize,
    isUnlocked: (item) => ctx.progression.isItemUnlocked(item),
    onLockedPick: (item) => {
      const have = ctx.progression.stars;
      if (have < item.cost) {
        ctx.toast.show(
          `${item.name} abre com ${item.cost} ⭐ — faltam ${item.cost - have}. Missões e o presente do dia dão estrelinhas!`,
          { icon: 'lock' },
        );
        return;
      }
      void confirmSheet({
        title: `Liberar ${item.name}?`,
        message: `Usar ${item.cost} estrelinhas. Você tem ${have} ⭐`,
        confirm: `Liberar por ${item.cost} ⭐`,
      }).then((ok) => {
        if (!ok || !ctx.progression.unlockItem(item)) return;
        ctx.haptics.play('success');
        ctx.sound.play('unlock');
        drawer.refreshItems();
        addItem(item);
      });
    },
    onPaint: (patch) => {
      if (ctx.actions.paint(roomId, patch)) {
        ctx.haptics.play('light');
        ctx.sound.play('swish');
      }
    },
    onAmbience: (a) => {
      if (ctx.actions.setAmbience(roomId, a)) {
        ctx.haptics.play('light');
        ctx.sound.play(a === 'noite' ? 'bell' : 'swish');
      }
    },
  });

  function isOverStage(x: number, y: number): boolean {
    const r = stage.el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  // --------------------------------------------------------------- foto
  let shooting = false;
  async function takePhoto(): Promise<void> {
    if (shooting) return;
    shooting = true;
    ctx.store.select(null);
    document.body.append(h('div', { class: 'camera-flash', attrs: { 'aria-hidden': 'true' } }));
    window.setTimeout(() => document.querySelector('.camera-flash')?.remove(), 700);
    ctx.sound.play('shutter');
    ctx.haptics.play('medium');
    try {
      const { capturePhoto } = await import('../../render/photo');
      const shot = await capturePhoto(room(), info.name, ctx.art, getItem, new Date());
      const id = ctx.newId();
      await ctx.photos.save({
        id,
        roomId,
        createdAt: Date.now(),
        image: shot.image,
        thumbnail: shot.thumbnail,
      });
      ctx.cloud.engine.markPhotoDirty(id);
      ctx.progression.count('photos');
      ctx.toast.show('Foto guardada no álbum 📸', {
        icon: 'camera',
        tone: 'love',
        action: {
          label: 'Ver',
          run: () => {
            void ctx.router.go({ name: 'album' });
          },
        },
      });
    } catch (error) {
      ctx.toast.show('Não consegui tirar a foto agora 😢', { tone: 'warn' });
      photoLog.error('Falha ao tirar a foto', error);
    } finally {
      shooting = false;
    }
  }

  // ------------------------------------------------------------- gestos
  const gestures = new StageGestures(stage, () => room(), {
    select: (uid) => {
      ctx.store.select(uid ? { roomId, uid } : null);
    },
    commit: (uid, before, after) => {
      ctx.actions.commitGesture(roomId, uid, before, after);
    },
    remove: (uid) => {
      deleteItem(uid);
    },
    longPress: (uid, x, y) => {
      const item = findItem(room(), uid);
      if (!item) return;
      closeMenu?.();
      closeMenu = openQuickMenu(el, item, x, y, commands, () => {
        toolbar.show(item, getItem(item.itemId));
        el.querySelector<HTMLButtonElement>('.tool-btn[aria-label="Cor"]')?.click();
      });
    },
    lockedTouch: () => {
      ctx.sound.play('error');
      ctx.toast.show('Este item está travadinho 🔒 Toque em “Destravar” para mexer.', {
        icon: 'lock',
      });
    },
    dragState: (state) => {
      el.classList.toggle('is-dragging', state !== null);
      trash.classList.toggle('is-hot', state?.overTrash ?? false);
    },
    trashRect: () => (el.classList.contains('is-dragging') ? trash.getBoundingClientRect() : null),
    snapEnabled: () => ctx.store.getState().profile.settings.snap,
    floorLine: (r) => (r.decor.kind === 'interior' ? floorLine(r) : undefined),
    haptic: (kind) => {
      ctx.haptics.play(kind);
    },
  });

  // -------------------------------------------------------- modo "Ver"
  const exitView = iconButton('close', 'Sair do modo ver', () => setViewing(false), {
    className: 'room-exit-view',
  });
  function setViewing(on: boolean): void {
    el.classList.toggle('is-viewing', on);
    if (on) {
      ctx.store.select(null);
      exitView.focus({ preventScroll: true });
    }
  }

  // --------------------------------------------------------------- tela
  const el = h(
    'div',
    { class: 'room-screen', dataset: { room: roomId } },
    top,
    h('main', { class: 'room-main' }, stageWrap, trash, toolbar.el),
    drawer.el,
    exitView,
  );

  // ------------------------------------------------- reação ao estado
  const syncSelection = () => {
    const item = selectedItem();
    stage.select(item?.uid ?? null);
    if (item) {
      toolbar.show(item, getItem(item.itemId));
      // Item na metade de baixo: a barra vai para cima para não cobri-lo.
      toolbar.el.classList.toggle('at-top', item.y > 56);
    } else {
      toolbar.hide();
    }
  };
  const syncHistory = () => {
    undoBtn.disabled = !ctx.store.canUndo(roomId);
    redoBtn.disabled = !ctx.store.canRedo(roomId);
  };

  cleanups.push(
    ctx.store.subscribe((event: StoreEvent) => {
      if (event.type === 'room' && event.roomId === roomId) {
        stage.render(event.next, { animate: event.source !== 'load' });
        drawer.refresh();
        syncSelection();
      } else if (event.type === 'selection') {
        syncSelection();
      } else if (event.type === 'history' && event.roomId === roomId) {
        syncHistory();
      }
    }),
  );

  // ------------------------------------------------------------ teclado
  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const mod = e.ctrlKey || e.metaKey;
    const item = selectedItem();
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) ctx.store.redo(roomId);
      else ctx.store.undo(roomId);
      return;
    }
    if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      ctx.store.redo(roomId);
      return;
    }
    if (e.key === 'Escape') {
      if (el.classList.contains('is-viewing')) setViewing(false);
      else ctx.store.select(null);
      return;
    }
    if (!item) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteItem(item.uid);
      return;
    }
    const step = e.shiftKey ? 5 : 1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const mv = moves[e.key];
    if (mv) {
      e.preventDefault();
      ctx.actions.transform(roomId, item.uid, { x: item.x + mv[0], y: item.y + mv[1] }, 'move');
    } else if (e.key === '+' || e.key === '=') {
      ctx.actions.scale(roomId, item.uid, 1);
    } else if (e.key === '-') {
      ctx.actions.scale(roomId, item.uid, -1);
    }
  };
  document.addEventListener('keydown', onKey);
  cleanups.push(() => {
    document.removeEventListener('keydown', onKey);
  });

  return {
    el,
    mounted() {
      stage.render(room(), { animate: false });
      cleanups.push(gestures.attach());
      syncSelection();
      syncHistory();
      if (!ctx.store.getState().profile.tutorialDone) {
        window.setTimeout(() => {
          void import('../tutorial').then(({ runTutorial }) => {
            const stop = runTutorial(
              [
                {
                  text: `Oi, ${ctx.forAyne ? 'Princesa Ayne' : (ctx.playerName ?? 'Majestade')}! Eu sou a Fadinha Luz ✨ Toque num item do catálogo para ele aparecer no cômodo.`,
                  target: () => el.querySelector('.drawer-list'),
                },
                {
                  text: 'Arraste com um dedo para mudar o item de lugar. Para tirar, é só arrastar até a lixeira 🗑️',
                  target: () => stage.el,
                },
                {
                  text: 'Com dois dedos, faça pinça para aumentar, diminuir e até girar o item 🤏 Segurar o dedo num item abre um menu rapidinho.',
                  target: () => stage.el,
                },
                {
                  text: 'Na aba Pintar você troca a cor e o padrão da parede e do chão, e transforma o dia em noite 🎨🌙',
                  target: () => el.querySelector('[data-tab="pintar"]'),
                },
              ],
              {
                onFinish: () => {
                  ctx.store.updateProfile((p) => ({ ...p, tutorialDone: true }));
                },
              },
            );
            cleanups.push(stop);
          });
        }, 500);
      }
    },
    back() {
      if (closeMenu && document.querySelector('.quick-menu')) {
        closeMenu();
        closeMenu = null;
        return true;
      }
      if (el.classList.contains('is-viewing')) {
        setViewing(false);
        return true;
      }
      if (selectedItem()) {
        ctx.store.select(null);
        return true;
      }
      return false;
    },
    destroy() {
      for (const fn of cleanups) fn();
      closeMenu?.();
      ctx.store.select(null);
      drawer.destroy();
      stage.destroy();
      el.remove();
    },
  };
}
