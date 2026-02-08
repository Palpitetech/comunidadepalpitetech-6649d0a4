import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTabelaMovimentacao } from "@/hooks/useTabelaMovimentacao";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { 
  Table2, 
  Flame, 
  Snowflake, 
  TrendingUp, 
  Timer, 
  Target,
  Shuffle,
  ChevronDown,
  ChevronUp,
  BarChart3
} from "lucide-react";

// Blocos de linhas (5 grupos de 5)
const BLOCOS = [
  { label: "Linha 1", dezenas: [1, 2, 3, 4, 5] },
  { label: "Linha 2", dezenas: [6, 7, 8, 9, 10] },
  { label: "Linha 3", dezenas: [11, 12, 13, 14, 15] },
  { label: "Linha 4", dezenas: [16, 17, 18, 19, 20] },
  { label: "Linha 5", dezenas: [21, 22, 23, 24, 25] },
];

const TODAS_DEZENAS = Array.from({ length: 25 }, (_, i) => i + 1);

type DestaqueTipo = "todas" | "quentes" | "frias" | "atrasadas" | "ausentes";

export default function TabelaMovimentacao() {
  const isMobile = useIsMobile();
  const [periodo, setPeriodo] = useState<number>(10);
  const [destaque, setDestaque] = useState<DestaqueTipo>("todas");
  const [mostrarEstatisticas, setMostrarEstatisticas] = useState(true);

  const { data, isLoading, error } = useTabelaMovimentacao(periodo);

  // Filtrar dezenas baseado no destaque selecionado
  const dezenasDestacadas = useMemo(() => {
    if (!data) return new Set<number>();

    switch (destaque) {
      case "quentes":
        return new Set(data.dezenaStats.filter(s => s.status === "quente").map(s => s.dezena));
      case "frias":
        return new Set(data.dezenaStats.filter(s => s.status === "fria").map(s => s.dezena));
      case "atrasadas":
        // Top 5 mais atrasadas
        return new Set(
          [...data.dezenaStats]
            .sort((a, b) => b.atrasoAtual - a.atrasoAtual)
            .slice(0, 5)
            .map(s => s.dezena)
        );
      case "ausentes":
        return new Set(data.cicloAtual.ausentes);
      default:
        return new Set<number>();
    }
  }, [data, destaque]);

  if (isLoading) {
    return (
      <MainLayout pageTitle="Tabela de Movimentação">
        <div className="container-senior py-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout pageTitle="Tabela de Movimentação">
        <div className="container-senior py-6">
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="py-8 text-center text-destructive">
              Erro ao carregar dados da tabela de movimentação.
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const { resultados, ciclos, dezenaStats, cicloAtual, ultimoConcurso } = data;

  // Agrupar resultados por ciclo para renderização
  const resultadosComCiclo = resultados.map(r => ({
    ...r,
    isFechamentoCiclo: ciclos.some(c => c.fechouEm === r.concurso_id),
    cicloInfo: ciclos.find(c => c.fechouEm === r.concurso_id),
  }));

  return (
    <MainLayout pageTitle="Tabela de Movimentação">
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container-senior py-4 space-y-4 max-w-7xl mx-auto">
          {/* Header */}
          <div className="space-y-3">
            {!isMobile && (
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Table2 className="h-7 w-7 text-primary" />
                  <h1 className="text-2xl font-bold">Tabela de Movimentação</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Lotofácil • Últimos {periodo} Concursos + Ciclos
                </p>
              </div>
            )}

            {/* Controles */}
            <Card className="bg-card/80 backdrop-blur">
              <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  {/* Período */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Período:</span>
                    <Select value={String(periodo)} onValueChange={(v) => setPeriodo(Number(v))}>
                      <SelectTrigger className="w-[120px] h-9">
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
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="quentes">🔥 Quentes</SelectItem>
                        <SelectItem value="frias">❄️ Frias</SelectItem>
                        <SelectItem value="atrasadas">⏳ Atrasadas</SelectItem>
                        <SelectItem value="ausentes">🎯 Ausentes no Ciclo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Toggle Estatísticas */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarEstatisticas(!mostrarEstatisticas)}
                    className="gap-1.5"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {mostrarEstatisticas ? "Ocultar" : "Mostrar"} Estatísticas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Painel Ausentes do Ciclo Atual */}
          {cicloAtual.ausentes.length > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm">
                      Ciclo {cicloAtual.numero} – Ausentes ({cicloAtual.ausentes.length}):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cicloAtual.ausentes.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
                      >
                        {String(d).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grade Principal */}
          <Card className="overflow-hidden">
            <CardHeader className="py-3 bg-muted/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Table2 className="h-5 w-5" />
                Grade de Movimentação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[900px]">
                <thead className="bg-muted/30 sticky top-0 z-10">
                  <tr>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground border-r border-border/50 sticky left-0 bg-muted/30 z-20 min-w-[80px]">
                      Concurso
                    </th>
                    {/* Headers por Bloco */}
                    {BLOCOS.map((bloco, blocoIdx) => (
                      <th
                        key={bloco.label}
                        colSpan={5}
                        className={cn(
                          "text-center py-1.5 px-1 font-medium text-muted-foreground",
                          blocoIdx < BLOCOS.length - 1 && "border-r-2 border-primary/20"
                        )}
                      >
                        <span className="text-[10px] uppercase tracking-wider">{bloco.label}</span>
                      </th>
                    ))}
                    {/* Headers Resumo */}
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground border-l-2 border-border">Aus</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Ímp</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Par</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Rep</th>
                  </tr>
                  <tr className="border-b border-border">
                    <th className="border-r border-border/50 sticky left-0 bg-muted/30 z-20"></th>
                    {BLOCOS.map((bloco, blocoIdx) => (
                      bloco.dezenas.map((dezena, idx) => {
                        const isDestacada = dezenasDestacadas.has(dezena);
                        return (
                          <th
                            key={dezena}
                            className={cn(
                              "text-center py-1.5 px-0.5 font-bold text-[10px] w-8",
                              idx === 4 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-primary/20",
                              isDestacada && destaque === "quentes" && "text-orange-500",
                              isDestacada && destaque === "frias" && "text-blue-500",
                              isDestacada && destaque === "atrasadas" && "text-amber-500",
                              isDestacada && destaque === "ausentes" && "text-primary"
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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {resultadosComCiclo.map((resultado, rowIdx) => {
                    const isEven = rowIdx % 2 === 0;
                    const qtdAusentes = resultado.dezenas_faltantes_ciclo?.length ?? 0;

                    return (
                      <>
                        {/* Linha de Fechamento de Ciclo */}
                        {resultado.isFechamentoCiclo && resultado.cicloInfo && (
                          <tr key={`ciclo-${resultado.cicloInfo.cicloNumero}`} className="bg-primary/10">
                            <td 
                              colSpan={30} 
                              className="py-2 px-3 text-center font-semibold text-primary text-sm"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Badge variant="default" className="bg-primary">
                                  Ciclo {resultado.cicloInfo.cicloNumero}
                                </Badge>
                                <span>Fechado em {resultado.cicloInfo.duracao} concursos</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr
                          key={resultado.concurso_id}
                          className={cn(
                            "border-b border-border/30 hover:bg-muted/50 transition-colors",
                            isEven ? "bg-background" : "bg-muted/20"
                          )}
                        >
                          <td className="py-1.5 px-2 font-medium sticky left-0 bg-inherit z-10 border-r border-border/50">
                            <div className="flex flex-col">
                              <span className="font-bold">{resultado.concurso_id}</span>
                              <span className="text-[9px] text-muted-foreground">
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
                                    "text-center py-1 px-0.5",
                                    idx === 4 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-primary/20"
                                  )}
                                >
                                  {saiu ? (
                                    <span
                                      className={cn(
                                        "inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold transition-all",
                                        isDestacada && destaque === "quentes"
                                          ? "bg-orange-500 text-white ring-2 ring-orange-300"
                                          : isDestacada && destaque === "frias"
                                          ? "bg-blue-500 text-white ring-2 ring-blue-300"
                                        : isDestacada && destaque === "atrasadas"
                                          ? "bg-amber-500 text-white ring-2 ring-amber-300"
                                          : "bg-palpite-dezena text-palpite-dezena-foreground ring-2 ring-palpite-dezena/50"
                                      )}
                                    >
                                      {String(dezena).padStart(2, "0")}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] text-muted-foreground/40 bg-muted/30">
                                      {String(dezena).padStart(2, "0")}
                                    </span>
                                  )}
                                </td>
                              );
                            })
                          ))}
                          {/* Colunas de resumo */}
                          <td className="text-center py-1.5 px-2 font-medium border-l-2 border-border">
                            <Badge variant="outline" className="text-[10px] px-1.5">
                              {qtdAusentes}
                            </Badge>
                          </td>
                          <td className="text-center py-1.5 px-2 font-medium text-blue-600">
                            {resultado.qtd_impares ?? "-"}
                          </td>
                          <td className="text-center py-1.5 px-2 font-medium text-pink-600">
                            {resultado.qtd_impares !== null ? 15 - resultado.qtd_impares : "-"}
                          </td>
                          <td className="text-center py-1.5 px-2 font-medium text-amber-600">
                            {resultado.qtd_repetidas ?? "-"}
                          </td>
                        </tr>
                      </>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Painel Estatístico */}
          {mostrarEstatisticas && (
            <Card>
              <CardHeader className="py-3 bg-muted/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Painel Estatístico por Dezena
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[900px]">
                  <thead className="bg-muted/30">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground sticky left-0 bg-muted/30 z-10 min-w-[100px]">
                        Métrica
                      </th>
                      {BLOCOS.map((bloco, blocoIdx) => (
                        bloco.dezenas.map((dezena, idx) => (
                          <th
                            key={dezena}
                            className={cn(
                              "text-center py-2 px-1 font-bold text-[10px] w-8",
                              idx === 4 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-primary/20"
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
                    <tr className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium sticky left-0 bg-card z-10 flex items-center gap-1.5">
                        <Timer className="h-3.5 w-3.5 text-amber-500" />
                        Atraso Atual
                      </td>
                      {BLOCOS.map((bloco, blocoIdx) => (
                        bloco.dezenas.map((dezena, idx) => {
                          const stat = dezenaStats.find(s => s.dezena === dezena);
                          const atraso = stat?.atrasoAtual ?? 0;
                          const isAlto = atraso >= 5;
                          return (
                            <td
                              key={dezena}
                              className={cn(
                                "text-center py-2 px-1 font-bold",
                                idx === 4 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-primary/20",
                                isAlto ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30" : "text-foreground"
                              )}
                            >
                              {atraso}
                            </td>
                          );
                        })
                      ))}
                    </tr>

                    {/* Frequência % */}
                    <tr className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium sticky left-0 bg-card z-10 flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        Frequência %
                      </td>
                      {BLOCOS.map((bloco, blocoIdx) => (
                        bloco.dezenas.map((dezena, idx) => {
                          const stat = dezenaStats.find(s => s.dezena === dezena);
                          const freq = stat?.frequenciaPercent ?? 0;
                          return (
                            <td
                              key={dezena}
                              className={cn(
                                "text-center py-2 px-1 font-medium text-[10px]",
                                idx === 4 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-primary/20",
                                freq >= 65 ? "text-blue-700 bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300" :
                                freq >= 55 ? "text-blue-500 bg-blue-50 dark:bg-blue-950/20" :
                                "text-muted-foreground bg-muted/30"
                              )}
                            >
                              {freq.toFixed(0)}%
                            </td>
                          );
                        })
                      ))}
                    </tr>

                    {/* Frequência Absoluta */}
                    <tr className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium sticky left-0 bg-card z-10 flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                        Frequência Abs.
                      </td>
                      {BLOCOS.map((bloco, blocoIdx) => (
                        bloco.dezenas.map((dezena, idx) => {
                          const stat = dezenaStats.find(s => s.dezena === dezena);
                          return (
                            <td
                              key={dezena}
                              className={cn(
                                "text-center py-2 px-1 font-medium",
                                idx === 4 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-primary/20"
                              )}
                            >
                              {stat?.frequencia ?? 0}
                            </td>
                          );
                        })
                      ))}
                    </tr>

                    {/* Maior Atraso */}
                    <tr className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium sticky left-0 bg-card z-10 flex items-center gap-1.5">
                        <Timer className="h-3.5 w-3.5 text-red-500" />
                        Maior Atraso
                      </td>
                      {BLOCOS.map((bloco, blocoIdx) => (
                        bloco.dezenas.map((dezena, idx) => {
                          const stat = dezenaStats.find(s => s.dezena === dezena);
                          return (
                            <td
                              key={dezena}
                              className={cn(
                                "text-center py-2 px-1 font-medium text-muted-foreground",
                                idx === 4 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-primary/20"
                              )}
                            >
                              {stat?.maiorAtraso ?? 0}
                            </td>
                          );
                        })
                      ))}
                    </tr>

                    {/* Maior Sequência */}
                    <tr className="hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium sticky left-0 bg-card z-10 flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-green-500" />
                        Maior Sequência
                      </td>
                      {BLOCOS.map((bloco, blocoIdx) => (
                        bloco.dezenas.map((dezena, idx) => {
                          const stat = dezenaStats.find(s => s.dezena === dezena);
                          return (
                            <td
                              key={dezena}
                              className={cn(
                                "text-center py-2 px-1 font-medium text-muted-foreground",
                                idx === 4 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-primary/20"
                              )}
                            >
                              {stat?.maiorSequencia ?? 0}
                            </td>
                          );
                        })
                      ))}
                    </tr>

                    {/* Status (Quente/Média/Fria) */}
                    <tr className="bg-muted/20">
                      <td className="py-2 px-3 font-medium sticky left-0 bg-muted/20 z-10">
                        Status
                      </td>
                      {BLOCOS.map((bloco, blocoIdx) => (
                        bloco.dezenas.map((dezena, idx) => {
                          const stat = dezenaStats.find(s => s.dezena === dezena);
                          return (
                            <td
                              key={dezena}
                              className={cn(
                                "text-center py-2 px-1",
                                idx === 4 && blocoIdx < BLOCOS.length - 1 && "border-r-2 border-primary/20"
                              )}
                            >
                              {stat?.status === "quente" ? (
                                <Flame className="h-4 w-4 mx-auto text-orange-500" />
                              ) : stat?.status === "fria" ? (
                                <Snowflake className="h-4 w-4 mx-auto text-blue-500" />
                              ) : (
                                <span className="text-muted-foreground text-[10px]">—</span>
                              )}
                            </td>
                          );
                        })
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Painel Distribuição de Duração dos Ciclos */}
          {mostrarEstatisticas && ciclos.length > 0 && (
            <Card>
              <CardHeader className="py-3 bg-muted/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Média de Concursos por Ciclo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {(() => {
                  // Calcular distribuição de duração dos ciclos
                  const distribuicao = new Map<number, number>();
                  ciclos.forEach(c => {
                    const duracao = c.duracao;
                    distribuicao.set(duracao, (distribuicao.get(duracao) ?? 0) + 1);
                  });

                  // Ordenar por duração
                  const listaOrdenada = Array.from(distribuicao.entries())
                    .sort((a, b) => a[0] - b[0])
                    .map(([duracao, quantidade]) => ({
                      duracao,
                      quantidade,
                      porcentagem: (quantidade / ciclos.length) * 100,
                    }));

                  const totalCiclos = ciclos.length;
                  const mediaDuracao = ciclos.reduce((acc, c) => acc + c.duracao, 0) / totalCiclos;
                  const maximo = Math.max(...listaOrdenada.map(x => x.quantidade));

                  return (
                    <div className="space-y-4">
                      {/* Resumo Geral */}
                      <div className="flex flex-wrap gap-4 justify-center text-sm">
                        <Badge variant="outline" className="px-3 py-1">
                          Total de Ciclos: <span className="font-bold ml-1">{totalCiclos}</span>
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1">
                          Média Geral: <span className="font-bold ml-1">{mediaDuracao.toFixed(1)} concursos</span>
                        </Badge>
                      </div>

                      {/* Tabela de Distribuição */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-3 font-medium">Concursos</th>
                              <th className="text-center py-2 px-3 font-medium">Quantidade</th>
                              <th className="text-center py-2 px-3 font-medium">%</th>
                              <th className="text-left py-2 px-3 font-medium w-1/2">Distribuição</th>
                            </tr>
                          </thead>
                          <tbody>
                            {listaOrdenada.map(({ duracao, quantidade, porcentagem }) => (
                              <tr key={duracao} className="border-b border-border/30 hover:bg-muted/30">
                                <td className="py-2 px-3 font-medium">
                                  <Badge variant="secondary" className="font-bold">
                                    {duracao} {duracao === 1 ? "concurso" : "concursos"}
                                  </Badge>
                                </td>
                                <td className="text-center py-2 px-3 font-bold text-primary">
                                  {quantidade}
                                </td>
                                <td className="text-center py-2 px-3 font-medium text-muted-foreground">
                                  {porcentagem.toFixed(1)}%
                                </td>
                                <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                    <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-palpite-dezena transition-all duration-500"
                        style={{ width: `${(quantidade / maximo) * 100}%` }}
                      />
                    </div>
                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Legenda */}
          <Card className="bg-muted/30">
            <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-4 text-xs justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-palpite-dezena text-palpite-dezena-foreground text-[9px] font-bold">01</span>
                  <span className="text-muted-foreground">Sorteada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted/50 text-muted-foreground/40 text-[9px]">01</span>
                  <span className="text-muted-foreground">Não sorteada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground">Quente (≥65%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Snowflake className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">Fria (≤55%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
