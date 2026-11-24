import { describe, expect, it } from 'vitest';
import { hashToRoute, routeToHash, type Route } from './router';

describe('rotas', () => {
  it('ida e volta entre rota e hash', () => {
    const routes: Route[] = [
      { name: 'opening' },
      { name: 'map' },
      { name: 'room', roomId: 'quarto' },
      { name: 'album' },
      { name: 'achievements' },
      { name: 'settings' },
    ];
    for (const r of routes) expect(hashToRoute(routeToHash(r))).toEqual(r);
  });

  it('rejeita cômodo desconhecido e caminho inválido', () => {
    expect(hashToRoute('#/comodo/porao')).toBeNull();
    expect(hashToRoute('#/qualquer')).toBeNull();
    expect(hashToRoute('')).toEqual({ name: 'opening' });
  });
});
