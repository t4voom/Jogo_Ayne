import type { Cloud } from '../persistence/cloud';
import type { SyncSnapshot, SyncStatus } from '../persistence/sync-engine';
import { h, icon } from './dom';
import { relativeTime } from './format';
import type { IconName } from './icons';
import { signOut } from './account';
import { openSheet } from './sheet';

const LOOK: Record<
  Exclude<SyncStatus, 'disabled'>,
  { icon: IconName; label: string; text: string }
> = {
  synced: {
    icon: 'cloudCheck',
    label: 'Salvo',
    text: 'Tudo salvo no aparelho e na nuvem. O castelo está igual no tablet e no celular.',
  },
  syncing: {
    icon: 'sync',
    label: 'Salvando…',
    text: 'Guardando as últimas mudanças na nuvem…',
  },
  offline: {
    icon: 'cloudOff',
    label: 'Sem internet',
    text: 'Sem internet agora, mas está tudo salvo neste aparelho. Assim que a conexão voltar, eu sincronizo sozinha.',
  },
  error: {
    icon: 'alert',
    label: 'Erro ao sincronizar',
    text: 'Não consegui falar com a planilha. Está tudo salvo neste aparelho; vou tentar de novo.',
  },
  'needs-login': {
    icon: 'key',
    label: 'Entre de novo',
    text: 'Sua sessão terminou (a senha pode ter sido trocada em outro aparelho). Está tudo salvo aqui; entre de novo para voltar a sincronizar.',
  },
};

/** Pílula discreta no topo: nuvem ✓, setinhas girando, nuvem cinza ou alerta. */
export function createSyncIndicator(
  cloud: Cloud,
  saveNow: () => Promise<void>,
): { el: HTMLElement; destroy: () => void } {
  const button = h('button', { class: 'sync-pill', attrs: { type: 'button' } });
  const render = (s: SyncSnapshot) => {
    // Sem planilha (só neste aparelho): nada a mostrar.
    if (s.status === 'disabled') {
      button.hidden = true;
      return;
    }
    button.hidden = false;
    const look = LOOK[s.status];
    button.dataset['status'] = s.status;
    button.replaceChildren(
      icon(look.icon, 'icon sync-icon'),
      h('span', { class: 'sync-label', text: look.label }),
    );
    const extra = s.pending > 0 ? ` · ${s.pending} pendente${s.pending > 1 ? 's' : ''}` : '';
    button.setAttribute('aria-label', `Sincronização: ${look.label}${extra}. Toque para detalhes.`);
    button.title = look.label;
  };
  button.addEventListener('click', () => {
    openSyncDetails(cloud, saveNow);
  });
  const unsubscribe = cloud.engine.subscribe(render);
  return { el: button, destroy: unsubscribe };
}

export function openSyncDetails(cloud: Cloud, saveNow: () => Promise<void>): void {
  openSheet(
    (close) => {
      const body = h('div', { class: 'sync-details' });
      const render = (s: SyncSnapshot) => {
        if (s.status === 'disabled') {
          body.replaceChildren(
            h('h2', { class: 'sheet-title', text: 'Salvo neste aparelho' }),
            h('p', {
              class: 'sheet-text',
              text: 'A sincronização com a planilha não está ligada. Tudo fica guardado neste aparelho.',
            }),
          );
          return;
        }
        const look = LOOK[s.status];
        const meta: string[] = [];
        if (s.lastSyncAt) meta.push(`Última sincronização: ${relativeTime(s.lastSyncAt)}`);
        if (s.pending > 0)
          meta.push(`${s.pending} mudança${s.pending > 1 ? 's' : ''} esperando para subir`);
        const parts: HTMLElement[] = [
          h(
            'div',
            { class: `sync-hero is-${s.status}`, attrs: { 'aria-hidden': 'true' } },
            icon(look.icon),
          ),
          h('h2', { class: 'sheet-title', text: look.label }),
          h('p', { class: 'sheet-text', text: look.text }),
        ];
        if (meta.length) parts.push(h('p', { class: 'sync-meta', text: meta.join(' · ') }));
        if (s.lastError && s.status !== 'synced')
          parts.push(h('p', { class: 'sync-error', text: s.lastError }));
        body.replaceChildren(
          ...parts,
          h(
            'div',
            { class: 'sheet-actions' },
            s.status === 'needs-login'
              ? h(
                  'button',
                  {
                    class: 'btn btn-primary',
                    attrs: { type: 'button' },
                    on: {
                      click: () => {
                        close();
                        void signOut(cloud, saveNow, { ask: false });
                      },
                    },
                  },
                  icon('key'),
                  'Entrar de novo',
                )
              : h(
                  'button',
                  {
                    class: 'btn btn-primary',
                    attrs: { type: 'button' },
                    on: {
                      click: () => {
                        void cloud.engine.pull().then(() => cloud.engine.retryNow());
                      },
                    },
                  },
                  icon('sync'),
                  'Tentar de novo',
                ),
            h('button', {
              class: 'btn btn-secondary',
              text: 'Fechar',
              attrs: { type: 'button' },
              on: { click: close },
            }),
          ),
        );
      };
      const unsubscribe = cloud.engine.subscribe(render);
      body.addEventListener('sheet-closed', unsubscribe, { once: true });
      return body;
    },
    { label: 'Sincronização' },
  );
}
