import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ArrowRight,
  Filter,
  Users,
  CheckCircle2
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTendenciasDia } from "@/hooks/useTendenciasDia";
import { SeletorPeriodo } from "@/components/frequencia/SeletorPeriodo";
import { DezenaCirculoMini } from "@/components/lotofacil/DezenaCirculoMini";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatarDezena } from "@/lib/lotofacil";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FiltroRowProps {
  label: string;
  top3: { valor: number; ocorrencias: number; porcentagem: number }[];
  ultimoValor: number;
}

function FiltroRow({ label, top3, ultimoValor }: FiltroRowProps) {
  const isUltimoNoTop3 = top3.some((t) => t.valor === ultimoValor);
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
      <span className="text-xs font-medium text-muted-foreground w-20">{label}</span>
      <div className="flex items-center gap-1.5 flex-1 justify-center">
        {top3.map((t) => (
          <span
            key={t.valor}
            className={`
              px-2 py-0.5 rounded text-xs font-semibold
              ${t.valor === ultimoValor 
                ? "bg-foreground text-background" 
                : "bg-muted text-muted-foreground"
              }
            `}
          >
            {t.valor}
          </span>
        ))}
      </div>
      <div className="w-16 flex justify-end">
        <span className={`
          text-xs font-bold px-1.5 py-0.5 rounded
          ${isUltimoNoTop3 
            ? "text-foreground" 
            : "text-muted-foreground"
          }
        `}>
          {isUltimoNoTop3 ? "✓" : ""} {ultimoValor}
        </span>
      </div>
    </div>
  );
}

interface GrupoRowProps {
  label: string;
  grupo: { dezenas: number[]; ocorrencias: number; porcentagem: number } | null;
  onFixar?: () => void;
}

