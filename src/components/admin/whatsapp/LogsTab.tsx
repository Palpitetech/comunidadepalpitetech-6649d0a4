import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, ScrollText, Filter, X, RefreshCw, Smartphone, 
  Phone, Hash, Info, Calendar, CheckCircle2, AlertCircle, FileText
} from "lucide-react";
import { startOfDay } from "date-fns";
import { MessageStatusBadge } from "./shared/MessageStatusBadge";
import { fmtDate } from "./shared/format-date";
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";
import { AdminListContainer, AdminListItem } from "../AdminListComponents";
import { MobileInfoRow } from "./shared/MobileInfoRow";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [instances, setInstances] = useState<InstanceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SendLog | null>(null);
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
        {/* Desktop View */}
        <div className="hidden md:grid gap-3 lg:grid-cols-2">
          {filtered.slice(0, 100).map((log) => (
            <UnifiedCardItem key={log.id} onClick={() => setSelectedLog(log)} className="space-y-3">
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

        {/* Mobile View - Eventos Style */}
        <div className="md:hidden border-t border-border/40">
          <AdminListContainer loading={loading && filtered.length === 0}>
            {filtered.slice(0, 100).map((log) => (
              <AdminListItem
                key={log.id}
                onClick={() => setSelectedLog(log)}
                title={log.recipient_phone}
                badge={{
                  text: log.status === "sent" ? "Enviado" : log.status === "failed" ? "Falhou" : log.status === "sending" ? "Enviando" : "N/A",
                  color: log.status === "sent" ? "bg-green-500/10 text-green-700 border-green-200/50" : 
                         log.status === "failed" ? "bg-red-500/10 text-red-700 border-red-200/50" :
                         "bg-yellow-500/10 text-yellow-700 border-yellow-200/50",
                  icon: log.status === "sent" ? CheckCircle2 : log.status === "failed" ? AlertCircle : RefreshCw
                }}
                subtitle={`${log.instance_name} • ${log.message_content ? log.message_content.slice(0, 40) : "Sem conteúdo"}`}
                timestamp={log.sent_at ? format(new Date(log.sent_at), "HH:mm", { locale: ptBR }) : ""}
              />
            ))}
          </AdminListContainer>
        </div>
      </UnifiedList>

      {/* Mobile Detail View */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-white shrink-0 z-50 relative">
            <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)} className="text-gray-500">
              <X size={24} />
            </Button>
            <h2 className="text-base font-bold absolute left-1/2 -translate-x-1/2">Detalhes do Log</h2>
            <Button variant="ghost" size="icon" onClick={fetchData} className="text-gray-500">
              <RefreshCw size={22} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="p-4 space-y-6 pb-20">
              <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4 border border-gray-100/50">
                <div className={cn(
                  "p-3 rounded-2xl shrink-0 flex items-center justify-center",
                  selectedLog.status === "sent" ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                  <ScrollText size={28} className={selectedLog.status === "sent" ? "text-green-600" : "text-red-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{selectedLog.recipient_phone}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 font-medium">
                    {selectedLog.sent_at ? format(new Date(selectedLog.sent_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : "—"}
                  </p>
                  <div className="mt-2">
                    <MessageStatusBadge status={selectedLog.status} />
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-1">
                <MobileInfoRow icon={Phone} label="Telefone" value={selectedLog.recipient_phone} copyable />
                <MobileInfoRow icon={Info} label="Instância" value={selectedLog.instance_name || "—"} />
                <MobileInfoRow icon={Calendar} label="Data do Envio" value={fmtDate(selectedLog.sent_at, "full")} />
                <MobileInfoRow icon={Hash} label="ID do Log" value={selectedLog.id} copyable />
                <MobileInfoRow icon={Hash} label="ID da Fila" value={selectedLog.queue_id || "N/A"} copyable />
              </div>

              {selectedLog.message_content && (
                <div className="space-y-3 px-1 pt-2">
                  <h4 className="text-sm font-semibold text-gray-600">Conteúdo Enviado</h4>
                  <div className="bg-gray-50 rounded-[18px] p-4 border border-gray-100 shadow-inner">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap italic">"{selectedLog.message_content}"</p>
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <Button variant="outline" className="w-full h-14 border-border rounded-[18px] text-lg font-bold" onClick={() => setSelectedLog(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sheet View */}
      <Sheet open={!!selectedLog && window.innerWidth >= 768} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent side="right" className="p-0 flex flex-col md:max-w-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <SheetTitle>Detalhes do Log</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)}><X className="h-5 w-5" /></Button>
          </div>
          <ScrollArea className="flex-1 bg-white">
            {selectedLog && (
              <div className="p-4 space-y-6">
                <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4 border border-gray-100/50">
                  <div className={cn("p-3 rounded-2xl shrink-0", selectedLog.status === "sent" ? "bg-green-500/10" : "bg-red-500/10")}>
                    <ScrollText size={28} className={selectedLog.status === "sent" ? "text-green-600" : "text-red-600"} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{selectedLog.recipient_phone}</h3>
                    <p className="text-sm text-gray-500 font-medium">{fmtDate(selectedLog.sent_at, "full")}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <MobileInfoRow icon={Phone} label="Telefone" value={selectedLog.recipient_phone} copyable />
                  <MobileInfoRow icon={Info} label="Instância" value={selectedLog.instance_name || "—"} />
                  <MobileInfoRow icon={Hash} label="ID" value={selectedLog.id} copyable />
                </div>
                {selectedLog.message_content && (
                  <div className="bg-gray-50 rounded-[18px] p-5 border border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap italic">"{selectedLog.message_content}"</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </UnifiedLayout>
  );
}
