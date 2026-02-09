import { useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { LayoutGrid } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SnapshotButton } from "@/components/shared/SnapshotButton";
import { TabelaLinhaColunaDuplaSena } from "@/components/duplasena/TabelaLinhaColunaDuplaSena";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helpers para gerar os números de cada linha/coluna (grid 5x10)
const getLinhaNumeros = (linha: number): string => {
  const inicio = (linha - 1) * 10 + 1;
  const fim = linha * 10;
  return `(${String(inicio).padStart(2, '0')}-${String(fim).padStart(2, '0')})`;
};

const getColunaNumeros = (coluna: number): string => {
  const numeros: string[] = [];
  for (let linha = 1; linha <= 5; linha++) {
    const numero = (linha - 1) * 10 + coluna;
    numeros.push(String(numero).padStart(2, '0'));
  }
  return `(${numeros.join(', ')})`;
};

export default function LinhasColunasDuplaSena() {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);
  const [sorteioAtivo, setSorteioAtivo] = useState<"1" | "2">("1");

  return (
    <MainLayout pageTitle="Linhas e Colunas">
      <div className="container-senior py-6">
        {/* Header desktop */}
        {!isMobile && (
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <LayoutGrid className="h-7 w-7 text-duplasena-primary" />
              <h1 className="text-xl font-bold">Análise por Linhas e Colunas</h1>
              <span className="text-2xl">🎯</span>
            </div>
            <SnapshotButton 
              targetRef={contentRef} 
              defaultTitle="Análise de Linhas e Colunas - Dupla Sena"
            />
          </div>
        )}

        {/* Toggle Sorteio */}
        <div className="flex rounded-lg p-1 bg-muted/50 mb-6 max-w-xs">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              sorteioAtivo === "1"
                ? "bg-duplasena-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setSorteioAtivo("1")}
          >
            Sorteio 1
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              sorteioAtivo === "2"
                ? "bg-duplasena-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setSorteioAtivo("2")}
          >
            Sorteio 2
          </button>
        </div>

        <Tabs defaultValue="linhas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="linhas">Linhas (5)</TabsTrigger>
            <TabsTrigger value="colunas">Colunas (10)</TabsTrigger>
          </TabsList>

          <TabsContent value="linhas">
            <div ref={contentRef} className="space-y-6">
              {[1, 2, 3, 4, 5].map((linha) => (
                <section key={linha}>
                  <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-duplasena-primary/10 text-duplasena-primary font-bold text-xs">
                      L{linha}
                    </span>
                    Linha {String(linha).padStart(2, '0')}
                    <span className="text-xs font-normal text-muted-foreground">
                      {getLinhaNumeros(linha)}
                    </span>
                  </h2>
                  <TabelaLinhaColunaDuplaSena tipo="linha" indice={linha} sorteio={sorteioAtivo} />
                </section>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="colunas">
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((coluna) => (
                <section key={coluna}>
                  <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary/50 text-secondary-foreground font-bold text-xs">
                      C{coluna}
                    </span>
                    Coluna {String(coluna).padStart(2, '0')}
                    <span className="text-xs font-normal text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                      {getColunaNumeros(coluna)}
                    </span>
                  </h2>
                  <TabelaLinhaColunaDuplaSena tipo="coluna" indice={coluna} sorteio={sorteioAtivo} />
                </section>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
