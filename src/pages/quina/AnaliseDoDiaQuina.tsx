import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Target, TrendingUp, TrendingDown, Filter, Users,
  CheckCircle2, Sparkles, NotebookPen
} from "lucide-react";
import { useTendenciasDiaQuina } from "@/hooks/useTendenciasDiaQuina";
import { SeletorPeriodo } from "@/components/frequencia/SeletorPeriodo";
import { DezenaCirculoMini } from "@/components/lotofacil/DezenaCirculoMini";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatarDezena } from "@/lib/quina";
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
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isUltimoNoTop3 ? "text-foreground" : "text-muted-foreground"}`}>
          {isUltimoNoTop3 ? "✓" : ""} {ultimoValor}
        </span>
      </div>
    </div>
  );
}

type GrupoKey = "par" | "trio" | "quadra" | "quina";

interface GrupoRowProps {
  label: string;
  grupoKey: GrupoKey;
  grupo: { dezenas: number[]; ocorrencias: number; porcentagem: number } | null;
  isSelected: boolean;
  onToggle: (key: GrupoKey) => void;
}

function GrupoRow({ label, grupoKey, grupo, isSelected, onToggle }: GrupoRowProps) {
  if (!grupo) return null;
  return (
    <button
      onClick={() => onToggle(grupoKey)}
      className={`flex items-center gap-2 py-1.5 px-2 -mx-2 rounded border-b border-border/50 last:border-b-0 w-full transition-all ${
        isSelected ? "bg-foreground/10 ring-2 ring-foreground/30" : "hover:bg-muted/50"
      }`}
    >
      <span className={`text-xs font-medium uppercase w-14 shrink-0 text-left ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <div className="flex items-center gap-1 flex-1">
        {grupo.dezenas.map((d) => (
          <DezenaCirculoMini key={d} dezena={d} isSelected={isSelected} />
        ))}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{grupo.ocorrencias}x</span>
      {isSelected && <CheckCircle2 className="h-4 w-4 text-foreground shrink-0" />}
    </button>
  );
}

