import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, ShoppingCart, DollarSign, TrendingUp, Clock, Receipt, Target } from "lucide-react";
import { AttributionMetrics, fmtBRL, fmtNum, fmtPct, fmtDays } from "@/hooks/admin/useAttributionMetrics";

interface Props {
  data: AttributionMetrics;
  headerExtra?: ReactNode;
}

const KPI = ({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "info" | "warning";
}) => {
  const toneCls =
    tone === "success"
      ? "text-emerald-500"
      : tone === "info"
      ? "text-sky-500"
      : tone === "warning"
      ? "text-amber-500"
      : "text-primary";
  return (
    <Card>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center justify-between mb-1.5">
          <Icon className={`h-4 w-4 ${toneCls}`} />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <p className="text-xl md:text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
};

export function MetricsKPIs({ data, headerExtra }: Props) {
  return (
    <div className="space-y-2">
      {headerExtra && (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Indicadores
          </h3>
          {headerExtra}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <KPI icon={Users} label="Leads" value={fmtNum(data.totalLeads)} tone="info" />
      <KPI icon={UserPlus} label="Cadastros" value={fmtNum(data.totalCadastros)} />
      <KPI icon={ShoppingCart} label="Compradores" value={fmtNum(data.totalCompradores)} tone="success" />
      <KPI
        icon={DollarSign}
        label="Receita"
        value={fmtBRL(data.receitaTotal)}
        sub={`${fmtNum(data.totalVendas)} vendas`}
        tone="success"
      />
      <KPI
        icon={TrendingUp}
        label="Conv. L→C"
        value={fmtPct(data.convLeadCadastro)}
        sub="Lead → Cadastro"
        tone="info"
      />
      <KPI
        icon={Target}
        label="Conv. C→P"
        value={fmtPct(data.convCadCompra)}
        sub="Cadastro → Compra"
        tone="warning"
      />
      <KPI icon={Receipt} label="Ticket Médio" value={fmtBRL(data.ticketMedio)} />
      <KPI
        icon={Clock}
        label="LTV (dias)"
        value={fmtDays(data.ltvMedioDias || null)}
        sub="Tempo até 1ª compra"
        tone="info"
      />
      </div>
    </div>
  );
}
