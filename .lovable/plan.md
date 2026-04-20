

## Refatorar nomenclatura e filtros de Usuários no Admin

### Estado atual

Hoje na `/admin/usuarios` temos 5 filtros: **Todos, Pagos, Trial, Free, Bloqueados** — sem distinção por tipo de plano pago, sem filtro por verificação de email, sem filtro por trial usado.

### Nova estrutura de filtros

**Linha 1 — Status do cadastro/pagamento (filtros principais):**

| Filtro | Significado | Lógica |
|---|---|---|
| **Todos** | Todos os cadastros | sem filtro |
| **Pagos** | Quem comprou | tem plano pago ativo (mensal/anual/anualvip/semestral/grupo) |
| **Trial** | Quem está no teste agora | `plan.slug = teste-gratis-3-dias` E `status_assinatura = ativa` |

**Linha 2 — Filtros secundários (subgrupo, combináveis):**

| Filtro | Significado | Lógica |
|---|---|---|
| **Não Verificados** | Não confirmou email (independe de pago/free) | `email_verificado = false` |
| **Verificados** | Confirmou email | `email_verificado = true` |
| **Trial OK** | Já usou o trial (não importa se ainda está ativo) | `trial_used = true` |
| **Pago Mensal** | Plano mensal ativo | `plan.slug = mensal` |
| **Pago Anual** | Plano anual ativo | `plan.slug = anual` |
| **Pago Anual VIP** | Plano anual VIP ativo | `plan.slug = plano-anual-vip` |
| **Bloqueados** | Bloqueados | `is_blocked = true` |

### Mudanças

#### 1. `src/pages/admin/AdminUsuarios.tsx`

**Tipos:**
```ts
type FilterPrincipal = "todos" | "pagos" | "trial";
type FilterSecundario = 
  | "nao_verificados" 
  | "verificados" 
  | "trial_ok" 
  | "pago_mensal" 
  | "pago_anual" 
  | "pago_anualvip"
  | "bloqueados"
  | null;
```

State separado: `activeFilter` (principal, sempre 1 ativo) + `activeSubFilter` (secundário, 0 ou 1 ativo, toggleável).

**Stats recomputados:**
```ts
const stats = {
  total, pagos, trial,
  nao_verificados: users.filter(u => !u.email_verificado).length,
  verificados: users.filter(u => u.email_verificado).length,
  trial_ok: users.filter(u => u.trial_used).length,
  pago_mensal: users.filter(u => u.plan?.slug === 'mensal' && u.status_assinatura === 'ativa').length,
  pago_anual: users.filter(u => u.plan?.slug === 'anual' && u.status_assinatura === 'ativa').length,
  pago_anualvip: users.filter(u => u.plan?.slug === 'plano-anual-vip' && u.status_assinatura === 'ativa').length,
  bloqueados: users.filter(u => u.is_blocked).length,
};
```

**Filtragem em pipeline:** primeiro aplica filtro principal, depois aplica subfiltro (se houver), depois tags + busca.

**UI:**
- Mobile: linha de 3 chips grandes (Todos/Pagos/Trial) + linha rolável horizontal com pills dos secundários
- Desktop: 2 linhas de pills no toolbar — principais em destaque (bg-primary quando ativo), secundários menores (estilo outline)
- Subfiltro ativo mostra X pra remover

#### 2. Remover filtros antigos

Tirar `Free` e `Bloqueados` da linha principal — `Bloqueados` vira subfiltro, `Free` deixa de existir como categoria primária (quem não é Pago nem Trial é Free implicitamente em "Todos"). Quem quer ver só free pode combinar `Todos` + filtro de tag `gratis`.

#### 3. Verificar `email_verificado` no campo certo

Os perfis já têm `email_verificado: boolean`. Confirmado pelo schema.

#### 4. Sincronia com `UserDetailSheet.tsx` header

Os badges no topo do sheet (Free/Mensal/etc + status) continuam iguais — só mudam os filtros da listagem.

### Fora de escopo

- Não mexo em `AdminMetricas` (tem nomenclatura própria já consolidada)
- Não mexo em `AdminEventos` (filtros são de event_type)
- Não renomeio planos no banco (slugs `mensal`, `anual`, `plano-anual-vip` continuam)
- Não mexo em tags (continuam como CRM auxiliar)
- Não mexo em `useTrialOffer` nem `PermissionContext`

### Resultado esperado

| Cenário | Antes | Depois |
|---|---|---|
| Ver só pagantes mensais | impossível direto | `Pagos` + subfiltro `Pago Mensal` |
| Ver quem nunca verificou email | impossível | subfiltro `Não Verificados` (combinável com Todos/Pagos/Trial) |
| Ver quem já usou trial e virou free | impossível | `Todos` + `Trial OK` (e excluir tag `ativo`) |
| Ver bloqueados | filtro principal | subfiltro `Bloqueados` |

### Arquivos editados

| Arquivo | Mudança |
|---|---|
| `src/pages/admin/AdminUsuarios.tsx` | Reestrutura filtros (principal + secundário), nova UI de 2 linhas, novos stats, lógica de filtragem em pipeline |