export default function AnaliseDoDiaQuina() {
  const [periodo, setPeriodo] = useState(10);
  const { data: tendencias, isLoading } = useTendenciasDiaQuina(periodo);

  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    impares: [], repetidas: [], moldura: [], primos: [], m3: [],
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFixas, setSelectedFixas] = useState<number[]>([]);
  const [selectedExcluidas, setSelectedExcluidas] = useState<number[]>([]);
  const [addedGroups, setAddedGroups] = useState({
    filtros: false, fixas: false, excluidas: false, grupos: false,
  });
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoKey | null>(null);

  const toggleGrupo = (key: GrupoKey) => setSelectedGrupo(prev => prev === key ? null : key);
  const toggleFixa = (dezena: number) => setSelectedFixas(prev => prev.includes(dezena) ? prev.filter(d => d !== dezena) : [...prev, dezena]);
  const toggleExcluida = (dezena: number) => setSelectedExcluidas(prev => prev.includes(dezena) ? prev.filter(d => d !== dezena) : [...prev, dezena]);
  const toggleFilterValue = (key: FiltroKey, value: number) => {
    setSelectedFilters(prev => {
      const curr = prev[key];
      return { ...prev, [key]: curr.includes(value) ? curr.filter(v => v !== value) : [...curr, value] };
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

  const clearAllFilters = () => setSelectedFilters({ impares: [], repetidas: [], moldura: [], primos: [], m3: [] });

  const totalFilterValues = Object.values(selectedFilters).reduce((acc, arr) => acc + arr.length, 0);

  const getSelectedGrupoDezenas = (): number[] => {
    if (!selectedGrupo || !tendencias) return [];
    return tendencias.grupos[selectedGrupo]?.dezenas ?? [];
  };
  const selectedGrupoDezenas = getSelectedGrupoDezenas();

  const totalAddedValues =
    (addedGroups.filtros ? totalFilterValues : 0) +
    (addedGroups.fixas ? selectedFixas.length : 0) +
    (addedGroups.excluidas ? selectedExcluidas.length : 0) +
    (addedGroups.grupos ? selectedGrupoDezenas.length : 0);

  const buildDesdobramentoUrl = () => {
    if (totalAddedValues === 0) return "/quina/desdobramento";
    const params = new URLSearchParams();
    if (addedGroups.filtros) {
      (Object.keys(selectedFilters) as FiltroKey[]).forEach(key => {
        const values = selectedFilters[key];
        if (values.length > 0) params.set(key, values.join(","));
      });
    }
    if (addedGroups.fixas && selectedFixas.length > 0) params.set("fixas", selectedFixas.join(","));
    if (addedGroups.excluidas && selectedExcluidas.length > 0) params.set("excluidas", selectedExcluidas.join(","));
    if (addedGroups.grupos && selectedGrupoDezenas.length > 0) {
      const currentFixas = params.get("fixas");
      const grupoDezenas = selectedGrupoDezenas.join(",");
      params.set("fixas", currentFixas ? `${currentFixas},${grupoDezenas}` : grupoDezenas);
    }
    return `/quina/desdobramento?${params.toString()}`;
  };

  const handleUsarFiltros = () => {
    if (totalAddedValues === 0) return;
    setShowConfirmDialog(true);
  };

  return (
    <MainLayout pageTitle="Análise do Dia · Quina">
      <div className="container-senior py-3 space-y-3 max-w-lg mx-auto">
        {/* Instruções */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-relaxed text-foreground">
                <span className="font-semibold">Análise do Dia</span> — Reunimos os principais dados estatísticos da Quina. Clique nos dados para levar diretamente ao desdobramento e facilitar sua fézinha.
              </p>
            </div>
          </div>
        </div>

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
                  <span className="text-sm font-semibold">#{tendencias.ultimoConcurso.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {(() => {
                      const [year, month, day] = tendencias.ultimoConcurso.data.split("-").map(Number);
                      return format(new Date(year, month - 1, day), "dd/MM", { locale: ptBR });
                    })()}
                  </span>
                </div>
              </div>
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
                  <button onClick={selectAllFilters} className="text-[10px] text-primary hover:underline">Todos</button>
                  <span className="text-[10px] text-muted-foreground">|</span>
                  <button onClick={clearAllFilters} className="text-[10px] text-muted-foreground hover:underline">Limpar</button>
                </div>
              </div>
              <div className="space-y-0">
                <FiltroRow label="Ímpares" filtroKey="impares" top3={tendencias.filtros.impares.top3} ultimoValor={tendencias.filtros.impares.ultimoConcurso} selectedValues={selectedFilters.impares} onToggleValue={toggleFilterValue} />
                <FiltroRow label="Repetidas" filtroKey="repetidas" top3={tendencias.filtros.repetidas.top3} ultimoValor={tendencias.filtros.repetidas.ultimoConcurso} selectedValues={selectedFilters.repetidas} onToggleValue={toggleFilterValue} />
                <FiltroRow label="Moldura" filtroKey="moldura" top3={tendencias.filtros.moldura.top3} ultimoValor={tendencias.filtros.moldura.ultimoConcurso} selectedValues={selectedFilters.moldura} onToggleValue={toggleFilterValue} />
                <FiltroRow label="Primos" filtroKey="primos" top3={tendencias.filtros.primos.top3} ultimoValor={tendencias.filtros.primos.ultimoConcurso} selectedValues={selectedFilters.primos} onToggleValue={toggleFilterValue} />
                <FiltroRow label="Múlt. 3" filtroKey="m3" top3={tendencias.filtros.m3.top3} ultimoValor={tendencias.filtros.m3.ultimoConcurso} selectedValues={selectedFilters.m3} onToggleValue={toggleFilterValue} />
              </div>
              {totalFilterValues > 0 && !addedGroups.filtros && (
                <Button onClick={() => setAddedGroups(prev => ({ ...prev, filtros: true }))} className="w-full mt-3 gap-2 bg-highlight hover:bg-highlight/90 text-highlight-foreground font-semibold h-9">
                  <Sparkles className="h-4 w-4" />
                  Adicionar {totalFilterValues} filtro{totalFilterValues > 1 ? "s" : ""}
                </Button>
              )}
              {addedGroups.filtros && totalFilterValues > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-3 py-1.5 px-2 rounded bg-amber-500/10 border border-amber-500/30">
                  <NotebookPen className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-[11px] text-amber-700 font-medium">{totalFilterValues} filtro{totalFilterValues > 1 ? "s" : ""} no bloco de notas</span>
                </div>
              )}
            </div>

            {/* DEZENAS FIXAR / EXCLUIR */}
            <div className="rounded-lg border bg-card p-3 space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-4 w-4 text-status-quente" />
                  <span className="text-xs font-semibold">Dezenas para Fixar</span>
                  <span className="text-[10px] text-muted-foreground">≥10%</span>
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
                    <span className="col-span-4 text-[11px] text-muted-foreground">Nenhuma dezena com ≥10% de frequência</span>
                  )}
                </div>
                {selectedFixas.length > 0 && !addedGroups.fixas && (
                  <Button onClick={() => setAddedGroups(prev => ({ ...prev, fixas: true }))} size="sm" className="w-full mt-2 gap-2 bg-highlight hover:bg-highlight/90 text-highlight-foreground font-semibold h-8 text-xs">
                    <Sparkles className="h-3 w-3" />
                    Adicionar {selectedFixas.length} fixa{selectedFixas.length > 1 ? "s" : ""}
                  </Button>
                )}
                {addedGroups.fixas && selectedFixas.length > 0 && (
                  <div className="flex items-center justify-center gap-1.5 mt-2 py-1.5 px-2 rounded bg-amber-500/10 border border-amber-500/30">
                    <NotebookPen className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-[11px] text-amber-700 font-medium">No bloco de notas</span>
                  </div>
                )}
              </div>
              <div className="border-t border-border/50" />
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
                {selectedExcluidas.length > 0 && !addedGroups.excluidas && (
                  <Button onClick={() => setAddedGroups(prev => ({ ...prev, excluidas: true }))} size="sm" className="w-full mt-2 gap-2 bg-highlight hover:bg-highlight/90 text-highlight-foreground font-semibold h-8 text-xs">
                    <Sparkles className="h-3 w-3" />
                    Adicionar {selectedExcluidas.length} excluída{selectedExcluidas.length > 1 ? "s" : ""}
                  </Button>
                )}
                {addedGroups.excluidas && selectedExcluidas.length > 0 && (
                  <div className="flex items-center justify-center gap-1.5 mt-2 py-1.5 px-2 rounded bg-amber-500/10 border border-amber-500/30">
                    <NotebookPen className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-[11px] text-amber-700 font-medium">No bloco de notas</span>
                  </div>
                )}
              </div>
            </div>

            {/* GRUPOS PERFEITOS */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Grupos Perfeitos</span>
              </div>
              <div className="space-y-0">
                <GrupoRow label="Par" grupoKey="par" grupo={tendencias.grupos.par} isSelected={selectedGrupo === "par"} onToggle={toggleGrupo} />
                <GrupoRow label="Trio" grupoKey="trio" grupo={tendencias.grupos.trio} isSelected={selectedGrupo === "trio"} onToggle={toggleGrupo} />
                <GrupoRow label="Quadra" grupoKey="quadra" grupo={tendencias.grupos.quadra} isSelected={selectedGrupo === "quadra"} onToggle={toggleGrupo} />
                <GrupoRow label="Quina" grupoKey="quina" grupo={tendencias.grupos.quina} isSelected={selectedGrupo === "quina"} onToggle={toggleGrupo} />
              </div>
              {selectedGrupo && !addedGroups.grupos && (
                <Button onClick={() => setAddedGroups(prev => ({ ...prev, grupos: true }))} size="sm" className="w-full mt-3 gap-2 bg-highlight hover:bg-highlight/90 text-highlight-foreground font-semibold h-8 text-xs">
                  <Sparkles className="h-3 w-3" />
                  Adicionar {selectedGrupo.charAt(0).toUpperCase() + selectedGrupo.slice(1)} ({selectedGrupoDezenas.length} dezenas)
                </Button>
              )}
              {addedGroups.grupos && selectedGrupo && (
                <div className="flex items-center justify-center gap-1.5 mt-3 py-1.5 px-2 rounded bg-amber-500/10 border border-amber-500/30">
                  <NotebookPen className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-[11px] text-amber-700 font-medium">{selectedGrupo.charAt(0).toUpperCase() + selectedGrupo.slice(1)} no bloco de notas</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {totalAddedValues > 0 && (
        <ConfirmNavigationDialog
          isOpen={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          desdobramentoUrl={buildDesdobramentoUrl()}
        />
      )}

      <FloatingNotes 
        selectedFilters={addedGroups.filtros ? selectedFilters : { impares: [], repetidas: [], moldura: [], primos: [], m3: [] }} 
        selectedFixas={addedGroups.fixas ? selectedFixas : []}
        selectedExcluidas={addedGroups.excluidas ? selectedExcluidas : []}
        selectedGrupoDezenas={addedGroups.grupos ? selectedGrupoDezenas : []}
        selectedGrupoLabel={addedGroups.grupos && selectedGrupo ? selectedGrupo.charAt(0).toUpperCase() + selectedGrupo.slice(1) : undefined}
        onNavigate={handleUsarFiltros}
        onRemoveFiltros={() => setAddedGroups(prev => ({ ...prev, filtros: false }))}
        onRemoveFixas={() => setAddedGroups(prev => ({ ...prev, fixas: false }))}
        onRemoveExcluidas={() => setAddedGroups(prev => ({ ...prev, excluidas: false }))}
        onRemoveGrupo={() => { setAddedGroups(prev => ({ ...prev, grupos: false })); setSelectedGrupo(null); }}
        onRemoveSingleFilter={(key, value) => setSelectedFilters(prev => ({ ...prev, [key]: prev[key].filter(v => v !== value) }))}
        onRemoveSingleFixa={(dezena) => setSelectedFixas(prev => prev.filter(d => d !== dezena))}
        onRemoveSingleExcluida={(dezena) => setSelectedExcluidas(prev => prev.filter(d => d !== dezena))}
      />
    </MainLayout>
  );
}
