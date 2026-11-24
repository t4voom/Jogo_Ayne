import { counterAdd, counterValue, type Profile } from '../core/profile';

/** Limite de estrelinhas ganhas só decorando, por dia. */
export const DAILY_DECOR_CAP = 12;

export function balance(profile: Profile): number {
  return Math.max(0, counterValue(profile.stars.earned) - counterValue(profile.stars.spent));
}

export function earn(profile: Profile, deviceId: string, amount: number): Profile {
  if (amount <= 0) return profile;
  return {
    ...profile,
    stars: { ...profile.stars, earned: counterAdd(profile.stars.earned, deviceId, amount) },
  };
}

/** Gasta se tiver saldo; senão devolve null. */
export function spend(profile: Profile, deviceId: string, amount: number): Profile | null {
  if (amount < 0 || balance(profile) < amount) return null;
  if (amount === 0) return profile;
  return {
    ...profile,
    stars: { ...profile.stars, spent: counterAdd(profile.stars.spent, deviceId, amount) },
  };
}

/** +1 estrelinha por item colocado, até o limite do dia. */
export function earnForDecorating(
  profile: Profile,
  deviceId: string,
  today: string,
): { profile: Profile; earned: number } {
  const count = profile.decorStars.day === today ? profile.decorStars.count : 0;
  if (count >= DAILY_DECOR_CAP) return { profile, earned: 0 };
  return {
    profile: { ...earn(profile, deviceId, 1), decorStars: { day: today, count: count + 1 } },
    earned: 1,
  };
}
