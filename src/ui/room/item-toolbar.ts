import { RAMPS, VARIANT_LABEL } from '../../art/palette';
import type { CatalogItem } from '../../catalog/types';
import type { ColorVariant, PlacedItem } from '../../core/model';
import { h, icon, iconButton } from '../dom';

export interface ItemCommands {
  grow(): void;
  shrink(): void;
  flip(): void;
  front(): void;
  back(): void;
  duplicate(): void;
  setColor(color: ColorVariant): void;
  toggleLock(): void;
  remove(): void;
}

/**
 * Barra do item selecionado: aumentar, diminuir, espelhar, frente, trás,
 * duplicar, trocar cor, travar e excluir. Botões grandes com rótulo.
 */
export class ItemToolbar {
  readonly el: HTMLElement;
  private readonly palette: HTMLElement;
  private readonly lockBtn: HTMLButtonElement;
  private readonly lockable: HTMLButtonElement[] = [];
  private item: PlacedItem | null = null;
  private catalog: CatalogItem | null = null;

  constructor(private readonly cmd: ItemCommands) {
    const btn = (
      name: Parameters<typeof iconButton>[0],
      label: string,
      run: () => void,
      className = '',
    ) => {
      const b = iconButton(name, label, run, {
        showLabel: true,
        className: `tool-btn ${className}`.trim(),
      });
      this.lockable.push(b);
      return b;
    };
    this.lockBtn = iconButton('lock', 'Travar', () => cmd.toggleLock(), {
      showLabel: true,
      className: 'tool-btn',
    });
    const colorBtn = btn('palette', 'Cor', () => {
      this.togglePalette();
    });
    this.palette = h('div', {
      class: 'tool-palette glass',
      attrs: { role: 'radiogroup', 'aria-label': 'Cores' },
    });
    this.el = h(
      'div',
      { class: 'item-toolbar', attrs: { role: 'toolbar', 'aria-label': 'Ajustes do item' } },
      this.palette,
      h(
        'div',
        { class: 'tool-row glass' },
        btn('grow', 'Maior', () => cmd.grow()),
        btn('shrink', 'Menor', () => cmd.shrink()),
        btn('flip', 'Espelhar', () => cmd.flip()),
        btn('front', 'Frente', () => cmd.front()),
        btn('backward', 'Trás', () => cmd.back()),
        btn('duplicate', 'Duplicar', () => cmd.duplicate()),
        colorBtn,
        this.lockBtn,
        btn('trash', 'Excluir', () => cmd.remove(), 'tool-danger'),
      ),
    );
  }

  show(item: PlacedItem, catalog: CatalogItem | undefined): void {
    const changedItem = this.item?.uid !== item.uid;
    this.item = item;
    this.catalog = catalog ?? null;
    this.el.classList.add('is-visible');
    for (const b of this.lockable) b.disabled = item.locked;
    const label = item.locked ? 'Destravar' : 'Travar';
    this.lockBtn.replaceChildren(
      icon(item.locked ? 'unlock' : 'lock'),
      h('span', { class: 'icon-btn-label', text: label }),
    );
    this.lockBtn.setAttribute('aria-label', label);
    this.lockBtn.setAttribute('aria-pressed', String(item.locked));
    if (changedItem || item.locked) this.palette.classList.remove('is-open');
    else this.renderPalette();
  }

  hide(): void {
    this.item = null;
    this.el.classList.remove('is-visible');
    this.palette.classList.remove('is-open');
  }

  private togglePalette(): void {
    const open = !this.palette.classList.contains('is-open');
    this.palette.classList.toggle('is-open', open);
    if (open) this.renderPalette();
  }

  private renderPalette(): void {
    const item = this.item;
    if (!item) return;
    const colors = this.catalog?.colors ?? [];
    this.palette.replaceChildren(
      ...colors.map((c) =>
        h(
          'button',
          {
            class: 'tool-color',
            style: { '--c1': RAMPS[c].base, '--c2': RAMPS[c].shade },
            attrs: {
              type: 'button',
              role: 'radio',
              'aria-checked': String(item.color === c),
              'aria-label': VARIANT_LABEL[c],
              title: VARIANT_LABEL[c],
            },
            on: {
              click: () => {
                this.cmd.setColor(c);
              },
            },
          },
          item.color === c ? icon('check', 'icon tool-color-check') : null,
        ),
      ),
    );
  }
}
