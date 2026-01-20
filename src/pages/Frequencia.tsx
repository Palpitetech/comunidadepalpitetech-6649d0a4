import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Flame } from "lucide-react";
import { SeletorPeriodo } from "@/components/frequencia/SeletorPeriodo";
import { DezenaCard } from "@/components/frequencia/DezenaCard";
import {
  useFrequenciaDezenas,
  DezenaEstatistica,
} from "@/hooks/useFrequenciaDezenas";
import { Skeleton } from "@/components/ui/skeleton";

const PERIODOS = [3, 5, 10, 15, 20, 25, 50];

export default function Frequencia() {
  const [periodo, setPeriodo] = useState<number>(10);

  const {
    data: estatisticas,
    isLoading,
    error,
  } = useFrequenciaDezenas(periodo);

  const ordenarEstatisticas = (
    dados: DezenaEstatistica[] | undefined
  ): DezenaEstatistica[] => {
    if (!dados) return [];
    return [...dados].sort((a, b) => a.dezena - b.dezena);
  };

  const estatisticasOrdenadas = ordenarEstatisticas(estatisticas);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Flame className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              Dezenas Quentes e Frias
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Análise de frequência individual de cada dezena
          </p>
        </div>

        {/* Period Selector */}
        <SeletorPeriodo
          periodos={PERIODOS}
          selecionado={periodo}
          onChange={setPeriodo}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 25 }).map((_, i) => (
              <Skeleton key={i} className="h-[260px] rounded-xl" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-xl p-6 text-center">
            <p className="text-base">Erro ao carregar dados. Tente novamente.</p>
          </div>
        )}

        {/* Grid de Cards */}
        {!isLoading && !error && estatisticasOrdenadas && (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                melhorTrio={est.melhorTrio}
                correlacaoTrio={est.correlacaoTrio}
                status={est.status}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
