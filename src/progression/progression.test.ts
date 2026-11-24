import { describe, expect, it } from 'vitest';
import { getItem } from '../catalog/items';
import { sequentialIds } from '../core/ids';
import type { PlacedItem, Room, RoomId } from '../core/model';
import { counterAdd, createProfile, type Profile } from '../core/profile';
import { createRoom } from '../core/rooms';
import {
  achievementViews,
  allAchievementsDone,
  ACHIEVEMENTS,
  newlyEarnedAchievements,
} from './achievements';
import { canOpenDaily, openDaily, WELCOME_STARS } from './daily';
import { dayKey, daysBetween } from './day';
import { MISSIONS, missionViews, newlyDoneMissions } from './missions';
import type { Snapshot } from './snapshot';
import { DAILY_DECOR_CAP, balance, earn, earnForDecorating, spend } from './stars';
import { isItemUnlocked, isRoomUnlocked, unlockItem, unlockRoom } from './unlocks';

const D = 'tablet';
const rich = (n: number): Profile => earn(createProfile(0), D, n);

function placed(itemId: string, color: PlacedItem['color'] = 'rosa'): PlacedItem {
  return {
    uid: `${itemId}-${Math.random()}`,
    itemId,
    x: 50,
    y: 50,
    w: 10,
    rot: 0,
    flip: false,
    color,
    locked: false,
  };
}

function snap(rooms: Partial<Record<RoomId, Room>>, profile: Profile = createProfile(0)): Snapshot {
  return { rooms, profile };
}

const empty = (id: RoomId): Room => ({ ...createRoom(id, sequentialIds(), 0), items: [] });

describe('dias', () => {
  it('chave de dia local e diferença', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
    expect(daysBetween('2026-12-31', '2027-01-02')).toBe(2);
  });
});

describe('estrelinhas', () => {
  it('ganha, gasta e nunca fica negativo', () => {
    const p = rich(10);
    expect(balance(p)).toBe(10);
    const after = spend(p, D, 4);
    expect(after && balance(after)).toBe(6);
    expect(spend(p, D, 11)).toBeNull();
  });

  it('decorar dá +1 até o limite do dia', () => {
    let p = createProfile(0);
    let total = 0;
    for (let i = 0; i < DAILY_DECOR_CAP + 5; i++) {
      const r = earnForDecorating(p, D, '2026-11-24');
      p = r.profile;
      total += r.earned;
    }
    expect(total).toBe(DAILY_DECOR_CAP);
    expect(earnForDecorating(p, D, '2026-11-25').earned).toBe(1);
  });
});

describe('desbloqueios', () => {
  it('cômodo: iniciais já abertos; os outros custam estrelinhas', () => {
    expect(isRoomUnlocked(createProfile(0), 'quarto')).toBe(true);
    expect(isRoomUnlocked(createProfile(0), 'banheiro')).toBe(false);
    expect(unlockRoom(rich(5), D, 'banheiro')).toBeNull();
    const p = unlockRoom(rich(20), D, 'banheiro')!;
    expect(isRoomUnlocked(p, 'banheiro')).toBe(true);
    expect(balance(p)).toBe(5);
    expect(unlockRoom(p, D, 'banheiro')).toBe(p); // não cobra de novo
  });

  it('item: grátis já vem liberado; pago precisa de saldo', () => {
    const piano = getItem('piano')!;
    const cama = getItem('cama-dossel')!;
    expect(isItemUnlocked(createProfile(0), cama)).toBe(true);
    expect(isItemUnlocked(createProfile(0), piano)).toBe(false);
    const p = unlockItem(rich(piano.cost), D, piano)!;
    expect(isItemUnlocked(p, piano)).toBe(true);
    expect(balance(p)).toBe(0);
  });
});

