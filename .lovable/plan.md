

## Adicionar coluna "Próximo vencimento" na listagem de usuários

### O que adiciona

Nova coluna na tabela desktop e info no card mobile mostrando a data de validade da assinatura (`validade_assinatura`) com indicador visual de proximidade do vencimento.

### Lógica de exibição

| Situação | Exibição |
|---|---|
| Sem `validade_assinatura` | `—` cinza |
| Vence em > 7 dias | Data + dias restantes (cinza neutro) |
| Vence em 1-7 dias | Data + "Em X dias" (âmbar — atenção) |
| Vence hoje | "Hoje" (âmbar) |
| Vencido | "Há X dias" (vermelho) |

Formato data: `dd/MM/yyyy` (date-fns ptBR, já importado no projeto).

### Mudanças

**`src/pages/admin/AdminUsuarios.tsx`**

#### Desktop — tabela
Adicionar coluna entre "Ativo" e "Origem":

```
| Usuário | Plano | Verificado | Ativo | Próximo vencimento | Origem | Cadastro |
```

Cada célula renderiza:
- Linha 1: data formatada (`dd/MM/yyyy`)
- Linha 2: badge pequeno com dias restantes/status, com cor conforme regra acima

Atualizar `colSpan` da row de "nenhum usuário" de 10 → 11.

#### Mobile — cards
Adicionar linha extra no card (abaixo do plano) só quando `validade_assinatura` existir:
- `📅 Vence 25/04/2026 · Em 5 dias` (cor conforme regra)

Se não tem validade, não exibe nada (não polui).

#### Helper function
```ts
const getValidadeInfo = (validade: string | null) => {
  if (!validade) return null;
  const dias = differenceInDays(new Date(validade), new Date());
  const dataFormatada = format(new Date(validade), "dd/MM/yyyy", { locale: ptBR });
  
  let label: string;
  let tone: "neutral" | "warning" | "danger";
  
  if (dias < 0) { label = `Há ${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? 's' : ''}`; tone = "danger"; }
  else if (dias === 0) { label = "Hoje"; tone = "warning"; }
  else if (dias <= 7) { label = `Em ${dias} dia${dias !== 1 ? 's' : ''}`; tone = "warning"; }
  else { label = `Em ${dias} dias`; tone = "neutral"; }
  
  return { dataFormatada, label, tone };
};
```

### Fora de escopo

- Sem mudanças no banco
- Sem mudanças em `UserDetailSheet` / `UserPlanTab` (já mostram validade)
- Sem novo subfiltro (subfiltro `Plano vencido` já existe)
- Imports `differenceInDays`, `format`, `ptBR` já estão disponíveis no padrão do projeto

### Arquivo editado

| Arquivo | Mudança |
|---|---|
| `src/pages/admin/AdminUsuarios.tsx` | +1 coluna desktop, +1 linha condicional no card mobile, +1 helper de formatação |

### Resultado esperado

Admin consegue, sem abrir o detalhe do usuário, identificar de relance:
- Quem vai vencer nos próximos dias (âmbar)
- Quem já venceu (vermelho)
- Quem tem assinatura longa (cinza neutro)

