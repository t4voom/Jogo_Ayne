# Changelog

Todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e versões em
[SemVer](https://semver.org/lang/pt-BR/).

## [1.1.0] — 2026-11-25

### Contas: cada pessoa tem o próprio castelo

- Tela de **entrar / criar conta** com usuário e senha, no cenário da
  abertura. Para criar conta é preciso o **código de convite** (a propriedade
  `PIN` da planilha).
- Cada conta tem o próprio castelo: cômodos, estrelinhas, missões, álbum e
  banco no aparelho. Várias contas podem usar o mesmo aparelho.
- O castelo salvo antes das contas fica com a conta da Ayne
  (`CONTA_DA_AYNE` em `src/content/carta.ts`). No aparelho dela, nada muda
  de lugar.
- Carta surpresa, mensagens carinhosas e a fala "Princesa Ayne" só na conta
  dela; as outras contas recebem mensagens gerais.
- Configurações → Conta e nuvem: quem está jogando, **trocar senha** e
  **sair da conta**. Quando a sessão termina (senha trocada em outro
  aparelho), a nuvem avisa e leva para entrar de novo.
- `Code.gs` v2:
  - aba `contas` com senhas em hash (HMAC-SHA256 com sal e segredo do
    servidor) e tokens de sessão assinados;
  - isolamento por conta e senha provisória pela coluna `redefinirSenha`;
  - qualquer GET mostra a saúde do serviço.
- Correção: com um item selecionado, o botão do mapa só tirava a seleção.
  Agora ele volta ao mapa.
- ADR 0014; e2e de cadastro, login, troca de senha, contas separadas no
  mesmo aparelho e sessão expirada.

## [1.0.0] — 2026-11-24

Primeira versão completa, presente para a Ayne. 👑

### Fase 7 — PWA, desempenho, acessibilidade e revisão final

- Splash screens do iPhone, banner que ensina a instalar (Safari no iPhone,
  botão de verdade no Android), e2e de funcionamento offline.
- Content-Security-Policy no build de produção; miniaturas vindas da planilha
  validadas também no aparelho.
- `zod/mini` no lugar do zod completo (bundle inicial menor).
- Acessibilidade 100 no Lighthouse: nomes acessíveis iguais ao texto visível,
  itens do palco com `role="img"`, tutorial sem deslocamento de layout.
- Mapa mostra quantas estrelinhas faltam para abrir cada cômodo.
- E2E de arrastar do catálogo, toque longo, modo Ver, PWA e instalação.
- Medição de FPS (`scripts/fps.mjs`): 60 fps arrastando com CPU 4× mais lenta.
- ADR 0013.


### Fase 6 — Álbum, áudio, tutorial, dia/noite e polimento

- Caixinha de música com melodia original e efeitos sonoros, tudo em Web
  Audio (sem arquivos), começando no primeiro toque e respeitando as
  configurações.
- Álbum: botão de câmera com flash gera um PNG do cômodo com moldura de
  princesa; fotos ficam no aparelho, a miniatura sincroniza com a planilha;
  visualizador com Compartilhar (Web Share), Baixar e Apagar. As fotos ficam
  no IndexedDB como bytes (funciona até no Safari em navegação privada).
- Tutorial da Fadinha Luz na primeira visita (4 passos, com destaque na tela,
  pode pular).
- Noite e entardecer: lustres, abajures, velas, castiçais, lareira, poste e
  guirlanda acendem com brilho quente (no palco e nas fotos).
- Barra do topo compacta no celular (nome do cômodo continua acessível).
- ADR 0012; e2e do álbum e do tutorial.

### Fase 5 — Progressão

- Perfil v2 com migração do v1: estrelinhas por aparelho (nunca se perdem na
  sincronização), desbloqueios, missões, conquistas, presente diário e
  estatísticas, tudo mesclável entre tablet e celular.
- Estrelinhas: +1 por item colocado (até 12 por dia), missões, medalhas e o
  presente diário.
- Cômodos e itens bloqueados liberados com estrelinhas (com confirmação e
  animação do cadeado abrindo).
- Baú surpresa diário (boas-vindas de 15 ⭐, bônus de dias seguidos e item
  surpresa a cada 5 presentes).
- 17 missões curtas (3 ativas por vez) e 15 conquistas com medalhas
  ilustradas.
- Mensagens carinhosas rotativas (`src/content/mensagens.ts`).
- Carta surpresa animada ao completar todas as conquistas — texto em
  `src/content/carta.ts` (placeholder para o Gustavo escrever).
- Correções: "voltar" nunca sai do jogo quando ele foi aberto direto num
  cômodo; o aviso do código do castelo some quando ela joga só no aparelho.
- ADR 0011; testes de unidade da progressão e e2e de presente, desbloqueio e
  missão.

### Fase 4 — Conteúdo

- **101 itens** com arte SVG própria, em 6 cores cada:
  - 29 móveis: berço, guarda-roupa, cômoda, sofá real, divã, mesa de chá,
    cadeira de coração, estante, banheira com pés, pia, armário de cozinha,
    fogão antigo, geladeira retrô, mesa de jantar, piano de cauda, harpa,
    cabideiro, sapateira, manequim com vestido, lareira…
  - 28 de decoração: retrato, quadros, tapetes (redondo, retangular, coração),
    velas, baú de tesouro, relógio de pêndulo, laço, guirlanda de luzes, bolo,
    jogo de chá, porta-joias, caixinha de música com bailarina, globo de neve,
    livros, almofadas, cortina, prateleira, espelho de corpo inteiro, vitral,
    bandeja de docinhos…
  - 14 plantas, 12 bichinhos (gatinho, cachorrinho, coelho, unicórnio, pônei,
    cisne, borboletas, passarinho, aquário, ouriço, coruja, patinho) e 18
    externos (torre, bandeirolas, ponte, lago com cisnes, cerca, portão,
    carruagem de abóbora, poste de luz, banco, balanço, arco-íris, nuvem, lua,
    estrelas, sol, casinha de passarinho, poço dos desejos, fonte).
- Animações sutis: respirar, piscar, rabinho, chamas, água, pêndulo,
  bailarina, bolhas, borboletas, peixinhos, bandeiras, pétalas caindo.
- Os 8 cômodos com decoração e itens iniciais próprios.
- Catálogo mostra primeiro os itens sugeridos para o cômodo atual.
- Testes de integridade da arte; ADR 0010.

### Fase 3 — Planilha e sincronização

- `apps-script/Code.gs` completo: `setup()`, `doGet` (ping) e `doPost`
  (`load`, `saveRoom`, `saveProfile`, `savePhoto`, `deletePhoto`), PIN em
  Script Properties com limite de tentativas (CacheService), `LockService`,
  concorrência otimista por revisão, pedaços de 45 mil caracteres, validação
  rígida, leitura/escrita em lote e aba `log` com rotação.
- Testes do backend rodando o `Code.gs` real numa planilha simulada.
- Motor de sincronização offline-first: fila persistente, debounce de 3 s,
  envio ao ir para segundo plano, retry com backoff, reconciliação por cômodo,
  conflito sem perda (versão anterior restaurável) e mescla do perfil.
- Tela "Digite o código do castelo", indicador de sync no topo (com detalhes e
  "tentar de novo"), Configurações (sons/toque, nuvem, versões anteriores,
  créditos).
- E2E de dois aparelhos, PIN errado e offline com a planilha simulada.
- ADRs 0008 e 0009; passo a passo em `apps-script/README.md`.

### Fase 2 — Núcleo do jogo

- Modelo do domínio (cômodos, itens, decoração, luz) com schemas zod,
  `schemaVersion` e framework de migrações testado.
- Store imutável com eventos + padrão Command: adicionar, mover, redimensionar,
  girar, espelhar, cor, travar, frente/trás, duplicar, excluir, pintar, luz;
  desfazer/refazer 50 passos por cômodo.
- IndexedDB com salvamento automático (agrupado, com retry), quarentena para
  dados corrompidos e pedido de armazenamento persistente.
- Palco quadrado em %, diff por id, prévia de gestos só com `transform`,
  hit-testing pelo desenho + folga para dedos.
- Gestos: arrastar sem atraso, pinça (redimensiona + gira com ímã em 90°), alça
  de 1 dedo, toque longo (menu rápido), lixeira/fora do palco exclui, guias e
  "ímã" de alinhamento.
- Arte SVG própria de 17 itens (móveis, decoração, plantas, bichinhos, fonte)
  com 6 variações de cor e animações sutis; carregamento sob demanda por
  categoria.
- Fundos: paredes com 7 padrões, chão em perspectiva com 6 padrões, lambri e
  sanca dourada; fachada com castelo pintável, céu de dia/entardecer/noite e
  chão de grama/pedras/flores; jardim.
- Telas: abertura animada, mapa do castelo em corte com miniaturas reais e
  cadeados, cômodo com gaveta de catálogo (abas, busca, arrastar para o palco),
  painel Pintar, barra do item, modo Ver e atalhos de teclado.
- Brilhinhos ao adicionar, vibração leve (com "tique" no iOS 18+), toasts.
- ADRs 0005–0007; e2e de adicionar, mover, pinça, barra, pintar, desfazer,
  salvar/recarregar, lixeira e navegação.

### Fase 1 — Fundação

- Projeto Vite 8 + TypeScript 6 `strict` (sem `any`, com
  `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`).
- ESLint (`strict-type-checked`) com a regra de camadas da arquitetura,
  Prettier, Husky + lint-staged + commitlint (Conventional Commits).
- Vitest (unidade) e Playwright (e2e em iPhone 14 e Galaxy Tab S9).
- CI/CD no GitHub Actions: lint → formatação → typecheck → testes → build →
  e2e → deploy no GitHub Pages (só na `main`).
- PWA: manifest, ícones da coroa (192/512/maskable/apple-touch), service worker
  com precache e atualização sob confirmação.
- Tokens de design (cores, tipografia, raios, sombras, movimento, safe areas),
  fontes Nunito e Dancing Script auto-hospedadas.
- Registro de eventos com buffer circular, captura global de erros e página de
  erro amigável.
- ADRs 0001–0004.
