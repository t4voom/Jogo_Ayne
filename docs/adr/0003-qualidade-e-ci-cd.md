# 0003 — Qualidade automatizada e CI/CD no GitHub Pages

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

A barra de qualidade é a de um jogo publicado. Sem automação, regressões em
toque, sync ou saves só apareceriam no aparelho da Ayne.

## Decisão

- **ESLint** (flat config) com `typescript-eslint` `strict-type-checked` +
  `stylistic-type-checked`, `no-explicit-any`, `switch-exhaustiveness-check` e a
  regra de camadas do ADR 0002. **Prettier** para formatação.
- **Husky + lint-staged**: no `pre-commit`, lint/format dos arquivos alterados,
  typecheck e testes de unidade; no `commit-msg`, **commitlint** com
  Conventional Commits.
- **Vitest** para unidade (Node; `happy-dom` onde precisar de DOM;
  `fake-indexeddb` para persistência). Testes ficam ao lado do código
  (`*.test.ts`).
- **Playwright** para e2e em dois perfis: `iphone-14` (WebKit no CI) e
  `galaxy-tab` (Chromium, Galaxy Tab S9 em paisagem). Versão fixada para casar
  com os navegadores instalados.
- **GitHub Actions** (`.github/workflows/ci.yml`): `quality` (lint → formatação
  → typecheck → unidade com cobertura → build) → `e2e` (sobre o mesmo `dist`)
  → `deploy` (só em push na `main`) via `actions/deploy-pages`.
- `base` do Vite = `/Jogo_Ayne/` (nome do repositório).
- `VITE_SHEETS_API_URL` vem de GitHub Secrets no build e de `.env.local` no
  ambiente local; `.env.example` é versionado.
- **Dependabot** semanal para npm e Actions.

## Consequências

- Nada chega à `main` sem passar pelos mesmos portões do ambiente local.
- O deploy usa exatamente o artefato testado no e2e.
- Atenção: variáveis `VITE_*` são embutidas no JavaScript publicado. O secret
  mantém a URL fora do repositório, mas não a torna secreta para quem
  inspeciona o site — a proteção real do backend é o PIN (ver ADR de sync).
- `npm audit` acusa `glob`/`minimatch` antigos dentro do `workbox-build`
  (só em build, nunca no app publicado). Acompanhar atualizações do plugin.
