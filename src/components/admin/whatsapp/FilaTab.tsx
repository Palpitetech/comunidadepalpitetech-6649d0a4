import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Play, RotateCcw, Send, Filter, X, RefreshCw, FileText, Phone, User, Calendar, Hash, Info, AlertCircle } from "lucide-react";
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
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [instances, setInstances] = useState<InstanceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
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
        {/* Desktop View */}
        <div className="hidden md:grid gap-3 lg:grid-cols-2">
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

        {/* Mobile View - Eventos Style */}
        <div className="md:hidden border-t border-border/40">
          <AdminListContainer loading={loading && filtered.length === 0}>
            {filtered.map((item) => (
              <AdminListItem
                key={item.id}
                onClick={() => setSelectedItem(item)}
                title={item.recipient_name || item.recipient_phone}
                badge={{
                  text: item.status,
                  color: item.status === "sent" ? "bg-green-500/10 text-green-700 border-green-200/50" : 
                         item.status === "failed" ? "bg-red-500/10 text-red-700 border-red-200/50" :
                         item.status === "pending" ? "bg-yellow-500/10 text-yellow-700 border-yellow-200/50" :
                         "bg-muted/50 text-muted-foreground border-border/50",
                  icon: item.status === "sent" ? Send : item.status === "failed" ? AlertCircle : RefreshCw
                }}
                subtitle={`${getTemplateName(item.template_id)} • ${item.recipient_phone}`}
                timestamp={format(new Date(item.scheduled_at), "HH:mm", { locale: ptBR })}
              />
            ))}
          </AdminListContainer>
        </div>
      </UnifiedList>

      {/* Mobile Detail View */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-white shrink-0 z-50 relative">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedItem(null)}
              className="text-gray-500 hover:bg-transparent p-0"
            >
              <X size={24} strokeWidth={1.5} />
            </Button>
            <h2 className="text-base font-bold absolute left-1/2 -translate-x-1/2">Detalhes do Envio</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-500 hover:bg-transparent p-0"
              onClick={() => fetchAll()}
            >
              <RefreshCw size={22} strokeWidth={1.5} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
            <div className="flex flex-col min-h-full">
              <div className="p-4 space-y-6 pb-[calc(4rem+env(safe-area-inset-bottom))]">
                {/* Status Card */}
                <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4 border border-gray-100/50">
                  <div className={cn(
                    "p-3 rounded-2xl shrink-0 flex items-center justify-center",
                    selectedItem.status === "sent" ? "bg-green-500/10" : selectedItem.status === "failed" ? "bg-red-500/10" : "bg-yellow-500/10"
                  )}>
                    <Send size={28} className={cn(
                      selectedItem.status === "sent" ? "text-green-600" : selectedItem.status === "failed" ? "text-red-600" : "text-yellow-600"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">
                      {selectedItem.recipient_name || "Sem nome"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5 font-medium">
                      Agendado: {format(new Date(selectedItem.scheduled_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <div className="mt-2">
                      <MessageStatusBadge status={selectedItem.status} />
                    </div>
                  </div>
                </div>

                {/* Identification */}
                <div className="space-y-5 px-1">
                  <MobileInfoRow 
                    icon={Phone} 
                    label="Telefone" 
                    value={selectedItem.recipient_phone} 
                    copyable
                  />
                  <MobileInfoRow 
                    icon={FileText} 
                    label="Template" 
                    value={getTemplateName(selectedItem.template_id)} 
                  />
                  <MobileInfoRow 
                    icon={Info} 
                    label="Instância" 
                    value={getInstanceName(selectedItem.instance_id)} 
                  />
                  <MobileInfoRow 
                    icon={Hash} 
                    label="ID do Registro" 
                    value={selectedItem.id} 
                    copyable 
                  />
                </div>

                {/* Variables */}
                {selectedItem.variables && Object.keys(selectedItem.variables).length > 0 && (
                  <div className="space-y-3 px-1 pt-2">
                    <h4 className="text-sm font-semibold text-gray-600">Variáveis</h4>
                    <div className="bg-gray-50 rounded-[18px] p-4 border border-gray-100 shadow-inner space-y-2">
                      {Object.entries(selectedItem.variables).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-muted-foreground uppercase">{key}:</span>
                          <span className="font-mono font-bold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {selectedItem.status === "failed" && selectedItem.error_message && (
                  <div className="space-y-3 px-1 pt-2">
                    <h4 className="text-sm font-semibold text-red-600">Erro no Envio</h4>
                    <div className="bg-red-50 rounded-[18px] p-4 border border-red-100">
                      <p className="text-xs text-red-700 font-mono italic">
                        {selectedItem.error_message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 space-y-3">
                  {selectedItem.status === "failed" && (
                    <Button 
                      className="w-full h-14 bg-primary text-white rounded-[18px] text-lg font-bold gap-3"
                      onClick={() => {
                        handleRetry(selectedItem.id);
                        setSelectedItem(null);
                      }}
                    >
                      <RotateCcw size={24} />
                      Retentar Envio
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    className="w-full h-14 border-border rounded-[18px] text-lg font-bold gap-3"
                    onClick={() => setSelectedItem(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sheet View */}
      <Sheet open={!!selectedItem && window.innerWidth >= 768} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent 
          side="right" 
          className="p-0 flex flex-col border-l border-border bg-white w-full md:max-w-lg outline-none focus:ring-0 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white shrink-0 z-50">
            <SheetTitle className="text-base font-semibold">Detalhes do Envio</SheetTitle>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setSelectedItem(null)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="flex-1 bg-white">
            {selectedItem && (
              <div className="p-4 space-y-6 pb-20">
                <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4 border border-gray-100/50">
                  <div className={cn(
                    "p-3 rounded-2xl shrink-0 flex items-center justify-center",
                    selectedItem.status === "sent" ? "bg-green-500/10" : "bg-yellow-500/10"
                  )}>
                    <Send size={28} className={selectedItem.status === "sent" ? "text-green-600" : "text-yellow-600"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{selectedItem.recipient_name || "Sem nome"}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 font-medium">
                      {format(new Date(selectedItem.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <MobileInfoRow icon={Phone} label="Telefone" value={selectedItem.recipient_phone} copyable />
                  <MobileInfoRow icon={FileText} label="Template" value={getTemplateName(selectedItem.template_id)} />
                  <MobileInfoRow icon={Info} label="Status" value={selectedItem.status} />
                  <MobileInfoRow icon={Hash} label="ID" value={selectedItem.id} copyable />
                </div>

                {selectedItem.status === "failed" && (
                  <Button className="w-full h-12 rounded-xl" onClick={() => { handleRetry(selectedItem.id); setSelectedItem(null); }}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Retentar Envio
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </UnifiedLayout>
  );
}
