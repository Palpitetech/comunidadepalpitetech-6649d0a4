import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, UserPlus, ShoppingCart, QrCode,
  CreditCard, XCircle, Clock, Ban, X,
  RefreshCw, Mail, RotateCcw, Inbox,
  CheckCircle2, User, Calendar, Copy, Globe, Phone, Hash
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AdminListContainer, AdminListItem, AdminHeader, AdminPagination } from "@/components/admin/AdminListComponents";


type EventRow = {
  id: string;
  user_id: string | null;
  event_type: string;
  metadata: any;
  created_at: string;
  source: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  perfis: {
    nome: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

type FilterTab = "todos" | "leads" | "cadastros" | "pix_boleto" | "vendas" | "cancelamentos";

const FILTER_TABS: { key: FilterTab; label: string; icon: typeof Activity; types: string[] }[] = [
  { key: "todos", label: "Todos", icon: Activity, types: [] },
  {
    key: "leads",
    label: "Leads",
    icon: Inbox,
    types: ["lead_inbox_capturado", "lead_inbox_promovido", "email_pendente_criado", "lead_email_confirmado", "lead_recebido_pendente"],
  },
  { key: "cadastros", label: "Cadastros", icon: UserPlus, types: ["novo_cadastro"] },
  {
    key: "pix_boleto",
    label: "PIX/Boleto",
    icon: QrCode,
    types: ["pix_gerado", "pix_expirado", "boleto_gerado", "boleto_expirado", "carrinho_abandonado", "checkout_abandonado"],
  },
  {
    key: "vendas",
    label: "Vendas",
    icon: ShoppingCart,
    types: ["compra_aprovada", "sale_confirmed", "assinatura_renovada", "compra_reembolsada", "compra_chargeback"],
  },
  {
    key: "cancelamentos",
    label: "Cancelamentos",
    icon: XCircle,
    types: ["assinatura_cancelada", "assinatura_inadimplente", "assinatura_expirada"],
  },
];

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  // Leads
  lead_inbox_capturado: { label: "Confirmado", icon: CheckCircle2, color: "bg-green-500/10 text-green-700 border-green-200/50" },
  lead_inbox_promovido: { label: "Confirmado", icon: CheckCircle2, color: "bg-green-500/10 text-green-700 border-green-200/50" },
  email_pendente_criado: { label: "Pendente", icon: Clock, color: "bg-yellow-500/10 text-yellow-700 border-yellow-200/50" },
  lead_email_confirmado: { label: "Confirmado", icon: CheckCircle2, color: "bg-green-500/10 text-green-700 border-green-200/50" },
  lead_recebido_pendente: { label: "Pendente", icon: Clock, color: "bg-yellow-500/10 text-yellow-700 border-yellow-200/50" },

  // Cadastros
  novo_cadastro: { label: "Cadastrado", icon: User, color: "bg-blue-500/10 text-blue-700 border-blue-200/50" },

  // PIX / Boleto / Carrinho
  pix_gerado: { label: "PIX Gerado", icon: QrCode, color: "bg-green-500/10 text-green-700 border-green-200/50" },
  pix_expirado: { label: "Expirado", icon: Clock, color: "bg-muted/50 text-muted-foreground border-border/50" },
  boleto_gerado: { label: "Boleto Gerado", icon: CreditCard, color: "bg-yellow-500/10 text-yellow-700 border-yellow-200/50" },
  boleto_expirado: { label: "Boleto Expirado", icon: Clock, color: "bg-muted/50 text-muted-foreground border-border/50" },
  carrinho_abandonado: { label: "Abandono", icon: Ban, color: "bg-orange-500/10 text-orange-700 border-orange-200/50" },
  checkout_abandonado: { label: "Abandono", icon: Ban, color: "bg-orange-500/10 text-orange-700 border-orange-200/50" },

  // Vendas
  compra_aprovada: { label: "Confirmado", icon: CheckCircle2, color: "bg-green-500/10 text-green-700 border-green-200/50" },
  sale_confirmed: { label: "Venda", icon: ShoppingCart, color: "bg-green-500/10 text-green-700 border-green-200/50" },
  assinatura_renovada: { label: "Renovado", icon: RotateCcw, color: "bg-green-500/10 text-green-700 border-green-200/50" },
  compra_reembolsada: { label: "Cancelado", icon: XCircle, color: "bg-red-500/10 text-red-700 border-red-200/50" },
  compra_chargeback: { label: "Cancelado", icon: XCircle, color: "bg-red-500/10 text-red-700 border-red-200/50" },
  compra_recusada: { label: "Cancelado", icon: XCircle, color: "bg-red-500/10 text-red-700 border-red-200/50" },


  // Cancelamentos
  assinatura_cancelada: { label: "Cancelado", icon: XCircle, color: "bg-red-500/10 text-red-700 border-red-200/50" },
  assinatura_expirada: { label: "Cancelado", icon: XCircle, color: "bg-red-500/10 text-red-700 border-red-200/50" },
  assinatura_inadimplente: { label: "Pendente", icon: Clock, color: "bg-yellow-500/10 text-yellow-700 border-yellow-200/50" },

  // Sistema
  trial_revertido_bug: { label: "Cancelado", icon: XCircle, color: "bg-muted/50 text-muted-foreground border-border/50" },
  agendado: { label: "Agendado", icon: Calendar, color: "bg-purple-500/10 text-purple-700 border-purple-200/50" },
};




function getEventConfig(type: string) {
  return EVENT_TYPE_CONFIG[type] ?? { label: type, icon: Activity, color: "bg-muted text-muted-foreground border-border" };
}

function formatBRL(value: any): string | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n)) return null;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getMetaSummary(ev: EventRow): string {
  const m = ev.metadata ?? {};
  const t = ev.event_type;
  const valor = formatBRL(m.total_price);
  const plano = m.plan_slug || m.plano || null;

  if (t === "pix_gerado" || t === "pix_expirado") {
    return [valor, plano].filter(Boolean).join(" • ") || "—";
  }
  if (t === "boleto_gerado" || t === "boleto_expirado") {
    return [valor, plano].filter(Boolean).join(" • ") || "—";
  }
  if (t === "compra_aprovada" || t === "sale_confirmed" || t === "assinatura_renovada") {
    return [valor, plano, m.payment_method].filter(Boolean).join(" • ") || "—";
  }
  if (t === "carrinho_abandonado" || t === "checkout_abandonado") {
    return [valor, plano].filter(Boolean).join(" • ") || "—";
  }
  if (t === "assinatura_cancelada" || t === "assinatura_inadimplente" || t === "assinatura_expirada") {
    return plano || (m.previous_status ? `era ${m.previous_status}` : "—");
  }
  if (t.startsWith("lead_") || t === "email_pendente_criado") {
    return m.webhook_name || m.pagina_origem || m.source || "—";
  }
  if (m.email) return m.email;
  return "—";
}

