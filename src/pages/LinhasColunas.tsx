import { useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { LayoutGrid } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SnapshotButton } from "@/components/shared/SnapshotButton";
import { TabelaLinhaColunaIndividual } from "@/components/tendencias/TabelaLinhaColunaIndividual";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LinhasColunas() {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <MainLayout pageTitle="Linhas e Colunas">
      <div className="container-senior py-6">
        {/* Header desktop */}
        {!isMobile && (
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <LayoutGrid className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold">Análise por Linhas e Colunas</h1>
            </div>
            <SnapshotButton 
              targetRef={contentRef} 
              defaultTitle="Análise de Linhas e Colunas - Lotofácil"
            />
          </div>
        )}

        <Tabs defaultValue="linhas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="linhas">Linhas (Horizontal)</TabsTrigger>
            <TabsTrigger value="colunas">Colunas (Vertical)</TabsTrigger>
          </TabsList>

          <TabsContent value="linhas">
            <div ref={contentRef} className="space-y-8">
              {/* Linha 1: 01-05 */}
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    L1
                  </span>
                  Linha 01 
                  <span className="text-sm font-normal text-muted-foreground">
                    (dezenas 01 a 05)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="linha" indice={1} />
              </section>

              {/* Linha 2: 06-10 */}
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    L2
                  </span>
                  Linha 02
                  <span className="text-sm font-normal text-muted-foreground">
                    (dezenas 06 a 10)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="linha" indice={2} />
              </section>

              {/* Linha 3: 11-15 */}
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    L3
                  </span>
                  Linha 03
                  <span className="text-sm font-normal text-muted-foreground">
                    (dezenas 11 a 15)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="linha" indice={3} />
              </section>

              {/* Linha 4: 16-20 */}
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    L4
                  </span>
                  Linha 04
                  <span className="text-sm font-normal text-muted-foreground">
                    (dezenas 16 a 20)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="linha" indice={4} />
              </section>

              {/* Linha 5: 21-25 */}
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    L5
                  </span>
                  Linha 05
                  <span className="text-sm font-normal text-muted-foreground">
                    (dezenas 21 a 25)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="linha" indice={5} />
              </section>
            </div>
          </TabsContent>

          <TabsContent value="colunas">
            <div className="space-y-8">
              {/* Coluna 1: 01, 06, 11, 16, 21 */}
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 text-secondary-foreground font-bold text-sm">
                    C1
                  </span>
                  Coluna 01
                  <span className="text-sm font-normal text-muted-foreground">
                    (dezenas 01, 06, 11, 16, 21)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="coluna" indice={1} />
              </section>

              {/* Coluna 2 */}
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 text-secondary-foreground font-bold text-sm">
                    C2
                  </span>
                  Coluna 02
                  <span className="text-sm font-normal text-muted-foreground">
                    (dezenas 02, 07, 12, 17, 22)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="coluna" indice={2} />
              </section>

              {/* Coluna 3 */}
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 text-secondary-foreground font-bold text-sm">
                    C3
                  </span>
                  Coluna 03
                  <span className="text-sm font-normal text-muted-foreground">
                    (dezenas 03, 08, 13, 18, 23)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="coluna" indice={3} />
              </section>

              {/* Coluna 4 */}
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 text-secondary-foreground font-bold text-sm">
                    C4
                  </span>
                  Coluna 04
                  <span className="text-sm font-normal text-muted-foreground">
                    (dezenas 04, 09, 14, 19, 24)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="coluna" indice={4} />
              </section>

              {/* Coluna 5 */}
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 text-secondary-foreground font-bold text-sm">
                    C5
                  </span>
                  Coluna 05
                  <span className="text-sm font-normal text-muted-foreground">
                    (dezenas 05, 10, 15, 20, 25)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="coluna" indice={5} />
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
