import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Loader2, RefreshCw, ShieldAlert, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LogRow = {
  id: string;
  user_id: string | null;
  source: string;
  attribution_before: Record<string, unknown> | null;
  attribution_after: Record<string, unknown> | null;
  new_attr_input: Record<string, unknown> | null;
  fields_added: string[];
  fields_skipped: string[];
  marked_purchase: boolean;
  user_existed: boolean;
  created_at: string;
};

type ProfileMini = { id: string; nome: string | null; email: string | null };

const SOURCE_OPTIONS = [
  { value: "all", label: "Todas as origens" },
  { value: "signup_otp", label: "Cadastro OTP" },
  { value: "lead_webhook", label: "Lead Webhook" },
  { value: "lead_promote", label: "Lead → Promoção" },
  { value: "kirvano:sale_approved", label: "Kirvano · Venda aprovada" },
  { value: "kirvano:intermediate", label: "Kirvano · PIX/Checkout" },
  { value: "unknown", label: "Origem desconhecida" },
];

function StatBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant={ok ? "default" : "destructive"} className="gap-1">
      {ok ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="text-[11px] leading-snug whitespace-pre-wrap break-all bg-muted/40 rounded-md p-2 max-h-48 overflow-auto">
      {JSON.stringify(data ?? {}, null, 2)}
    </pre>
  );
}

