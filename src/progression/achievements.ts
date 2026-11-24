import { ROOM_IDS } from '../core/model';
import { stat } from '../core/profile';
import { ITEMS } from '../catalog/items';
import { MISSIONS } from './missions';
import {
  allItems,
  countCategory,
  isComplete,
  itemsIn,
  progress,
  type Progress,
  type Snapshot,
} from './snapshot';

export interface AchievementDef {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  /** Cor da medalha. */
  readonly tone: 'rosa' | 'lilas' | 'azul' | 'menta' | 'dourado' | 'perola';
  readonly progress: (s: Snapshot) => Progress;
}

export const ACHIEVEMENT_REWARD = 10;

const unlockedItems = (s: Snapshot) =>
  s.profile.unlocked.filter((id) => ITEMS.some((i) => i.id === id)).length;
const unlockedRooms = (s: Snapshot) =>
  ROOM_IDS.filter((r) => s.profile.unlocked.includes(r)).length;
const LOCKED_ROOMS = 5;

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'primeiro-item',
    title: 'Primeiro toque',
    description: 'Coloque o primeiro item.',
    icon: 'sparkle',
    tone: 'rosa',
    progress: (s) => progress(stat(s.profile, 'placed'), 1),
  },
  {
    id: 'decoradora',
    title: 'Decoradora',
    description: 'Coloque 30 itens.',
    icon: 'sofa',
    tone: 'lilas',
    progress: (s) => progress(stat(s.profile, 'placed'), 30),
  },
  {
    id: 'designer-real',
    title: 'Designer real',
    description: 'Coloque 150 itens.',
    icon: 'castle',
    tone: 'dourado',
    progress: (s) => progress(stat(s.profile, 'placed'), 150),
  },
  {
    id: 'pintora',
    title: 'Pintora do reino',
    description: 'Pinte paredes, chãos ou o castelo 15 vezes.',
    icon: 'brush',
    tone: 'azul',
    progress: (s) => progress(stat(s.profile, 'paints'), 15),
  },
  {
    id: 'mestre-cores',
    title: 'Mestre das cores',
    description: 'Troque a cor de itens 20 vezes.',
    icon: 'palette',
    tone: 'menta',
    progress: (s) => progress(stat(s.profile, 'colors'), 20),
  },
  {
    id: 'colecionadora',
    title: 'Colecionadora',
    description: 'Libere 15 itens com estrelinhas.',
    icon: 'gift',
    tone: 'rosa',
    progress: (s) => progress(unlockedItems(s), 15),
  },
  {
    id: 'castelo-aberto',
    title: 'Dona do castelo',
    description: 'Abra todos os cômodos.',
    icon: 'key',
    tone: 'dourado',
    progress: (s) => progress(unlockedRooms(s), LOCKED_ROOMS),
  },
  {
    id: 'fotografa',
    title: 'Fotógrafa real',
    description: 'Tire 5 fotos para o álbum.',
    icon: 'camera',
    tone: 'lilas',
    progress: (s) => progress(stat(s.profile, 'photos'), 5),
  },
  {
    id: 'amiga-bichos',
    title: 'Amiga dos bichinhos',
    description: 'Tenha 6 bichinhos diferentes no castelo.',
    icon: 'paw',
    tone: 'perola',
    progress: (s) =>
      progress(
        new Set(
          allItems(s)
            .filter((i) => ITEMS.find((c) => c.id === i.itemId)?.category === 'bichinhos')
            .map((i) => i.itemId),
        ).size,
        6,
      ),
  },
  {
    id: 'jardineira',
    title: 'Mão de jardineira',
    description: 'Tenha 20 plantas no castelo.',
    icon: 'flowerIcon',
    tone: 'menta',
    progress: (s) => progress(countCategory(allItems(s), 'plantas'), 20),
  },
  {
    id: 'noturna',
    title: 'Encanto da noite',
    description: 'Deixe 3 cômodos com luz de noite.',
    icon: 'moon',
    tone: 'azul',
    progress: (s) =>
      progress(Object.values(s.rooms).filter((r) => r.ambience === 'noite').length, 3),
  },
  {
    id: 'fiel',
    title: 'Visita fiel',
    description: 'Abra o presente 7 dias seguidos.',
    icon: 'heart',
    tone: 'rosa',
    progress: (s) => progress(s.profile.daily.streak, 7),
  },
  {
    id: 'presenteada',
    title: 'Presenteada',
    description: 'Abra 10 presentes diários.',
    icon: 'gift',
    tone: 'lilas',
    progress: (s) => progress(stat(s.profile, 'gifts'), 10),
  },
  {
    id: 'missoes',
    title: 'Missão cumprida',
    description: 'Complete todas as missões.',
    icon: 'trophy',
    tone: 'dourado',
    progress: (s) =>
      progress(MISSIONS.filter((m) => s.profile.missions[m.id]?.claimed).length, MISSIONS.length),
  },
  {
    id: 'arquiteta',
    title: 'Arquiteta real',
    description: 'Decore os 8 cômodos com pelo menos 6 itens cada.',
    icon: 'star',
    tone: 'perola',
    progress: (s) =>
      progress(ROOM_IDS.filter((r) => itemsIn(s, r).length >= 6).length, ROOM_IDS.length),
  },
];

export interface AchievementView {
  readonly def: AchievementDef;
  readonly progress: Progress;
  readonly unlockedAt: number | null;
}

export function achievementViews(s: Snapshot): AchievementView[] {
  return ACHIEVEMENTS.map((def) => {
    const at = s.profile.achievements[def.id];
    const p = def.progress(s);
    return {
      def,
      progress: at === undefined ? p : { value: p.goal, goal: p.goal },
      unlockedAt: at ?? null,
    };
  });
}

export function newlyEarnedAchievements(s: Snapshot): AchievementDef[] {
  return ACHIEVEMENTS.filter(
    (a) => s.profile.achievements[a.id] === undefined && isComplete(a.progress(s)),
  );
}

export function allAchievementsDone(s: Snapshot): boolean {
  return ACHIEVEMENTS.every((a) => s.profile.achievements[a.id] !== undefined);
}
