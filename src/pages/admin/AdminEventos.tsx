import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, UserPlus, ShoppingCart, QrCode,
  CreditCard, XCircle, Clock, Ban, X,
  RefreshCw, Mail, RotateCcw, Inbox,
  CheckCircle2, User, Calendar, Copy, Globe, Phone, Hash, ExternalLink
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
  smart_link_click: { label: "Clique SmartLink", icon: ExternalLink, color: "bg-blue-500/10 text-blue-700 border-blue-200/50" },
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

const KIRVANO_TO_TRIGGER: Record<string, string> = {
  compra_aprovada: "compra_aprovada",
  sale_confirmed: "compra_aprovada",
  pix_gerado: "pix_gerado",
  pix_expirado: "pix_expirado",
  boleto_gerado: "boleto_gerado",
  boleto_expirado: "boleto_expirado",
  carrinho_abandonado: "carrinho_abandonado",
  checkout_abandonado: "checkout_abandonado",
  assinatura_renovada: "assinatura_renovada",
  assinatura_cancelada: "assinatura_cancelada",
  assinatura_expirada: "assinatura_expirada",
  assinatura_inadimplente: "assinatura_inadimplente",
};

export default function AdminEventos() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("todos");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [planMap, setPlanMap] = useState<Record<string, { planName: string; checkoutLink: string | null }>>({});
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [counters, setCounters] = useState<Record<FilterTab, number>>({
    todos: 0, leads: 0, cadastros: 0, pix_boleto: 0, vendas: 0, cancelamentos: 0,
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedEvent(null);
    };
    window.addEventListener("keydown", handleEsc);
    
    if (selectedEvent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [selectedEvent]);

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

  useEffect(() => {
    const loadPlanMappings = async () => {
      const { data } = await supabase
        .from("kirvano_offer_plan_map")
        .select("offer_id, plans!inner(name, checkout_link)")
        .eq("is_active", true);
      if (data) {
        const map: Record<string, { planName: string; checkoutLink: string | null }> = {};
        for (const row of data as any[]) {
          map[row.offer_id] = {
            planName: row.plans?.name || "—",
            checkoutLink: row.plans?.checkout_link || null,
          };
        }
        setPlanMap(map);
      }
    };
    loadPlanMappings();
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

  const dispatchEventTemplate = async (ev: EventRow) => {
    const rawEvent = ev.event_type || "";
    const trigger = KIRVANO_TO_TRIGGER[rawEvent];
    if (!trigger) {
      toast.error("Este evento não tem trigger mapeado.");
      return;
    }

    const m = ev.metadata || {};
    
    // Extração robusta de telefone
    const phone = ev.lead_phone || 
                  m.phone || 
                  m.phone_number || 
                  m.customer?.phone_number || 
                  m.customer?.phone || 
                  (ev.perfis as any)?.telefone;

    // Extração robusta de nome
    const nome = ev.perfis?.nome || 
                 m.customer?.name || 
                 m.name || 
                 m.nome || 
                 "Cliente";

    const email = ev.lead_email || m.email || m.customer?.email;

    if (!phone) {
      toast.error("Telefone não encontrado para este evento.", {
        description: "Verifique os metadados do evento."
      });
      return;
    }

    setDispatchingId(ev.id);
    try {
      // 1. Verificar template ativo
      const { data: tpls, error: tplErr } = await supabase
        .from("message_templates" as any)
        .select("id, name")
        .eq("event_trigger", trigger)
        .eq("is_active", true);
      
      if (tplErr) throw tplErr;
      
      if (!tpls || tpls.length === 0) {
        toast.error(`Nenhum template ativo para "${trigger}"`, {
          description: "Ative um template em 'WhatsApp > Templates' primeiro."
        });
        return;
      }

      const offerId = m.offer_id;
      const mapped = offerId ? planMap[offerId] : null;

      const variables: Record<string, any> = {
        nome: nome,
        telefone: phone,
        email: email || "",
        produto: m.product_name || m.offer_name || mapped?.planName || "Produto",
        plano_nome: mapped?.planName || "",
        total_price: m.total_price || "",
        sale_id: m.sale_id || "",
        checkout_id: m.checkout_id || "",
      };
      
      if (m.pix_code || m.pix_payload || m.pix_codigo) {
        variables.pix_codigo = m.pix_code || m.pix_payload || m.pix_codigo;
      }
      if (mapped?.checkoutLink) variables.link_novo_pix = mapped.checkoutLink;

      const { data: count, error: rpcErr } = await supabase.rpc(
        "queue_templates_for_event" as any,
        {
          p_event_trigger: trigger,
          p_phone: phone,
          p_name: variables.nome,
          p_user_id: ev.user_id,
          p_variables: variables,
          p_priority: 1,
        }
      );
      if (rpcErr) throw rpcErr;

      const n = (count as number) ?? 0;
      if (n > 0) {
        toast.success(`${n} mensagem(ns) enfileirada(s).`);
      } else {
        toast.info("Nenhuma mensagem enfileirada (filtro/dedupe).");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao disparar.");
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <AdminLayout pageTitle="Eventos">
      <div className="flex flex-col flex-1 min-h-0 bg-background">
        <AdminHeader 
          title=""
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

      {/* Mobile Full Screen View */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-white shrink-0 z-50 relative">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedEvent(null)}
              className="text-gray-500 hover:bg-transparent p-0"
            >
              <X size={24} strokeWidth={1.5} />
            </Button>
            <h2 className="text-base font-bold absolute left-1/2 -translate-x-1/2">Detalhes do Evento</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-500 hover:bg-transparent p-0"
              onClick={() => fetchEvents()}
            >
              <RefreshCw size={22} strokeWidth={1.5} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
            <div className="flex flex-col min-h-full">
              <div className="p-4 space-y-6 pb-[calc(4rem+env(safe-area-inset-bottom))]">
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
                    icon={ShoppingCart} 
                    label="Produto/Oferta" 
                    value={selectedEvent.metadata?.product_name || selectedEvent.metadata?.offer_name || planMap[selectedEvent.metadata?.offer_id]?.planName || selectedEvent.metadata?.offer_id || "Não identificado"} 
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
                  
                  <div className="bg-[#0f172a] rounded-[18px] p-5 border border-slate-800 shadow-inner overflow-hidden">
                    <pre className="text-[13px] font-mono leading-relaxed overflow-x-auto no-scrollbar text-slate-300 break-all whitespace-pre-wrap">
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* 5. Footer Action Component inside scroll if needed, or fixed */}
                <div className="pt-4 space-y-3">
                  {(() => {
                    const trigger = KIRVANO_TO_TRIGGER[selectedEvent.event_type];
                    const isDispatching = dispatchingId === selectedEvent.id;
                    if (!trigger) return null;
                    return (
                      <Button 
                        variant="outline"
                        className="w-full h-14 border-primary/20 text-primary hover:bg-primary/5 rounded-[18px] text-lg font-bold gap-3"
                        disabled={isDispatching}
                        onClick={() => dispatchEventTemplate(selectedEvent)}
                      >
                        {isDispatching ? <RefreshCw size={24} className="animate-spin" /> : <RotateCcw size={24} />}
                        Disparar Template Manual
                      </Button>
                    );
                  })()}
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
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sheet View */}
      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)} modal={false}>
        <SheetContent 
          side="right" 
          className="hidden md:flex p-0 flex-col border-l border-border bg-white w-full md:max-w-lg outline-none focus:ring-0 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white shrink-0 z-50">
            <SheetTitle className="text-base font-semibold">Detalhes do Evento</SheetTitle>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setSelectedEvent(null)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            {selectedEvent && (
              <div className="flex flex-col h-full w-full bg-white relative">
                {/* Reuso do conteúdo ou Componentização se necessário, aqui mantendo para clareza */}
                <div className="p-4 space-y-6 pb-20">
                  {/* Status Card */}
                  <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4 border border-gray-100/50">
                    <div className={cn(
                      "p-3 rounded-2xl shrink-0 flex items-center justify-center relative",
                      getEventConfig(selectedEvent.event_type).color.split(' ')[0]
                    )}>
                      {(() => {
                        const Icon = getEventConfig(selectedEvent.event_type).icon;
                        return <Icon size={28} className="text-green-600" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">
                        {getEventConfig(selectedEvent.event_type).label}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5 font-medium">
                        {format(new Date(selectedEvent.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <NewInfoRow icon={User} label="Nome/Lead" value={selectedEvent.perfis?.nome || renderUserCell(selectedEvent)} copyable />
                    <NewInfoRow icon={Mail} label="Email Principal" value={renderEmailCell(selectedEvent)} copyable />
                    <NewInfoRow icon={Globe} label="Origem" value={getOriginLabel(selectedEvent).label} copyable />
                    <NewInfoRow icon={Hash} label="ID do Evento" value={selectedEvent.id} copyable />
                    <NewInfoRow icon={Phone} label="Telefone" value={selectedEvent.metadata?.phone || selectedEvent.lead_phone || ""} copyable />
                  </div>

                  <div className="bg-[#0f172a] rounded-[18px] p-5 border border-slate-800">
                    <pre className="text-[13px] font-mono leading-relaxed overflow-x-auto no-scrollbar text-slate-300 whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                    </pre>
                  </div>
                  
                  <Button 
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-[18px] text-lg font-bold gap-3"
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
          </div>
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



