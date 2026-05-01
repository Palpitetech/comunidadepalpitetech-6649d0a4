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
  lead_inbox_capturado: { label: "Lead Capturado", icon: Inbox, color: "bg-sky-500/10 text-sky-700 border-sky-200/50" },
  lead_inbox_promovido: { label: "Lead Promovido", icon: UserCheck, color: "bg-sky-500/10 text-sky-700 border-sky-200/50" },
  email_pendente_criado: { label: "Email Pendente", icon: Mail, color: "bg-sky-500/10 text-sky-700 border-sky-200/50" },
  lead_email_confirmado: { label: "Email Confirmado", icon: Mail, color: "bg-sky-500/10 text-sky-700 border-sky-200/50" },
  lead_recebido_pendente: { label: "Lead Pendente", icon: Inbox, color: "bg-sky-500/10 text-sky-700 border-sky-200/50" },

  // Cadastros
  novo_cadastro: { label: "Novo Cadastro", icon: UserPlus, color: "bg-blue-500/10 text-blue-700 border-blue-200/50" },

  // PIX / Boleto / Carrinho
  pix_gerado: { label: "PIX Gerado", icon: QrCode, color: "bg-yellow-500/10 text-yellow-700 border-yellow-200/50" },
  pix_expirado: { label: "PIX Expirado", icon: Clock, color: "bg-muted/50 text-muted-foreground border-border/50" },
  boleto_gerado: { label: "Boleto Gerado", icon: CreditCard, color: "bg-yellow-500/10 text-yellow-700 border-yellow-200/50" },
  boleto_expirado: { label: "Boleto Expirado", icon: Clock, color: "bg-muted/50 text-muted-foreground border-border/50" },
  carrinho_abandonado: { label: "Carrinho Abandonado", icon: Ban, color: "bg-muted/50 text-muted-foreground border-border/50" },
  checkout_abandonado: { label: "Checkout Abandonado", icon: Ban, color: "bg-muted/50 text-muted-foreground border-border/50" },

  // Vendas
  compra_aprovada: { label: "Compra Aprovada", icon: ShoppingCart, color: "bg-green-500/10 text-green-700 border-green-200/50" },
  sale_confirmed: { label: "Venda Confirmada", icon: Wallet, color: "bg-green-500/10 text-green-700 border-green-200/50" },
  assinatura_renovada: { label: "Assinatura Renovada", icon: RotateCcw, color: "bg-green-500/10 text-green-700 border-green-200/50" },
  compra_reembolsada: { label: "Reembolso", icon: RotateCcw, color: "bg-red-500/10 text-red-700 border-red-200/50" },
  compra_chargeback: { label: "Chargeback", icon: ShieldAlert, color: "bg-red-500/10 text-red-700 border-red-200/50" },
  compra_recusada: { label: "Compra Recusada", icon: XCircle, color: "bg-red-500/10 text-red-700 border-red-200/50" },

  // Cancelamentos
  assinatura_cancelada: { label: "Cancelada", icon: XCircle, color: "bg-red-500/10 text-red-700 border-red-200/50" },
  assinatura_expirada: { label: "Expirada", icon: Clock, color: "bg-muted/50 text-muted-foreground border-border/50" },
  assinatura_inadimplente: { label: "Inadimplente", icon: AlertTriangle, color: "bg-orange-500/10 text-orange-700 border-orange-200/50" },

  // Sistema
  trial_revertido_bug: { label: "Trial Revertido", icon: ShieldAlert, color: "bg-muted/50 text-muted-foreground border-border/50" },
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

  if (loading && events.length === 0) {
    return (
      <AdminLayout pageTitle="Eventos">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      pageTitle="Eventos"
      headerRightContent={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">{counters.todos.toLocaleString("pt-BR")}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { fetchEvents(); fetchCounters(); }}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      }
    >
      {/* ======= MOBILE ======= */}
      <div className="md:hidden px-4 py-3 space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          {FILTER_TABS.map(({ key, label, icon: Icon }) => {
            const count = getFilterCount(key);
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl p-2 transition-colors text-center min-h-[64px]",
                  isActive ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/40 hover:bg-muted/60"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="text-base font-bold leading-none">{count}</span>
                <span className={cn("text-[10px] leading-tight", isActive ? "text-primary font-medium" : "text-muted-foreground")}>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar email, tipo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 pr-9" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="space-y-0.5">
          {events.map((ev) => {
            const config = getEventConfig(ev.event_type);
            const Icon = config.icon;
            const origin = getOriginLabel(ev);
            return (
              <button
                key={ev.id}
                className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg active:bg-muted/60 transition-colors border-b border-border/30 last:border-0"
                onClick={() => setSelectedEvent(ev)}
              >
                <Icon className={cn("h-4 w-4 shrink-0 text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{renderUserCell(ev)}</p>
                    {!ev.user_id && (
                      <Badge variant="outline" className={cn("text-[9px] px-1 py-0 shrink-0", origin.color)}>
                        {origin.label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(ev.created_at), "dd/MM HH:mm", { locale: ptBR })} • {getMetaSummary(ev)}
                  </p>
                </div>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 shrink-0", config.color)}>
                  {config.label}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </button>
            );
          })}
          {events.length === 0 && !loading && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {search ? "Nenhum resultado encontrado" : "Nenhum evento"}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 pb-4">
            <p className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3ch] text-center">{page + 1}/{totalPages}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ======= DESKTOP ======= */}
      <div className="hidden md:flex flex-col flex-1 min-h-0">
        <div className="border-b border-border bg-card/50 px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold mr-2">Eventos</h1>

          <div className="flex items-center gap-1 flex-wrap">
            {FILTER_TABS.map(({ key, label }) => {
              const count = getFilterCount(key);
              const isActive = activeFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {label} <span className="opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm bg-background" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-6"></TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Usuário / Lead</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Origem</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Detalhe</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Data</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((ev) => {
                const config = getEventConfig(ev.event_type);
                const Icon = config.icon;
                const origin = getOriginLabel(ev);
                return (
                  <TableRow key={ev.id} className="cursor-pointer group" onClick={() => setSelectedEvent(ev)}>
                    <TableCell className="pl-6 py-2.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className={cn("text-sm font-medium truncate max-w-[200px] block", !ev.user_id && "italic text-muted-foreground")}>
                        {renderUserCell(ev)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-muted-foreground truncate max-w-[220px]">
                      {renderEmailCell(ev)}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color)}>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", origin.color)}>
                        {origin.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground truncate max-w-[200px]">
                      {getMetaSummary(ev)}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground tabular-nums">
                      {format(new Date(ev.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="py-2.5 pr-4">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </TableCell>
                  </TableRow>
                );
              })}
              {events.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-sm text-muted-foreground">
                    {search ? "Nenhum evento encontrado" : "Nenhum evento registrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-border px-6 py-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3ch] text-center">{page + 1}/{totalPages}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ======= SHEET DE DETALHES ======= */}
      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 md:!inset-y-0 md:!right-0 md:!left-auto md:!bottom-auto md:!h-full md:!w-[480px] md:!max-w-lg md:rounded-none">
          <div className="flex items-center justify-between p-4 pb-2 border-b border-border">
            <SheetTitle className="text-base font-semibold">Detalhes do Evento</SheetTitle>
          </div>
          {selectedEvent && (() => {
            const config = getEventConfig(selectedEvent.event_type);
            const Icon = config.icon;
            const origin = getOriginLabel(selectedEvent);
            const m = selectedEvent.metadata ?? {};
            const valor = formatBRL(m.total_price);

            return (
              <ScrollArea className="h-[calc(100%-60px)] p-4">
                <div className="space-y-4">
                  {/* Cabeçalho */}
                  <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{config.label}</p>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", origin.color)}>
                          {origin.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(selectedEvent.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {/* Identificação */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Identificação</p>
                    {selectedEvent.user_id ? (
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{selectedEvent.perfis?.nome || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{selectedEvent.perfis?.email || "—"}</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium italic text-muted-foreground">Lead sem conta</p>
                        {selectedEvent.lead_email && <p className="text-xs">{selectedEvent.lead_email}</p>}
                        {selectedEvent.lead_phone && <p className="text-xs text-muted-foreground">{selectedEvent.lead_phone}</p>}
                      </div>
                    )}
                  </div>

                  {/* Dados do evento */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Dados</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {valor && (
                        <div>
                          <p className="text-muted-foreground">Valor</p>
                          <p className="font-medium">{valor}</p>
                        </div>
                      )}
                      {m.plan_slug && (
                        <div>
                          <p className="text-muted-foreground">Plano</p>
                          <p className="font-medium">{m.plan_slug}</p>
                        </div>
                      )}
                      {m.payment_method && (
                        <div>
                          <p className="text-muted-foreground">Método</p>
                          <p className="font-medium">{m.payment_method}</p>
                        </div>
                      )}
                      {m.offer_id && (
                        <div>
                          <p className="text-muted-foreground">Oferta</p>
                          <p className="font-mono text-[10px] truncate">{m.offer_id}</p>
                        </div>
                      )}
                      {m.sale_id && (
                        <div>
                          <p className="text-muted-foreground">Venda</p>
                          <p className="font-mono text-[10px] truncate">{m.sale_id}</p>
                        </div>
                      )}
                      {m.checkout_id && (
                        <div>
                          <p className="text-muted-foreground">Checkout</p>
                          <p className="font-mono text-[10px] truncate">{m.checkout_id}</p>
                        </div>
                      )}
                      {m.pix_expires_at && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">PIX expira em</p>
                          <p className="font-medium">{format(new Date(m.pix_expires_at), "dd/MM HH:mm", { locale: ptBR })}</p>
                        </div>
                      )}
                      {m.pix_codigo && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Código PIX</p>
                          <p className="font-mono text-[10px] break-all bg-muted/50 rounded p-2 mt-1">{m.pix_codigo}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* JSON bruto */}
                  <details>
                    <summary className="text-[10px] uppercase tracking-wider text-muted-foreground cursor-pointer mb-1.5">
                      JSON bruto
                    </summary>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-auto max-h-[300px] whitespace-pre-wrap break-all mt-2">
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              </ScrollArea>
            );
          })()}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
