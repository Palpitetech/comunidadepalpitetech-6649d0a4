import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { TabelaEstatistica } from "@/components/megasena/TabelaEstatistica";
import { useMegaSenaTendencias } from "@/hooks/useMegaSenaTendencias";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TendenciasMegaSena() {
  const { estatisticas, isLoading, error } = useMegaSenaTendencias(100);

  return (
    <MainLayout>
      <div className="space-y-6 pb-20">
        <PageHeader title="Tendências Mega Sena" />

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="w-10 h-10 mb-2" />
            <p>Erro ao carregar estatísticas</p>
          </div>
        )}

        {!isLoading && !error && !estatisticas && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="w-10 h-10 mb-2" />
            <p>Nenhum dado disponível ainda</p>
            <p className="text-sm mt-1">Os dados serão sincronizados em breve</p>
          </div>
        )}

        {estatisticas && (
          <div className="space-y-6">
            {/* Info Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Analisando {estatisticas.totalConcursos} concursos
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Último: #{estatisticas.ultimoConcurso}
              </Badge>
            </div>

            {/* Pares x Ímpares */}
            <section>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                <span className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs">
                  🎯
                </span>
                Pares x Ímpares
              </h2>
              <TabelaEstatistica
                dados={estatisticas.pares}
                labelPrincipal="Pares"
                labelComplementar="Ímpares"
                showComplementar={true}
              />
            </section>

            {/* Moldura */}
            <section>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-xs">
                  🔲
                </span>
                Moldura (Borda)
              </h2>
              <TabelaEstatistica
                dados={estatisticas.moldura}
                labelPrincipal="Moldura"
                labelComplementar="Miolo"
                showComplementar={true}
              />
            </section>

            {/* Primos */}
            <section>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs">
                  🔢
                </span>
                Números Primos
              </h2>
              <TabelaEstatistica
                dados={estatisticas.primos}
                labelPrincipal="Primos"
                showComplementar={false}
              />
            </section>

            {/* Repetidas */}
            <section>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                <span className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center text-xs">
                  🔁
                </span>
                Dezenas Repetidas
              </h2>
              <TabelaEstatistica
                dados={estatisticas.repetidas}
                labelPrincipal="Repetidas"
                showComplementar={false}
              />
            </section>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
