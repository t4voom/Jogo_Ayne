# Changelog

Todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e versões em
[SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Fase 1 — Fundação

- Projeto Vite 8 + TypeScript 6 `strict` (sem `any`, com
  `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`).
- ESLint (`strict-type-checked`) com a regra de camadas da arquitetura,
  Prettier, Husky + lint-staged + commitlint (Conventional Commits).
- Vitest (unidade) e Playwright (e2e em iPhone 14 e Galaxy Tab S9).
- CI/CD no GitHub Actions: lint → formatação → typecheck → testes → build →
  e2e → deploy no GitHub Pages (só na `main`).
- PWA: manifest, ícones da coroa (192/512/maskable/apple-touch), service worker
  com precache e atualização sob confirmação.
- Tokens de design (cores, tipografia, raios, sombras, movimento, safe areas),
  fontes Nunito e Dancing Script auto-hospedadas.
- Registro de eventos com buffer circular, captura global de erros e página de
  erro amigável.
- ADRs 0001–0004.
