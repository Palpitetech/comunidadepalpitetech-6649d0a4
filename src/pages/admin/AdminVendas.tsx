import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Search, CreditCard, QrCode, Barcode, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, ArrowLeft,
  ShoppingCart, User, Calendar, DollarSign, FileText, Copy, Check,
  MessageCircle, ChevronLeft, Repeat
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  SALE_APPROVED: { label: "Venda Aprovada", color: "bg-green-500/10 text-green-700 border-green-200" },
  SALE_REFUSED: { label: "Venda Recusada", color: "bg-red-500/10 text-red-700 border-red-200" },
  SALE_CHARGEBACK: { label: "Estorno / Chargeback", color: "bg-red-500/10 text-red-700 border-red-200" },
  SALE_REFUNDED: { label: "Reembolso", color: "bg-red-500/10 text-red-700 border-red-200" },
  BANK_SLIP_GENERATED: { label: "Boleto Gerado", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
  BANK_SLIP_EXPIRED: { label: "Boleto Expirado", color: "bg-muted text-muted-foreground border-border" },
  PIX_GENERATED: { label: "PIX Gerado", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
  PIX_EXPIRED: { label: "PIX Expirado", color: "bg-muted text-muted-foreground border-border" },
  SUBSCRIPTION_CANCELED: { label: "Assinatura Cancelada", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  SUBSCRIPTION_OVERDUE: { label: "Assinatura Inadimplente", color: "bg-red-500/10 text-red-700 border-red-200" },
  SUBSCRIPTION_RENEWED: { label: "Assinatura Renovada", color: "bg-green-500/10 text-green-700 border-green-200" },
  SUBSCRIPTION_REACTIVATED: { label: "Assinatura Reativada", color: "bg-green-500/10 text-green-700 border-green-200" },
  SUBSCRIPTION_TRIAL_STARTED: { label: "Período de Teste Iniciado", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  SUBSCRIPTION_TRIAL_ENDED: { label: "Período de Teste Encerrado", color: "bg-muted text-muted-foreground border-border" },
  CHECKOUT_ABANDONED: { label: "Checkout Abandonado", color: "bg-muted text-muted-foreground border-border" },
  ABANDONED_CART: { label: "Carrinho Abandonado", color: "bg-muted text-muted-foreground border-border" },
  SUBSCRIPTION_EXPIRED: { label: "Assinatura Expirada", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
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

export default function AdminVendas() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
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

  const filtered = (() => {
    // Reset page when filters change is handled via useEffect below
    return logs.filter((log) => {
      if (eventFilter !== "all" && log.event !== eventFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          log.email?.toLowerCase().includes(s) ||
          log.phone?.includes(s) ||
          log.sale_id?.toLowerCase().includes(s) ||
          log.checkout_id?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  })();

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, eventFilter]);

  // Group by sale_id
  const salesMap = new Map<string, WebhookLog[]>();
  const orphans: WebhookLog[] = [];
  for (const log of filtered) {
    const key = log.sale_id || log.checkout_id;
    if (key) {
      if (!salesMap.has(key)) salesMap.set(key, []);
      salesMap.get(key)!.push(log);
    } else {
      orphans.push(log);
    }
  }

  // Sort each group by date and get latest status
  const sales = [...salesMap.entries()].map(([key, events]) => {
    events.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
    return { key, events, latest: events[0] };
  });

  // Sort sales by latest event date
  sales.sort((a, b) => new Date(b.latest.received_at).getTime() - new Date(a.latest.received_at).getTime());

  const totalAprovadas = logs.filter(l => l.event === "SALE_APPROVED").length;

  const totalPages = Math.max(1, Math.ceil(sales.length / PAGE_SIZE));
  const paginatedSales = sales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalPendentes = logs.filter(l => ["PIX_GENERATED", "BANK_SLIP_GENERATED"].includes(l.event || "")).length;
  const totalCanceladas = logs.filter(l => ["SALE_REFUSED", "SALE_CHARGEBACK", "BANK_SLIP_EXPIRED", "PIX_EXPIRED"].includes(l.event || "")).length;

  const customerName = (log: WebhookLog) => log.raw_payload?.customer?.name || null;
  const totalPrice = (log: WebhookLog) => log.raw_payload?.total_price || null;

  // Recorrências: agrupar por email, contar SALE_APPROVED de tipo RECURRING
  const recorrenciasMap = new Map<string, { name: string; email: string; phone: string | null; approvedCount: number; totalEvents: number; lastPayment: string; purchaseType: string }>();
  for (const log of logs) {
    const email = log.email?.toLowerCase();
    if (!email) continue;
    const isRecurring = log.raw_payload?.type === "RECURRING" || log.raw_payload?.purchase_type === "RECURRING" || log.purchase_type === "RECURRING";
    if (!isRecurring) continue;
    
    if (!recorrenciasMap.has(email)) {
      recorrenciasMap.set(email, {
        name: log.raw_payload?.customer?.name || email,
        email,
        phone: log.phone,
        approvedCount: 0,
        totalEvents: 0,
        lastPayment: log.received_at,
        purchaseType: log.raw_payload?.plan?.charge_frequency || "Recorrente",
      });
    }
    const entry = recorrenciasMap.get(email)!;
    entry.totalEvents++;
    if (log.event === "SALE_APPROVED") {
      entry.approvedCount++;
    }
    if (new Date(log.received_at) > new Date(entry.lastPayment)) {
      entry.lastPayment = log.received_at;
      if (log.raw_payload?.customer?.name) entry.name = log.raw_payload.customer.name;
      if (log.phone) entry.phone = log.phone;
    }
  }
  const recorrencias = [...recorrenciasMap.values()]
    .filter(r => r.approvedCount > 0)
    .sort((a, b) => b.approvedCount - a.approvedCount);

  return (
    <MainLayout>
      <div className="container-senior py-4 md:py-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold truncate">Vendas Kirvano</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Histórico de webhooks recebidos</p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-lg md:text-2xl font-bold">{totalAprovadas}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Aprovadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <Clock className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
              <p className="text-lg md:text-2xl font-bold">{totalPendentes}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <p className="text-lg md:text-2xl font-bold">{totalCanceladas}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Canceladas</p>
            </CardContent>
          </Card>
        </div>

        {/* Recorrências */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <button
              onClick={() => setShowRecorrencias(!showRecorrencias)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Recorrências</span>
                <Badge variant="secondary" className="text-[10px]">{recorrencias.length} clientes</Badge>
              </div>
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showRecorrencias ? "rotate-90" : ""}`} />
            </button>
            {showRecorrencias && (
              <div className="mt-3 space-y-2">
                {recorrencias.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma recorrência encontrada</p>
                ) : (
                  <>
                    <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground font-medium px-1 pb-1 border-b border-border">
                      <span>Cliente</span>
                      <span className="text-center">Pagamentos</span>
                      <span className="text-right">Último</span>
                    </div>
                    {recorrencias.map((r) => (
                      <div key={r.email} className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center px-1 py-1.5 rounded hover:bg-accent/50 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{r.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5 bg-green-500/10 text-green-700 border-green-200">
                          {r.approvedCount}x
                        </Badge>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(r.lastPayment), "dd/MM/yy", { locale: ptBR })}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, telefone, venda..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[140px] md:w-[180px] text-sm">
              <SelectValue placeholder="Filtro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="SALE_APPROVED">Venda Aprovada</SelectItem>
              <SelectItem value="PIX_GENERATED">PIX Gerado</SelectItem>
              <SelectItem value="PIX_EXPIRED">PIX Expirado</SelectItem>
              <SelectItem value="BANK_SLIP_GENERATED">Boleto Gerado</SelectItem>
              <SelectItem value="BANK_SLIP_EXPIRED">Boleto Expirado</SelectItem>
              <SelectItem value="SALE_REFUSED">Venda Recusada</SelectItem>
              <SelectItem value="SALE_CHARGEBACK">Estorno / Chargeback</SelectItem>
              <SelectItem value="SALE_REFUNDED">Reembolso</SelectItem>
              <SelectItem value="SUBSCRIPTION_CANCELED">Assinatura Cancelada</SelectItem>
              <SelectItem value="SUBSCRIPTION_OVERDUE">Assinatura Inadimplente</SelectItem>
              <SelectItem value="SUBSCRIPTION_RENEWED">Assinatura Renovada</SelectItem>
              <SelectItem value="SUBSCRIPTION_REACTIVATED">Assinatura Reativada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sales List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sales.length === 0 && orphans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma venda encontrada
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {paginatedSales.map(({ key, events, latest }) => {
              const evInfo = getEventInfo(latest.event);
              const name = customerName(latest);
              const price = totalPrice(latest);

              return (
                <Card
                  key={key}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedLog(latest)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-3">
                      <PaymentMethodIcon method={latest.payment_method} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {name || latest.email || "Sem identificação"}
                          </span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${evInfo.color}`}>
                            {evInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          {price && <span className="font-medium">{price}</span>}
                          <span>•</span>
                          <span>{format(new Date(latest.received_at), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                          {events.length > 1 && (
                            <>
                              <span>•</span>
                              <span>{events.length} eventos</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {sales.length} vendas • Página {page} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail Sheet */}
        <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0">
            <SheetHeader className="p-4 pb-2">
              <SheetTitle className="text-lg">Detalhes da Venda</SheetTitle>
            </SheetHeader>
            {selectedLog && (
              <SaleDetail
                saleKey={selectedLog.sale_id || selectedLog.checkout_id || selectedLog.id}
                allLogs={logs}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
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
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado!" : "Copiar código PIX"}
        </Button>
      </div>
    </div>
  );
}

function SaleDetail({ saleKey, allLogs }: { saleKey: string; allLogs: WebhookLog[] }) {
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
            {customer.name && (
              <CopyableField label="Nome" value={customer.name} />
            )}
            {latest.email && (
              <CopyableField label="Email" value={latest.email} />
            )}
            {latest.phone && (
              <CopyableField label="Telefone" value={latest.phone} />
            )}
            {customer.document && (
              <p className="text-muted-foreground text-xs">CPF: {customer.document}</p>
            )}
            {(() => {
              const phone = latest.phone || customer.phone_number;
              if (!phone) return null;
              const digits = phone.replace(/\D/g, "");
              const waNumber = digits.startsWith("55") ? digits : `55${digits}`;
              return (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 mt-2"
                  asChild
                >
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-medium">{payload.total_price || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo</span>
              <span>{payload.type === "RECURRING" ? "Assinatura" : "Pagamento único"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pagamento</span>
              <span className="flex items-center gap-1.5">
                <PaymentMethodIcon method={latest.payment_method} />
                {latest.payment_method || "—"}
              </span>
            </div>
            {payment.brand && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bandeira</span>
                <span className="capitalize">{payment.brand}</span>
              </div>
            )}
            {payment.installments && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parcelas</span>
                <span>{payment.installments}x</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sale ID</span>
              <span className="text-xs font-mono">{latest.sale_id || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Checkout ID</span>
              <span className="text-xs font-mono">{latest.checkout_id || "—"}</span>
            </div>
          </div>
        </div>

        {/* PIX Code */}
        {(() => {
          // Find the PIX_GENERATED event for this sale to get the qrcode
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
              {products.map((p: any, i: number) => (
                <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.name || p.offer_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Oferta: <span className="font-mono">{p.offer_id}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium">{p.price}</p>
                      {p.is_order_bump && (
                        <Badge variant="secondary" className="text-[10px] mt-0.5">bump</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Info (recurring) */}
        {payload.plan && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Plano
            </h3>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome</span>
                <span>{payload.plan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequência</span>
                <span>{payload.plan.charge_frequency}</span>
              </div>
              {payload.plan.next_charge_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Próxima cobrança</span>
                  <span>{format(new Date(payload.plan.next_charge_date.replace(" ", "T")), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
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
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${evInfo.color}`}>
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
                    {ev.error && (
                      <p className="text-xs text-destructive">Erro: {ev.error}</p>
                    )}
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
