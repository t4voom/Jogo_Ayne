import type { ArtRegistry } from '../art/registry';
import { roomBackgroundSvg } from '../art/rooms';
import type { CatalogItem } from '../catalog/types';
import type { PlacedItem, Room } from '../core/model';
import { createLogger } from '../core/log';
import { lightOf } from './lights';
import './stage.css';

const log = createLogger('stage');

/** Transformação transitória aplicada durante um gesto (não vai para o estado). */
export interface GesturePreview {
  /** Deslocamento do centro, em % do palco. */
  readonly dx: number;
  readonly dy: number;
  /** Fator de escala sobre a largura salva. */
  readonly scale: number;
  /** Rotação absoluta (graus). */
  readonly rot: number;
}

export interface Guide {
  readonly axis: 'x' | 'y';
  /** Posição em % do palco. */
  readonly at: number;
}

export interface StageDeps {
  readonly art: ArtRegistry;
  readonly getItem: (id: string) => CatalogItem | undefined;
}

interface ItemNode {
  readonly el: HTMLDivElement;
  readonly artEl: HTMLDivElement;
  item: PlacedItem;
  svgKey: string;
  leaving: boolean;
}

const LEAVE_MS = 320;

/**
 * Palco do cômodo. Reage ao estado (`render(room)`) fazendo um diff por id:
 * só toca no DOM do que mudou. Durante gestos, `preview()` altera APENAS o
 * `transform` do elemento (camada de composição, 60 fps); o estado só é
 * gravado ao soltar.
 */
export class StageView {
  readonly el: HTMLDivElement;
  private readonly bgEl: HTMLDivElement;
  private readonly itemsEl: HTMLDivElement;
  private readonly tintEl: HTMLDivElement;
  private readonly lightsEl: HTMLDivElement;
  private lightsKey = '';
  private readonly overlayEl: HTMLDivElement;
  private readonly selectionEl: HTMLDivElement;
  private readonly guidesEl: HTMLDivElement;
  private readonly nodes = new Map<string, ItemNode>();
  private room: Room | null = null;
  private bgKey = '';
  private selected: string | null = null;
  private previewing: { uid: string; preview: GesturePreview } | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private size = 0;

