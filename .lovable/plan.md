

# Adicionar 3ª métrica em "Saldo do Período" — Compras vs Premiações

## Objetivo
Separar o que hoje aparece como uma única "Entradas" em duas categorias distintas no header da página `/perfil/transacoes`, deixando 3 informações lado a lado:

1. **Entrada (Compra)** — saídas para compra de cotas
2. **Saída** — outras saídas/débitos
3. **Premiação** — prêmios recebidos

E ajustar o **Saldo disponível** com a composição: "X disponível · Y comprado · Z em prêmios".

---

## Como o usuário vai ver

```text
┌──────────────────────────────────────────────┐
│ 💼 Saldo disponível                          │
│ R$ 127,50                                    │
│ R$ 72,50 comprado · R$ 200,00 em prêmios     │
│                                              │
│ ┌──────────┬──────────┬──────────┐           │
│ │ 🛒       │ ↓        │ 🏆       │           │
│ │ COMPRA   │ SAÍDA    │ PRÊMIO   │           │
│ │ R$ 72,50 │ R$ 0,00  │ R$ 200   │           │
│ └──────────┴──────────┴──────────┘           │
└──────────────────────────────────────────────┘
```

3 cards compactos lado a lado (grid 3 colunas), com ícones coloridos:
- **Compra** — ícone `ShoppingCart`, fundo azul (`bg-blue-500/10 text-blue-600`)
- **Saída** — ícone `ArrowDownRight`, fundo vermelho (`bg-destructive/10 text-destructive`)
- **Premiação** — ícone `Trophy`, fundo âmbar (`bg-amber-500/10 text-amber-600`)

---

## Mudanças concretas

### Arquivo: `src/components/perfil/TransacoesTab.tsx`

**1. Lógica de classificação (substituir o `useMemo` atual de `totalIn/totalOut/saldo`)**

Hoje o cálculo agrupa tudo em "in" ou "out" baseado em `tipo`. Vamos refinar para 3 buckets + 1 saldo:

```tsx
const { totalCompra, totalSaida, totalPremio, saldo } = useMemo(() => {
  let compra = 0;
  let saida = 0;
  let premio = 0;
  
  movFiltradas.forEach((m: any) => {
    const v = Number(m.valor) || 0;
    const tipo = String(m.tipo || "").toLowerCase();
    
    // Premiações (entrada de prêmio)
    if (tipo === "premio" || tipo === "entrada_premio" || tipo === "bonus") {
      premio += v;
    }
    // Compras (saída identificada como compra de cota)
    else if (tipo === "compra" || tipo === "saida_compra" || tipo === "compra_cota") {
      compra += v;
    }
    // Saídas genéricas
    else if (tipo === "saida" || tipo === "debito" || tipo === "estorno_debito") {
      saida += v;
    }
    // Entradas genéricas (depósito, ajuste positivo) caem em "premio bucket" não — vamos somar como crédito disponível
    else if (tipo === "entrada" || tipo === "credito" || tipo === "deposito") {
      premio += v; // ou criar 4º bucket; manter 3 por simplicidade do pedido
    }
  });
  
  // Saldo disponível = total recebido (prêmios + créditos) - total gasto (compras + saídas)
  const saldo = premio - compra - saida;
  
  return { totalCompra: compra, totalSaida: saida, totalPremio: premio, saldo };
}, [movFiltradas]);
```

> Observação: hoje o banco só tem o tipo `entrada_premio`. A lógica acima já está preparada para os tipos futuros (`compra`, `saida`, etc.) sem quebrar. Vou checar o `useWallet`/edge functions de compra para alinhar os tipos exatos antes de implementar (sem mudar schema agora).

**2. Substituir o bloco JSX do header de saldo**

Trocar a linha atual `Saldo do período` + 2 colunas (Entradas/Saídas) por:

```tsx
{/* Saldo header */}
<div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-4">
  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
    <Wallet className="h-3.5 w-3.5" />
    Saldo disponível
  </div>
  <p className={cn(
    "text-3xl font-bold tracking-tight",
    saldo < 0 ? "text-destructive" : "text-foreground"
  )}>
    {formatBRL(saldo)}
  </p>
  <p className="text-[11px] text-muted-foreground mt-1">
    {formatBRL(totalCompra)} comprado · {formatBRL(totalPremio)} em prêmios
  </p>

  {/* 3 métricas lado a lado */}
  <div className="grid grid-cols-3 gap-2 mt-4">
    <MetricCell 
      icon={ShoppingCart}
      label="Compra"
      value={totalCompra}
      tone="blue"
    />
    <MetricCell 
      icon={ArrowDownRight}
      label="Saída"
      value={totalSaida}
      tone="red"
    />
    <MetricCell 
      icon={Trophy}
      label="Prêmio"
      value={totalPremio}
      tone="amber"
    />
  </div>
</div>
```

**3. Componente interno `MetricCell`**

Pequeno helper dentro do mesmo arquivo (não vira componente externo — escopo local):

```tsx
function MetricCell({ icon: Icon, label, value, tone }: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: "blue" | "red" | "amber";
}) {
  const tones = {
    blue: "bg-blue-500/10 text-blue-600",
    red: "bg-destructive/10 text-destructive",
    amber: "bg-amber-500/10 text-amber-600",
  };
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-background/60">
      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center", tones[tone])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className="text-xs font-bold text-foreground">
        {formatBRL(value)}
      </p>
    </div>
  );
}
```

**4. Imports adicionais**
```tsx
import { ShoppingCart, type LucideIcon } from "lucide-react";
```

**5. Propagar lógica nas linhas do Log (consistência de cores/ícones)**

Atualizar o ícone/cor da row de cada movimentação para refletir os 3 buckets:
- `compra` / `saida_compra` → `ShoppingCart` azul
- `saida` / `debito` → `ArrowDownRight` vermelho
- `premio` / `entrada_premio` / `bonus` → `Trophy` âmbar

(o atual `entrada` genérica continua verde como fallback)

---

## Detalhes técnicos sensíveis

- **Sem migration**: nenhum campo novo no banco. Apenas reclassificação no client.
- **Compatibilidade**: o tipo atual `entrada_premio` (único existente) cai corretamente em "Prêmio". Tipos futuros (`compra`, `saida`) já estão mapeados.
- **Saldo disponível**: representa o "líquido do período filtrado" — não o saldo absoluto da carteira (que pode existir noutra fonte). Mantém coerência com o que o filtro de período exibe.
- **Responsividade**: grid de 3 colunas funciona bem em 390px (cada cell ~110px). Texto reduzido para text-[9px]/text-xs evita quebra.

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/perfil/TransacoesTab.tsx` | **Editar** — refazer cálculo (3 buckets + saldo), trocar header com grid de 3 métricas, adicionar `MetricCell` interno e import `ShoppingCart` |

## Fora de escopo
- Criar novos tipos de movimentação no banco
- Mexer em `bolao_cotas` ou `bolao_resgates` (continuam exibidos nas tabs Cotas/Prêmios como hoje)
- Mudar o filtro de período ou as tabs

## Resultado esperado
Header de saldo com 3 informações claras lado a lado (Compra · Saída · Prêmio), e linha de composição "X comprado · Y em prêmios" abaixo do saldo grande, dando visão financeira completa em um único bloco compacto.

