# Changelog

Todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e versões em
[SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Fase 2 — Núcleo do jogo

- Modelo do domínio (cômodos, itens, decoração, luz) com schemas zod,
  `schemaVersion` e framework de migrações testado.
- Store imutável com eventos + padrão Command: adicionar, mover, redimensionar,
  girar, espelhar, cor, travar, frente/trás, duplicar, excluir, pintar, luz;
  desfazer/refazer 50 passos por cômodo.
- IndexedDB com salvamento automático (agrupado, com retry), quarentena para
  dados corrompidos e pedido de armazenamento persistente.
- Palco quadrado em %, diff por id, prévia de gestos só com `transform`,
  hit-testing pelo desenho + folga para dedos.
- Gestos: arrastar sem atraso, pinça (redimensiona + gira com ímã em 90°), alça
  de 1 dedo, toque longo (menu rápido), lixeira/fora do palco exclui, guias e
  "ímã" de alinhamento.
- Arte SVG própria de 17 itens (móveis, decoração, plantas, bichinhos, fonte)
  com 6 variações de cor e animações sutis; carregamento sob demanda por
  categoria.
- Fundos: paredes com 7 padrões, chão em perspectiva com 6 padrões, lambri e
  sanca dourada; fachada com castelo pintável, céu de dia/entardecer/noite e
  chão de grama/pedras/flores; jardim.
- Telas: abertura animada, mapa do castelo em corte com miniaturas reais e
  cadeados, cômodo com gaveta de catálogo (abas, busca, arrastar para o palco),
  painel Pintar, barra do item, modo Ver e atalhos de teclado.
- Brilhinhos ao adicionar, vibração leve (com "tique" no iOS 18+), toasts.
- ADRs 0005–0007; e2e de adicionar, mover, pinça, barra, pintar, desfazer,
  salvar/recarregar, lixeira e navegação.

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
