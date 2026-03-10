import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Search, ChevronRight, ArrowLeft, Activity,
  UserPlus, ShoppingCart, QrCode, ChevronLeft, Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  novo_cadastro: { label: "Novo Cadastro", icon: UserPlus, color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  nova_venda: { label: "Nova Venda", icon: ShoppingCart, color: "bg-green-500/10 text-green-700 border-green-200" },
  pix_gerado: { label: "PIX Gerado", icon: QrCode, color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
};

function getEventConfig(type: string) {
  return EVENT_TYPE_CONFIG[type] ?? { label: type, icon: Activity, color: "bg-muted text-muted-foreground border-border" };
}

export default function AdminEventos() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

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
  useEffect(() => { setPage(1); }, [search, typeFilter]);

  const filtered = events.filter((ev) => {
    if (typeFilter !== "all" && ev.event_type !== typeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        ev.perfis?.nome?.toLowerCase().includes(s) ||
        ev.perfis?.email?.toLowerCase().includes(s) ||
        ev.event_type.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Unique event types for filter
  const uniqueTypes = [...new Set(events.map(e => e.event_type))];

  return (
    <MainLayout pageTitle="Eventos" onBack={() => navigate("/admin")} hideBottomNav>
      <div className="px-4 py-3 md:container-senior md:py-8 space-y-3 md:space-y-6">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold truncate">Eventos</h1>
            <p className="text-sm text-muted-foreground">Timeline de eventos por lead</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => {
            const count = events.filter(e => e.event_type === type).length;
            const Icon = config.icon;
            return (
              <Card key={type} className="border-0 shadow-none md:border md:shadow-sm bg-muted/40 md:bg-card">
                <CardContent className="p-2.5 md:p-4 text-center">
                  <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary mx-auto mb-0.5 md:mb-1" />
                  <p className="text-base md:text-2xl font-bold">{count}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{config.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm h-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px] md:w-[180px] text-xs md:text-sm h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {getEventConfig(type).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Nenhum evento encontrado
          </div>
        ) : (
          <div className="space-y-1.5 md:space-y-2">
            {paginated.map((ev) => {
              const config = getEventConfig(ev.event_type);
              const Icon = config.icon;
              return (
                <button
                  key={ev.id}
                  className="w-full text-left rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors p-3"
                  onClick={() => setSelectedEvent(ev)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {ev.perfis?.nome || ev.perfis?.email || "Usuário"}
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${config.color}`}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(ev.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </button>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 pb-2">
                <p className="text-[11px] text-muted-foreground">
                  {filtered.length} eventos · Pág. {page}/{totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

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
      </div>
    </MainLayout>
  );
}
