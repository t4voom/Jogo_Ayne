# 0006 — Store imutável com eventos e padrão Command para desfazer/refazer

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

Toda alteração precisa ser desfeita/refeita (50 passos por cômodo), salva
imediatamente e, depois, sincronizada; a renderização precisa reagir sem
virar uma bagunça de callbacks.

## Decisão

- `Store` guarda `GameState` imutável (cômodos, perfil, seleção) e emite
  eventos tipados (`room`, `profile`, `selection`, `history`) com `prev`/`next`
  e a **origem** (`user`, `undo`, `redo`, `load`, `remote`, `restore`).
- **Toda alteração da jogadora é um `Command`** puro (`apply(room)` /
  `revert(room)`) que captura o "antes" na criação: adicionar, remover (volta à
  mesma profundidade), atualizar propriedades, reordenar, pintar, luz e lote.
- `GameActions` é a fachada usada pela UI/gestos: lê o estado, monta o Command
  e executa. Itens travados recusam qualquer mudança exceto destravar.
- Histórico **por cômodo**, limitado a 50; command que não muda nada não entra
  no histórico; desfazer pula commands cujo alvo sumiu.
- Mudanças externas (`replaceRoom`: carga, outro aparelho, restauração) **zeram
  o desfazer** daquele cômodo, porque os commands antigos se referem a outro
  estado.
- Valores são saneados nas regras do domínio (`sanitizeItem`: limites de
  tamanho, centro dentro do palco, ângulo normalizado, 2 casas decimais).

## Consequências

- Desfazer é exato e barato; o histórico não guarda cópias do cômodo.
- Persistência e sync só observam eventos — não conhecem a UI.
- O histórico não é persistido (recomeça ao abrir o app), o que é o esperado
  num jogo casual.