  constructor(private readonly deps: StageDeps) {
    this.el = div('stage');
    this.el.setAttribute('role', 'img');
    this.bgEl = div('stage-bg');
    this.itemsEl = div('stage-items');
    this.tintEl = div('stage-tint');
    this.lightsEl = div('stage-lights');
    this.overlayEl = div('stage-overlay');
    this.selectionEl = div('stage-selection');
    this.selectionEl.innerHTML =
      '<span class="stage-handle" data-handle="transform" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    this.guidesEl = div('stage-guides');
    this.overlayEl.append(this.guidesEl, this.selectionEl);
    this.el.append(this.bgEl, this.itemsEl, this.tintEl, this.lightsEl, this.overlayEl);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.size = this.el.clientWidth;
        this.updateSelectionFrame();
      });
      this.resizeObserver.observe(this.el);
    }
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.el.remove();
  }

  /** Lado do palco em px. */
  get pixelSize(): number {
    if (this.size === 0) this.size = this.el.clientWidth;
    return this.size;
  }

  getRoom(): Room | null {
    return this.room;
  }

  // ---------------------------------------------------------------- render

  render(room: Room, options: { animate?: boolean } = {}): void {
    const animate = options.animate ?? true;
    const prev = this.room;
    this.room = room;
    this.el.setAttribute('aria-label', `Cômodo com ${room.items.length} itens`);
    this.el.dataset['ambience'] = room.ambience;
    this.el.dataset['kind'] = room.decor.kind;

    const bgKey = `${room.id}|${JSON.stringify(room.decor)}|${room.ambience}`;
    if (bgKey !== this.bgKey) {
      this.bgKey = bgKey;
      this.bgEl.innerHTML = roomBackgroundSvg(room);
    }
    this.renderLights(room);
    if (prev?.items === room.items && prev.id === room.id) return;

    const alive = new Set<string>();
    room.items.forEach((item, index) => {
      alive.add(item.uid);
      let node = this.nodes.get(item.uid);
      if (!node || node.leaving) {
        if (node?.leaving) node.el.remove();
        node = this.createNode(item);
        this.nodes.set(item.uid, node);
        this.itemsEl.append(node.el);
        if (animate && prev?.id === room.id) this.playEnter(node);
      } else if (node.item !== item) {
        this.updateNode(node, item);
      }
      node.el.style.zIndex = String(index + 1);
    });
    for (const [uid, node] of this.nodes) {
      if (!alive.has(uid) && !node.leaving)
        this.removeNode(uid, node, animate && prev?.id === room.id);
    }
    this.updateSelectionFrame();
  }

  /** Brilhos dos itens que acendem (visíveis à noite/entardecer via CSS). */
  private renderLights(room: Room): void {
    const spots = room.items
      .map((item) => {
        const catalog = this.deps.getItem(item.itemId);
        const art = catalog ? this.deps.art.get(catalog.art) : undefined;
        return art && catalog ? lightOf(item, art, catalog.anim.includes('flicker')) : null;
      })
      .filter((s) => s !== null);
    const key = JSON.stringify(spots);
    if (key === this.lightsKey) return;
    this.lightsKey = key;
    this.lightsEl.replaceChildren(
      ...spots.map((s) => {
        const el = div(`stage-light${s.flicker ? ' is-flicker' : ''}`);
        el.style.left = `${s.x}%`;
        el.style.top = `${s.y}%`;
        el.style.width = `${s.r * 2}%`;
        return el;
      }),
    );
  }

  private createNode(item: PlacedItem): ItemNode {
    const el = div('item');
    el.dataset['uid'] = item.uid;
    el.dataset['itemId'] = item.itemId;
    const artEl = div('item-art');
    el.append(artEl);
    const node: ItemNode = { el, artEl, item, svgKey: '', leaving: false };
    this.applyItem(node, item);
    return node;
  }

  private updateNode(node: ItemNode, item: PlacedItem): void {
    node.item = item;
    this.applyItem(node, item);
  }

  private applyItem(node: ItemNode, item: PlacedItem): void {
    const catalog = this.deps.getItem(item.itemId);
    const art = catalog ? this.deps.art.get(catalog.art) : undefined;
    const s = node.el.style;
    s.left = `${item.x}%`;
    s.top = `${item.y}%`;
    s.width = `${item.w}%`;
    s.aspectRatio = art ? `${art.w} / ${art.h}` : '1 / 1';
    if (this.previewing?.uid !== item.uid) s.transform = baseTransform(item.rot, item.flip, 1);
    node.el.classList.toggle('is-locked', item.locked);
    node.el.setAttribute('aria-label', catalog?.name ?? item.itemId);
    if (catalog?.anim.length) node.el.dataset['anim'] = catalog.anim.join(' ');

    const key = `${catalog?.art ?? '?'}|${item.color}|${art ? 1 : 0}`;
    if (key !== node.svgKey) {
      node.svgKey = key;
      if (catalog && art) {
        node.artEl.innerHTML = this.deps.art.svg(catalog.art, item.color) ?? '';
        node.el.classList.remove('is-loading');
      } else {
        node.artEl.innerHTML = '';
        node.el.classList.add('is-loading');
        if (catalog) {
          this.deps.art
            .load(catalog.category)
            .then(() => {
              const current = this.nodes.get(item.uid);
              if (current && !current.leaving) this.applyItem(current, current.item);
              if (this.room) {
                this.lightsKey = '';
                this.renderLights(this.room);
              }
            })
            .catch((error: unknown) => {
              log.error(`Sem arte para ${item.itemId}`, error);
            });
        } else {
          log.warn(`Item fora do catálogo no cômodo: ${item.itemId}`);
        }
      }
    }
  }

  private removeNode(uid: string, node: ItemNode, animate: boolean): void {
    if (!animate || prefersReducedMotion()) {
      node.el.remove();
      this.nodes.delete(uid);
      return;
    }
    node.leaving = true;
    node.el.classList.add('is-leaving');
    window.setTimeout(() => {
      if (this.nodes.get(uid) === node) this.nodes.delete(uid);
      node.el.remove();
    }, LEAVE_MS);
  }

  private playEnter(node: ItemNode): void {
    node.el.classList.remove('is-entering');
    void node.el.getBoundingClientRect(); // reinicia a animação
    node.el.classList.add('is-entering');
    window.setTimeout(() => node.el.classList.remove('is-entering'), 600);
  }

  /** Pequeno "balanço" de recusa (ex.: item travado). */
  wiggle(uid: string): void {
    const node = this.nodes.get(uid);
    if (!node) return;
    node.el.classList.remove('is-wiggling');
    void node.el.getBoundingClientRect();
    node.el.classList.add('is-wiggling');
    window.setTimeout(() => node.el.classList.remove('is-wiggling'), 500);
  }

  // ------------------------------------------------------------- seleção

  select(uid: string | null): void {
    if (this.selected === uid) return;
    if (this.selected) this.nodes.get(this.selected)?.el.classList.remove('is-selected');
    this.selected = uid;
    if (uid) this.nodes.get(uid)?.el.classList.add('is-selected');
    this.updateSelectionFrame();
  }

  get selectedUid(): string | null {
    return this.selected;
  }

  private updateSelectionFrame(): void {
    const uid = this.selected;
    const node = uid ? this.nodes.get(uid) : undefined;
    const frame = this.selectionEl;
    if (!node || node.leaving) {
      frame.classList.remove('is-visible');
      return;
    }
    const geom = this.geometry(
      node.item,
      this.previewing?.uid === uid ? this.previewing.preview : null,
    );
    if (!geom) return;
    const pad = 8;
    frame.classList.add('is-visible');
    frame.classList.toggle('is-locked', node.item.locked);
    const st = frame.style;
    st.width = `${geom.w + pad * 2}px`;
    st.height = `${geom.h + pad * 2}px`;
    st.transform = `translate(${geom.cx - geom.w / 2 - pad}px, ${geom.cy - geom.h / 2 - pad}px) rotate(${geom.rot}deg)`;
  }

  /** Geometria em px de um item (com prévia de gesto, se houver). */
  geometry(
    item: PlacedItem,
    preview: GesturePreview | null = null,
  ): { cx: number; cy: number; w: number; h: number; rot: number } | null {
    const size = this.pixelSize;
    if (size === 0) return null;
    const aspect = this.aspectOf(item.itemId);
    const scale = preview?.scale ?? 1;
    const w = (item.w / 100) * size * scale;
    return {
      cx: ((item.x + (preview?.dx ?? 0)) / 100) * size,
      cy: ((item.y + (preview?.dy ?? 0)) / 100) * size,
      w,
      h: w * aspect,
      rot: preview?.rot ?? item.rot,
    };
  }

  /** Altura/largura da arte de um item. */
  aspectOf(itemId: string): number {
    const catalog = this.deps.getItem(itemId);
    const art = catalog ? this.deps.art.get(catalog.art) : undefined;
    return art ? art.h / art.w : 1;
  }

  // ------------------------------------------------------------- gestos

  beginPreview(uid: string): void {
    const node = this.nodes.get(uid);
    if (!node) return;
    node.el.classList.add('is-dragging');
    this.previewing = { uid, preview: { dx: 0, dy: 0, scale: 1, rot: node.item.rot } };
  }

  /** Só `transform`: nenhum layout, nenhum re-render. */
  preview(uid: string, preview: GesturePreview): void {
    const node = this.nodes.get(uid);
    if (!node) return;
    this.previewing = { uid, preview };
    const size = this.pixelSize;
    node.el.style.transform = `translate3d(${(preview.dx / 100) * size}px, ${(preview.dy / 100) * size}px, 0) ${baseTransform(preview.rot, node.item.flip, preview.scale)}`;
    this.updateSelectionFrame();
  }

  endPreview(uid: string): void {
    const node = this.nodes.get(uid);
    this.previewing = null;
    // Item saindo (lixeira): mantém onde está para a animação de "puf".
    if (!node || node.leaving) return;
    node.el.classList.remove('is-dragging');
    node.el.style.transform = baseTransform(node.item.rot, node.item.flip, 1);
    this.updateSelectionFrame();
  }

  setDropTarget(uid: string, deleting: boolean): void {
    this.nodes.get(uid)?.el.classList.toggle('is-trash-hover', deleting);
  }

  showGuides(guides: readonly Guide[]): void {
    const html = guides
      .map((g) =>
        g.axis === 'x'
          ? `<span class="guide guide-x" style="left:${g.at}%"></span>`
          : `<span class="guide guide-y" style="top:${g.at}%"></span>`,
      )
      .join('');
    if (this.guidesEl.innerHTML !== html) this.guidesEl.innerHTML = html;
  }

  // --------------------------------------------------------- coordenadas

  /** Converte um ponto da tela em % do palco. */
  toStage(clientX: number, clientY: number): { x: number; y: number } {
    const r = this.el.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * 100,
      y: ((clientY - r.top) / r.height) * 100,
    };
  }

  /** O item sob o ponto: primeiro pelo desenho, depois pela caixa (dedos!). */
  hitTest(clientX: number, clientY: number, slopPx = 14): string | null {
    for (const el of document.elementsFromPoint(clientX, clientY)) {
      const itemEl = el.closest<HTMLElement>('.item');
      if (itemEl && this.itemsEl.contains(itemEl)) {
        const uid = itemEl.dataset['uid'];
        const node = uid ? this.nodes.get(uid) : undefined;
        if (uid && node && !node.leaving) return uid;
      }
      if (el === this.el) break;
    }
    // Fallback: menor item cuja caixa (com folga) contém o ponto.
    const p = this.toStage(clientX, clientY);
    const size = this.pixelSize || 1;
    const slop = (slopPx / size) * 100;
    let best: { uid: string; area: number; z: number } | null = null;
    const items = this.room?.items ?? [];
    items.forEach((item, z) => {
      const aspect = this.aspectOf(item.itemId);
      const hw = item.w / 2 + slop;
      const hh = (item.w * aspect) / 2 + slop;
      if (Math.abs(p.x - item.x) <= hw && Math.abs(p.y - item.y) <= hh) {
        const area = item.w * item.w * aspect;
        if (!best || area < best.area || (area === best.area && z > best.z))
          best = { uid: item.uid, area, z };
      }
    });
    return (best as { uid: string } | null)?.uid ?? null;
  }

  isOnHandle(target: EventTarget | null): boolean {
    return target instanceof Element && target.closest('[data-handle="transform"]') !== null;
  }
}

function baseTransform(rot: number, flip: boolean, scale: number): string {
  const s = scale === 1 ? '' : ` scale(${scale.toFixed(4)})`;
  return `translate(-50%, -50%) rotate(${rot}deg)${s}${flip ? ' scaleX(-1)' : ''}`;
}

function div(className: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = className;
  return el;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
