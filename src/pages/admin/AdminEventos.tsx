import { useState, useEffect, useMemo, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Search, ChevronRight, ArrowLeft, Activity,
  UserPlus, ShoppingCart, QrCode, ChevronLeft,
  CreditCard, XCircle, AlertTriangle, Clock, Ban, X,
  RefreshCw, Mail, UserCheck, Wallet, RotateCcw, ShieldAlert, Inbox,
  CheckCircle2, User, Calendar,
} from "lucide-react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
    <AdminLayout
      pageTitle="Eventos"
    >
      <div className="flex flex-col flex-1 min-h-0 bg-background">
        {/* ======= HEADER MINIMALISTA ======= */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-3 max-w-7xl mx-auto w-full">
            <div className="flex-1 max-w-[240px] md:max-w-md relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Buscar..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-9 h-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all" 
              />
              {search && (
                <button 
                  onClick={() => setSearch("")} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-xl border-border/50 bg-background hover:bg-muted/50 transition-all"
                onClick={() => { fetchEvents(); fetchCounters(); }}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4 text-muted-foreground", loading && "animate-spin")} />
              </Button>
            </div>
          </div>



          {/* ======= FILTROS COMPACTOS ======= */}
          <div className="px-4 md:px-6 pb-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {FILTER_TABS.map(({ key, label }) => {
                const isActive = activeFilter === key;
                const count = getFilterCount(key);
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border shrink-0 flex items-center gap-2",
                      isActive 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                        : "bg-background text-muted-foreground border-border/50 hover:bg-muted/50"
                    )}
                  >
                    {label}
                    {count > 0 && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {count > 999 ? `${(count/1000).toFixed(1)}k` : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ======= CONTEÚDO PRINCIPAL (ULTRA COMPACTO) ======= */}
        <div className="flex-1 overflow-auto bg-background">
          <div className="max-w-7xl mx-auto w-full">
            
            {loading && events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Sincronizando logs...</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40 border-b border-border/40">
                {events.map((ev) => {
                  const config = getEventConfig(ev.event_type);
                  const origin = getOriginLabel(ev);
                  const StatusIcon = config.icon;
                  
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="w-full flex items-center justify-between gap-3 py-2.5 px-3 hover:bg-muted/30 active:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        {/* Linha 1: Nome Principal + Badge */}
                        <div className="flex items-center justify-between gap-2 leading-tight">
                          <span className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
                            {renderUserCell(ev)}
                          </span>
                          
                          <div className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight border shrink-0",
                            config.color
                          )}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {config.label}
                          </div>
                        </div>

                        {/* Linha 2: Info Secundária + Horário */}
                          <div className="flex items-center justify-between gap-2 mt-1 leading-tight">
                            <span className="text-[11px] text-muted-foreground/70 truncate italic text-left">
                              {renderEmailCell(ev)}
                            </span>


                          
                          <span className="text-[10px] font-medium text-muted-foreground/50 whitespace-nowrap shrink-0">
                            {format(new Date(ev.created_at), "HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors shrink-0 ml-1" />
                    </button>
                  );
                })}





                {events.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
                    <Search className="h-6 w-6 text-muted-foreground/20" />
                    <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">Nenhum log encontrado</p>
                  </div>
                )}
              </div>
            )}

            {/* ======= PAGINAÇÃO ULTRA COMPACTA ======= */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 bg-muted/5">
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} <span className="mx-1">/</span> {totalCount.toLocaleString("pt-BR")}
                </p>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 hover:bg-muted" 
                    disabled={page === 0} 
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <span className="text-[10px] font-bold w-8 text-center">{page + 1}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 hover:bg-muted" 
                    disabled={page >= totalPages - 1} 
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ======= DRAWER DE DETALHES (MINIMALISTA) ======= */}
      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l border-border/50">
          <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-muted/10">
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              Detalhes do Evento
            </SheetTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSelectedEvent(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {selectedEvent && (
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-8">
                {/* Cabeçalho do Evento no Drawer */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/20 border border-border/50">
                  <div className={cn("p-3 rounded-xl border border-border/50", getEventConfig(selectedEvent.event_type).color.split(' ')[1])}>
                    {(() => {
                      const Icon = getEventConfig(selectedEvent.event_type).icon;
                      return <Icon className="h-6 w-6" />;
                    })()}
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-foreground/90">{getEventConfig(selectedEvent.event_type).label}</p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {format(new Date(selectedEvent.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {/* Seções de Informação */}
                <div className="space-y-6">
                  <section className="space-y-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Identificação</h3>
                    <div className="grid gap-2">
                      <InfoRow label="Nome/Lead" value={renderUserCell(selectedEvent)} />
                      <InfoRow label="Email" value={renderEmailCell(selectedEvent)} />
                      <InfoRow label="Origem" value={getOriginLabel(selectedEvent).label} />
                      <InfoRow label="ID do Evento" value={selectedEvent.id} copyable />
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Metadados</h3>
                    <div className="rounded-2xl bg-muted/30 border border-border/50 p-4 overflow-hidden">
                      <pre className="text-[11px] font-mono leading-relaxed text-foreground/80 overflow-x-auto no-scrollbar">
                        {JSON.stringify(selectedEvent.metadata, null, 2)}
                      </pre>
                    </div>
                  </section>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

function InfoRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-background border border-border/30">
      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground/90 truncate">{value}</span>
        {copyable && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-md hover:bg-muted"
            onClick={() => {
              navigator.clipboard.writeText(value);
            }}
          >
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}

