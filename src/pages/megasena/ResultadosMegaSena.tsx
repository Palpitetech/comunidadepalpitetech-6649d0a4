import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResultadoCard } from "@/components/megasena/ResultadoCard";
import { useMegaSenaResultados } from "@/hooks/useMegaSenaResultados";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export default function ResultadosMegaSena() {
  const { data: resultados, isLoading, error } = useMegaSenaResultados(100);

  return (
    <MainLayout>
      <div className="space-y-4 pb-20">
        <PageHeader title="Resultados Mega Sena" />

        {isLoading && (
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="w-10 h-10 mb-2" />
            <p>Erro ao carregar resultados</p>
          </div>
        )}

        {!isLoading && !error && resultados && resultados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="w-10 h-10 mb-2" />
            <p>Nenhum resultado disponível ainda</p>
            <p className="text-sm mt-1">Os dados serão sincronizados em breve</p>
          </div>
        )}

        {resultados && resultados.length > 0 && (
          <div className="grid gap-3">
            {resultados.map((resultado, index) => {
              const anteriores = resultados[index + 1]?.dezenas || [];
              return (
                <ResultadoCard
                  key={resultado.id}
                  concursoId={resultado.concurso_id}
                  dataSorteio={resultado.data_sorteio}
                  dezenas={resultado.dezenas}
                  acumulou={resultado.acumulou ?? false}
                  qtdPares={resultado.qtd_pares ?? undefined}
                  qtdImpares={resultado.qtd_impares ?? undefined}
                  qtdMoldura={resultado.qtd_moldura ?? undefined}
                  qtdPrimos={resultado.qtd_primos ?? undefined}
                  qtdRepetidas={resultado.qtd_repetidas ?? undefined}
                  dezenasAnteriores={anteriores}
                />
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
