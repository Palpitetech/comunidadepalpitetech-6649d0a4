import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuthContext } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  Ticket,
  Calendar,
  Trophy,
  Lock,
  Download,
  FileText,
  MessageCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const WHATSAPP_NUMERO = "5551981854281";

const LOTERIA_LABELS: Record<string, string> = {
  megasena: "Mega-Sena",
  lotofacil: "Lotofácil",
  duplasena: "Dupla Sena",
  quina: "Quina",
  lotomania: "Lotomania",
  diadesorte: "Dia de Sorte",
};

const LOTERIA_BADGE_COLORS: Record<string, string> = {
  lotofacil: "bg-green-600/20 text-green-400 border-green-600/30",
  megasena: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  duplasena: "bg-purple-600/20 text-purple-400 border-purple-600/30",
  quina: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  lotomania: "bg-pink-600/20 text-pink-400 border-pink-600/30",
  diadesorte: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
};

function getProgressColor(pct: number) {
  if (pct >= 95) return "bg-destructive";
  if (pct >= 80) return "bg-orange-500";
  return "bg-primary";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ativo":
      return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Aberto</Badge>;
    case "encerrado":
      return <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">Encerrado</Badge>;
    case "premiado":
      return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-[10px]">Premiado 🏆</Badge>;
    default:
      return null;
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const formatted = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), formatted };
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPremio(valor: number) {
  if (valor >= 1_000_000_000) return `R$ ${(valor / 1_000_000_000).toFixed(1)} Bi`;
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)} Mi`;
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Detail Sheet ─────────────────────────────────────

interface BolaoDetailSheetProps {
  bolao: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function BolaoDetailSheet({ bolao, open, onOpenChange }: BolaoDetailSheetProps) {
  const isMobile = useIsMobile();
  const { user } = useAuthContext();

  const { data: minhaCota, isLoading: loadingCota } = useQuery({
    queryKey: ["minha-cota", bolao?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !bolao?.id) return null;
      const { data } = await supabase
        .from("bolao_cotas")
        .select("id, numero_cota, status")
        .eq("bolao_id", bolao.id)
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!bolao?.id && open,
  });

  if (!bolao) return null;

  const cotasDisponiveis = bolao.total_cotas - (bolao.cotas_vendidas || 0);
  const pctVendido = Math.round(((bolao.cotas_vendidas || 0) / bolao.total_cotas) * 100);
  const palpites: number[][] = Array.isArray(bolao.palpites) ? bolao.palpites : [];
  const temCota = !!minhaCota;
  const esgotado = cotasDisponiveis <= 0;
  const isAtivo = bolao.status === "ativo";

  const handleDownloadTxt = () => {
    const linhas = [
      `BOLÃO: ${bolao.codigo}`,
      `LOTERIA: ${(bolao.loteria || "").toUpperCase()}`,
      `CONCURSO: ${bolao.concurso_numero}`,
      `DATA: ${formatDateLong(bolao.data_concurso).formatted}`,
      "",
      "PALPITES:",
      "",
      ...palpites.map(
        (p: number[], i: number) =>
          `Palpite ${String(i + 1).padStart(2, "0")}: ${p.map((n) => String(n).padStart(2, "0")).join(" - ")}`
      ),
      "",
      "Gerado por Palpite Tech",
    ];
    const blob = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bolao.codigo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdquirir = () => {
    const msg = encodeURIComponent(
      `Olá! Tenho interesse no bolão *${bolao.codigo}* (${LOTERIA_LABELS[bolao.loteria] || bolao.loteria}) para o concurso ${bolao.concurso_numero}. Valor da cota: ${formatCurrency(bolao.valor_cota)}`
    );
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`;
    toast({
      title: "Entre em contato para adquirir",
      description: "Fale conosco pelo WhatsApp para garantir sua cota.",
      action: (
        <ToastAction altText="Abrir WhatsApp" onClick={() => window.open(whatsappUrl, "_blank")}>
          Abrir WhatsApp →
        </ToastAction>
      ),
    });
  };

  const dateLong = formatDateLong(bolao.data_concurso);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          isMobile
            ? "h-[95dvh] rounded-t-2xl px-4 pt-3 pb-8 overflow-y-auto"
            : "w-full sm:max-w-lg overflow-y-auto p-6 pb-8"
        )}
      >
        {isMobile && (
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* BLOCO 1 — HEADER */}
          <div className="bg-card border rounded-2xl p-5">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h2 className="text-2xl font-bold">{bolao.codigo}</h2>
              <Badge variant="outline" className={LOTERIA_BADGE_COLORS[bolao.loteria] || ""}>
                {LOTERIA_LABELS[bolao.loteria] || bolao.loteria}
              </Badge>
              {getStatusBadge(bolao.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              Concurso {bolao.concurso_numero}
            </p>
            <p className="text-sm text-muted-foreground">
              {dateLong.weekday}, {dateLong.formatted}
            </p>
          </div>

          {/* BLOCO 2 — GRID DE INFORMAÇÕES */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-xl p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground">💰 Valor</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(bolao.valor_cota)}</p>
              <p className="text-xs text-muted-foreground">por cota</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground">🎟️ Cotas</p>
              <p className={cn("text-2xl font-bold", esgotado ? "text-destructive" : "")}>
                {cotasDisponiveis} / {bolao.total_cotas}
              </p>
              <p className="text-xs text-muted-foreground">disponíveis</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground">🏆 Prêmio</p>
              <p className="text-2xl font-bold">{formatPremio(bolao.valor_premiacao || 0)}</p>
              <p className="text-xs text-muted-foreground">estimado</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground">📅 Sorteio</p>
              <p className="text-2xl font-bold">{dateLong.formatted.slice(0, 5)}</p>
              <p className="text-xs text-muted-foreground">{dateLong.weekday}</p>
            </div>
          </div>

          {/* BLOCO 3 — PROGRESSO + AÇÃO */}
          <div className="bg-card border rounded-2xl p-5 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{pctVendido}% vendido · {cotasDisponiveis} restante{cotasDisponiveis !== 1 ? "s" : ""}</span>
                {esgotado && <span className="font-medium text-destructive">Esgotado</span>}
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    esgotado ? "bg-muted-foreground/40" : getProgressColor(pctVendido)
                  )}
                  style={{ width: `${pctVendido}%` }}
                />
              </div>
            </div>

            {loadingCota ? (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : temCota ? (
              <Button
                variant="outline"
                className="w-full h-14 gap-2 text-base border-green-500/40 text-green-500 rounded-xl cursor-default"
                disabled
              >
                ✅ Você já possui uma cota
              </Button>
            ) : !isAtivo ? (
              <Button className="w-full h-14 text-base rounded-xl" disabled>
                Bolão Encerrado
              </Button>
            ) : esgotado ? (
              <Button variant="outline" className="w-full h-14 text-base rounded-xl border-destructive/40 text-destructive" disabled>
                ❌ Cotas Esgotadas
              </Button>
            ) : (
              <Button
                className="w-full h-14 gap-2 text-lg font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
                onClick={handleAdquirir}
              >
                🎟️ Adquirir Cota — {formatCurrency(bolao.valor_cota)}
              </Button>
            )}
          </div>

          {/* BLOCO 4 — ESTRATÉGIA */}
          <div className="bg-card border rounded-2xl p-5">
            <h3 className="font-semibold mb-3">📋 Estratégia</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {bolao.descricao_estrategia || "Estratégia não informada."}
            </p>
          </div>

          {/* BLOCO 5 — PALPITES */}
          <TooltipProvider>
            <div className="bg-card border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">🎯 Palpites do Bolão</h3>
                <div className="flex items-center gap-2">
                  {/* Botão Comprovante */}
                  {bolao.pdf_url ? (
                    temCota ? (
                      <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => window.open(bolao.pdf_url, "_blank")}>
                        <FileText className="h-3.5 w-3.5" />
                        Comprovante
                      </Button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" disabled>
                              <Lock className="h-3.5 w-3.5" />
                              Comprovante
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Adquira uma cota para baixar</TooltipContent>
                      </Tooltip>
                    )
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" disabled>
                            <Clock className="h-3.5 w-3.5" />
                            Comprovante
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Aguardando upload do admin</TooltipContent>
                    </Tooltip>
                  )}
                  {/* Botão .TXT */}
                  {temCota ? (
                    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleDownloadTxt}>
                      <Download className="h-3.5 w-3.5" />
                      .TXT
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" disabled>
                            <Lock className="h-3.5 w-3.5" />
                            .TXT
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Adquira uma cota para baixar</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                {palpites.map((p: number[], idx: number) => (
                  <div key={idx} className="bg-muted/30 rounded-lg px-3 py-2 text-sm font-mono">
                    <span className="text-muted-foreground text-xs mr-1.5">
                      Palpite {String(idx + 1).padStart(2, "0")}:
                    </span>
                    {p.map((d) => String(d).padStart(2, "0")).join(" · ")}
                  </div>
                ))}
              </div>
            </div>
          </TooltipProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────

export default function Boloes() {
  const [selectedBolao, setSelectedBolao] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: boloes, isLoading } = useQuery({
    queryKey: ["boloes-publicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boloes")
        .select("id, codigo, loteria, sigla, concurso_numero, data_concurso, total_cotas, cotas_vendidas, valor_cota, valor_premiacao, descricao_estrategia, palpites, pdf_url, status")
        .in("status", ["ativo", "encerrado", "premiado"])
        .order("data_concurso", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleOpen = (bolao: any) => {
    setSelectedBolao(bolao);
    setSheetOpen(true);
  };

  return (
    <MainLayout pageTitle="Bolões">
      <PageHeader title="Bolões" />
      <div className="px-4 py-3 md:container-senior md:py-8 space-y-3 md:space-y-6">

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : !boloes?.length ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🎰</span>
            <h2 className="text-lg font-bold mb-1">Nenhum bolão disponível no momento.</h2>
            <p className="text-sm text-muted-foreground">Novos bolões em breve!</p>
          </div>
        ) : (
          /* Cards */
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {boloes.map((b: any) => {
              const cotasDisp = b.total_cotas - (b.cotas_vendidas || 0);
              const pct = Math.round(((b.cotas_vendidas || 0) / b.total_cotas) * 100);
              const esgotado = cotasDisp <= 0;

              return (
                <Card
                  key={b.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors border-border/60"
                  onClick={() => handleOpen(b)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Row 1: badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={LOTERIA_BADGE_COLORS[b.loteria] || ""}>
                        {LOTERIA_LABELS[b.loteria] || b.loteria}
                      </Badge>
                      {getStatusBadge(b.status)}
                    </div>

                    {/* Row 2: code & concurso */}
                    <div>
                      <p className="text-base font-bold">{b.codigo}</p>
                      <p className="text-xs text-muted-foreground">
                        {LOTERIA_LABELS[b.loteria] || b.loteria} — Concurso {b.concurso_numero}
                      </p>
                    </div>

                    {/* Row 3: info */}
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>Sorteio: {formatDate(b.data_concurso)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Ticket className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>
                          Cotas: <strong className={esgotado ? "text-destructive" : ""}>{cotasDisp}/{b.total_cotas}</strong>
                          {esgotado && " — Esgotado"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground shrink-0">💰</span>
                        <span><strong className="text-primary">{formatCurrency(b.valor_cota)}</strong> por cota</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", getProgressColor(pct))} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right">{pct}% vendido</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); handleOpen(b); }}>
                        Ver Estratégia
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        disabled={b.status !== "ativo" || esgotado}
                        onClick={(e) => { e.stopPropagation(); handleOpen(b); }}
                      >
                        {esgotado ? "Esgotado" : "Adquirir Cota"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BolaoDetailSheet
        bolao={selectedBolao}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </MainLayout>
  );
}
