import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SnapshotButton } from "@/components/shared/SnapshotButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTendenciasDuplaSena } from "@/hooks/useTendenciasDuplaSena";
import {
  TabelaEstatisticaGenerica,
  TabelaEstatisticaConfig,
} from "@/components/tendencias/TabelaEstatisticaGenerica";

const configParesImpares: TabelaEstatisticaConfig = {
  queryKey: "duplasena-estatisticas-pares-impares",
  campoDb: "qtd_pares",
  labelColunaPrincipal: "Qtd Pares",
  labelColunaComplementar: "Qtd Ímpares",
};

const configMoldura: TabelaEstatisticaConfig = {
  queryKey: "duplasena-estatisticas-moldura",
  campoDb: "qtd_moldura",
  labelColunaPrincipal: "Qtd Moldura",
  labelColunaComplementar: "Qtd Miolo",
};

const configPrimos: TabelaEstatisticaConfig = {
  queryKey: "duplasena-estatisticas-primos",
  campoDb: "qtd_primos",
  labelColunaPrincipal: "Qtd Primos",
  labelColunaComplementar: "Qtd Não Primos",
};

export default function TendenciasDuplaSena() {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);
  const [sorteio, setSorteio] = useState<"sorteio1" | "sorteio2">("sorteio1");

  const { data: tendencias, isLoading } = useTendenciasDuplaSena(50);

  if (isLoading) {
    return (
      <MainLayout pageTitle="Tendências - Dupla Sena">
        <div className="container-senior py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-muted rounded-lg w-1/3" />
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Tendências - Dupla Sena">
      <div className="container-senior py-6">
        {/* Header desktop */}
        {!isMobile && (
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-7 w-7 text-duplasena-primary" />
              <h1 className="text-xl font-bold">Tendências Dupla Sena</h1>
            </div>
            <SnapshotButton
              targetRef={contentRef}
              defaultTitle="Análise de Tendências - Dupla Sena"
            />
          </div>
        )}

        <div ref={contentRef} className="space-y-8">
          {/* Tabs para Sorteio 1 e Sorteio 2 */}
          <Tabs value={sorteio} onValueChange={(v) => setSorteio(v as "sorteio1" | "sorteio2")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sorteio1">Sorteio 1</TabsTrigger>
              <TabsTrigger value="sorteio2">Sorteio 2</TabsTrigger>
            </TabsList>

            <TabsContent value="sorteio1" className="space-y-8 mt-6">
              {/* Tabela de Pares/Ímpares */}
              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-duplasena-primary/10 text-base">
                    🎯
                  </span>
                  Pares e Ímpares
                </h2>
                <TabelaEstatisticaGenerica config={configParesImpares} />
              </section>

              {/* Tabela de Moldura */}
              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-duplasena-primary/10 text-base">
                    🖼️
                  </span>
                  Moldura e Miolo
                </h2>
                <TabelaEstatisticaGenerica config={configMoldura} />
              </section>

              {/* Tabela de Primos */}
              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-duplasena-primary/10 text-base">
                    🔢
                  </span>
                  Primos e Não Primos
                </h2>
                <TabelaEstatisticaGenerica config={configPrimos} />
              </section>
            </TabsContent>

            <TabsContent value="sorteio2" className="space-y-8 mt-6">
              {/* Tabela de Pares/Ímpares */}
              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-duplasena-primary/10 text-base">
                    🎯
                  </span>
                  Pares e Ímpares
                </h2>
                <TabelaEstatisticaGenerica config={configParesImpares} />
              </section>

              {/* Tabela de Moldura */}
              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-duplasena-primary/10 text-base">
                    🖼️
                  </span>
                  Moldura e Miolo
                </h2>
                <TabelaEstatisticaGenerica config={configMoldura} />
              </section>

              {/* Tabela de Primos */}
              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-duplasena-primary/10 text-base">
                    🔢
                  </span>
                  Primos e Não Primos
                </h2>
                <TabelaEstatisticaGenerica config={configPrimos} />
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
