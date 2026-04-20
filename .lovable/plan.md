

## Plano: Página "Custos Operacionais" (`/admin/custos-operacionais`)

Centraliza **todos os custos da operação** num único painel: assinaturas operacionais, recargas de chip, custo de aquisição de chips e lançamentos manuais (recorrentes ou avulsos).

> Observação: já existe `/admin/custos` ocupada por **Custos IA** (token/USD). Para evitar conflito, esta nova página usa **`/admin/custos-operacionais`**. Se preferir reaproveitar `/admin/custos`, a IA renomeia a página atual antes — confirme se for esse o caso.

### 1. Banco de dados (migração SQL)

**Tabela `custos_operacionais_manuais`** (apenas lançamentos manuais; os automáticos vêm de views):
- `id` uuid PK
- `descricao` text NOT NULL
- `valor` numeric NOT NULL CHECK (`valor >= 0`)
- `categoria` text NOT NULL — `infraestrutura` | `servico` | `marketing` | `outro` (CHECK)
- `data_custo` date NOT NULL DEFAULT CURRENT_DATE
- `recorrente` boolean NOT NULL DEFAULT false — se true, soma todo mês a partir da data
- `observacao` text NULL
- `created_at`, `updated_at`, `created_by` uuid

**View unificada `vw_custos_operacionais`** consolida 4 origens em colunas padrão (`origem`, `origem_id`, `descricao`, `categoria`, `valor`, `data_custo`, `mes_ref` `YYYY-MM`):

1. **Assinaturas** → cada registro de `assinaturas_operacionais` vira 1 linha por mês entre `data_inicio` e `data_fim` com valor mensal (`valor / nº meses`).
2. **Recargas de chip** → cada `chip_recargas.valor` por `data_recarga`.
3. **Custo de chip** → `chip_celulares.custo_chip` na `data_compra` (uma vez).
4. **Manuais** → `custos_operacionais_manuais`. Se `recorrente=true`, expande mês a mês desde `data_custo` até o mês corrente.

**RLS** (`custos_operacionais_manuais`): admin total via `has_role(auth.uid(), 'admin')`.

### 2. Página `src/pages/admin/AdminCustosOperacionais.tsx`

**Filtros (topo)**:
- Seletor de mês (default = mês atual) — `<input type="month">`
- Filtro por origem: Todas | Assinaturas | Recargas | Chips | Manuais
- Filtro por categoria (manuais)
- Botão **"+ Novo lançamento"** (abre modal)

**5 cards de resumo** (do mês filtrado):
- Total geral
- Total Assinaturas
- Total Chips (recargas + aquisição)
- Total Manuais
- Comparativo mês anterior (% +/-)

**Tabela** (colunas):
| Data | Origem (badge colorido) | Descrição | Categoria | Valor | Ações |

- Ações: editar/excluir só aparecem em linhas de **origem = manual**
- Demais origens têm um link discreto "Ver na origem" (abre `/admin/assinaturas-operacionais` ou `/admin/chip-celulares`)

### 3. Modal "Novo / Editar lançamento manual"
Campos: descrição, valor, categoria (Select), data, toggle "Recorrente mensal", observação.

### 4. Sidebar (`AdminSidebar.tsx`)
Adicionar item após "Chip Celulares" em `mainItems`:
```ts
{ title: "Custos Operacionais", url: "/admin/custos-operacionais", icon: Receipt }
```
Ícone `Receipt` (lucide-react).

### 5. Rota (`App.tsx`)
```tsx
<Route path="/admin/custos-operacionais" element={<AdminRoute><AdminCustosOperacionais /></AdminRoute>} />
```

### Resultado esperado
- Visão única e mensal de **tudo que sai de caixa** na operação
- Assinaturas e chips alimentam a tabela automaticamente (sem duplicação)
- Lançamentos manuais (ex: domínio anual, ferramenta avulsa) entram com 1 clique
- Toggle "recorrente" replica o lançamento mês a mês sem precisar relançar
- Filtro por mês permite comparar gastos rapidamente

### Fora de escopo
- Sem gráficos de evolução (KPIs em cards bastam por enquanto)
- Sem categorias customizáveis pelo admin (lista fixa nesta versão)
- Sem export CSV (pode virar feature futura)
- Sem rateio por loteria/produto

