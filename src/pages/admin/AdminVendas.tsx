import { useState, useEffect, useMemo, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Search, QrCode, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, ArrowLeft,
  ShoppingCart, User, Calendar, DollarSign, FileText, Copy, Check,
  MessageCircle, ChevronLeft, X, Filter, Ban, RotateCcw, CalendarDays, Send,
} from "lucide-react";
import { toast } from "sonner";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AdminListContainer, AdminListItem, AdminHeader, AdminPagination } from "@/components/admin/AdminListComponents";
import type { DateRange } from "react-day-picker";





type WebhookLog = {
  id: string;
  received_at: string;
  event: string | null;
  status: string | null;
  email: string | null;
  email_masked: string | null;
  phone: string | null;
  phone_masked: string | null;
  checkout_id: string | null;
  sale_id: string | null;
  payment_method: string | null;
  purchase_type: string | null;
  authorized_method: string | null;
  process_result: string | null;
  error: string | null;
  processed: boolean;
  raw_payload: any;
  raw_payload_safe: any;
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

// Mapa do nome bruto da Kirvano para o event_trigger interno usado em message_templates.
// Espelha KIRVANO_EVENT_MAP de supabase/functions/handle-kirvano-webhook/index.ts.
const KIRVANO_TO_TRIGGER: Record<string, string> = {
  SALE_APPROVED: "compra_aprovada",
  SALE_REFUSED: "compra_recusada",
  SALE_REFUNDED: "compra_reembolsada",
  SALE_CHARGEBACK: "compra_chargeback",
  PIX_GENERATED: "pix_gerado",
  PIX_EXPIRED: "pix_expirado",
  BANK_SLIP_GENERATED: "boleto_gerado",
  BANK_SLIP_EXPIRED: "boleto_expirado",
  ABANDONED_CART: "carrinho_abandonado",
  CHECKOUT_ABANDONED: "checkout_abandonado",
  SUBSCRIPTION_RENEWED: "assinatura_renovada",
  SUBSCRIPTION_CANCELED: "assinatura_cancelada",
  SUBSCRIPTION_EXPIRED: "assinatura_expirada",
  SUBSCRIPTION_OVERDUE: "assinatura_inadimplente",
  SUBSCRIPTION_REACTIVATED: "assinatura_reativada",
};

function getEventInfo(event: string | null) {
  if (!event) return { label: "Desconhecido", color: "bg-muted text-muted-foreground border-border" };
  return EVENT_LABELS[event] ?? { label: event, color: "bg-muted text-muted-foreground border-border" };
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
      // Admin reads the base table directly (RLS já restringe a admin) para ter
      // acesso a nome/email/telefone/raw_payload completos. A view _masked esconde
      // campos PII e não serve para esta tela operacional.
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

  if (loading && logs.length === 0) {
    return (
      <AdminLayout pageTitle="Vendas">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Vendas">
      <div className="flex flex-col flex-1 min-h-0 bg-background">
        <AdminHeader 
          title="Vendas"
          search={search}
          onSearchChange={setSearch}
          onRefresh={fetchLogs}
          loading={loading}
          dateFilter={{
            range: dateRange,
            onRangeChange: setDateRange,
            isActive: hasDateFilter,
            onClear: () => setDateRange(undefined)
          }}
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
              loading={loading && logs.length === 0}
              emptyMessage="Nenhuma venda encontrada"
            >
              {paginatedSales.map(({ key, latest }) => {
                const evInfo = getEventInfo(latest.event);
                const name = customerName(latest);
                const price = totalPrice(latest);
                
                return (
                  <AdminListItem
                    key={key}
                    onClick={() => setSelectedLog(latest)}
                    title={name || latest.email || "Sem identificação"}
                    subtitle={latest.email || "—"}
                    badge={{
                      text: evInfo.label,
                      color: evInfo.color,
                      icon: evInfo.label.includes('Aprovada') ? CheckCircle2 : Clock
                    }}
                    timestamp={format(new Date(latest.received_at), "HH:mm", { locale: ptBR })}
                    rightContent={price && (
                      <span className="text-[10px] font-bold text-foreground/80 tabular-nums">
                        {price}
                      </span>
                    )}
                  />
                );
              })}
            </AdminListContainer>

            <AdminPagination 
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={filteredSales.length}
              totalPages={totalPages}
              onPageChange={setPage}
              hasNextPage={page < totalPages - 1}
              hasPrevPage={page > 0}
            />
          </div>
        </div>
      </div>

      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl p-0 md:!inset-y-0 md:!right-0 md:!left-auto md:!bottom-auto md:!h-full md:!w-[480px] md:!max-w-lg md:rounded-none">
          <div className="flex items-center justify-between p-4 pb-2 border-b border-border">
            <SheetTitle className="text-base font-semibold">Detalhes da Venda</SheetTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSelectedLog(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {selectedLog && (
            <SaleDetail
              saleKey={selectedLog.sale_id || selectedLog.checkout_id || selectedLog.id}
              allLogs={logs}
            />
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
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
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [recentlyDispatched, setRecentlyDispatched] = useState<Set<string>>(new Set());
  const [confirmEvent, setConfirmEvent] = useState<WebhookLog | null>(null);

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

  const dispatchEventTemplate = async (ev: WebhookLog) => {
    const rawEvent = ev.event || "";
    const trigger = KIRVANO_TO_TRIGGER[rawEvent];
    if (!trigger) {
      toast.error("Este evento não tem trigger mapeado.");
      return;
    }

    const evPayload = ev.raw_payload || {};
    const evCustomer = evPayload.customer || {};
    const evPayment = evPayload.payment || {};
    const evProducts = Array.isArray(evPayload.products) ? evPayload.products : [];
    const phone = ev.phone || evCustomer.phone_number;

    if (!phone) {
      toast.error("Esta venda não tem telefone.");
      return;
    }

    setDispatchingId(ev.id);
    try {
      // Verifica se há template ativo
      const { data: tpls, error: tplErr } = await supabase
        .from("message_templates" as any)
        .select("id")
        .eq("event_trigger", trigger)
        .eq("is_active", true)
        .limit(1);
      if (tplErr) throw tplErr;
      if (!tpls || tpls.length === 0) {
        toast.error(`Nenhum template ativo para "${trigger}".`);
        return;
      }

      // Tenta resolver user_id pelo email
      let userId: string | null = null;
      if (ev.email) {
        const { data: perfil } = await supabase
          .from("perfis")
          .select("id")
          .eq("email", ev.email)
          .maybeSingle();
        userId = (perfil as any)?.id ?? null;
      }

      // Resolve link de novo pix via offer_id do primeiro produto
      const firstProduct = evProducts[0] || {};
      const offerId = firstProduct.offer_id;
      const mapped = offerId ? planMap[offerId] : null;

      const variables: Record<string, any> = {
        nome: evCustomer.name || "",
        telefone: phone,
        email: ev.email || "",
        produto: firstProduct.name || firstProduct.offer_name || "",
        plano_nome: mapped?.planName || firstProduct.name || "",
        total_price: evPayload.total_price || "",
        sale_id: ev.sale_id || "",
        checkout_id: ev.checkout_id || "",
      };
      if (evPayment.qrcode) variables.pix_codigo = evPayment.qrcode;
      if (mapped?.checkoutLink) variables.link_novo_pix = mapped.checkoutLink;

      const { data: count, error: rpcErr } = await supabase.rpc(
        "queue_templates_for_event" as any,
        {
          p_event_trigger: trigger,
          p_phone: phone,
          p_name: evCustomer.name || "",
          p_user_id: userId,
          p_variables: variables,
          p_priority: 1,
        }
      );
      if (rpcErr) throw rpcErr;

      const n = (count as number) ?? 0;
      if (n > 0) {
        toast.success(`${n} mensagem(ns) enfileirada(s).`);
        setRecentlyDispatched((s) => new Set(s).add(ev.id));
        setTimeout(() => {
          setRecentlyDispatched((s) => {
            const next = new Set(s);
            next.delete(ev.id);
            return next;
          });
        }, 5000);
      } else {
        toast.info("Nenhuma mensagem enfileirada (filtro/dedupe).");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao disparar.");
    } finally {
      setDispatchingId(null);
      setConfirmEvent(null);
    }
  };

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
            <div className="flex justify-between"><span className="text-muted-foreground">Pagamento</span><span>{latest.payment_method || "—"}</span></div>
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
              const trigger = ev.event ? KIRVANO_TO_TRIGGER[ev.event] : null;
              const phone = latest.phone || customer.phone_number;
              const canDispatch = !!trigger && !!phone;
              const isLoading = dispatchingId === ev.id;
              const justDispatched = recentlyDispatched.has(ev.id);
              return (
                <div key={ev.id} className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-background border-2 border-primary" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", evInfo.color)}>
                        {evInfo.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(ev.received_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                    {ev.error && <p className="text-xs text-destructive">Erro: {ev.error}</p>}
                    {canDispatch && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        disabled={isLoading || justDispatched}
                        onClick={() => setConfirmEvent(ev)}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : justDispatched ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        {justDispatched ? "Enviado" : "Enviar mensagem do evento"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AlertDialog open={!!confirmEvent} onOpenChange={(open) => !open && setConfirmEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disparar template do evento?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmEvent && (
                <>
                  Evento: <strong>{getEventInfo(confirmEvent.event).label}</strong><br />
                  Para: <strong>{customer.name || latest.email || latest.phone}</strong><br />
                  Telefone: <span className="font-mono">{latest.phone || customer.phone_number}</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmEvent && dispatchEventTemplate(confirmEvent)}>
              Disparar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
}
