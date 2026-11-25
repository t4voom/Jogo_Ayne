import { passwordProblem } from '../core/account';
import type { Cloud } from '../persistence/cloud';
import { h, icon } from './dom';
import { confirmSheet, openSheet } from './sheet';
import type { Toaster } from './toast';
import './styles/auth.css';

/** Recarrega o app na tela de entrar (sem o caminho da tela atual). */
function reloadToStart(): void {
  location.replace(`${location.pathname}${location.search}`);
}

/**
 * Sai da conta neste aparelho. Antes, grava o que falta no aparelho e tenta
 * subir para a planilha; o que não subir fica guardado no banco desta conta
 * e sobe quando ela entrar de novo aqui.
 */
export async function signOut(
  cloud: Cloud,
  saveNow: () => Promise<void>,
  options: { ask: boolean } = { ask: true },
): Promise<void> {
  if (options.ask) {
    const pending = cloud.engine.state.pending;
    const ok = await confirmSheet({
      title: 'Sair da conta?',
      message:
        pending > 0
          ? `Ainda ${pending > 1 ? `há ${pending} mudanças` : 'há 1 mudança'} esperando para subir. Fica tudo guardado neste aparelho e sobe quando você entrar de novo aqui.`
          : 'O seu castelo fica guardado na planilha e neste aparelho. Para voltar, é só entrar com seu usuário e senha.',
      confirm: 'Sair',
      cancel: 'Ficar',
    });
    if (!ok) return;
  }
  await saveNow();
  cloud.logout();
  reloadToStart();
}

/** Folha "Trocar senha" (pede a atual; os outros aparelhos entram de novo). */
export function openChangePassword(cloud: Cloud, toast: Toaster): void {
  openSheet(
    (close) => {
      const mk = (label: string, autocomplete: string) => {
        const id = `pw-${autocomplete}`;
        const input = h('input', {
          id,
          class: 'auth-input',
          attrs: { type: 'password', autocomplete, maxlength: 64, required: true },
        });
        const wrap = h(
          'div',
          { class: 'auth-field' },
          h('label', { class: 'auth-label', text: label, attrs: { for: id } }),
          h('div', { class: 'auth-control' }, input),
        );
        return { input, wrap };
      };
      const current = mk('Senha atual', 'current-password');
      const next = mk('Senha nova', 'new-password');
      const error = h('p', { class: 'auth-error', attrs: { role: 'alert' } });
      const submit = h(
        'button',
        { class: 'btn btn-primary auth-submit', attrs: { type: 'submit' } },
        icon('key'),
        h('span', { text: 'Trocar senha' }),
      );
      const form = h(
        'form',
        { class: 'auth-sheet', attrs: { novalidate: true } },
        h('h2', { class: 'sheet-title', text: 'Trocar senha' }),
        h('p', {
          class: 'sheet-text',
          text: 'Nos outros aparelhos, vai ser preciso entrar de novo com a senha nova.',
        }),
        current.wrap,
        next.wrap,
        error,
        submit,
      );
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (submit.disabled) return;
        const problem =
          current.input.value.length === 0
            ? 'Digite a senha atual.'
            : passwordProblem(next.input.value);
        if (problem) {
          error.textContent = problem;
          return;
        }
        submit.disabled = true;
        submit.classList.add('is-busy');
        void cloud.changePassword(current.input.value, next.input.value).then((res) => {
          submit.disabled = false;
          submit.classList.remove('is-busy');
          if (res.ok) {
            close();
            toast.show('Senha trocada! 🔑', { icon: 'key', tone: 'love' });
          } else {
            error.textContent = res.message;
          }
        });
      });
      return form;
    },
    { label: 'Trocar senha' },
  );
}
