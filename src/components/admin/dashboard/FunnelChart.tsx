import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DailyPoint } from "@/hooks/admin/useDashboardMetrics";
import { PeriodFilter } from "./PeriodFilter";
import { CustomRange, PeriodKey } from "@/hooks/useDashboardPeriod";

// Recebe "YYYY-MM-DD" do bucketing em SP e cria a Date sem aplicar fuso,
// para que o eixo X mostre exatamente o dia agrupado.
function parseBucketDate(v: string): Date {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

interface FunnelChartProps {
  data: DailyPoint[];
  loading?: boolean;
  totalCadastros: number;
  totalPagos: number;
  totalLeads: number;
  totalVerificados: number;
  showLocalFilter?: boolean;
  localPeriodKey?: PeriodKey;
  onLocalPeriodChange?: (key: PeriodKey) => void;
  localCustomRange?: CustomRange;
  onLocalCustomRangeChange?: (r: CustomRange) => void;
}

export function FunnelChart({
  data,
  loading,
  totalCadastros,
  totalPagos,
  totalLeads,
  totalVerificados,
  showLocalFilter,
  localPeriodKey,
  onLocalPeriodChange,
  localCustomRange,
  onLocalCustomRangeChange,
}: FunnelChartProps) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Funil de Aquisição
            </h3>
            <p className="text-xs text-muted-foreground">
              Cadastros = Pagos + Leads (sem duplicar) — verificados é subset
            </p>
          </div>
          {showLocalFilter && localPeriodKey && onLocalPeriodChange && (
            <PeriodFilter
              compact
              value={localPeriodKey}
              onChange={onLocalPeriodChange}
              customRange={localCustomRange || {}}
              onCustomRangeChange={onLocalCustomRangeChange || (() => {})}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Cadastros: {totalCadastros}
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
            Pagos: {totalPagos}
          </Badge>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30">
            Leads: {totalLeads}
          </Badge>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/30">
            Verificados: {totalVerificados}
          </Badge>
        </div>

        <div className="h-[260px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(new Date(v), "dd/MM", { locale: ptBR })}
                  fontSize={10}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => format(new Date(v), "dd 'de' MMM", { locale: ptBR })}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="cadastros"
                  name="Cadastros"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="verificados"
                  name="Verificados"
                  stroke="rgb(168 85 247)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="vendas"
                  name="Vendas"
                  stroke="rgb(34 197 94)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
