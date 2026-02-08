import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTabelaMovimentacaoMegaSena } from "@/hooks/useTabelaMovimentacaoMegaSena";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { 
  Table2, 
  Flame, 
  Snowflake, 
  TrendingUp, 
  Timer, 
  BarChart3
} from "lucide-react";

// Grid 6x10 para Mega Sena
const BLOCOS = [
  { label: "L1", dezenas: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { label: "L2", dezenas: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
  { label: "L3", dezenas: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
  { label: "L4", dezenas: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40] },
  { label: "L5", dezenas: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50] },
  { label: "L6", dezenas: [51, 52, 53, 54, 55, 56, 57, 58, 59, 60] },
];

const TODAS_DEZENAS = Array.from({ length: 60 }, (_, i) => i + 1);

type DestaqueTipo = "todas" | "quentes" | "frias" | "atrasadas";

export default function TabelaMovimentacaoMegaSena() {
  const isMobile = useIsMobile();
  const [periodo, setPeriodo] = useState<number>(10);
  const [destaque, setDestaque] = useState<DestaqueTipo>("todas");

  const { data, isLoading, error } = useTabelaMovimentacaoMegaSena(periodo);

  // Filtrar dezenas baseado no destaque selecionado
  const dezenasDestacadas = useMemo(() => {
    if (!data) return new Set<number>();

    switch (destaque) {
      case "quentes":
        return new Set(data.dezenaStats.filter(s => s.status === "quente").map(s => s.dezena));
      case "frias":
        return new Set(data.dezenaStats.filter(s => s.status === "fria").map(s => s.dezena));
      case "atrasadas":
        // Top 6 mais atrasadas (equivalente proporcional ao Top 5 da Lotofácil)
        return new Set(
          [...data.dezenaStats]
            .sort((a, b) => b.atrasoAtual - a.atrasoAtual)
            .slice(0, 6)
            .map(s => s.dezena)
        );
      default:
        return new Set<number>();
    }
  }, [data, destaque]);

  if (isLoading) {
    return (
      <MainLayout pageTitle="Movimentação Mega Sena">
        <div className="px-2 py-3 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout pageTitle="Movimentação Mega Sena">
        <div className="px-2 py-3">
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="py-8 text-center text-destructive">
              Erro ao carregar dados da tabela de movimentação.
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const { resultados, dezenaStats, ultimoConcurso } = data;

  return (
    <MainLayout pageTitle="Movimentação Mega Sena">
      <div className="min-h-screen bg-background">
        <div className="px-2 py-3 space-y-3 w-full max-w-full">
          {/* Header */}
          <div className="space-y-3">
            {!isMobile && (
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Table2 className="h-7 w-7 text-megasena-primary" />
                  <h1 className="text-2xl font-bold">Tabela de Movimentação</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mega Sena • Últimos {periodo} Concursos
                </p>
              </div>
            )}

            {/* Controles */}
            <Card className="bg-card">
              <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-4 justify-center">
                  {/* Período */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Período:</span>
                    <Select value={String(periodo)} onValueChange={(v) => setPeriodo(Number(v))}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(10)].map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1} {i === 0 ? "concurso" : "concursos"}</SelectItem>
                        ))}
                        <SelectItem value="15">15 concursos</SelectItem>
                        <SelectItem value="20">20 concursos</SelectItem>
                        <SelectItem value="25">25 concursos</SelectItem>
                        <SelectItem value="30">30 concursos</SelectItem>
                        <SelectItem value="50">50 concursos</SelectItem>
                        <SelectItem value="100">100 concursos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Destaque */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Destacar:</span>
                    <Select value={destaque} onValueChange={(v) => setDestaque(v as DestaqueTipo)}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="quentes">🔥 Quentes</SelectItem>
                        <SelectItem value="frias">❄️ Frias</SelectItem>
                        <SelectItem value="atrasadas">⏳ Atrasadas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grade Principal */}
          <Card className="overflow-hidden">
            <CardHeader className="py-3 bg-megasena-primary/10">
              <CardTitle className="text-base flex items-center gap-2">
                <Table2 className="h-5 w-5 text-megasena-primary" />
                Grade de Movimentação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[1100px]">
                <thead className="bg-muted/30 sticky top-0 z-10">
                  <tr>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground border-r border-border/50 sticky left-0 bg-muted/50 z-20 min-w-[70px]">
                      Conc.
                    </th>
                    {/* Headers por Bloco (6 linhas) */}
                    {BLOCOS.map((bloco, blocoIdx) => (
                      <th
                        key={bloco.label}
                        colSpan={10}
                        className={cn(
                          "text-center py-1.5 px-1 font-medium text-muted-foreground",
                          blocoIdx < BLOCOS.length - 1 && "border-r-2 border-megasena-primary/20"
                        )}
                      >
                        <span className="text-[10px] uppercase tracking-wider">{bloco.label}</span>
                      </th>
                    ))}
                    {/* Headers Resumo */}
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground border-l-2 border-border">Ímp</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Par</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Rep</th>
                  </tr>
                  <tr className="border-b border-border">
                    <th className="border-r border-border/50 sticky left-0 bg-muted/50 z-20"></th>
                    {BLOCOS.map((bloco, blocoIdx) => (
                      bloco.dezenas.map((dezena, idx) => {
                        const isDestacada = dezenasDestacadas.has(dezena);
                        return (
                          <th
                            key={dezena}
                            className={cn(
                              "text-center py-1 px-0.5 font-bold text-[9px] w-7",
                              idx === 9 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-megasena-primary/20",
                              isDestacada && destaque === "quentes" && "text-orange-500",
                              isDestacada && destaque === "frias" && "text-blue-500",
                              isDestacada && destaque === "atrasadas" && "text-amber-500"
                            )}
                          >
                            {String(dezena).padStart(2, "0")}
                          </th>
                        );
                      })
                    ))}
                    <th className="border-l-2 border-border"></th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((resultado, rowIdx) => {
                    const isEven = rowIdx % 2 === 0;

                    return (
                      <tr
                        key={resultado.concurso_id}
                        className={cn(
                          "border-b border-border/30 hover:bg-muted/50 transition-colors",
                          isEven ? "bg-background" : "bg-muted/20"
                        )}
                      >
                        <td className={cn(
                          "py-1.5 px-2 font-medium sticky left-0 z-10 border-r border-border/50",
                          isEven ? "bg-background" : "bg-muted"
                        )}>
                          <div className="flex flex-col">
                            <span className="font-bold text-[11px]">{resultado.concurso_id}</span>
                            <span className="text-[8px] text-muted-foreground">
                              {new Date(resultado.data_sorteio).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                            </span>
                          </div>
                        </td>
                        {/* Células das dezenas */}
                        {BLOCOS.map((bloco, blocoIdx) => (
                          bloco.dezenas.map((dezena, idx) => {
                            const saiu = resultado.dezenas.includes(dezena);
                            const isDestacada = dezenasDestacadas.has(dezena);
                            
                            return (
                              <td
                                key={dezena}
                                className={cn(
                                  "text-center py-0.5 px-0",
                                  idx === 9 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-megasena-primary/20"
                                )}
                              >
                                {saiu ? (
                                  <span
                                    className={cn(
                                      "inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold transition-all",
                                      isDestacada && destaque === "quentes"
                                        ? "bg-orange-500 text-white ring-2 ring-orange-300"
                                        : isDestacada && destaque === "frias"
                                        ? "bg-blue-500 text-white ring-2 ring-blue-300"
                                        : isDestacada && destaque === "atrasadas"
                                        ? "bg-amber-500 text-white ring-2 ring-amber-300"
                                        : "bg-megasena-primary text-megasena-primary-foreground"
                                    )}
                                  >
                                    {String(dezena).padStart(2, "0")}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[9px] text-muted-foreground/30 bg-muted/20">
                                    {String(dezena).padStart(2, "0")}
                                  </span>
                                )}
                              </td>
                            );
                          })
                        ))}
                        {/* Colunas de resumo */}
                        <td className="text-center py-1.5 px-2 font-medium border-l-2 border-border text-blue-600 text-[10px]">
                          {resultado.qtd_impares ?? "-"}
                        </td>
                        <td className="text-center py-1.5 px-2 font-medium text-pink-600 text-[10px]">
                          {resultado.qtd_impares !== null ? 6 - resultado.qtd_impares : "-"}
                        </td>
                        <td className="text-center py-1.5 px-2 font-medium text-amber-600 text-[10px]">
                          {resultado.qtd_repetidas ?? "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Painel Estatístico */}
          <Card>
            <CardHeader className="py-3 bg-megasena-primary/10">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-megasena-primary" />
                Painel Estatístico por Dezena
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[1100px]">
                <thead className="bg-muted/30">
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground sticky left-0 bg-muted/50 z-10 min-w-[80px]">
                      Métrica
                    </th>
                    {BLOCOS.map((bloco, blocoIdx) => (
                      bloco.dezenas.map((dezena, idx) => (
                        <th
                          key={dezena}
                          className={cn(
                            "text-center py-1 px-0.5 font-bold text-[9px] w-7",
                            idx === 9 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-megasena-primary/20"
                          )}
                        >
                          {String(dezena).padStart(2, "0")}
                        </th>
                      ))
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Atraso Atual */}
                  <tr className="border-b border-border/30 bg-background">
                    <td className="py-2 px-3 font-medium sticky left-0 bg-background z-10 text-[10px]">
                      <div className="flex items-center gap-1">
                        <Timer className="h-3 w-3 text-amber-500" />
                        Atraso
                      </div>
                    </td>
                    {BLOCOS.map((bloco, blocoIdx) => (
                      bloco.dezenas.map((dezena, idx) => {
                        const stat = dezenaStats.find(s => s.dezena === dezena);
                        const atraso = stat?.atrasoAtual ?? 0;
                        const isAlto = atraso >= 10;
                        return (
                          <td
                            key={dezena}
                            className={cn(
                              "text-center py-1 px-0.5 text-[9px]",
                              idx === 9 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-megasena-primary/20",
                              isAlto && "text-amber-600 font-bold"
                            )}
                          >
                            {atraso}
                          </td>
                        );
                      })
                    ))}
                  </tr>

                  {/* Frequência % */}
                  <tr className="border-b border-border/30 bg-muted/20">
                    <td className="py-2 px-3 font-medium sticky left-0 bg-muted z-10 text-[10px]">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-megasena-primary" />
                        Freq %
                      </div>
                    </td>
                    {BLOCOS.map((bloco, blocoIdx) => (
                      bloco.dezenas.map((dezena, idx) => {
                        const stat = dezenaStats.find(s => s.dezena === dezena);
                        const freq = stat?.frequenciaPercent ?? 0;
                        return (
                          <td
                            key={dezena}
                            className={cn(
                              "text-center py-1 px-0.5 text-[9px]",
                              idx === 9 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-megasena-primary/20",
                              freq >= 15 && "text-orange-600 font-bold",
                              freq <= 5 && "text-blue-600 font-bold"
                            )}
                          >
                            {freq.toFixed(0)}
                          </td>
                        );
                      })
                    ))}
                  </tr>

                  {/* Status */}
                  <tr className="bg-background">
                    <td className="py-2 px-3 font-medium sticky left-0 bg-background z-10 text-[10px]">
                      Status
                    </td>
                    {BLOCOS.map((bloco, blocoIdx) => (
                      bloco.dezenas.map((dezena, idx) => {
                        const stat = dezenaStats.find(s => s.dezena === dezena);
                        const status = stat?.status ?? "media";
                        return (
                          <td
                            key={dezena}
                            className={cn(
                              "text-center py-1 px-0.5",
                              idx === 9 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-megasena-primary/20"
                            )}
                          >
                            {status === "quente" && <Flame className="h-3 w-3 text-orange-500 mx-auto" />}
                            {status === "fria" && <Snowflake className="h-3 w-3 text-blue-500 mx-auto" />}
                            {status === "media" && <span className="text-[8px] text-muted-foreground">—</span>}
                          </td>
                        );
                      })
                    ))}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Legenda */}
          <Card>
            <CardContent className="py-3">
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-megasena-primary"></span>
                  <span>Sorteada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>Quente (≥15%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Snowflake className="h-4 w-4 text-blue-500" />
                  <span>Fria (≤5%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Timer className="h-4 w-4 text-amber-500" />
                  <span>Atrasada</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
