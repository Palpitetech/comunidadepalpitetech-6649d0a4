import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import {
  resolvePeriod,
  useDashboardPeriod,
  PeriodRange,
} from "@/hooks/useDashboardPeriod";
import { PeriodFilter } from "@/components/admin/dashboard/PeriodFilter";
import {
  useAttributionMetrics,
  AttributionDimension,
  fmtNum,
  fmtPct,
} from "@/hooks/admin/useAttributionMetrics";
import { MetricsKPIs } from "@/components/admin/metricas/MetricsKPIs";
import { AttributionTable } from "@/components/admin/metricas/AttributionTable";
import { BuyersLTVTable } from "@/components/admin/metricas/BuyersLTVTable";
import { FirstVsLastClickTable } from "@/components/admin/metricas/FirstVsLastClickTable";
import {
  BlockPeriodControl,
  BlockPeriodState,
  initialBlockPeriodState,
} from "@/components/admin/metricas/BlockPeriodControl";
import {
  KPIsSkeleton,
  TableCardSkeleton,
  FirstVsLastSkeleton,
  FunnelSkeleton,
} from "@/components/admin/metricas/MetricsSkeletons";
import { exportToCSV } from "@/utils/exportUtils";
import { Download } from "lucide-react";


const BASE_URL = "comunidadepalpitetech.lovable.app";

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Link copiado!");
}

/** Resolve o PeriodRange efetivo de um bloco (override → próprio; senão → global). */
function resolveBlockPeriod(state: BlockPeriodState, globalPeriod: PeriodRange): PeriodRange {
  if (!state.override) return globalPeriod;
  return resolvePeriod(state.periodKey, state.customRange);
}

