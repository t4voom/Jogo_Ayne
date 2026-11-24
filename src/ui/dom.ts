import { ICONS, type IconName } from './icons';

type Child = Node | string | null | undefined | false;

type Handlers = {
  [K in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[K]) => void;
};

export interface Props {
  class?: string;
  id?: string;
  text?: string;
  /** Somente marcação CONFIÁVEL (arte e ícones do próprio jogo). */
  html?: string;
  attrs?: Record<string, string | number | boolean | undefined>;
  style?: Record<string, string>;
  dataset?: Record<string, string>;
  on?: Handlers;
}

/** Cria um elemento com propriedades e filhos (sem framework). */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.id) el.id = props.id;
  if (props.text !== undefined) el.textContent = props.text;
  if (props.html !== undefined) el.innerHTML = props.html;
  if (props.attrs) {
    for (const [k, v] of Object.entries(props.attrs)) {
      if (v === undefined || v === false) continue;
      el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  if (props.style) for (const [k, v] of Object.entries(props.style)) el.style.setProperty(k, v);
  if (props.dataset) for (const [k, v] of Object.entries(props.dataset)) el.dataset[k] = v;
  if (props.on) {
    for (const [type, handler] of Object.entries(props.on)) {
      el.addEventListener(type, handler as EventListener);
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child);
  }
  return el;
}

export function icon(name: IconName, className = 'icon'): SVGSVGElement {
  const tpl = document.createElement('template');
  tpl.innerHTML = `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
  return tpl.content.firstElementChild as SVGSVGElement;
}

export interface IconButtonOptions {
  className?: string;
  /** Mostra o rótulo abaixo do ícone (além do aria-label). */
  showLabel?: boolean;
  pressed?: boolean;
}

/** Botão redondo com ícone; sempre com aria-label. */
export function iconButton(
  name: IconName,
  label: string,
  onClick: (event: MouseEvent) => void,
  options: IconButtonOptions = {},
): HTMLButtonElement {
  const btn = h(
    'button',
    {
      class: `icon-btn ${options.className ?? ''}`.trim(),
      attrs: {
        type: 'button',
        'aria-label': label,
        title: label,
        'aria-pressed': options.pressed === undefined ? undefined : String(options.pressed),
      },
      on: { click: onClick },
    },
    icon(name),
  );
  if (options.showLabel) btn.append(h('span', { class: 'icon-btn-label', text: label }));
  return btn;
}

export function clear(el: Element): void {
  el.replaceChildren();
}
