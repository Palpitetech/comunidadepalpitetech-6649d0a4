import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Play, RotateCcw, Send, Filter, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageStatusBadge } from "./shared/MessageStatusBadge";
import { fmtDate } from "./shared/format-date";

interface QueueItem {
  id: string;
  instance_id: string | null;
  template_id: string | null;
  recipient_phone: string;
  recipient_name: string | null;
  variables: Record<string, string> | null;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

interface TemplateOption { id: string; name: string }
interface InstanceOption { id: string; name: string }

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendente" },
  { value: "sending", label: "Enviando" },
  { value: "sent", label: "Enviado" },
  { value: "failed", label: "Falhou" },
];

export function FilaTab() {
  const isMobile = useIsMobile();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [instances, setInstances] = useState<InstanceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [queueRes, templatesRes, instancesRes] = await Promise.all([
      supabase
        .from("message_queue")
        .select("*")
        .order("scheduled_at", { ascending: false })
        .limit(200),
      supabase.from("message_templates").select("id, name").order("name"),
      supabase.from("whatsapp_instances").select("id, name").order("name"),
    ]);

    if (queueRes.error) console.error(queueRes.error);
    setQueue((queueRes.data as unknown as QueueItem[]) || []);
    setTemplates(templatesRes.data || []);
    setInstances(instancesRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRetry = async (id: string) => {
    const { error } = await supabase
      .from("message_queue")
      .update({ status: "pending", error_message: null })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao retentar");
    } else {
      toast.success("Reenviado para a fila");
      fetchAll();
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-queue", {
        method: "POST",
      });
      if (error) throw error;
      const processed = data?.processed ?? 0;
      toast.success(`Fila processada: ${processed} mensagem(ns) enviada(s)`);
      fetchAll();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar fila");
    } finally {
      setProcessing(false);
    }
  };

  const getTemplateName = (id: string | null) => templates.find((t) => t.id === id)?.name || "—";
  const getInstanceName = (id: string | null) => instances.find((i) => i.id === id)?.name || "—";

  const filtered = queue.filter((item) => {
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (filterDate) {
      const itemDate = item.scheduled_at?.slice(0, 10) || "";
      if (itemDate !== filterDate) return false;
    }
    return true;
  });

  const hasActiveFilters = filterStatus !== "all" || !!filterDate;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleProcess} disabled={processing}>
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          <span className="hidden sm:inline">Processar Fila</span>
          <span className="sm:hidden">Processar</span>
        </Button>
        <div className="flex-1" />
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3.5 w-3.5" />
          {hasActiveFilters && <span className="tabular-nums">({filtered.length})</span>}
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            className="w-[140px] h-8 text-xs"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => { setFilterStatus("all"); setFilterDate(""); }}>
              <X className="h-3 w-3" /> Limpar
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Send className="h-8 w-8 opacity-40" />
          <p className="text-sm">Nenhum envio na fila</p>
          <p className="text-[11px] opacity-70">Para criar novos envios use a aba Disparo Manual</p>
        </div>
      ) : isMobile ? (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.recipient_name || "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{item.recipient_phone}</p>
                </div>
                <MessageStatusBadge status={item.status} variant="short" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>📄 {getTemplateName(item.template_id)}</span>
                <span className="tabular-nums">{fmtDate(item.scheduled_at, "full")}</span>
              </div>
              {item.instance_id && (
                <p className="text-[11px] text-muted-foreground">📱 {getInstanceName(item.instance_id)}</p>
              )}
              {item.sent_at && (
                <p className="text-[11px] text-muted-foreground">✅ Enviado: {fmtDate(item.sent_at, "full")}</p>
              )}
              {item.error_message && (
                <p className="text-[11px] text-destructive line-clamp-2">⚠️ {item.error_message}</p>
              )}
              {item.status === "failed" && (
                <Button variant="outline" size="sm" className="w-full h-8 gap-1.5 text-xs" onClick={() => handleRetry(item.id)}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retentar
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Destinatário</TableHead>
                <TableHead className="text-xs">Template</TableHead>
                <TableHead className="text-xs">Instância</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Agendado</TableHead>
                <TableHead className="text-xs">Enviado</TableHead>
                <TableHead className="text-xs w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs">
                    <div className="font-medium">{item.recipient_name || "—"}</div>
                    <div className="text-muted-foreground">{item.recipient_phone}</div>
                  </TableCell>
                  <TableCell className="text-xs">{getTemplateName(item.template_id)}</TableCell>
                  <TableCell className="text-xs">{getInstanceName(item.instance_id)}</TableCell>
                  <TableCell><MessageStatusBadge status={item.status} variant="short" /></TableCell>
                  <TableCell className="text-xs tabular-nums">{fmtDate(item.scheduled_at, "full")}</TableCell>
                  <TableCell className="text-xs tabular-nums">{fmtDate(item.sent_at, "full")}</TableCell>
                  <TableCell>
                    {item.status === "failed" && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleRetry(item.id)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retentar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {filtered.length} de {queue.length} registro(s)
      </p>
    </div>
  );
}
