# 0004 — Fontes do Google Fonts auto-hospedadas

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

O visual pede uma fonte delicada para títulos (Dancing Script) e uma fonte
arredondada e legível para a interface (Nunito), ambas do Google Fonts. Carregar
de `fonts.googleapis.com` exige rede na primeira visita, cache em tempo de
execução separado, e custa conexões extras a terceiros (pior para o Lighthouse e
para o primeiro uso offline no iPhone).

## Decisão

Usar os **mesmos arquivos do Google Fonts** via pacotes `@fontsource`
(licença OFL), importando apenas o subconjunto `latin` (cobre acentos do
português) e os pesos usados: Nunito 400/700/800 e Dancing Script 700.
O CSS do `@fontsource` já usa `font-display: swap`. Os `.woff2` entram no
precache do service worker. As pilhas de fallback ficam nos tokens
(`--font-display`, `--font-ui`).

## Consequências

- Fontes disponíveis offline desde a primeira visita, sem requisições externas.
- ~75 KB de fontes no precache (aceitável).
- Para adicionar um peso novo, importar o CSS correspondente em `main.ts`.
