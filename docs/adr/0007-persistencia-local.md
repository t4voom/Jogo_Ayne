# 0007 — Persistência local primeiro (IndexedDB) com schema versionado

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

O progresso da Ayne nunca pode se perder, e o jogo nunca pode depender da
rede para funcionar.

## Decisão

- **IndexedDB** via wrapper próprio (`persistence/idb.ts`, sem dependências),
  banco `castelo-da-ayne` v1 com stores: `rooms`, `profile`, `meta`, `outbox`
  (fila de sync), `backups` (versões anteriores e quarentena) e `photos`.
- Todo registro salvo leva **`schemaVersion`**. Ler = `migrate()` em sequência
  até a versão atual + validação **zod**. Dados de versão **futura** (outro
  aparelho já atualizado) nunca são rebaixados nem sobrescritos.
- **Nada é apagado por estar inválido**: vai para a quarentena (`backups`) e o
  cômodo volta ao padrão, com aviso carinhoso.
- **Autosave**: cada evento do store agenda a gravação do cômodo (agrupa
  rajadas em ~250 ms, guarda só o último estado), e grava na hora em
  `visibilitychange`/`pagehide`. Falha → tenta de novo sem perder o pendente.
- `navigator.storage.persist()` é pedido para reduzir o risco de o iOS apagar
  dados (app instalado na tela inicial já fica protegido).
- Se o IndexedDB não abrir (ex.: aba anônima antiga), o jogo funciona em
  memória e avisa.

## Consequências

- Salvar é instantâneo e independente de rede; o sync (fase 3) só lê do que
  já está salvo.
- Migrações são testadas em `core/migrations.test.ts` e `core/save.test.ts`.
