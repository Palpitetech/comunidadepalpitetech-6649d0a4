import { useIsMobile } from "@/hooks/use-mobile";
import { useAuthContext } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Lock, Download, FileText, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type BolaoPublico,
  type PalpitePremiado,
  WHATSAPP_NUMERO,
  LOTERIA_LABELS,
  LOTERIA_BADGE_COLORS,
  getProgressColor,
  getStatusBadgeProps,
  formatBolaoDateLong,
  formatBolaoCurrency,
  formatBolaoPremio,
} from "@/lib/boloes";

interface BolaoDetailSheetProps {
  bolao: BolaoPublico | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function BolaoDetailSheet({ bolao, open, onOpenChange }: BolaoDetailSheetProps) {
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
  const statusBadge = getStatusBadgeProps(bolao.status || "");

  const handleDownloadTxt = () => {
    const linhas = [
      `BOLÃO: ${bolao.codigo}`,
      `LOTERIA: ${(bolao.loteria || "").toUpperCase()}`,
      `CONCURSO: ${bolao.concurso_numero}`,
      `DATA: ${formatBolaoDateLong(bolao.data_concurso).formatted}`,
      "",
      "PALPITES:",
      "",
      ...palpites.map(
        (p, i) =>
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
      `Olá! Tenho interesse no bolão *${bolao.codigo}* (${LOTERIA_LABELS[bolao.loteria] || bolao.loteria}) para o concurso ${bolao.concurso_numero}. Valor da cota: ${formatBolaoCurrency(bolao.valor_cota)}`
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

  const dateLong = formatBolaoDateLong(bolao.data_concurso);
  const palpitesPremiados = bolao.palpites_premiados as PalpitePremiado[] | null;

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

        {/* Sheet Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onOpenChange(false)}>
            <span className="sr-only">Fechar</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          <h2 className="text-lg font-semibold">Detalhes do Bolão</h2>
        </div>

        <div className="flex flex-col gap-5 px-1">
          {/* HEADER */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight">{bolao.codigo}</h2>
              <Badge variant="outline" className={cn("rounded-full text-xs", LOTERIA_BADGE_COLORS[bolao.loteria] || "")}>
                {LOTERIA_LABELS[bolao.loteria] || bolao.loteria}
              </Badge>
              {statusBadge && <Badge variant="outline" className={statusBadge.className}>{statusBadge.label}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Concurso {bolao.concurso_numero} · {dateLong.weekdayShort}, {dateLong.formatted}
            </p>
          </div>

          <div className="h-px bg-border" />

          {/* GRID DE INFORMAÇÕES */}
          <div className="grid grid-cols-2 divide-x divide-y divide-border/50 border border-border/50 rounded-xl overflow-hidden">
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-semibold tracking-tight text-primary">{formatBolaoCurrency(bolao.valor_cota)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">por cota</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className={cn("text-xl font-semibold tracking-tight", esgotado ? "text-destructive" : "")}>
                {cotasDisponiveis} disponível
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">de {bolao.total_cotas} cotas</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-semibold tracking-tight whitespace-nowrap">{formatBolaoPremio(bolao.valor_premiacao || 0)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">prêm. est.</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-semibold tracking-tight">{dateLong.formatted.slice(0, 5)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{dateLong.weekday}</p>
            </div>
          </div>

          {/* PROGRESSO */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>{pctVendido}% vendido · {cotasDisponiveis} restante{cotasDisponiveis !== 1 ? "s" : ""}</span>
              {esgotado && <span className="font-medium text-destructive">Esgotado</span>}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500 ease-out", esgotado ? "bg-muted-foreground/40" : getProgressColor(pctVendido))}
                style={{ width: `${pctVendido}%` }}
              />
            </div>
          </div>

          {/* BOTÃO ADQUIRIR */}
          {loadingCota ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : temCota ? (
            <Button variant="ghost" className="w-full h-12 gap-2 text-base text-green-500 rounded-2xl cursor-default" disabled>
              ✅ Você já possui uma cota
            </Button>
          ) : !isAtivo ? (
            <Button className="w-full h-12 text-base rounded-2xl bg-muted text-muted-foreground" disabled>
              Bolão Encerrado
            </Button>
          ) : esgotado ? (
            <Button className="w-full h-12 text-base rounded-2xl bg-muted text-muted-foreground" disabled>
              Cotas Esgotadas
            </Button>
          ) : (
            <Button
              className="w-full h-12 text-base font-semibold rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all"
              onClick={handleAdquirir}
            >
              Adquirir Cota · {formatBolaoCurrency(bolao.valor_cota)}
            </Button>
          )}

          <div className="h-px bg-border" />

          {/* ESTRATÉGIA */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Estratégia</p>
            <p className="text-sm leading-relaxed text-foreground/80">
              {bolao.descricao_estrategia || "Estratégia não informada."}
            </p>
          </div>

          <div className="h-px bg-border" />

          {/* PALPITES */}
          <TooltipProvider>
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Palpites</p>
                <div className="flex items-center gap-1.5">
                  {/* Comprovante */}
                  {bolao.pdf_url ? (
                    temCota ? (
                      <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs hover:bg-muted/50" onClick={() => window.open(bolao.pdf_url!, "_blank")}>
                        <FileText className="h-3.5 w-3.5" />
                        Comprovante
                      </Button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs" disabled>
                              <Lock className="h-3 w-3" />
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
                          <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs" disabled>
                            <Clock className="h-3 w-3" />
                            Comprovante
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Aguardando upload do admin</TooltipContent>
                    </Tooltip>
                  )}
                  {/* .TXT */}
                  {temCota ? (
                    <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs hover:bg-muted/50" onClick={handleDownloadTxt}>
                      <Download className="h-3.5 w-3.5" />
                      .TXT
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs" disabled>
                            <Lock className="h-3 w-3" />
                            .TXT
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Adquira uma cota para baixar</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              <div>
                {palpites.map((p, idx) => {
                  const verificacao = bolao.resultado_verificado && Array.isArray(palpitesPremiados)
                    ? palpitesPremiados.find((v) => v.palpite_index === idx)
                    : null;
                  const dezenasAcertadas: number[] = verificacao?.dezenas_acertadas ?? [];

                  return (
                    <div key={idx} className={cn("py-3", idx < palpites.length - 1 && "border-b border-border/30")}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          Palpite {String(idx + 1).padStart(2, "0")}
                        </span>
                        {verificacao && verificacao.premiado && verificacao.is_ouro && (
                          <Badge className="text-[10px] bg-yellow-500/20 text-yellow-600 border-yellow-500/30 h-5">
                            🥇 {verificacao.faixa} — {verificacao.acertos} acertos
                          </Badge>
                        )}
                        {verificacao && verificacao.premiado && !verificacao.is_ouro && (
                          <Badge className="text-[10px] bg-emerald-500/20 text-emerald-600 border-emerald-500/30 h-5">
                            ✅ {verificacao.faixa} — {verificacao.acertos} acertos
                          </Badge>
                        )}
                        {verificacao && !verificacao.premiado && (
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {verificacao.acertos} acertos
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {p.map((d, j) => {
                          const acertou = dezenasAcertadas.includes(d);
                          const isOuro = acertou && verificacao?.is_ouro;
                          const isPremiado = acertou && verificacao?.premiado && !verificacao?.is_ouro;
                          return (
                            <span
                              key={j}
                              className={cn(
                                "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-mono font-medium",
                                isOuro
                                  ? "bg-yellow-400 text-yellow-900 ring-2 ring-yellow-500"
                                  : isPremiado
                                    ? "bg-emerald-500 text-white ring-2 ring-emerald-600"
                                    : acertou
                                      ? "bg-emerald-500 text-white ring-2 ring-emerald-600"
                                      : "bg-muted/50"
                              )}
                            >
                              {String(d).padStart(2, "0")}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TooltipProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
