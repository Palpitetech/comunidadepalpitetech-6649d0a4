import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, Inbox, Filter, X, RefreshCw, AlertTriangle, 
  Clock, CheckCircle2, Send, FileText, Smartphone, Phone, User, Hash, Info, Calendar, AlertCircle
} from "lucide-react";
import { MessageStatusBadge } from "./shared/MessageStatusBadge";
import { MetricCard } from "./shared/MetricCard";
import { Field } from "./shared/Field";
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
        {/* Desktop View */}
        <div className="hidden md:grid gap-3 lg:grid-cols-2">
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

        {/* Mobile View - Eventos Style */}
        <div className="md:hidden border-t border-border/40">
          <AdminListContainer loading={loading && filtered.length === 0}>
            {filtered.slice(0, 100).map((r) => (
              <AdminListItem
                key={r.id}
                onClick={() => setSelected(r)}
                title={r.recipient_phone}
                badge={{
                  text: r.status === "pending" ? "Aguardando" : r.status === "sent" ? "Enviado" : r.status === "failed" ? "Erro" : "Enviando",
                  color: r.status === "sent" ? "bg-green-500/10 text-green-700 border-green-200/50" : 
                         r.status === "failed" ? "bg-red-500/10 text-red-700 border-red-200/50" :
                         "bg-yellow-500/10 text-yellow-700 border-yellow-200/50",
                  icon: r.status === "sent" ? CheckCircle2 : r.status === "failed" ? AlertCircle : Clock
                }}
                subtitle={`${r.template_name} • ${r.instance_name}`}
                timestamp={r.created_at ? format(new Date(r.created_at), "HH:mm", { locale: ptBR }) : ""}
              />
            ))}
          </AdminListContainer>
        </div>
      </UnifiedList>

      {/* Mobile Detail View */}
      {selected && (
        <div className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-white shrink-0 z-50 relative">
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)} className="text-gray-500">
              <X size={24} />
            </Button>
            <h2 className="text-base font-bold absolute left-1/2 -translate-x-1/2">Detalhes da Mensagem</h2>
            <Button variant="ghost" size="icon" onClick={fetchData} className="text-gray-500">
              <RefreshCw size={22} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="p-4 space-y-6 pb-20">
              <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4 border border-gray-100/50">
                <div className={cn(
                  "p-3 rounded-2xl shrink-0 flex items-center justify-center",
                  selected.status === "sent" ? "bg-green-500/10" : "bg-yellow-500/10"
                )}>
                  <MessageSquare size={28} className={selected.status === "sent" ? "text-green-600" : "text-yellow-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{selected.recipient_phone}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 font-medium">
                    {selected.created_at ? format(new Date(selected.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : "—"}
                  </p>
                  <div className="mt-2">
                    <MessageStatusBadge status={selected.status} />
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-1">
                <MobileInfoRow icon={User} label="Nome" value={selected.recipient_name || "—"} copyable />
                <MobileInfoRow icon={Phone} label="Telefone" value={selected.recipient_phone} copyable />
                <MobileInfoRow icon={FileText} label="Template" value={selected.template_name || "—"} />
                <MobileInfoRow icon={Info} label="Instância" value={selected.instance_name || "—"} />
                <MobileInfoRow icon={Calendar} label="Criada em" value={fmtDate(selected.created_at)} />
                <MobileInfoRow icon={Calendar} label="Agendada para" value={fmtDate(selected.scheduled_at)} />
                {selected.sent_at && <MobileInfoRow icon={CheckCircle2} label="Enviada em" value={fmtDate(selected.sent_at)} />}
                <MobileInfoRow icon={Hash} label="ID" value={selected.id} copyable />
              </div>

              {selected.error_message && (
                <div className="space-y-3 px-1 pt-2">
                  <h4 className="text-sm font-semibold text-red-600">Erro</h4>
                  <div className="bg-red-50 rounded-[18px] p-4 border border-red-100">
                    <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono">{selected.error_message}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sheet View */}
      <Sheet open={!!selected && window.innerWidth >= 768} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="p-0 flex flex-col md:max-w-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <SheetTitle>Detalhes da Mensagem</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-5 w-5" /></Button>
          </div>
          <ScrollArea className="flex-1 bg-white">
            {selected && (
              <div className="p-4 space-y-6">
                <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4 border border-gray-100/50">
                  <div className={cn("p-3 rounded-2xl shrink-0", selected.status === "sent" ? "bg-green-500/10" : "bg-yellow-500/10")}>
                    <MessageSquare size={28} className={selected.status === "sent" ? "text-green-600" : "text-yellow-600"} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{selected.recipient_phone}</h3>
                    <p className="text-sm text-gray-500 font-medium">{fmtDate(selected.created_at)}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <MobileInfoRow icon={User} label="Nome" value={selected.recipient_name || "—"} copyable />
                  <MobileInfoRow icon={Phone} label="Telefone" value={selected.recipient_phone} copyable />
                  <MobileInfoRow icon={FileText} label="Template" value={selected.template_name || "—"} />
                  <MobileInfoRow icon={Info} label="Instância" value={selected.instance_name || "—"} />
                  <MobileInfoRow icon={Hash} label="ID" value={selected.id} copyable />
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </UnifiedLayout>
  );
}

function MessageSquare(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
