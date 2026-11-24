# 0009 — Segurança do backend: PIN em Script Properties com limite de tentativas

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto

O App da Web precisa ser "Qualquer pessoa" (o jogo chama sem login Google), e a
URL fica visível no JavaScript publicado. O repositório é público.

## Decisão

- **PIN só em `PropertiesService` (Script Properties)**, nunca no código, no
  repositório ou nos secrets do GitHub. No aparelho, o PIN digitado fica no
  IndexedDB.
- Comparação em **tempo constante**.
- **Limite de tentativas com `CacheService`**: 5 erros por aparelho → bloqueio
  de 15 min; 30 erros/hora no total → bloqueio de 30 min para aparelhos
  **desconhecidos**. Aparelhos que já acertaram o PIN (lista curta em Script
  Properties) continuam funcionando, então um ataque não tranca a Ayne fora.
- **Validação rígida de tudo** que é gravado (ids com regex, dados em base64,
  miniaturas `data:image/...;base64`, JSON válido no perfil, tamanhos). Isso
  também impede gravar fórmulas na planilha.
- `LockService` em toda escrita; leitura e escrita **em lote**
  (`getValues`/`setValues`), nunca célula a célula.
- Erros nunca vazam detalhes internos sensíveis; tudo vai para a aba `log`
  (com rotação).
- Escopo OAuth mínimo: `spreadsheets.currentonly`.

## Consequências

- Recomenda-se PIN numérico de 6+ dígitos: com os limites, adivinhar é
  impraticável.
- Quem tiver a URL e o PIN tem acesso total ao castelo (é o modelo desejado:
  um castelo, uma dona).
