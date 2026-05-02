import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodRange } from "@/hooks/useDashboardPeriod";

export interface BIMetrics {
  revenue: number;
  marketingCost: number;
  operationalCost: number;
  totalCost: number;
  netProfit: number;
  roas: number;
  cpa: number;
  cpl: number;
  totalLeads: number;
  totalBuyers: number;
  totalSales: number;
  conversionRate: number; // Leads to Buyers
  averageTicket: number;
  ltv: number;
}

export function useBIMetrics(period: PeriodRange) {
  return useQuery({
    queryKey: ["admin-bi-metrics", period.from.toISOString(), period.to.toISOString()],
    queryFn: async (): Promise<BIMetrics> => {
      const fromIso = period.from.toISOString();
      const toIso = period.to.toISOString();

      const [salesRes, costsRes, leadsRes, perfisRes] = await Promise.all([
        supabase
          .from("kirvano_webhook_logs")
          .select("event, raw_payload")
          .in("event", ["SALE_APPROVED", "SUBSCRIPTION_RENEWED"])
          .gte("received_at", fromIso)
          .lte("received_at", toIso),
        supabase
          .from("custos_operacionais_manuais")
          .select("valor, categoria")
          .gte("data_custo", fromIso.split("T")[0])
          .lte("data_custo", toIso.split("T")[0]),
        supabase
          .from("leads_inbox")
          .select("id")
          .gte("created_at", fromIso)
          .lte("created_at", toIso),
        supabase
          .from("perfis")
          .select("id")
          .eq("is_bot", false)
          .gte("first_purchase_at", fromIso)
          .lte("first_purchase_at", toIso),
      ]);

      const sales = salesRes.data || [];
      const costs = costsRes.data || [];
      const totalLeads = leadsRes.data?.length || 0;
      const totalBuyers = perfisRes.data?.length || 0;

      // Revenue
      const revenue = sales.reduce((acc, s) => {
        const payload = s.raw_payload as any;
        const price = String(payload?.total_price || "0")
          .replace(/[^\d,.-]/g, "")
          .replace(/\./g, "")
          .replace(",", ".");
        return acc + (parseFloat(price) || 0);
      }, 0);

      // Costs
      let marketingCost = 0;
      let operationalCost = 0;
      costs.forEach((c) => {
        const val = Number(c.valor) || 0;
        if (c.categoria === "marketing" || c.categoria === "trafego") {
          marketingCost += val;
        } else {
          operationalCost += val;
        }
      });

      const totalCost = marketingCost + operationalCost;
      const netProfit = revenue - totalCost;
      const roas = marketingCost > 0 ? revenue / marketingCost : 0;
      const cpa = totalBuyers > 0 ? marketingCost / totalBuyers : 0;
      const cpl = totalLeads > 0 ? marketingCost / totalLeads : 0;
      const totalSales = sales.length;
      const averageTicket = totalSales > 0 ? revenue / totalSales : 0;
      const conversionRate = totalLeads > 0 ? (totalBuyers / totalLeads) * 100 : 0;

      // Simplistic LTV for the period (Total Revenue / Total Buyers ever encountered in this period)
      const ltv = totalBuyers > 0 ? revenue / totalBuyers : 0;

      return {
        revenue,
        marketingCost,
        operationalCost,
        totalCost,
        netProfit,
        roas,
        cpa,
        cpl,
        totalLeads,
        totalBuyers,
        totalSales,
        conversionRate,
        averageTicket,
        ltv,
      };
    },
  });
}