function LogDetail({ row, profile }: { row: LogRow; profile?: ProfileMini }) {
  const overwriteAttempt = row.fields_skipped.length > 0;
  return (
    <div className="grid gap-3 p-3 bg-muted/20 rounded-md">
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">Origem: {row.source}</Badge>
        <Badge variant={row.user_existed ? "default" : "destructive"}>
          {row.user_existed ? "Perfil encontrado" : "Perfil ausente"}
        </Badge>
        {row.marked_purchase && <Badge variant="secondary">Marcou 1ª compra</Badge>}
        <StatBadge
          ok={!overwriteAttempt || row.fields_skipped.every((f) => !row.fields_added.includes(f))}
          label={overwriteAttempt ? "First-touch respeitado (skip)" : "Sem conflitos"}
        />
      </div>

      {profile && (
        <div className="text-xs text-muted-foreground">
          Perfil: <span className="font-medium text-foreground">{profile.nome || "(sem nome)"}</span>{" "}
          · {profile.email || "(sem email)"} ·{" "}
          <Link to={`/admin/usuarios/${profile.id}`} className="text-primary underline">
            ver
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <div className="text-xs font-semibold mb-1">Input recebido</div>
          <JsonBlock data={row.new_attr_input} />
        </div>
        <div>
          <div className="text-xs font-semibold mb-1">Antes (perfis.attribution)</div>
          <JsonBlock data={row.attribution_before} />
        </div>
        <div>
          <div className="text-xs font-semibold mb-1">Depois</div>
          <JsonBlock data={row.attribution_after} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-semibold mb-1 text-primary">
            ✓ Campos preenchidos ({row.fields_added.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {row.fields_added.length === 0 && (
              <span className="text-xs text-muted-foreground">Nenhum campo novo</span>
            )}
            {row.fields_added.map((f) => (
              <Badge key={f} variant="default" className="text-[10px]">
                {f}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold mb-1 text-muted-foreground">
            ⊘ Campos ignorados — first-touch ({row.fields_skipped.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {row.fields_skipped.length === 0 && (
              <span className="text-xs text-muted-foreground">Nenhum conflito</span>
            )}
            {row.fields_skipped.map((f) => (
              <Badge key={f} variant="secondary" className="text-[10px]">
                {f}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAtribuicaoAuditoria() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [profiles, setProfiles] = useState<Record<string, ProfileMini>>({});

  const fetchLogs = async () => {
    setLoading(true);
    let q = supabase
      .from("attribution_merge_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (sourceFilter !== "all") {
      if (sourceFilter === "kirvano:intermediate") {
        q = q.like("source", "kirvano:%").not("source", "eq", "kirvano:sale_approved");
      } else {
        q = q.eq("source", sourceFilter);
      }
    }

    const { data, error } = await q;
    if (error) {
      toast.error("Erro ao carregar logs: " + error.message);
      setLoading(false);
      return;
    }
    const rows = (data || []) as unknown as LogRow[];
    setLogs(rows);

    // Carrega perfis envolvidos
    const ids = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];
    if (ids.length > 0) {
      const { data: perfis } = await supabase
        .from("perfis")
        .select("id, nome, email")
        .in("id", ids);
      const map: Record<string, ProfileMini> = {};
      (perfis || []).forEach((p: any) => {
        map[p.id] = p;
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const s = search.toLowerCase();
    return logs.filter((r) => {
      const p = r.user_id ? profiles[r.user_id] : undefined;
      return (
        r.source.toLowerCase().includes(s) ||
        r.user_id?.toLowerCase().includes(s) ||
        p?.email?.toLowerCase().includes(s) ||
        p?.nome?.toLowerCase().includes(s) ||
        r.fields_added.some((f) => f.toLowerCase().includes(s)) ||
        r.fields_skipped.some((f) => f.toLowerCase().includes(s))
      );
    });
  }, [logs, search, profiles]);

  const stats = useMemo(() => {
    const total = logs.length;
    const withSkips = logs.filter((r) => r.fields_skipped.length > 0).length;
    const orphan = logs.filter((r) => !r.user_existed).length;
    const purchases = logs.filter((r) => r.marked_purchase).length;
    const totalAdded = logs.reduce((s, r) => s + r.fields_added.length, 0);
    const totalSkipped = logs.reduce((s, r) => s + r.fields_skipped.length, 0);
    return { total, withSkips, orphan, purchases, totalAdded, totalSkipped };
  }, [logs]);

  return (
    <AdminLayout pageTitle="Auditoria de Atribuição">
      <div className="px-4 py-3 md:container md:py-6 space-y-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/metricas">
              <ArrowLeft className="h-4 w-4 mr-1" /> Métricas
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} /> Recarregar
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Total chamadas</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Campos preenchidos</div>
              <div className="text-2xl font-bold text-primary">{stats.totalAdded}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Skips first-touch</div>
              <div className="text-2xl font-bold text-muted-foreground">{stats.totalSkipped}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Logs c/ skip</div>
              <div className="text-2xl font-bold">{stats.withSkips}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Marcou compra</div>
              <div className="text-2xl font-bold">{stats.purchases}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Perfil ausente</div>
              <div className={cn("text-2xl font-bold", stats.orphan > 0 ? "text-destructive" : "")}>
                {stats.orphan}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Logs do merge_user_attribution</CardTitle>
            <p className="text-xs text-muted-foreground">
              Cada chamada registra antes/depois, quais campos foram preenchidos e quais foram ignorados
              (first-touch). Skips são esperados — significa que a atribuição original foi preservada.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[220px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Buscar por email, nome, user_id, campo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 max-w-sm"
              />
              <span className="text-xs text-muted-foreground ml-auto">
                {filtered.length} de {logs.length} registros
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Nenhum log encontrado. Os logs começam a ser gerados após o próximo cadastro,
                lead ou venda Kirvano.
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead className="w-40">Data</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead className="text-center">Preenchidos</TableHead>
                      <TableHead className="text-center">Ignorados</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => {
                      const isOpen = !!expanded[row.id];
                      const profile = row.user_id ? profiles[row.user_id] : undefined;
                      return (
                        <>
                          <TableRow
                            key={row.id}
                            className="cursor-pointer"
                            onClick={() => setExpanded((s) => ({ ...s, [row.id]: !isOpen }))}
                          >
                            <TableCell className="py-2">
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell className="py-2 text-xs whitespace-nowrap">
                              {format(new Date(row.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="text-[10px]">
                                {row.source}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-xs">
                              {profile ? (
                                <span>
                                  <span className="font-medium">{profile.nome || "—"}</span>
                                  <span className="text-muted-foreground"> · {profile.email}</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">
                                  {row.user_id ? `${row.user_id.slice(0, 8)}…` : "(sem user_id)"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="py-2 text-center">
                              <Badge
                                variant={row.fields_added.length > 0 ? "default" : "outline"}
                                className="text-[10px]"
                              >
                                {row.fields_added.length}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-center">
                              <Badge
                                variant={row.fields_skipped.length > 0 ? "secondary" : "outline"}
                                className="text-[10px]"
                              >
                                {row.fields_skipped.length}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2">
                              {!row.user_existed ? (
                                <StatBadge ok={false} label="Sem perfil" />
                              ) : row.marked_purchase ? (
                                <StatBadge ok label="1ª compra" />
                              ) : (
                                <StatBadge ok label="OK" />
                              )}
                            </TableCell>
                          </TableRow>
                          {isOpen && (
                            <TableRow key={row.id + "_detail"}>
                              <TableCell colSpan={7} className="p-3">
                                <LogDetail row={row} profile={profile} />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
