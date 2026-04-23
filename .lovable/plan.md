

## Análise do arquivo

Confirmei: o `Mega-Sena.xlsx` é o arquivo **oficial da Caixa Econômica Federal**, com as colunas:

`Concurso | Data do Sorteio | Bola1..Bola6 | Ganhadores 6/5/4 acertos | Cidade/UF | Rateios | Acumulado | Arrecadação | Estimativa | Mega da Virada | Observação`

Isso é **superior** ao que temos hoje:
- Hoje no banco: **278 concursos** registrados (com muitos buracos), do concurso 1 ao 2998
- Excel oficial: **todos** os ~2998 concursos sem gaps, com dados de premiação completos

## O que o plano vai fazer

Importar 100% do histórico da Mega Sena para a tabela `resultados_loterias`, preenchendo os ~2700 concursos faltantes e atualizando os existentes — com cálculo dos mesmos indicadores estatísticos (pares, primos, moldura, fibonacci, soma, sequências, repetidas) usados pela `sync-megasena`, garantindo consistência total com o sistema atual.

## Plano de implementação

**1. Edge Function `backfill-megasena-excel`** (admin-only)
- Recebe o XLSX via upload (multipart) ou base64
- Parseia com biblioteca `xlsx` (Deno)
- Para cada linha:
  - Monta `dezenas[]` ordenadas (Bola1..Bola6)
  - Converte data BR → ISO
  - Calcula indicadores (pares, ímpares, primos, moldura, fibonacci, soma, sequências) usando as mesmas constantes da `sync-megasena/index.ts`
  - Calcula `qtd_repetidas` comparando com concurso anterior (no próprio arquivo, em ordem)
  - Monta `premiacao_json` a partir das colunas de Rateio/Ganhadores (faixas 6, 5 e 4 acertos)
  - Preenche `acumulou`, `valor_acumulado`, `valor_estimado_proximo`, `local_sorteio` (Cidade/UF)
- Faz **upsert em batch de 500** em `resultados_loterias` com `onConflict: "loteria,concurso"`
- Retorna resumo: `{ total_lidos, inseridos, atualizados, erros }`

**2. UI admin: botão "Importar histórico Mega Sena"** em `/admin` (área já existente de ferramentas)
- Input de arquivo XLSX
- Barra de progresso
- Confirmação antes de executar (operação grande, ~3000 upserts)
- Exibe resumo ao final

**3. Sem mudança de schema** — a tabela `resultados_loterias` já tem todos os campos necessários (validei).

## Detalhes técnicos

- **Idempotente**: rodar 2x não duplica (upsert por `loteria,concurso`)
- **Não quebra a sync diária**: a `sync-megasena` continua funcionando normalmente; quando rodar e ver que já tem o último concurso, não faz nada
- **Indicadores 100% consistentes**: reutiliza exatamente as constantes `PRIMOS_MEGASENA`, `MOLDURA_MEGASENA`, `FIBONACCI_MEGASENA` já definidas em `sync-megasena/index.ts`
- **Performance**: ~3000 linhas em batches de 500 → ~6 upserts → < 30s
- **Segurança**: função verifica `has_role(uid, 'admin')` antes de processar

## O que NÃO faz

- Não toca em outras loterias
- Não altera schema do banco
- Não substitui a sync diária via API (continua sendo a fonte para concursos novos)
- Não importa dados de prêmios complexos que o Excel não traz (locais detalhados de ganhadores ficam vazios — só o que o XLSX fornece)

