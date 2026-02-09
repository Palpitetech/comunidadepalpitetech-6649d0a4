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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFrequenciaDuplaSena } from "@/hooks/useFrequenciaDuplaSena";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";

// Grid 10x5 para Dupla Sena (1-50) — consistente com desdobramento
const GRID = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: 10 }, (_, col) => row * 10 + col + 1)
);

const PERIODOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 50, 100];

export default function FrequenciaDecenasDuplaSena() {
  const [periodo, setPeriodo] = useState<number>(50);
  const [sorteio, setSorteio] = useState<"sorteio1" | "sorteio2">("sorteio1");
  const { data: estatisticas, isLoading, error } = useFrequenciaDuplaSena(periodo);

  const dados = sorteio === "sorteio1" ? estatisticas?.s1 : estatisticas?.s2;

  if (isLoading) {
    return (
      <MainLayout pageTitle="Frequência das Dezenas - Dupla Sena">
        <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !dados) {
    return (
      <MainLayout pageTitle="Frequência das Dezenas - Dupla Sena">
        <div className="px-4 py-6 max-w-2xl mx-auto">
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="py-8 text-center text-destructive">
              Erro ao carregar dados de frequência.
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Calcular média para classificação dinâmica (Average + 5% for Dupla Sena)
  const allPercents = dados.map((d) => d.frequencia);
  const mediaPercent = allPercents.reduce((a, b) => a + b, 0) / allPercents.length;

  const limiteForte = mediaPercent + 5;
  const limiteFraca = mediaPercent - 5;

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

  const fortes = dados.filter((d) => getStatus(d.frequencia) === "forte").length;
  const fracas = dados.filter((d) => getStatus(d.frequencia) === "fraca").length;
  const neutras = dados.length - fortes - fracas;

  return (
    <MainLayout pageTitle="Frequência das Dezenas - Dupla Sena">
      <div className="min-h-screen bg-background">
        <div className="px-2 py-4 space-y-3 max-w-4xl mx-auto">
          {/* Período */}
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
                      {PERIODOS.map((p) => (
                        <SelectItem key={p} value={String(p)}>
                          {p} concurso{p > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Sorteio */}
          <Tabs value={sorteio} onValueChange={(v) => setSorteio(v as "sorteio1" | "sorteio2")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sorteio1">Sorteio 1</TabsTrigger>
              <TabsTrigger value="sorteio2">Sorteio 2</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Resumo */}
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

          {/* Grid 5x10 */}
          <Card className="overflow-hidden">
            <CardHeader className="py-2 px-3 bg-primary/10">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Grid de Frequência
              </CardTitle>
            </CardHeader>
            <CardContent className="p-1.5">
              <div className="grid grid-cols-10 gap-1">
                {GRID.flat().map((dezena) => {
                  const dezenaData = dados.find((d) => d.dezena === dezena);
                  const percent = dezenaData?.frequencia ?? 0;
                  const status = getStatus(percent);

                  return (
                    <div
                      key={dezena}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border-2 transition-all py-3",
                        getStatusColor(status)
                      )}
                    >
                      <span className="text-lg font-bold leading-none">
                        {String(dezena).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] font-medium opacity-90 leading-none mt-0.5">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tabela Ranking */}
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
                    {[...dados]
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
