import { useState, useEffect, useMemo, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, UserPlus, ShoppingCart, QrCode,
  CreditCard, XCircle, Clock, Ban, X,
  RefreshCw, Mail, UserCheck, Wallet, RotateCcw, ShieldAlert, Inbox,
  CheckCircle2, User, Calendar, ChevronRight, Copy, Globe, Phone, Hash, Info
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
          side="bottom" 
          className="h-screen w-full p-0 rounded-none border-none flex flex-col focus:ring-0 outline-none overflow-hidden"
        >
          {/* 1. Header Sticky (Inspiração: Fixed no topo, ícones laterais) */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-100/80 px-4 py-3.5 flex items-center justify-between shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full hover:bg-gray-50 active:scale-95 transition-transform" 
              onClick={() => setSelectedEvent(null)}
            >
              <X size={22} className="text-gray-900" />
            </Button>
            <SheetTitle className="text-[17px] font-semibold text-gray-900">Detalhes do Evento</SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full hover:bg-gray-50 active:scale-95 transition-transform" 
              onClick={() => fetchEvents()}
            >
              <RefreshCw size={20} className="text-gray-900" />
            </Button>
          </div>

          <ScrollArea className="flex-1 bg-white">
            {loading ? (
              <div className="p-6 space-y-8">
                <Skeleton className="h-32 w-full rounded-3xl" />
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex gap-4 items-center">
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-5 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedEvent && (
              <div className="flex flex-col pb-40">
                {/* 2. Hero de Status (Inspiração: Card centralizado com ícone grande) */}
                <div className="px-5 py-6">
                  <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100/80 flex flex-col items-center text-center">
                    <div className={cn(
                      "p-6 rounded-[24px] shadow-sm bg-white border border-gray-100 mb-5",
                      getEventConfig(selectedEvent.event_type).color.split(' ')[1]
                    )}>
                      {(() => {
                        const Icon = getEventConfig(selectedEvent.event_type).icon;
                        return <Icon size={40} strokeWidth={2.5} />;
                      })()}
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        {getEventConfig(selectedEvent.event_type).label}
                      </h2>
                      <div className="flex flex-col gap-1.5">
                        <p className="text-[15px] font-medium text-gray-500">
                          {format(new Date(selectedEvent.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100/80 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                          ID: {selectedEvent.id.split('-')[0]}...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Lista de Informações (Inspiração: Ícones modernos e labels minimalistas) */}
                <div className="px-6 space-y-7">
                  <div className="space-y-6">
                    <InfoRowModern icon={User} label="Nome/Lead" value={renderUserCell(selectedEvent)} />
                    <InfoRowModern icon={Mail} label="Email Principal" value={renderEmailCell(selectedEvent)} copyable />
                    <InfoRowModern icon={Globe} label="Origem" value={getOriginLabel(selectedEvent).label} />
                    <InfoRowModern icon={Hash} label="ID do Evento" value={selectedEvent.id} copyable />
                    {selectedEvent.metadata?.phone && (
                      <InfoRowModern icon={Phone} label="Telefone" value={selectedEvent.metadata.phone} copyable />
                    )}
                  </div>

                  {/* 4. Bloco JSON (Inspiração: Fundo ultra-escuro e syntax highlighting) */}
                  <div className="space-y-4 pt-6">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[12px] font-extrabold uppercase tracking-[0.15em] text-gray-400">Metadados (JSON)</h3>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-8 text-[11px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border-none rounded-lg px-3"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(selectedEvent.metadata, null, 2));
                          toast.success("JSON copiado!");
                        }}
                      >
                        <Copy size={12} className="mr-1.5" />
                        Copiar Tudo
                      </Button>
                    </div>
                    <div className="bg-[#0d1117] rounded-3xl p-6 overflow-hidden border border-gray-800/50 shadow-2xl relative group">
                      <pre className="text-[13px] font-mono leading-relaxed overflow-x-auto no-scrollbar scroll-smooth">
                        {Object.entries(selectedEvent.metadata || {}).map(([key, val], idx) => (
                          <div key={idx} className="flex gap-2.5 py-0.5">
                            <span className="text-[#7ee0ff] font-medium">"{key}"</span>
                            <span className="text-gray-500">:</span>
                            <span className={cn(
                              "break-all",
                              typeof val === 'string' ? "text-[#ffa657]" : "text-[#d2a8ff]"
                            )}>
                              {typeof val === 'string' ? `"${val}"` : String(val)}
                              {idx < Object.entries(selectedEvent.metadata).length - 1 && <span className="text-gray-500">,</span>}
                            </span>
                          </div>
                        ))}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* 5. Ação Fixa no Rodapé (Inspiração: Botão verde vibrante Full-width) */}
          {!loading && selectedEvent?.metadata?.pix_codigo && (
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-30">
              <Button 
                className="w-full h-15 rounded-[22px] bg-[#10b981] hover:bg-[#059669] text-[16px] font-bold text-white shadow-2xl shadow-emerald-200/50 transition-all active:scale-[0.96] flex items-center justify-center gap-3 py-7"
                onClick={() => {
                  navigator.clipboard.writeText(selectedEvent.metadata.pix_codigo);
                  toast.success("Código PIX copiado!");
                }}
              >
                <QrCode size={22} strokeWidth={2.5} />
                Copiar Código PIX
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

/**
 * Componente de Linha de Informação Moderno
 */
function InfoRowModern({ icon: Icon, label, value, copyable }: { icon: any; label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center gap-4.5 group">
      <div className="h-12 w-12 rounded-[18px] bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-gray-900 group-hover:bg-gray-100 transition-colors shrink-0">
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-bold text-gray-900 truncate leading-tight">
            {value || <span className="text-gray-300 italic font-normal">Não informado</span>}
          </p>
          {copyable && value && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(value);
                toast.success(`${label} copiado!`);
              }}
            >
              <Copy size={15} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


