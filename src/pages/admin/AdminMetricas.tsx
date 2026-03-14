import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, TrendingUp, Copy, Loader2, ArrowUpDown } from "lucide-react";

type Periodo = "all" | "30d" | "7d";
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
  const [periodo, setPeriodo] = useState<Periodo>("all");
  const [sortCol, setSortCol] = useState<SortCol>("cadastros");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [destino, setDestino] = useState(`https://${BASE_URL}`);
  const [selectedUtm, setSelectedUtm] = useState("bio");
  const [customUtm, setCustomUtm] = useState("");

  const activeUtm = customUtm || selectedUtm;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-metricas", periodo],
    queryFn: async () => {
      let query = supabase.from("perfis").select("id, email, utm_source, status_assinatura, plan_id, is_bot, created_at").eq("is_bot", false);

      if (periodo === "30d") {
        const d = new Date(); d.setDate(d.getDate() - 30);
        query = query.gte("created_at", d.toISOString());
      } else if (periodo === "7d") {
        const d = new Date(); d.setDate(d.getDate() - 7);
        query = query.gte("created_at", d.toISOString());
      }

      const { data: perfis } = await query;
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").eq("role", "premium");
      const { data: webhookLogs } = await supabase.from("kirvano_webhook_logs").select("email, status, raw_payload").eq("status", "approved");

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

        {/* Filtro de período */}
        <div className="flex gap-2">
          {(["all", "30d", "7d"] as Periodo[]).map(p => (
            <Button key={p} size="sm" variant={periodo === p ? "default" : "outline"} onClick={() => setPeriodo(p)}>
              {p === "all" ? "Tudo" : p === "30d" ? "30 dias" : "7 dias"}
            </Button>
          ))}
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
      </div>
    </MainLayout>
  );
}
