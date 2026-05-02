import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Play, RotateCcw, Send, Filter, X, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageStatusBadge } from "./shared/MessageStatusBadge";
import { fmtDate } from "./shared/format-date";
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";
import { cn } from "@/lib/utils";

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

  return (
    <UnifiedLayout>
      <UnifiedToolbar
        left={
          <>
            <ActionButton
              label="Processar Fila"
              icon={Play}
              onClick={handleProcess}
              loading={processing}
              variant="default"
            />
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" />
              {hasActiveFilters && <span>({filtered.length})</span>}
            </Button>
          </>
        }
        right={
          <ActionButton
            label="Atualizar"
            icon={RefreshCw}
            onClick={fetchAll}
          />
        }
      />

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 mb-4 rounded-xl border border-border bg-muted/30">
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

      <UnifiedList
        isLoading={loading}
        count={filtered.length}
        total={queue.length}
        empty={{
          icon: Send,
          message: "Nenhum envio na fila",
          submessage: "Crie novos envios através do Disparo Manual"
        }}
      >
        <div className="space-y-2">
          {filtered.map((item) => (
            <UnifiedCardItem key={item.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{item.recipient_name || "—"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{item.recipient_phone}</p>
                </div>
                <MessageStatusBadge status={item.status} variant="short" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span className="truncate">{getTemplateName(item.template_id)}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <RefreshCw className="h-3 w-3" />
                  <span>{fmtDate(item.scheduled_at, "full")}</span>
                </div>
              </div>

              {item.status === "failed" && (
                <div className="flex flex-col gap-2 pt-1 border-t border-border/50">
                  <p className="text-[10px] text-destructive line-clamp-1">⚠️ {item.error_message}</p>
                  <Button variant="outline" size="sm" className="w-full h-7 text-[10px] gap-1.5" onClick={() => handleRetry(item.id)}>
                    <RotateCcw className="h-3 w-3" /> Retentar
                  </Button>
                </div>
              )}
            </UnifiedCardItem>
          ))}
        </div>
      </UnifiedList>
    </UnifiedLayout>
  );
}
