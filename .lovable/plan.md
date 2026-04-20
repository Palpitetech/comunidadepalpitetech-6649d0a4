

## Plano: Adicionar campo "Investimento Mensal" (custo mensal normalizado)

### Conceito

Cada investimento tem um valor total pago para cobrir um período (ex: R$ 240 por 6 meses = R$ 40/mês). O novo campo **Investimento Mensal** mostra esse custo normalizado para 1 mês, permitindo comparar gastos de fornecedores com prazos diferentes.

### Cálculo (frontend, derivado — sem mudar o banco)

Função `calcularMensal(inv)` retorna o valor mensal:

| `periodo_validade` | Fórmula |
|---|---|
| `1_mes` | `valor / 1` |
| `3_meses` | `valor / 3` |
| `6_meses` | `valor / 6` |
| `12_meses` | `valor / 12` |
| `personalizado` | `valor / (periodo_dias_custom / 30)` |
| `nd` | `—` (sem período definido, não calcula) |

### Mudanças em `src/pages/admin/AdminInvestimentos.tsx`

**1. Helper novo** (logo abaixo de `formatBRL`):
```ts
function calcularMensal(inv: Investimento): number | null {
  const v = Number(inv.valor);
  switch (inv.periodo_validade) {
    case "1_mes": return v;
    case "3_meses": return v / 3;
    case "6_meses": return v / 6;
    case "12_meses": return v / 12;
    case "personalizado":
      if (!inv.periodo_dias_custom || inv.periodo_dias_custom <= 0) return null;
      return v / (inv.periodo_dias_custom / 30);
    case "nd": return null;
  }
}
```

**2. Novo card no resumo (summary)** — adicionar 5º card "Custo Mensal Total":
- Soma `calcularMensal()` de todos os investimentos **ativos** (ignora `nd` e expirados)
- Grid passa de `lg:grid-cols-4` → `lg:grid-cols-5`
- Ícone: `CalendarClock` (lucide-react), cor azul
- Label: "Custo Mensal" / valor em destaque / sub: "equivalente/mês"

**3. Nova coluna na tabela** — entre "Valor" e "Período":
- Header: `Mensal` (alinhado à direita)
- Célula: `formatBRL(calcularMensal(inv))` ou `—` se `nd`/personalizado inválido
- Estilo: `text-xs text-muted-foreground` (secundário, para não competir com o valor principal)
- Atualizar `colSpan={9}` no estado vazio

**4. Atualizar `summary` (useMemo)**:
- Adicionar `mensalAtivo`: soma de `calcularMensal` apenas dos ativos com valor não-nulo

### Fora de escopo

- **Sem migração de banco** — o campo é 100% derivado/calculado em runtime
- Não alterar formulário (não há novo input)
- Não alterar lógica de `data_fim`, validações ou triggers
- Não alterar outras páginas do admin

### Resultado esperado

- Coluna "Mensal" na tabela mostrando custo normalizado por investimento
- Card "Custo Mensal" no topo somando todos os ativos
- Investimentos `nd` (sem validade) exibem `—` (não entram na soma mensal)

