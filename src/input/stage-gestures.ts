import type { PlacedItem, Room } from '../core/model';
import { MAX_ITEM_WIDTH, MIN_ITEM_WIDTH, clamp, findItem, normalizeAngle } from '../core/rules';
import type { ItemPatch } from '../state/commands';
import type { GesturePreview, StageView } from '../render/stage';
import { snap, snapAngle, type Box } from './snap';

export type HapticKind = 'light' | 'medium' | 'success';

export interface GestureCallbacks {
  select(uid: string | null): void;
  commit(uid: string, before: ItemPatch, after: ItemPatch): void;
  remove(uid: string): void;
  longPress(uid: string, clientX: number, clientY: number): void;
  lockedTouch(uid: string): void;
  dragState(state: { uid: string; overTrash: boolean } | null): void;
  trashRect(): DOMRect | null;
  snapEnabled(): boolean;
  floorLine(room: Room): number | undefined;
  haptic(kind: HapticKind): void;
}

interface Point {
  x: number;
  y: number;
}

type Mode =
  | { kind: 'idle' }
  | { kind: 'empty'; id: number; start: Point; moved: boolean }
  | { kind: 'press'; id: number; uid: string; start: Point; item: PlacedItem; timer: number }
  | { kind: 'drag'; id: number; uid: string; start: Point; item: PlacedItem }
  | {
      kind: 'pinch';
      ids: [number, number];
      uid: string;
      item: PlacedItem;
      d0: number;
      a0: number;
      mid0: Point;
    }
  | {
      kind: 'handle';
      id: number;
      uid: string;
      item: PlacedItem;
      d0: number;
      a0: number;
      center: Point;
    }
  | { kind: 'ignore' };

const LONG_PRESS_MS = 480;
const TOUCH_SLOP = 6;
const MOUSE_SLOP = 3;
const SNAP_THRESHOLD = 1.6;
const OUTSIDE_MARGIN = 28;

/**
 * Gestos do palco com Pointer Events:
 *  - 1 dedo: toca = seleciona; arrasta = move (sem atraso, sem rolar a página)
 *  - 2 dedos: pinça = redimensiona + gira (com ímã nos ângulos retos)
 *  - alça do canto: redimensiona + gira com 1 dedo
 *  - toque longo: menu rápido
 *  - soltar na lixeira ou fora do palco: exclui
 * Cada quadro só mexe no `transform` (via StageView.preview); o estado é
 * gravado UMA vez ao soltar (um passo de desfazer).
 */
export class StageGestures {
  private mode: Mode = { kind: 'idle' };
  private readonly pointers = new Map<number, Point>();
  private frame = 0;
  private last: { preview: GesturePreview; overTrash: boolean } | null = null;

  constructor(
    private readonly stage: StageView,
    private readonly getRoom: () => Room | null,
    private readonly cb: GestureCallbacks,
  ) {}

  attach(): () => void {
    const el = this.stage.el;
    const down = (e: PointerEvent) => {
      this.onDown(e);
    };
    const move = (e: PointerEvent) => {
      this.onMove(e);
    };
    const up = (e: PointerEvent) => {
      this.onUp(e, false);
    };
    const cancel = (e: PointerEvent) => {
      this.onUp(e, true);
    };
    const context = (e: Event) => {
      e.preventDefault();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('contextmenu', context);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
      el.removeEventListener('contextmenu', context);
      this.reset();
    };
  }

