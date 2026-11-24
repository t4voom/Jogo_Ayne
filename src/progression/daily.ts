import { ITEMS } from '../catalog/items';
import { counterAdd, type Profile } from '../core/profile';
import { daysBetween } from './day';
import { earn } from './stars';
import { grantItem, isItemUnlocked } from './unlocks';

export const WELCOME_STARS = 15;

export interface DailyReward {
  readonly stars: number;
  readonly streak: number;
  readonly welcome: boolean;
  /** Item liberado de surpresa (a cada 5 presentes). */
  readonly itemId: string | null;
}

export function canOpenDaily(profile: Profile, today: string): boolean {
  return profile.daily.lastDay !== today;
}

/**
 * Abre o baú do dia: estrelinhas (mais com a sequência de dias) e, a cada 5
 * presentes, um item surpresa liberado. O primeiro presente é de boas-vindas.
 */
export function openDaily(
  profile: Profile,
  deviceId: string,
  today: string,
  random: () => number,
): { profile: Profile; reward: DailyReward } | null {
  if (!canOpenDaily(profile, today)) return null;
  const last = profile.daily.lastDay;
  const welcome = last === null;
  const streak = last !== null && daysBetween(last, today) === 1 ? profile.daily.streak + 1 : 1;
  const stars = welcome ? WELCOME_STARS : 4 + Math.floor(random() * 5) + Math.min(streak - 1, 5);
  let next = earn(profile, deviceId, stars);
  const gifts = Object.values(profile.stats['gifts'] ?? {}).reduce((a, b) => a + b, 0) + 1;
  let itemId: string | null = null;
  if (gifts % 5 === 0) {
    const candidates = ITEMS.filter((i) => i.cost > 0 && i.cost <= 8 && !isItemUnlocked(next, i));
    const pick = candidates[Math.floor(random() * candidates.length)];
    if (pick) {
      itemId = pick.id;
      next = grantItem(next, pick.id);
    }
  }
  next = {
    ...next,
    daily: { lastDay: today, streak },
    stats: { ...next.stats, gifts: counterAdd(next.stats['gifts'], deviceId, 1) },
  };
  return { profile: next, reward: { stars, streak, welcome, itemId } };
}
