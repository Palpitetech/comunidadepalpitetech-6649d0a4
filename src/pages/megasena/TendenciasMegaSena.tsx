import { useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SnapshotButton } from "@/components/shared/SnapshotButton";
import { 
  TabelaEstatisticaMegaSena, 
  TabelaEstatisticaConfig 
} from "@/components/megasena/TabelaEstatisticaMegaSena";

const configParesImpares: TabelaEstatisticaConfig = {
  queryKey: "megasena-estatisticas-pares-impares",
  campoDb: "qtd_pares",
  labelColunaPrincipal: "Qtd Pares",
  labelColunaComplementar: "Qtd Ímpares",
  totalDezenas: 6,
};

const configMoldura: TabelaEstatisticaConfig = {
  queryKey: "megasena-estatisticas-moldura",
  campoDb: "qtd_moldura",
  labelColunaPrincipal: "Qtd Moldura",
  labelColunaComplementar: "Qtd Miolo",
  totalDezenas: 6,
};

const configPrimos: TabelaEstatisticaConfig = {
  queryKey: "megasena-estatisticas-primos",
  campoDb: "qtd_primos",
  labelColunaPrincipal: "Qtd Primos",
  labelColunaComplementar: "Qtd Não Primos",
  totalDezenas: 6,
};

const configRepetidas: TabelaEstatisticaConfig = {
  queryKey: "megasena-estatisticas-repetidas",
  campoDb: "qtd_repetidas",
  labelColunaPrincipal: "Qtd Repetidas",
  labelColunaComplementar: "Qtd Novas",
  totalDezenas: 6,
};

export default function TendenciasMegaSena() {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <MainLayout pageTitle="Tendências">
      <div className="container-senior py-6">
        {/* Header desktop */}
        {!isMobile && (
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold">Tendências Mega Sena</h1>
            </div>
            <SnapshotButton 
              targetRef={contentRef} 
              defaultTitle="Análise de Tendências - Mega Sena"
            />
          </div>
        )}

        <div ref={contentRef} className="space-y-8">
          {/* Tabela de Pares/Ímpares */}
          <section>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-base">
                🎯
              </span>
              Pares e Ímpares
            </h2>
            <TabelaEstatisticaMegaSena config={configParesImpares} />
          </section>

          {/* Tabela de Moldura */}
          <section>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-base">
                🖼️
              </span>
              Moldura e Miolo
            </h2>
            <TabelaEstatisticaMegaSena config={configMoldura} />
          </section>

          {/* Tabela de Primos */}
          <section>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-base">
                🔢
              </span>
              Primos e Não Primos
            </h2>
            <TabelaEstatisticaMegaSena config={configPrimos} />
          </section>

          {/* Tabela de Repetidas */}
          <section>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-base">
                🔄
              </span>
              Repetidas e Novas
            </h2>
            <TabelaEstatisticaMegaSena config={configRepetidas} />
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
