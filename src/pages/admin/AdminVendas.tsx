import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Search, CreditCard, QrCode, Barcode, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, ArrowLeft,
  ShoppingCart, User, Calendar, DollarSign, FileText, Copy, Check,
  MessageCircle, ChevronLeft, X, CalendarDays
} from "lucide-react";
import { toast } from "sonner";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

type WebhookLog = {
  id: string;
  received_at: string;
  event: string | null;
  status: string | null;
  email: string | null;
  phone: string | null;
  checkout_id: string | null;
  sale_id: string | null;
  payment_method: string | null;
  purchase_type: string | null;
  authorized_method: string | null;
  process_result: string | null;
  error: string | null;
  processed: boolean;
  raw_payload: any;
};

type FilterTab = "todos" | "aprovadas" | "pendentes" | "canceladas";

const FILTER_TABS: { key: FilterTab; label: string; icon: typeof CheckCircle2 }[] = [
  { key: "todos", label: "Todos", icon: ShoppingCart },
  { key: "aprovadas", label: "Aprovadas", icon: CheckCircle2 },
  { key: "pendentes", label: "Pendentes", icon: Clock },
  { key: "canceladas", label: "Canceladas", icon: XCircle },
];

const APPROVED_EVENTS = ["SALE_APPROVED", "SUBSCRIPTION_RENEWED", "SUBSCRIPTION_REACTIVATED"];
const PENDING_EVENTS = ["PIX_GENERATED", "BANK_SLIP_GENERATED"];
const CANCELED_EVENTS = ["SALE_REFUSED", "SALE_CHARGEBACK", "SALE_REFUNDED", "BANK_SLIP_EXPIRED", "PIX_EXPIRED", "SUBSCRIPTION_CANCELED", "SUBSCRIPTION_OVERDUE", "SUBSCRIPTION_EXPIRED"];

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  SALE_APPROVED: { label: "Aprovada", color: "bg-green-500/10 text-green-700 border-green-200" },
  SALE_REFUSED: { label: "Recusada", color: "bg-red-500/10 text-red-700 border-red-200" },
  SALE_CHARGEBACK: { label: "Chargeback", color: "bg-red-500/10 text-red-700 border-red-200" },
  SALE_REFUNDED: { label: "Reembolso", color: "bg-red-500/10 text-red-700 border-red-200" },
  BANK_SLIP_GENERATED: { label: "Boleto Gerado", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
  BANK_SLIP_EXPIRED: { label: "Boleto Expirado", color: "bg-muted text-muted-foreground border-border" },
  PIX_GENERATED: { label: "PIX Gerado", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
  PIX_EXPIRED: { label: "PIX Expirado", color: "bg-muted text-muted-foreground border-border" },
  SUBSCRIPTION_CANCELED: { label: "Cancelada", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  SUBSCRIPTION_OVERDUE: { label: "Inadimplente", color: "bg-red-500/10 text-red-700 border-red-200" },
  SUBSCRIPTION_RENEWED: { label: "Renovada", color: "bg-green-500/10 text-green-700 border-green-200" },
  SUBSCRIPTION_REACTIVATED: { label: "Reativada", color: "bg-green-500/10 text-green-700 border-green-200" },
  SUBSCRIPTION_TRIAL_STARTED: { label: "Teste Iniciado", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  SUBSCRIPTION_TRIAL_ENDED: { label: "Teste Encerrado", color: "bg-muted text-muted-foreground border-border" },
  CHECKOUT_ABANDONED: { label: "Checkout Abandonado", color: "bg-muted text-muted-foreground border-border" },
  ABANDONED_CART: { label: "Carrinho Abandonado", color: "bg-muted text-muted-foreground border-border" },
  SUBSCRIPTION_EXPIRED: { label: "Expirada", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
};

const RESULT_LABELS: Record<string, { label: string; icon: typeof CheckCircle2 }> = {
  updated_user_activated: { label: "Assinatura ativada", icon: CheckCircle2 },
  created_user_activated: { label: "Conta criada + ativada", icon: CheckCircle2 },
  canceled_removed_role: { label: "Cancelado", icon: XCircle },
  delinquent_removed_role: { label: "Inadimplente", icon: AlertTriangle },
  ignored_non_paid: { label: "Ignorado (pendente)", icon: Clock },
  missing_email: { label: "Sem email", icon: AlertTriangle },
  missing_offer_id: { label: "Sem offer_id", icon: AlertTriangle },
  offer_mapping_not_found: { label: "Oferta não mapeada", icon: AlertTriangle },
  no_profile_to_update: { label: "Perfil não encontrado", icon: AlertTriangle },
};

function PaymentMethodIcon({ method }: { method: string | null }) {
  if (!method) return <ShoppingCart className="h-4 w-4 text-muted-foreground" />;
  const m = method.toUpperCase();
  if (m.includes("PIX")) return <QrCode className="h-4 w-4 text-green-600" />;
  if (m.includes("CREDIT") || m.includes("CARD")) return <CreditCard className="h-4 w-4 text-blue-600" />;
  if (m.includes("BANK") || m.includes("SLIP") || m.includes("BOLETO")) return <Barcode className="h-4 w-4 text-yellow-600" />;
  return <ShoppingCart className="h-4 w-4 text-muted-foreground" />;
}

function getEventInfo(event: string | null) {
  if (!event) return { label: "Desconhecido", color: "bg-muted text-muted-foreground border-border" };
  return EVENT_LABELS[event] ?? { label: event, color: "bg-muted text-muted-foreground border-border" };
}

function getResultInfo(result: string | null) {
  if (!result) return null;
  return RESULT_LABELS[result] ?? { label: result, icon: FileText };
}

type SaleGroup = { key: string; events: WebhookLog[]; latest: WebhookLog };

export default function AdminVendas() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("todos");
  const [page, setPage] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const PAGE_SIZE = 25;

  const hasDateFilter = !!(dateRange?.from);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      await supabase.rpc("audit_webhook_access");
      const { data, error } = await supabase
        .from("kirvano_webhook_logs")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setLogs((data as WebhookLog[]) || []);
    } catch (err) {
      console.error("Erro ao buscar logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const sales = useMemo(() => {
    const salesMap = new Map<string, WebhookLog[]>();
    for (const log of logs) {
      const key = log.sale_id || log.checkout_id;
      if (key) {
        if (!salesMap.has(key)) salesMap.set(key, []);
        salesMap.get(key)!.push(log);
      }
    }
    const result = [...salesMap.entries()].map(([key, events]) => {
      events.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
      return { key, events, latest: events[0] };
    });
    result.sort((a, b) => new Date(b.latest.received_at).getTime() - new Date(a.latest.received_at).getTime());
    return result;
  }, [logs]);

  const stats = useMemo(() => ({
    total: sales.length,
    aprovadas: sales.filter(s => APPROVED_EVENTS.includes(s.latest.event || "")).length,
    pendentes: sales.filter(s => PENDING_EVENTS.includes(s.latest.event || "")).length,
    canceladas: sales.filter(s => CANCELED_EVENTS.includes(s.latest.event || "")).length,
  }), [sales]);

  const filteredSales = useMemo(() => {
    let list = sales;
    if (activeFilter === "aprovadas") list = sales.filter(s => APPROVED_EVENTS.includes(s.latest.event || ""));
    else if (activeFilter === "pendentes") list = sales.filter(s => PENDING_EVENTS.includes(s.latest.event || ""));
    else if (activeFilter === "canceladas") list = sales.filter(s => CANCELED_EVENTS.includes(s.latest.event || ""));

    if (dateRange?.from) {
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      list = list.filter(({ latest }) => {
        const d = new Date(latest.received_at);
        return isWithinInterval(d, { start: from, end: to });
      });
    }

    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(({ latest }) =>
      latest.email?.toLowerCase().includes(s) ||
      latest.phone?.includes(s) ||
      latest.sale_id?.toLowerCase().includes(s) ||
      latest.checkout_id?.toLowerCase().includes(s) ||
      latest.raw_payload?.customer?.name?.toLowerCase()?.includes(s)
    );
  }, [sales, activeFilter, search, dateRange]);

  useEffect(() => { setPage(0); }, [activeFilter, search, dateRange]);

  const totalPages = Math.ceil(filteredSales.length / PAGE_SIZE);
  const paginatedSales = filteredSales.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const customerName = (log: WebhookLog) => log.raw_payload?.customer?.name || null;
  const totalPrice = (log: WebhookLog) => log.raw_payload?.total_price || null;

  const getFilterCount = (key: FilterTab) => stats[key === "todos" ? "total" : key];

  if (loading) {
    return (
      <MainLayout pageTitle="Vendas" onBack={() => navigate("/admin")}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      pageTitle="Vendas"
      onBack={() => navigate("/admin")}
      headerRightContent={
        <button onClick={fetchLogs} disabled={loading} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      }
    >
      {/* ======= MOBILE ======= */}
      <div className="md:hidden px-4 py-3 space-y-3">
        {/* Stats row */}
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar email, telefone, nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 pr-9" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sales list */}
        <div className="space-y-0.5">
          {paginatedSales.map(({ key, latest }) => {
            const evInfo = getEventInfo(latest.event);
            const name = customerName(latest);
            const price = totalPrice(latest);
            return (
              <button
                key={key}
                className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg active:bg-muted/60 transition-colors border-b border-border/30 last:border-0"
                onClick={() => setSelectedLog(latest)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{name || latest.email || "Sem identificação"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 inline-flex", evInfo.color)}>
                      {evInfo.label}
                    </Badge>
                    {price && (
                      <span className="text-[11px] font-semibold tabular-nums text-foreground/70 ml-auto">
                        {price}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </button>
            );
          })}
          {filteredSales.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {search ? "Nenhum resultado encontrado" : "Nenhuma venda"}
            </div>
          )}
        </div>

        {/* Bottom pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 pb-4">
            <p className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredSales.length)} de {filteredSales.length}
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
        {/* Toolbar */}
        <div className="border-b border-border bg-card/50 px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold mr-2">Vendas</h1>

          {/* Filter pills */}
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

          {/* Search */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm bg-background" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Refresh */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>

        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-6"></TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cliente</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email / Telefone</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Valor</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resultado</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Data</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Eventos</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSales.map(({ key, events, latest }) => {
                const evInfo = getEventInfo(latest.event);
                const name = customerName(latest);
                const price = totalPrice(latest);
                const resultInfo = getResultInfo(latest.process_result);
                return (
                  <TableRow key={key} className="cursor-pointer group" onClick={() => setSelectedLog(latest)}>
                    <TableCell className="pl-6 py-2.5">
                      <PaymentMethodIcon method={latest.payment_method} />
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-sm font-medium truncate max-w-[200px] block">{name || "Sem nome"}</span>
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-muted-foreground truncate max-w-[220px]">
                      {latest.email || latest.phone || "—"}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-sm font-medium tabular-nums">{price || "—"}</span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", evInfo.color)}>
                        {evInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">
                      {resultInfo ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <resultInfo.icon className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[140px]">{resultInfo.label}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground tabular-nums">
                      {format(new Date(latest.received_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground text-center tabular-nums">
                      {events.length}
                    </TableCell>
                    <TableCell className="py-2.5 pr-4">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16 text-sm text-muted-foreground">
                    {search ? "Nenhuma venda encontrada" : "Nenhuma venda registrada"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Bottom pagination desktop */}
        {totalPages > 1 && (
          <div className="border-t border-border px-6 py-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredSales.length)} de {filteredSales.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <span className="text-xs text-muted-foreground min-w-[3ch] text-center">{page + 1}/{totalPages}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl p-0 md:!inset-y-0 md:!right-0 md:!left-auto md:!bottom-auto md:!h-full md:!w-[480px] md:!max-w-lg md:rounded-none">
          <div className="flex items-center justify-between p-4 pb-2 border-b border-border">
            <SheetTitle className="text-base font-semibold">Detalhes da Venda</SheetTitle>
          </div>
          {selectedLog && (
            <SaleDetail
              saleKey={selectedLog.sale_id || selectedLog.checkout_id || selectedLog.id}
              allLogs={logs}
            />
          )}
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}

function CopyableField({ label, value }: { label: string; value: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado!`);
    } catch {
      toast.error("Erro ao copiar");
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-between w-full group hover:bg-accent/50 -mx-1 px-1 rounded transition-colors cursor-pointer"
      title={`Copiar ${label}`}
    >
      <span className="text-muted-foreground truncate">{value}</span>
      <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
    </button>
  );
}

function PixCodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <QrCode className="h-4 w-4" /> Código PIX
      </h3>
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <p className="text-[11px] font-mono break-all leading-relaxed text-muted-foreground select-all">
          {code}
        </p>
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado!" : "Copiar código PIX"}
        </Button>
      </div>
    </div>
  );
}

function SaleDetail({ saleKey, allLogs }: { saleKey: string; allLogs: WebhookLog[] }) {
  const [planMap, setPlanMap] = useState<Record<string, { planName: string; checkoutLink: string | null }>>({});

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

  const events = allLogs
    .filter((l) => l.sale_id === saleKey || l.checkout_id === saleKey || l.id === saleKey)
    .sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime());

  const latest = events[events.length - 1];
  if (!latest) return null;

  const payload = latest.raw_payload || {};
  const customer = payload.customer || {};
  const products = Array.isArray(payload.products) ? payload.products : [];
  const payment = payload.payment || {};

  return (
    <ScrollArea className="h-[calc(100vh-80px)]">
      <div className="p-4 space-y-5">
        {/* Customer Info */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4" /> Cliente
          </h3>
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
            {customer.name && <CopyableField label="Nome" value={customer.name} />}
            {latest.email && <CopyableField label="Email" value={latest.email} />}
            {latest.phone && <CopyableField label="Telefone" value={latest.phone} />}
            {customer.document && <p className="text-muted-foreground text-xs">CPF: {customer.document}</p>}
            {(() => {
              const phone = latest.phone || customer.phone_number;
              if (!phone) return null;
              const digits = phone.replace(/\D/g, "");
              const waNumber = digits.startsWith("55") ? digits : `55${digits}`;
              return (
                <Button variant="outline" size="sm" className="w-full gap-2 mt-2" asChild>
                  <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Enviar WhatsApp
                  </a>
                </Button>
              );
            })()}
          </div>
        </div>

        {/* Sale Info */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Venda
          </h3>
          <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Valor</span><span className="font-medium">{payload.total_price || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span>{payload.type === "RECURRING" ? "Assinatura" : "Pagamento único"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pagamento</span><span className="flex items-center gap-1.5"><PaymentMethodIcon method={latest.payment_method} />{latest.payment_method || "—"}</span></div>
            {payment.brand && <div className="flex justify-between"><span className="text-muted-foreground">Bandeira</span><span className="capitalize">{payment.brand}</span></div>}
            {payment.installments && <div className="flex justify-between"><span className="text-muted-foreground">Parcelas</span><span>{payment.installments}x</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Sale ID</span><span className="text-xs font-mono">{latest.sale_id || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Checkout ID</span><span className="text-xs font-mono">{latest.checkout_id || "—"}</span></div>
          </div>
        </div>

        {/* PIX Code */}
        {(() => {
          const pixEvent = events.find(e => e.event === "PIX_GENERATED");
          const pixCode = pixEvent?.raw_payload?.payment?.qrcode;
          const pixExpires = pixEvent?.raw_payload?.payment?.expires_at;
          if (!pixCode) return null;
          return (
            <div className="space-y-2">
              <PixCodeBlock code={pixCode} />
              {pixExpires && (
                <p className="text-[11px] text-muted-foreground ml-1">
                  Expira em: {format(new Date(pixExpires.replace(" ", "T")), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          );
        })()}

        {/* Products */}
        {products.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Produtos
            </h3>
            <div className="space-y-2">
              {products.map((p: any, i: number) => {
                const mapped = p.offer_id ? planMap[p.offer_id] : null;
                return (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.name || p.offer_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Oferta: <span className="font-mono">{p.offer_id}</span></p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium">{p.price}</p>
                        {p.is_order_bump && <Badge variant="secondary" className="text-[10px] mt-0.5">bump</Badge>}
                      </div>
                    </div>
                    {mapped && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">Plano: {mapped.planName}</span>
                        </div>
                        {mapped.checkoutLink && (
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={async () => {
                            try { await navigator.clipboard.writeText(mapped.checkoutLink!); toast.success("Link de checkout copiado!"); } catch { toast.error("Erro ao copiar"); }
                          }}>
                            <Copy className="h-3 w-3" />
                            Copiar link
                          </Button>
                        )}
                      </div>
                    )}
                    {!mapped && p.offer_id && (
                      <p className="text-[11px] text-orange-600 pt-1 border-t border-border/50">⚠ Oferta não mapeada a nenhum plano</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Plan Info */}
        {payload.plan && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Plano
            </h3>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span>{payload.plan.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Frequência</span><span>{payload.plan.charge_frequency}</span></div>
              {payload.plan.next_charge_date && (
                <div className="flex justify-between"><span className="text-muted-foreground">Próxima cobrança</span><span>{format(new Date(payload.plan.next_charge_date.replace(" ", "T")), "dd/MM/yyyy", { locale: ptBR })}</span></div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Event Timeline */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Linha do Tempo ({events.length} eventos)
          </h3>
          <div className="relative pl-4 border-l-2 border-border space-y-4">
            {events.map((ev) => {
              const evInfo = getEventInfo(ev.event);
              const resultInfo = getResultInfo(ev.process_result);
              return (
                <div key={ev.id} className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-background border-2 border-primary" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", evInfo.color)}>
                        {evInfo.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(ev.received_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                    {resultInfo && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <resultInfo.icon className="h-3 w-3" />
                        {resultInfo.label}
                      </div>
                    )}
                    {ev.error && <p className="text-xs text-destructive">Erro: {ev.error}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
