import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardPeriod } from "@/hooks/useDashboardPeriod";
import { PeriodFilter } from "@/components/admin/dashboard/PeriodFilter";
import { useBIMetrics } from "@/hooks/admin/useBIMetrics";
import { fmtBRL, fmtNum } from "@/hooks/admin/useDashboardMetrics";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Download,
  BarChart3,
  PieChart,
  ArrowRight
} from "lucide-react";
import { exportToCSV } from "@/utils/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBI() {
  const { period, periodKey, setPeriodKey, customRange, setCustomRange } = useDashboardPeriod("7d");
  const { data: metrics, isLoading } = useBIMetrics(period);

  const handleExport = () => {
    if (!metrics) return;
    const exportData = [{
      "Período": periodKey,
      "Receita": metrics.revenue,
      "Custo Marketing": metrics.marketingCost,
      "Custo Operacional": metrics.operationalCost,
      "Custo Total": metrics.totalCost,
      "Lucro Líquido": metrics.netProfit,
      "ROAS": metrics.roas.toFixed(2),
      "CPA": metrics.cpa.toFixed(2),
      "CPL": metrics.cpl.toFixed(2),
      "Leads": metrics.totalLeads,
      "Compradores": metrics.totalBuyers,
      "Vendas": metrics.totalSales,
      "Conversão (%)": metrics.conversionRate.toFixed(2),
      "Ticket Médio": metrics.averageTicket.toFixed(2),
      "LTV": metrics.ltv.toFixed(2)
    }];
    exportToCSV(exportData, `bi-metrics-${periodKey}`);
  };

  if (isLoading) {
    return (
      <AdminLayout pageTitle="BI & Performance">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="BI & Performance">
      <div className="px-4 py-3 md:container md:py-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold hidden md:block">BI & Performance</h1>
            <PeriodFilter
              value={periodKey}
              onChange={setPeriodKey}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Linha 1: Financeiro Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Receita Bruta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmtBRL(metrics?.revenue || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics?.totalSales} vendas aprovadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Lucro Líquido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", (metrics?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600")}>
                {fmtBRL(metrics?.netProfit || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Margem: {metrics?.revenue ? ((metrics.netProfit / metrics.revenue) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" /> ROAS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.roas ? `${metrics.roas.toFixed(2)}x` : "0.00x"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Investimento: {fmtBRL(metrics?.marketingCost || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> CPA Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmtBRL(metrics?.cpa || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Custo por comprador
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Linha 2: Eficiência e Funil */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Eficiência de Funil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Tráfego & Leads</span>
                    <span className="text-muted-foreground">{fmtNum(metrics?.totalLeads || 0)} leads</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-full" />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">CPL: {fmtBRL(metrics?.cpl || 0)}</span>
                    <div className="flex items-center text-xs text-blue-600 font-bold">
                      {metrics?.conversionRate.toFixed(1)}% Conv. <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Compradores (Novos)</span>
                    <span className="text-muted-foreground">{fmtNum(metrics?.totalBuyers || 0)} novos</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500" 
                      style={{ width: `${Math.min(100, (metrics?.conversionRate || 0) * 5)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">CPA: {fmtBRL(metrics?.cpa || 0)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ticket: {fmtBRL(metrics?.averageTicket || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">LTV do Período</div>
                  <div className="text-xl font-bold text-primary">{fmtBRL(metrics?.ltv || 0)}</div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Custo Op. Total</div>
                  <div className="text-xl font-bold">{fmtBRL(metrics?.totalCost || 0)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" /> Composição de Custos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                    <span className="text-sm">Marketing</span>
                  </div>
                  <span className="text-sm font-bold">{fmtBRL(metrics?.marketingCost || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-400" />
                    <span className="text-sm">Operacional</span>
                  </div>
                  <span className="text-sm font-bold">{fmtBRL(metrics?.operationalCost || 0)}</span>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground mb-4">
                    Para calcular o ROAS e CPA corretamente, certifique-se de cadastrar os custos de tráfego na aba "Marketing" em Custos Operacionais.
                  </div>
                  <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                    <a href="/admin/custos-operacionais">Gerenciar Custos →</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

// Helper local since cn was used
import { cn } from "@/lib/utils";
