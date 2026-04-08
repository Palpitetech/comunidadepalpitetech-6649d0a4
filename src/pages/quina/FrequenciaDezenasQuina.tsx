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
import { useFrequenciaDezenasQuina } from "@/hooks/useFrequenciaDezenasQuina";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";

// Grid 10x8 para Quina (80 dezenas)
const GRID: number[][] = [];
for (let row = 0; row < 8; row++) {
  const r: number[] = [];
  for (let col = 0; col < 10; col++) {
    r.push(row * 10 + col + 1);
  }
  GRID.push(r);
}

export default function FrequenciaDezenasQuina() {
  const [periodo, setPeriodo] = useState<number>(50);
  const { data, isLoading, error } = useFrequenciaDezenasQuina(periodo);

  if (isLoading) {
    return (
      <MainLayout pageTitle="Frequência das Dezenas – Quina">
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout pageTitle="Frequência das Dezenas – Quina">
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

  const allPercents = data.map((d) => d.frequencia);
  const mediaPercent = allPercents.reduce((a, b) => a + b, 0) / (allPercents.length || 1);
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

  const fortes = data.filter((d) => getStatus(d.frequencia) === "forte").length;
  const fracas = data.filter((d) => getStatus(d.frequencia) === "fraca").length;
  const neutras = 80 - fortes - fracas;

  return (
    <MainLayout pageTitle="Frequência das Dezenas – Quina">
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
          {/* Filtros + Resumo */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <Select value={String(periodo)} onValueChange={(v) => setPeriodo(Number(v))}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 concurso</SelectItem>
                  <SelectItem value="2">2 concursos</SelectItem>
                  <SelectItem value="3">3 concursos</SelectItem>
                  <SelectItem value="5">5 concursos</SelectItem>
                  <SelectItem value="10">10 concursos</SelectItem>
                  <SelectItem value="15">15 concursos</SelectItem>
                  <SelectItem value="20">20 concursos</SelectItem>
                  <SelectItem value="25">25 concursos</SelectItem>
                  <SelectItem value="50">50 concursos</SelectItem>
                  <SelectItem value="100">100 concursos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <Badge variant="outline" className="px-1.5 py-0.5 gap-1 bg-emerald-500/10 border-emerald-500/30 text-xs">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <strong>{fortes}</strong>
              </Badge>
              <Badge variant="outline" className="px-1.5 py-0.5 gap-1 text-xs">
                <Minus className="h-3 w-3 text-muted-foreground" />
                <strong>{neutras}</strong>
              </Badge>
              <Badge variant="outline" className="px-1.5 py-0.5 gap-1 bg-red-500/10 border-red-500/30 text-xs">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <strong>{fracas}</strong>
              </Badge>
            </div>
          </div>

          {/* Grid 10x8 */}
          <Card>
            <CardHeader className="py-3 bg-primary/10">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Grid de Frequência
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-10 gap-1.5">
                {GRID.flat().map((dezena) => {
                  const dezenaData = data.find((d) => d.dezena === dezena);
                  const percent = dezenaData?.frequencia ?? 0;
                  const status = getStatus(percent);

                  return (
                    <div
                      key={dezena}
                      className={cn(
                        "flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border transition-all",
                        getStatusColor(status)
                      )}
                    >
                      <span className="text-sm sm:text-base font-bold leading-tight">
                        {String(dezena).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] sm:text-xs font-medium opacity-90 leading-tight">
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
                            className={cn("border-b border-border/30", getStatusBg(status))}
                          >
                            <td className="py-2 px-3 font-medium text-muted-foreground">
                              {idx + 1}º
                            </td>
                            <td className="text-center py-2 px-3">
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm",
                                  getStatusColor(status)
                                )}
                              >
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

          {/* Legenda */}
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
