

## Anti-Alucinação Numérica nos Posts

Travar todos os números importantes (concurso, dezenas, contagens) no código. A IA passa a escrever apenas o **texto criativo entre os números fixos** — nunca mais inventa valores.

## Problema atual

No post de resultado do concurso 3667, a IA escreveu "3267" no título. Isso aconteceu porque:
- O título é gerado **integralmente pela IA**, com o número do concurso embutido no prompt como texto.
- Modelos generativos podem trocar dígitos (3667 → 3267, 3676, etc.) — é uma falha conhecida e inevitável quando números ficam "soltos" no texto.
- Não havia validação após a resposta.

## Solução: Template fixo + Validação numérica

### 1. Título 100% determinístico (sem IA)

O título deixa de ser gerado pela IA. Passa a ser montado em código:

```text
🚨 Resultado Lotofácil — Concurso 3667
```

A IA só recebe a tarefa de gerar o **conteúdo** do post.

### 2. Validador numérico no conteúdo

Após a IA responder, rodar uma função `validarNumeros()` que:
- Extrai todos os números de 3 a 5 dígitos do conteúdo gerado.
- Confere se o **número do concurso esperado** aparece pelo menos uma vez.
- Confere se nenhum número "estranho" próximo do real aparece (ex.: 3666, 3668, 3267) — usando lista permitida.
- Confere se as 15 dezenas citadas no texto são exatamente as oficiais (regex `\b(0[1-9]|1[0-9]|2[0-5])\b` cruzada com o array real).
- Se falhar: descarta o texto da IA e usa **fallback determinístico** (template pronto preenchido apenas com números reais).

### 3. Fallback determinístico do conteúdo

Já existe parcialmente em `generate-guide-post`. Replicar no `sync-lotofacil` para o post de resultado:

```text
🎯 Dezenas sorteadas
**01 - 02 - 04 - ...**

📊 Raio-X
• Pares: 7 | Ímpares: 8
• Moldura: 9 dezenas
• Primos: 5
• Repetidas: 9 do concurso anterior

🔄 Ciclo {N}
{X} dezenas faltam: [...]

💬 E aí, acertou quantas?
```

A IA só entra para deixar a abertura mais humana. Se ela falhar ou alucinar, o fallback publica mesmo assim.

### 4. Aplicar nos 6 posts diários também

Em `generate-guide-post`, repetir o mesmo padrão:
- Título montado em código com o `proxConcurso` (já calculado).
- Conteúdo da IA passa pelo `validarNumeros()`.
- Se houver número que não está na lista permitida (concurso, dezenas reais, indicadores) → fallback.

### 5. Corrigir o post 3667 já publicado

Atualizar o título do post existente na tabela `postagens` para o formato correto, via migration de `UPDATE`.

## Arquivos afetados

1. `supabase/functions/sync-lotofacil/index.ts` — título fixo + validador + fallback de conteúdo do resultado.
2. `supabase/functions/generate-guide-post/index.ts` — título fixo + validador aplicado ao conteúdo.
3. 1 migration SQL — `UPDATE postagens SET titulo = '🚨 Resultado Lotofácil — Concurso 3667' WHERE concurso_referencia = 3667 AND tipo = 'resultado_oficial'`.

## Garantias após o refator

- Número do concurso no título: **impossível alucinar** (vem direto da variável).
- Dezenas no conteúdo: validadas contra o array real antes de publicar.
- Indicadores (pares, primos, etc.): validados contra os valores calculados.
- Se a IA falhar de qualquer forma → fallback publica texto correto baseado em template.
- Zero risco de publicar número errado, em qualquer post.

