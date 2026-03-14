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
import {
  Ticket,
  Calendar,
  Trophy,
  Lock,
  Download,
  FileText,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
    const lines = [
      `BOLÃO: ${bolao.codigo}`,
      `LOTERIA: ${LOTERIA_LABELS[bolao.loteria] || bolao.loteria}`,
      `CONCURSO: ${bolao.concurso_numero}`,
      `DATA: ${formatDate(bolao.data_concurso)}`,
      "",
    ];
    palpites.forEach((p: number[], i: number) => {
      lines.push(`PALPITE ${i + 1}: ${p.map((n) => String(n).padStart(2, "0")).join("-")}`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bolao.codigo}-palpites.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdquirir = () => {
    toast({
      title: "Em breve!",
      description: "Em breve você poderá adquirir cotas diretamente pelo app. Entre em contato via WhatsApp.",
    });
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Olá! Tenho interesse no bolão *${bolao.codigo}* (${LOTERIA_LABELS[bolao.loteria] || bolao.loteria}) para o concurso ${bolao.concurso_numero}. Valor da cota: ${formatCurrency(bolao.valor_cota)}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`, "_blank");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          isMobile
            ? "h-[95dvh] rounded-t-2xl px-4 pt-3 pb-6 overflow-y-auto"
            : "w-full sm:max-w-lg overflow-y-auto p-6"
        )}
      >
        {isMobile && (
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        {/* SEÇÃO 1: Header */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold">{bolao.codigo}</h2>
            <Badge variant="outline" className={LOTERIA_BADGE_COLORS[bolao.loteria] || ""}>
              {LOTERIA_LABELS[bolao.loteria] || bolao.loteria}
            </Badge>
            {getStatusBadge(bolao.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            Concurso {bolao.concurso_numero} — {formatDate(bolao.data_concurso)}
          </p>
        </div>

        <Separator className="mb-4" />

        {/* SEÇÃO 2: Informações */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">💰 Valor por cota</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(bolao.valor_cota)}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">🎟️ Cotas disponíveis</p>
            <p className={cn("text-lg font-bold", esgotado && "text-destructive")}>
              {cotasDisponiveis}/{bolao.total_cotas}
            </p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">🏆 Prêmio estimado</p>
            <p className="text-lg font-bold">{formatCurrency(bolao.valor_premiacao || 0)}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">📅 Data do sorteio</p>
            <p className="text-sm font-medium">{formatDate(bolao.data_concurso)}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{pctVendido}% vendido</span>
            <span className={cn("font-medium", esgotado ? "text-destructive" : "text-muted-foreground")}>
              {esgotado ? "Esgotado" : `${cotasDisponiveis} restantes`}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", getProgressColor(pctVendido))} style={{ width: `${pctVendido}%` }} />
          </div>
        </div>

        <Separator className="mb-4" />

        {/* SEÇÃO 3: Estratégia */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">📋 Estratégia</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {bolao.descricao_estrategia || "Estratégia não informada."}
          </p>
        </div>

        <Separator className="mb-4" />

        {/* SEÇÃO 4: Palpites */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-3">🎯 Palpites do Bolão</h3>
          {loadingCota ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : temCota ? (
            <div className="space-y-2">
              {palpites.map((p: number[], idx: number) => (
                <div key={idx} className="bg-muted/30 rounded-lg p-2.5">
                  <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Palpite {idx + 1}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.map((d: number, di: number) => (
                      <span key={di} className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                        {String(d).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full gap-1.5 mt-2" onClick={handleDownloadTxt}>
                <Download className="h-3.5 w-3.5" />
                Baixar Palpites (.txt)
              </Button>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center">
                <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground font-medium">
                  Adquira uma cota para visualizar os palpites
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="mb-4" />

        {/* SEÇÃO 5: PDF Oficial */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">📄 Palpites Oficiais (Comprovante)</h3>
          {bolao.pdf_url ? (
            temCota ? (
              <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => window.open(bolao.pdf_url, "_blank")}>
                <FileText className="h-3.5 w-3.5" />
                Baixar PDF Oficial
              </Button>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-4 text-center">
                  <Lock className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
                  <p className="text-xs text-muted-foreground">Disponível para cotistas</p>
                </CardContent>
              </Card>
            )
          ) : (
            <p className="text-xs text-muted-foreground">Comprovante ainda não disponível.</p>
          )}
        </div>

        {/* SEÇÃO 6: Ação */}
        {temCota ? (
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-green-500">✅ Você já possui uma cota neste bolão</p>
            <p className="text-xs text-muted-foreground">Cota #{minhaCota.numero_cota}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              className="w-full h-12 gap-2 text-base"
              size="lg"
              disabled={!isAtivo || esgotado}
              onClick={handleAdquirir}
            >
              <Ticket className="h-5 w-5" />
              {esgotado ? "Esgotado" : `Adquirir Cota — ${formatCurrency(bolao.valor_cota)}`}
            </Button>
            {isAtivo && !esgotado && (
              <Button variant="outline" className="w-full gap-2" onClick={handleWhatsApp}>
                <MessageCircle className="h-4 w-4" />
                Falar no WhatsApp
              </Button>
            )}
          </div>
        )}
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
      <div className="px-4 py-3 md:container-senior md:py-8 space-y-3 md:space-y-6">
        {/* Desktop title */}
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold">Bolões</h1>
          <p className="text-sm text-muted-foreground mt-1">Jogue em grupo e aumente suas chances</p>
        </div>

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
