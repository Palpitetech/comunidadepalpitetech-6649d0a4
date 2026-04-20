

## Plano: Tabela "Chip Celulares" (gestão de chips com recargas)

### 1. Banco de dados (migração SQL)

**Tabela `chip_celulares`** (cadastro do chip):
- `id` uuid PK (`gen_random_uuid()`)
- `numero_id` integer — sequência única, gera ID `#0001`, `#0002`... (default via sequence)
- `numero` text NOT NULL — telefone com DDD
- `operadora` text NOT NULL — `tim` | `claro` | `vivo` (CHECK)
- `plano_tipo` text NOT NULL — `pre` | `pos` | `controle` (CHECK)
- `valor_plano` numeric NOT NULL DEFAULT 0 — mensal fixo
- `custo_chip` numeric NOT NULL DEFAULT 0 — custo de aquisição (editável)
- `data_compra` date NOT NULL DEFAULT CURRENT_DATE
- `ultima_recarga_at` timestamptz NULL — preenchido por trigger ao inserir recarga
- `ultima_recarga_valor` numeric NULL — idem
- `ativo` boolean NOT NULL DEFAULT true
- `observacao` text NULL
- `created_at`, `updated_at`

Sequência + trigger para gerar `numero_id` automaticamente (ordem `#0001`, `#0002`…).

**Tabela `chip_recargas`** (histórico):
- `id` uuid PK
- `chip_id` uuid NOT NULL → FK `chip_celulares(id)` ON DELETE CASCADE
- `valor` numeric NOT NULL
- `data_recarga` date NOT NULL DEFAULT CURRENT_DATE
- `metodo` text NULL (Pix, cartão…)
- `observacao` text NULL
- `created_at`, `created_by` uuid

**Trigger** `update_chip_ultima_recarga` em INSERT/DELETE de `chip_recargas` → atualiza `ultima_recarga_at`, `ultima_recarga_valor` em `chip_celulares` (último registro pela maior `data_recarga`).

**RLS** (mesmo padrão de `assinaturas_operacionais`):
- "Admins têm acesso total a chip_celulares" → `has_role(auth.uid(), 'admin')`
- "Admins têm acesso total a chip_recargas" → `has_role(auth.uid(), 'admin')`

**Índices**: `chip_id` em `chip_recargas`; `numero_id` único em `chip_celulares`.

### 2. Página principal `src/pages/admin/AdminChipCelulares.tsx`

Layout copiando o padrão de `AdminAssinaturasOperacionais`:

**Cards de resumo (5)**:
- Total de chips
- Chips ativos
- Custo total dos chips (soma de `custo_chip` de ativos)
- Custo mensal de planos (soma de `valor_plano` de ativos)
- Total recarregado no mês (soma de `chip_recargas.valor` do mês corrente)

**Tabela** (colunas):
| ID | Número | Operadora | Plano | Valor/mês | Última recarga | Custo chip | Status | Ações |

- ID exibido como `#0001` (formatado: `#${String(numero_id).padStart(4, '0')}`)
- Operadora com badge colorido (TIM amarelo, Claro vermelho, Vivo verde)
- Plano com badge (Pré/Pós/Controle)
- Última recarga: data + valor; "—" se nunca
- Ações: **Recarga** (ícone Zap verde), **Histórico** (ícone Clock azul), **Editar** (lápis), **Excluir** (lixeira)

### 3. Modais

**Modal "Novo Chip / Editar Chip"**:
- Campos: número, operadora (Select), plano (Select), valor do plano, custo do chip (default sugerido pelo último chip cadastrado, mas editável), data de compra, observação
- ID `#0001` é gerado automaticamente — exibido como readonly após criação

**Modal "Registrar Recarga"** (botão Zap verde):
- Valor (default = `valor_plano` do chip), data (default hoje), método (texto livre opcional), observação opcional
- Salva em `chip_recargas` e o trigger atualiza o pai

**Modal "Histórico de Recargas"** (botão Clock azul):
- Cabeçalho: chip `#0001` — número — operadora
- Tabela: Data | Valor | Método | Observação | Ações (excluir)
- Resumo: total recarregado, média mensal, última recarga

### 4. Sidebar (`src/components/layout/AdminSidebar.tsx`)

Adicionar item após "Assinaturas Op." em `mainItems`:
```ts
{ title: "Chip Celulares", url: "/admin/chip-celulares", icon: Smartphone }
```
(Ícone `Smartphone` do lucide-react)

### 5. Rota (`src/App.tsx`)

Após a rota de `/admin/assinaturas-operacionais`:
```tsx
<Route path="/admin/chip-celulares" element={<AdminRoute><AdminChipCelulares /></AdminRoute>} />
```
Import: `import AdminChipCelulares from "./pages/admin/AdminChipCelulares";`

### Resultado esperado

- Nova URL `/admin/chip-celulares` no menu lateral
- Cadastro de chips com ID sequencial fixo (`#0001`, `#0002`…)
- Visualização de operadora, plano, valor mensal e última recarga em uma única tabela
- Botão de recarga rápida com modal completo (valor, data, observação, método)
- Histórico de recargas em modal separado por chip
- Custo de aquisição (`custo_chip`) editável por registro, somado nos KPIs

### Fora de escopo

- Sem integração com APIs de operadoras (recarga é manual)
- Sem alertas automáticos de saldo baixo (pode virar feature futura)
- Sem notificação WhatsApp ao registrar recarga

