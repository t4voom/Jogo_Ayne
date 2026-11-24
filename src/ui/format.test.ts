import { describe, expect, it } from 'vitest';
import { relativeTime } from './format';

describe('relativeTime', () => {
  const now = 1_700_000_000_000;
  it('fala como gente', () => {
    expect(relativeTime(now - 10_000, now)).toBe('agora há pouco');
    expect(relativeTime(now - 60_000, now)).toBe('há 1 minuto');
    expect(relativeTime(now - 5 * 60_000, now)).toBe('há 5 minutos');
    expect(relativeTime(now - 2 * 3_600_000, now)).toBe('há 2 horas');
    expect(relativeTime(now - 30 * 3_600_000, now)).toBe('ontem');
    expect(relativeTime(now - 5 * 86_400_000, now)).toMatch(/^\d{2}\/\d{2}$/);
  });
});
