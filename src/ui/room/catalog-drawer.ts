import { ITEMS, itemsByCategory, searchItems } from '../../catalog/items';
import type { CatalogItem } from '../../catalog/types';
import type { Category, Room } from '../../core/model';
import type { GameContext } from '../context';
import { h, icon } from '../dom';
import type { IconName } from '../icons';
import { PaintPanel, type PaintHandlers } from './paint-panel';

export type DrawerTab = Category | 'pintar';

const TABS: readonly { id: DrawerTab; label: string; icon: IconName }[] = [
  { id: 'moveis', label: 'Móveis', icon: 'sofa' },
  { id: 'decoracao', label: 'Decoração', icon: 'lamp' },
  { id: 'plantas', label: 'Plantas', icon: 'flowerIcon' },
  { id: 'bichinhos', label: 'Bichinhos', icon: 'paw' },
  { id: 'externos', label: 'Externos', icon: 'tree' },
  { id: 'pintar', label: 'Pintar', icon: 'brush' },
];

export interface DrawerOptions extends PaintHandlers {
  readonly ctx: GameContext;
  readonly getRoom: () => Room;
  readonly onPick: (item: CatalogItem) => void;
  /** Soltou um item arrastado do catálogo; devolve true se caiu no palco. */
  readonly onDrop: (item: CatalogItem, clientX: number, clientY: number) => boolean;
  readonly isOverStage: (clientX: number, clientY: number) => boolean;
  /** Largura (px) que o item terá no palco, para o "fantasma" do arrasto. */
  readonly ghostWidth: (item: CatalogItem) => number;
  readonly isUnlocked: (item: CatalogItem) => boolean;
  readonly onLockedPick: (item: CatalogItem) => void;
}

const DRAG_START = 12;

/**
 * Gaveta do catálogo: abas, busca e a lista de itens com rolagem suave.
 * Tocar num item = aparece no palco; arrastar para fora da gaveta = soltar
 * exatamente onde quiser.
 */
export class CatalogDrawer {
  readonly el: HTMLElement;
  private readonly list: HTMLDivElement;
  private readonly search: HTMLInputElement;
  private readonly tabButtons = new Map<DrawerTab, HTMLButtonElement>();
  private readonly paint: PaintPanel;
  private tab: DrawerTab;
  private collapsed = false;
  private readonly cleanup: (() => void)[] = [];

  constructor(private readonly o: DrawerOptions) {
    const room = o.getRoom();
    this.tab = room.decor.kind === 'exterior' ? 'externos' : 'moveis';
    this.paint = new PaintPanel(o);

    const tabs = h('div', {
      class: 'drawer-tabs',
      attrs: { role: 'tablist', 'aria-label': 'Catálogo' },
    });
    for (const t of TABS) {
      const b = h(
        'button',
        {
          class: 'drawer-tab',
          attrs: {
            type: 'button',
            role: 'tab',
            'aria-selected': 'false',
            'aria-controls': 'drawer-panel',
          },
          dataset: { tab: t.id },
          on: {
            click: () => {
              this.setTab(t.id);
            },
          },
        },
        icon(t.icon),
        h('span', { text: t.label }),
      );
      this.tabButtons.set(t.id, b);
      tabs.append(b);
    }

    this.search = h('input', {
      class: 'drawer-search-input',
      attrs: {
        type: 'search',
        placeholder: 'Buscar item…',
        'aria-label': 'Buscar item pelo nome',
        enterkeyhint: 'search',
        autocomplete: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
      },
      on: {
        input: () => {
          this.renderList();
        },
      },
    });

    const toggle = h(
      'button',
      {
        class: 'drawer-toggle',
        attrs: { type: 'button', 'aria-label': 'Recolher catálogo', 'aria-expanded': 'true' },
        on: {
          click: () => {
            this.setCollapsed(!this.collapsed);
          },
        },
      },
      h('span', { class: 'drawer-grip' }),
    );

    this.list = h('div', {
      id: 'drawer-panel',
      class: 'drawer-list',
      attrs: { role: 'tabpanel' },
    });

    const searchBox = h(
      'div',
      { class: 'drawer-search' },
      icon('search'),
      this.search,
      h(
        'button',
        {
          class: 'drawer-search-close',
          attrs: { type: 'button', 'aria-label': 'Fechar busca' },
          on: {
            click: () => {
              this.setSearching(false);
            },
          },
        },
        icon('close'),
      ),
    );
    const searchOpen = h(
      'button',
      {
        class: 'drawer-search-open',
        attrs: { type: 'button', 'aria-label': 'Buscar item pelo nome' },
        on: {
          click: () => {
            this.setSearching(true);
          },
        },
      },
      icon('search'),
    );
    this.el = h(
      'section',
      { class: 'drawer glass', attrs: { 'aria-label': 'Catálogo de itens' } },
      toggle,
      h('div', { class: 'drawer-head' }, tabs, searchOpen, searchBox),
      this.list,
    );
    this.setTab(this.tab);
  }

