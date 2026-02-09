import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTabelaMovimentacaoDuplaSena } from "@/hooks/useTabelaMovimentacaoDuplaSena";
import { cn } from "@/lib/utils";
import { LayoutGrid, TrendingDown, AlertCircle } from "lucide-react";

interface ItemLinha {
  indice: number;
  ocorrencias: number;
  frequencia: number;
  atraso: number;
  maiorAtraso: number;
}

const TabelaLinha = ({ item, tipo }: { item: ItemLinha; tipo: "linha" | "coluna" }) => {
  const isFrequente = item.frequencia >= 15;
  const isFrio = item.frequencia <= 5;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-duplasena-primary/30 transition-colors">
      {/* Badge */}
      <div className="w-10 h-10 rounded-lg bg-duplasena-primary/10 text-duplasena-primary flex items-center justify-center font-bold text-sm">
        {tipo === "linha" ? "L" : "C"}{String(item.indice).padStart(2, "0")}
      </div>

      {/* Ocorrências */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground">Ocorr.</div>
        <div className="text-sm font-bold">{item.ocorrencias}x</div>
      </div>

      {/* Frequência */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground">Freq.</div>
        <div className={cn("text-sm font-bold", isFrequente && "text-green-600", isFrio && "text-blue-600")}>
          {item.frequencia}%
        </div>
      </div>

      {/* Atraso Atual */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground">Atraso</div>
        <div className={cn("text-sm font-bold", item.atraso > 10 && "text-orange-600")}>
          {item.atraso}
        </div>
      </div>

      {/* Maior Atraso */}
      <div className="text-center ml-auto">
        <div className="text-xs text-muted-foreground">M.Atraso</div>
        <div className="text-sm font-bold text-red-600">{item.maiorAtraso}</div>
      </div>
    </div>
  );
};

export default function LinhasColunasDuplaSena() {
  const [sorteioAtivo, setSorteioAtivo] = useState<"1" | "2">("1");
  const [abaSelecionada, setAbaSelecionada] = useState<"linhas" | "colunas">("linhas");
  const { data, isLoading, error } = useTabelaMovimentacaoDuplaSena();

  if (isLoading) {
    return (
      <MainLayout pageTitle="Linhas e Colunas">
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout pageTitle="Linhas e Colunas">
        <div className="px-4 py-6">
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="py-8 text-center text-destructive">
              Erro ao carregar dados.
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const dadosSorteio = sorteioAtivo === "1" ? data.sorteio1 : data.sorteio2;
  const itensMostrados = abaSelecionada === "linhas" ? dadosSorteio.linhas : dadosSorteio.colunas;
  const label = abaSelecionada === "linhas" ? "Linhas" : "Colunas";

  return (
    <MainLayout pageTitle="Linhas e Colunas">
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6 space-y-4 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <LayoutGrid className="h-6 w-6 text-duplasena-primary" />
            <h1 className="text-xl font-bold">Análise de {label}</h1>
          </div>

          {/* Controles */}
          <Card>
            <CardContent className="py-4 space-y-4">
              {/* Toggle Sorteio */}
              <div className="flex rounded-lg p-1 bg-muted/50">
                <button
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    sorteioAtivo === "1"
                      ? "bg-duplasena-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSorteioAtivo("1")}
                >
                  Sorteio 1
                </button>
                <button
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    sorteioAtivo === "2"
                      ? "bg-duplasena-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSorteioAtivo("2")}
                >
                  Sorteio 2
                </button>
              </div>

              {/* Toggle Linhas/Colunas */}
              <div className="flex rounded-lg p-1 bg-muted/50">
                <button
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    abaSelecionada === "linhas"
                      ? "bg-duplasena-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setAbaSelecionada("linhas")}
                >
                  Linhas (1-5)
                </button>
                <button
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    abaSelecionada === "colunas"
                      ? "bg-duplasena-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setAbaSelecionada("colunas")}
                >
                  Colunas (1-10)
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Legenda */}
          <Card className="bg-muted/30">
            <CardContent className="py-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span>Quente (≥15%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span>Frio (≤5%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span>Atraso alto (&gt;10)</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span>Maior atraso</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Linhas/Colunas */}
          <Card>
            <CardHeader className="py-3 bg-duplasena-primary/10">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-duplasena-primary text-white font-bold text-xs">
                  {abaSelecionada === "linhas" ? "L" : "C"}
                </span>
                {label} - Sorteio {sorteioAtivo}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {itensMostrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum dado disponível
                </div>
              ) : (
                itensMostrados.map((item) => (
                  <TabelaLinha key={item.indice} item={item} tipo={abaSelecionada === "linhas" ? "linha" : "coluna"} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Info Grid 5x10 */}
          {abaSelecionada === "linhas" && (
            <Card className="bg-muted/30">
              <CardContent className="py-4 text-xs text-muted-foreground text-center">
                <p className="font-semibold mb-2">Grid Dupla Sena (5x10)</p>
                <div className="space-y-1 text-[11px]">
                  <p>Linha 1: 01-10 | Linha 2: 11-20 | Linha 3: 21-30</p>
                  <p>Linha 4: 31-40 | Linha 5: 41-50</p>
                </div>
              </CardContent>
            </Card>
          )}

          {abaSelecionada === "colunas" && (
            <Card className="bg-muted/30">
              <CardContent className="py-4 text-xs text-muted-foreground text-center">
                <p className="font-semibold mb-2">Distribuição por Coluna</p>
                <div className="space-y-1 text-[11px]">
                  <p>C1: 1,11,21,31,41 | C2: 2,12,22,32,42 | C3: 3,13,23,33,43</p>
                  <p>C4: 4,14,24,34,44 | C5: 5,15,25,35,45 | C6: 6,16,26,36,46</p>
                  <p>C7: 7,17,27,37,47 | C8: 8,18,28,38,48 | C9: 9,19,29,39,49</p>
                  <p>C10: 10,20,30,40,50</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
