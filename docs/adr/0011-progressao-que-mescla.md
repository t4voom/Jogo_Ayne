# 0011 — Progressão que mescla entre aparelhos (CRDT simples)

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

Estrelinhas, desbloqueios, missões e conquistas mudam nos dois aparelhos,
às vezes offline ao mesmo tempo. "Último ganha" apagaria estrelinhas ou
desbloqueios ganhos no outro aparelho.

## Decisão

- **Perfil v2** (migração real v1→v2 testada) com estruturas que mesclam sem
  conflito:
  - estrelinhas = dois **G-counters** (`earned`, `spent`) com um valor por
    `deviceId`; saldo = soma(ganhas) − soma(gastas); mescla = máximo por
    aparelho;
  - estatísticas (itens colocados, pinturas, cores, fotos, presentes) também
    são G-counters;
  - desbloqueios = **conjunto** (união); conquistas = união com a data mais
    antiga; missões = `done`/`claimed` com OU lógico;
  - presente diário e limite de decoração = o dia mais recente.
- **Regras puras** em `src/progression/` (sem DOM, testadas): estrelinhas
  (+1 por item colocado, até 12/dia), desbloqueios de cômodos/itens, presente
  diário (boas-vindas de 15, sequência de dias, item surpresa a cada 5), 17
  missões (3 ativas por vez) e 15 conquistas (+10 cada).
- `app/progression.ts` observa o store (fora do laço de eventos, via
  microtask) e grava tudo com `updateProfile` → IndexedDB → planilha.
- A carta surpresa (`src/content/carta.ts`) abre quando **todas** as
  conquistas forem ganhas.

## Consequências

- Gastar as mesmas estrelinhas offline nos dois aparelhos pode levar o saldo
  a ficar abaixo de zero momentaneamente; a interface mostra no mínimo 0.
- Missões/conquistas novas exigem só uma entrada na lista (e um teste).