  /** Cancela qualquer gesto em andamento (ex.: troca de tela). */
  reset(): void {
    if ('uid' in this.mode) this.stage.endPreview(this.mode.uid);
    if (this.mode.kind === 'press') window.clearTimeout(this.mode.timer);
    this.mode = { kind: 'idle' };
    this.pointers.clear();
    this.stage.showGuides([]);
    this.cb.dragState(null);
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  // -------------------------------------------------------------- eventos

  private onDown(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const p = { x: e.clientX, y: e.clientY };
    this.pointers.set(e.pointerId, p);
    try {
      this.stage.el.setPointerCapture(e.pointerId);
    } catch {
      // Ponteiro já liberado pelo navegador: o gesto segue sem captura.
    }

    if (this.pointers.size === 2) {
      this.startPinch();
      return;
    }
    if (this.pointers.size > 2) return;

    const room = this.getRoom();
    if (!room) return;
    const selected = this.stage.selectedUid;

    if (selected && this.stage.isOnHandle(e.target)) {
      const item = findItem(room, selected);
      if (item && !item.locked) {
        e.preventDefault();
        const geom = this.stage.geometry(item);
        const r = this.stage.el.getBoundingClientRect();
        if (!geom) return;
        const center = { x: r.left + geom.cx, y: r.top + geom.cy };
        this.stage.beginPreview(item.uid);
        this.mode = {
          kind: 'handle',
          id: e.pointerId,
          uid: item.uid,
          item,
          d0: Math.max(10, dist(center, p)),
          a0: angle(center, p),
          center,
        };
        this.cb.haptic('light');
        return;
      }
    }

    const uid = this.stage.hitTest(p.x, p.y);
    if (!uid) {
      this.mode = { kind: 'empty', id: e.pointerId, start: p, moved: false };
      return;
    }
    const item = findItem(room, uid);
    if (!item) return;
    this.cb.select(uid);
    const timer = window.setTimeout(() => {
      this.fireLongPress();
    }, LONG_PRESS_MS);
    this.mode = { kind: 'press', id: e.pointerId, uid, start: p, item, timer };
    if (item.locked) this.cb.lockedTouch(uid);
  }

  private onMove(e: PointerEvent): void {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const m = this.mode;
    if (m.kind === 'press' && m.id === e.pointerId) {
      const slop = e.pointerType === 'mouse' ? MOUSE_SLOP : TOUCH_SLOP;
      if (dist(m.start, { x: e.clientX, y: e.clientY }) > slop) {
        window.clearTimeout(m.timer);
        if (m.item.locked) {
          this.stage.wiggle(m.uid);
          this.mode = { kind: 'ignore' };
          return;
        }
        this.stage.beginPreview(m.uid);
        this.mode = { kind: 'drag', id: m.id, uid: m.uid, start: m.start, item: m.item };
        this.cb.haptic('light');
      }
    } else if (m.kind === 'empty' && m.id === e.pointerId) {
      if (dist(m.start, { x: e.clientX, y: e.clientY }) > TOUCH_SLOP) m.moved = true;
      return;
    }
    if (this.frame === 0) {
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.tick();
      });
    }
  }

  private onUp(e: PointerEvent, cancelled: boolean): void {
    if (!this.pointers.has(e.pointerId)) return;
    // Aplica a última posição antes de decidir.
    if (this.frame !== 0) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.tick();
    }
    this.pointers.delete(e.pointerId);
    const m = this.mode;

    switch (m.kind) {
      case 'press':
        window.clearTimeout(m.timer);
        this.mode = { kind: 'idle' };
        break;
      case 'empty':
        if (!cancelled && !m.moved) this.cb.select(null);
        this.mode = { kind: 'idle' };
        break;
      case 'drag':
      case 'handle':
        if (m.id === e.pointerId) this.finish(m.uid, m.item, cancelled);
        break;
      case 'pinch': {
        this.finish(m.uid, m.item, cancelled);
        // Se um dedo continua na tela, segue arrastando com ele.
        const [rest] = [...this.pointers.entries()];
        const room = this.getRoom();
        const item = room ? findItem(room, m.uid) : undefined;
        if (rest && item && !cancelled) {
          this.stage.beginPreview(item.uid);
          this.mode = { kind: 'drag', id: rest[0], uid: item.uid, start: rest[1], item };
        }
        break;
      }
      case 'idle':
      case 'ignore':
        if (this.pointers.size === 0) this.mode = { kind: 'idle' };
        break;
    }
    if (this.pointers.size === 0 && this.mode.kind === 'ignore') this.mode = { kind: 'idle' };
  }

  // ---------------------------------------------------------------- lógica

  private startPinch(): void {
    const m = this.mode;
    if (m.kind === 'press') window.clearTimeout(m.timer);
    const uid = 'uid' in m ? m.uid : this.stage.selectedUid;
    // Segundo dedo no meio de um arrasto: grava o arrasto e começa a pinça dali.
    if (m.kind === 'drag' || m.kind === 'handle') this.finish(m.uid, m.item, false);
    const current = this.getRoom();
    const item = current && uid ? findItem(current, uid) : undefined;
    if (!item || item.locked) {
      this.mode = { kind: 'ignore' };
      return;
    }
    const [a, b] = [...this.pointers.entries()];
    if (!a || !b) return;
    this.cb.select(item.uid);
    this.stage.beginPreview(item.uid);
    this.mode = {
      kind: 'pinch',
      ids: [a[0], b[0]],
      uid: item.uid,
      item,
      d0: Math.max(10, dist(a[1], b[1])),
      a0: angle(a[1], b[1]),
      mid0: mid(a[1], b[1]),
    };
    this.cb.haptic('light');
  }

  private fireLongPress(): void {
    const m = this.mode;
    if (m.kind !== 'press') return;
    this.mode = { kind: 'ignore' };
    this.cb.haptic('medium');
    this.cb.longPress(m.uid, m.start.x, m.start.y);
  }

  private tick(): void {
    const m = this.mode;
    const size = this.stage.pixelSize || 1;
    const toPct = (px: number) => (px / size) * 100;

    if (m.kind === 'drag') {
      const p = this.pointers.get(m.id);
      if (!p) return;
      let dx = toPct(p.x - m.start.x);
      let dy = toPct(p.y - m.start.y);
      const overTrash = this.isOverTrash(p);
      if (!overTrash && this.cb.snapEnabled()) {
        const snapped = this.snapBox(m.item, m.item.x + dx, m.item.y + dy, 1);
        dx = snapped.x - m.item.x;
        dy = snapped.y - m.item.y;
      } else {
        this.stage.showGuides([]);
      }
      this.apply(m.uid, { dx, dy, scale: 1, rot: m.item.rot }, overTrash);
    } else if (m.kind === 'pinch') {
      const a = this.pointers.get(m.ids[0]);
      const b = this.pointers.get(m.ids[1]);
      if (!a || !b) return;
      const scale = this.clampScale(m.item, dist(a, b) / m.d0);
      const rot = snapAngle(normalizeAngle(m.item.rot + (angle(a, b) - m.a0)));
      const c = mid(a, b);
      this.apply(
        m.uid,
        { dx: toPct(c.x - m.mid0.x), dy: toPct(c.y - m.mid0.y), scale, rot },
        false,
      );
    } else if (m.kind === 'handle') {
      const p = this.pointers.get(m.id);
      if (!p) return;
      const scale = this.clampScale(m.item, dist(m.center, p) / m.d0);
      const rot = snapAngle(normalizeAngle(m.item.rot + (angle(m.center, p) - m.a0)));
      this.apply(m.uid, { dx: 0, dy: 0, scale, rot }, false);
    }
  }

  private apply(uid: string, preview: GesturePreview, overTrash: boolean): void {
    const wasOver = this.last?.overTrash ?? false;
    this.last = { preview, overTrash };
    this.stage.preview(uid, preview);
    if (overTrash !== wasOver) {
      this.stage.setDropTarget(uid, overTrash);
      if (overTrash) this.cb.haptic('light');
    }
    this.cb.dragState({ uid, overTrash });
  }

  private finish(uid: string, item: PlacedItem, cancelled: boolean): void {
    const last = this.last;
    this.last = null;
    this.mode = { kind: 'idle' };
    this.stage.showGuides([]);
    this.stage.setDropTarget(uid, false);
    this.cb.dragState(null);
    if (cancelled || !last) {
      this.stage.endPreview(uid);
      return;
    }
    if (last.overTrash) {
      // Não reseta o transform: o item some de onde está (animação de "puf").
      this.cb.haptic('medium');
      this.cb.remove(uid);
      this.stage.endPreview(uid);
      return;
    }
    const { preview } = last;
    const after: ItemPatch = {
      x: clamp(item.x + preview.dx, 0, 100),
      y: clamp(item.y + preview.dy, 0, 100),
      w: item.w * preview.scale,
      rot: preview.rot,
    };
    const before: ItemPatch = { x: item.x, y: item.y, w: item.w, rot: item.rot };
    this.stage.endPreview(uid);
    this.cb.commit(uid, before, after);
  }

  private clampScale(item: PlacedItem, scale: number): number {
    const w = clamp(item.w * scale, MIN_ITEM_WIDTH, MAX_ITEM_WIDTH);
    return w / item.w;
  }

  private snapBox(item: PlacedItem, x: number, y: number, scale: number): { x: number; y: number } {
    const room = this.getRoom();
    if (!room) return { x, y };
    const box = (i: PlacedItem, s = 1): Box => ({
      x: i.x,
      y: i.y,
      w: i.w * s,
      h: i.w * s * this.stage.aspectOf(i.itemId),
    });
    const moving = { ...box(item, scale), x, y };
    const others = room.items.filter((i) => i.uid !== item.uid).map((i) => box(i));
    const floor = this.cb.floorLine(room);
    const result = snap(moving, others, {
      threshold: SNAP_THRESHOLD,
      ...(floor === undefined ? {} : { floorLine: floor }),
    });
    this.stage.showGuides(result.guides);
    return result;
  }

  private isOverTrash(p: Point): boolean {
    const trash = this.cb.trashRect();
    if (trash && inside(p, trash, 16)) return true;
    const r = this.stage.el.getBoundingClientRect();
    return (
      p.x < r.left - OUTSIDE_MARGIN ||
      p.x > r.right + OUTSIDE_MARGIN ||
      p.y < r.top - OUTSIDE_MARGIN ||
      p.y > r.bottom + OUTSIDE_MARGIN
    );
  }
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angle(a: Point, b: Point): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function inside(p: Point, r: DOMRect, margin: number): boolean {
  return (
    p.x >= r.left - margin &&
    p.x <= r.right + margin &&
    p.y >= r.top - margin &&
    p.y <= r.bottom + margin
  );
}
