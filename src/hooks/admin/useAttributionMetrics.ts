import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodRange } from "@/hooks/useDashboardPeriod";

export type AttributionDimension =
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_content"
  | "utm_term"
  | "slug"
  | "referrer_host"
  | "gclid_present"
  | "fbclid_present";

export const DIMENSION_OPTIONS: { value: AttributionDimension; label: string }[] = [
  { value: "utm_source", label: "UTM Source" },
  { value: "utm_medium", label: "UTM Medium" },
  { value: "utm_campaign", label: "UTM Campaign" },
  { value: "utm_content", label: "UTM Content" },
  { value: "utm_term", label: "UTM Term" },
  { value: "slug", label: "Página (slug)" },
  { value: "referrer_host", label: "Referrer (host)" },
  { value: "gclid_present", label: "Google Ads (gclid)" },
  { value: "fbclid_present", label: "Facebook Ads (fbclid)" },
];

const DIRECT = "(direto)";

export interface AttributionRow {
  origem: string;
  leads: number;
  cadastros: number;
  compradores: number;
  vendas: number;
  receita: number;
  ticketMedio: number;
  convCadComprador: number; // %
}

export interface BuyerRow {
  id: string;
  email: string | null;
  nome: string | null;
  firstClickAt: Date | null;
  signupAt: Date | null;
  firstPurchaseAt: Date;
  diasAteComprar: number | null;
  vendas: number;
  receitaTotal: number;
  utmSource: string | null;
  utmCampaign: string | null;
}

export interface ClickAttributionRow {
  origem: string;
  vendas: number;
  compradoresUnicos: number;
  receita: number;
  ticketMedio: number;
  pctTotal: number; // 0..100
}

export interface ClickComparisonRow {
  origem: string;
  vendasFirst: number;
  receitaFirst: number;
  vendasLast: number;
  receitaLast: number;
  deltaVendas: number;
  deltaReceita: number;
}

export interface AttributionMetrics {
  // KPIs período
  totalLeads: number;
  totalCadastros: number;
  totalCompradores: number;
  totalVendas: number;
  receitaTotal: number;
  ticketMedio: number;
  convLeadCadastro: number;
  convCadCompra: number;
  ltvMedioDias: number;
  // Tabelas
  rows: AttributionRow[];
  buyers: BuyerRow[];
  // First vs Last click — por dimensão
  firstClickByDim: Record<AttributionDimension, ClickAttributionRow[]>;
  lastClickByDim: Record<AttributionDimension, ClickAttributionRow[]>;
  comparisonByDim: Record<AttributionDimension, ClickComparisonRow[]>;
  // KPIs de cobertura first/last
  vendasComFirstClick: number;
  vendasComLastClick: number;
  vendasMesmoCanal: number;
  vendasCanalDivergente: number;
  // Para dropdown gerador
  uniqueUtmSources: string[];
}

function parseBRL(s: unknown): number {
  if (s == null) return 0;
  const cleaned = String(s).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function hostOf(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url.split("/")[0] || "";
  }
}

function dimValueFromAttribution(
  attr: Record<string, unknown> | null | undefined,
  dim: AttributionDimension,
): string {
  const a = attr || {};
  const get = (k: string) => (typeof a[k] === "string" ? (a[k] as string).trim() : "");
  switch (dim) {
    case "utm_source":
    case "utm_medium":
    case "utm_campaign":
    case "utm_content":
    case "utm_term":
    case "slug":
      return get(dim) || DIRECT;
    case "referrer_host":
      return hostOf(get("referrer")) || DIRECT;
    case "gclid_present":
      return get("gclid") ? "Com gclid" : "Sem gclid";
    case "fbclid_present":
      return get("fbclid") ? "Com fbclid" : "Sem fbclid";
  }
}

function dimValueFromLead(lead: any, dim: AttributionDimension): string {
  switch (dim) {
    case "utm_source":
    case "utm_medium":
    case "utm_campaign":
    case "utm_content":
    case "utm_term":
    case "slug":
      return (lead?.[dim] as string)?.trim() || DIRECT;
    case "referrer_host":
      return hostOf(lead?.referrer) || DIRECT;
    case "gclid_present":
      return lead?.gclid ? "Com gclid" : "Sem gclid";
    case "fbclid_present":
      return lead?.fbclid ? "Com fbclid" : "Sem fbclid";
  }
}

