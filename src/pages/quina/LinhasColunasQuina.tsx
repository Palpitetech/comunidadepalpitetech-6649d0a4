import { useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { LayoutGrid } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SnapshotButton } from "@/components/shared/SnapshotButton";
import { TabelaLinhaColunaIndividual } from "@/components/tendencias/TabelaLinhaColunaIndividual";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Quina: grid 8x10 (8 linhas, 10 colunas), dezenas 1-80
 * Linha 1: 01-10, Linha 2: 11-20, ..., Linha 8: 71-80
 * Coluna 1: 01,11,21,...,71  Coluna 10: 10,20,...,80
 */

const linhas = Array.from({ length: 8 }, (_, i) => ({
  indice: i + 1,
  label: `Linha ${String(i + 1).padStart(2, "0")}`,
  range: `(${String(i * 10 + 1).padStart(2, "0")}-${String((i + 1) * 10).padStart(2, "0")})`,
}));

const colunas = Array.from({ length: 10 }, (_, i) => {
  const nums = Array.from({ length: 8 }, (_, r) => String(r * 10 + i + 1).padStart(2, "0"));
  return {
    indice: i + 1,
    label: `Coluna ${String(i + 1).padStart(2, "0")}`,
    range: `(${nums.join(", ")})`,
  };
});

export default function LinhasColunasQuina() {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <MainLayout pageTitle="Linhas e Colunas – Quina">
      <div className="container-senior py-6 hidden md:block">
        {!isMobile && (
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <LayoutGrid className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold">Linhas e Colunas – Quina</h1>
            </div>
            <SnapshotButton
              targetRef={contentRef}
              defaultTitle="Análise de Linhas e Colunas - Quina"
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
              {linhas.map((l) => (
                <section key={l.indice}>
                  <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      L{l.indice}
                    </span>
                    {l.label}
                    <span className="text-xs font-normal text-muted-foreground">
                      {l.range}
                    </span>
                  </h2>
                  <TabelaLinhaColunaIndividual tipo="linha" indice={l.indice} loteria="quina" />
                </section>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="colunas">
            <div className="space-y-8">
              {colunas.map((c) => (
                <section key={c.indice}>
                  <h2 className="text-base font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary/50 text-secondary-foreground font-bold text-xs">
                      C{c.indice}
                    </span>
                    {c.label}
                    <span className="text-xs font-normal text-muted-foreground overflow-hidden text-ellipsis">
                      {c.range}
                    </span>
                  </h2>
                  <TabelaLinhaColunaIndividual tipo="coluna" indice={c.indice} loteria="quina" />
                </section>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
