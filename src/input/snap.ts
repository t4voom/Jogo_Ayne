import type { Guide } from '../render/stage';

/** Caixa de um item em % do palco (centro + tamanho). */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface SnapOptions {
  /** Distância máxima (em %) para o ímã puxar. */
  readonly threshold: number;
  /** Linha onde a parede encontra o chão (%), para itens de chão. */
  readonly floorLine?: number;
}

export interface SnapResult {
  readonly x: number;
  readonly y: number;
  readonly guides: Guide[];
}

interface Candidate {
  readonly value: number; // posição do centro que alinharia
  readonly guide: number; // onde desenhar a guia
}

function best(
  current: number,
  candidates: readonly Candidate[],
  threshold: number,
): Candidate | null {
  let pick: Candidate | null = null;
  let dist = threshold;
  for (const c of candidates) {
    const d = Math.abs(c.value - current);
    if (d <= dist) {
      dist = d;
      pick = c;
    }
  }
  return pick;
}

/**
 * "Ímã": alinha o item que está sendo arrastado com o centro do palco, com os
 * centros/bordas dos outros itens e (para móveis) com o rodapé da parede.
 * Função pura: recebe caixas, devolve a posição ajustada e as guias a mostrar.
 */
export function snap(moving: Box, others: readonly Box[], options: SnapOptions): SnapResult {
  const hw = moving.w / 2;
  const hh = moving.h / 2;
  const xs: Candidate[] = [{ value: 50, guide: 50 }];
  const ys: Candidate[] = [];
  for (const o of others) {
    xs.push({ value: o.x, guide: o.x });
    xs.push({ value: o.x - o.w / 2 + hw, guide: o.x - o.w / 2 }); // bordas esquerdas
    xs.push({ value: o.x + o.w / 2 - hw, guide: o.x + o.w / 2 }); // bordas direitas
    ys.push({ value: o.y, guide: o.y });
    ys.push({ value: o.y + o.h / 2 - hh, guide: o.y + o.h / 2 }); // mesmas bases
  }
  if (options.floorLine !== undefined) {
    // Encostar a base do móvel um pouquinho abaixo do rodapé.
    const base = options.floorLine + 3;
    ys.push({ value: base - hh, guide: base });
  }
  const bx = best(moving.x, xs, options.threshold);
  const by = best(moving.y, ys, options.threshold);
  const guides: Guide[] = [];
  if (bx) guides.push({ axis: 'x', at: bx.guide });
  if (by) guides.push({ axis: 'y', at: by.guide });
  return { x: bx?.value ?? moving.x, y: by?.value ?? moving.y, guides };
}

/** Ajusta um ângulo para múltiplos de 90° quando está perto (graus). */
export function snapAngle(deg: number, threshold = 6): number {
  const nearest = Math.round(deg / 90) * 90;
  return Math.abs(deg - nearest) <= threshold ? nearest : deg;
}
