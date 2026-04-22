import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Inbox, Filter, X, RefreshCw, AlertTriangle, Clock, CheckCircle2, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QueueRow {
  id: string;
  recipient_phone: string;
  recipient_name: string | null;
  template_id: string | null;
  instance_id: string | null;
  status: string | null;
  error_message: string | null;
  retry_count: number | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string | null;
  variables: Record<string, unknown> | null;
  template_name?: string;
  instance_name?: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Aguardando" },
  { value: "sending", label: "Enviando" },
  { value: "sent", label: "Enviado" },
  { value: "failed", label: "Com erro" },
];

export function MensagensTab() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchPhone, setSearchPhone] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<QueueRow | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [queueRes, templatesRes, instancesRes] = await Promise.all([
      supabase
        .from("message_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("message_templates").select("id, name"),
      supabase.from("whatsapp_instances" as never).select("id, name"),
    ]);

    const tplMap = new Map<string, string>(
      ((templatesRes.data as Array<{ id: string; name: string }>) || []).map((t) => [t.id, t.name])
    );
    const instMap = new Map<string, string>(
      ((instancesRes.data as unknown as Array<{ id: string; name: string }>) || []).map((i) => [
        i.id,
        i.name,
      ])
    );

    const data: QueueRow[] = ((queueRes.data as unknown as QueueRow[]) || []).map((q) => ({
      ...q,
      template_name: q.template_id ? tplMap.get(q.template_id) || "—" : "—",
      instance_name: q.instance_id ? instMap.get(q.instance_id) || "—" : "—",
    }));
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchPhone && !r.recipient_phone.includes(searchPhone.trim())) return false;
    return true;
  });

  const counts = {
    pending: rows.filter((r) => r.status === "pending").length,
    sending: rows.filter((r) => r.status === "sending").length,
    sent: rows.filter((r) => r.status === "sent").length,
    failed: rows.filter((r) => r.status === "failed").length,
  };

  const hasActiveFilters = statusFilter !== "all" || searchPhone.length > 0;

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchPhone("");
  };

  const fmtDate = (d: string | null) =>
    d ? format(new Date(d), "dd/MM HH:mm", { locale: ptBR }) : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <CounterCard
          label="Aguardando"
          value={counts.pending}
          icon={Clock}
          tone="muted"
          active={statusFilter === "pending"}
          onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
        />
        <CounterCard
          label="Enviando"
          value={counts.sending}
          icon={Send}
          tone="info"
          active={statusFilter === "sending"}
          onClick={() => setStatusFilter(statusFilter === "sending" ? "all" : "sending")}
        />
        <CounterCard
          label="Enviadas"
          value={counts.sent}
          icon={CheckCircle2}
          tone="success"
          active={statusFilter === "sent"}
          onClick={() => setStatusFilter(statusFilter === "sent" ? "all" : "sent")}
        />
        <CounterCard
          label="Com erro"
          value={counts.failed}
          icon={AlertTriangle}
          tone="error"
          active={statusFilter === "failed"}
          onClick={() => setStatusFilter(statusFilter === "failed" ? "all" : "failed")}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3.5 w-3.5" /> Filtros
          {hasActiveFilters && <span className="tabular-nums">({filtered.length})</span>}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={fetchData}>
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar telefone..."
            className="w-[200px] h-8 text-xs"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={clearFilters}>
              <X className="h-3 w-3" /> Limpar
            </Button>
          )}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Inbox className="h-8 w-8 opacity-40" />
          <p className="text-sm">Nenhuma mensagem encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 100).map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="w-full text-left rounded-xl border border-border bg-card p-3.5 space-y-1.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium tabular-nums">{r.recipient_phone}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {r.template_name} · {r.instance_name}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              {r.status === "failed" && r.error_message && (
                <div className="flex items-start gap-1.5 text-[11px] text-red-600 bg-red-500/5 border border-red-500/20 rounded-md px-2 py-1.5">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  <p className="line-clamp-2 break-words">{r.error_message}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                <span>Criada: {fmtDate(r.created_at)}</span>
                {r.sent_at && <span>Enviada: {fmtDate(r.sent_at)}</span>}
                {!r.sent_at && r.scheduled_at && <span>Agendada: {fmtDate(r.scheduled_at)}</span>}
              </div>
              {(r.retry_count ?? 0) > 0 && (
                <p className="text-[10px] text-amber-700">Tentativas: {r.retry_count}</p>
              )}
            </button>
          ))}
          {filtered.length > 100 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Mostrando 100 de {filtered.length} registros
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {filtered.length} de {rows.length} registro(s) carregados
      </p>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da mensagem</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Field label="Destinatário" value={`${selected.recipient_phone}${selected.recipient_name ? ` (${selected.recipient_name})` : ""}`} />
              <Field label="Status" value={selected.status || "—"} />
              <Field label="Template" value={selected.template_name || "—"} />
              <Field label="Instância" value={selected.instance_name || "—"} />
              <Field label="Criada em" value={fmtDate(selected.created_at)} />
              <Field label="Agendada para" value={fmtDate(selected.scheduled_at)} />
              <Field label="Enviada em" value={fmtDate(selected.sent_at)} />
              <Field label="Tentativas" value={String(selected.retry_count ?? 0)} />
              {selected.error_message && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Erro</p>
                  <pre className="text-[11px] bg-red-500/5 border border-red-500/20 rounded-md p-2 whitespace-pre-wrap break-words text-red-700">
                    {selected.error_message}
                  </pre>
                </div>
              )}
              {selected.variables && Object.keys(selected.variables).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Variáveis</p>
                  <pre className="text-[11px] bg-muted/40 rounded-md p-2 whitespace-pre-wrap break-words">
                    {JSON.stringify(selected.variables, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-right break-all">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case "sent":
      return <Badge className="bg-green-500/15 text-green-700 border-green-500/30 text-[11px]">Enviada</Badge>;
    case "failed":
      return <Badge className="bg-red-500/15 text-red-700 border-red-500/30 text-[11px]">Erro</Badge>;
    case "sending":
      return <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 text-[11px]">Enviando</Badge>;
    case "pending":
      return <Badge variant="secondary" className="text-[11px]">Aguardando</Badge>;
    default:
      return <Badge variant="secondary" className="text-[11px]">{status || "—"}</Badge>;
  }
}

type Tone = "success" | "warning" | "error" | "muted" | "info";

function counterTone(tone: Tone, active: boolean): string {
  const baseRing = active ? "ring-2 ring-offset-1 ring-offset-background " : "";
  switch (tone) {
    case "success":
      return baseRing + (active ? "ring-green-500/50 " : "") + "bg-green-500/10 border-green-500/30 text-green-700";
    case "error":
      return baseRing + (active ? "ring-red-500/50 " : "") + "bg-red-500/10 border-red-500/30 text-red-700";
    case "info":
      return baseRing + (active ? "ring-blue-500/50 " : "") + "bg-blue-500/10 border-blue-500/30 text-blue-700";
    case "warning":
      return baseRing + (active ? "ring-amber-500/50 " : "") + "bg-amber-500/10 border-amber-500/30 text-amber-700";
    default:
      return baseRing + (active ? "ring-foreground/30 " : "") + "bg-muted/40 border-border text-muted-foreground";
  }
}

function CounterCard({
  label,
  value,
  icon: Icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-all ${counterTone(tone, active)}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold tabular-nums">{value}</p>
    </button>
  );
}
