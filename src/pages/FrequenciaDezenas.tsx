import { useState } from "react";
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
import { useFrequenciaDezenas } from "@/hooks/useFrequenciaDezenas";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";

// Grid 5x5 para Lotofácil
const GRID = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25],
];

export default function FrequenciaDezenas() {
  const [periodo, setPeriodo] = useState<number>(50);
  const { data, isLoading, error } = useFrequenciaDezenas(periodo);

  if (isLoading) {
    return (
      <MainLayout pageTitle="Frequência das Dezenas">
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout pageTitle="Frequência das Dezenas">
        <div className="px-4 py-6">
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="py-8 text-center text-destructive">
              Erro ao carregar dados de frequência.
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Calcular média para classificação dinâmica
  const allPercents = data.map(d => d.frequencia);
  const mediaPercent = allPercents.reduce((a, b) => a + b, 0) / allPercents.length;
  
  // Forte: >= média + 8%, Fraca: <= média - 8%
  const limiteForte = mediaPercent + 8;
  const limiteFraca = mediaPercent - 8;

  const getStatus = (percent: number): "forte" | "fraca" | "neutra" => {
    if (percent >= limiteForte) return "forte";
    if (percent <= limiteFraca) return "fraca";
    return "neutra";
  };

  const getStatusColor = (status: "forte" | "fraca" | "neutra") => {
    switch (status) {
      case "forte":
        return "bg-emerald-500 text-white border-emerald-600";
      case "fraca":
        return "bg-red-500 text-white border-red-600";
      default:
        return "bg-muted text-foreground border-border";
    }
  };

  const getStatusBg = (status: "forte" | "fraca" | "neutra") => {
    switch (status) {
      case "forte":
        return "bg-emerald-500/10";
      case "fraca":
        return "bg-red-500/10";
      default:
        return "bg-muted/30";
    }
  };

  // Contagem por status
  const fortes = data.filter(d => getStatus(d.frequencia) === "forte").length;
  const fracas = data.filter(d => getStatus(d.frequencia) === "fraca").length;
  const neutras = 25 - fortes - fracas;

  return (
    <MainLayout pageTitle="Frequência das Dezenas">
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold">Frequência das Dezenas</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Lotofácil • Últimos {periodo} Concursos
            </p>
          </div>

          {/* Controles */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Período:</span>
                  <Select value={String(periodo)} onValueChange={(v) => setPeriodo(Number(v))}>
                    <SelectTrigger className="w-[150px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 concursos</SelectItem>
                      <SelectItem value="15">15 concursos</SelectItem>
                      <SelectItem value="20">20 concursos</SelectItem>
                      <SelectItem value="25">25 concursos</SelectItem>
                      <SelectItem value="30">30 concursos</SelectItem>
                      <SelectItem value="50">50 concursos</SelectItem>
                      <SelectItem value="100">100 concursos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo - Linha Única */}
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="px-2 py-1 gap-1.5 bg-emerald-500/10 border-emerald-500/30 whitespace-nowrap">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs">Fortes: <strong>{fortes}</strong></span>
            </Badge>
            <Badge variant="outline" className="px-2 py-1 gap-1.5 whitespace-nowrap">
              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs">Neutras: <strong>{neutras}</strong></span>
            </Badge>
            <Badge variant="outline" className="px-2 py-1 gap-1.5 bg-red-500/10 border-red-500/30 whitespace-nowrap">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs">Fracas: <strong>{fracas}</strong></span>
            </Badge>
          </div>

          {/* Grid 5x5 */}
          <Card>
            <CardHeader className="py-3 bg-primary/10">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Grid de Frequência
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-5 gap-2">
                {GRID.flat().map((dezena) => {
                  const dezenaData = data.find(d => d.dezena === dezena);
                  const percent = dezenaData?.frequencia ?? 0;
                  const status = getStatus(percent);
                  
                  return (
                    <div
                      key={dezena}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                        getStatusColor(status)
                      )}
                    >
                      <span className="text-2xl font-bold">
                        {String(dezena).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-medium opacity-90">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tabela Detalhada */}
          <Card>
            <CardHeader className="py-3 bg-muted/50">
              <CardTitle className="text-base">Ranking por Frequência</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium">#</th>
                      <th className="text-center py-2 px-3 font-medium">Dezena</th>
                      <th className="text-center py-2 px-3 font-medium">%</th>
                      <th className="text-left py-2 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data]
                      .sort((a, b) => b.frequencia - a.frequencia)
                      .map((dezenaData, idx) => {
                        const status = getStatus(dezenaData.frequencia);
                        return (
                          <tr 
                            key={dezenaData.dezena} 
                            className={cn(
                              "border-b border-border/30",
                              getStatusBg(status)
                            )}
                          >
                            <td className="py-2 px-3 font-medium text-muted-foreground">
                              {idx + 1}º
                            </td>
                            <td className="text-center py-2 px-3">
                              <span className={cn(
                                "inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm",
                                getStatusColor(status)
                              )}>
                                {String(dezenaData.dezena).padStart(2, "0")}
                              </span>
                            </td>
                            <td className="text-center py-2 px-3 font-bold">
                              {dezenaData.frequencia}%
                            </td>
                            <td className="py-2 px-3">
                              {status === "forte" && (
                                <Badge className="bg-emerald-500 text-white">Forte</Badge>
                              )}
                              {status === "fraca" && (
                                <Badge className="bg-red-500 text-white">Fraca</Badge>
                              )}
                              {status === "neutra" && (
                                <Badge variant="secondary">Neutra</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Legenda - Linha Única */}
          <Card className="bg-muted/30">
            <CardContent className="py-2.5">
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-4 h-4 rounded bg-emerald-500"></span>
                  <span>Forte (≥{limiteForte.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-4 h-4 rounded bg-muted border"></span>
                  <span>Neutra</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-4 h-4 rounded bg-red-500"></span>
                  <span>Fraca (≤{limiteFraca.toFixed(0)}%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
