# 0010 — Arte vetorial desenhada em código, em pacotes por categoria

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

São 100+ itens com 6 variações de cor cada, animações sutis, e a foto do
álbum precisa ficar idêntica ao palco. Arquivos SVG soltos (ou PNG) teriam
600+ arquivos, cores difíceis de variar e nenhum controle de estilo.

## Decisão

- Cada item é uma função `draw(ctx)` que devolve SVG, usando um **kit de
  desenho** (`art/kit.ts`) e **peças comuns** (`art/packs/common.ts`: pés
  dourados, gavetas, coroinhas, babados, vasos…). Isso garante o estilo:
  formas arredondadas, contorno na cor do objeto (nunca preto), sombra de
  base, sombreamento em 2 tons, brilho e ouro.
- **Variações de cor por rampa** (`light/base/shade/deep/line`) em
  `art/palette.ts`; a mesma função desenha as 6 cores. A marcação é
  memorizada por item+cor.
- **Gradientes compartilhados** (`#k-gold`, `#k-glass`, `#k-shadow`…)
  instalados uma vez no documento e embutidos nas fotos. Sem filtros SVG.
- **Animações por classe** (`a-breathe`, `a-blink`, `a-flicker`, `a-water`…)
  em CSS, desligadas com `prefers-reduced-motion` e nas miniaturas.
- **Um chunk por categoria** (`import()` dinâmico): o bundle inicial não
  carrega desenho nenhum; o service worker faz precache de todos.
- **Testes de integridade** (`catalog/art-coverage.test.ts`): todo item do
  catálogo tem desenho, nenhum desenho órfão, nada de `NaN`/`undefined`
  em nenhuma cor, tags balanceadas, ≥100 itens e ≥10 por categoria.
- Uma página de desenvolvimento (`dev/art-preview.html`) mostra todos os itens,
  cores, fundos e cômodos iniciais para revisão visual.

## Consequências

- Adicionar um item = uma entrada no catálogo + uma função de desenho.
- Os pacotes de arte somam ~25 KB gzip, carregados sob demanda.
- Desenhar em código exige revisão visual (a página de prévia ajuda).
