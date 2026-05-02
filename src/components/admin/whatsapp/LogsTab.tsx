import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ScrollText, Filter, X } from "lucide-react";
import { startOfDay } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageStatusBadge } from "./shared/MessageStatusBadge";
import { fmtDate } from "./shared/format-date";

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
      <div className="flex items-center justify-end gap-2">
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3.5 w-3.5" />
          Filtros
          {hasActiveFilters && <span className="tabular-nums">({filtered.length})</span>}
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
          <Select value={filterInstance} onValueChange={setFilterInstance}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Instância" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
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
            <span className="text-xs text-muted-foreground">a</span>
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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <ScrollText className="h-8 w-8 opacity-40" />
          <p className="text-sm">Nenhum log encontrado</p>
        </div>
      ) : isMobile ? (
        <div className="space-y-2">
          {filtered.slice(0, 50).map((log) => (
            <div key={log.id} className="rounded-xl border border-border bg-card p-3.5 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium tabular-nums">{log.recipient_phone}</p>
                  <p className="text-[11px] text-muted-foreground">{log.instance_name}</p>
                </div>
                <MessageStatusBadge status={log.status} variant="short" />
              </div>
              {log.message_content && (
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {log.message_content}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {fmtDate(log.sent_at, "full")}
              </p>
            </div>
          ))}
          {filtered.length > 50 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Mostrando 50 de {filtered.length} registros
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Data/hora</TableHead>
                <TableHead className="text-xs">Instância</TableHead>
                <TableHead className="text-xs">Destinatário</TableHead>
                <TableHead className="text-xs">Mensagem</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs tabular-nums whitespace-nowrap">{fmtDate(log.sent_at, "full")}</TableCell>
                  <TableCell className="text-xs">{log.instance_name}</TableCell>
                  <TableCell className="text-xs">{log.recipient_phone}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">
                    {log.message_content
                      ? log.message_content.length > 60
                        ? log.message_content.slice(0, 60) + "…"
                        : log.message_content
                      : "—"}
                  </TableCell>
                  <TableCell><MessageStatusBadge status={log.status} variant="short" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {filtered.length} de {logs.length} registro(s)
      </p>
    </div>
  );
}
