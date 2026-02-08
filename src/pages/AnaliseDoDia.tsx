import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  Users,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { useTendenciasDia } from "@/hooks/useTendenciasDia";
import { SeletorPeriodo } from "@/components/frequencia/SeletorPeriodo";
import { DezenaCirculoMini } from "@/components/lotofacil/DezenaCirculoMini";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatarDezena } from "@/lib/lotofacil";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FloatingNotes } from "@/components/analise/FloatingNotes";
import { ConfirmNavigationDialog } from "@/components/analise/ConfirmNavigationDialog";

type FiltroKey = "impares" | "repetidas" | "moldura" | "primos" | "m3";

interface SelectedFilters {
  impares: number[];
  repetidas: number[];
  moldura: number[];
  primos: number[];
  m3: number[];
}

interface FiltroRowProps {
  label: string;
  filtroKey: FiltroKey;
  top3: { valor: number; ocorrencias: number; porcentagem: number }[];
  ultimoValor: number;
  selectedValues: number[];
  onToggleValue: (key: FiltroKey, value: number) => void;
}

function FiltroRow({ label, filtroKey, top3, ultimoValor, selectedValues, onToggleValue }: FiltroRowProps) {
  const isUltimoNoTop3 = top3.some((t) => t.valor === ultimoValor);
  
  return (
    <div className="flex items-center gap-2 py-2 border-b border-border/50 last:border-b-0">
      <span className="text-xs font-medium text-muted-foreground w-16">{label}</span>
      <div className="flex items-center gap-1.5 flex-1 justify-center">
        {top3.map((t) => {
          const isSelected = selectedValues.includes(t.valor);
          return (
            <button
              key={t.valor}
              onClick={() => onToggleValue(filtroKey, t.valor)}
              className={`
                px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer
                ${isSelected 
                  ? "bg-highlight text-highlight-foreground ring-2 ring-highlight/50" 
                  : t.valor === ultimoValor 
                    ? "bg-foreground text-background hover:ring-2 hover:ring-foreground/30" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }
              `}
            >
              {t.valor}
            </button>
          );
        })}
      </div>
      <div className="w-12 flex justify-end">
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
    <div className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-b-0">
      <span className="text-xs font-medium text-muted-foreground uppercase w-14 shrink-0">{label}</span>
      <div className="flex items-center gap-1 flex-1">
        {grupo.dezenas.map((d) => (
          <DezenaCirculoMini key={d} dezena={d} />
        ))}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {grupo.ocorrencias}x
      </span>
      {onFixar && (
        <button 
          onClick={onFixar}
          className="text-primary hover:text-primary/80 transition-colors shrink-0"
          title="Fixar no gerador"
        >
          <Target className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function AnaliseDoDia() {
  const [periodo, setPeriodo] = useState(10);
  const { data: tendencias, isLoading } = useTendenciasDia(periodo);
  
  // Estados para filtros selecionados (agora por valor individual)
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    impares: [],
    repetidas: [],
    moldura: [],
    primos: [],
    m3: [],
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Estados para dezenas fixas e excluídas selecionadas
  const [selectedFixas, setSelectedFixas] = useState<number[]>([]);
  const [selectedExcluidas, setSelectedExcluidas] = useState<number[]>([]);

  const toggleFixa = (dezena: number) => {
    setSelectedFixas(prev => 
      prev.includes(dezena) 
        ? prev.filter(d => d !== dezena)
        : [...prev, dezena]
    );
  };

  const toggleExcluida = (dezena: number) => {
    setSelectedExcluidas(prev => 
      prev.includes(dezena) 
        ? prev.filter(d => d !== dezena)
        : [...prev, dezena]
    );
  };

  const toggleFilterValue = (key: FiltroKey, value: number) => {
    setSelectedFilters(prev => {
      const currentValues = prev[key];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [key]: newValues };
    });
  };

  const selectAllFilters = () => {
    if (!tendencias) return;
    setSelectedFilters({
      impares: tendencias.filtros.impares.top3.map(t => t.valor),
      repetidas: tendencias.filtros.repetidas.top3.map(t => t.valor),
      moldura: tendencias.filtros.moldura.top3.map(t => t.valor),
      primos: tendencias.filtros.primos.top3.map(t => t.valor),
      m3: tendencias.filtros.m3.top3.map(t => t.valor),
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      impares: [],
      repetidas: [],
      moldura: [],
      primos: [],
      m3: [],
    });
  };

  // Conta total de valores selecionados (filtros + fixas + excluídas)
  const totalSelectedValues = 
    Object.values(selectedFilters).reduce((acc, arr) => acc + arr.length, 0) +
    selectedFixas.length +
    selectedExcluidas.length;

  // Construir URL do desdobramento com filtros selecionados
  const buildDesdobramentoUrl = () => {
    if (!tendencias || totalSelectedValues === 0) return "/desdobramento";
    
    const params = new URLSearchParams();
    
    (Object.keys(selectedFilters) as FiltroKey[]).forEach(key => {
      const values = selectedFilters[key];
      if (values.length > 0) {
        params.set(key, values.join(","));
      }
    });

    // Adicionar dezenas fixas e excluídas
    if (selectedFixas.length > 0) {
      params.set("fixas", selectedFixas.join(","));
    }
    if (selectedExcluidas.length > 0) {
      params.set("excluidas", selectedExcluidas.join(","));
    }
    
    return `/desdobramento?${params.toString()}`;
  };

  const handleUsarFiltros = () => {
    if (totalSelectedValues === 0) return;
    setShowConfirmDialog(true);
  };


  const buildGrupoUrl = (dezenas: number[]) => 
    `/smart-gerador?fixas=${dezenas.join(",")}`;

  return (
    <MainLayout pageTitle="Análise do Dia">
      <div className="container-senior py-3 space-y-3 max-w-lg mx-auto">
        {/* Header com período */}
        <div className="flex items-center justify-end">
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
                <div className="flex items-center gap-1 ml-auto">
                  <button 
                    onClick={selectAllFilters}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Todos
                  </button>
                  <span className="text-[10px] text-muted-foreground">|</span>
                  <button 
                    onClick={clearAllFilters}
                    className="text-[10px] text-muted-foreground hover:underline"
                  >
                    Limpar
                  </button>
                </div>
              </div>
              
              <div className="space-y-0">
                <FiltroRow 
                  label="Ímpares" 
                  filtroKey="impares"
                  top3={tendencias.filtros.impares.top3} 
                  ultimoValor={tendencias.filtros.impares.ultimoConcurso}
                  selectedValues={selectedFilters.impares}
                  onToggleValue={toggleFilterValue}
                />
                <FiltroRow 
                  label="Repetidas" 
                  filtroKey="repetidas"
                  top3={tendencias.filtros.repetidas.top3} 
                  ultimoValor={tendencias.filtros.repetidas.ultimoConcurso}
                  selectedValues={selectedFilters.repetidas}
                  onToggleValue={toggleFilterValue}
                />
                <FiltroRow 
                  label="Moldura" 
                  filtroKey="moldura"
                  top3={tendencias.filtros.moldura.top3} 
                  ultimoValor={tendencias.filtros.moldura.ultimoConcurso}
                  selectedValues={selectedFilters.moldura}
                  onToggleValue={toggleFilterValue}
                />
                <FiltroRow 
                  label="Primos" 
                  filtroKey="primos"
                  top3={tendencias.filtros.primos.top3} 
                  ultimoValor={tendencias.filtros.primos.ultimoConcurso}
                  selectedValues={selectedFilters.primos}
                  onToggleValue={toggleFilterValue}
                />
                <FiltroRow 
                  label="Múlt. 3" 
                  filtroKey="m3"
                  top3={tendencias.filtros.m3.top3} 
                  ultimoValor={tendencias.filtros.m3.ultimoConcurso}
                  selectedValues={selectedFilters.m3}
                  onToggleValue={toggleFilterValue}
                />
              </div>

              {/* CTA para usar filtros */}
              {totalSelectedValues > 0 && (
                <Button 
                  onClick={handleUsarFiltros}
                  className="w-full mt-3 gap-2 bg-highlight hover:bg-highlight/90 text-highlight-foreground font-semibold h-9"
                >
                  <Sparkles className="h-4 w-4" />
                  Usar {totalSelectedValues} valor{totalSelectedValues > 1 ? "es" : ""} no Desdobramento
                </Button>
              )}
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
                    tendencias.fixas.map((d) => {
                      const isSelected = selectedFixas.includes(d.dezena);
                      return (
                        <button
                          key={d.dezena}
                          onClick={() => toggleFixa(d.dezena)}
                          className={`inline-flex items-center justify-center gap-0.5 px-1.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-foreground text-background ring-2 ring-foreground/50"
                              : "bg-status-quente/20 text-status-quente hover:bg-status-quente/30"
                          }`}
                        >
                          {formatarDezena(d.dezena)}
                          <span className="text-[9px] opacity-70">{d.frequencia}%</span>
                        </button>
                      );
                    })
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
                    tendencias.excluidas.map((d) => {
                      const isSelected = selectedExcluidas.includes(d.dezena);
                      return (
                        <button
                          key={d.dezena}
                          onClick={() => toggleExcluida(d.dezena)}
                          className={`inline-flex items-center justify-center gap-0.5 px-1.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-foreground text-background ring-2 ring-foreground/50"
                              : "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
                          }`}
                        >
                          {formatarDezena(d.dezena)}
                          <span className="text-[9px] opacity-70">{d.frequencia}%</span>
                        </button>
                      );
                    })
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
          </div>
        ) : null}
      </div>

      {/* Dialog de confirmação */}
      <ConfirmNavigationDialog
        isOpen={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        desdobramentoUrl={buildDesdobramentoUrl()}
      />

      {/* FAB de filtros selecionados */}
      <FloatingNotes 
        selectedFilters={selectedFilters} 
        selectedFixas={selectedFixas}
        selectedExcluidas={selectedExcluidas}
      />
    </MainLayout>
  );
}
