import type { Room } from '../../core/model';
import { exteriorBackground } from './exterior';
import { interiorBackground } from './interior';

const cache = new Map<string, string>();

function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** Linha (em % do palco) onde a parede encontra o chão / o chão começa. */
export function floorLine(room: Room): number {
  return room.decor.kind === 'interior' ? 64.6 : 72;
}

/** SVG completo do fundo do cômodo (memorizado por decoração + hora). */
export function roomBackgroundSvg(room: Room): string {
  const key = `${room.id}|${JSON.stringify(room.decor)}|${room.ambience}`;
  let out = cache.get(key);
  if (out === undefined) {
    // Id derivado da decoração: duas cópias do mesmo cômodo com decorações
    // diferentes na tela (ex.: miniatura do mapa + palco) nunca colidem.
    const id = `bg-${room.id}-${hash(key)}`;
    const body =
      room.decor.kind === 'interior'
        ? interiorBackground(room.decor, id)
        : exteriorBackground(room.decor, room.ambience, room.id, id);
    out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${body}</svg>`;
    if (cache.size > 40) cache.clear();
    cache.set(key, out);
  }
  return out;
}
