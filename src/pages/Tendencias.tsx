import { useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SnapshotButton } from "@/components/shared/SnapshotButton";
import { 
  TabelaEstatisticaGenerica, 
  TabelaEstatisticaConfig 
} from "@/components/tendencias/TabelaEstatisticaGenerica";
import { TabelaLinhasColunas } from "@/components/tendencias/TabelaLinhasColunas";

const configParesImpares: TabelaEstatisticaConfig = {
  queryKey: "estatisticas-pares-impares",
  campoDb: "qtd_pares",
  labelColunaPrincipal: "Qtd Pares",
  labelColunaComplementar: "Qtd Ímpares",
};

const configMoldura: TabelaEstatisticaConfig = {
  queryKey: "estatisticas-moldura",
  campoDb: "qtd_moldura",
  labelColunaPrincipal: "Qtd Moldura",
  labelColunaComplementar: "Qtd Miolo",
};

const configPrimos: TabelaEstatisticaConfig = {
  queryKey: "estatisticas-primos",
  campoDb: "qtd_primos",
  labelColunaPrincipal: "Qtd Primos",
  labelColunaComplementar: "Qtd Não Primos",
};

const configRepetidas: TabelaEstatisticaConfig = {
  queryKey: "estatisticas-repetidas",
  campoDb: "qtd_repetidas",
  labelColunaPrincipal: "Qtd Repetidas",
  labelColunaComplementar: "Qtd Novas",
};

export default function Tendencias() {
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
              <h1 className="text-xl font-bold">Tendências</h1>
            </div>
            <SnapshotButton 
              targetRef={contentRef} 
              defaultTitle="Análise de Tendências - Lotofácil"
            />
          </div>
        )}

        <div ref={contentRef} className="space-y-8">
          {/* Tabela de Pares/Ímpares */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Combinações de Pares e Ímpares
            </h2>
            <TabelaEstatisticaGenerica config={configParesImpares} />
          </section>

          {/* Tabela de Moldura */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🖼️</span>
              Combinações de Moldura e Miolo
            </h2>
            <TabelaEstatisticaGenerica config={configMoldura} />
          </section>

          {/* Tabela de Primos */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔢</span>
              Combinações de Primos e Não Primos
            </h2>
            <TabelaEstatisticaGenerica config={configPrimos} />
          </section>

          {/* Tabela de Repetidas */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔄</span>
              Combinações de Repetidas e Novas
            </h2>
            <TabelaEstatisticaGenerica config={configRepetidas} />
          </section>

          {/* Tabela de Linhas */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Distribuição por Linhas
            </h2>
            <TabelaLinhasColunas tipo="linhas" />
          </section>

          {/* Tabela de Colunas */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Distribuição por Colunas
            </h2>
            <TabelaLinhasColunas tipo="colunas" />
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
