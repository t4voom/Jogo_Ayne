# 0005 — Palco quadrado em %, DOM + SVG por item, gestos só com `transform`

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

O cômodo precisa ficar idêntico no tablet (paisagem) e no iPhone (retrato), e
arrastar/redimensionar precisa ser instantâneo (60 fps) em aparelho médio.

## Decisão

- **Palco quadrado (1:1).** É a proporção que melhor aproveita retrato no
  celular (catálogo embaixo) e paisagem no tablet (catálogo na lateral).
- **Coordenadas em % do lado do palco**: `x`, `y` = centro do item, `w` =
  largura; a altura vem da proporção da arte. Rotação em graus, espelhamento
  por flag. Nada depende de pixels.
- **Cada item é um `<div>` com o próprio `<svg>`** (não um único SVG gigante),
  posicionado com `left/top/width` em % e `transform: translate(-50%,-50%)
rotate() scaleX()`. Profundidade = ordem no array (`z-index` = índice), sem
  mover nós no DOM.
- **Diff por id**: `StageView.render(room)` compara identidades (estado
  imutável) e só toca no que mudou; fundo só é redesenhado quando decoração ou
  luz mudam.
- **Durante gestos só o `transform` muda** (`will-change` liga no início e
  desliga no fim), aplicado dentro de `requestAnimationFrame`. O estado é
  gravado UMA vez ao soltar (`commitGesture` → um passo de desfazer).
- **Hit-testing em dois níveis**: primeiro pelo desenho
  (`elementsFromPoint` + `pointer-events: visiblePainted` no SVG), depois pela
  caixa com folga de 14 px (dedos!), preferindo o menor item.
- **Sem filtros SVG** na arte (caros no iOS): sombras e brilhos com gradientes
  compartilhados (`#k-*`) e sombreamento em 2 tons.
- Fundos dos cômodos são SVG gerado por código, com o **chão em perspectiva
  real** (linhas convergindo para um ponto de fuga), e ids derivados de um hash
  da decoração para nunca colidirem entre palco e miniaturas.
- `render/compose.ts` monta o cômodo inteiro como um SVG só (miniaturas do mapa
  e, na fase 6, fotos do álbum), garantindo que a foto é igual ao palco.

## Consequências

- Arrastar não causa layout nem re-render do palco; o custo por quadro é uma
  composição de camada.
- Itens grandes escalados por pinça podem ficar levemente borrados durante o
  gesto (a camada é rasterizada no tamanho inicial) e ficam nítidos ao soltar.
- Arte e fundos são determinísticos (PRNG com semente), então o mesmo save
  desenha igual em qualquer aparelho.
