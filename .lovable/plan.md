

## Plano: Renomear "Investimentos" → "Assinatura Operacional"

Mudança cosmética + estrutural. Mantém toda a lógica, dados e cálculos atuais (incluindo "Custo Mensal").

### 1. Banco de dados (migração SQL)

Renomear a tabela e seus objetos relacionados:

- `ALTER TABLE public.investimentos RENAME TO assinaturas_operacionais;`
- Renomear índices:
  - `idx_investimentos_data_inicio` → `idx_assinaturas_operacionais_data_inicio`
  - `idx_investimentos_provedor` → `idx_assinaturas_operacionais_provedor`
- Renomear triggers:
  - `trg_validate_investimento` → `trg_validate_assinatura_operacional`
  - `trg_update_investimentos_updated_at` → `trg_update_assinaturas_operacionais_updated_at`
- Renomear função: `public.validate_investimento()` → `public.validate_assinatura_operacional()` (recriar com `CREATE OR REPLACE` e dar `DROP` na antiga)
- Recriar trigger apontando para a nova função
- Atualizar política RLS (manter regra `has_role admin`, apenas renomear referência se necessário)

Os tipos TypeScript em `src/integrations/supabase/types.ts` serão regenerados automaticamente.

### 2. Sidebar (`src/components/layout/AdminSidebar.tsx`)

No array `mainItems`, alterar o item "Investimentos":

```ts
{ title: "Assinaturas Op.", url: "/admin/assinaturas-operacionais", icon: PiggyBank }
```

(Título abreviado para caber no sidebar; ícone `PiggyBank` mantido)

### 3. Rota (`src/App.tsx`)

- Renomear rota: `/admin/investimentos` → `/admin/assinaturas-operacionais`
- Atualizar import: `AdminInvestimentos` → `AdminAssinaturasOperacionais`

### 4. Página (renomear arquivo + conteúdo)

- Renomear `src/pages/admin/AdminInvestimentos.tsx` → `src/pages/admin/AdminAssinaturasOperacionais.tsx`
- Atualizar dentro do arquivo:
  - Componente: `export default function AdminAssinaturasOperacionais()`
  - Query key: `["admin-investimentos"]` → `["admin-assinaturas-operacionais"]`
  - Tabela Supabase: `.from("investimentos")` → `.from("assinaturas_operacionais")`
  - Tipo: `Investimento` → `AssinaturaOperacional`
  - Função: `calcularMensal(inv)` → `calcularMensal(assinatura)` (parâmetro renomeado)
  - Textos visíveis:
    - Título: "Investimentos" → "Assinaturas Operacionais"
    - Subtítulo / breadcrumbs / botões: "Novo Investimento" → "Nova Assinatura"
    - Mensagens toast e diálogos: "investimento" → "assinatura"
    - Estado vazio: "Nenhum investimento cadastrado" → "Nenhuma assinatura cadastrada"

### 5. Outras referências

Buscar e atualizar qualquer link/menção a `/admin/investimentos` no resto do código (ex: cards de atalho em `AdminIndex.tsx` se houver).

### Fora de escopo

- Lógica de cálculo (mensal, status, validade) permanece idêntica
- Estrutura das colunas do banco permanece idêntica (apenas o nome da tabela muda)
- Dados existentes são preservados (RENAME não apaga registros)

### Resultado esperado

- Nova URL: `/admin/assinaturas-operacionais`
- Sidebar exibe "Assinaturas Op."
- Tabela do banco: `assinaturas_operacionais`
- Todos os cálculos, filtros e CRUD funcionam exatamente como antes

