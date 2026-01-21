import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SeletorPeriodo } from "@/components/frequencia/SeletorPeriodo";
import { FiltroStatus, StatusFiltro } from "@/components/frequencia/FiltroStatus";
import { DezenaCard } from "@/components/frequencia/DezenaCard";
import { useFrequenciaDezenas } from "@/hooks/useFrequenciaDezenas";
import { Skeleton } from "@/components/ui/skeleton";
import { SnapshotButton } from "@/components/shared/SnapshotButton";

const PERIODOS = [3, 5, 10, 15, 20, 25, 50, 100];

export default function Frequencia() {
  const [periodo, setPeriodo] = useState<number>(10);
  const [filtroStatus, setFiltroStatus] = useState<StatusFiltro>("todas");
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    data: estatisticas,
    isLoading,
    error,
  } = useFrequenciaDezenas(periodo);

  // Ordenar por dezena (ordem natural)
  const estatisticasOrdenadas = estatisticas
    ? [...estatisticas].sort((a, b) => a.dezena - b.dezena)
    : [];

  // Calcular contagens por status
  const contagem = {
    todas: estatisticas?.length ?? 0,
    quentes: estatisticas?.filter((e) => e.status === "quente").length ?? 0,
    frias: estatisticas?.filter((e) => e.status === "frio").length ?? 0,
  };

  // Aplicar filtro
  const estatisticasFiltradas = estatisticasOrdenadas.filter((est) => {
    if (filtroStatus === "todas") return true;
    return est.status === filtroStatus;
  });

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
            Análise de Dezenas
          </h1>
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <SnapshotButton 
              targetRef={contentRef} 
              defaultTitle={`Análise de Dezenas - Últimos ${periodo} concursos`}
            />
            <SeletorPeriodo
              periodos={PERIODOS}
              selecionado={periodo}
              onChange={setPeriodo}
            />
          </div>
        </div>

        {/* Conteúdo capturável */}
        <div ref={contentRef} className="space-y-6">

        {/* Filtro de Status */}
        {!isLoading && !error && (
          <FiltroStatus
            selecionado={filtroStatus}
            onChange={setFiltroStatus}
            contagem={contagem}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 25 }).map((_, i) => (
              <Skeleton key={i} className="h-[280px] rounded-xl" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-xl p-6 text-center">
            <p className="text-base">Erro ao carregar dados. Tente novamente.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && estatisticasFiltradas.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>
              Nenhuma dezena {filtroStatus === "quente" ? "quente" : "fria"} neste período.
            </p>
          </div>
        )}

        {/* Grid de Cards */}
        {!isLoading && !error && estatisticasFiltradas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {estatisticasFiltradas.map((est) => (
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
      </div>
    </MainLayout>
  );
}
