# 👑 O Castelo da Aynebrenda

Um jogo de **decorar o castelo de uma princesa**, feito com carinho para a Ayne.
Funciona no navegador, instala na tela inicial como um app (Android e iPhone),
funciona **offline** e sincroniza o progresso entre aparelhos por uma planilha
do Google.

**Jogar:** https://t4voom.github.io/Jogo_Ayne/

---

## Instalar na tela inicial

### iPhone (Safari)

1. Abra o link acima no **Safari** (precisa ser o Safari).
2. Toque no botão **Compartilhar** (quadrado com a setinha para cima).
3. Role e toque em **Adicionar à Tela de Início** → **Adicionar**.
4. Abra pelo ícone da coroa 👑 — ele abre em tela cheia, como um app.

### Tablet Android (Chrome)

1. Abra o link no **Chrome**.
2. Toque em **Instalar** no aviso do jogo, ou no menu **⋮** → **Instalar app**
   (ou **Adicionar à tela inicial**).
3. Abra pelo ícone da coroa 👑.

> Depois do primeiro acesso o jogo funciona sem internet. Quando sai uma versão
> nova aparece o aviso **"Nova versão disponível — toque para atualizar"**.

---

## Rodar localmente

Requisitos: **Node 22+** e npm.

```bash
npm install
cp .env.example .env.local   # opcional: só para testar a sincronização
npm run dev                  # http://localhost:5173/Jogo_Ayne/
```

Para testar no celular/tablet na mesma rede Wi-Fi: `npm run dev -- --host` e
abra o endereço "Network" que aparecer.

### Variáveis de ambiente

| Variável              | Onde                                       | Para quê                                                                                     |
| --------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `VITE_SHEETS_API_URL` | `.env.local` (local) / GitHub Secrets (CI) | URL do App da Web do Apps Script (termina em `/exec`). Vazia = jogo funciona só no aparelho. |

Nunca versione `.env.local`, PINs ou URLs privadas. O passo a passo da planilha
está em [`apps-script/README.md`](apps-script/README.md).

### Sincronização (tablet ↔ celular)

O jogo salva tudo primeiro no aparelho (IndexedDB) e sincroniza em segundo
plano com uma planilha do Google. Com a planilha configurada, na primeira vez
aparece **"Digite o código do castelo"**; o indicador no topo mostra se está
tudo salvo (☁️✓), enviando (🔄), sem internet (☁️ cinza — salvo no aparelho) ou
com erro (⚠️, toque para detalhes). Se os dois aparelhos mexerem no mesmo
cômodo sem internet, fica a versão mais recente e a outra aparece em
**Configurações → Versões anteriores** para restaurar.

### Scripts

| Comando                 | O que faz                                                 |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento                               |
| `npm run build`         | Build de produção em `dist/` (com service worker)         |
| `npm run preview`       | Serve o `dist/` localmente                                |
| `npm run lint`          | ESLint (inclui a regra de camadas da arquitetura)         |
| `npm run typecheck`     | TypeScript `strict`                                       |
| `npm test`              | Testes de unidade (Vitest)                                |
| `npm run test:coverage` | Testes de unidade com cobertura                           |
| `npm run test:e2e`      | Testes e2e (Playwright: iPhone 14 e Galaxy Tab)           |
| `npm run check`         | lint + typecheck + testes + build                         |
| `npm run icons`         | Regera os ícones PNG a partir de `public/icons/crown.svg` |

Os e2e usam uma planilha simulada (o `Code.gs` real rodando no Node,
interceptando a rede), então não precisam de internet nem de conta Google.
Prints para conferência visual: `VISUAL=1 npx playwright test screens.visual`.

Para os e2e locais: `npx playwright install chromium webkit` uma vez. Sem
WebKit, rode `E2E_WEBKIT=0 npm run test:e2e` (o iPhone é emulado no Chromium).

---

## Deploy (GitHub Pages)

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda
**lint → typecheck → testes → build → e2e** em todo PR e push; em push na
`main`, publica no GitHub Pages.

Configuração única no GitHub:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. (Para sincronizar) **Settings → Secrets and variables → Actions → New
   repository secret**: `VITE_SHEETS_API_URL` = URL do Apps Script.
3. Faça merge na `main`: o deploy roda sozinho (aba **Actions**).

---

## Arquitetura

Camadas com dependências apontando para dentro (verificadas pelo ESLint):

```
src/
  core/         modelo do domínio, schemas zod, migrações (sem DOM)
  state/        store com eventos, Commands (desfazer/refazer)
  persistence/  IndexedDB, motor de sync, cliente do Sheets
  render/       palco, camadas, itens SVG, hit-testing
  input/        gestos (arrastar, pinça, toque longo)
  ui/           telas, gaveta, barras, modais, toasts
  catalog/      dados dos itens
  art/          SVG de cada item
  audio/        música e efeitos via Web Audio
  fx/           partículas e brilhinhos
  progression/  estrelinhas, missões, conquistas
  content/      textos (inclui a carta surpresa)
apps-script/    backend do Google Sheets
docs/adr/       decisões de arquitetura
tests/e2e/      testes Playwright
```

As decisões estão em [`docs/adr/`](docs/adr/README.md) e as mudanças no
[`CHANGELOG.md`](CHANGELOG.md).

## A carta surpresa 💌

Quando a Ayne completar **todas as conquistas**, abre uma carta animada.
O texto fica em [`src/content/carta.ts`](src/content/carta.ts): troque o
título, os parágrafos e a assinatura e mude `PLACEHOLDER` para `false`.
(O repositório é público, então o texto fica visível no GitHub.) As mensagens
carinhosas que aparecem durante o jogo ficam em
[`src/content/mensagens.ts`](src/content/mensagens.ts).

---

Feito com 💖 pelo Gustavo.
