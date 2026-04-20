

## Adicionar 5 novos subfiltros em `/admin/usuarios`

### Novos subfiltros (linha secundária)

| Filtro | Lógica |
|---|---|
| **Plano vencido** | `validade_assinatura < hoje` E `status_assinatura != 'cancelada'` (passou da data mas não foi cancelado formalmente) |
| **Plano cancelado inativo** | `status_assinatura = 'cancelada'` E (`validade_assinatura < hoje` OU `validade_assinatura IS NULL`) |
| **Plano cancelado mas ativo** | `status_assinatura = 'cancelada'` E `validade_assinatura >= hoje` (cancelou mas ainda tem dias restantes) |
| **Trial ativo** | `plan.slug = 'teste-gratis-3-dias'` E `status_assinatura = 'ativa'` E `validade_assinatura >= hoje` |
| **Celular OK** | `celular` preenchido E começa com `55` E tem 12-13 dígitos (formato normalizado válido do `validateCelularBR`) |

### Mudanças

**1. `src/pages/admin/AdminUsuarios.tsx`**

Adicionar à união `FilterSecundario`:
```ts
type FilterSecundario =
  | "nao_verificados" | "verificados" | "trial_ok"
  | "pago_mensal" | "pago_anual" | "pago_anualvip" | "bloqueados"
  | "plano_vencido"           // novo
  | "plano_cancelado_inativo" // novo
  | "plano_cancelado_ativo"   // novo
  | "trial_ativo"             // novo
  | "celular_ok"              // novo
  | null;
```

Adicionar helpers:
```ts
const hoje = new Date().toISOString().split('T')[0];

const isPlanoVencido = (u) => 
  u.validade_assinatura && u.validade_assinatura < hoje && u.status_assinatura !== 'cancelada';

const isCanceladoInativo = (u) =>
  u.status_assinatura === 'cancelada' && 
  (!u.validade_assinatura || u.validade_assinatura < hoje);

const isCanceladoAtivo = (u) =>
  u.status_assinatura === 'cancelada' && 
  u.validade_assinatura && u.validade_assinatura >= hoje;

const isTrialAtivo = (u) =>
  u.plan?.slug === 'teste-gratis-3-dias' && 
  u.status_assinatura === 'ativa' &&
  u.validade_assinatura && u.validade_assinatura >= hoje;

const isCelularOk = (u) => {
  const digits = (u.celular || '').replace(/\D/g, '');
  return digits.startsWith('55') && (digits.length === 12 || digits.length === 13);
};
```

Adicionar contagens em `stats` (useMemo) e cases no pipeline de filtragem.

**2. UI — linha de subfiltros**

Agrupar visualmente os pills da linha 2 em 3 grupos com separador sutil:
- **Verificação:** Verificados / Não Verificados / Celular OK
- **Plano:** Pago Mensal / Pago Anual / Pago Anual VIP / Trial Ativo / Trial OK
- **Status crítico:** Plano Vencido / Cancelado Ativo / Cancelado Inativo / Bloqueados

Cada subfiltro mostra o `count` ao lado do label (ex: `Plano Vencido (12)`).

### Fora de escopo

- Sem mudanças no banco
- Sem mudanças em `UserDetailSheet`, `UserPlanTab`, `AdminMetricas`
- Filtros continuam mutuamente exclusivos (1 subfiltro por vez)
- Não toco em planos pagos cancelados que ainda têm tempo — aparecem em "Cancelado Ativo" e também em "Pagos" (intencional: ainda usam o sistema)

### Arquivo editado

| Arquivo | Mudança |
|---|---|
| `src/pages/admin/AdminUsuarios.tsx` | +5 subfiltros, helpers de data, agrupamento visual da linha 2 |

