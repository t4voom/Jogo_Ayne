import { getItem } from '../../catalog/items';
import { CATEGORIES, ROOM_IDS, type RoomId } from '../../core/model';
import type { Settings } from '../../core/profile';
import { roomInfo } from '../../core/rooms';
import { parseRoom, serializeRoom } from '../../core/save';
import type { BackupRecord } from '../../persistence/local-repository';
import { composeRoomSvg } from '../../render/compose';
import { openChangePassword, signOut } from '../account';
import type { GameContext } from '../context';
import { h, icon, iconButton } from '../dom';
import { dateTime } from '../format';
import type { IconName } from '../icons';
import type { Screen } from '../router';
import { confirmSheet } from '../sheet';
import { createSyncIndicator } from '../sync-indicator';
import '../styles/settings.css';

const REASON_LABEL: Record<BackupRecord['reason'], string> = {
  conflict: 'Versão do outro aparelho',
  manual: 'Antes de restaurar',
  corrupt: 'Recuperada de um probleminha',
  'future-version': 'De uma versão mais nova do jogo',
};

const TOGGLES: readonly { key: keyof Settings; label: string; hint: string; icon: IconName }[] = [
  { key: 'music', label: 'Música', hint: 'Caixinha de música de fundo', icon: 'music' },
  { key: 'sfx', label: 'Efeitos sonoros', hint: 'Pop, brilhinhos e sininhos', icon: 'volume' },
  { key: 'haptics', label: 'Vibração', hint: 'Toque leve em ações importantes', icon: 'vibrate' },
  {
    key: 'snap',
    label: 'Ímã de alinhamento',
    hint: 'Itens se alinham sozinhos ao arrastar',
    icon: 'magnet',
  },
];

