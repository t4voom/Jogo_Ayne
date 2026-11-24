import { describeError, logHub } from '../core/log';
import './styles/fatal-error.css';

/**
 * Página de erro amigável. Mostrada quando o jogo não consegue continuar
 * (falha na inicialização ou erros em sequência). O progresso está salvo no
 * aparelho, então recarregar é sempre seguro.
 */
export function showFatalError(error: unknown): void {
  document.getElementById('boot')?.classList.add('is-done');
  if (document.getElementById('fatal-error')) return;

  const root = document.createElement('div');
  root.id = 'fatal-error';
  root.setAttribute('role', 'alertdialog');
  root.setAttribute('aria-labelledby', 'fatal-title');
  root.setAttribute('aria-describedby', 'fatal-desc');

  const card = document.createElement('div');
  card.className = 'fatal-card';

  const icon = document.createElement('div');
  icon.className = 'fatal-icon';
  icon.textContent = '🏰';
  icon.setAttribute('aria-hidden', 'true');

  const title = document.createElement('h1');
  title.id = 'fatal-title';
  title.textContent = 'Opa! Uma fadinha tropeçou…';

  const desc = document.createElement('p');
  desc.id = 'fatal-desc';
  desc.textContent =
    'Algo inesperado aconteceu. Seu castelo está guardadinho no aparelho — é só tocar em “Voltar ao castelo”.';

  const reload = document.createElement('button');
  reload.className = 'fatal-button';
  reload.type = 'button';
  reload.textContent = 'Voltar ao castelo';
  reload.addEventListener('click', () => {
    window.location.reload();
  });

  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Detalhes para o Gustavo';
  const pre = document.createElement('pre');
  const recent = logHub
    .recent()
    .slice(-12)
    .map((e) => `[${new Date(e.time).toISOString()}] ${e.level} ${e.scope}: ${e.message}`)
    .join('\n');
  pre.textContent = `${describeError(error)}\n\n${recent}`;
  details.append(summary, pre);

  card.append(icon, title, desc, reload, details);
  root.append(card);
  document.body.append(root);
  reload.focus();
}
