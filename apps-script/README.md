# 📊 Backend na planilha (Google Apps Script)

Este é o "servidor" do jogo: uma planilha do Google com um script que guarda o
castelo da Ayne e deixa o tablet e o celular iguais. O jogo **funciona sem
ele** (tudo salva no aparelho); a planilha é o que sincroniza e faz backup.

Tempo estimado: **15 minutos**, uma vez só.

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

## 4. Definir o PIN (código do castelo)

O PIN fica guardado **só nas propriedades do script** — nunca no código nem no
GitHub.

1. No editor do Apps Script: **Configurações do projeto** (engrenagem).
2. Role até **Propriedades do script → Adicionar propriedade do script**.
3. **Propriedade:** `PIN` · **Valor:** um código **só de números**, com **6
   dígitos ou mais** (ex.: a data especial de vocês). Só números porque no
   celular o teclado do código é numérico.
4. **Salvar propriedades do script**.

> Proteção contra chutes: depois de **5 erros** o aparelho fica bloqueado por
> 15 min, e depois de **30 erros por hora** (somando todos) só aparelhos que já
> acertaram antes continuam entrando. Para trocar o PIN, edite a propriedade e
> digite o novo código em **Configurações → Código do castelo** nos aparelhos.

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

**Teste rápido:** abra no navegador a URL + `?action=ping`. Deve aparecer
algo como `{"ok":true,"data":{"version":1,"configured":true},"serverTime":…}`.
Se `configured` for `false`, o PIN não foi salvo (passo 4).

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
> não é um segredo de verdade; o que protege os dados é o **PIN** com o limite
> de tentativas.

## 7. Primeiro uso nos aparelhos

Ao tocar em **"Entrar no castelo"** aparece **"Digite o código do castelo"**.
Digite o PIN em cada aparelho. Pronto: o indicador no topo mostra uma
nuvenzinha com ✓ quando está tudo salvo na planilha.

| Indicador           | Significa                                            |
| ------------------- | ---------------------------------------------------- |
| ☁️ com ✓            | Salvo no aparelho e na planilha                      |
| 🔄 setinhas girando | Enviando as últimas mudanças                         |
| ☁️ cinza riscada    | Sem internet — salvo no aparelho, sobe quando voltar |
| ⚠️ alerta           | Erro — toque para ver detalhes e "Tentar de novo"    |
| 🔑 chave            | Falta digitar (ou o PIN mudou)                       |

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

- Cada cômodo é JSON compactado (lz-string → base64). Se passar de 45 mil
  caracteres, vira várias linhas (`chunkIndex`/`chunkTotal`) e é remontado na
  leitura — nunca é entregue pela metade.
- `revision` sobe a cada gravação. Se um aparelho tentar gravar em cima de uma
  revisão mais nova, a planilha devolve **conflito** com a versão dela, e o jogo
  decide sem perder nada (a outra versão fica em **Configurações → Versões
  anteriores**).
- A aba `log` guarda as gravações e erros (no máximo ~2.000 linhas; as mais
  antigas são apagadas sozinhas).
- **Não edite as abas à mão** enquanto o jogo estiver aberto. Para "zerar" o
  castelo, apague as linhas de dados (mantenha o cabeçalho) nas abas `saves`,
  `profile` e `album`.

## Problemas comuns

| Sintoma                            | O que fazer                                                 |
| ---------------------------------- | ----------------------------------------------------------- |
| "A planilha não respondeu em JSON" | A URL está errada ou a implantação não é "Qualquer pessoa". |
| "O código ainda não foi definido…" | Falta a propriedade `PIN` (passo 4).                        |
| "Muitas tentativas"                | Espere 15 min (ou o tempo indicado).                        |
| Nuvem sempre cinza                 | Sem internet, ou a URL no secret está vazia.                |
| Mudou o `Code.gs` e nada mudou     | Faltou "Editar implantação → Nova versão" (seção acima).    |

## Testes

O `Code.gs` é testado de verdade no Node (`apps-script/test/`), com uma
planilha simulada em memória: PIN, bloqueios, conflitos, pedaços, lote,
validações e log. Rode `npm test`.
