

## Plano: Criar tabela `investimentos` no banco — Etapa 1

Esta é a **primeira etapa**: apenas criar a estrutura no banco. Próximas etapas (UI admin, listagem, formulário, sidebar) virão depois.

### Estrutura da tabela `investimentos`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `identificacao` | `text` | NOT NULL — nome/descrição do investimento |
| `valor` | `numeric(12,2)` | NOT NULL, default `0` |
| `provedor` | `text` | NOT NULL — quem é o fornecedor (ex: Lovable, Supabase, OpenAI…) |
| `periodo_validade` | `text` (enum-like via CHECK) | NOT NULL — valores aceitos: `1_mes`, `3_meses`, `6_meses`, `12_meses`, `nd`, `personalizado` |
| `periodo_dias_custom` | `integer` | Nullable — preenchido apenas quando `periodo_validade = 'personalizado'` |
| `data_inicio` | `date` | NOT NULL, default `CURRENT_DATE` |
| `data_fim` | `date` | Nullable — calculada automaticamente via trigger a partir de `data_inicio` + `periodo_validade` (NULL para `nd`) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

### Regras de validação (validation triggers, não CHECK)

- **`validate_investimento`** (BEFORE INSERT/UPDATE):
  - Se `periodo_validade = 'personalizado'` → exige `periodo_dias_custom > 0`.
  - Se `periodo_validade != 'personalizado'` → força `periodo_dias_custom = NULL`.
  - Calcula `data_fim` automaticamente:
    - `1_mes` → `data_inicio + 1 mês`
    - `3_meses` → `data_inicio + 3 meses`
    - `6_meses` → `data_inicio + 6 meses`
    - `12_meses` → `data_inicio + 12 meses`
    - `personalizado` → `data_inicio + periodo_dias_custom dias`
    - `nd` → `NULL`
  - Garante `valor >= 0`.
- **`update_updated_at_column`** (BEFORE UPDATE) — reaproveita função existente.

### Segurança (RLS)

- `ALTER TABLE public.investimentos ENABLE ROW LEVEL SECURITY;`
- Política única: **Admins acesso total** (`ALL` para `authenticated` usando `has_role(auth.uid(), 'admin'::app_role)`).
- Sem acesso para usuários comuns nem `service_role` (somente admins via painel).

### Índices

- `idx_investimentos_data_inicio` em `data_inicio DESC` (listagem cronológica).
- `idx_investimentos_provedor` em `provedor` (filtros futuros).

### Detalhes técnicos

- Migração SQL única criando: tabela + função de validação + 2 triggers + RLS + 1 política + 2 índices.
- `periodo_validade` usa `CHECK IN (...)` simples (valores fixos, imutável → seguro como CHECK).
- Tipos TypeScript em `src/integrations/supabase/types.ts` serão regenerados automaticamente.

### Fora de escopo (próximas etapas)

- Página `/admin/investimentos` (listagem + form).
- Item no `AdminSidebar`.
- Rota em `App.tsx`.
- Cálculos de ROI / dashboard.

### Resultado esperado

Tabela `investimentos` criada e protegida, pronta para receber o CRUD na próxima etapa.

