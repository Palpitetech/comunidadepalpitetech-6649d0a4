import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ScrollText, Filter, X, RefreshCw, Smartphone } from "lucide-react";
import { startOfDay } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageStatusBadge } from "./shared/MessageStatusBadge";
import { fmtDate } from "./shared/format-date";
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";
import { cn } from "@/lib/utils";

interface SendLog {
  id: string;
  queue_id: string | null;
  instance_id: string | null;
  recipient_phone: string;
  message_content: string | null;
  status: string | null;
  sent_at: string | null;
  instance_name?: string;
}

interface InstanceOption {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "sent", label: "Enviado" },
  { value: "failed", label: "Falhou" },
  { value: "sending", label: "Enviando" },
];

export function LogsTab() {
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [instances, setInstances] = useState<InstanceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [filterInstance, setFilterInstance] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [logsRes, instancesRes] = await Promise.all([
      supabase
        .from("send_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(500),
      supabase
        .from("whatsapp_instances")
        .select("id, name")
        .order("name"),
    ]);

    const instancesList: InstanceOption[] = instancesRes.data || [];
    setInstances(instancesList);

    const instanceMap = new Map(instancesList.map((i) => [i.id, i.name]));
    const rawLogs: SendLog[] = (logsRes.data || []).map((l) => ({
      ...l,
      instance_name: l.instance_id ? instanceMap.get(l.instance_id) || "—" : "—",
    }));
    setLogs(rawLogs);

    const todayStart = startOfDay(new Date()).toISOString();
    const count = rawLogs.filter((l) => l.sent_at && l.sent_at >= todayStart).length;
    setTodayCount(count);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = logs.filter((log) => {
    if (filterInstance !== "all" && log.instance_id !== filterInstance) return false;
    if (filterStatus !== "all" && log.status !== filterStatus) return false;
    if (filterDateFrom && log.sent_at && log.sent_at.slice(0, 10) < filterDateFrom) return false;
    if (filterDateTo && log.sent_at && log.sent_at.slice(0, 10) > filterDateTo) return false;
    return true;
  });

  const hasActiveFilters = filterInstance !== "all" || filterStatus !== "all" || !!filterDateFrom || !!filterDateTo;

  const clearFilters = () => {
    setFilterInstance("all");
    setFilterStatus("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  return (
    <UnifiedLayout>
      <UnifiedToolbar
        left={
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5" /> Filtros
            {hasActiveFilters && <span>({filtered.length})</span>}
          </Button>
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
          <Select value={filterInstance} onValueChange={setFilterInstance}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Instância" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as instâncias</SelectItem>
              {instances.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              className="w-[130px] h-8 text-xs"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
            <Input
              type="date"
              className="w-[130px] h-8 text-xs"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
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
        total={logs.length}
        empty={{
          icon: ScrollText,
          message: "Nenhum log encontrado",
          submessage: "Os logs aparecem após o envio de mensagens"
        }}
      >
        <div className="space-y-2">
          {filtered.slice(0, 50).map((log) => (
            <UnifiedCardItem key={log.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold tabular-nums truncate">{log.recipient_phone}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                    <Smartphone className="h-2.5 w-2.5" />
                    <span>{log.instance_name}</span>
                  </div>
                </div>
                <MessageStatusBadge status={log.status} variant="short" />
              </div>

              {log.message_content && (
                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                  "{log.message_content}"
                </p>
              )}

              <div className="flex items-center justify-end pt-1 border-t border-border/40 font-mono text-[10px] text-muted-foreground">
                <span>{fmtDate(log.sent_at, "full")}</span>
              </div>
            </UnifiedCardItem>
          ))}
        </div>
      </UnifiedList>
    </UnifiedLayout>
  );
}
