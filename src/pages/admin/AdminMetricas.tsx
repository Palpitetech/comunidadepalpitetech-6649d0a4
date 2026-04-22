import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CalendarIcon, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardPeriod, PERIOD_OPTIONS, PeriodKey } from "@/hooks/useDashboardPeriod";
import {
  useAttributionMetrics,
  AttributionDimension,
  fmtNum,
  fmtPct,
} from "@/hooks/admin/useAttributionMetrics";
import { MetricsKPIs } from "@/components/admin/metricas/MetricsKPIs";
import { AttributionTable } from "@/components/admin/metricas/AttributionTable";
import { BuyersLTVTable } from "@/components/admin/metricas/BuyersLTVTable";

const BASE_URL = "comunidadepalpitetech.lovable.app";

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Link copiado!");
}

export default function AdminMetricas() {
  const { period, periodKey, setPeriodKey, customRange, setCustomRange } = useDashboardPeriod("7d");
  const [dimension, setDimension] = useState<AttributionDimension>("utm_source");
  const { data, isLoading } = useAttributionMetrics(period, dimension);

  // Gerador
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
  const funnel = useMemo(() => {
    if (!data) return null;
    const max = Math.max(data.totalLeads, data.totalCadastros, data.totalCompradores, 1);
    const bar = (n: number) => "█".repeat(Math.max(1, Math.round((n / max) * 24)));
    return {
      leads: bar(data.totalLeads || 1),
      cadastros: bar(data.totalCadastros || 1),
      compradores: bar(data.totalCompradores || 1),
    };
  }, [data]);

  return (
    <AdminLayout pageTitle="Métricas">
      <div className="px-4 py-3 md:container md:py-6 space-y-5 max-w-6xl mx-auto">
        {/* Filtro de período */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {PERIOD_OPTIONS.filter((o) => o.key !== "custom").map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              variant={periodKey === key ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setPeriodKey(key as PeriodKey)}
            >
              {label}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant={periodKey === "custom" ? "default" : "outline"}
                className="h-8 gap-1.5 text-xs"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {periodKey === "custom" && customRange.from
                  ? `${format(customRange.from, "dd/MM", { locale: ptBR })}${
                      customRange.to ? ` – ${format(customRange.to, "dd/MM", { locale: ptBR })}` : ""
                    }`
                  : "Personalizado"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: customRange.from, to: customRange.to }}
                onSelect={(range) => {
                  setCustomRange({ from: range?.from, to: range?.to });
                  setPeriodKey("custom");
                }}
                numberOfMonths={1}
                locale={ptBR}
                disabled={(d) => d > new Date()}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <span className="text-[11px] text-muted-foreground ml-1.5">
            {format(period.from, "dd/MM/yy", { locale: ptBR })} – {format(period.to, "dd/MM/yy", { locale: ptBR })}
          </span>
        </div>

        {isLoading || !data ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Bloco A — KPIs */}
            <MetricsKPIs data={data} />

            {/* Bloco B — Tabela por dimensão */}
            <AttributionTable data={data} dimension={dimension} onDimensionChange={setDimension} />

            {/* Bloco C — Compradores LTV */}
            <BuyersLTVTable data={data} />

            {/* Bloco D — Funil + Gerador */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">📈 Funil do período</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs font-mono leading-relaxed text-foreground bg-muted/40 rounded-lg p-3 overflow-x-auto">
{`Leads       ${funnel?.leads ?? ""} ${fmtNum(data.totalLeads)}
Cadastros   ${funnel?.cadastros ?? ""} ${fmtNum(data.totalCadastros)} (${fmtPct(data.convLeadCadastro)})
Compradores ${funnel?.compradores ?? ""} ${fmtNum(data.totalCompradores)} (${fmtPct(data.convCadCompra)})`}
                  </pre>
                </CardContent>
              </Card>

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
                          {data.uniqueUtmSources
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
          </>
        )}
      </div>
    </AdminLayout>
  );
}
