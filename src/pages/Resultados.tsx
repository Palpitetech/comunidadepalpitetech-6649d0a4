import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ResultadoCard } from "@/components/lotofacil/ResultadoCard";
import { ResultadoDetalhesSheet } from "@/components/lotofacil/ResultadoDetalhesSheet";
import { Skeleton } from "@/components/ui/skeleton";

interface Resultado {
  id: string;
  concurso_id: number;
  data_sorteio: string;
  dezenas: number[];
  qtd_pares: number | null;
  qtd_impares: number | null;
  qtd_moldura: number | null;
  qtd_primos: number | null;
  qtd_repetidas: number | null;
  acumulou: boolean | null;
  ciclo_numero: number | null;
  dezenas_faltantes_ciclo: number[] | null;
  premiacao_json: unknown;
  locais_ganhadores: unknown;
}

export default function Resultados() {
  const [selectedResultado, setSelectedResultado] = useState<Resultado | null>(null);

  const { data: resultados, isLoading, error } = useQuery({
    queryKey: ["resultados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados")
        .select("*")
        .order("concurso_id", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Resultado[];
    },
  });

  return (
    <MainLayout>
      <div className="container-senior py-6">
        {/* Header compacto */}
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold">Resultados</h1>
        </div>

        {/* Estado de Loading */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-4 px-2">
                <div className="flex gap-3">
                  <div className="flex flex-col gap-2 min-w-[72px]">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 15 }).map((_, j) => (
                        <Skeleton key={j} className="w-7 h-7 rounded-full" />
                      ))}
                    </div>
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado de Erro */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-center">
            <p className="text-base">Erro ao carregar os resultados. Tente novamente.</p>
          </div>
        )}

        {/* Lista de Resultados */}
        {resultados && resultados.length > 0 && (
          <div className="divide-y divide-border/50">
            {resultados.map((resultado) => (
              <ResultadoCard
                key={resultado.id}
                resultado={resultado}
                onClick={() => setSelectedResultado(resultado)}
              />
            ))}
          </div>
        )}

        {/* Estado Vazio */}
        {resultados && resultados.length === 0 && (
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p className="text-base text-muted-foreground">
              Nenhum resultado disponível ainda.
            </p>
          </div>
        )}

        {/* Sheet de Detalhes */}
        <ResultadoDetalhesSheet
          resultado={selectedResultado as any}
          open={!!selectedResultado}
          onOpenChange={(open) => !open && setSelectedResultado(null)}
        />
      </div>
    </MainLayout>
  );
}
