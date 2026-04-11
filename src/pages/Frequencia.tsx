import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SeletorPeriodo } from "@/components/frequencia/SeletorPeriodo";
import { FiltroStatus, StatusFiltro } from "@/components/frequencia/FiltroStatus";
import { DezenaCard } from "@/components/frequencia/DezenaCard";
import { useFrequenciaDezenas } from "@/hooks/useFrequenciaDezenas";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { SnapshotButton } from "@/components/shared/SnapshotButton";

const PERIODOS = [3, 5, 10, 15, 20, 25, 50, 100];

export default function Frequencia() {
  const isMobile = useIsMobile();
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
    <MainLayout pageTitle="Análise de Dezenas">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        {!isMobile && (
          <div className="flex items-center justify-end gap-4">
            <SnapshotButton
              targetRef={contentRef}
              defaultTitle={`Análise de Dezenas - Últimos ${periodo} concursos`}
            />
          </div>
        )}

        {/* Filtro + Período na mesma linha */}
        <div ref={contentRef} className="space-y-4">
          {!isLoading && !error && (
            <div className="flex items-center justify-between gap-2">
              <FiltroStatus
                selecionado={filtroStatus}
                onChange={setFiltroStatus}
                contagem={contagem}
              />
              <SeletorPeriodo
                periodos={PERIODOS}
                selecionado={periodo}
                onChange={setPeriodo}
              />
            </div>
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