describe('presente diário', () => {
  const rnd = () => 0.5;

  it('primeiro presente é de boas-vindas e só um por dia', () => {
    const r = openDaily(createProfile(0), D, '2026-11-24', rnd)!;
    expect(r.reward).toMatchObject({ stars: WELCOME_STARS, welcome: true, streak: 1 });
    expect(canOpenDaily(r.profile, '2026-11-24')).toBe(false);
    expect(openDaily(r.profile, D, '2026-11-24', rnd)).toBeNull();
  });

  it('sequência de dias aumenta o prêmio; pular um dia recomeça', () => {
    let p = openDaily(createProfile(0), D, '2026-11-01', rnd)!.profile;
    const day2 = openDaily(p, D, '2026-11-02', rnd)!;
    expect(day2.reward.streak).toBe(2);
    expect(day2.reward.stars).toBe(4 + 2 + 1);
    p = day2.profile;
    expect(openDaily(p, D, '2026-11-05', rnd)!.reward.streak).toBe(1);
  });

  it('a cada 5 presentes vem um item surpresa', () => {
    let p = createProfile(0);
    const items: (string | null)[] = [];
    for (let d = 1; d <= 5; d++) {
      const r = openDaily(p, D, `2026-11-0${d}`, rnd)!;
      p = r.profile;
      items.push(r.reward.itemId);
    }
    expect(items.slice(0, 4)).toEqual([null, null, null, null]);
    expect(items[4]).toBeTruthy();
    expect(p.unlocked).toContain(items[4]);
  });
});

describe('missões', () => {
  it('3 ativas por vez, em ordem, e avança ao receber', () => {
    const s = snap({ quarto: empty('quarto') });
    expect(missionViews(s).active.map((v) => v.def.id)).toEqual([
      'cama-quarto',
      'pintar-quarto',
      'bichinho',
    ]);
    const claimed: Profile = {
      ...createProfile(0),
      missions: { 'cama-quarto': { done: true, claimed: true } },
    };
    expect(missionViews(snap({}, claimed)).active[2]?.def.id).toBe('lilas-quarto');
  });

  it('detecta missão cumprida (com progresso parcial)', () => {
    const quarto = {
      ...empty('quarto'),
      items: [placed('cama-dossel'), placed('gatinho', 'lilas')],
    };
    const done = newlyDoneMissions(snap({ quarto }));
    expect(done.map((m) => m.id)).toEqual(['cama-quarto', 'bichinho']);
    const views = missionViews(snap({ quarto }));
    expect(views.active.find((v) => v.def.id === 'pintar-quarto')?.progress).toEqual({
      value: 0,
      goal: 1,
    });
  });

  it('todas as missões têm recompensa e textos', () => {
    for (const m of MISSIONS) {
      expect(m.reward).toBeGreaterThan(0);
      expect(m.title.length).toBeGreaterThan(3);
      expect(m.description.endsWith('.')).toBe(true);
    }
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
  });
});

describe('conquistas', () => {
  it('primeiro item e noite', () => {
    const profile: Profile = {
      ...createProfile(0),
      stats: { placed: counterAdd(undefined, D, 1) },
    };
    const rooms = { quarto: { ...empty('quarto'), ambience: 'noite' as const } };
    const got = newlyEarnedAchievements(snap(rooms, profile)).map((a) => a.id);
    expect(got).toContain('primeiro-item');
    expect(got).not.toContain('noturna');
  });

  it('conquista ganha fica, mesmo se o castelo mudar', () => {
    const profile: Profile = { ...createProfile(0), achievements: { noturna: 99 } };
    const view = achievementViews(snap({}, profile)).find((v) => v.def.id === 'noturna')!;
    expect(view.unlockedAt).toBe(99);
    expect(view.progress.value).toBe(view.progress.goal);
  });

  it('carta só depois de todas', () => {
    const all = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, 1]));
    expect(allAchievementsDone(snap({}, { ...createProfile(0), achievements: all }))).toBe(true);
    const { [ACHIEVEMENTS[0]!.id]: _first, ...missing } = all;
    expect(allAchievementsDone(snap({}, { ...createProfile(0), achievements: missing }))).toBe(
      false,
    );
  });
});
