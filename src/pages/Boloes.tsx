import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, MessageCircle, Ticket, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Bolao {
  id: number;
  nome: string;
  loteria: string;
  descricao: string;
  cotasTotal: number;
  cotasVendidas: number;
  valorCota: number;
  concurso: number;
  qtdPalpites: number;
  qtdDezenas: number;
  palpitesAmostra: number[][];
}

const boloesSimulados: Bolao[] = [
  {
    id: 1,
    nome: "Bolão Quentes do Mês",
    loteria: "Lotofácil",
    descricao: "Estratégia baseada nas 10 dezenas mais sorteadas nos últimos 30 concursos. Foco em números quentes com alta frequência recente, maximizando as chances estatísticas.",
    cotasTotal: 20,
    cotasVendidas: 17,
    valorCota: 15.00,
    concurso: 3245,
    qtdPalpites: 8,
    qtdDezenas: 16,
    palpitesAmostra: [
      [1, 2, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 24, 25],
      [2, 3, 5, 6, 9, 10, 12, 14, 15, 17, 18, 20, 21, 23, 24, 25],
      [1, 4, 5, 7, 8, 10, 11, 13, 15, 16, 18, 19, 21, 22, 24, 25],
    ],
  },
  {
    id: 2,
    nome: "Bolão Moldura Premiada",
    loteria: "Lotofácil",
    descricao: "Combinação estratégica priorizando dezenas da moldura externa do volante. Alta frequência histórica de acertos com esse padrão.",
    cotasTotal: 15,
    cotasVendidas: 12,
    valorCota: 20.00,
    concurso: 3245,
    qtdPalpites: 5,
    qtdDezenas: 17,
    palpitesAmostra: [
      [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 17, 20, 21, 22, 23, 24, 25],
      [1, 2, 3, 5, 6, 8, 10, 11, 14, 15, 16, 20, 21, 22, 23, 24, 25],
    ],
  },
  {
    id: 3,
    nome: "Bolão Equilibrado",
    loteria: "Lotofácil",
    descricao: "Mix perfeito: 8 pares, 7 ímpares, 5 primos e 8 dezenas de moldura. Baseado em padrões estatísticos de concursos vencedores.",
    cotasTotal: 25,
    cotasVendidas: 22,
    valorCota: 12.00,
    concurso: 3245,
    qtdPalpites: 10,
    qtdDezenas: 15,
    palpitesAmostra: [
      [1, 3, 4, 6, 8, 9, 10, 12, 14, 16, 18, 20, 22, 23, 25],
      [2, 3, 5, 7, 8, 10, 11, 13, 15, 17, 19, 20, 22, 24, 25],
      [1, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19, 21, 23, 25],
    ],
  },
  {
    id: 4,
    nome: "Bolão Repetidas",
    loteria: "Mega-Sena",
    descricao: "Foco em dezenas que se repetiram nos últimos 3 sorteios da Mega-Sena. Tendência forte de continuidade identificada pela IA.",
    cotasTotal: 10,
    cotasVendidas: 8,
    valorCota: 25.00,
    concurso: 2810,
    qtdPalpites: 6,
    qtdDezenas: 8,
    palpitesAmostra: [
      [5, 12, 23, 34, 45, 56, 7, 18],
      [3, 15, 22, 33, 41, 50, 8, 19],
    ],
  },
];

