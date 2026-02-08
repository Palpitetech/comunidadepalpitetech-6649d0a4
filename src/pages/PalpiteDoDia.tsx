import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Lightbulb, TrendingUp, TrendingDown, ArrowRight, Square, Users, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTendenciasDia } from "@/hooks/useTendenciasDia";
import { SeletorPeriodo } from "@/components/frequencia/SeletorPeriodo";
import { DezenaCirculoMini } from "@/components/lotofacil/DezenaCirculoMini";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatarDezena } from "@/lib/lotofacil";

export default function PalpiteDoDia() {
  const isMobile = useIsMobile();
  const [periodo, setPeriodo] = useState(15);
  const { data: tendencias, isLoading } = useTendenciasDia(periodo);

  // Monta query string para o gerador com as fixas pré-selecionadas
  const geradorUrl = tendencias?.fixas.length 
    ? `/smart-gerador?fixas=${tendencias.fixas.map(f => f.dezena).join(",")}`
    : "/smart-gerador";

  return (
    <MainLayout pageTitle="Análise do Dia">
      <div className="container-senior py-4 space-y-4">
        {/* Header desktop */}
        {!isMobile && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-bold">Análise do Dia</h1>
            </div>
            <SeletorPeriodo 
              periodos={[3, 5, 10, 15, 20, 25, 50, 100]} 
              selecionado={periodo} 
              onChange={setPeriodo} 
            />
          </div>
        )}

        {/* Mobile: Período inline */}
        {isMobile && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Últimos {periodo} concursos
            </span>
            <SeletorPeriodo 
              periodos={[3, 5, 10, 15, 20, 25, 50, 100]} 
              selecionado={periodo} 
              onChange={setPeriodo} 
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : tendencias ? (
          <div className="space-y-4">
            {/* SEÇÃO PRINCIPAL: Fixas + CTA */}
            <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-status-quente" />
                  <h3 className="font-bold text-base">Fixas Sugeridas</h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-status-quente/20 text-status-quente font-medium">
                  {tendencias.fixas.length} dezenas
                </span>
              </div>
              
              {/* Badges compactos inline */}
              <div className="flex flex-wrap gap-1.5">
                {tendencias.fixas.length > 0 ? (
                  tendencias.fixas.map((d) => (
                    <div 
                      key={d.dezena} 
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-foreground text-background text-sm font-bold"
                    >
                      {formatarDezena(d.dezena)}
                      <span className="text-[10px] opacity-70">{d.frequencia}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma dezena quente no período
                  </p>
                )}
              </div>

              {/* CTA para Gerador */}
              <Link to={geradorUrl} className="block">
                <Button className="w-full gap-2 bg-highlight hover:bg-highlight/90 text-highlight-foreground font-semibold h-11">
                  <Sparkles className="h-4 w-4" />
                  Usar no Gerador
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Excluídas - Compacto */}
            <div className="rounded-xl border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <h3 className="font-semibold text-sm">Excluídas</h3>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {tendencias.excluidas.length} dezenas frias
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tendencias.excluidas.length > 0 ? (
                  tendencias.excluidas.map((d) => (
                    <div 
                      key={d.dezena} 
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/15 text-destructive border border-destructive/30 text-sm font-semibold"
                    >
                      {formatarDezena(d.dezena)}
                      <span className="text-[10px] opacity-70">{d.frequencia}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma dezena fria no período
                  </p>
                )}
              </div>
            </div>

            {/* Grid de Estatísticas Compacto */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 rounded-xl bg-card border">
                <div className="text-xl font-bold text-primary">
                  {tendencias.sugestaoPares}
                </div>
                <div className="text-[11px] text-muted-foreground">Pares</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-card border">
                <div className="text-xl font-bold text-primary">
                  {tendencias.sugestaoRepetidas}
                </div>
                <div className="text-[11px] text-muted-foreground">Repetidas</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-card border">
                <div className="text-xl font-bold text-primary">
                  {tendencias.sugestaoMoldura}
                </div>
                <div className="text-[11px] text-muted-foreground">Moldura</div>
              </div>
            </div>

            {/* Molduras + Duplas - Layout lado a lado em desktop */}
            <div className="grid gap-3 md:grid-cols-2">
              {/* Melhores Molduras */}
              <div className="rounded-xl border bg-card p-3 space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Square className="h-4 w-4 text-primary" />
                  Top 3 Molduras
                </h3>
                <div className="space-y-1.5">
                  {tendencias.melhoresMolduras.map((m, i) => (
                    <div
                      key={m.qtdMoldura}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/40 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                        <span className="font-medium">{m.qtdMoldura}M + {m.qtdMiolo}C</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {m.ocorrencias}x ({m.porcentagem.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Melhores Duplas */}
              <div className="rounded-xl border bg-card p-3 space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Top 3 Duques
                </h3>
                <div className="space-y-1.5">
                  {tendencias.melhoresDuplas.map((d, i) => (
                    <div
                      key={d.dezenas.join("-")}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/40 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                        <div className="flex items-center gap-1">
                          <DezenaCirculoMini dezena={d.dezenas[0]} />
                          <span className="text-muted-foreground text-xs">+</span>
                          <DezenaCirculoMini dezena={d.dezenas[1]} />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {d.ocorrencias}x ({d.porcentagem.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contexto - Minimalista */}
            <div className="text-center text-[11px] text-muted-foreground pt-2">
              Concurso #{tendencias.ultimoConcurso} • {tendencias.dezanasUltimoConcurso.map(formatarDezena).join("-")}
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
