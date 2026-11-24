/**
 * Perfil da jogadora: preferências e progresso que valem para o castelo todo.
 * (Os campos de progressão chegam na fase 5 via migração de schema.)
 */

export interface Settings {
  readonly music: boolean;
  readonly sfx: boolean;
  readonly haptics: boolean;
  /** "Ímã": encaixar itens nas guias e no chão/parede. */
  readonly snap: boolean;
}

export interface Profile {
  readonly settings: Settings;
  readonly tutorialDone: boolean;
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
  return { settings: DEFAULT_SETTINGS, tutorialDone: false, updatedAt: now, revision: 0 };
}
