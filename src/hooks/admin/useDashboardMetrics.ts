import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodRange } from "@/hooks/useDashboardPeriod";

const PAID_PLAN_SLUGS = new Set([
  "mensal",
  "semestral",
  "anual",
  "plano-anual-vip",
  "grupo-vip-lotofacil",
]);
const TRIAL_SLUG = "teste-gratis-3-dias";
const GRUPO_VIP_TAG = "grupo_salasecreta";
const VENCIDO_TAG = "plano_vencido";

export interface DailyPoint {
  date: string;
  cadastros: number;
  verificados: number;
  vendas: number;
}

export interface PlanBreakdownItem {
  name: string;
  vendas: number;
  total: number;
}

export interface DashboardMetrics {
  // Período
  totalCadastros: number;
  totalPagos: number;
  totalLeads: number;
  totalVerificados: number;
  pctVerificados: number;
  totalVendas: number;
  totalVendasRS: number;
  ticketMedio: number;
  pctConversao: number;
  totalCanceladas: number;
  canceladasComAcesso: number;
  canceladasSemAcesso: number;
  totalRenovacoes: number;
  totalCarrinhoAbandonado: number;
  oportunidadesVencidasRS: number;
  vendasPorPlano: PlanBreakdownItem[];
  serieDiaria: DailyPoint[];

  // Estado atual (ignora período)
  contasVencidas: number;
  contasAtivas: number;
  ativasPorPlano: PlanBreakdownItem[];
  grupoVipLotofacil: number;
  trialAtivo: number;
  trialVencido: number;
  pixAPagarRS: number;
  pixAPagarCount: number;
}

