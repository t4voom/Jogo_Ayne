import { describe, expect, it } from 'vitest';
import { noteAt } from './engine';
import { BASS, BEATS_PER_BAR, MELODY } from './melody';

describe('melodia da caixinha', () => {
  it('fecha compassos inteiros e tem um baixo por compasso', () => {
    const beats = MELODY.reduce((s, note) => s + note.beats, 0);
    expect(beats % BEATS_PER_BAR).toBe(0);
    expect(BASS).toHaveLength(beats / BEATS_PER_BAR);
  });

  it('fica numa região aguda e doce (caixinha de música)', () => {
    for (const note of MELODY) if (note.midi !== null) expect(note.midi).toBeGreaterThanOrEqual(72);
  });

  it('noteAt calcula o tempo de cada passo', () => {
    expect(noteAt(MELODY, 0).at).toBe(0);
    expect(noteAt(MELODY, 2).at).toBe(3);
  });
});
