import { ROOM_IDS, type RoomId } from '../core/model';
import { createLogger } from '../core/log';
import { closeTopSheet } from './sheet';

const log = createLogger('router');

export type Route =
  | { readonly name: 'opening' }
  | { readonly name: 'map' }
  | { readonly name: 'room'; readonly roomId: RoomId }
  | { readonly name: 'album' }
  | { readonly name: 'achievements' }
  | { readonly name: 'settings' };

export interface Screen {
  readonly el: HTMLElement;
  /** Chamado depois de entrar no DOM. */
  mounted?(): void;
  destroy(): void;
  /** Botão voltar do sistema: devolva true se tratou (ex.: fechou um modal). */
  back?(): boolean;
}

export type ScreenLoader = (route: Route) => Promise<Screen>;

const PATHS: Record<Exclude<Route['name'], 'room' | 'opening'>, string> = {
  map: 'mapa',
  album: 'album',
  achievements: 'conquistas',
  settings: 'configuracoes',
};

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'opening':
      return '#/';
    case 'room':
      return `#/comodo/${route.roomId}`;
    case 'map':
    case 'album':
    case 'achievements':
    case 'settings':
      return `#/${PATHS[route.name]}`;
  }
}

export function hashToRoute(hash: string): Route | null {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'opening' };
  const [head, arg] = parts;
  if (head === 'comodo' && arg && (ROOM_IDS as readonly string[]).includes(arg)) {
    return { name: 'room', roomId: arg as RoomId };
  }
  for (const [name, path] of Object.entries(PATHS)) {
    if (path === head) return { name } as Route;
  }
  return null;
}

const TRANSITION_MS = 520;

/**
 * Navegação entre telas com transição (fade + leve zoom) e integração com o
 * botão voltar do Android / gesto de voltar (history API com hash).
 */
export class Router {
  private current: { route: Route; screen: Screen } | null = null;
  private token = 0;
  /** Quantas entradas de histórico o próprio jogo empilhou (voltar só até elas). */
  private depth = 0;
  private listeners = new Set<(route: Route) => void>();

  constructor(
    private readonly root: HTMLElement,
    private readonly load: ScreenLoader,
    private readonly guard: (route: Route) => Route = (r) => r,
  ) {}

  get route(): Route | null {
    return this.current?.route ?? null;
  }

  onChange(listener: (route: Route) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(): Promise<void> {
    window.addEventListener('popstate', () => {
      if (closeTopSheet() || this.current?.screen.back?.()) {
        // A tela tratou o voltar (ex.: fechou um painel): restaura a URL.
        if (this.current) history.pushState(null, '', routeToHash(this.current.route));
        return;
      }
      const route = hashToRoute(location.hash) ?? { name: 'opening' };
      this.depth = Math.max(0, this.depth - 1);
      void this.show(route);
    });
    // Mudança manual do # (ou links internos) sem passar pelo histórico.
    window.addEventListener('hashchange', () => {
      const route = hashToRoute(location.hash);
      if (route && this.current && routeToHash(route) !== routeToHash(this.current.route)) {
        void this.show(route);
      }
    });
    const initial = hashToRoute(location.hash) ?? { name: 'opening' };
    history.replaceState(null, '', routeToHash(initial));
    return this.show(initial);
  }

  go(route: Route, options: { replace?: boolean } = {}): Promise<void> {
    const hash = routeToHash(this.guard(route));
    if (options.replace) history.replaceState(null, '', hash);
    else if (location.hash !== hash) {
      history.pushState(null, '', hash);
      this.depth++;
    }
    return this.show(route);
  }

  /** Volta uma tela; se não há tela anterior do jogo, vai para `fallback`. */
  back(fallback: Route): void {
    if (this.depth > 0) history.back();
    else void this.go(fallback, { replace: true });
  }

  private async show(requested: Route): Promise<void> {
    const route = this.guard(requested);
    if (route !== requested) history.replaceState(null, '', routeToHash(route));
    const token = ++this.token;
    let screen: Screen;
    try {
      screen = await this.load(route);
    } catch (error) {
      log.error(`Falha ao abrir a tela ${route.name}`, error);
      throw error;
    }
    if (token !== this.token) {
      screen.destroy();
      return;
    }
    const prev = this.current;
    this.current = { route, screen };
    screen.el.classList.add('screen', 'screen-enter');
    this.root.append(screen.el);
    screen.mounted?.();
    window.setTimeout(() => screen.el.classList.remove('screen-enter'), TRANSITION_MS);
    if (prev) {
      prev.screen.el.classList.add('screen-leave');
      prev.screen.el.setAttribute('aria-hidden', 'true');
      prev.screen.el.inert = true;
      window.setTimeout(() => {
        prev.screen.destroy();
        prev.screen.el.remove();
      }, TRANSITION_MS);
    }
    for (const l of this.listeners) l(route);
  }
}