function GrupoRow({ label, grupo, onFixar }: GrupoRowProps) {
  if (!grupo) return null;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
      <span className="text-xs font-medium text-muted-foreground uppercase w-16">{label}</span>
      <div className="flex items-center gap-1 flex-1 justify-center">
        {grupo.dezenas.map((d) => (
          <DezenaCirculoMini key={d} dezena={d} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {grupo.ocorrencias}x
        </span>
        {onFixar && (
          <button 
            onClick={onFixar}
            className="text-primary hover:text-primary/80 transition-colors"
            title="Fixar no gerador"
          >
            <Target className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AnaliseDoDia() {
  const isMobile = useIsMobile();
  const [periodo, setPeriodo] = useState(10);
  const { data: tendencias, isLoading } = useTendenciasDia(periodo);

  // URLs para o gerador
  const geradorFixasUrl = tendencias?.fixas.length
    ? `/smart-gerador?fixas=${tendencias.fixas.map((f) => f.dezena).join(",")}`
    : "/smart-gerador";

  const buildGrupoUrl = (dezenas: number[]) => 
    `/smart-gerador?fixas=${dezenas.join(",")}`;

  return (
    <MainLayout pageTitle="Análise do Dia">
      <div className="container-senior py-3 space-y-3 max-w-lg mx-auto">
        {/* Header com período */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isMobile && <Target className="h-5 w-5 text-primary" />}
            <span className="text-xs text-muted-foreground">
              Baseado nos últimos {periodo} concursos
            </span>
          </div>
          <SeletorPeriodo
            periodos={[5, 10, 15, 20, 25, 50]}
            selecionado={periodo}
            onChange={setPeriodo}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : tendencias ? (
          <div className="space-y-3">
            {/* ÚLTIMO RESULTADO */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">
                    #{tendencias.ultimoConcurso.id}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(() => {
                      const [year, month, day] = tendencias.ultimoConcurso.data.split("-").map(Number);
                      return format(new Date(year, month - 1, day), "dd/MM", { locale: ptBR });
                    })()}
                  </span>
                </div>
              </div>
              
              {/* Dezenas em linha - Roxo Lotofácil */}
              <div className="flex flex-wrap gap-1 mb-2">
                {tendencias.ultimoConcurso.dezenas.map((d) => (
                  <div
                    key={d}
                    className="w-[30px] h-[30px] rounded-full flex items-center justify-center bg-[hsl(var(--palpite-dezena))] text-[hsl(var(--palpite-dezena-foreground))] text-sm font-semibold"
                  >
                    {d.toString().padStart(2, "0")}
                  </div>
                ))}
              </div>
              
              {/* Estatísticas em linha única */}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>Ímp: <strong className="text-foreground">{tendencias.ultimoConcurso.impares}</strong></span>
                <span>Rep: <strong className="text-foreground">{tendencias.ultimoConcurso.repetidas}</strong></span>
                <span>Mol: <strong className="text-foreground">{tendencias.ultimoConcurso.moldura}</strong></span>
                <span>Pri: <strong className="text-foreground">{tendencias.ultimoConcurso.primos}</strong></span>
                <span>M3: <strong className="text-foreground">{tendencias.ultimoConcurso.m3}</strong></span>
              </div>
            </div>

            {/* ESTRATÉGIA DE FILTROS */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Estratégia de Filtros</span>
                <span className="text-[10px] text-muted-foreground ml-auto">Top 3 | Último</span>
              </div>
              
              <div className="space-y-0">
                <FiltroRow 
                  label="Ímpares" 
                  top3={tendencias.filtros.impares.top3} 
                  ultimoValor={tendencias.filtros.impares.ultimoConcurso} 
                />
                <FiltroRow 
                  label="Repetidas" 
                  top3={tendencias.filtros.repetidas.top3} 
                  ultimoValor={tendencias.filtros.repetidas.ultimoConcurso} 
                />
                <FiltroRow 
                  label="Moldura" 
                  top3={tendencias.filtros.moldura.top3} 
                  ultimoValor={tendencias.filtros.moldura.ultimoConcurso} 
                />
                <FiltroRow 
                  label="Primos" 
                  top3={tendencias.filtros.primos.top3} 
                  ultimoValor={tendencias.filtros.primos.ultimoConcurso} 
                />
                <FiltroRow 
                  label="Múlt. 3" 
                  top3={tendencias.filtros.m3.top3} 
                  ultimoValor={tendencias.filtros.m3.ultimoConcurso} 
                />
              </div>
            </div>

            {/* DEZENAS FIXAR / EXCLUIR */}
            <div className="rounded-lg border bg-card p-3 space-y-3">
              {/* Fixar */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-4 w-4 text-status-quente" />
                  <span className="text-xs font-semibold">Dezenas para Fixar</span>
                  <span className="text-[10px] text-muted-foreground">≥70%</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {tendencias.fixas.length > 0 ? (
                    tendencias.fixas.map((d) => (
                      <span
                        key={d.dezena}
                        className="inline-flex items-center justify-center gap-0.5 px-1.5 py-1 rounded bg-foreground text-background text-xs font-bold"
                      >
                        {formatarDezena(d.dezena)}
                        <span className="text-[9px] opacity-70">{d.frequencia}%</span>
                      </span>
                    ))
                  ) : (
                    <span className="col-span-4 text-[11px] text-muted-foreground">Nenhuma dezena com ≥70% de frequência</span>
                  )}
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Excluir */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-semibold">Dezenas para Excluir</span>
                  <span className="text-[10px] text-muted-foreground">≤30%</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {tendencias.excluidas.length > 0 ? (
                    tendencias.excluidas.map((d) => (
                      <span
                        key={d.dezena}
                        className="inline-flex items-center justify-center gap-0.5 px-1.5 py-1 rounded bg-destructive/15 text-destructive border border-destructive/30 text-xs font-bold"
                      >
                        {formatarDezena(d.dezena)}
                        <span className="text-[9px] opacity-70">{d.frequencia}%</span>
                      </span>
                    ))
                  ) : (
                    <span className="col-span-4 text-[11px] text-muted-foreground">Nenhuma dezena com ≤30% de frequência</span>
                  )}
                </div>
              </div>
            </div>

            {/* GRUPOS PERFEITOS */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Grupos Perfeitos</span>
              </div>
              
              <div className="space-y-0">
                <GrupoRow 
                  label="Par" 
                  grupo={tendencias.grupos.par}
                  onFixar={tendencias.grupos.par ? () => window.location.href = buildGrupoUrl(tendencias.grupos.par!.dezenas) : undefined}
                />
                <GrupoRow 
                  label="Trio" 
                  grupo={tendencias.grupos.trio}
                  onFixar={tendencias.grupos.trio ? () => window.location.href = buildGrupoUrl(tendencias.grupos.trio!.dezenas) : undefined}
                />
                <GrupoRow 
                  label="Quadra" 
                  grupo={tendencias.grupos.quadra}
                  onFixar={tendencias.grupos.quadra ? () => window.location.href = buildGrupoUrl(tendencias.grupos.quadra!.dezenas) : undefined}
                />
                <GrupoRow 
                  label="Quina" 
                  grupo={tendencias.grupos.quina}
                  onFixar={tendencias.grupos.quina ? () => window.location.href = buildGrupoUrl(tendencias.grupos.quina!.dezenas) : undefined}
                />
              </div>
            </div>

            {/* CTA GERADOR */}
            <Link to={geradorFixasUrl} className="block">
              <Button className="w-full gap-2 bg-highlight hover:bg-highlight/90 text-highlight-foreground font-semibold h-10">
                <Sparkles className="h-4 w-4" />
                Usar Fixas no Gerador
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
