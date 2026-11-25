import { isAyneAccount, normalizeUser, passwordProblem, userNameProblem } from '../../core/account';
import type { Session } from '../../core/account';
import { authMessage } from '../../persistence/cloud';
import { login, signup, type Transport } from '../../persistence/sheets-api';
import { h, icon } from '../dom';
import '../styles/opening.css';
import '../styles/auth.css';
import { openingBackdrop, openingHeader } from './opening';

type Mode = 'entrar' | 'criar';

interface AuthDeps {
  readonly transport: Transport;
  readonly deviceId: string;
  /** Nome de usuário da Ayne (o cadastro dela herda o castelo de antes das contas). */
  readonly contaDaAyne: string;
}

let fieldSeq = 0;

/** Campo com rótulo visível; senhas ganham o botão de olhinho. */
function field(
  label: string,
  attrs: Record<string, string | number | boolean>,
  hint?: string,
): { wrap: HTMLElement; input: HTMLInputElement } {
  const id = `auth-f${++fieldSeq}`;
  const input = h('input', { id, class: 'auth-input', attrs });
  const isPassword = attrs['type'] === 'password';
  const eye = isPassword
    ? h(
        'button',
        {
          class: 'auth-eye',
          attrs: {
            type: 'button',
            'aria-label': `Mostrar ${label.toLowerCase()}`,
            'aria-pressed': 'false',
          },
          on: {
            click: () => {
              const show = input.type === 'password';
              input.type = show ? 'text' : 'password';
              eye?.setAttribute('aria-pressed', String(show));
              eye?.setAttribute(
                'aria-label',
                `${show ? 'Esconder' : 'Mostrar'} ${label.toLowerCase()}`,
              );
            },
          },
        },
        icon('eye'),
      )
    : null;
  const wrap = h(
    'div',
    { class: 'auth-field' },
    h('label', { class: 'auth-label', text: label, attrs: { for: id } }),
    h('div', { class: 'auth-control' }, input, eye),
    hint ? h('small', { class: 'auth-hint', text: hint }) : null,
  );
  return { wrap, input };
}

/**
 * Tela de entrar / criar conta. Aparece antes do jogo quando o aparelho
 * ainda não tem uma sessão; resolve com a sessão nova.
 */
export function runAuthScreen(root: HTMLElement, deps: AuthDeps): Promise<Session> {
  return new Promise((resolve) => {
    let mode: Mode = 'entrar';

    const user = field('Nome de usuário', {
      type: 'text',
      name: 'username',
      autocomplete: 'username',
      autocapitalize: 'none',
      autocorrect: 'off',
      spellcheck: 'false',
      maxlength: 20,
      enterkeyhint: 'next',
      required: true,
    });
    const pass = field('Senha', {
      type: 'password',
      name: 'password',
      autocomplete: 'current-password',
      maxlength: 64,
      enterkeyhint: 'go',
      required: true,
    });
    const invite = field(
      'Código de convite',
      {
        type: 'password',
        name: 'invite',
        inputmode: 'numeric',
        autocomplete: 'off',
        maxlength: 32,
        enterkeyhint: 'go',
      },
      'Peça o código ao Gustavo 💌',
    );
    const error = h('p', {
      class: 'auth-error',
      attrs: { role: 'alert', 'aria-live': 'assertive' },
    });
    const submitLabel = h('span');
    const submit = h(
      'button',
      { class: 'btn btn-primary auth-submit', attrs: { type: 'submit' } },
      icon('castle'),
      submitLabel,
    );
    const note = h('p', { class: 'auth-note' });

    const tab = (value: Mode, text: string) =>
      h('button', {
        class: 'auth-tab',
        text,
        attrs: { type: 'button', 'aria-pressed': 'false' },
        dataset: { mode: value },
        on: {
          click: () => {
            setMode(value);
            user.input.focus();
          },
        },
      });
    const tabs = h(
      'div',
      { class: 'auth-tabs', attrs: { role: 'group', 'aria-label': 'Escolha' } },
      tab('entrar', 'Entrar'),
      tab('criar', 'Criar conta'),
    );

    const form = h(
      'form',
      { class: 'auth-card', attrs: { novalidate: true, 'aria-label': 'Entrar no castelo' } },
      tabs,
      user.wrap,
      pass.wrap,
      invite.wrap,
      error,
      submit,
      note,
    );

    function setMode(next: Mode): void {
      mode = next;
      for (const b of tabs.querySelectorAll<HTMLButtonElement>('.auth-tab')) {
        b.setAttribute('aria-pressed', String(b.dataset['mode'] === mode));
      }
      const creating = mode === 'criar';
      invite.wrap.hidden = !creating;
      pass.input.autocomplete = creating ? 'new-password' : 'current-password';
      pass.input.enterKeyHint = creating ? 'next' : 'go';
      submitLabel.textContent = creating ? 'Criar minha conta' : 'Entrar no castelo';
      note.textContent = creating
        ? 'Cada conta tem o próprio castelo, salvo na planilha e igualzinho em todos os aparelhos.'
        : 'Esqueceu a senha? O Gustavo pode criar uma senha provisória na planilha.';
      error.textContent = '';
    }
    setMode('entrar');

    const fail = (message: string, focus: HTMLInputElement) => {
      error.textContent = message;
      form.classList.remove('is-shaking');
      void form.getBoundingClientRect();
      form.classList.add('is-shaking');
      focus.focus();
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submit.disabled) return;
      const creating = mode === 'criar';
      const name = user.input.value.trim();
      const userProblem = creating
        ? userNameProblem(name)
        : name.length === 0
          ? 'Digite seu nome de usuário.'
          : null;
      if (userProblem) {
        fail(userProblem, user.input);
        return;
      }
      const passProblem = creating
        ? passwordProblem(pass.input.value)
        : pass.input.value.length === 0
          ? 'Digite sua senha.'
          : null;
      if (passProblem) {
        fail(passProblem, pass.input);
        return;
      }
      if (creating && invite.input.value.trim().length === 0) {
        fail('Digite o código de convite.', invite.input);
        return;
      }

      error.textContent = '';
      submit.disabled = true;
      submit.classList.add('is-busy');
      const label = submitLabel.textContent;
      submitLabel.textContent = creating ? 'Criando…' : 'Entrando…';
      const request = creating
        ? signup(deps.transport, deps.deviceId, {
            usuario: name,
            senha: pass.input.value,
            convite: invite.input.value.trim(),
            legado: isAyneAccount({ usuario: normalizeUser(name) }, deps.contaDaAyne),
          })
        : login(deps.transport, deps.deviceId, { usuario: name, senha: pass.input.value });
      request.then(
        (session) => {
          el.classList.add('is-leaving');
          window.setTimeout(() => {
            el.remove();
            resolve(session);
          }, 260);
        },
        (err: unknown) => {
          submit.disabled = false;
          submit.classList.remove('is-busy');
          submitLabel.textContent = label;
          fail(authMessage(err), creating ? user.input : pass.input);
        },
      );
    });

    const el = h(
      'main',
      { class: 'opening auth-screen', attrs: { 'aria-labelledby': 'opening-title' } },
      ...openingBackdrop(),
      h(
        'div',
        { class: 'auth-scroll' },
        openingHeader('Entre para decorar o seu castelo ✨'),
        form,
        h(
          'p',
          { class: 'opening-footer' },
          'Feito com ',
          h('span', { class: 'opening-heart', text: '💖' }),
          ' pelo Gustavo',
        ),
      ),
    );
    root.replaceChildren(el);
  });
}