export async function createSettingsScreen(ctx: GameContext): Promise<Screen> {
  await ctx.art.loadMany(CATEGORIES);
  const cleanups: (() => void)[] = [];

  // ------------------------------------------------------------ sons/toque
  const toggleRows = TOGGLES.map((t) => {
    const sw = h(
      'button',
      {
        class: 'switch',
        attrs: { type: 'button', role: 'switch', 'aria-checked': 'false', 'aria-label': t.label },
        on: {
          click: () => {
            const current = ctx.store.getState().profile.settings[t.key];
            ctx.store.updateProfile((p) => ({
              ...p,
              settings: { ...p.settings, [t.key]: !current },
            }));
            ctx.haptics.play('light');
          },
        },
      },
      h('span', { class: 'switch-knob' }),
    );
    const row = h(
      'div',
      { class: 'set-row' },
      h('span', { class: 'set-icon' }, icon(t.icon)),
      h(
        'span',
        { class: 'set-text' },
        h('strong', { text: t.label }),
        h('small', { text: t.hint }),
      ),
      sw,
    );
    return { key: t.key, sw, row };
  });
  const syncToggles = () => {
    const s = ctx.store.getState().profile.settings;
    for (const t of toggleRows) t.sw.setAttribute('aria-checked', String(s[t.key]));
  };
  syncToggles();
  cleanups.push(
    ctx.store.subscribe((e) => {
      if (e.type === 'profile') syncToggles();
    }),
  );

  // ------------------------------------------------------------- nuvem
  const cloudBox = h('div', { class: 'set-card' });
  const renderCloud = () => {
    const cloud = ctx.cloud;
    if (!cloud.enabled) {
      cloudBox.replaceChildren(
        h('p', {
          class: 'set-note',
          text: 'A sincronização com a planilha não está ligada neste site. Tudo fica salvo neste aparelho.',
        }),
      );
      return;
    }
    const indicator = createSyncIndicator(cloud, ctx.saveNow);
    cleanups.push(indicator.destroy);
    cloudBox.replaceChildren(
      h(
        'div',
        { class: 'set-row' },
        h('span', { class: 'set-icon' }, icon('user')),
        h(
          'span',
          { class: 'set-text' },
          h('strong', { text: cloud.session?.nome ?? 'Conta' }),
          h('small', { text: 'Conta deste castelo' }),
        ),
        h('button', {
          class: 'btn btn-secondary set-btn',
          text: 'Sair',
          attrs: { type: 'button', 'aria-label': 'Sair da conta' },
          on: {
            click: () => {
              void signOut(cloud, ctx.saveNow);
            },
          },
        }),
      ),
      h(
        'div',
        { class: 'set-row' },
        h('span', { class: 'set-icon' }, icon('key')),
        h(
          'span',
          { class: 'set-text' },
          h('strong', { text: 'Senha' }),
          h('small', { text: 'Troque quando quiser' }),
        ),
        h('button', {
          class: 'btn btn-secondary set-btn',
          text: 'Trocar',
          attrs: { type: 'button', 'aria-label': 'Trocar senha' },
          on: {
            click: () => {
              openChangePassword(cloud, ctx.toast);
            },
          },
        }),
      ),
      h(
        'div',
        { class: 'set-row' },
        h('span', { class: 'set-text' }, h('strong', { text: 'Sincronização' })),
        indicator.el,
      ),
      h(
        'button',
        {
          class: 'btn btn-secondary set-wide',
          attrs: { type: 'button' },
          on: {
            click: () => {
              void cloud.engine.pull().then(() => cloud.engine.retryNow());
              ctx.toast.show('Sincronizando…', { icon: 'sync' });
            },
          },
        },
        icon('sync'),
        'Sincronizar agora',
      ),
    );
  };
  renderCloud();

  // ------------------------------------------------- versões anteriores
  const backupsBox = h('div', { class: 'set-card set-backups' });
  const renderBackups = async () => {
    const all = ctx.repo ? await ctx.repo.listBackups() : [];
    const rooms = all.filter(
      (b) => b.kind === 'room' && (ROOM_IDS as readonly string[]).includes(b.key),
    );
    if (rooms.length === 0) {
      backupsBox.replaceChildren(
        h('p', {
          class: 'set-note',
          text: 'Nenhuma versão anterior guardada. Se um dia os dois aparelhos mexerem no mesmo cômodo ao mesmo tempo, a versão que não ficou aparece aqui para você restaurar.',
        }),
      );
      return;
    }
    backupsBox.replaceChildren(
      ...rooms.map((b) => {
        let preview: string;
        let count = 0;
        try {
          const room = parseRoom(b.data);
          count = room.items.length;
          preview = composeRoomSvg(room, ctx.art, getItem);
        } catch {
          preview = '';
        }
        const info = roomInfo(b.key as RoomId);
        return h(
          'div',
          { class: 'backup' },
          h('span', { class: 'backup-thumb', html: preview }),
          h(
            'span',
            { class: 'set-text' },
            h('strong', { text: `${info.emoji} ${info.name}` }),
            h('small', {
              text: `${REASON_LABEL[b.reason]} · ${dateTime(b.savedAt)} · ${count} itens`,
            }),
          ),
          h('button', {
            class: 'btn btn-secondary set-btn',
            text: 'Restaurar',
            attrs: { type: 'button', disabled: preview === '' },
            on: {
              click: () => {
                void restore(b);
              },
            },
          }),
        );
      }),
    );
  };

  const restore = async (b: BackupRecord) => {
    const roomId = b.key as RoomId;
    const ok = await confirmSheet({
      title: 'Restaurar esta versão?',
      message: `O ${roomInfo(roomId).name} vai voltar a ficar como nesta versão. A versão de agora também fica guardada aqui, por segurança.`,
      confirm: 'Restaurar',
    });
    if (!ok) return;
    const current = ctx.ensureRoom(roomId);
    await ctx.repo?.addBackup({
      kind: 'room',
      key: roomId,
      reason: 'manual',
      data: serializeRoom(current),
    });
    const restored = parseRoom(b.data);
    ctx.store.replaceRoom(
      { ...restored, revision: current.revision, updatedAt: Date.now() },
      'restore',
    );
    if (b.id !== undefined) await ctx.repo?.deleteBackup(b.id);
    await ctx.repo?.pruneBackups(6);
    ctx.toast.show('Versão restaurada ✨', { icon: 'restore', tone: 'love' });
    await renderBackups();
  };
  await renderBackups();

  // --------------------------------------------------------------- tela
  const section = (title: string, ...children: HTMLElement[]) =>
    h(
      'section',
      { class: 'set-section' },
      h('h2', { class: 'set-title', text: title }),
      ...children,
    );

  const el = h(
    'div',
    { class: 'settings-screen' },
    h(
      'header',
      { class: 'map-top' },
      iconButton('back', 'Voltar', () => {
        ctx.router.back({ name: 'map' });
      }),
      h('h1', { class: 'map-title title-display', text: 'Configurações' }),
      h('div', { class: 'map-top-actions' }),
    ),
    h(
      'div',
      { class: 'set-scroll' },
      section('Sons e toque', h('div', { class: 'set-card' }, ...toggleRows.map((t) => t.row))),
      section('Conta e nuvem', cloudBox),
      section('Versões anteriores', backupsBox),
      section(
        'Créditos',
        h(
          'div',
          { class: 'set-card set-credits' },
          h('p', {
            class: 'credits-love',
            text: 'Feito com 💖 pelo Gustavo, para a Princesa Ayne.',
          }),
          h('p', { text: 'Arte, música e código originais, desenhados à mão em SVG e Web Audio.' }),
          h('p', { text: 'Fontes: Dancing Script e Nunito (SIL Open Font License).' }),
          h('p', { class: 'set-note', text: `Versão ${__APP_VERSION__}` }),
        ),
      ),
    ),
  );

  return {
    el,
    destroy() {
      for (const fn of cleanups) fn();
      el.remove();
    },
  };
}
