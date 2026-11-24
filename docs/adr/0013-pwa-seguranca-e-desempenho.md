# 0013 — PWA completo, CSP e orçamento de desempenho

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

O jogo precisa instalar como app no iPhone e no Android, funcionar offline,
abrir rápido no celular (Lighthouse ≥ 90) e arrastar a 60 fps.

## Decisão

- **Service worker** (Workbox, `generateSW`) com precache de todo o app,
  inclusive arte e telas carregadas sob demanda; atualização só com toque em
  "Nova versão disponível — toque para atualizar".
- **iOS**: `apple-touch-icon`, meta tags `apple-mobile-web-app-*`, 11 splash
  screens JPEG para os iPhones atuais (`npm run splash`), banner com passo a
  passo do Safari (o iOS não tem prompt de instalação). **Android**: captura do
  `beforeinstallprompt` e botão "Instalar" de verdade. O banner só aparece
  fora do modo app e some por 7 dias ao dispensar.
- **Content-Security-Policy** no build de produção: só scripts do próprio
  site; conexões só com o site e o Apps Script; sem `object`, sem formulários.
- **Desempenho**:
  - telas além da abertura, cada pacote de arte e a geração de foto são chunks
    sob demanda; validação com `zod/mini` (bundle inicial ≈ 49 KB gzip);
  - tela de carregamento embutida no HTML (sem flash branco);
  - gestos só com `transform` (ADR 0005).
- **Medições** (Lighthouse 13, celular simulado): abertura 100/100/100,
  mapa 99/100/100, quarto 100/100/100 (desempenho/acessibilidade/boas
  práticas), CLS 0. Arrasto com CPU 4× mais lenta e tela 3×: **60 fps** médios
  (p95 16,8 ms) — `scripts/fps.mjs`.

## Consequências

- Mudanças de URL do Apps Script exigem novo build (a CSP inclui a origem).
- O e2e de modo offline roda no Chromium; o WebKit do Playwright em Linux não
  ativa service workers de forma confiável (o iOS real ativa).
