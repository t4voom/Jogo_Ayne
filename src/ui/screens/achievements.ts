import { MISSIONS, type MissionView } from '../../progression/missions';
import type { AchievementView } from '../../progression/achievements';
import { confetti } from '../../fx/confetti';
import type { GameContext } from '../context';
import { h, icon, iconButton } from '../dom';
import { dateTime } from '../format';
import { openDailyGift } from '../daily-gift';
import { ICONS, type IconName } from '../icons';
import { openLetter } from '../letter';
import { medalSvg } from '../medal';
import type { Screen } from '../router';
import { createStarsPill } from '../stars-pill';
import '../styles/progression.css';

const iconOf = (name: string): IconName => (name in ICONS ? (name as IconName) : 'star');

export function createAchievementsScreen(ctx: GameContext): Screen {
  const p = ctx.progression;
  const pill = createStarsPill(ctx.store, p);
  const body = h('div', { class: 'ach-scroll' });

  const missionCard = (v: MissionView) => {
    const pct = Math.round((v.progress.value / v.progress.goal) * 100);
    return h(
      'article',
      { class: `mission ${v.claimable ? 'is-ready' : ''}`.trim() },
      h('span', { class: 'mission-icon' }, icon(iconOf(v.def.icon))),
      h(
        'div',
        { class: 'mission-body' },
        h('h3', { class: 'mission-title', text: v.def.title }),
        h('p', { class: 'mission-desc', text: v.def.description }),
        h(
          'div',
          {
            class: 'mission-bar',
            attrs: {
              role: 'progressbar',
              'aria-valuemin': 0,
              'aria-valuemax': v.progress.goal,
              'aria-valuenow': v.progress.value,
              'aria-label': `Progresso: ${v.progress.value} de ${v.progress.goal}`,
            },
          },
          h('span', { style: { width: `${pct}%` } }),
        ),
      ),
      v.claimable
        ? h(
            'button',
            {
              class: 'btn btn-primary mission-claim',
              attrs: { type: 'button' },
              on: {
                click: (e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.disabled = true;
                  const got = p.claimMission(v.def.id);
                  if (got > 0) {
                    confetti({ count: 40 });
                    ctx.haptics.play('success');
                    ctx.sound.play('chest');
                  }
                  render();
                },
              },
            },
            icon('starFill'),
            `+${v.def.reward}`,
          )
        : h('span', { class: 'mission-reward' }, icon('starFill', 'icon'), String(v.def.reward)),
    );
  };

  const medal = (v: AchievementView) => {
    const unlocked = v.unlockedAt !== null;
    return h(
      'article',
      {
        class: `medal ${unlocked ? 'is-unlocked' : ''}`.trim(),
        attrs: { 'aria-label': `${v.def.title}: ${unlocked ? 'conquistada' : 'ainda não'}` },
      },
      h('span', { class: 'medal-art', html: medalSvg(v.def.tone, v.def.icon, unlocked) }),
      h('h3', { class: 'medal-title', text: v.def.title }),
      h('p', { class: 'medal-desc', text: v.def.description }),
      v.unlockedAt !== null
        ? h('p', { class: 'medal-date', text: dateTime(v.unlockedAt) })
        : h('p', { class: 'medal-progress', text: `${v.progress.value} / ${v.progress.goal}` }),
    );
  };

  function render(): void {
    const missions = p.missions();
    const achievements = p.achievements();
    const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length;
    const sections: HTMLElement[] = [];
    if (p.letterReady) {
      sections.push(
        h(
          'button',
          {
            class: 'letter-card',
            attrs: { type: 'button' },
            on: {
              click: () => {
                openLetter(() => {
                  p.markLetterSeen();
                });
              },
            },
          },
          h('span', { class: 'letter-card-env', text: '💌' }),
          h(
            'span',
            { class: 'letter-card-text' },
            h('strong', { text: 'Uma carta para você' }),
            h('small', { text: 'Você completou todas as conquistas!' }),
          ),
        ),
      );
    }
    if (p.dailyAvailable) {
      sections.push(
        h(
          'button',
          {
            class: 'daily-card',
            attrs: { type: 'button' },
            on: {
              click: () => {
                openDailyGift(p, render, () => {
                  ctx.sound.play('chest');
                });
              },
            },
          },
          icon('gift', 'icon daily-icon'),
          h(
            'span',
            { class: 'letter-card-text' },
            h('strong', { text: 'Presente do dia disponível!' }),
            h('small', { text: 'Toque para abrir o baú surpresa' }),
          ),
        ),
      );
    }
    sections.push(
      h(
        'section',
        { class: 'ach-section' },
        h('h2', {
          class: 'set-title',
          text: `Missões · ${missions.claimed.length} de ${MISSIONS.length}`,
        }),
        missions.active.length
          ? h('div', { class: 'missions' }, ...missions.active.map(missionCard))
          : h('p', {
              class: 'set-note',
              text: 'Todas as missões cumpridas! Que princesa dedicada 👑',
            }),
      ),
      h(
        'section',
        { class: 'ach-section' },
        h('h2', {
          class: 'set-title',
          text: `Medalhas · ${unlockedCount} de ${achievements.length}`,
        }),
        h('div', { class: 'medals' }, ...achievements.map(medal)),
      ),
    );
    const scroll = body.scrollTop;
    body.replaceChildren(...sections);
    body.scrollTop = scroll;
  }
  render();
  const unsubscribe = ctx.store.subscribe((e) => {
    if (e.type === 'profile') render();
  });

  const el = h(
    'div',
    { class: 'achievements-screen' },
    h(
      'header',
      { class: 'map-top' },
      iconButton('back', 'Voltar', () => {
        ctx.router.back({ name: 'map' });
      }),
      h('h1', { class: 'map-title title-display', text: 'Conquistas' }),
      h('div', { class: 'map-top-actions' }, pill.el),
    ),
    body,
  );
  return {
    el,
    destroy() {
      unsubscribe();
      pill.destroy();
      el.remove();
    },
  };
}