function BolaoDetailSheet({ bolao, open, onOpenChange }: { bolao: Bolao | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const isMobile = useIsMobile();

  if (!bolao) return null;

  const cotasRestantes = bolao.cotasTotal - bolao.cotasVendidas;
  const urgente = cotasRestantes <= 3;
  const porcentagem = Math.round((bolao.cotasVendidas / bolao.cotasTotal) * 100);

  const handleComprar = () => {
    const mensagem = encodeURIComponent(
      `Olá! Tenho interesse no *${bolao.nome}* para o concurso ${bolao.concurso}. Valor da cota: R$ ${bolao.valorCota.toFixed(2)}`
    );
    window.open(`https://wa.me/5511999999999?text=${mensagem}`, "_blank");
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
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        {/* Header */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold pr-8">{bolao.nome}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px]">{bolao.loteria}</Badge>
                <span className="text-xs text-muted-foreground">Concurso {bolao.concurso}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Palpites</p>
            <p className="text-xl font-bold">{bolao.qtdPalpites}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Dezenas</p>
            <p className="text-xl font-bold">{bolao.qtdDezenas}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Valor Cota</p>
            <p className="text-xl font-bold text-primary">R$ {bolao.valorCota.toFixed(0)}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Cotas</p>
            <p className={cn("text-xl font-bold", urgente && "text-destructive")}>{cotasRestantes}/{bolao.cotasTotal}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{porcentagem}% vendido</span>
            <span className={cn("font-medium", urgente ? "text-destructive" : "text-muted-foreground")}>
              {cotasRestantes === 1 ? "Última cota!" : `${cotasRestantes} restantes`}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", urgente ? "bg-destructive" : "bg-primary")}
              style={{ width: `${porcentagem}%` }}
            />
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Descrição */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Estratégia</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{bolao.descricao}</p>
        </div>

        <Separator className="mb-4" />

        {/* Amostra de palpites */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Amostra dos palpites</h3>
          <div className="space-y-2">
            {bolao.palpitesAmostra.map((palpite, idx) => (
              <div key={idx} className="bg-muted/30 rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Palpite {idx + 1}</p>
                <div className="flex flex-wrap gap-1">
                  {palpite.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold"
                    >
                      {String(d).padStart(2, "0")}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {bolao.qtdPalpites > bolao.palpitesAmostra.length && (
              <p className="text-[11px] text-muted-foreground text-center">
                + {bolao.qtdPalpites - bolao.palpitesAmostra.length} palpites não exibidos
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleComprar}
          className="w-full h-12 gap-2 text-base"
          size="lg"
        >
          <MessageCircle className="h-5 w-5" />
          Comprar Cota — R$ {bolao.valorCota.toFixed(2).replace(".", ",")}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Você será direcionado para o WhatsApp
        </p>
      </SheetContent>
    </Sheet>
  );
}

export default function Boloes() {
  const [selectedBolao, setSelectedBolao] = useState<Bolao | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleOpen = (bolao: Bolao) => {
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

        {/* List */}
        <div className="space-y-1 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {boloesSimulados.map((bolao) => {
            const cotasRestantes = bolao.cotasTotal - bolao.cotasVendidas;
            const urgente = cotasRestantes <= 3;

            return (
              <button
                key={bolao.id}
                onClick={() => handleOpen(bolao)}
                className="flex items-center gap-3 w-full text-left px-3 py-3 rounded-xl bg-card border border-border/50 hover:bg-muted/40 active:bg-muted/60 transition-colors md:p-4"
              >
                {/* Left: icon */}
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                  urgente ? "bg-destructive/10" : "bg-primary/10"
                )}>
                  <Ticket className={cn("h-5 w-5", urgente ? "text-destructive" : "text-primary")} />
                </div>

                {/* Center: info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">{bolao.nome}</p>
                    {urgente && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 shrink-0">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        {cotasRestantes}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">{bolao.loteria}</span>
                    <span className="text-[11px] text-muted-foreground/40">•</span>
                    <span className="text-[11px] text-muted-foreground">C. {bolao.concurso}</span>
                    <span className="text-[11px] text-muted-foreground/40">•</span>
                    <span className="text-[11px] text-muted-foreground">{bolao.qtdPalpites}p · {bolao.qtdDezenas}d</span>
                  </div>
                </div>

                {/* Right: price + arrow */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">R$ {bolao.valorCota.toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">{bolao.cotasTotal} cotas</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <BolaoDetailSheet
        bolao={selectedBolao}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </MainLayout>
  );
}
