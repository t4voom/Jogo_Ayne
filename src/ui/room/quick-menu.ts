import type { PlacedItem } from '../../core/model';
import { h, icon } from '../dom';
import type { IconName } from '../icons';
import type { ItemCommands } from './item-toolbar';

/**
 * Menu rápido do toque longo: aparece perto do dedo com as ações mais usadas.
 * Fecha ao tocar fora, ao escolher ou com Esc.
 */
export function openQuickMenu(
  parent: HTMLElement,
  item: PlacedItem,
  x: number,
  y: number,
  cmd: ItemCommands,
  openColors: () => void,
): () => void {
  const entries: {
    icon: IconName;
    label: string;
    run: () => void;
    danger?: boolean;
    disabled?: boolean;
  }[] = [
    { icon: 'duplicate', label: 'Duplicar', run: () => cmd.duplicate(), disabled: item.locked },
    { icon: 'front', label: 'Trazer para frente', run: () => cmd.front(), disabled: item.locked },
    { icon: 'backward', label: 'Mandar para trás', run: () => cmd.back(), disabled: item.locked },
    { icon: 'palette', label: 'Trocar cor', run: openColors, disabled: item.locked },
    {
      icon: item.locked ? 'unlock' : 'lock',
      label: item.locked ? 'Destravar' : 'Travar',
      run: () => cmd.toggleLock(),
    },
    {
      icon: 'trash',
      label: 'Excluir',
      run: () => cmd.remove(),
      danger: true,
      disabled: item.locked,
    },
  ];
  const backdrop = h('div', { class: 'quick-backdrop' });
  const menu = h('div', {
    class: 'quick-menu glass',
    attrs: { role: 'menu', 'aria-label': 'Ações do item' },
  });
  const close = () => {
    document.removeEventListener('keydown', onKey);
    menu.classList.add('is-leaving');
    backdrop.remove();
    window.setTimeout(() => menu.remove(), 180);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  for (const entry of entries) {
    menu.append(
      h(
        'button',
        {
          class: `quick-item ${entry.danger ? 'is-danger' : ''}`.trim(),
          attrs: { type: 'button', role: 'menuitem', disabled: entry.disabled },
          on: {
            click: () => {
              close();
              entry.run();
            },
          },
        },
        icon(entry.icon),
        h('span', { text: entry.label }),
      ),
    );
  }
  backdrop.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    close();
  });
  document.addEventListener('keydown', onKey);
  parent.append(backdrop, menu);
  // Posiciona perto do dedo sem sair da tela.
  const r = menu.getBoundingClientRect();
  const left = Math.min(Math.max(12, x - r.width / 2), window.innerWidth - r.width - 12);
  const top =
    y - r.height - 24 > 12
      ? y - r.height - 24
      : Math.min(y + 24, window.innerHeight - r.height - 12);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
  return close;
}