export default function AdminMetricas() {
  const { period, periodKey, setPeriodKey, customRange, setCustomRange } = useDashboardPeriod("7d");
  const [dimension, setDimension] = useState<AttributionDimension>("utm_source");

  // Overrides por bloco (default = seguir global)
  const [kpisState, setKpisState] = useState<BlockPeriodState>(() =>
    initialBlockPeriodState(periodKey, customRange),
  );
  const [attrState, setAttrState] = useState<BlockPeriodState>(() =>
    initialBlockPeriodState(periodKey, customRange),
  );
  const [buyersState, setBuyersState] = useState<BlockPeriodState>(() =>
    initialBlockPeriodState(periodKey, customRange),
  );
  const [clickState, setClickState] = useState<BlockPeriodState>(() =>
    initialBlockPeriodState(periodKey, customRange),
  );
  const [funnelState, setFunnelState] = useState<BlockPeriodState>(() =>
    initialBlockPeriodState(periodKey, customRange),
  );

  // Períodos efetivos por bloco
  const kpisPeriod = useMemo(() => resolveBlockPeriod(kpisState, period), [kpisState, period]);
  const attrPeriod = useMemo(() => resolveBlockPeriod(attrState, period), [attrState, period]);
  const buyersPeriod = useMemo(() => resolveBlockPeriod(buyersState, period), [buyersState, period]);
  const clickPeriod = useMemo(() => resolveBlockPeriod(clickState, period), [clickState, period]);
  const funnelPeriod = useMemo(() => resolveBlockPeriod(funnelState, period), [funnelState, period]);

  // Uma query por bloco — React Query deduplica caches iguais automaticamente
  // pela queryKey, então blocos no mesmo período compartilham o mesmo fetch.
  const kpisQuery = useAttributionMetrics(kpisPeriod, dimension);
  const attrQuery = useAttributionMetrics(attrPeriod, dimension);
  const buyersQuery = useAttributionMetrics(buyersPeriod, dimension);
  const clickQuery = useAttributionMetrics(clickPeriod, dimension);
  const funnelQuery = useAttributionMetrics(funnelPeriod, dimension);

  // Gerador de UTM (usa o período global apenas para popular o dropdown de sources)
  const [destino, setDestino] = useState(`https://${BASE_URL}`);
  const [utmSource, setUtmSource] = useState("instagram");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [utmTerm, setUtmTerm] = useState("");

  const previewUrl = useMemo(() => {
    try {
      const url = new URL(destino.startsWith("http") ? destino : `https://${destino}`);
      if (utmSource) url.searchParams.set("utm_source", utmSource);
      if (utmMedium) url.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);
      if (utmContent) url.searchParams.set("utm_content", utmContent);
      if (utmTerm) url.searchParams.set("utm_term", utmTerm);
      return url.toString();
    } catch {
      return `${destino}?utm_source=${utmSource}`;
    }
  }, [destino, utmSource, utmMedium, utmCampaign, utmContent, utmTerm]);

  // Funil
  const funnelData = funnelQuery.data;
  const funnel = useMemo(() => {
    if (!funnelData) return null;
    const max = Math.max(funnelData.totalLeads, funnelData.totalCadastros, funnelData.totalCompradores, 1);
    const bar = (n: number) => "█".repeat(Math.max(1, Math.round((n / max) * 24)));
    return {
      leads: bar(funnelData.totalLeads || 1),
      cadastros: bar(funnelData.totalCadastros || 1),
      compradores: bar(funnelData.totalCompradores || 1),
    };
  }, [funnelData]);

  

  return (
    <AdminLayout pageTitle="Métricas">
      <div className="px-4 py-3 md:container md:py-6 space-y-5 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold hidden md:block">Métricas</h1>
        {/* Cabeçalho: filtro global + auditoria */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              Período global
            </span>
            <PeriodFilter
              value={periodKey}
              onChange={setPeriodKey}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
            <span className="text-[11px] text-muted-foreground">
              {format(period.from, "dd/MM/yy", { locale: ptBR })} – {format(period.to, "dd/MM/yy", { locale: ptBR })}
            </span>
          </div>
          <Button size="sm" variant="outline" asChild className="h-8 text-xs gap-1.5">
            <Link to="/admin/metricas/auditoria-atribuicao">
              <ShieldCheck className="h-3.5 w-3.5" />
              Auditoria de Atribuição
            </Link>
          </Button>
        </div>

        {/* Bloco A — KPIs */}
        {kpisQuery.isLoading || !kpisQuery.data ? (
          <KPIsSkeleton />
        ) : (
          <MetricsKPIs
            data={kpisQuery.data}
            headerExtra={
              <BlockPeriodControl
                state={kpisState}
                onChange={setKpisState}
                globalPeriodKey={periodKey}
                globalCustomRange={customRange}
              />
            }
          />
        )}

        {/* Bloco B — Tabela por dimensão */}
        {attrQuery.isLoading || !attrQuery.data ? (
          <TableCardSkeleton titleWidth="w-56" rows={6} cols={8} />
        ) : (
          <AttributionTable
            data={attrQuery.data}
            dimension={dimension}
            onDimensionChange={setDimension}
            headerExtra={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => exportToCSV(attrQuery.data?.rows || [], `atribuicao-${dimension}`)}
                  title="Exportar CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <BlockPeriodControl
                  state={attrState}
                  onChange={setAttrState}
                  globalPeriodKey={periodKey}
                  globalCustomRange={customRange}
                />
              </div>
            }
          />
        )}

        {/* Bloco C — Compradores LTV */}
        {buyersQuery.isLoading || !buyersQuery.data ? (
          <TableCardSkeleton titleWidth="w-64" rows={6} cols={8} />
        ) : (
          <BuyersLTVTable
            data={buyersQuery.data}
            headerExtra={
              <BlockPeriodControl
                state={buyersState}
                onChange={setBuyersState}
                globalPeriodKey={periodKey}
                globalCustomRange={customRange}
              />
            }
          />
        )}

        {/* Bloco C2 — First vs Last Click */}
        {clickQuery.isLoading || !clickQuery.data ? (
          <FirstVsLastSkeleton />
        ) : (
          <FirstVsLastClickTable
            data={clickQuery.data}
            headerExtra={
              <BlockPeriodControl
                state={clickState}
                onChange={setClickState}
                globalPeriodKey={periodKey}
                globalCustomRange={customRange}
              />
            }
          />
        )}

        {/* Bloco D — Funil + Gerador */}
        <div className="grid md:grid-cols-2 gap-4">
          {funnelQuery.isLoading || !funnelData ? (
            <FunnelSkeleton />
          ) : (
            <Card>
              <CardHeader className="pb-3 flex-row items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">📈 Funil do período</CardTitle>
                <BlockPeriodControl
                  state={funnelState}
                  onChange={setFunnelState}
                  globalPeriodKey={periodKey}
                  globalCustomRange={customRange}
                />
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono leading-relaxed text-foreground bg-muted/40 rounded-lg p-3 overflow-x-auto">
{`Leads       ${funnel?.leads ?? ""} ${fmtNum(funnelData.totalLeads)}
Cadastros   ${funnel?.cadastros ?? ""} ${fmtNum(funnelData.totalCadastros)} (${fmtPct(funnelData.convLeadCadastro)})
Compradores ${funnel?.compradores ?? ""} ${fmtNum(funnelData.totalCompradores)} (${fmtPct(funnelData.convCadCompra)})`}
                </pre>
              </CardContent>
            </Card>
          )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">🔗 Gerador de links UTM</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground">Destino</label>
                    <Input
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      placeholder={`https://${BASE_URL}`}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-muted-foreground">Source *</label>
                      <Select value={utmSource} onValueChange={setUtmSource}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["instagram", "facebook", "google", "tiktok", "whatsapp", "bio", "grupo", "meta"].map((u) => (
                            <SelectItem key={u} value={u} className="text-xs">
                              {u}
                            </SelectItem>
                          ))}
                          {(kpisQuery.data?.uniqueUtmSources || [])
                            .filter((u) => !["instagram", "facebook", "google", "tiktok", "whatsapp", "bio", "grupo", "meta"].includes(u))
                            .map((u) => (
                              <SelectItem key={u} value={u} className="text-xs">
                                {u}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">Medium</label>
                      <Input
                        value={utmMedium}
                        onChange={(e) => setUtmMedium(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        placeholder="cpc, organic"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">Campaign</label>
                      <Input
                        value={utmCampaign}
                        onChange={(e) => setUtmCampaign(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        placeholder="mega-julho"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">Content</label>
                      <Input
                        value={utmContent}
                        onChange={(e) => setUtmContent(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        placeholder="banner-azul"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] text-muted-foreground">Term</label>
                      <Input
                        value={utmTerm}
                        onChange={(e) => setUtmTerm(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        placeholder="loteria-online"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono truncate">{previewUrl}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-7 w-7"
                      onClick={() => copyToClipboard(previewUrl)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
