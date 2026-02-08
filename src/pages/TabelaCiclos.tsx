import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCiclosLotofacil } from "@/hooks/useCiclosLotofacil";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { 
  RefreshCcw, 
  TrendingUp, 
  TrendingDown, 
  Timer, 
  Target, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";

// Dezenas 1-25 organizadas em grid 5x5
const GRID_LAYOUT = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25],
];

export default function TabelaCiclos() {
  const isMobile = useIsMobile();
  const [ciclosVisiveis, setCiclosVisiveis] = useState(5);
  const { data, isLoading, error } = useCiclosLotofacil(ciclosVisiveis);

  if (isLoading) {
    return (
      <MainLayout pageTitle="Tabela de Ciclos">
        <div className="container-senior py-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout pageTitle="Tabela de Ciclos">
        <div className="container-senior py-6">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Erro ao carregar dados dos ciclos.
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const { ciclos, estatisticas } = data;

  return (
    <MainLayout pageTitle="Tabela de Ciclos">
      <div className="container-senior py-4 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        {!isMobile && (
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <RefreshCcw className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold">Tabela de Movimentação por Ciclos</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Visualize quais dezenas saíram em cada concurso até completar o ciclo de 25 números
            </p>
          </div>
        )}

        {/* Estatísticas Resumo */}
        {estatisticas && (
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Média */}
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span className="text-xs font-medium">Média por Ciclo</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {estatisticas.mediaConcursos.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">concursos</p>
                </div>

                {/* Mais Rápido */}
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Mais Rápido</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {estatisticas.cicloMaisRapido?.duracao ?? "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {estatisticas.cicloMaisRapido ? `Ciclo ${estatisticas.cicloMaisRapido.numero}` : "-"}
                  </p>
                </div>

                {/* Mais Lento */}
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-amber-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-xs font-medium">Mais Lento</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-600">
                    {estatisticas.cicloMaisLento?.duracao ?? "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {estatisticas.cicloMaisLento ? `Ciclo ${estatisticas.cicloMaisLento.numero}` : "-"}
                  </p>
                </div>

                {/* Última Dezena Mais Frequente */}
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span className="text-xs font-medium">Última a Sair</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {estatisticas.ultimasDezenas.slice(0, 3).map((item, idx) => (
                      <span
                        key={item.dezena}
                        className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                          idx === 0 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-foreground"
                        )}
                      >
                        {String(item.dezena).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">mais frequentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Ciclos */}
        <div className="space-y-6">
          {ciclos.map((ciclo, cicloIdx) => (
            <CicloCard key={ciclo.numero} ciclo={ciclo} isLatest={cicloIdx === 0} />
          ))}
        </div>

        {/* Botão Carregar Mais */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setCiclosVisiveis((prev) => prev + 5)}
            className="gap-2"
          >
            <ChevronDown className="h-4 w-4" />
            Carregar mais ciclos
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

interface CicloCardProps {
  ciclo: {
    numero: number;
    concursos: {
      concurso_id: number;
      data_sorteio: string;
      dezenas: number[];
      qtd_impares: number | null;
      qtd_primos: number | null;
      qtd_moldura: number | null;
      qtd_repetidas: number | null;
    }[];
    duracao: number;
    ultimaDezena: number | null;
  };
  isLatest: boolean;
}

function CicloCard({ ciclo, isLatest }: CicloCardProps) {
  const [expanded, setExpanded] = useState(isLatest);

  // Construir mapa de primeira aparição de cada dezena neste ciclo
  const primeiraAparicao = new Map<number, number>();
  
  for (const resultado of ciclo.concursos) {
    for (const dezena of resultado.dezenas) {
      if (!primeiraAparicao.has(dezena)) {
        primeiraAparicao.set(dezena, resultado.concurso_id);
      }
    }
  }

  return (
    <Card className={cn(isLatest && "border-primary/50")}>
      {/* Header do Ciclo */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Badge 
            variant={isLatest ? "default" : "outline"}
            className={cn("text-sm", isLatest && "bg-primary")}
          >
            Ciclo {ciclo.numero}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {ciclo.duracao} concursos
          </span>
          {ciclo.ultimaDezena && (
            <span className="text-xs text-muted-foreground">
              • Última: <strong className="text-foreground">{String(ciclo.ultimaDezena).padStart(2, "0")}</strong>
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Tabela de Movimentação */}
      {expanded && (
        <CardContent className="pt-0 pb-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground sticky left-0 bg-card z-10">
                  Concurso
                </th>
                {/* Headers das 25 dezenas */}
                {GRID_LAYOUT.flat().map((dezena) => (
                  <th 
                    key={dezena} 
                    className="text-center py-2 px-1 font-medium text-muted-foreground w-8"
                  >
                    {String(dezena).padStart(2, "0")}
                  </th>
                ))}
                {/* Headers dos padrões */}
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Ímp</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Pri</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Mol</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Rep</th>
              </tr>
            </thead>
            <tbody>
              {ciclo.concursos.map((resultado, idx) => {
                const isFechamento = idx === ciclo.concursos.length - 1;
                
                return (
                  <tr 
                    key={resultado.concurso_id}
                    className={cn(
                      "border-b border-border/50",
                      isFechamento && "bg-primary/5"
                    )}
                  >
                    <td className="py-2 px-2 font-medium sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-1.5">
                        <span>{resultado.concurso_id}</span>
                        {isFechamento && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary">
                            ✓
                          </Badge>
                        )}
                      </div>
                    </td>
                    {/* Células das dezenas */}
                    {GRID_LAYOUT.flat().map((dezena) => {
                      const saiu = resultado.dezenas.includes(dezena);
                      const primeiraVez = primeiraAparicao.get(dezena) === resultado.concurso_id;
                      
                      return (
                        <td 
                          key={dezena}
                          className="text-center py-2 px-1"
                        >
                          {saiu && primeiraVez ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                              {String(dezena).padStart(2, "0")}
                            </span>
                          ) : saiu ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-[10px]">
                              {String(dezena).padStart(2, "0")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </td>
                      );
                    })}
                    {/* Colunas de padrões */}
                    <td className="text-center py-2 px-2 font-medium">
                      {resultado.qtd_impares ?? "-"}
                    </td>
                    <td className="text-center py-2 px-2 font-medium">
                      {resultado.qtd_primos ?? "-"}
                    </td>
                    <td className="text-center py-2 px-2 font-medium">
                      {resultado.qtd_moldura ?? "-"}
                    </td>
                    <td className="text-center py-2 px-2 font-medium">
                      {resultado.qtd_repetidas ?? "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      )}
    </Card>
  );
}
