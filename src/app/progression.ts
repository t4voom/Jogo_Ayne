import type { CatalogItem } from '../catalog/types';
import { createLogger } from '../core/log';
import type { RoomId } from '../core/model';
import { counterAdd, type Profile } from '../core/profile';
import { mensagemCarinhosa } from '../content/mensagens';
import {
  ACHIEVEMENT_REWARD,
  achievementViews,
  allAchievementsDone,
  newlyEarnedAchievements,
  type AchievementView,
} from '../progression/achievements';
import { canOpenDaily, openDaily, type DailyReward } from '../progression/daily';
import { dayKey } from '../progression/day';
import {
  MISSIONS,
  missionViews,
  newlyDoneMissions,
  type MissionView,
} from '../progression/missions';
import type { Snapshot } from '../progression/snapshot';
import { balance, earn, earnForDecorating } from '../progression/stars';
import { isItemUnlocked, isRoomUnlocked, unlockItem, unlockRoom } from '../progression/unlocks';
import type { Store, StoreEvent } from '../state/store';

const log = createLogger('progression');

export type ProgressionEvent =
  | {
      readonly type: 'stars';
      readonly amount: number;
      readonly reason: 'decor' | 'mission' | 'achievement' | 'daily';
      readonly at?: { x: number; y: number };
    }
  | { readonly type: 'mission-done'; readonly title: string }
  | { readonly type: 'achievement'; readonly title: string; readonly id: string }
  | { readonly type: 'love'; readonly message: string }
  | { readonly type: 'letter-ready' };

/** A cada quantos itens colocados aparece uma mensagem carinhosa. */
const LOVE_EVERY = 10;

/**
 * Regras de progressão ligadas ao jogo: observa o store (itens colocados,
 * pinturas, cores…), dá estrelinhas, marca missões/conquistas e oferece as
 * ações de gastar estrelinhas. Toda mudança é um `updateProfile` (vai para o
 * IndexedDB e para a planilha como qualquer progresso).
 */
export class Progression {
  private readonly listeners = new Set<(e: ProgressionEvent) => void>();
  private lastLove: string | undefined;
  private evaluating = false;

  constructor(
    private readonly store: Store,
    private readonly deviceId: () => string,
    private readonly now: () => Date = () => new Date(),
    private readonly random: () => number = Math.random,
  ) {}