function getOriginLabel(ev: EventRow): { label: string; color: string } {
  const src = ev.source || "system";
  if (src === "kirvano") return { label: "Kirvano", color: "bg-purple-500/10 text-purple-700 border-purple-200" };
  if (src === "lead_webhook") return { label: "Lead", color: "bg-sky-500/10 text-sky-700 border-sky-200" };
  return { label: "Sistema", color: "bg-muted text-muted-foreground border-border" };
}

const PAGE_SIZE = 25;

export default function AdminEventos() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("todos");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [counters, setCounters] = useState<Record<FilterTab, number>>({
    todos: 0, leads: 0, cadastros: 0, pix_boleto: 0, vendas: 0, cancelamentos: 0,
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const tab = FILTER_TABS.find((t) => t.key === activeFilter)!;
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("events")
        .select("*, perfis(nome, email, avatar_url)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (tab.types.length > 0) {
        query = query.in("event_type", tab.types);
      }
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        query = query.or(`lead_email.ilike.${s},lead_phone.ilike.${s},event_type.ilike.${s}`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setEvents((data as unknown as EventRow[]) || []);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error("Erro ao buscar eventos:", err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page, search]);

  // Counters por aba (executado uma vez por load + ao mudar busca)
  const fetchCounters = useCallback(async () => {
    try {
      const queries = FILTER_TABS.map((tab) => {
        let q = supabase.from("events").select("id", { count: "exact", head: true });
        if (tab.types.length > 0) q = q.in("event_type", tab.types);
        return q;
      });
      const results = await Promise.all(queries);
      const next = { ...counters };
      FILTER_TABS.forEach((tab, idx) => {
        next[tab.key] = results[idx].count ?? 0;
      });
      setCounters(next);
    } catch (err) {
      console.error("Erro ao buscar contadores:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchCounters(); }, [fetchCounters]);
  useEffect(() => { setPage(0); }, [activeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const getFilterCount = (key: FilterTab) => counters[key] ?? 0;

  const renderUserCell = (ev: EventRow) => {
    if (ev.perfis?.nome || ev.perfis?.email) {
      return ev.perfis.nome || ev.perfis.email;
    }
    if (ev.lead_email) return ev.lead_email;
    if (ev.lead_phone) return ev.lead_phone;
    return "Lead anônimo";
  };

  const renderEmailCell = (ev: EventRow) => {
    if (ev.perfis?.email) return ev.perfis.email;
    if (ev.lead_email) return ev.lead_email;
    return "—";
  };

  return (
    <AdminLayout pageTitle="Eventos">
      <div className="flex flex-col flex-1 min-h-0 bg-background">
        <AdminHeader 
          title="Eventos"
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => { fetchEvents(); fetchCounters(); }}
          loading={loading}
          filters={FILTER_TABS.map(tab => ({
            label: tab.label,
            isActive: activeFilter === tab.key,
            onClick: () => setActiveFilter(tab.key),
            icon: tab.icon,
            count: getFilterCount(tab.key)
          }))}
        />

        <div className="flex-1 overflow-auto bg-background">
          <div className="max-w-7xl mx-auto w-full">
            <AdminListContainer 
              loading={loading && events.length === 0}
              emptyMessage="Nenhum log encontrado"
            >
              {events.map((ev) => {
                const config = getEventConfig(ev.event_type);
                const origin = getOriginLabel(ev);
                const StatusIcon = config.icon;
                
                return (
                  <AdminListItem
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    title={renderUserCell(ev)}
                    badge={{
                      text: config.label,
                      color: config.color,
                      icon: StatusIcon
                    }}
                    subtitle={`${renderEmailCell(ev) !== renderUserCell(ev) ? `${renderEmailCell(ev)} • ` : ""}${getMetaSummary(ev)}${!ev.user_id ? ` • ${origin.label}` : ""}`}
                    timestamp={format(new Date(ev.created_at), "HH:mm", { locale: ptBR })}
                  />
                );
              })}
            </AdminListContainer>

            <AdminPagination 
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={setPage}
              hasNextPage={page < totalPages - 1}
              hasPrevPage={page > 0}
            />
          </div>
        </div>
      </div>

      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent 
          side="right" 
          className="h-screen w-[99vw] p-0 flex flex-col border-none bg-white sm:max-w-[99vw] outline-none focus:ring-0 overflow-hidden"
        >
          {/* Reconstrução Total - Etapa 03 */}
          {selectedEvent && (
            <div className="flex flex-col h-full w-full bg-white relative">
              {/* 1. Cabeçalho (Header Sticky) */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-50">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:bg-transparent p-0"
                >
                  <X size={24} strokeWidth={1.5} />
                </Button>
                <h2 className="text-lg font-semibold text-gray-800">Detalhes do Evento</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-500 hover:bg-transparent p-0"
                  onClick={() => fetchEvents()}
                >
                  <RefreshCw size={22} strokeWidth={1.5} />
                </Button>
              </div>

              {/* Conteúdo com ScrollArea */}
              <ScrollArea className="flex-1 w-full bg-white">
                <div className="p-4 space-y-6 pb-32">
                  
                  {/* 2. Status Card (Superior) */}
                  <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4 border border-gray-100/50">
                    <div className={cn(
                      "p-3 rounded-2xl shrink-0 flex items-center justify-center relative",
                      getEventConfig(selectedEvent.event_type).color.split(' ')[0]
                    )}>
                      {(() => {
                        const Icon = getEventConfig(selectedEvent.event_type).icon;
                        return <Icon size={28} className="text-green-600" />;
                      })()}
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                        <CheckCircle2 size={16} className="text-green-600 fill-green-600/10" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">
                        {getEventConfig(selectedEvent.event_type).label}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5 font-medium">
                        {format(new Date(selectedEvent.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        Event ID: {selectedEvent.id.slice(0, 15)}...
                      </p>
                    </div>
                  </div>

                  {/* 3. Box de Identificação */}
                  <div className="space-y-5 px-1">
                    <NewInfoRow 
                      icon={User} 
                      label="Nome/Lead" 
                      value={selectedEvent.perfis?.nome || renderUserCell(selectedEvent)} 
                      copyable
                    />
                    <NewInfoRow 
                      icon={Mail} 
                      label="Email Principal" 
                      value={renderEmailCell(selectedEvent)} 
                      copyable 
                    />
                    <NewInfoRow 
                      icon={Globe} 
                      label="Origem" 
                      value={getOriginLabel(selectedEvent).label} 
                      copyable
                    />
                    <NewInfoRow 
                      icon={Hash} 
                      label="ID do Evento" 
                      value={selectedEvent.id} 
                      copyable 
                    />
                    <NewInfoRow 
                      icon={Phone} 
                      label="Telefone" 
                      value={selectedEvent.metadata?.phone || selectedEvent.lead_phone || ""} 
                      copyable
                    />
                  </div>

                  {/* 4. Box de Metadados (JSON) */}
                  <div className="space-y-3 px-1 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-600">Metadados (JSON)</h4>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-7 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-bold rounded-lg px-3"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(selectedEvent.metadata, null, 2));
                          toast.success("JSON copiado!");
                        }}
                      >
                        Copiar Tudo
                      </Button>
                    </div>
                    
                    <div className="bg-[#0f172a] rounded-[18px] p-5 border border-slate-800 shadow-inner">
                      <pre className="text-[13px] font-mono leading-relaxed overflow-x-auto no-scrollbar text-slate-300">
                        {JSON.stringify(selectedEvent.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* 5. Footer Fixo */}
              <div className="p-4 border-t bg-white sticky bottom-0 z-50 pb-8">
                <Button 
                  className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-[18px] text-lg font-bold gap-3 shadow-lg shadow-green-100"
                  onClick={() => {
                    const pix = selectedEvent.metadata?.pix_code || selectedEvent.metadata?.pix_payload || selectedEvent.metadata?.pix_codigo;
                    if (pix) {
                      navigator.clipboard.writeText(pix);
                      toast.success("Código PIX copiado!");
                    } else {
                      toast.error("Código PIX não disponível");
                    }
                  }}
                >
                  <QrCode size={24} />
                  Copiar Código PIX
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

function NewInfoRow({ icon: Icon, label, value, copyable }: { icon: any; label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="mt-1 p-0.5 text-gray-400 shrink-0">
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0 border-b border-gray-50 pb-4 last:border-0 overflow-hidden">
        <p className="text-xs font-medium text-gray-400 mb-0.5 tracking-tight uppercase">{label}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] font-bold text-gray-900 truncate leading-snug break-all">
            {value || <span className="text-gray-300 italic font-normal text-sm">Não informado</span>}
          </p>
          {copyable && value && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-300 hover:text-gray-500 hover:bg-gray-50 shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(value);
                toast.success(`${label} copiado!`);
              }}
            >
              <Copy size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}



