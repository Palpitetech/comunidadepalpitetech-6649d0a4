import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Lightbulb, TrendingUp, TrendingDown, Hash, Square, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTendenciasDia } from "@/hooks/useTendenciasDia";
import { SeletorPeriodo } from "@/components/frequencia/SeletorPeriodo";
import { DezenaCirculoMini } from "@/components/lotofacil/DezenaCirculoMini";
import { Skeleton } from "@/components/ui/skeleton";
import { formatarDezena } from "@/lib/lotofacil";

export default function PalpiteDoDia() {
  const isMobile = useIsMobile();
  const [periodo, setPeriodo] = useState(15);
  const { data: tendencias, isLoading } = useTendenciasDia(periodo);

  return (
    <MainLayout pageTitle="Palpite do Dia">
      <div className="container-senior py-6 space-y-6">
        {/* Header desktop */}
        {!isMobile && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold">Palpite do Dia</h1>
            </div>
          </div>
        )}

        {/* Filtro de período */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Análise baseada nos últimos {periodo} concursos
          </p>
          <SeletorPeriodo 
            periodos={[3, 5, 10, 15, 20, 25, 50, 100]} 
            selecionado={periodo} 
            onChange={setPeriodo} 
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : tendencias ? (
          <div className="space-y-6">
            {/* Fixas e Excluídas */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Fixas */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-status-quente" />
                  <h3 className="font-semibold">Fixas Sugeridas</h3>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Dezenas quentes
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tendencias.fixas.length > 0 ? (
                    tendencias.fixas.map((d) => (
                      <div key={d.dezena} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
                          {formatarDezena(d.dezena)}
                        </div>
                        <span className="text-[10px] text-status-quente">{d.frequencia}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma dezena com frequência alta no período
                    </p>
                  )}
                </div>
              </div>

              {/* Excluídas */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold">Excluídas Sugeridas</h3>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Dezenas frias
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tendencias.excluidas.length > 0 ? (
                    tendencias.excluidas.map((d) => (
                      <div key={d.dezena} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-destructive/20 text-destructive border-2 border-destructive/30 flex items-center justify-center font-bold text-sm">
                          {formatarDezena(d.dezena)}
                        </div>
                        <span className="text-[10px] text-destructive">{d.frequencia}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma dezena com frequência baixa no período
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Filtros Sugeridos */}
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                Filtros Sugeridos
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">
                    {tendencias.sugestaoPares}
                  </div>
                  <div className="text-xs text-muted-foreground">Dezenas Pares</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">
                    {tendencias.sugestaoRepetidas}
                  </div>
                  <div className="text-xs text-muted-foreground">Repetidas</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">
                    {tendencias.sugestaoMoldura}
                  </div>
                  <div className="text-xs text-muted-foreground">Na Moldura</div>
                </div>
              </div>
            </div>

            {/* Melhores Molduras */}
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Square className="h-5 w-5 text-primary" />
                As 3 Melhores Molduras
              </h3>
              <div className="space-y-2">
                {tendencias.melhoresMolduras.map((m, i) => (
                  <div
                    key={m.qtdMoldura}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                      </span>
                      <div>
                        <span className="font-semibold">{m.qtdMoldura} Moldura</span>
                        <span className="text-muted-foreground"> + </span>
                        <span className="font-semibold">{m.qtdMiolo} Miolo</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{m.ocorrencias}x</div>
                      <div className="text-xs text-muted-foreground">
                        {m.porcentagem.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Melhores Duplas */}
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Os 3 Melhores Duques
              </h3>
              <div className="space-y-2">
                {tendencias.melhoresDuplas.map((d, i) => (
                  <div
                    key={d.dezenas.join("-")}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                      </span>
                      <div className="flex items-center gap-2">
                        <DezenaCirculoMini dezena={d.dezenas[0]} />
                        <span className="text-muted-foreground">+</span>
                        <DezenaCirculoMini dezena={d.dezenas[1]} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{d.ocorrencias}x</div>
                      <div className="text-xs text-muted-foreground">
                        {d.porcentagem.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contexto */}
            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              Baseado no concurso #{tendencias.ultimoConcurso} • Último sorteio:{" "}
              {tendencias.dezanasUltimoConcurso.map(formatarDezena).join(" - ")}
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
