# 0012 — Áudio sintetizado e fotos geradas no aparelho

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

O jogo precisa de música, efeitos e fotos do cômodo, funcionando offline e
sem inchar o download. Arquivos de áudio/imagem pesariam e teriam direitos
autorais a considerar.

## Decisão

- **Áudio 100% Web Audio** (`src/audio/`): uma caixinha de música com
  melodia **original** (valsinha em Fá maior, 16 compassos, em loop) usando
  parciais inarmônicos com decaimento, agendada com lookahead (sem engasgos);
  efeitos (pop, brilho, sino, página, baú, câmera…) sintetizados.
  - Só começa após o primeiro toque (regra do iOS); pausa em segundo plano;
    respeita as chaves Música/Efeitos.
  - No iPhone com a chave no silencioso o Web Audio fica mudo (regra do iOS).
- **Fotos**: o cômodo é composto como um SVG único (o mesmo do palco, com
  luzes da noite), desenhado num `canvas` com moldura de princesa e legenda em
  Dancing Script, exportado em **PNG 1080×1280**. A miniatura (JPEG ~300 px)
  é o que vai para a planilha; a foto inteira fica no aparelho.
- Compartilhar usa a **Web Share API com arquivos** (iOS/Android); sem ela,
  baixa o PNG.
- **Luzes noturnas**: itens com `light` na arte ganham um brilho
  (`mix-blend-mode: screen`) por cima do filtro de noite/entardecer.

## Consequências

- Zero arquivos de mídia; tudo funciona offline.
- Fotos do outro aparelho aparecem como miniatura (limite de célula/cotas).
