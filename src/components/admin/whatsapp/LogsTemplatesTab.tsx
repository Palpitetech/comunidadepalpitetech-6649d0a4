import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, FileText, RefreshCw } from "lucide-react";
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

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Aguardando" },
  { value: "sent", label: "Enviadas" },
  { value: "failed", label: "Erro" },
];

export function LogsTemplatesTab() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<QueueRow | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [queueRes, templatesRes, instancesRes] = await Promise.all([
      supabase
        .from("message_queue")
        .select("*")
        .not("template_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(300),
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
    if (filter === "all") return true;
    if (filter === "pending") return r.status === "pending" || r.status === "sending";
    return r.status === filter;
  });

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
    <div className="space-y-3">
      {/* Filter pills + refresh */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={fetchData}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <FileText className="h-8 w-8 opacity-40" />
          <p className="text-sm">Nenhuma mensagem encontrada</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-muted/40 transition-colors"
            >
              <StatusDot status={r.status} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium tabular-nums truncate">{r.recipient_phone}</p>
                <p className="text-[11px] text-muted-foreground truncate">{r.template_name}</p>
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                {fmtDate(r.sent_at || r.created_at)}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center">
        {filtered.length} de {rows.length}
      </p>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da mensagem</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium tabular-nums">{selected.recipient_phone}</span>
                <StatusBadge status={selected.status} />
              </div>
              <Field label="Destinatário" value={selected.recipient_name || "—"} />
              <Field label="Template" value={selected.template_name || "—"} />
              <Field label="Instância" value={selected.instance_name || "—"} />
              <Field label="Criada em" value={fmtDate(selected.created_at)} />
              <Field label="Agendada para" value={fmtDate(selected.scheduled_at)} />
              <Field label="Enviada em" value={fmtDate(selected.sent_at)} />
              <Field label="Tentativas" value={String(selected.retry_count ?? 0)} />
              {selected.error_message && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Erro</p>
                  <pre className="text-[11px] bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-2 whitespace-pre-wrap break-words">
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

function StatusDot({ status }: { status: string | null }) {
  const color =
    status === "sent"
      ? "bg-green-500"
      : status === "failed"
      ? "bg-red-500"
      : status === "sending"
      ? "bg-blue-500"
      : "bg-muted-foreground/40";
  return <span className={`h-2 w-2 rounded-full shrink-0 ${color}`} />;
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
