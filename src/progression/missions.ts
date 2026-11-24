import { COLOR_VARIANTS, ROOM_IDS, type RoomId } from '../core/model';
import { stat } from '../core/profile';
import {
  allItems,
  countCategory,
  hasAny,
  isComplete,
  itemsIn,
  progress,
  type Progress,
  type Snapshot,
} from './snapshot';

export interface MissionDef {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly reward: number;
  readonly icon: string;
  readonly progress: (s: Snapshot) => Progress;
}

const roomWith = (roomId: RoomId, ids: readonly (readonly string[])[]) => (s: Snapshot) =>
  progress(ids.filter((alts) => hasAny(s, roomId, alts)).length, ids.length);

/** Missões curtas, em ordem: 3 ficam ativas por vez. */
export const MISSIONS: readonly MissionDef[] = [
  {
    id: 'cama-quarto',
    title: 'Uma cama de princesa',
    description: 'Coloque uma cama no Quarto da Princesa.',
    reward: 5,
    icon: 'sofa',
    progress: roomWith('quarto', [['cama-dossel', 'berco']]),
  },
  {
    id: 'pintar-quarto',
    title: 'Paredes novas',
    description: 'Pinte a parede do quarto de outro jeito (cor ou padrão).',
    reward: 5,
    icon: 'brush',
    progress: (s) => {
      const d = s.rooms.quarto?.decor;
      const changed =
        d?.kind === 'interior' && (d.wallColor !== 'rosa' || d.wallPattern !== 'listras');
      return progress(changed ? 1 : 0, 1);
    },
  },
  {
    id: 'bichinho',
    title: 'Um amiguinho',
    description: 'Coloque um bichinho em qualquer cômodo.',
    reward: 5,
    icon: 'paw',
    progress: (s) => progress(countCategory(allItems(s), 'bichinhos') > 0 ? 1 : 0, 1),
  },
  {
    id: 'lilas-quarto',
    title: 'Sonho lilás',
    description: 'Decore o quarto com 3 itens lilás.',
    reward: 8,
    icon: 'palette',
    progress: (s) => progress(itemsIn(s, 'quarto').filter((i) => i.color === 'lilas').length, 3),
  },
  {
    id: 'noite',
    title: 'Noite estrelada',
    description: 'Deixe um cômodo com luz de noite.',
    reward: 5,
    icon: 'moon',
    progress: (s) =>
      progress(Object.values(s.rooms).some((r) => r.ambience === 'noite') ? 1 : 0, 1),
  },
  {
    id: 'trono-majestoso',
    title: 'Sala majestosa',
    description: 'Na Sala do Trono: um trono, um lustre e um tapete.',
    reward: 10,
    icon: 'castle',
    progress: roomWith('trono', [
      ['trono'],
      ['lustre-cristal'],
      ['tapete-redondo', 'tapete-retangular', 'tapete-coracao'],
    ]),
  },
  {
    id: 'primeira-foto',
    title: 'Clique!',
    description: 'Tire a primeira foto para o álbum.',
    reward: 5,
    icon: 'camera',
    progress: (s) => progress(stat(s.profile, 'photos'), 1),
  },
  {
    id: 'cha-da-tarde',
    title: 'Chá da tarde',
    description: 'Mesa de chá e jogo de chá no mesmo cômodo.',
    reward: 8,
    icon: 'heart',
    progress: (s) =>
      progress(
        ROOM_IDS.some((r) => hasAny(s, r, ['mesa-cha']) && hasAny(s, r, ['jogo-cha'])) ? 1 : 0,
        1,
      ),
  },
  {
    id: 'fachada-encantada',
    title: 'Entrada de conto de fadas',
    description: 'Coloque a fonte ou a carruagem na Fachada do Castelo.',
    reward: 8,
    icon: 'sparkle',
    progress: roomWith('fachada', [['fonte', 'carruagem']]),
  },
  {
    id: 'lustre-baile',
    title: 'Brilho no salão',
    description: 'Coloque um lustre no Salão de Baile.',
    reward: 8,
    icon: 'lamp',
    progress: roomWith('baile', [['lustre-cristal']]),
  },
  {
    id: 'banheiro-spa',
    title: 'Banho de rainha',
    description: 'No Banheiro Real: banheira, velas e uma planta.',
    reward: 10,
    icon: 'sparkle',
    progress: (s) =>
      progress(
        [
          hasAny(s, 'banheiro', ['banheira']),
          hasAny(s, 'banheiro', ['velas', 'castical']),
          countCategory(itemsIn(s, 'banheiro'), 'plantas') > 0,
        ].filter(Boolean).length,
        3,
      ),
  },
  {
    id: 'cozinha-doce',
    title: 'Confeitaria real',
    description: 'Coloque um bolo ou uma bandeja de docinhos na Cozinha.',
    reward: 8,
    icon: 'heart',
    progress: roomWith('cozinha', [['bolo', 'bandeja-doces']]),
  },
  {
    id: 'tres-pets',
    title: 'Família de bichinhos',
    description: 'Coloque bichinhos em 3 cômodos diferentes.',
    reward: 10,
    icon: 'paw',
    progress: (s) =>
      progress(ROOM_IDS.filter((r) => countCategory(itemsIn(s, r), 'bichinhos') > 0).length, 3),
  },
  {
    id: 'closet-rainha',
    title: 'Closet de rainha',
    description: 'No Closet: manequim, espelho de corpo inteiro e sapateira.',
    reward: 10,
    icon: 'heart',
    progress: roomWith('closet', [['manequim'], ['espelho-chao'], ['sapateira']]),
  },
  {
    id: 'jardim-florido',
    title: 'Jardim florido',
    description: 'Coloque 5 plantas no Jardim Encantado.',
    reward: 12,
    icon: 'flowerIcon',
    progress: (s) => progress(countCategory(itemsIn(s, 'jardim'), 'plantas'), 5),
  },
  {
    id: 'comodo-caprichado',
    title: 'Cômodo caprichado',
    description: 'Deixe um cômodo com 12 itens.',
    reward: 10,
    icon: 'star',
    progress: (s) =>
      progress(Math.max(0, ...Object.values(s.rooms).map((r) => r.items.length)), 12),
  },
  {
    id: 'todas-cores',
    title: 'Arco-íris de cores',
    description: 'Use as 6 cores em itens do castelo.',
    reward: 12,
    icon: 'palette',
    progress: (s) => progress(new Set(allItems(s).map((i) => i.color)).size, COLOR_VARIANTS.length),
  },
];

export const ACTIVE_MISSIONS = 3;

export interface MissionView {
  readonly def: MissionDef;
  readonly progress: Progress;
  /** pronta para receber as estrelinhas */
  readonly claimable: boolean;
  readonly claimed: boolean;
}

export function missionViews(s: Snapshot): { active: MissionView[]; claimed: MissionView[] } {
  const views = MISSIONS.map((def) => {
    const state = s.profile.missions[def.id];
    const p = def.progress(s);
    const done = (state?.done ?? false) || isComplete(p);
    return {
      def,
      progress: done ? { value: p.goal, goal: p.goal } : p,
      claimable: done && !state?.claimed,
      claimed: state?.claimed ?? false,
    };
  });
  return {
    active: views.filter((v) => !v.claimed).slice(0, ACTIVE_MISSIONS),
    claimed: views.filter((v) => v.claimed),
  };
}

/** Marca como feitas as missões ativas que acabaram de ser cumpridas. */
export function newlyDoneMissions(s: Snapshot): MissionDef[] {
  return missionViews(s)
    .active.filter((v) => v.claimable && !s.profile.missions[v.def.id]?.done)
    .map((v) => v.def);
}