  destroy(): void {
    for (const fn of this.cleanup) fn();
    this.el.remove();
  }

  /** Atualiza o painel de pintura quando o cômodo muda (ex.: desfazer). */
  refresh(): void {
    if (this.tab === 'pintar' && !this.search.value) this.paint.update(this.o.getRoom());
  }

  /** Redesenha a lista (ex.: depois de liberar um item). */
  refreshItems(): void {
    this.renderList();
  }

  setSearching(on: boolean): void {
    this.el.classList.toggle('is-searching', on);
    if (on) {
      if (this.collapsed) this.setCollapsed(false);
      this.search.focus();
    } else {
      this.search.value = '';
      this.renderList();
    }
  }

  setCollapsed(collapsed: boolean): void {
    this.collapsed = collapsed;
    this.el.classList.toggle('is-collapsed', collapsed);
    const t = this.el.querySelector('.drawer-toggle');
    t?.setAttribute('aria-expanded', String(!collapsed));
    t?.setAttribute('aria-label', collapsed ? 'Abrir catálogo' : 'Recolher catálogo');
  }

  setTab(tab: DrawerTab): void {
    this.tab = tab;
    for (const [id, b] of this.tabButtons) {
      const on = id === tab;
      b.setAttribute('aria-selected', String(on));
      b.classList.toggle('is-active', on);
      if (on) b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
    if (this.collapsed) this.setCollapsed(false);
    this.search.value = '';
    this.el.classList.remove('is-searching');
    this.renderList();
  }

  private renderList(): void {
    const query = this.search.value.trim();
    this.list.scrollLeft = 0;
    this.list.scrollTop = 0;
    if (!query && this.tab === 'pintar') {
      this.list.classList.add('is-paint');
      this.list.replaceChildren(this.paint.el);
      this.paint.update(this.o.getRoom());
      return;
    }
    this.list.classList.remove('is-paint');
    // Sugeridos para este cômodo primeiro; depois os já liberados.
    const roomId = this.o.getRoom().id;
    const rank = (item: CatalogItem) =>
      (item.rooms.includes(roomId) ? 0 : 2) + (this.o.isUnlocked(item) ? 0 : 1);
    const items = (query ? searchItems(query, ITEMS) : itemsByCategory(this.tab as Category))
      .map((item, index) => ({ item, index }))
      .sort((a, b) => rank(a.item) - rank(b.item) || a.index - b.index)
      .map((x) => x.item);
    if (items.length === 0) {
      this.list.replaceChildren(
        h('p', {
          class: 'drawer-empty',
          text: `Nada encontrado para “${query}”. Tente outra palavra 💭`,
        }),
      );
      return;
    }
    const categories = new Set(items.map((i) => i.category));
    void this.o.ctx.art.loadMany(categories).then(() => {
      for (const card of this.list.querySelectorAll<HTMLElement>('.cat-card.is-loading')) {
        const item = ITEMS.find((i) => i.id === card.dataset['item']);
        if (item) this.fillThumb(card, item);
      }
    });
    this.list.replaceChildren(...items.map((item) => this.card(item)));
  }

  private card(item: CatalogItem): HTMLElement {
    const unlocked = this.o.isUnlocked(item);
    const thumb = h('span', { class: 'cat-thumb' });
    const card = h(
      'button',
      {
        class: `cat-card ${unlocked ? '' : 'is-locked'}`.trim(),
        dataset: { item: item.id },
        attrs: {
          type: 'button',
          'aria-label': unlocked
            ? `Adicionar ${item.name}`
            : `${item.name} (bloqueado: ${item.cost} estrelinhas)`,
        },
      },
      thumb,
      h('span', { class: 'cat-name', text: item.name }),
      unlocked
        ? null
        : h('span', { class: 'cat-cost' }, icon('starFill', 'icon cat-star'), String(item.cost)),
    );
    card.classList.add('is-loading');
    this.fillThumb(card, item);
    this.bindDrag(card, item, unlocked);
    return card;
  }

  private fillThumb(card: HTMLElement, item: CatalogItem): void {
    const svg = this.o.ctx.art.svg(item.art, item.defaultColor);
    if (!svg) return;
    const thumb = card.querySelector('.cat-thumb');
    if (thumb) thumb.innerHTML = svg;
    card.classList.remove('is-loading');
  }

  // --------------------------------------------- arrastar do catálogo

  private bindDrag(card: HTMLElement, item: CatalogItem, unlocked: boolean): void {
    let start: { x: number; y: number; id: number } | null = null;
    let ghost: HTMLElement | null = null;
    let dragged = false;

    const isSide = () => getComputedStyle(this.el).getPropertyValue('--drawer-side').trim() === '1';

    const moveGhost = (x: number, y: number) => {
      if (!ghost) return;
      const over = this.o.isOverStage(x, y);
      const w = over ? this.o.ghostWidth(item) : 84;
      ghost.style.width = `${w}px`;
      ghost.style.transform = `translate(${x - w / 2}px, ${y - w / 2}px)`;
      ghost.classList.toggle('is-over', over);
    };

    const end = (e: PointerEvent, cancelled: boolean) => {
      if (start?.id !== e.pointerId) return;
      start = null;
      if (ghost) {
        const g = ghost;
        ghost = null;
        const placed = !cancelled && this.o.onDrop(item, e.clientX, e.clientY);
        g.classList.add(placed ? 'is-dropped' : 'is-cancelled');
        window.setTimeout(() => g.remove(), placed ? 60 : 260);
      }
    };

    card.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      dragged = false;
    });
    card.addEventListener('pointermove', (e) => {
      if (start?.id !== e.pointerId) return;
      if (!ghost) {
        if (!unlocked) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        const towardStage = isSide()
          ? dx < -DRAG_START && Math.abs(dx) > Math.abs(dy)
          : dy < -DRAG_START && Math.abs(dy) > Math.abs(dx);
        if (!towardStage) return;
        dragged = true;
        try {
          card.setPointerCapture(e.pointerId);
        } catch {
          // sem captura o arrasto ainda funciona enquanto o dedo estiver no card
        }
        ghost = h('div', {
          class: 'drag-ghost',
          html: this.o.ctx.art.svg(item.art, item.defaultColor) ?? '',
        });
        document.body.append(ghost);
        this.o.ctx.haptics.play('light');
      }
      moveGhost(e.clientX, e.clientY);
    });
    card.addEventListener('pointerup', (e) => {
      end(e, false);
    });
    card.addEventListener('pointercancel', (e) => {
      end(e, true);
    });
    card.addEventListener('click', () => {
      if (dragged) {
        dragged = false;
        return;
      }
      if (unlocked) this.o.onPick(item);
      else this.o.onLockedPick(item);
    });
  }
}
