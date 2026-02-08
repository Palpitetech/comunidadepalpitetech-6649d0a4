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
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    L1
                  </span>
                  Linha 01 
                  <span className="text-xs font-normal text-muted-foreground">
                    (01-05)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="linha" indice={1} />
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    L2
                  </span>
                  Linha 02
                  <span className="text-xs font-normal text-muted-foreground">
                    (06-10)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="linha" indice={2} />
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    L3
                  </span>
                  Linha 03
                  <span className="text-xs font-normal text-muted-foreground">
                    (11-15)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="linha" indice={3} />
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    L4
                  </span>
                  Linha 04
                  <span className="text-xs font-normal text-muted-foreground">
                    (16-20)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="linha" indice={4} />
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    L5
                  </span>
                  Linha 05
                  <span className="text-xs font-normal text-muted-foreground">
                    (21-25)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="linha" indice={5} />
              </section>
            </div>
          </TabsContent>

          <TabsContent value="colunas">
            <div className="space-y-8">
              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary/50 text-secondary-foreground font-bold text-xs">
                    C1
                  </span>
                  Coluna 01
                  <span className="text-xs font-normal text-muted-foreground">
                    (01, 06, 11, 16, 21)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="coluna" indice={1} />
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary/50 text-secondary-foreground font-bold text-xs">
                    C2
                  </span>
                  Coluna 02
                  <span className="text-xs font-normal text-muted-foreground">
                    (02, 07, 12, 17, 22)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="coluna" indice={2} />
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary/50 text-secondary-foreground font-bold text-xs">
                    C3
                  </span>
                  Coluna 03
                  <span className="text-xs font-normal text-muted-foreground">
                    (03, 08, 13, 18, 23)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="coluna" indice={3} />
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary/50 text-secondary-foreground font-bold text-xs">
                    C4
                  </span>
                  Coluna 04
                  <span className="text-xs font-normal text-muted-foreground">
                    (04, 09, 14, 19, 24)
                  </span>
                </h2>
                <TabelaLinhaColunaIndividual tipo="coluna" indice={4} />
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary/50 text-secondary-foreground font-bold text-xs">
                    C5
                  </span>
                  Coluna 05
                  <span className="text-xs font-normal text-muted-foreground">
                    (05, 10, 15, 20, 25)
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
