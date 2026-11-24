/**
 * Mensagens carinhosas que aparecem em marcos (missão cumprida, conquista,
 * cômodo aberto, a cada tantos itens…). Gustavo: fique à vontade para editar
 * e acrescentar as suas!
 */
export const MENSAGENS: readonly string[] = [
  'Que lindo, Princesa Ayne! ✨',
  'Digno de uma rainha 👑',
  'Ficou um encanto! 💖',
  'O castelo está cada dia mais lindo 🏰',
  'Que bom gosto, Majestade! 🌸',
  'As fadinhas estão aplaudindo! 🧚',
  'Isso merece um baile! 💃',
  'Que capricho, Princesa! 🎀',
  'Até o unicórnio ficou impressionado 🦄',
  'Seu castelo, suas regras — e que regras lindas! 💕',
  'Brilhando como uma coroa nova ✨',
  'Uma verdadeira artista real 🎨',
];

/** Escolhe uma mensagem sem repetir a anterior. */
export function mensagemCarinhosa(random: () => number, anterior?: string): string {
  const pool = MENSAGENS.filter((m) => m !== anterior);
  return pool[Math.floor(random() * pool.length)] ?? MENSAGENS[0] ?? '';
}
