# 0008 — Sincronização offline-first com Google Sheets

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

O progresso precisa aparecer igual no tablet e no iPhone, sem nunca depender
da rede para jogar e sem nunca perder trabalho. O "servidor" é uma planilha com
Google Apps Script (gratuito, sem infraestrutura), com cotas, limite de 50.000
caracteres por célula e sem suporte a CORS com preflight.

## Decisão

- **Fonte local primeiro**: toda mudança grava no IndexedDB (ADR 0007). A rede
  é só replicação.
- **Unidade de sync = cômodo** (mais o perfil e as miniaturas do álbum). Cada
  cômodo leva `revision` (do servidor) e `updatedAt` (da última edição).
- **Fila persistente (`outbox`)** com uma entrada por cômodo: ao enviar, sobe
  sempre o **último estado** (uma requisição por cômodo por rodada, nunca uma
  por movimento). Debounce de 3 s; envio imediato em
  `visibilitychange: hidden`/`pagehide` (com `keepalive` quando cabe).
- **Retry com backoff exponencial** (2 s, 4 s, 8 s… até 5 min, ±20% de
  jitter); `online` dispara nova tentativa; reabrir o app tenta tudo na hora.
- **Concorrência otimista**: cada gravação manda a revisão em que se baseia;
  a planilha (com `LockService`) recusa se já houver revisão maior e devolve a
  versão dela.
- **Reconciliação por cômodo** ao abrir (busca em paralelo com o local já na
  tela), ao voltar ao app (>30 s) e a cada 5 min visível:
  - remoto mais novo, nada pendente aqui → aplica com aviso
    "Atualizado do outro aparelho ✨";
  - conflito real → fica o de `updatedAt` mais recente; o outro vira
    **versão anterior** restaurável em Configurações. Restaurar também guarda a
    versão atual.
- **Perfil** não usa "último ganha": é **mesclado** (`mergeProfiles`) para não
  perder progresso feito offline nos dois aparelhos.
- **Formato**: cômodo = JSON versionado → lz-string → base64; a planilha divide
  em pedaços de 45 mil caracteres e remonta na leitura (nunca entrega pela
  metade). Dados de versão **futura** não são aplicados (avisa para atualizar).
- **CORS**: POST `text/plain` com JSON no corpo (requisição simples).
- **Status** visível: sincronizado, sincronizando, offline (salvo no aparelho),
  erro (toque para detalhes/tentar de novo) e "precisa do código".

## Consequências

- O jogo é 100% utilizável offline; a planilha é backup + ponte.
- Os testes do motor rodam contra o **`Code.gs` real** (Node + `vm` com a
  planilha simulada) e os e2e interceptam a rede e respondem com o mesmo
  backend, cobrindo dois aparelhos, offline e conflito.
- Granularidade por cômodo significa que mexer no mesmo cômodo nos dois
  aparelhos offline gera escolha de uma versão (a outra fica salva). Fazer
  merge item a item seria mais complexo e confuso para a jogadora.
