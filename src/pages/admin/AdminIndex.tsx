import { AdminLayout } from "@/components/layout/AdminLayout";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Users,
  UserCheck,
  AlertTriangle,
  XCircle,
  Crown,
  Star,
  Timer,
  TimerOff,
  DollarSign,
  TrendingDown,
  Wallet,
  ShoppingBag,
  RefreshCw,
  Percent,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import {
  CustomRange,
  PeriodKey,
  resolvePeriod,
  useDashboardPeriod,
} from "@/hooks/useDashboardPeriod";
import {
  fmtBRL,
  fmtNum,
  useDashboardMetrics,
} from "@/hooks/admin/useDashboardMetrics";
import { PeriodFilter } from "@/components/admin/dashboard/PeriodFilter";
import { MetricBlock } from "@/components/admin/dashboard/MetricBlock";
import { FunnelChart } from "@/components/admin/dashboard/FunnelChart";
import { PlanBreakdownBlock } from "@/components/admin/dashboard/PlanBreakdownBlock";

// Estado local para filtro por bloco — usado quando "perBlock" está ativo
function useBlockPeriod(globalKey: PeriodKey, globalCustom: CustomRange) {
  const [key, setKey] = useState<PeriodKey>(globalKey);
  const [custom, setCustom] = useState<CustomRange>(globalCustom);
  return {
    key,
    setKey,
    custom,
    setCustom,
    period: resolvePeriod(key, custom),
  };
}

