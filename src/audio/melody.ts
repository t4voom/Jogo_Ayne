/**
 * Melodia ORIGINAL da caixinha de música do castelo — uma valsinha em Fá
 * maior (3/4), composta para o jogo. 16 compassos em loop.
 * `midi: null` = pausa; `beats` em tempos.
 */
export interface Note {
  readonly midi: number | null;
  readonly beats: number;
}

export const BPM = 96;
export const BEATS_PER_BAR = 3;

const n = (midi: number | null, beats = 1): Note => ({ midi, beats });

export const MELODY: readonly Note[] = [
  // frase 1
  n(81, 2),
  n(79),
  n(77),
  n(81),
  n(84),
  n(86, 2),
  n(84),
  n(81, 3),
  // frase 2
  n(82, 2),
  n(81),
  n(79),
  n(82),
  n(86),
  n(84, 2),
  n(82),
  n(81, 2),
  n(null),
  // frase 3
  n(77),
  n(79),
  n(81),
  n(84, 2),
  n(81),
  n(79),
  n(81),
  n(82),
  n(86, 2),
  n(84),
  // final
  n(81),
  n(77),
  n(79),
  n(81, 2),
  n(76),
  n(79, 2),
  n(76),
  n(77, 3),
];

/** Uma nota grave por compasso (fundamental do acorde). */
export const BASS: readonly number[] = [
  53, 53, 58, 53, 58, 55, 60, 53, 53, 53, 60, 58, 53, 62, 60, 53,
];