export function useAttributionMetrics(period: PeriodRange, dimension: AttributionDimension) {
  return useQuery({
    queryKey: [
      "admin-attribution-metrics",
      period.from.toISOString(),
      period.to.toISOString(),
      dimension,
    ],
    queryFn: async (): Promise<AttributionMetrics> => {
      const fromIso = period.from.toISOString();
      const toIso = period.to.toISOString();

      const [leadsRes, perfisRes, vendasRes] = await Promise.all([
        supabase
          .from("leads_inbox")
          .select(
            "id, email, celular, utm_source, utm_medium, utm_campaign, utm_content, utm_term, slug, referrer, gclid, fbclid, created_at",
          )
          .gte("created_at", fromIso)
          .lte("created_at", toIso),
        supabase
          .from("perfis")
          .select(
            "id, email, nome, created_at, attribution, first_purchase_at, utm_source",
          )
          .eq("is_bot", false),
        supabase
          .from("kirvano_webhook_logs")
          .select("event, email, raw_payload, received_at")
          .in("event", ["SALE_APPROVED", "SUBSCRIPTION_RENEWED"]),
      ]);

      const leads = leadsRes.data || [];
      const perfis = perfisRes.data || [];
      const vendas = vendasRes.data || [];

      // Index perfis por id e por email
      const perfilByEmail = new Map<string, typeof perfis[number]>();
      for (const p of perfis) {
        if (p.email) perfilByEmail.set(p.email.toLowerCase(), p);
      }

      // Agrupa vendas por email
      const vendasByEmail = new Map<string, { count: number; total: number; firstAt: Date | null }>();
      for (const v of vendas) {
        const email = (v.email || "").toLowerCase();
        if (!email) continue;
        const valor = parseBRL((v.raw_payload as any)?.total_price);
        const at = v.received_at ? new Date(v.received_at) : null;
        const cur = vendasByEmail.get(email) || { count: 0, total: 0, firstAt: null };
        cur.count++;
        cur.total += valor;
        if (at && (!cur.firstAt || at < cur.firstAt)) cur.firstAt = at;
        vendasByEmail.set(email, cur);
      }

      // Filtra perfis criados no período
      const fromDate = new Date(fromIso);
      const toDate = new Date(toIso);
      const perfisPeriodo = perfis.filter((p) => {
        const c = p.created_at ? new Date(p.created_at) : null;
        return c && c >= fromDate && c <= toDate;
      });

      // Compradores no período = perfis com first_purchase_at dentro do período
      const compradoresPeriodo = perfis.filter((p) => {
        const fp = p.first_purchase_at ? new Date(p.first_purchase_at) : null;
        return fp && fp >= fromDate && fp <= toDate;
      });

      // ===== KPIs =====
      const totalLeads = leads.length;
      const totalCadastros = perfisPeriodo.length;
      const totalCompradores = compradoresPeriodo.length;

      // Vendas+receita do período (por received_at)
      const vendasPeriodo = vendas.filter((v) => {
        const at = v.received_at ? new Date(v.received_at) : null;
        return at && at >= fromDate && at <= toDate;
      });
      const totalVendas = vendasPeriodo.length;
      const receitaTotal = vendasPeriodo.reduce(
        (a, v) => a + parseBRL((v.raw_payload as any)?.total_price),
        0,
      );
      const ticketMedio = totalVendas > 0 ? receitaTotal / totalVendas : 0;
      const convLeadCadastro = totalLeads > 0 ? (totalCadastros / totalLeads) * 100 : 0;
      const convCadCompra = totalCadastros > 0 ? (totalCompradores / totalCadastros) * 100 : 0;

      // LTV médio (dias) — usa todos compradores do período
      const ltvDiasArr: number[] = [];
      for (const c of compradoresPeriodo) {
        const fp = c.first_purchase_at ? new Date(c.first_purchase_at).getTime() : 0;
        const startKey = (c.attribution as any)?.first_click_at || c.created_at;
        const start = startKey ? new Date(startKey).getTime() : 0;
        if (fp && start && fp >= start) {
          ltvDiasArr.push((fp - start) / (1000 * 60 * 60 * 24));
        }
      }
      const ltvMedioDias = ltvDiasArr.length
        ? ltvDiasArr.reduce((a, b) => a + b, 0) / ltvDiasArr.length
        : 0;

      // ===== Tabela por dimensão =====
      type Bucket = AttributionRow;
      const buckets = new Map<string, Bucket>();
      const ensure = (k: string): Bucket => {
        let b = buckets.get(k);
        if (!b) {
          b = {
            origem: k,
            leads: 0,
            cadastros: 0,
            compradores: 0,
            vendas: 0,
            receita: 0,
            ticketMedio: 0,
            convCadComprador: 0,
          };
          buckets.set(k, b);
        }
        return b;
      };

      // Leads (do período)
      for (const l of leads) {
        const k = dimValueFromLead(l, dimension);
        ensure(k).leads++;
      }
      // Cadastros (perfis criados no período)
      for (const p of perfisPeriodo) {
        const k = dimValueFromAttribution(p.attribution as any, dimension);
        ensure(k).cadastros++;
      }
      // Compradores (perfis com primeira compra no período) + vendas/receita
      for (const c of compradoresPeriodo) {
        const k = dimValueFromAttribution(c.attribution as any, dimension);
        const b = ensure(k);
        b.compradores++;
        const emailKey = c.email?.toLowerCase();
        if (emailKey) {
          const v = vendasByEmail.get(emailKey);
          if (v) {
            b.vendas += v.count;
            b.receita += v.total;
          }
        }
      }

      const rows: AttributionRow[] = Array.from(buckets.values())
        .map((b) => ({
          ...b,
          ticketMedio: b.vendas > 0 ? b.receita / b.vendas : 0,
          convCadComprador: b.cadastros > 0 ? (b.compradores / b.cadastros) * 100 : 0,
        }))
        .sort((a, b) => b.cadastros - a.cadastros || b.compradores - a.compradores);

      // ===== Tabela de compradores =====
      const buyers: BuyerRow[] = compradoresPeriodo
        .map((c) => {
          const attr = (c.attribution as Record<string, any>) || {};
          const fpAt = c.first_purchase_at ? new Date(c.first_purchase_at) : null;
          if (!fpAt) return null;
          const firstClickStr = (attr.first_click_at as string) || null;
          const firstClickAt = firstClickStr ? new Date(firstClickStr) : null;
          const signupAt = c.created_at ? new Date(c.created_at) : null;
          const startTs = (firstClickAt || signupAt)?.getTime() || 0;
          const dias = startTs ? Math.max(0, (fpAt.getTime() - startTs) / 86400000) : null;
          const emailKey = c.email?.toLowerCase();
          const v = emailKey ? vendasByEmail.get(emailKey) : null;
          return {
            id: c.id,
            email: c.email,
            nome: c.nome,
            firstClickAt,
            signupAt,
            firstPurchaseAt: fpAt,
            diasAteComprar: dias,
            vendas: v?.count || 0,
            receitaTotal: v?.total || 0,
            utmSource: (attr.utm_source as string) || c.utm_source || null,
            utmCampaign: (attr.utm_campaign as string) || null,
          } as BuyerRow;
        })
        .filter((b): b is BuyerRow => !!b)
        .sort((a, b) => b.firstPurchaseAt.getTime() - a.firstPurchaseAt.getTime());

      const uniqueUtmSources = Array.from(
        new Set(
          perfis
            .map((p) => ((p.attribution as any)?.utm_source as string) || p.utm_source || "")
            .filter(Boolean),
        ),
      );

      // ===== First-Click vs Last-Click =====
      const CLICK_DIMS: AttributionDimension[] = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
      ];

      type ClickAcc = { vendas: number; receita: number; emails: Set<string> };
      const firstAccByDim: Record<string, Record<string, ClickAcc>> = {};
      const lastAccByDim: Record<string, Record<string, ClickAcc>> = {};
      for (const d of CLICK_DIMS) {
        firstAccByDim[d] = {};
        lastAccByDim[d] = {};
      }

      let vendasComFirstClick = 0;
      let vendasComLastClick = 0;
      let vendasMesmoCanal = 0;
      let vendasCanalDivergente = 0;

      const getFirstClickValue = (
        attr: Record<string, any> | null | undefined,
        dim: AttributionDimension,
      ): string => {
        const a = attr || {};
        const v = typeof a[dim] === "string" ? (a[dim] as string).trim() : "";
        return v || DIRECT;
      };

      const getLastClickValue = (payload: any, dim: AttributionDimension): string => {
        const utm = payload?.utm || {};
        const cookies = payload?.cookies || {};
        const raw =
          (typeof utm[dim] === "string" && utm[dim]) ||
          (typeof cookies[dim] === "string" && cookies[dim]) ||
          (typeof payload?.[dim] === "string" && payload?.[dim]) ||
          "";
        return String(raw || "").trim() || DIRECT;
      };

      for (const v of vendasPeriodo) {
        const valor = parseBRL((v.raw_payload as any)?.total_price);
        const emailKey = (v.email || "").toLowerCase().trim();
        const perfil = emailKey ? perfilByEmail.get(emailKey) : undefined;
        const attr = (perfil?.attribution as Record<string, any>) || null;
        const payload = (v.raw_payload as any) || {};

        const firstSrcRaw = attr?.utm_source && String(attr.utm_source).trim();
        const lastSrcRaw =
          (payload?.utm?.utm_source && String(payload.utm.utm_source).trim()) ||
          (payload?.cookies?.utm_source && String(payload.cookies.utm_source).trim()) ||
          "";
        const hasFirst = !!firstSrcRaw;
        const hasLast = !!lastSrcRaw;
        if (hasFirst) vendasComFirstClick++;
        if (hasLast) vendasComLastClick++;
        if (hasFirst && hasLast) {
          if (firstSrcRaw!.toLowerCase() === lastSrcRaw!.toLowerCase()) vendasMesmoCanal++;
          else vendasCanalDivergente++;
        }

        for (const dim of CLICK_DIMS) {
          const fk = getFirstClickValue(attr, dim);
          const lk = getLastClickValue(payload, dim);

          const fAcc =
            firstAccByDim[dim][fk] ||
            (firstAccByDim[dim][fk] = { vendas: 0, receita: 0, emails: new Set() });
          fAcc.vendas++;
          fAcc.receita += valor;
          if (emailKey) fAcc.emails.add(emailKey);

          const lAcc =
            lastAccByDim[dim][lk] ||
            (lastAccByDim[dim][lk] = { vendas: 0, receita: 0, emails: new Set() });
          lAcc.vendas++;
          lAcc.receita += valor;
          if (emailKey) lAcc.emails.add(emailKey);
        }
      }

      const totalVendasPeriodo = vendasPeriodo.length;
      const toClickRows = (acc: Record<string, ClickAcc>): ClickAttributionRow[] =>
        Object.entries(acc)
          .map(([origem, a]) => ({
            origem,
            vendas: a.vendas,
            compradoresUnicos: a.emails.size,
            receita: a.receita,
            ticketMedio: a.vendas > 0 ? a.receita / a.vendas : 0,
            pctTotal: totalVendasPeriodo > 0 ? (a.vendas / totalVendasPeriodo) * 100 : 0,
          }))
          .sort((a, b) => b.vendas - a.vendas || b.receita - a.receita);

      const firstClickByDim = {} as Record<AttributionDimension, ClickAttributionRow[]>;
      const lastClickByDim = {} as Record<AttributionDimension, ClickAttributionRow[]>;
      const comparisonByDim = {} as Record<AttributionDimension, ClickComparisonRow[]>;

      for (const dim of CLICK_DIMS) {
        firstClickByDim[dim] = toClickRows(firstAccByDim[dim]);
        lastClickByDim[dim] = toClickRows(lastAccByDim[dim]);

        const keys = new Set<string>([
          ...Object.keys(firstAccByDim[dim]),
          ...Object.keys(lastAccByDim[dim]),
        ]);
        comparisonByDim[dim] = Array.from(keys)
          .map((k) => {
            const f = firstAccByDim[dim][k];
            const l = lastAccByDim[dim][k];
            const vF = f?.vendas || 0;
            const rF = f?.receita || 0;
            const vL = l?.vendas || 0;
            const rL = l?.receita || 0;
            return {
              origem: k,
              vendasFirst: vF,
              receitaFirst: rF,
              vendasLast: vL,
              receitaLast: rL,
              deltaVendas: vL - vF,
              deltaReceita: rL - rF,
            } as ClickComparisonRow;
          })
          .sort(
            (a, b) =>
              Math.max(b.vendasFirst, b.vendasLast) - Math.max(a.vendasFirst, a.vendasLast) ||
              Math.abs(b.deltaVendas) - Math.abs(a.deltaVendas),
          );
      }

      const emptyDims: AttributionDimension[] = [
        "slug",
        "referrer_host",
        "gclid_present",
        "fbclid_present",
      ];
      for (const d of emptyDims) {
        firstClickByDim[d] = [];
        lastClickByDim[d] = [];
        comparisonByDim[d] = [];
      }

      return {
        totalLeads,
        totalCadastros,
        totalCompradores,
        totalVendas,
        receitaTotal,
        ticketMedio,
        convLeadCadastro,
        convCadCompra,
        ltvMedioDias,
        rows,
        buyers,
        firstClickByDim,
        lastClickByDim,
        comparisonByDim,
        vendasComFirstClick,
        vendasComLastClick,
        vendasMesmoCanal,
        vendasCanalDivergente,
        uniqueUtmSources,
      };
    },
    staleTime: 60_000,
  });
}

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtNum = (v: number) => v.toLocaleString("pt-BR");
export const fmtPct = (v: number) => `${v.toFixed(1)}%`;
export const fmtDays = (v: number | null) =>
  v == null ? "—" : v < 1 ? "<1 dia" : `${v.toFixed(1)} dias`;
