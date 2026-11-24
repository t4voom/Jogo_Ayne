# 0002 — Arquitetura em camadas com dependências apontando para dentro

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

O jogo tem regras de domínio (cômodos, itens, progressão, migração de saves),
persistência com sincronização e uma interface rica de toque. Misturar isso
torna impossível testar o domínio sem DOM e trocar detalhes (ex.: o backend)
sem quebrar o resto.

## Decisão

```
src/
  core/         modelo, regras, tipos, schemas zod, migrações   (sem DOM)
  state/        store com eventos, Commands (desfazer/refazer)  → core
  persistence/  IndexedDB, sync, cliente do Sheets, fila        → core
  art/          funções que geram o SVG de cada item            → core
  catalog/      dados dos itens por categoria                   → core, art
  progression/  estrelinhas, missões, conquistas                → core, catalog
  audio/, fx/   som e partículas                                → core
  content/      textos (ex.: carta surpresa)                    → core
  render/       palco, camadas, itens, hit-testing              → (qualquer)
  input/        gestos                                          → (qualquer)
  ui/           telas, gaveta, barras, modais, toasts           → (qualquer)
  main.ts       composição: liga tudo
```

- A regra é **verificada pelo ESLint** (`no-restricted-imports` por camada em
  `eslint.config.js`): importar `ui/` de dentro de `core/` falha no lint e no CI.
- `main.ts` é a raiz de composição: cria store, repositórios, motor de sync e
  telas, e conecta eventos. Ninguém importa de `main.ts`.
- O estado é a **única fonte da verdade**: a renderização reage a eventos do
  store; a UI nunca guarda cópia própria do modelo.

## Consequências

- `core/`, `state/`, `persistence/` e `progression/` são testáveis em Node puro
  (com `fake-indexeddb`), rápidos e determinísticos.
- Mudanças visuais não tocam regras; trocar o Sheets por outro backend só mexe
  em `persistence/`.
- Um pouco mais de "fiação" em `main.ts`, aceitável pelo isolamento obtido.
