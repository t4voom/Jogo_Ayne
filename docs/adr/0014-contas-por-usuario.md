# 0014 — Contas com usuário e senha: cada conta tem o próprio castelo

- **Status:** Aceito
- **Data:** 2026-11-25

## Contexto

Até a versão 1.0 havia um castelo só, protegido por um PIN único (ADR 0009).
O Gustavo pediu login: cada pessoa entra com a própria conta e tem o próprio
salvamento. Restrições:

- o backend continua sendo o Apps Script publicado como "Qualquer pessoa"
  (o jogo chama sem login Google);
- o jogo continua offline-first e não pode perder o castelo que já existe;
- nada de segredo no repositório;
- a carta e as mensagens carinhosas são só para a Ayne.

Alternativas consideradas:

- **Entrar com Google:** exige um projeto OAuth no Google Cloud, e o login
  do Google falha com frequência no app instalado na tela inicial do iPhone.
- **Contas criadas só na planilha:** sem tela de cadastro, mas o Gustavo
  teria de rodar funções no editor do Apps Script para cada pessoa.
- **Cadastro no app com convite (escolhida):** qualquer pessoa com o código
  de convite cria a própria conta no jogo.

## Decisão

- **Cadastro com convite.** O código de convite é a propriedade `PIN` que já
  existia. Quem tem o link mas não tem o convite não cria conta.
- **Senhas.** Ficam na aba `contas` como hash: HMAC-SHA256 com sal por
  conta, repetido 300 vezes, com um segredo do servidor (`SEGREDO` nas
  Script Properties, gerado sozinho na primeira conta). A senha em texto
  nunca é gravada nem vai para o log.
- **Sessão.**
  - Formato do token: `conta.versão.emitidoEm.assinatura`, assinado com HMAC
    pelo mesmo segredo.
  - Não expira: a Ayne não precisa entrar toda hora.
  - Trocar a senha sobe a `versaoSessao` e derruba os tokens antigos.
  - O cache do servidor guarda o resumo da conta por 10 minutos, para não
    ler a aba a cada gravação.
- **Isolamento.** O perfil dos dados (coluna `profileId`) vem **do token**,
  nunca do pedido: uma conta não lê nem grava o castelo de outra.
- **Limite de tentativas.** As regras do ADR 0009 (5 erros por aparelho,
  30/hora no global, aparelhos conhecidos isentos) valem para senha e
  convite. Usuário inexistente e senha errada recebem a mesma resposta.
- **Esqueci a senha.** O Gustavo escreve uma senha provisória na coluna
  `redefinirSenha`. No próximo login com ela, a provisória vira a senha e
  as outras sessões caem. Não há funções para rodar no editor.
- **Castelo antigo.**
  - No servidor, os dados de antes das contas tinham `profileId = 'ayne'`.
    A primeira conta cadastrada com o usuário da Ayne (`CONTA_DA_AYNE` em
    `src/content/carta.ts`) recebe exatamente esse id e herda tudo.
  - No aparelho, essa conta continua usando o banco antigo
    (`castelo-da-ayne`). As outras contas ganham bancos próprios
    (`castelo-da-ayne--<conta>`).
- **No aparelho.**
  - A sessão fica no `localStorage`, validada com zod ao ler. Ela é lida
    antes de abrir o banco da conta.
  - O id do aparelho é um só para todas as contas.
  - Sair grava o que falta, tenta subir, limpa a sessão e recarrega. As
    pendências ficam no banco da conta e sobem quando ela entrar de novo.
- **Conta da Ayne.** Só ela recebe a carta, as mensagens carinhosas e a
  fala "Princesa Ayne" da fadinha. As outras contas recebem mensagens gerais.
- **Compatibilidade.** O app antigo, que ainda manda `pin`, recebe
  `upgrade_required`. O app novo falando com o `Code.gs` antigo mostra
  "atualize o Code.gs". Qualquer GET mostra a saúde do serviço.

## Consequências

- O primeiro acesso de cada aparelho precisa de internet (para entrar).
  Depois disso, tudo continua funcionando offline.
- O token fica no `localStorage`. Com a CSP e sem HTML de terceiros, o risco
  de XSS é baixo. Ele dá acesso só ao castelo daquela conta, e trocar a senha
  o invalida.
- Quem tem o convite cria contas, mas não lê as dos outros. Trocar o PIN
  muda o convite sem afetar quem já tem conta.
- Antes de publicar o app novo, é preciso republicar o `Code.gs`
  ("Gerenciar implantações → Nova versão", a URL não muda).
