# 📊 Backend na planilha (Google Apps Script)

Este é o "servidor" do jogo: uma planilha do Google com um script que guarda
as **contas** e o castelo de cada uma, e deixa todos os aparelhos iguais. O
jogo **funciona sem ele** (tudo salva no aparelho); a planilha é o que guarda
as contas, sincroniza e faz backup.

Tempo estimado: **15 minutos**, uma vez só.

> **Já publicou a versão antiga (com o PIN)?** Vá direto para
> [Atualizar para a versão com contas](#atualizar-para-a-versão-com-contas).

---

## 1. Criar a planilha

1. Abra <https://sheets.new> (logado na sua conta Google).
2. Dê um nome, por exemplo **"Castelo da Ayne — dados"**.

   > Você verá uma planilha vazia com a aba "Página1". Pode deixar; o script
   > cria as abas certas.

## 2. Colar o código

1. Na planilha, menu **Extensões → Apps Script**.

   > Abre uma nova aba com o editor, mostrando um arquivo `Código.gs` com uma
   > função `myFunction` vazia.

2. Apague tudo o que estiver no editor e **cole o conteúdo inteiro de
   [`Code.gs`](Code.gs)**.
3. Clique no ícone de disquete (**Salvar projeto**) ou `Ctrl+S`.
4. (Recomendado) Em **Configurações do projeto** (ícone de engrenagem à
   esquerda), marque **"Mostrar arquivo de manifesto appsscript.json no
   editor"**. Volte ao **Editor** (ícone `< >`), abra `appsscript.json` e
   substitua o conteúdo pelo de [`appsscript.json`](appsscript.json). Salve.

   > Isso fixa o fuso horário de São Paulo e pede só a permissão mínima
   > ("ver e editar apenas esta planilha").

## 3. Rodar o `setup()`

1. No topo do editor, no seletor de funções, escolha **`setup`** e clique em
   **▶ Executar**.
2. Na primeira vez o Google pede autorização:
   - **Revisar permissões** → escolha sua conta.
   - Pode aparecer **"O Google não verificou este app"**: clique em
     **Avançado → Acessar "Castelo…" (não seguro)**. É seguro: o app é seu e
     só mexe nesta planilha.
   - **Permitir**.
3. No **Registro de execução** aparece:
   _"Abas criadas. Agora defina a propriedade de script "PIN"…"_

   > Volte à planilha: agora existem as abas **saves**, **profile**,
   > **album** e **log**, cada uma com a linha de cabeçalho rosinha.

## 4. Definir o código de convite (propriedade PIN)

O código de convite é o que se pede para **criar uma conta** no jogo. Ele fica
guardado **só nas propriedades do script** (com o nome `PIN`), nunca no código
nem no GitHub.

1. No editor do Apps Script: **Configurações do projeto** (engrenagem).
2. Role até **Propriedades do script → Adicionar propriedade do script**.
3. **Propriedade:** `PIN` · **Valor:** um código **só de números**, com **6
   dígitos ou mais** (ex.: a data especial de vocês). Só números porque no
   celular o teclado do código é numérico.
4. **Salvar propriedades do script**.

> Proteção contra chutes (de senha e de convite): depois de **5 erros** o
> aparelho fica bloqueado por 15 min, e depois de **30 erros por hora**
> (somando todos) só aparelhos que já entraram antes continuam entrando.
> Trocar o PIN só muda o convite: quem já tem conta continua entrando
> normalmente.
>
> O script também cria sozinho uma propriedade `SEGREDO` na primeira conta.
> **Não apague nem edite**: ela protege as senhas e as sessões. Se for
> apagada, todo mundo precisa criar a conta de novo.

## 5. Publicar como App da Web

1. No editor, botão azul **Implantar → Nova implantação**.
2. Em **Selecionar tipo** (engrenagem) escolha **App da Web**.
3. Preencha:
   - **Descrição:** `Castelo v1`
   - **Executar como:** **Eu** (seu e-mail)
   - **Quem pode acessar:** **Qualquer pessoa**
4. **Implantar**. Se pedir autorização de novo, autorize como no passo 3.
5. Copie a **URL do app da Web** — termina em **`/exec`**, algo como
   `https://script.google.com/macros/s/AKfycb…/exec`.

   > "Qualquer pessoa" é necessário para o jogo conseguir chamar sem login do
   > Google. Quem não tiver o PIN não lê nem grava nada.

**Teste rápido:** abra a URL no navegador. Deve aparecer algo como
`{"ok":true,"data":{"version":2,"configured":true},"serverTime":…}`.
Se `configured` for `false`, o código de convite não foi salvo (passo 4).

## 6. Colocar a URL no GitHub (deploy)

1. No GitHub, repositório **t4voom/Jogo_Ayne → Settings → Secrets and
   variables → Actions → New repository secret**.
2. **Name:** `VITE_SHEETS_API_URL` · **Secret:** a URL do passo 5.
3. **Add secret**.
4. Rode o deploy de novo: aba **Actions → CI/CD → Run workflow** (na `main`),
   ou faça qualquer merge na `main`.

Para testar localmente, coloque a mesma URL no arquivo `.env.local` (copie de
`.env.example`) e rode `npm run dev`.

> ⚠️ A URL acaba embutida no JavaScript publicado (todo `VITE_*` acaba). Ela
> não é um segredo de verdade; o que protege os dados são as **senhas** e o
> **convite**, com o limite de tentativas.

## 7. Primeiro uso nos aparelhos

O jogo abre na tela **Entrar / Criar conta**.

1. No primeiro aparelho, toque em **Criar conta**: nome de usuário, senha e o
   **código de convite** (o PIN do passo 4).
   - A conta da Ayne deve usar o usuário definido em `CONTA_DA_AYNE`, em
     `src/content/carta.ts` (padrão: `ayne`). É essa conta que recebe a carta
     e as mensagens carinhosas, e que herda o castelo feito antes das contas.
2. Nos outros aparelhos, é só **Entrar** com o mesmo usuário e senha.
3. Outras pessoas criam as próprias contas do mesmo jeito; cada uma tem o
   próprio castelo.

O indicador no topo mostra uma nuvenzinha com ✓ quando está tudo salvo na
planilha.

| Indicador           | Significa                                                           |
| ------------------- | ------------------------------------------------------------------- |
| ☁️ com ✓            | Salvo no aparelho e na planilha                                     |
| 🔄 setinhas girando | Enviando as últimas mudanças                                        |
| ☁️ cinza riscada    | Sem internet — salvo no aparelho, sobe quando voltar                |
| ⚠️ alerta           | Erro — toque para ver detalhes e "Tentar de novo"                   |
| 🔑 chave            | A sessão terminou (senha trocada em outro aparelho): entrar de novo |

## Esqueci a senha

1. Abra a planilha, aba **contas**, e ache a linha do usuário (coluna
   `usuario`).
2. Na coluna **`redefinirSenha`** dessa linha, escreva uma senha provisória
   (6 caracteres ou mais).
3. No jogo, entre com o usuário e essa senha provisória. Ela vira a senha da
   conta, a célula se apaga sozinha e os outros aparelhos pedem para entrar
   de novo.
4. Depois, troque por uma senha nova em **Configurações → Conta e nuvem →
   Trocar**.

> As senhas nunca ficam na planilha em texto: a coluna `senha` guarda só um
> código embaralhado (hash), que não dá para desfazer.

## Atualizar para a versão com contas

Se você já tinha publicado a versão com o PIN (1.0), faça isto **antes** de
fazer o merge da versão nova do jogo:

1. No editor do Apps Script, apague tudo, cole o **novo** [`Code.gs`](Code.gs)
   e **salve**.
2. **Implantar → Gerenciar implantações** → lápis (**Editar**) → **Versão:
   Nova versão** → **Implantar**. A URL continua a mesma; não precisa mexer no
   GitHub.
3. (Opcional) Rode `setup()` de novo; ele só cria a aba nova `contas`. O
   script também a cria sozinho no primeiro cadastro.
4. A propriedade `PIN` continua; agora ela é o **código de convite**.
5. Faça o merge da versão nova do jogo. Nos aparelhos, aparece a tela de
   entrar: a Ayne cria a conta com o usuário `ayne` e recebe o castelo que já
   estava na planilha e no aparelho.

Se fizer o merge antes de atualizar o script, a tela de entrar avisa: "A
planilha está com a versão antiga do script". É só fazer os passos acima.

------------------- | ---------------------------------------------------- |
| ☁️ com ✓ | Salvo no aparelho e na planilha |
| 🔄 setinhas girando | Enviando as últimas mudanças |
| ☁️ cinza riscada | Sem internet — salvo no aparelho, sobe quando voltar |
| ⚠️ alerta | Erro — toque para ver detalhes e "Tentar de novo" |
| 🔑 chave | Falta digitar (ou o PIN mudou) |

---

## Republicar depois de mudar o `Code.gs`

Sempre que o `Code.gs` deste repositório mudar:

1. Cole o novo conteúdo no editor e **salve**.
2. **Implantar → Gerenciar implantações**.
3. Na implantação ativa, clique no lápis (**Editar**).
4. Em **Versão**, escolha **Nova versão** → **Implantar**.

Assim a **URL continua a mesma** e não precisa mexer no GitHub. (Se você criar
uma "Nova implantação" em vez de editar, a URL muda e é preciso atualizar o
secret `VITE_SHEETS_API_URL`.)

---

## Como os dados ficam na planilha

| Aba       | Colunas                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------- |
| `saves`   | profileId · roomId · chunkIndex · chunkTotal · data · updatedAt · revision · deviceId                |
| `profile` | profileId · estrelinhas · desbloqueios · missoes · conquistas · configuracoes · updatedAt · revision |
| `album`   | profileId · photoId · roomId · createdAt · thumbnail · chunkIndex · chunkTotal                       |
| `log`     | timestamp · acao · deviceId · resultado · erro                                                       |
| `contas`  | accountId · usuario · nome · sal · senha (hash) · criadaEm · versaoSessao · redefinirSenha           |

- Cada cômodo é JSON compactado (lz-string → base64). Se passar de 45 mil
  caracteres, vira várias linhas (`chunkIndex`/`chunkTotal`) e é remontado na
  leitura — nunca é entregue pela metade.
- `revision` sobe a cada gravação. Se um aparelho tentar gravar em cima de uma
  revisão mais nova, a planilha devolve **conflito** com a versão dela, e o jogo
  decide sem perder nada (a outra versão fica em **Configurações → Versões
  anteriores**).
- A aba `log` guarda as gravações e erros (no máximo ~2.000 linhas; as mais
  antigas são apagadas sozinhas).
- `profileId` é o `accountId` da conta dona dos dados (a conta da Ayne usa
  `ayne`, o mesmo id do castelo de antes das contas).
- Na aba `contas`, só a coluna `redefinirSenha` é para mexer à mão (veja
  [Esqueci a senha](#esqueci-a-senha)). Para apagar uma conta, apague a linha
  dela em `contas` e as linhas com o `accountId` dela nas outras abas.
- **Não edite as abas à mão** enquanto o jogo estiver aberto. Para "zerar" um
  castelo, apague as linhas com o `profileId` da conta nas abas `saves`,
  `profile` e `album`.

## Problemas comuns

| Sintoma                            | O que fazer                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| "A planilha não respondeu em JSON" | A URL está errada ou a implantação não é "Qualquer pessoa".    |
| "O código de convite ainda não…"   | Falta a propriedade `PIN` (passo 4).                           |
| "Versão antiga do script"          | Cole o `Code.gs` novo e publique uma Nova versão.              |
| "Usuário ou senha incorretos"      | Confira o usuário; ou use [Esqueci a senha](#esqueci-a-senha). |
| "Muitas tentativas"                | Espere 15 min (ou o tempo indicado).                           |
| Nuvem sempre cinza                 | Sem internet, ou a URL no secret está vazia.                   |
| Mudou o `Code.gs` e nada mudou     | Faltou "Editar implantação → Nova versão" (seção acima).       |

## Testes

O `Code.gs` é testado de verdade no Node (`apps-script/test/`), com uma
planilha simulada em memória: contas, senhas, sessões, isolamento entre
contas, convite, bloqueios, conflitos, pedaços, lote, validações e log. Rode `npm test`.
