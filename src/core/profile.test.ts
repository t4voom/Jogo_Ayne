import { describe, expect, it } from 'vitest';
import {
  counterAdd,
  counterValue,
  createProfile,
  mergeCounters,
  mergeProfiles,
  type Profile,
} from './profile';

const base = createProfile(0);

describe('contadores por aparelho', () => {
  it('soma e mescla sem perder', () => {
    let a = counterAdd(undefined, 'tablet', 3);
    a = counterAdd(a, 'tablet', 2);
    const b = counterAdd({ tablet: 4 }, 'celular', 7);
    expect(counterValue(a)).toBe(5);
    expect(mergeCounters(a, b)).toEqual({ tablet: 5, celular: 7 });
    expect(counterValue(mergeCounters(a, b))).toBe(12);
  });
});

describe('mergeProfiles', () => {
  it('estrelinhas ganhas offline nos dois aparelhos se somam', () => {
    const tablet: Profile = {
      ...base,
      stars: { earned: { tablet: 10 }, spent: { tablet: 4 } },
      updatedAt: 5,
    };
    const phone: Profile = {
      ...base,
      stars: { earned: { tablet: 8, celular: 6 }, spent: {} },
      updatedAt: 9,
      revision: 3,
    };
    const m = mergeProfiles(tablet, phone);
    expect(m.stars).toEqual({ earned: { tablet: 10, celular: 6 }, spent: { tablet: 4 } });
    expect(m.revision).toBe(3);
    expect(m.updatedAt).toBe(9);
  });

  it('desbloqueios, conquistas, missões e carta se unem', () => {
    const a: Profile = {
      ...base,
      unlocked: ['banheiro', 'piano'],
      achievements: { primeiro: 50 },
      missions: { m1: { done: true, claimed: false } },
      letterSeen: true,
    };
    const b: Profile = {
      ...base,
      unlocked: ['piano', 'harpa'],
      achievements: { primeiro: 30, fiel: 70 },
      missions: { m1: { done: true, claimed: true }, m2: { done: true, claimed: false } },
    };
    const m = mergeProfiles(a, b);
    expect(m.unlocked).toEqual(['banheiro', 'harpa', 'piano']);
    expect(m.achievements).toEqual({ primeiro: 30, fiel: 70 });
    expect(m.missions).toEqual({
      m1: { done: true, claimed: true },
      m2: { done: true, claimed: false },
    });
    expect(m.letterSeen).toBe(true);
  });

  it('presente diário e limite de decoração ficam com o dia mais recente', () => {
    const a: Profile = {
      ...base,
      daily: { lastDay: '2026-11-20', streak: 3 },
      decorStars: { day: '2026-11-24', count: 4 },
    };
    const b: Profile = {
      ...base,
      daily: { lastDay: '2026-11-21', streak: 4 },
      decorStars: { day: '2026-11-24', count: 7 },
    };
    const m = mergeProfiles(a, b);
    expect(m.daily).toEqual({ lastDay: '2026-11-21', streak: 4 });
    expect(m.decorStars).toEqual({ day: '2026-11-24', count: 7 });
    expect(mergeProfiles({ ...a, daily: { lastDay: null, streak: 0 } }, b).daily.lastDay).toBe(
      '2026-11-21',
    );
  });

  it('configurações: vale a mais recente', () => {
    const a: Profile = { ...base, settings: { ...base.settings, music: false }, updatedAt: 10 };
    const b: Profile = { ...base, settings: { ...base.settings, sfx: false }, updatedAt: 5 };
    expect(mergeProfiles(a, b).settings).toEqual(a.settings);
  });
});