function parseBRL(s?: string | null): number {
  if (!s) return 0;
  const cleaned = String(s).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// Formata uma Date no fuso de São Paulo como "YYYY-MM-DD"
const BR_DAY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayKey(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  // en-CA já entrega "YYYY-MM-DD"
  return BR_DAY_FMT.format(dt);
}

function buildDailySeries(
  from: Date,
  to: Date,
  cadastros: { created_at: string }[],
  verificados: { created_at: string }[],
  vendas: { received_at: string }[]
): DailyPoint[] {
  const map = new Map<string, DailyPoint>();
  // Itera dia-a-dia usando o calendário de São Paulo
  let curKey = dayKey(from);
  const endKey = dayKey(to);
  // Avança 1 dia somando 24h ao timestamp UTC e re-formatando em BR;
  // em datas DST (raro hoje no Brasil) ainda gera a sequência correta.
  let cursor = new Date(from.getTime());
  // Garantia de progresso: máximo 400 iterações (>1 ano)
  let safety = 0;
  while (curKey <= endKey && safety++ < 400) {
    map.set(curKey, { date: curKey, cadastros: 0, verificados: 0, vendas: 0 });
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    curKey = dayKey(cursor);
  }
  cadastros.forEach((c) => {
    const k = dayKey(c.created_at);
    const p = map.get(k);
    if (p) p.cadastros++;
  });
  verificados.forEach((v) => {
    const k = dayKey(v.created_at);
    const p = map.get(k);
    if (p) p.verificados++;
  });
  vendas.forEach((v) => {
    const k = dayKey(v.received_at);
    const p = map.get(k);
    if (p) p.vendas++;
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function useDashboardMetrics(period: PeriodRange) {
  return useQuery({
    queryKey: ["admin-dashboard-metrics", period.from.toISOString(), period.to.toISOString()],
    queryFn: async (): Promise<DashboardMetrics> => {
      const fromIso = period.from.toISOString();
      const toIso = period.to.toISOString();
      const nowIso = new Date().toISOString();

      const [
        plansRes,
        perfisPeriodoRes,
        perfisEstadoRes,
        logsPeriodoRes,
        pixGeradosRes,
        salesAprovadasIdsRes,
      ] = await Promise.all([
        supabase.from("plans").select("id, slug, name, price").order("display_order"),
        supabase
          .from("perfis")
          .select("id, email, created_at, email_verificado, plan_id")
          .eq("is_bot", false)
          .gte("created_at", fromIso)
          .lte("created_at", toIso),
        supabase
          .from("perfis")
          .select("id, email, plan_id, status_assinatura, validade_assinatura, tags, trial_used")
          .eq("is_bot", false),
        supabase
          .from("kirvano_webhook_logs")
          .select("event, email, checkout_id, raw_payload, received_at")
          .gte("received_at", fromIso)
          .lte("received_at", toIso),
        supabase
          .from("kirvano_webhook_logs")
          .select("event, checkout_id, raw_payload, received_at")
          .eq("event", "PIX_GENERATED"),
        supabase
          .from("kirvano_webhook_logs")
          .select("checkout_id")
          .eq("event", "SALE_APPROVED"),
      ]);

      const plans = plansRes.data || [];
      const perfisPeriodo = perfisPeriodoRes.data || [];
      const perfisEstado = perfisEstadoRes.data || [];
      const logsPeriodo = logsPeriodoRes.data || [];
      const pixGerados = pixGeradosRes.data || [];
      const salesAprovadas = salesAprovadasIdsRes.data || [];

      const planById = new Map(plans.map((p) => [p.id, p]));

      // ===== Período =====
      const vendasAprovadas = logsPeriodo.filter(
        (l) => l.event === "SALE_APPROVED"
      );
      const renovacoes = logsPeriodo.filter((l) => l.event === "SUBSCRIPTION_RENEWED");
      const canceladas = logsPeriodo.filter((l) => l.event === "SUBSCRIPTION_CANCELED");
      const carrinhoAbandonado = logsPeriodo.filter((l) => l.event === "ABANDONED_CART");
      const vencimentos = logsPeriodo.filter(
        (l) => l.event === "SUBSCRIPTION_EXPIRED" || l.event === "PIX_EXPIRED"
      );

      const emailsPagos = new Set(
        vendasAprovadas
          .map((v) => (v.email || "").toLowerCase())
          .filter(Boolean)
      );
      const totalCadastros = perfisPeriodo.length;
      const totalPagos = perfisPeriodo.filter(
        (p) => p.email && emailsPagos.has(p.email.toLowerCase())
      ).length;
      const totalLeads = totalCadastros - totalPagos;
      const totalVerificados = perfisPeriodo.filter((p) => p.email_verificado).length;
      const pctVerificados =
        totalCadastros > 0 ? (totalVerificados / totalCadastros) * 100 : 0;

      const totalVendas = vendasAprovadas.length + renovacoes.length;
      const totalVendasRS =
        vendasAprovadas.reduce(
          (acc, v) => acc + parseBRL((v.raw_payload as any)?.total_price),
          0
        ) +
        renovacoes.reduce(
          (acc, v) => acc + parseBRL((v.raw_payload as any)?.total_price),
          0
        );
      const ticketMedio = totalVendas > 0 ? totalVendasRS / totalVendas : 0;
      const pctConversao =
        totalCadastros > 0 ? (totalPagos / totalCadastros) * 100 : 0;

      // Canceladas: ativ vs inat baseado em validade do perfil
      const perfilByEmail = new Map(
        perfisEstado
          .filter((p) => p.email)
          .map((p) => [p.email!.toLowerCase(), p])
      );
      const now = new Date();
      let canceladasComAcesso = 0;
      let canceladasSemAcesso = 0;
      canceladas.forEach((c) => {
        const perfil = c.email && perfilByEmail.get(c.email.toLowerCase());
        const valid = perfil?.validade_assinatura
          ? new Date(perfil.validade_assinatura) > now
          : false;
        if (valid) canceladasComAcesso++;
        else canceladasSemAcesso++;
      });

      const oportunidadesVencidasRS = vencimentos.reduce(
        (acc, v) => acc + parseBRL((v.raw_payload as any)?.total_price),
        0
      );

      // Vendas por plano (período): agrupar por raw_payload.plan.name OU produto
      const planoBucket = new Map<string, { vendas: number; total: number }>();
      [...vendasAprovadas, ...renovacoes].forEach((v) => {
        const payload = v.raw_payload as any;
        const nome =
          payload?.plan?.name ||
          payload?.products?.[0]?.name ||
          payload?.product?.name ||
          "Outros";
        const valor = parseBRL(payload?.total_price);
        const cur = planoBucket.get(nome) || { vendas: 0, total: 0 };
        cur.vendas++;
        cur.total += valor;
        planoBucket.set(nome, cur);
      });
      const vendasPorPlano: PlanBreakdownItem[] = Array.from(planoBucket.entries())
        .map(([name, v]) => ({ name, vendas: v.vendas, total: v.total }))
        .sort((a, b) => b.vendas - a.vendas);

      // Série diária
      const serieDiaria = buildDailySeries(
        period.from,
        period.to,
        perfisPeriodo.map((p) => ({ created_at: p.created_at })),
        perfisPeriodo.filter((p) => p.email_verificado).map((p) => ({ created_at: p.created_at })),
        vendasAprovadas.map((v) => ({ received_at: v.received_at }))
      );

      // ===== Estado atual =====
      const isPaidPlan = (planId: string | null | undefined) => {
        if (!planId) return false;
        const p = planById.get(planId);
        return p ? PAID_PLAN_SLUGS.has(p.slug) : false;
      };
      const isTrialPlan = (planId: string | null | undefined) => {
        if (!planId) return false;
        const p = planById.get(planId);
        return p?.slug === TRIAL_SLUG;
      };

      const ativos = perfisEstado.filter(
        (p) =>
          isPaidPlan(p.plan_id) &&
          (p.status_assinatura === "ativa" ||
            (p.validade_assinatura && new Date(p.validade_assinatura) > now))
      );
      const contasAtivas = ativos.length;
      const ativasBucket = new Map<string, { vendas: number; total: number }>();
      ativos.forEach((u) => {
        const plan = u.plan_id ? planById.get(u.plan_id) : null;
        if (!plan) return;
        const cur = ativasBucket.get(plan.name) || { vendas: 0, total: 0 };
        cur.vendas++;
        cur.total += Number(plan.price) || 0;
        ativasBucket.set(plan.name, cur);
      });
      const ativasPorPlano: PlanBreakdownItem[] = Array.from(ativasBucket.entries())
        .map(([name, v]) => ({ name, vendas: v.vendas, total: v.total }))
        .sort((a, b) => b.vendas - a.vendas);

      const contasVencidas = perfisEstado.filter(
        (p) =>
          (p.tags || []).includes(VENCIDO_TAG) ||
          (p.validade_assinatura && new Date(p.validade_assinatura) < now && isPaidPlan(p.plan_id))
      ).length;

      const grupoVipLotofacil = perfisEstado.filter((p) =>
        (p.tags || []).includes(GRUPO_VIP_TAG)
      ).length;

      const trialAtivo = perfisEstado.filter(
        (p) =>
          isTrialPlan(p.plan_id) &&
          p.validade_assinatura &&
          new Date(p.validade_assinatura) > now
      ).length;
      const trialVencido = perfisEstado.filter(
        (p) =>
          p.trial_used &&
          (!p.plan_id ||
            isTrialPlan(p.plan_id) === false ||
            (p.validade_assinatura && new Date(p.validade_assinatura) < now))
      ).length;

      // PIX a pagar (estado atual)
      const checkoutsAprovadosSet = new Set(
        salesAprovadas.map((s) => s.checkout_id).filter(Boolean) as string[]
      );
      const pixAbertos = pixGerados.filter((p) => {
        if (p.checkout_id && checkoutsAprovadosSet.has(p.checkout_id)) return false;
        const exp = (p.raw_payload as any)?.payment?.expires_at;
        if (!exp) return true;
        return new Date(exp) > now;
      });
      const pixAPagarRS = pixAbertos.reduce(
        (acc, p) => acc + parseBRL((p.raw_payload as any)?.total_price),
        0
      );
      const pixAPagarCount = pixAbertos.length;

      return {
        totalCadastros,
        totalPagos,
        totalLeads,
        totalVerificados,
        pctVerificados,
        totalVendas,
        totalVendasRS,
        ticketMedio,
        pctConversao,
        totalCanceladas: canceladas.length,
        canceladasComAcesso,
        canceladasSemAcesso,
        totalRenovacoes: renovacoes.length,
        totalCarrinhoAbandonado: carrinhoAbandonado.length,
        oportunidadesVencidasRS,
        vendasPorPlano,
        serieDiaria,

        contasVencidas,
        contasAtivas,
        ativasPorPlano,
        grupoVipLotofacil,
        trialAtivo,
        trialVencido,
        pixAPagarRS,
        pixAPagarCount,
      };
    },
    staleTime: 60_000,
  });
}

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtNum = (v: number) => v.toLocaleString("pt-BR");
