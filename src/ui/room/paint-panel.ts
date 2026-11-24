import { PAINTS, PAINT_LABEL } from '../../art/palette';
import { floorSwatchSvg, groundSwatchSvg, wallSwatchSvg } from '../../art/rooms/swatches';
import {
  FLOOR_PATTERNS,
  GROUNDS,
  PAINT_COLORS,
  WALL_PATTERNS,
  type Ambience,
  type PaintColor,
  type Room,
} from '../../core/model';
import type { DecorPatch } from '../../state/actions';
import { h, icon } from '../dom';
import type { IconName } from '../icons';

export interface PaintHandlers {
  readonly onPaint: (patch: DecorPatch) => void;
  readonly onAmbience: (ambience: Ambience) => void;
}

const WALL_LABEL: Record<(typeof WALL_PATTERNS)[number], string> = {
  lisa: 'Lisa',
  listras: 'Listras',
  bolinhas: 'Bolinhas',
  coracoes: 'Corações',
  losangos: 'Losangos',
  floral: 'Floral',
  damasco: 'Damasco',
};

const FLOOR_LABEL: Record<(typeof FLOOR_PATTERNS)[number], string> = {
  'madeira-clara': 'Madeira clara',
  'madeira-rosa': 'Madeira rosa',
  xadrez: 'Xadrez',
  marmore: 'Mármore',
  carpete: 'Carpete',
  ladrilho: 'Ladrilho',
};

const GROUND_LABEL: Record<(typeof GROUNDS)[number], string> = {
  grama: 'Grama',
  pedras: 'Caminho de pedras',
  flores: 'Campo de flores',
};

const AMBIENCE: readonly { id: Ambience; label: string; icon: IconName }[] = [
  { id: 'dia', label: 'Dia', icon: 'sun' },
  { id: 'entardecer', label: 'Entardecer', icon: 'sunset' },
  { id: 'noite', label: 'Noite', icon: 'moon' },
];

/** Painel "Pintar": cores e padrões de parede/chão, céu, castelo e luz. */
export class PaintPanel {
  readonly el: HTMLDivElement;
  private lastKey = '';

  constructor(private readonly o: PaintHandlers) {
    this.el = h('div', { class: 'paint' });
  }

  update(room: Room): void {
    const key = `${JSON.stringify(room.decor)}|${room.ambience}`;
    if (key === this.lastKey && this.el.childElementCount > 0) return;
    this.lastKey = key;
    const d = room.decor;
    const sections: HTMLElement[] = [];
    sections.push(
      this.section(
        d.kind === 'exterior' ? 'Céu' : 'Luz',
        this.row(
          AMBIENCE.map((a) =>
            this.option(a.label, room.ambience === a.id, () => this.o.onAmbience(a.id), {
              iconName: a.icon,
              className: `paint-amb paint-amb-${a.id}`,
            }),
          ),
        ),
      ),
    );
    if (d.kind === 'interior') {
      sections.push(
        this.section(
          'Parede',
          this.colors(d.wallColor, (c) => this.o.onPaint({ wallColor: c })),
          this.row(
            WALL_PATTERNS.map((p) =>
              this.option(
                WALL_LABEL[p],
                d.wallPattern === p,
                () => this.o.onPaint({ wallPattern: p }),
                {
                  svg: wallSwatchSvg(p, d.wallColor),
                },
              ),
            ),
          ),
        ),
        this.section(
          'Chão',
          this.colors(d.floorColor, (c) => this.o.onPaint({ floorColor: c })),
          this.row(
            FLOOR_PATTERNS.map((p) =>
              this.option(
                FLOOR_LABEL[p],
                d.floorPattern === p,
                () => this.o.onPaint({ floorPattern: p }),
                {
                  svg: floorSwatchSvg(p, d.floorColor),
                },
              ),
            ),
          ),
        ),
      );
    } else {
      sections.push(
        this.section(
          'Castelo',
          this.colors(d.castleColor, (c) => this.o.onPaint({ castleColor: c })),
        ),
        this.section(
          'Telhado das torres',
          this.colors(d.roofColor, (c) => this.o.onPaint({ roofColor: c })),
        ),
        this.section(
          'Chão',
          this.row(
            GROUNDS.map((g) =>
              this.option(GROUND_LABEL[g], d.ground === g, () => this.o.onPaint({ ground: g }), {
                svg: groundSwatchSvg(g),
              }),
            ),
          ),
        ),
      );
    }
    const scroll = this.el.scrollTop;
    this.el.replaceChildren(...sections);
    this.el.scrollTop = scroll;
  }

  private section(title: string, ...rows: HTMLElement[]): HTMLElement {
    return h(
      'section',
      { class: 'paint-section' },
      h('h3', { class: 'paint-title', text: title }),
      ...rows,
    );
  }

  private row(children: HTMLElement[]): HTMLElement {
    return h('div', { class: 'paint-row' }, ...children);
  }

  private colors(current: PaintColor, pick: (c: PaintColor) => void): HTMLElement {
    return h(
      'div',
      { class: 'paint-row paint-colors', attrs: { role: 'radiogroup' } },
      ...PAINT_COLORS.map((c) =>
        h(
          'button',
          {
            class: 'paint-swatch',
            style: { '--swatch': PAINTS[c].base, '--swatch-ring': PAINTS[c].accent },
            attrs: {
              type: 'button',
              role: 'radio',
              'aria-checked': String(c === current),
              'aria-label': PAINT_LABEL[c],
              title: PAINT_LABEL[c],
            },
            on: {
              click: () => {
                pick(c);
              },
            },
          },
          c === current ? icon('check', 'icon paint-check') : null,
        ),
      ),
    );
  }

  private option(
    label: string,
    selected: boolean,
    pick: () => void,
    extra: { svg?: string; iconName?: IconName; className?: string },
  ): HTMLElement {
    return h(
      'button',
      {
        class: `paint-option ${extra.className ?? ''}`.trim(),
        attrs: { type: 'button', 'aria-pressed': String(selected), 'aria-label': label },
        on: { click: pick },
      },
      extra.svg ? h('span', { class: 'paint-preview', html: extra.svg }) : null,
      extra.iconName ? h('span', { class: 'paint-icon' }, icon(extra.iconName)) : null,
      h('span', { class: 'paint-label', text: label }),
    );
  }
}
