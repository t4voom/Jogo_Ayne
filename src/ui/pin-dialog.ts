import type { Cloud } from '../persistence/cloud';
import { h, icon } from './dom';
import { openSheet } from './sheet';

/**
 * "Digite o código do castelo": liga o tablet e o celular na mesma planilha.
 * Resolve true se o código foi salvo, false se pulou/fechou.
 */
export function openPinDialog(
  cloud: Cloud,
  options: { canSkip: boolean; reason?: string },
): Promise<boolean> {
  return new Promise((resolve) => {
    let result = false;
    openSheet(
      (close) => {
        const input = h('input', {
          class: 'pin-input',
          attrs: {
            type: 'password',
            inputmode: 'numeric',
            autocomplete: 'off',
            autocapitalize: 'off',
            spellcheck: 'false',
            maxlength: 32,
            'aria-label': 'Código do castelo',
            placeholder: '••••••',
            enterkeyhint: 'go',
          },
        });
        const error = h('p', {
          class: 'pin-error',
          attrs: { role: 'alert', 'aria-live': 'assertive' },
        });
        const submitLabel = h('span', { text: 'Entrar' });
        const submit = h(
          'button',
          { class: 'btn btn-primary pin-submit', attrs: { type: 'submit' } },
          icon('key'),
          submitLabel,
        );
        const show = h(
          'button',
          {
            class: 'pin-eye',
            attrs: { type: 'button', 'aria-label': 'Mostrar código', 'aria-pressed': 'false' },
            on: {
              click: () => {
                const visible = input.type === 'password';
                input.type = visible ? 'text' : 'password';
                show.setAttribute('aria-pressed', String(visible));
                show.setAttribute('aria-label', visible ? 'Esconder código' : 'Mostrar código');
              },
            },
          },
          icon('eye'),
        );
        const form = h(
          'form',
          { class: 'pin', attrs: { novalidate: true } },
          h(
            'div',
            { class: 'pin-art', attrs: { 'aria-hidden': 'true' } },
            icon('castle', 'icon pin-castle'),
            icon('key', 'icon pin-key'),
          ),
          h('h2', { class: 'sheet-title', text: 'Digite o código do castelo' }),
          h('p', {
            class: 'sheet-text',
            text:
              options.reason ??
              'Com o código, o seu castelo fica igualzinho no tablet e no celular, e nunca se perde ✨',
          }),
          h('div', { class: 'pin-field' }, input, show),
          error,
          submit,
          options.canSkip
            ? h('button', {
                class: 'btn btn-ghost',
                text: 'Jogar só neste aparelho',
                attrs: { type: 'button' },
                on: {
                  click: () => {
                    void cloud.skip().then(close);
                  },
                },
              })
            : null,
        );
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          error.textContent = '';
          submit.disabled = true;
          submit.classList.add('is-busy');
          submitLabel.textContent = 'Conferindo…';
          void cloud.submitPin(input.value).then((res) => {
            submit.disabled = false;
            submit.classList.remove('is-busy');
            submitLabel.textContent = 'Entrar';
            if (res.ok) {
              result = true;
              close();
            } else {
              error.textContent = res.message;
              form.classList.remove('is-shaking');
              void form.getBoundingClientRect();
              form.classList.add('is-shaking');
              input.select();
            }
          });
        });
        return form;
      },
      {
        label: 'Código do castelo',
        className: 'pin-sheet',
        onClose: () => {
          resolve(result);
        },
      },
    );
  });
}