  on(listener: (e: ProgressionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(e: ProgressionEvent): void {
    for (const l of this.listeners) {
      try {
        l(e);
      } catch (error) {
        log.error('Listener de progressão falhou', error);
      }
    }
  }

  private get profile(): Profile {
    return this.store.getState().profile;
  }

  private snapshot(): Snapshot {
    const s = this.store.getState();
    return { rooms: s.rooms, profile: s.profile };
  }

  private update(fn: (p: Profile) => Profile): void {
    this.store.updateProfile(fn, 'user');
  }

  private today(): string {
    return dayKey(this.now());
  }

  // ------------------------------------------------------------ leitura

  get stars(): number {
    return balance(this.profile);
  }

  isRoomUnlocked(roomId: RoomId): boolean {
    return isRoomUnlocked(this.profile, roomId);
  }

  isItemUnlocked(item: CatalogItem): boolean {
    return isItemUnlocked(this.profile, item);
  }

  missions(): { active: MissionView[]; claimed: MissionView[] } {
    return missionViews(this.snapshot());
  }

  achievements(): AchievementView[] {
    return achievementViews(this.snapshot());
  }

  get dailyAvailable(): boolean {
    return canOpenDaily(this.profile, this.today());
  }

  get letterReady(): boolean {
    return allAchievementsDone(this.snapshot());
  }

  // ------------------------------------------------------------- ações

  unlockRoom(roomId: RoomId): boolean {
    const next = unlockRoom(this.profile, this.deviceId(), roomId);
    if (!next) return false;
    if (next !== this.profile) {
      this.update(() => next);
      this.love();
    }
    return true;
  }

  unlockItem(item: CatalogItem): boolean {
    const next = unlockItem(this.profile, this.deviceId(), item);
    if (!next) return false;
    if (next !== this.profile) this.update(() => next);
    return true;
  }

  claimMission(id: string): number {
    const def = MISSIONS.find((m) => m.id === id);
    const view = this.missions().active.find((v) => v.def.id === id);
    if (!def || !view?.claimable) return 0;
    this.update((p) => ({
      ...earn(p, this.deviceId(), def.reward),
      missions: { ...p.missions, [id]: { done: true, claimed: true } },
    }));
    this.emit({ type: 'stars', amount: def.reward, reason: 'mission' });
    this.love();
    return def.reward;
  }

  openDaily(): DailyReward | null {
    const result = openDaily(this.profile, this.deviceId(), this.today(), this.random);
    if (!result) return null;
    this.update(() => result.profile);
    this.emit({ type: 'stars', amount: result.reward.stars, reason: 'daily' });
    return result.reward;
  }

  markLetterSeen(): void {
    if (!this.profile.letterSeen) this.update((p) => ({ ...p, letterSeen: true }));
  }

  /** Registra uma estatística (ex.: fotos no álbum). */
  count(statName: string, n = 1): void {
    this.update((p) => ({
      ...p,
      stats: { ...p.stats, [statName]: counterAdd(p.stats[statName], this.deviceId(), n) },
    }));
  }

  private love(): void {
    const message = mensagemCarinhosa(this.random, this.lastLove);
    this.lastLove = message;
    this.emit({ type: 'love', message });
  }

  // -------------------------------------------------- observando o jogo

  attach(): () => void {
    return this.store.subscribe((event) => {
      // Fora do laço de eventos do store: evita reentrância.
      queueMicrotask(() => {
        this.handle(event);
      });
    });
  }

  private handle(event: StoreEvent): void {
    if (event.type === 'room' && event.source === 'user' && event.command) {
      const kind = event.command.kind;
      if (kind === 'add') this.onPlaced();
      else if (kind === 'decor') this.count('paints');
      else if (kind === 'color') this.count('colors');
    }
    if (event.type === 'room' || event.type === 'profile') this.evaluate();
  }

  private onPlaced(): void {
    const today = this.today();
    let earned = 0;
    this.update((p) => {
      const r = earnForDecorating(p, this.deviceId(), today);
      earned = r.earned;
      return {
        ...r.profile,
        stats: {
          ...r.profile.stats,
          placed: counterAdd(r.profile.stats['placed'], this.deviceId(), 1),
        },
      };
    });
    if (earned > 0) this.emit({ type: 'stars', amount: earned, reason: 'decor' });
    const placed = Object.values(this.profile.stats['placed'] ?? {}).reduce((a, b) => a + b, 0);
    if (placed % LOVE_EVERY === 0) this.love();
  }

  /** Marca missões cumpridas e conquistas novas. */
  evaluate(): void {
    if (this.evaluating) return;
    this.evaluating = true;
    try {
      const snap = this.snapshot();
      const missions = newlyDoneMissions(snap);
      const achievements = newlyEarnedAchievements(snap);
      if (missions.length === 0 && achievements.length === 0) return;
      const at = this.now().getTime();
      const hadAll = allAchievementsDone(snap);
      this.update((p) => {
        let next: Profile = { ...p, missions: { ...p.missions } };
        for (const m of missions)
          next = {
            ...next,
            missions: { ...next.missions, [m.id]: { done: true, claimed: false } },
          };
        for (const a of achievements)
          next = {
            ...earn(next, this.deviceId(), ACHIEVEMENT_REWARD),
            achievements: { ...next.achievements, [a.id]: at },
          };
        return next;
      });
      for (const m of missions) this.emit({ type: 'mission-done', title: m.title });
      for (const a of achievements) {
        this.emit({ type: 'achievement', title: a.title, id: a.id });
        this.emit({ type: 'stars', amount: ACHIEVEMENT_REWARD, reason: 'achievement' });
      }
      if (!hadAll && allAchievementsDone(this.snapshot())) this.emit({ type: 'letter-ready' });
    } finally {
      this.evaluating = false;
    }
  }
}
