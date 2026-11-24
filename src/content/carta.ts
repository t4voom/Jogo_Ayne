/**
 * 💌 CARTA SURPRESA — aparece quando a Ayne completa TODAS as conquistas.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  GUSTAVO: escreva a sua carta aqui.                                  │
 * │  - Troque o título, os parágrafos e a assinatura.                    │
 * │  - Cada item de `paragrafos` vira um parágrafo na carta animada.     │
 * │  - Depois mude `PLACEHOLDER` para `false`.                           │
 * │  Lembrete: o repositório é público, então o texto fica visível no    │
 * │  GitHub e no código do site.                                         │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export interface Carta {
  readonly titulo: string;
  readonly paragrafos: readonly string[];
  readonly assinatura: string;
}

/** Enquanto for true, a carta mostra um aviso de que ainda está sendo escrita. */
export const PLACEHOLDER = true as boolean;

export const CARTA: Carta = {
  titulo: 'Para a minha princesa, Ayne',
  paragrafos: [
    '[ESCREVA AQUI, GUSTAVO — primeiro parágrafo da sua carta.]',
    '[Segundo parágrafo… conte o que quiser: uma lembrança, um sonho, um obrigado.]',
    '[Último parágrafo — um fechamento bem carinhoso.]',
  ],
  assinatura: 'Com todo o meu amor,\nGustavo',
};
