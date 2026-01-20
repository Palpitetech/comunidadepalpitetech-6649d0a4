import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Flame, ArrowUpDown, TrendingUp, TrendingDown, Hash } from "lucide-react";
import { SeletorPeriodo } from "@/components/frequencia/SeletorPeriodo";
import { DezenaCard } from "@/components/frequencia/DezenaCard";
import { useFrequenciaDezenas, DezenaEstatistica } from "@/hooks/useFrequenciaDezenas";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PERIODOS = [3, 5, 10, 15, 20, 25, 50];

type OrdenacaoTipo = "dezena" | "frequencia" | "atraso";

export default function Frequencia() {
  const [periodo, setPeriodo] = useState<number>(10);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoTipo>("dezena");

  const { data: estatisticas, isLoading, error } = useFrequenciaDezenas(periodo);

  const ordenarEstatisticas = (
    dados: DezenaEstatistica[] | undefined
  ): DezenaEstatistica[] => {
    if (!dados) return [];

    const copia = [...dados];

    switch (ordenacao) {
      case "frequencia":
        return copia.sort((a, b) => b.frequencia - a.frequencia);
      case "atraso":
        return copia.sort((a, b) => b.maiorAtraso - a.maiorAtraso);
      case "dezena":
      default:
        return copia.sort((a, b) => a.dezena - b.dezena);
    }
  };

  const estatisticasOrdenadas = ordenarEstatisticas(estatisticas);

  const getOrdenacaoLabel = () => {
    switch (ordenacao) {
      case "frequencia":
        return "Frequência";
      case "atraso":
        return "Maior Atraso";
      default:
        return "Número";
    }
  };

  return (
    <MainLayout>
      <div className="container-senior py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-primary" />
          <h1 className="text-senior-2xl font-bold">Dezenas Quentes e Frias</h1>
        </div>

        {/* Seletor de Período */}
        <div className="space-y-2">
          <p className="text-base text-muted-foreground">
            Selecione a quantidade de concursos para análise:
          </p>
          <SeletorPeriodo
            periodos={PERIODOS}
            selecionado={periodo}
            onChange={setPeriodo}
          />
        </div>

        {/* Ordenação */}
        <div className="flex items-center justify-between">
          <p className="text-lg font-medium">
            Analisando os últimos <span className="text-primary font-bold">{periodo}</span> concursos
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                {getOrdenacaoLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setOrdenacao("dezena")}>
                <Hash className="h-4 w-4 mr-2" />
                Por Número
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrdenacao("frequencia")}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Por Frequência
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrdenacao("atraso")}>
                <TrendingDown className="h-4 w-4 mr-2" />
                Por Maior Atraso
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {Array.from({ length: 25 }).map((_, i) => (
              <Skeleton key={i} className="h-[280px] rounded-xl" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-xl p-6 text-center">
            <p className="text-lg">Erro ao carregar dados. Tente novamente.</p>
          </div>
        )}

        {/* Grid de Cards */}
        {!isLoading && !error && estatisticasOrdenadas && (
          <>
            {/* Mobile: Scroll horizontal */}
            <div className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {estatisticasOrdenadas.map((est) => (
                <DezenaCard
                  key={est.dezena}
                  dezena={est.dezena}
                  ultimaVez={est.ultimaVez}
                  maiorSequencia={est.maiorSequencia}
                  maiorAtraso={est.maiorAtraso}
                  frequencia={est.frequencia}
                  melhorDupla={est.melhorDupla}
                  correlacaoDupla={est.correlacaoDupla}
                  status={est.status}
                />
              ))}
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {estatisticasOrdenadas.map((est) => (
                <DezenaCard
                  key={est.dezena}
                  dezena={est.dezena}
                  ultimaVez={est.ultimaVez}
                  maiorSequencia={est.maiorSequencia}
                  maiorAtraso={est.maiorAtraso}
                  frequencia={est.frequencia}
                  melhorDupla={est.melhorDupla}
                  correlacaoDupla={est.correlacaoDupla}
                  status={est.status}
                />
              ))}
            </div>
          </>
        )}

        {/* Legenda */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          <h3 className="font-semibold text-lg">Legenda</h3>
          <div className="flex flex-wrap gap-4 text-base">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-status-quente" />
              <span>Quente (≥60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-status-frio" />
              <span>Fria (≤40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-lotofacil-par" />
              <span>Par</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-lotofacil-impar" />
              <span>Ímpar</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
