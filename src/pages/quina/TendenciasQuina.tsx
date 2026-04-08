import { useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SnapshotButton } from "@/components/shared/SnapshotButton";
import { 
  TabelaEstatisticaGenerica, 
  TabelaEstatisticaConfig 
} from "@/components/tendencias/TabelaEstatisticaGenerica";

const configParesImpares: TabelaEstatisticaConfig = {
  queryKey: "quina-estatisticas-pares-impares",
  campoDb: "qtd_pares",
  labelColunaPrincipal: "Qtd Pares",
  labelColunaComplementar: "Qtd Ímpares",
  loteria: "quina",
  dezenasPorSorteio: 5,
};

const configMoldura: TabelaEstatisticaConfig = {
  queryKey: "quina-estatisticas-moldura",
  campoDb: "qtd_moldura",
  labelColunaPrincipal: "Qtd Moldura",
  labelColunaComplementar: "Qtd Miolo",
  loteria: "quina",
  dezenasPorSorteio: 5,
};

const configPrimos: TabelaEstatisticaConfig = {
  queryKey: "quina-estatisticas-primos",
  campoDb: "qtd_primos",
  labelColunaPrincipal: "Qtd Primos",
  labelColunaComplementar: "Qtd Não Primos",
  loteria: "quina",
  dezenasPorSorteio: 5,
};

const configRepetidas: TabelaEstatisticaConfig = {
  queryKey: "quina-estatisticas-repetidas",
  campoDb: "qtd_repetidas",
  labelColunaPrincipal: "Qtd Repetidas",
  labelColunaComplementar: "Qtd Novas",
  loteria: "quina",
  dezenasPorSorteio: 5,
};

export default function TendenciasQuina() {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <MainLayout pageTitle="Tendências – Quina">
      <div className="container-senior py-6">
        {!isMobile && (
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold">Tendências – Quina</h1>
            </div>
            <SnapshotButton 
              targetRef={contentRef} 
              defaultTitle="Análise de Tendências - Quina"
            />
          </div>
        )}

        <div ref={contentRef} className="space-y-8">
          <section>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-base">🎯</span>
              Pares e Ímpares
            </h2>
            <TabelaEstatisticaGenerica config={configParesImpares} />
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-base">🖼️</span>
              Moldura e Miolo
            </h2>
            <TabelaEstatisticaGenerica config={configMoldura} />
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-base">🔢</span>
              Primos e Não Primos
            </h2>
            <TabelaEstatisticaGenerica config={configPrimos} />
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-base">🔄</span>
              Repetidas e Novas
            </h2>
            <TabelaEstatisticaGenerica config={configRepetidas} />
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
