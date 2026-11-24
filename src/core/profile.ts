/**
 * Perfil da jogadora: preferências e progresso do castelo inteiro.
 *
 * Tudo que é progresso foi desenhado para MESCLAR entre o tablet e o celular
 * sem perder nada, mesmo quando os dois jogam offline:
 *  - contadores (estrelinhas ganhas/gastas, estatísticas) são "G-counters":
 *    um valor por aparelho; mesclar = maior valor de cada aparelho; total = soma;
 *  - desbloqueios e conquistas são conjuntos (união);
 *  - missões: feita/recebida em qualquer aparelho = feita/recebida.
 */

export interface Settings {
  readonly music: boolean;
  readonly sfx: boolean;
  readonly haptics: boolean;
  /** "Ímã": encaixar itens nas guias e no chão/parede. */
  readonly snap: boolean;
}

/** Um valor por aparelho (deviceId → contagem). */
export type Counter = Readonly<Record<string, number>>;

export interface StarLedger {
  readonly earned: Counter;
  readonly spent: Counter;
}

export interface MissionState {
  readonly done: boolean;
  readonly claimed: boolean;
}

export interface DailyState {
  /** Último dia (AAAA-MM-DD, horário local) em que abriu o presente. */
  readonly lastDay: string | null;
  readonly streak: number;
}

export interface Profile {
  readonly settings: Settings;
  readonly tutorialDone: boolean;
  readonly stars: StarLedger;
  /** Cômodos e itens liberados com estrelinhas. */
  readonly unlocked: readonly string[];
  readonly missions: Readonly<Record<string, MissionState>>;
  /** Conquista → momento em que foi ganha. */
  readonly achievements: Readonly<Record<string, number>>;
  readonly daily: DailyState;
  /** Estrelinhas ganhas decorando hoje (limite diário). */
  readonly decorStars: { readonly day: string; readonly count: number };
  /** Estatísticas (cada uma é um contador por aparelho). */
  readonly stats: Readonly<Record<string, Counter>>;
  /** Já abriu a carta surpresa? */
  readonly letterSeen: boolean;
  readonly updatedAt: number;
  readonly revision: number;
}

export const DEFAULT_SETTINGS: Settings = {
  music: true,
  sfx: true,
  haptics: true,
  snap: true,
};

export function createProfile(now: number): Profile {
  return {
    settings: DEFAULT_SETTINGS,
    tutorialDone: false,
    stars: { earned: {}, spent: {} },
    unlocked: [],
    missions: {},
    achievements: {},
    daily: { lastDay: null, streak: 0 },
    decorStars: { day: '', count: 0 },
    stats: {},
    letterSeen: false,
    updatedAt: now,
    revision: 0,
  };
}

// ------------------------------------------------------------- contadores

export function counterValue(c: Counter | undefined): number {
  if (!c) return 0;
  let total = 0;
  for (const v of Object.values(c)) total += v;
  return total;
}

export function counterAdd(c: Counter | undefined, deviceId: string, n: number): Counter {
  return { ...c, [deviceId]: (c?.[deviceId] ?? 0) + n };
}

export function mergeCounters(a: Counter | undefined, b: Counter | undefined): Counter {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b ?? {})) out[k] = Math.max(out[k] ?? 0, v);
  return out;
}

export function stat(profile: Profile, name: string): number {
  return counterValue(profile.stats[name]);
}

// ------------------------------------------------------------------ mescla

/**
 * Junta o perfil deste aparelho com o do outro (nunca perde progresso).
 * O resultado fica baseado na revisão do servidor (`remote.revision`).
 */
export function mergeProfiles(local: Profile, remote: Profile): Profile {
  const newest = remote.updatedAt > local.updatedAt ? remote : local;

  const missions: Record<string, MissionState> = { ...local.missions };
  for (const [id, m] of Object.entries(remote.missions)) {
    const mine = missions[id];
    missions[id] = mine ? { done: mine.done || m.done, claimed: mine.claimed || m.claimed } : m;
  }

  const achievements: Record<string, number> = { ...local.achievements };
  for (const [id, at] of Object.entries(remote.achievements)) {
    const mine = achievements[id];
    achievements[id] = mine === undefined ? at : Math.min(mine, at);
  }

  const stats: Record<string, Counter> = { ...local.stats };
  for (const [name, c] of Object.entries(remote.stats)) stats[name] = mergeCounters(stats[name], c);

  const daily = mergeDaily(local.daily, remote.daily);
  const decorStars =
    local.decorStars.day === remote.decorStars.day
      ? {
          day: local.decorStars.day,
          count: Math.max(local.decorStars.count, remote.decorStars.count),
        }
      : local.decorStars.day > remote.decorStars.day
        ? local.decorStars
        : remote.decorStars;

  return {
    settings: newest.settings,
    tutorialDone: local.tutorialDone || remote.tutorialDone,
    stars: {
      earned: mergeCounters(local.stars.earned, remote.stars.earned),
      spent: mergeCounters(local.stars.spent, remote.stars.spent),
    },
    unlocked: [...new Set([...local.unlocked, ...remote.unlocked])].sort(),
    missions,
    achievements,
    daily,
    decorStars,
    stats,
    letterSeen: local.letterSeen || remote.letterSeen,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
    revision: remote.revision,
  };
}

function mergeDaily(a: DailyState, b: DailyState): DailyState {
  if (a.lastDay === b.lastDay) return { lastDay: a.lastDay, streak: Math.max(a.streak, b.streak) };
  if (a.lastDay === null) return b;
  if (b.lastDay === null) return a;
  return a.lastDay > b.lastDay ? a : b;
}
