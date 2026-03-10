import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Search, ChevronRight, ArrowLeft, Activity,
  UserPlus, ShoppingCart, QrCode, ChevronLeft, Calendar,
  CreditCard, XCircle, AlertTriangle, Clock, Ban, X
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type EventRow = {
  id: string;
  user_id: string;
  event_type: string;
  metadata: any;
  created_at: string;
  perfis: {
    nome: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

type FilterTab = "todos" | "cadastros" | "compras" | "cancelamentos";

const FILTER_TABS: { key: FilterTab; label: string; icon: typeof Activity; types: string[] }[] = [
  { key: "todos", label: "Todos", icon: Activity, types: [] },
  { key: "cadastros", label: "Cadastros", icon: UserPlus, types: ["novo_cadastro"] },
  { key: "compras", label: "Compras", icon: ShoppingCart, types: ["compra_aprovada", "pix_gerado", "boleto_gerado"] },
  { key: "cancelamentos", label: "Cancelamentos", icon: XCircle, types: ["assinatura_cancelada", "assinatura_inadimplente", "pix_expirado", "boleto_expirado", "checkout_abandonado", "carrinho_abandonado"] },
];

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  novo_cadastro: { label: "Novo Cadastro", icon: UserPlus, color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  compra_aprovada: { label: "Compra Aprovada", icon: ShoppingCart, color: "bg-green-500/10 text-green-700 border-green-200" },
  pix_gerado: { label: "PIX Gerado", icon: QrCode, color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
  pix_expirado: { label: "PIX Expirado", icon: Clock, color: "bg-muted text-muted-foreground border-border" },
  boleto_gerado: { label: "Boleto Gerado", icon: CreditCard, color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
  boleto_expirado: { label: "Boleto Expirado", icon: Clock, color: "bg-muted text-muted-foreground border-border" },
  assinatura_cancelada: { label: "Cancelada", icon: XCircle, color: "bg-red-500/10 text-red-700 border-red-200" },
  assinatura_inadimplente: { label: "Inadimplente", icon: AlertTriangle, color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  checkout_abandonado: { label: "Checkout Abandonado", icon: Ban, color: "bg-muted text-muted-foreground border-border" },
  carrinho_abandonado: { label: "Carrinho Abandonado", icon: Ban, color: "bg-muted text-muted-foreground border-border" },
};

function getEventConfig(type: string) {
  return EVENT_TYPE_CONFIG[type] ?? { label: type, icon: Activity, color: "bg-muted text-muted-foreground border-border" };
}

export default function AdminEventos() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("todos");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*, perfis(nome, email, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setEvents((data as EventRow[]) || []);
    } catch (err) {
      console.error("Erro ao buscar eventos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const stats = useMemo(() => ({
    total: events.length,
    cadastros: events.filter(e => e.event_type === "novo_cadastro").length,
    compras: events.filter(e => ["compra_aprovada", "pix_gerado", "boleto_gerado"].includes(e.event_type)).length,
    cancelamentos: events.filter(e => ["assinatura_cancelada", "assinatura_inadimplente", "pix_expirado", "boleto_expirado", "checkout_abandonado", "carrinho_abandonado"].includes(e.event_type)).length,
  }), [events]);

  const filtered = useMemo(() => {
    const tab = FILTER_TABS.find(t => t.key === activeFilter)!;
    let list = events;
    if (tab.types.length > 0) list = events.filter(e => tab.types.includes(e.event_type));
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(ev =>
      ev.perfis?.nome?.toLowerCase().includes(s) ||
      ev.perfis?.email?.toLowerCase().includes(s) ||
      ev.event_type.toLowerCase().includes(s)
    );
  }, [events, activeFilter, search]);

  useEffect(() => { setPage(0); }, [activeFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getFilterCount = (key: FilterTab) => stats[key === "todos" ? "total" : key];

  const getMetaSummary = (ev: EventRow) => {
    const m = ev.metadata;
    if (!m || typeof m !== "object") return "—";
    if (m.plano) return m.plano;
    if (m.email) return m.email;
    if (m.metodo) return m.metodo;
    return "—";
  };

  if (loading) {
    return (
      <MainLayout pageTitle="Eventos" onBack={() => navigate("/admin")}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      pageTitle="Eventos"
      onBack={() => navigate("/admin")}
      headerRightContent={
        <span className="text-xs text-muted-foreground font-medium">{stats.total}</span>
      }
    >
      {/* ======= MOBILE ======= */}
      <div className="md:hidden px-4 py-3 space-y-3">
        <div className="grid grid-cols-4 gap-1.5">
          {FILTER_TABS.map(({ key, label, icon: Icon }) => {
            const count = getFilterCount(key);
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl p-2 transition-colors text-center",
                  isActive ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/40 hover:bg-muted/60"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="text-lg font-bold">{count}</span>
                <span className={cn("text-[10px]", isActive ? "text-primary font-medium" : "text-muted-foreground")}>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar nome, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 pr-9" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>


        <div className="space-y-0.5">
          {paginated.map((ev) => {
            const config = getEventConfig(ev.event_type);
            const Icon = config.icon;
            return (
              <button
                key={ev.id}
                className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg active:bg-muted/60 transition-colors border-b border-border/30 last:border-0"
                onClick={() => setSelectedEvent(ev)}
              >
                <Icon className={cn("h-4 w-4 shrink-0 text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{ev.perfis?.nome || ev.perfis?.email || "Usuário"}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(ev.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 shrink-0", config.color)}>
                  {config.label}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {search ? "Nenhum resultado encontrado" : "Nenhum evento"}
            </div>
          )}
        </div>

        {/* Bottom pagination mobile */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 pb-4">
            <p className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-xs text-muted-foreground min-w-[3ch] text-center">{page + 1}/{totalPages}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* ======= DESKTOP — fullscreen minimal ======= */}
      <div className="hidden md:flex flex-col flex-1 min-h-0">
        <div className="border-b border-border bg-card/50 px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold mr-2">Eventos</h1>

          <div className="flex items-center gap-1">
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

          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
            <span>{filtered.length > 0 ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)}` : "0"} de {filtered.length}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-6"></TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Usuário</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Detalhe</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Data</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((ev) => {
                const config = getEventConfig(ev.event_type);
                const Icon = config.icon;
                return (
                  <TableRow key={ev.id} className="cursor-pointer group" onClick={() => setSelectedEvent(ev)}>
                    <TableCell className="pl-6 py-2.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-sm font-medium truncate max-w-[200px] block">{ev.perfis?.nome || "Sem nome"}</span>
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-muted-foreground truncate max-w-[220px]">
                      {ev.perfis?.email || "—"}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color)}>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground truncate max-w-[160px]">
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
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-sm text-muted-foreground">
                    {search ? "Nenhum evento encontrado" : "Nenhum evento registrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl p-0 md:!inset-y-0 md:!right-0 md:!left-auto md:!bottom-auto md:!h-full md:!w-[480px] md:!max-w-lg md:rounded-none">
          <div className="flex items-center justify-between p-4 pb-2 border-b border-border">
            <SheetTitle className="text-base font-semibold">Detalhes do Evento</SheetTitle>
          </div>
          {selectedEvent && (
            <ScrollArea className="h-[calc(100%-60px)] p-4">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                  <Badge variant="outline" className={getEventConfig(selectedEvent.event_type).color}>
                    {getEventConfig(selectedEvent.event_type).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Usuário</p>
                  <p className="text-sm font-medium">{selectedEvent.perfis?.nome || "—"}</p>
                  <p className="text-xs text-muted-foreground">{selectedEvent.perfis?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Data</p>
                  <p className="text-sm">{format(new Date(selectedEvent.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Metadata</p>
                  <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-auto max-h-[300px] whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}
