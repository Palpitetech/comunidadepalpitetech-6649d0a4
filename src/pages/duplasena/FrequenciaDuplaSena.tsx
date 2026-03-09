import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SeletorPeriodo } from "@/components/frequencia/SeletorPeriodo";
import { FiltroStatus, StatusFiltro } from "@/components/frequencia/FiltroStatus";
import { DezenaCard } from "@/components/frequencia/DezenaCard";
import { useFrequenciaDuplaSena } from "@/hooks/useFrequenciaDuplaSena";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { SnapshotButton } from "@/components/shared/SnapshotButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PERIODOS = [3, 5, 10, 15, 20, 25, 50];

export default function FrequenciaDuplaSena() {
  const isMobile = useIsMobile();
  const [periodo, setPeriodo] = useState<number>(10);
  const [filtroStatus, setFiltroStatus] = useState<StatusFiltro>("todas");
  const [sorteio, setSorteio] = useState<"sorteio1" | "sorteio2">("sorteio1");
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    data: estatisticas,
    isLoading,
    error,
  } = useFrequenciaDuplaSena(periodo);

  // Separar por sorteio
  const estatisticas_s1 = estatisticas?.s1 || [];
  const estatisticas_s2 = estatisticas?.s2 || [];

  // Ordenar por dezena (ordem natural)
  const ordenar = (data: typeof estatisticas_s1) =>
    [...data].sort((a, b) => a.dezena - b.dezena);

  const estatisticasOrdenadas_s1 = ordenar(estatisticas_s1);
  const estatisticasOrdenadas_s2 = ordenar(estatisticas_s2);

  // Calcular contagens por status
  const calcularContagem = (data: typeof estatisticas_s1) => ({
    todas: data.length,
    quentes: data.filter((e) => e.status === "quente").length,
    frias: data.filter((e) => e.status === "frio").length,
  });

  const contagem_s1 = calcularContagem(estatisticasOrdenadas_s1);
  const contagem_s2 = calcularContagem(estatisticasOrdenadas_s2);

  // Aplicar filtro
  const aplicarFiltro = (data: typeof estatisticas_s1) =>
    data.filter((est) => {
      if (filtroStatus === "todas") return true;
      return est.status === filtroStatus;
    });

  const estatisticasFiltradas_s1 = aplicarFiltro(estatisticasOrdenadas_s1);
  const estatisticasFiltradas_s2 = aplicarFiltro(estatisticasOrdenadas_s2);

  const currentContagem = sorteio === "sorteio1" ? contagem_s1 : contagem_s2;

  const renderCards = (estatisticasFiltered: typeof estatisticas_s1) => (
    <>
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 25 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-6 text-center">
          <p className="text-base">Erro ao carregar dados. Tente novamente.</p>
        </div>
      )}

      {!isLoading && !error && estatisticasFiltered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>
            Nenhuma dezena {filtroStatus === "quente" ? "quente" : "fria"} neste período.
          </p>
        </div>
      )}

      {!isLoading && !error && estatisticasFiltered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {estatisticasFiltered.map((est) => (
            <DezenaCard
              key={est.dezena}
              dezena={est.dezena}
              ultimaVez={est.ultimaVez}
              maiorSequencia={est.maiorSequencia}
              maiorAtraso={est.maiorAtraso}
              frequencia={est.frequencia}
              melhorDupla={est.melhorDupla}
              correlacaoDupla={est.correlacaoDupla}
              melhorTrio={est.melhorTrio || [0, 0]}
              correlacaoTrio={est.correlacaoTrio || 0}
              status={est.status}
            />
          ))}
        </div>
      )}
    </>
  );

  return (
    <MainLayout pageTitle="Análise de Dezenas - Dupla Sena">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        {/* Header desktop */}
        {!isMobile && (
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              Análise de Dezenas - Dupla Sena
            </h1>
            <SnapshotButton
              targetRef={contentRef}
              defaultTitle={`Análise de Dezenas Dupla Sena - Últimos ${periodo} concursos`}
            />
          </div>
        )}

        {/* Filtro + Período na mesma linha */}
        {!isLoading && !error && (
          <div className="flex items-center justify-between gap-2">
            <FiltroStatus
              selecionado={filtroStatus}
              onChange={setFiltroStatus}
              contagem={currentContagem}
            />
            <SeletorPeriodo
              periodos={PERIODOS}
              selecionado={periodo}
              onChange={setPeriodo}
            />
          </div>
        )}

        {/* Conteúdo capturável */}
        <div ref={contentRef}>
          <Tabs value={sorteio} onValueChange={(v) => setSorteio(v as "sorteio1" | "sorteio2")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sorteio1">Sorteio 1</TabsTrigger>
              <TabsTrigger value="sorteio2">Sorteio 2</TabsTrigger>
            </TabsList>

            <TabsContent value="sorteio1" className="mt-4">
              {renderCards(estatisticasFiltradas_s1)}
            </TabsContent>

            <TabsContent value="sorteio2" className="mt-4">
              {renderCards(estatisticasFiltradas_s2)}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
