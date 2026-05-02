import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Inbox, Filter, X, RefreshCw, AlertTriangle, Clock, CheckCircle2, Send, FileText, Smartphone } from "lucide-react";
import { MessageStatusBadge } from "./shared/MessageStatusBadge";
import { MetricCard } from "./shared/MetricCard";
import { Field } from "./shared/Field";
import { fmtDate } from "./shared/format-date";
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";
import { cn } from "@/lib/utils";

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
  const [onlyTemplates, setOnlyTemplates] = useState(false);
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
      supabase.from("whatsapp_instances").select("id, name"),
    ]);

    const tplMap = new Map<string, string>(
      (templatesRes.data || []).map((t) => [t.id, t.name])
    );
    const instMap = new Map<string, string>(
      (instancesRes.data || []).map((i) => [i.id, i.name])
    );

    const data: QueueRow[] = (queueRes.data || []).map((q) => ({
      ...q,
      variables: (q.variables as Record<string, unknown>) ?? null,
      template_name: q.template_id ? tplMap.get(q.template_id) || "—" : "—",
      instance_name: q.instance_id ? instMap.get(q.instance_id) || "—" : "—",
    }));
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const baseRows = useMemo(
    () => (onlyTemplates ? rows.filter((r) => r.template_id) : rows),
    [rows, onlyTemplates]
  );

  const filtered = useMemo(
    () =>
      baseRows.filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (searchPhone && !r.recipient_phone.includes(searchPhone.trim())) return false;
        return true;
      }),
    [baseRows, statusFilter, searchPhone]
  );

  const counts = useMemo(
    () => ({
      pending: baseRows.filter((r) => r.status === "pending").length,
      sending: baseRows.filter((r) => r.status === "sending").length,
      sent: baseRows.filter((r) => r.status === "sent").length,
      failed: baseRows.filter((r) => r.status === "failed").length,
    }),
    [baseRows]
  );

  const hasActiveFilters = statusFilter !== "all" || searchPhone.length > 0;

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchPhone("");
  };

  return (
    <UnifiedLayout>
      <UnifiedToolbar
        left={
          <>
            <Button
              variant={onlyTemplates ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setOnlyTemplates(!onlyTemplates)}
            >
              <FileText className="h-3.5 w-3.5" /> Apenas templates
            </Button>
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" /> Filtros
              {hasActiveFilters && <span>({filtered.length})</span>}
            </Button>
          </>
        }
        right={
          <ActionButton
            label="Atualizar"
            icon={RefreshCw}
            onClick={fetchData}
          />
        }
      />

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 mb-4 rounded-xl border border-border bg-muted/30">
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

      <UnifiedList
        isLoading={loading}
        count={filtered.length}
        total={rows.length}
        empty={{
          icon: Inbox,
          message: "Nenhuma mensagem encontrada",
          submessage: "Ajuste os filtros ou aguarde novos disparos"
        }}
      >
        <div className="space-y-2">
          {filtered.slice(0, 100).map((r) => (
            <UnifiedCardItem key={r.id} onClick={() => setSelected(r)} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{r.recipient_phone}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <FileText className="h-2.5 w-2.5" /> {r.template_name}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Smartphone className="h-2.5 w-2.5" /> {r.instance_name}
                    </span>
                  </div>
                </div>
                <MessageStatusBadge status={r.status} />
              </div>

              {r.status === "failed" && r.error_message && (
                <div className="flex items-start gap-1.5 text-[10px] text-red-600 bg-red-500/5 border border-red-500/20 rounded-md px-2 py-1.5">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <p className="line-clamp-1">{r.error_message}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
                <span>C: {fmtDate(r.created_at)}</span>
                {r.sent_at && <span>E: {fmtDate(r.sent_at)}</span>}
                {!r.sent_at && r.scheduled_at && <span>A: {fmtDate(r.scheduled_at)}</span>}
              </div>
            </UnifiedCardItem>
          ))}
        </div>
      </UnifiedList>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da mensagem</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium tabular-nums">{selected.recipient_phone}</span>
                <MessageStatusBadge status={selected.status} />
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
                  <pre className="text-[11px] bg-red-500/5 border border-red-500/20 rounded-md p-2 whitespace-pre-wrap break-words text-red-700">
                    {selected.error_message}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </UnifiedLayout>
  );
}
