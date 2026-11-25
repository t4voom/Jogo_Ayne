# 👑 O Castelo da Aynebrenda

Um jogo de **decorar o castelo de uma princesa**, feito com carinho para a Ayne.
Funciona no navegador, instala na tela inicial como um app (Android e iPhone),
funciona **offline** e sincroniza o progresso entre aparelhos por uma planilha
do Google.

**Jogar:** https://t4voom.github.io/Jogo_Ayne/

## O que tem no castelo

- **8 cômodos**: Fachada, Quarto da Princesa e Sala do Trono já abertos;
  Banheiro Real, Cozinha Encantada, Salão de Baile, Closet e Jardim Encantado
  se abrem com estrelinhas.
- **101 itens** com arte própria, em 6 cores cada (rosa, lilás, azul bebê,
  menta, dourado e branco pérola), vários com animações (bichinhos respiram e
  piscam, velas tremulam, a fonte corre…).
- **Decorar no toque**: tocar ou arrastar do catálogo, mover com um dedo,
  pinça para redimensionar e girar, toque longo para o menu rápido, barra do
  item, lixeira, ímã de alinhamento, desfazer/refazer e modo **Ver**.
- **Pintar**: 12 cores e 7 padrões de parede, 6 pisos em perspectiva; na
  fachada, cor do castelo, do telhado e o chão; **dia, entardecer e noite**,
  com as luzes acendendo.
- **Progressão**: estrelinhas, 17 missões, 15 medalhas, presente diário,
  mensagens carinhosas e uma **carta surpresa** no fim.
- **Álbum de fotos** com moldura de princesa, para compartilhar ou baixar.
- **Música de caixinha** original e efeitos, tudo sintetizado.
- **Tutorial** com a Fadinha Luz na primeira vez.
- **Nunca perde nada**: salva no aparelho na hora, sincroniza com a planilha
  e funciona offline.
- **Contas**: cada pessoa entra com usuário e senha e tem o próprio castelo,
  igualzinho em todos os aparelhos em que entrar.

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

Nunca versione `.env.local`, PINs, senhas ou URLs privadas. O passo a passo da planilha
está em [`apps-script/README.md`](apps-script/README.md).

### Contas e sincronização (tablet ↔ celular)

Com a planilha configurada, o jogo abre na tela **Entrar / Criar conta**:

- **Criar conta** pede nome de usuário, senha e o **código de convite** (a
  propriedade `PIN` da planilha). Quem tem o link mas não tem o convite não
  cria conta.
- Cada conta tem **o próprio castelo**. Várias contas podem usar o mesmo
  aparelho; cada uma tem o seu banco local.
- A conta da Ayne é a de usuário `CONTA_DA_AYNE`, em
  [`src/content/carta.ts`](src/content/carta.ts) (padrão `ayne`). Só ela
  recebe a carta e as mensagens carinhosas, e ela herda o castelo feito antes
  das contas existirem.
- Em **Configurações → Conta e nuvem** dá para trocar a senha e sair da
  conta. Esqueceu a senha? Veja
  [`apps-script/README.md`](apps-script/README.md#esqueci-a-senha).
- O primeiro acesso de cada aparelho precisa de internet; depois, tudo
  funciona offline.

O jogo salva tudo primeiro no aparelho (IndexedDB) e sincroniza em segundo
plano com uma planilha do Google. O indicador no topo mostra se está
tudo salvo (☁️✓), enviando (🔄), sem internet (☁️ cinza — salvo no aparelho) ou
com erro (⚠️, toque para detalhes). Se os dois aparelhos mexerem no mesmo
cômodo sem internet, fica a versão mais recente e a outra aparece em
**Configurações → Versões anteriores** para restaurar.

### Scripts

| Comando                      | O que faz                                                 |
| ---------------------------- | --------------------------------------------------------- |
| `npm run dev`                | Servidor de desenvolvimento                               |
| `npm run build`              | Build de produção em `dist/` (com service worker)         |
| `npm run preview`            | Serve o `dist/` localmente                                |
| `npm run lint`               | ESLint (inclui a regra de camadas da arquitetura)         |
| `npm run typecheck`          | TypeScript `strict`                                       |
| `npm test`                   | Testes de unidade (Vitest)                                |
| `npm run test:coverage`      | Testes de unidade com cobertura                           |
| `npm run test:e2e`           | Testes e2e (Playwright: iPhone 14 e Galaxy Tab)           |
| `npm run check`              | lint + typecheck + testes + build                         |
| `npm run icons`              | Regera os ícones PNG a partir de `public/icons/crown.svg` |
| `npm run splash`             | Regera as splash screens do iPhone                        |
| `node scripts/fps.mjs <url>` | Mede o FPS do arrasto (CPU 4× mais lenta)                 |

Prévia de toda a arte (itens, cores, fundos e cômodos): com `npm run dev`,
abra `/Jogo_Ayne/dev/art-preview.html` (`?cores` mostra todas as cores).

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

### Publicar pela primeira vez

1. Faça o merge do PR na `main` (o CI precisa estar verde).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
   Hoje o Pages está como "deploy from a branch"; precisa trocar.
3. Siga [`apps-script/README.md`](apps-script/README.md) para criar a
   planilha, definir o código de convite (PIN) e publicar o Apps Script.
4. Cadastre o secret `VITE_SHEETS_API_URL` (abaixo) e rode o workflow de novo
   (aba **Actions → CI/CD → Run workflow**).
5. No celular e no tablet da Ayne, abra o link e instale na tela inicial.
   Num deles, toque em **Criar conta** (usuário `ayne`, senha dela e o
   código de convite). No outro, é só **Entrar** com o mesmo usuário e
   senha.
6. Escreva a carta em [`src/content/carta.ts`](src/content/carta.ts) 💌

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

## Qualidade

- TypeScript `strict` sem `any`; ESLint `strict-type-checked` com a regra de
  camadas; Prettier; commits convencionais verificados no `commit-msg`.
- Testes de unidade/integração (Vitest): domínio, Commands, migrações,
  persistência, motor de sync contra o `Code.gs` real, progressão, arte.
- E2E (Playwright, iPhone 14 em WebKit e Galaxy Tab S9): adicionar, mover,
  pinça, barra do item, pintar, desfazer, salvar/recarregar, lixeira, arrastar
  do catálogo, toque longo, modo Ver, tutorial, desbloqueio, missões, álbum,
  sincronização entre dois aparelhos, offline e instalação.
- Lighthouse (celular): desempenho 99–100, acessibilidade 100, boas práticas 100. Arrasto a 60 fps com CPU 4× mais lenta.

## A carta surpresa 💌

Quando a Ayne completar **todas as conquistas** (na conta dela), abre uma
carta animada.
O texto fica em [`src/content/carta.ts`](src/content/carta.ts): troque o
título, os parágrafos e a assinatura e mude `PLACEHOLDER` para `false`.
(O repositório é público, então o texto fica visível no GitHub.) As mensagens
carinhosas que aparecem durante o jogo ficam em
[`src/content/mensagens.ts`](src/content/mensagens.ts).

---

Feito com 💖 pelo Gustavo.
