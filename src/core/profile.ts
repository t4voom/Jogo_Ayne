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

/**
 * Junta o perfil deste aparelho com o do outro (nunca perde progresso):
 *  - configurações: vale a mais recente;
 *  - tutorial: visto em qualquer aparelho = visto.
 * O resultado fica baseado na revisão do servidor.
 */
export function mergeProfiles(local: Profile, remote: Profile): Profile {
  const newest = remote.updatedAt > local.updatedAt ? remote : local;
  return {
    settings: newest.settings,
    tutorialDone: local.tutorialDone || remote.tutorialDone,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
    revision: remote.revision,
  };
}
