import { useState, useMemo } from "react";
import { format, subDays, startOfDay, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, TrendingUp, Copy, Loader2, ArrowUpDown, CalendarIcon, Bell, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickFilter = "all" | "today" | "yesterday" | "7d" | "14d" | "30d" | "custom";
type SortCol = "cadastros" | "pagos" | "conversao" | "receita";
type SortDir = "asc" | "desc";

const BASE_URL = "comunidadepalpitetech.lovable.app";

function utmBadge(utm: string | null) {
  if (!utm) return <Badge variant="secondary" className="text-[10px]">❓ Direto</Badge>;
  if (utm === "bio") return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-[10px]">📱 Bio</Badge>;
  if (utm === "grupo") return <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-[10px]">👥 Grupo</Badge>;
  if (utm === "meta" || utm.startsWith("meta_")) return <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30 text-[10px]">📣 Meta</Badge>;
  return <Badge variant="secondary" className="text-[10px]">🔗 {utm}</Badge>;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("✅ Link copiado!");
}

export default function AdminMetricas() {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [sortCol, setSortCol] = useState<SortCol>("cadastros");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [destino, setDestino] = useState(`https://${BASE_URL}`);
  const [selectedUtm, setSelectedUtm] = useState("bio");
  const [customUtm, setCustomUtm] = useState("");

  const activeUtm = customUtm || selectedUtm;

  // Compute effective date range from quick filter or custom range
  const effectiveDateRange = useMemo(() => {
    const now = new Date();
    switch (quickFilter) {
      case "today": return { from: startOfDay(now), to: undefined };
      case "yesterday": { const y = subDays(now, 1); return { from: startOfDay(y), to: startOfDay(now) }; }
      case "7d": return { from: subDays(now, 7), to: undefined };
      case "14d": return { from: subDays(now, 14), to: undefined };
      case "30d": return { from: subDays(now, 30), to: undefined };
      case "custom": return dateRange;
      default: return { from: undefined, to: undefined };
    }
  }, [quickFilter, dateRange]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-metricas", quickFilter, effectiveDateRange.from?.toISOString(), effectiveDateRange.to?.toISOString()],
    queryFn: async () => {
      let query = supabase.from("perfis").select("id, email, utm_source, status_assinatura, plan_id, is_bot, created_at").eq("is_bot", false);

      if (effectiveDateRange.from) {
        query = query.gte("created_at", effectiveDateRange.from.toISOString());
      }
      if (effectiveDateRange.to) {
        query = query.lte("created_at", effectiveDateRange.to.toISOString());
      }

      const { data: perfis } = await query;
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").eq("role", "premium");
      const { data: webhookLogs } = await supabase.from("kirvano_webhook_logs_masked").select("email_masked, status, raw_payload_safe").eq("status", "approved");

      const premiumIds = new Set((roles || []).map(r => r.user_id));
      const users = perfis || [];

      // Build revenue map by email
      const revenueByEmail: Record<string, number> = {};
      for (const log of (webhookLogs || [])) {
        if (!log.email) continue;
        const payload = log.raw_payload as any;
        const valor = payload?.sale_amount || payload?.amount || payload?.valor || 0;
        const num = typeof valor === "string" ? parseFloat(valor) : valor;
        if (num > 0) {
          revenueByEmail[log.email.toLowerCase()] = (revenueByEmail[log.email.toLowerCase()] || 0) + num;
        }
      }

      // Group by utm_source
      const utmMap: Record<string, { cadastros: number; pagos: number; receita: number }> = {};
      for (const u of users) {
        const key = u.utm_source || "__null__";
        if (!utmMap[key]) utmMap[key] = { cadastros: 0, pagos: 0, receita: 0 };
        utmMap[key].cadastros++;
        const isPago = premiumIds.has(u.id) || u.status_assinatura === "ativa";
        if (isPago) utmMap[key].pagos++;
        if (u.email) {
          utmMap[key].receita += revenueByEmail[u.email.toLowerCase()] || 0;
        }
      }

      const totalCadastros = users.length;
      const totalPagos = users.filter(u => premiumIds.has(u.id) || u.status_assinatura === "ativa").length;
      const conversao = totalCadastros > 0 ? ((totalPagos / totalCadastros) * 100) : 0;

      const utmList = Object.entries(utmMap).map(([key, v]) => ({
        utm: key === "__null__" ? null : key,
        ...v,
        conversao: v.cadastros > 0 ? (v.pagos / v.cadastros) * 100 : 0,
      }));

      // Collect unique UTMs for dropdown
      const uniqueUtms = [...new Set(users.map(u => u.utm_source).filter(Boolean))] as string[];

      return { totalCadastros, totalPagos, conversao, utmList, uniqueUtms };
    },
  });

  const sortedUtmList = useMemo(() => {
    if (!data?.utmList) return [];
    return [...data.utmList].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      return sortDir === "desc" ? (vb as number) - (va as number) : (va as number) - (vb as number);
    });
  }, [data?.utmList, sortCol, sortDir]);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  const previewUrl = (() => {
    try {
      const url = new URL(destino.startsWith("http") ? destino : `https://${destino}`);
      url.searchParams.set("utm", activeUtm);
      return url.toString().replace(/^https?:\/\//, "");
    } catch { return `${destino}?utm=${activeUtm}`; }
  })();

  const fullPreviewUrl = `https://${previewUrl}`;

  const EXTERNAL_SCRIPT = `<!-- Palpite Tech — Captura UTM -->
<script>
  (function() {
    var utm = new URLSearchParams(
      window.location.search
    ).get('utm');
    if (utm) {
      localStorage.setItem(
        'utm_source', utm
      );
    }
  })();
</script>`;

  return (
    <MainLayout pageTitle="Métricas">
      <div className="px-4 py-3 md:container md:py-8 space-y-6 max-w-4xl mx-auto">

        {/* Filtros rápidos + calendário */}
        <div className="flex flex-wrap gap-2 items-center">
          {([
            { key: "all", label: "Tudo" },
            { key: "today", label: "Hoje" },
            { key: "yesterday", label: "Ontem" },
            { key: "7d", label: "7 dias" },
            { key: "14d", label: "14 dias" },
            { key: "30d", label: "30 dias" },
          ] as { key: QuickFilter; label: string }[]).map(({ key, label }) => (
            <Button key={key} size="sm" variant={quickFilter === key ? "default" : "outline"} onClick={() => { setQuickFilter(key); setDateRange({ from: undefined, to: undefined }); }}>
              {label}
            </Button>
          ))}

          {/* Date range picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant={quickFilter === "custom" ? "default" : "outline"} className="gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                {quickFilter === "custom" && dateRange.from
                  ? `${format(dateRange.from, "dd/MM", { locale: ptBR })}${dateRange.to ? ` – ${format(dateRange.to, "dd/MM", { locale: ptBR })}` : ""}`
                  : "Período"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange({ from: range?.from, to: range?.to });
                  setQuickFilter("custom");
                }}
                numberOfMonths={1}
                locale={ptBR}
                disabled={(date) => date > new Date()}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* SEÇÃO 1: Cards de resumo */}
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold">{data.totalCadastros}</p>
                  <p className="text-[10px] text-muted-foreground">👥 Cadastros</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{data.totalPagos}</p>
                  <p className="text-[10px] text-muted-foreground">💰 Pagos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{data.conversao.toFixed(1)}%</p>
                  <p className="text-[10px] text-muted-foreground">📈 Conversão</p>
                </CardContent>
              </Card>
            </div>

            {/* SEÇÃO 2: Tabela UTM */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">📊 Origens (UTM)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origem</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort("cadastros")}>
                        Cadastros <ArrowUpDown className="inline h-3 w-3" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort("pagos")}>
                        Pagos <ArrowUpDown className="inline h-3 w-3" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort("conversao")}>
                        Conv. <ArrowUpDown className="inline h-3 w-3" />
                      </TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("receita")}>
                        Receita <ArrowUpDown className="inline h-3 w-3" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUtmList.map((row) => (
                      <TableRow key={row.utm ?? "__null__"}>
                        <TableCell>{utmBadge(row.utm)}</TableCell>
                        <TableCell className="font-medium">{row.cadastros}</TableCell>
                        <TableCell>{row.pagos}</TableCell>
                        <TableCell>{row.conversao.toFixed(1)}%</TableCell>
                        <TableCell className="text-right font-medium">
                          {row.receita > 0 ? `R$ ${row.receita.toFixed(2)}` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedUtmList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          Nenhum dado encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {/* SEÇÃO 3: Gerador de Links UTM */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">🔗 Gerador de Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Parte A */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Destino</label>
                <Input
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder={`https://${BASE_URL}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">UTM existente</label>
                  <Select value={selectedUtm} onValueChange={(v) => { setSelectedUtm(v); setCustomUtm(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bio">bio</SelectItem>
                      <SelectItem value="grupo">grupo</SelectItem>
                      <SelectItem value="meta">meta</SelectItem>
                      {(data?.uniqueUtms || []).filter(u => !["bio", "grupo", "meta"].includes(u)).map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nova UTM</label>
                  <Input
                    value={customUtm}
                    onChange={(e) => setCustomUtm(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    placeholder="ex: parceiro_joao"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-muted/50 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-xs font-mono truncate">{previewUrl}</span>
                <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7" onClick={() => copyToClipboard(fullPreviewUrl)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Parte B — Links rápidos */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Links rápidos</p>
              {[
                { label: "📋 Home + UTM", path: "" },
                { label: "📋 Planos + UTM", path: "/planos" },
                { label: "📋 Cadastro + UTM", path: "/login" },
              ].map(({ label, path }) => (
                <Button
                  key={path}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => copyToClipboard(`https://${BASE_URL}${path}?utm=${activeUtm}`)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 4: Script para páginas externas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">📝 Script para páginas externas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="bg-muted/50 rounded-lg p-3 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">{EXTERNAL_SCRIPT}</pre>
            <Button size="sm" variant="outline" className="w-full" onClick={() => copyToClipboard(EXTERNAL_SCRIPT)}>
              📋 Copiar script
            </Button>
            <p className="text-xs text-muted-foreground">
              Cole antes do <code className="bg-muted px-1 rounded">&lt;/head&gt;</code> da sua landing page.
            </p>
          </CardContent>
        </Card>

        {/* SEÇÃO 5: Meta ADS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">📣 Meta ADS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">URL de destino</p>
              <div className="bg-muted/50 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-xs font-mono truncate">{BASE_URL}?utm=meta</span>
                <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7" onClick={() => copyToClipboard(`https://${BASE_URL}?utm=meta`)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p>1. No Gerenciador de Anúncios, cole a URL acima no campo 'URL do site'</p>
              <p>2. Todos os cadastros deste anúncio aparecerão com origem 📣 Meta</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Links por formato de anúncio</p>
              {[
                { label: "Stories", utm: "meta_stories" },
                { label: "Feed", utm: "meta_feed" },
                { label: "Reels", utm: "meta_reels" },
              ].map(({ label, utm }) => (
                <div key={utm} className="bg-muted/50 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-xs">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground ml-2 font-mono">?utm={utm}</span>
                  </span>
                  <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7" onClick={() => copyToClipboard(`https://${BASE_URL}?utm=${utm}`)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 6: Push Notifications */}
        <PushStatsSection />
      </div>
    </MainLayout>
  );
}

function PushStatsSection() {
  const [isSendingTest, setIsSendingTest] = useState(false);

  const { data: pushStats, isLoading: pushLoading, refetch } = useQuery({
    queryKey: ["admin-push-stats"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("get-push-stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      return data as {
        inscritos: number;
        notificaveis: number;
        _raw_players?: number;
        _raw_messagable?: number;
        _app_name?: string;
        notificacoes: Array<{
          id: string;
          titulo: string;
          enviadas: number;
          abertas: number;
          falhas: number;
          taxa_abertura: number;
          data: string | null;
        }>;
      };
    },
    staleTime: 60_000,
  });

  function taxaColor(taxa: number) {
    if (taxa >= 30) return "text-[hsl(var(--chart-2))]";
    if (taxa >= 15) return "text-[hsl(var(--chart-4))]";
    return "text-destructive";
  }

  function formatDataRelativa(value: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    const diff = differenceInCalendarDays(startOfDay(new Date()), startOfDay(date));
    if (diff <= 0) return "hoje";
    if (diff === 1) return "ontem";
    return `${diff} dias atrás`;
  }

  function truncateTitle(title: string, max = 40) {
    if (!title) return "—";
    return title.length > max ? `${title.slice(0, max)}...` : title;
  }

  async function handleSendTestPush() {
    try {
      setIsSendingTest(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("get-push-stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { action: "send_test" },
      });

      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      toast.success("✅ Push enviado! Verifique seu dispositivo.");
      refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao enviar push de teste";
      toast.error(`❌ Erro: ${msg}`);
    } finally {
      setIsSendingTest(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">🔔 Push Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pushLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 rounded-lg border border-border bg-muted animate-pulse" />
              <div className="h-24 rounded-lg border border-border bg-muted animate-pulse" />
            </div>
            <div className="h-8 rounded-md border border-border bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 rounded-md border border-border bg-muted animate-pulse" />
              <div className="h-8 rounded-md border border-border bg-muted animate-pulse" />
              <div className="h-8 rounded-md border border-border bg-muted animate-pulse" />
            </div>
          </div>
        ) : pushStats ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Bell className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold">{pushStats.inscritos.toLocaleString("pt-BR")}</p>
                  <p className="text-[10px] text-muted-foreground">🔔 Inscritos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Smartphone className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold">{pushStats.notificaveis.toLocaleString("pt-BR")}</p>
                  <p className="text-[10px] text-muted-foreground">📲 Notificáveis</p>
                </CardContent>
              </Card>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Notificáveis = inscritos que não bloquearam as notificações
            </p>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSendTestPush}
              disabled={isSendingTest}
              className="w-full"
            >
              {isSendingTest ? "Enviando teste..." : "🔔 Enviar push de teste"}
            </Button>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Histórico de envios</p>

              {pushStats.notificacoes.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma notificação enviada ainda.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead className="text-right">Enviadas</TableHead>
                      <TableHead className="text-right">Abertas</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pushStats.notificacoes.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="max-w-[260px] truncate text-xs font-medium">{truncateTitle(n.titulo, 40)}</TableCell>
                        <TableCell className="text-right text-xs">{n.enviadas.toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-right text-xs">{n.abertas.toLocaleString("pt-BR")}</TableCell>
                        <TableCell className={cn("text-right text-xs font-semibold", taxaColor(n.taxa_abertura))}>
                          {n.taxa_abertura.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right text-[10px] text-muted-foreground">
                          {formatDataRelativa(n.data)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">Erro ao carregar dados do Push</p>
        )}
      </CardContent>
    </Card>
  );
}