export default function AdminIndex() {
  const { period, periodKey, setPeriodKey, customRange, setCustomRange } =
    useDashboardPeriod("7d");
  const [perBlock, setPerBlock] = useState(false);

  // Períodos locais por bloco (só ativam quando perBlock=true)
  const vendasBlock = useBlockPeriod(periodKey, customRange);
  const cadastrosBlock = useBlockPeriod(periodKey, customRange);
  const verificadosBlock = useBlockPeriod(periodKey, customRange);
  const canceladasBlock = useBlockPeriod(periodKey, customRange);
  const renovacoesBlock = useBlockPeriod(periodKey, customRange);
  const carrinhoBlock = useBlockPeriod(periodKey, customRange);
  const oportBlock = useBlockPeriod(periodKey, customRange);
  const totalRSBlock = useBlockPeriod(periodKey, customRange);
  const ticketBlock = useBlockPeriod(periodKey, customRange);
  const conversaoBlock = useBlockPeriod(periodKey, customRange);
  const planosBlock = useBlockPeriod(periodKey, customRange);
  const funnelBlock = useBlockPeriod(periodKey, customRange);

  // Resolve período efetivo: global ou bloco
  const eff = (b: ReturnType<typeof useBlockPeriod>) =>
    perBlock ? b.period : period;

  // Query global (cobre todos blocos no modo "global")
  const globalQ = useDashboardMetrics(period);

  // Queries por bloco — só ativadas se perBlock
  const qVendas = useDashboardMetrics(vendasBlock.period);
  const qCadastros = useDashboardMetrics(cadastrosBlock.period);
  const qVerificados = useDashboardMetrics(verificadosBlock.period);
  const qCanceladas = useDashboardMetrics(canceladasBlock.period);
  const qRenovacoes = useDashboardMetrics(renovacoesBlock.period);
  const qCarrinho = useDashboardMetrics(carrinhoBlock.period);
  const qOport = useDashboardMetrics(oportBlock.period);
  const qTotalRS = useDashboardMetrics(totalRSBlock.period);
  const qTicket = useDashboardMetrics(ticketBlock.period);
  const qConversao = useDashboardMetrics(conversaoBlock.period);
  const qPlanos = useDashboardMetrics(planosBlock.period);
  const qFunnel = useDashboardMetrics(funnelBlock.period);

  const pick = (q: typeof globalQ) => (perBlock ? q : globalQ);

  return (
    <AdminLayout pageTitle="Painel Adm.">
      <div className="px-4 py-3 md:container-senior md:py-8 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Visão geral das operações e assinaturas</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild className="gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10">
              <a href="/admin/bi">
                <BarChart3 className="h-4 w-4" />
                BI & Performance
              </a>
            </Button>
            <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-lg">
              <div className="flex items-center gap-2">
                <Label htmlFor="per-block-toggle" className="text-xs cursor-pointer text-muted-foreground">
                  Filtro por bloco
                </Label>
                <Switch
                  id="per-block-toggle"
                  checked={perBlock}
                  onCheckedChange={setPerBlock}
                />
              </div>
              <PeriodFilter
                value={periodKey}
                onChange={setPeriodKey}
                customRange={customRange}
                onCustomRangeChange={setCustomRange}
              />
            </div>
          </div>
        </div>

        {/* Bloco 01 — Funil */}
        <FunnelChart
          data={pick(qFunnel).data?.serieDiaria || []}
          loading={pick(qFunnel).isLoading}
          totalCadastros={pick(qFunnel).data?.totalCadastros || 0}
          totalPagos={pick(qFunnel).data?.totalPagos || 0}
          totalLeads={pick(qFunnel).data?.totalLeads || 0}
          totalVerificados={pick(qFunnel).data?.totalVerificados || 0}
          showLocalFilter={perBlock}
          localPeriodKey={funnelBlock.key}
          onLocalPeriodChange={funnelBlock.setKey}
          localCustomRange={funnelBlock.custom}
          onLocalCustomRangeChange={funnelBlock.setCustom}
        />

        {/* Métricas-chave de período (vendas, cadastros, verificados) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetricBlock
            title="Total Vendas"
            value={fmtNum(pick(qVendas).data?.totalVendas || 0)}
            icon={ShoppingCart}
            accent="success"
            loading={pick(qVendas).isLoading}
            subInfo={
              <>
                <div>{fmtBRL(pick(qVendas).data?.totalVendasRS || 0)} em receita</div>
                <div>{pick(qVendas).data?.totalRenovacoes || 0} renovações</div>
              </>
            }
            showLocalFilter={perBlock}
            localPeriodKey={vendasBlock.key}
            onLocalPeriodChange={vendasBlock.setKey}
            localCustomRange={vendasBlock.custom}
            onLocalCustomRangeChange={vendasBlock.setCustom}
          />
          <MetricBlock
            title="Total Cadastros"
            value={fmtNum(pick(qCadastros).data?.totalCadastros || 0)}
            icon={Users}
            loading={pick(qCadastros).isLoading}
            subInfo={
              <div>
                {pick(qCadastros).data?.totalPagos || 0} pagos ·{" "}
                {pick(qCadastros).data?.totalLeads || 0} leads
              </div>
            }
            showLocalFilter={perBlock}
            localPeriodKey={cadastrosBlock.key}
            onLocalPeriodChange={cadastrosBlock.setKey}
            localCustomRange={cadastrosBlock.custom}
            onLocalCustomRangeChange={cadastrosBlock.setCustom}
          />
          <MetricBlock
            title="Total Verificados"
            value={fmtNum(pick(qVerificados).data?.totalVerificados || 0)}
            icon={UserCheck}
            accent="info"
            loading={pick(qVerificados).isLoading}
            subInfo={
              <div>
                {(pick(qVerificados).data?.pctVerificados || 0).toFixed(1)}% do total
              </div>
            }
            showLocalFilter={perBlock}
            localPeriodKey={verificadosBlock.key}
            onLocalPeriodChange={verificadosBlock.setKey}
            localCustomRange={verificadosBlock.custom}
            onLocalCustomRangeChange={verificadosBlock.setCustom}
          />
        </div>

        {/* Estado atual: Vencidas, Canceladas, Ativas, Grupo VIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricBlock
            title="Contas Vencidas"
            value={fmtNum(globalQ.data?.contasVencidas || 0)}
            icon={AlertTriangle}
            accent="warning"
            loading={globalQ.isLoading}
            isStateOnly
          />
          <MetricBlock
            title="Canceladas (período)"
            value={fmtNum(pick(qCanceladas).data?.totalCanceladas || 0)}
            icon={XCircle}
            accent="danger"
            loading={pick(qCanceladas).isLoading}
            subInfo={
              <>
                <div>{pick(qCanceladas).data?.canceladasComAcesso || 0} ainda c/ acesso</div>
                <div>{pick(qCanceladas).data?.canceladasSemAcesso || 0} s/ acesso</div>
              </>
            }
            showLocalFilter={perBlock}
            localPeriodKey={canceladasBlock.key}
            onLocalPeriodChange={canceladasBlock.setKey}
            localCustomRange={canceladasBlock.custom}
            onLocalCustomRangeChange={canceladasBlock.setCustom}
          />
          <MetricBlock
            title="Contas Ativas (Pago)"
            value={fmtNum(globalQ.data?.contasAtivas || 0)}
            icon={Crown}
            accent="success"
            loading={globalQ.isLoading}
            isStateOnly
            subInfo={
              <div className="space-y-0.5">
                {(globalQ.data?.ativasPorPlano || []).slice(0, 4).map((p) => (
                  <div key={p.name} className="flex justify-between gap-2">
                    <span className="truncate">{p.name}</span>
                    <span className="font-medium">{p.vendas}</span>
                  </div>
                ))}
              </div>
            }
          />
          <MetricBlock
            title="Grupo VIP Lotofácil"
            value={fmtNum(globalQ.data?.grupoVipLotofacil || 0)}
            icon={Star}
            accent="info"
            loading={globalQ.isLoading}
            isStateOnly
            subInfo={<div>integrantes ativos</div>}
          />
        </div>

        {/* Trial + financeiro pontual */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricBlock
            title="Trial Ativo"
            value={fmtNum(globalQ.data?.trialAtivo || 0)}
            icon={Timer}
            accent="info"
            loading={globalQ.isLoading}
            isStateOnly
          />
          <MetricBlock
            title="Trial Vencido"
            value={fmtNum(globalQ.data?.trialVencido || 0)}
            icon={TimerOff}
            accent="warning"
            loading={globalQ.isLoading}
            isStateOnly
          />
          <MetricBlock
            title="Total R$ Vendas"
            value={fmtBRL(pick(qTotalRS).data?.totalVendasRS || 0)}
            icon={DollarSign}
            accent="success"
            loading={pick(qTotalRS).isLoading}
            showLocalFilter={perBlock}
            localPeriodKey={totalRSBlock.key}
            onLocalPeriodChange={totalRSBlock.setKey}
            localCustomRange={totalRSBlock.custom}
            onLocalCustomRangeChange={totalRSBlock.setCustom}
          />
          <MetricBlock
            title="Oport. Vencidas R$"
            value={fmtBRL(pick(qOport).data?.oportunidadesVencidasRS || 0)}
            icon={TrendingDown}
            accent="danger"
            loading={pick(qOport).isLoading}
            subInfo={<div>PIX/assinaturas expiradas</div>}
            showLocalFilter={perBlock}
            localPeriodKey={oportBlock.key}
            onLocalPeriodChange={oportBlock.setKey}
            localCustomRange={oportBlock.custom}
            onLocalCustomRangeChange={oportBlock.setCustom}
          />
          <MetricBlock
            title="PIX a Pagar R$"
            value={fmtBRL(globalQ.data?.pixAPagarRS || 0)}
            icon={Wallet}
            accent="warning"
            loading={globalQ.isLoading}
            isStateOnly
            subInfo={<div>{globalQ.data?.pixAPagarCount || 0} em aberto</div>}
          />
        </div>

        {/* Métricas de saúde extra: ticket médio, conversão, carrinho, renovações */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricBlock
            title="Ticket Médio"
            value={fmtBRL(pick(qTicket).data?.ticketMedio || 0)}
            icon={DollarSign}
            loading={pick(qTicket).isLoading}
            subInfo={<div>R$ vendas / nº vendas</div>}
            showLocalFilter={perBlock}
            localPeriodKey={ticketBlock.key}
            onLocalPeriodChange={ticketBlock.setKey}
            localCustomRange={ticketBlock.custom}
            onLocalCustomRangeChange={ticketBlock.setCustom}
          />
          <MetricBlock
            title="% Conversão"
            value={`${(pick(qConversao).data?.pctConversao || 0).toFixed(1)}%`}
            icon={Percent}
            accent="info"
            loading={pick(qConversao).isLoading}
            subInfo={<div>pagos / cadastros</div>}
            showLocalFilter={perBlock}
            localPeriodKey={conversaoBlock.key}
            onLocalPeriodChange={conversaoBlock.setKey}
            localCustomRange={conversaoBlock.custom}
            onLocalCustomRangeChange={conversaoBlock.setCustom}
          />
          <MetricBlock
            title="Carrinho Abandonado"
            value={fmtNum(pick(qCarrinho).data?.totalCarrinhoAbandonado || 0)}
            icon={ShoppingBag}
            accent="warning"
            loading={pick(qCarrinho).isLoading}
            subInfo={<div>potencial de recuperação</div>}
            showLocalFilter={perBlock}
            localPeriodKey={carrinhoBlock.key}
            onLocalPeriodChange={carrinhoBlock.setKey}
            localCustomRange={carrinhoBlock.custom}
            onLocalCustomRangeChange={carrinhoBlock.setCustom}
          />
          <MetricBlock
            title="Renovações"
            value={fmtNum(pick(qRenovacoes).data?.totalRenovacoes || 0)}
            icon={RefreshCw}
            accent="success"
            loading={pick(qRenovacoes).isLoading}
            subInfo={<div>saúde da retenção</div>}
            showLocalFilter={perBlock}
            localPeriodKey={renovacoesBlock.key}
            onLocalPeriodChange={renovacoesBlock.setKey}
            localCustomRange={renovacoesBlock.custom}
            onLocalCustomRangeChange={renovacoesBlock.setCustom}
          />
        </div>

        {/* Vendas por Plano + Ativos por Plano */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <PlanBreakdownBlock
            title="Vendas por Plano (período)"
            items={pick(qPlanos).data?.vendasPorPlano || []}
            loading={pick(qPlanos).isLoading}
            countLabel="vendas"
            showLocalFilter={perBlock}
            localPeriodKey={planosBlock.key}
            onLocalPeriodChange={planosBlock.setKey}
            localCustomRange={planosBlock.custom}
            onLocalCustomRangeChange={planosBlock.setCustom}
          />
          <PlanBreakdownBlock
            title="Assinaturas Ativas por Plano"
            items={globalQ.data?.ativasPorPlano || []}
            loading={globalQ.isLoading}
            countLabel="contas"
            isStateOnly
            emptyMessage="Nenhuma assinatura ativa"
          />
        </div>
      </div>
    </AdminLayout>
  );
}
