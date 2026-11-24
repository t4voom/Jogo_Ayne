# 0001 — Construir como PWA em TypeScript puro, sem framework de UI nem motor de jogo

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

O jogo precisa rodar num tablet Android (Chrome) e num iPhone (Safari), ser
instalável na tela inicial, funcionar offline e ter arrasto a 60 fps. Um app
nativo exigiria dois códigos e lojas. Frameworks de UI (React, Vue…) adicionam
peso e uma camada de reconciliação que não ajuda num palco onde o que importa é
mexer num `transform` por quadro. Motores de jogo (Phaser, Pixi) desenham em
canvas, o que perde a nitidez do SVG, a acessibilidade do DOM e encarece a arte
vetorial com variações de cor.

## Decisão

- **PWA** com Vite 8 + TypeScript 6 em modo `strict` (com
  `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`).
- **Renderização em HTML + SVG inline**: cada item é um elemento HTML com seu
  SVG; o palco é DOM, não canvas. Variações de cor por CSS custom properties.
- **Interação por Pointer Events**; movimento com `transform` aplicado dentro de
  `requestAnimationFrame`.
- **`vite-plugin-pwa`** (Workbox 7) em modo `prompt`: a atualização só é aplicada
  quando a jogadora toca em "atualizar".
- **`zod`** para validar tudo que vem de fora (IndexedDB, rede, saves antigos).
- **TypeScript 6.0 e não 7.0**: o TS 7 (compilador nativo) ainda não é suportado
  pelo `typescript-eslint` (exige `<6.1`). Migrar quando houver suporte.
- Alvo de build: Safari 16.4+ e Chrome 111+ (iPhones e tablets dos últimos anos).

## Consequências

- Um único código para Android e iOS, publicado no GitHub Pages.
- Bundle inicial pequeno (sem runtime de framework).
- Precisamos escrever à mão o que um framework daria: pequeno helper de DOM,
  reconciliação por id no palco e gerenciamento de telas. Isso fica concentrado
  em `render/` e `ui/`.
- O iOS impõe limites a PWAs (sem API de vibração, sem sync em segundo plano,
  áudio mudo na chave de silencioso); cada um tem alternativa documentada no
  ADR correspondente.
