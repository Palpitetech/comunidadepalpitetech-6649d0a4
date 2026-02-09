import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  Users,
  CheckCircle2,
  Sparkles,
  NotebookPen
} from "lucide-react";
import { useTendenciasDuplaSena } from "@/hooks/useTendenciasDuplaSena";
import { SeletorPeriodo } from "@/components/frequencia/SeletorPeriodo";
import { DezenaCirculoMiniDuplaSena } from "@/components/duplasena/DezenaCirculoMiniDuplaSena";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatarDezena } from "@/lib/duplasena";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FloatingNotes } from "@/components/analise/FloatingNotes";
import { ConfirmNavigationDialog } from "@/components/analise/ConfirmNavigationDialog";

type FiltroKey = "impares" | "repetidas" | "moldura" | "primos";

interface SelectedFilters {
  impares: number[];
  repetidas: number[];
  moldura: number[];
  primos: number[];
  m3: number[];  // Mantendo para compatibilidade com FloatingNotes
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
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-b-0">
      {/* Label à esquerda */}
      <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">{label}</span>
      
      {/* Top 3 valores - alinhados à esquerda */}
      <div className="flex items-center gap-1.5">
        {top3.map((t) => {
          const isSelected = selectedValues.includes(t.valor);
          return (
            <button
              key={t.valor}
              onClick={() => onToggleValue(filtroKey, t.valor)}
              className={`
                min-w-[32px] px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer text-center
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
      
      {/* Espaçador flexível */}
      <div className="flex-1" />
      
      {/* Último valor à direita */}
      <div className="flex items-center gap-1 shrink-0">
        {isUltimoNoTop3 && (
          <CheckCircle2 className="h-3 w-3 text-duplasena-primary" />
        )}
        <span className="text-xs font-bold text-muted-foreground">
          {ultimoValor}
        </span>
      </div>
    </div>
  );
}

type GrupoKey = "dupla" | "trio" | "quadra" | "quina" | "sena";

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
        isSelected 
          ? "bg-foreground/10 ring-2 ring-foreground/30" 
          : "hover:bg-muted/50"
      }`}
    >
      <span className={`text-xs font-medium uppercase w-14 shrink-0 text-left ${
        isSelected ? "text-foreground" : "text-muted-foreground"
      }`}>{label}</span>
      <div className="flex items-center gap-1 flex-1">
        {grupo.dezenas.map((d) => (
          <DezenaCirculoMiniDuplaSena key={d} dezena={d} isSelected={isSelected} />
        ))}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {grupo.ocorrencias}x
      </span>
      {isSelected && (
        <CheckCircle2 className="h-4 w-4 text-foreground shrink-0" />
      )}
    </button>
  );
}

export default function AnaliseDoDiaDuplaSena() {
  const [periodo, setPeriodo] = useState(10);
  const [sorteioAtivo, setSorteioAtivo] = useState<"1" | "2">("1");
  const { data: tendencias, isLoading } = useTendenciasDuplaSena(periodo);
  
  // Estados para filtros selecionados
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

  // Estados para controlar quais grupos já foram adicionados
  const [addedGroups, setAddedGroups] = useState<{
    filtros: boolean;
    fixas: boolean;
    excluidas: boolean;
    grupos: boolean;
  }>({
    filtros: false,
    fixas: false,
    excluidas: false,
    grupos: false,
  });

  // Estado para grupo selecionado
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoKey | null>(null);

  const toggleGrupo = (key: GrupoKey) => {
    setSelectedGrupo(prev => prev === key ? null : key);
  };

  const handleAddGrupos = () => {
    setAddedGroups(prev => ({ ...prev, grupos: true }));
  };

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
    const filtros = sorteioAtivo === "1" ? tendencias.filtros_s1 : tendencias.filtros_s2;
    setSelectedFilters({
      impares: filtros.impares.top3.map(t => t.valor),
      repetidas: filtros.repetidas.top3.map(t => t.valor),
      moldura: filtros.moldura.top3.map(t => t.valor),
      primos: filtros.primos.top3.map(t => t.valor),
      m3: [],
    });
  };

  const clearFilters = () => {
    setSelectedFilters({
      impares: [],
      repetidas: [],
      moldura: [],
      primos: [],
      m3: [],
    });
  };

  // Contar quantos valores estão selecionados
  const totalFilterValues = Object.values(selectedFilters).reduce(
    (acc, arr) => acc + arr.length, 0
  );

  // Obter dados baseados no sorteio ativo
  const getCurrentData = () => {
    if (!tendencias) return null;
    return {
      filtros: sorteioAtivo === "1" ? tendencias.filtros_s1 : tendencias.filtros_s2,
      fixas: sorteioAtivo === "1" ? tendencias.fixas_s1 : tendencias.fixas_s2,
      excluidas: sorteioAtivo === "1" ? tendencias.excluidas_s1 : tendencias.excluidas_s2,
      grupos: sorteioAtivo === "1" ? tendencias.grupos_s1 : tendencias.grupos_s2,
      dezenas: sorteioAtivo === "1" ? tendencias.ultimoConcurso.dezenas_s1 : tendencias.ultimoConcurso.dezenas_s2,
      impares: sorteioAtivo === "1" ? tendencias.ultimoConcurso.impares_s1 : tendencias.ultimoConcurso.impares_s2,
      repetidas: sorteioAtivo === "1" ? tendencias.ultimoConcurso.repetidas_s1 : tendencias.ultimoConcurso.repetidas_s2,
      moldura: sorteioAtivo === "1" ? tendencias.ultimoConcurso.moldura_s1 : tendencias.ultimoConcurso.moldura_s2,
      primos: sorteioAtivo === "1" ? tendencias.ultimoConcurso.primos_s1 : tendencias.ultimoConcurso.primos_s2,
    };
  };

  const currentData = getCurrentData();

  // Obter dezenas do grupo selecionado
  const selectedGrupoDezenas = selectedGrupo && currentData?.grupos[selectedGrupo]
    ? currentData.grupos[selectedGrupo]!.dezenas
    : [];

  // Construir URL para navegação ao desdobramento
  const buildDesdobramentoUrl = () => {
    const params = new URLSearchParams();
    
    // Adicionar filtros de padrões apenas se o grupo foi adicionado
    if (addedGroups.filtros) {
      if (selectedFilters.impares.length > 0) {
        params.set("impares", selectedFilters.impares.join(","));
      }
      if (selectedFilters.repetidas.length > 0) {
        params.set("repetidas", selectedFilters.repetidas.join(","));
      }
      if (selectedFilters.moldura.length > 0) {
        params.set("moldura", selectedFilters.moldura.join(","));
      }
      if (selectedFilters.primos.length > 0) {
        params.set("primos", selectedFilters.primos.join(","));
      }
    }
    
    // Adicionar dezenas fixas apenas se o grupo foi adicionado
    if (addedGroups.fixas && selectedFixas.length > 0) {
      params.set("fixas", selectedFixas.join(","));
    }
    
    // Adicionar dezenas excluídas apenas se o grupo foi adicionado
    if (addedGroups.excluidas && selectedExcluidas.length > 0) {
      params.set("excluidas", selectedExcluidas.join(","));
    }

    // Adicionar dezenas do grupo perfeito como fixas
    if (addedGroups.grupos && selectedGrupoDezenas.length > 0) {
      const currentFixas = params.get("fixas");
      const grupoDezenas = selectedGrupoDezenas.join(",");
      if (currentFixas) {
        params.set("fixas", `${currentFixas},${grupoDezenas}`);
      } else {
        params.set("fixas", grupoDezenas);
      }
    }
    
    // Por enquanto, redireciona para resultados
    return `/duplasena/resultados?${params.toString()}`;
  };

  const handleUsarFiltros = () => {
    setShowConfirmDialog(true);
  };

  // Preparar dados para FloatingNotes
  const floatingNotesFilters = addedGroups.filtros ? selectedFilters : { impares: [], repetidas: [], moldura: [], primos: [], m3: [] };
  const floatingNotesFixas = addedGroups.fixas ? selectedFixas : [];
  const floatingNotesExcluidas = addedGroups.excluidas ? selectedExcluidas : [];
  const floatingNotesGrupo = addedGroups.grupos ? selectedGrupoDezenas : [];

  return (
    <MainLayout pageTitle="Análise do Dia">
      <div className="container-senior py-3 space-y-3 max-w-lg mx-auto">
        {/* Instruções */}
        <div className="rounded-lg border border-duplasena-primary/20 bg-duplasena-primary/5 p-3">
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-duplasena-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-relaxed text-foreground">
                <span className="font-semibold">Análise do Dia</span> — Reunimos os principais dados estatísticos da Dupla Sena. Alterne entre Sorteio 1 e 2 para ver análises independentes.
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Sorteio */}
        <div className="flex rounded-lg p-1 bg-muted/50">
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
        ) : tendencias && currentData ? (
          <div className="space-y-3">
            {/* ÚLTIMO RESULTADO */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-duplasena-primary" />
                  <span className="text-sm font-semibold">
                    #{tendencias.ultimoConcurso.id}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(() => {
                      const [year, month, day] = tendencias.ultimoConcurso.data.split("-").map(Number);
                      return format(new Date(year, month - 1, day), "dd/MM", { locale: ptBR });
                    })()}
                  </span>
                  <span className="text-[10px] bg-duplasena-primary/10 text-duplasena-primary px-2 py-0.5 rounded-full font-medium">
                    Sorteio {sorteioAtivo}
                  </span>
                </div>
              </div>
              
              {/* Dezenas em linha */}
              <div className="flex flex-wrap gap-1 mb-2">
                {currentData.dezenas.map((d) => (
                  <div
                    key={d}
                    className="w-[30px] h-[30px] rounded-full flex items-center justify-center bg-duplasena-primary text-white text-sm font-semibold"
                  >
                    {d.toString().padStart(2, "0")}
                  </div>
                ))}
              </div>
              
              {/* Estatísticas em linha única */}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>Ímp: <strong className="text-foreground">{currentData.impares}</strong></span>
                <span>Rep: <strong className="text-foreground">{currentData.repetidas}</strong></span>
                <span>Mol: <strong className="text-foreground">{currentData.moldura}</strong></span>
                <span>Pri: <strong className="text-foreground">{currentData.primos}</strong></span>
              </div>
            </div>

            {/* ESTRATÉGIA DE FILTROS */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-duplasena-primary" />
                  <span className="text-sm font-semibold">Estratégia de Filtros</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={selectAllFilters}
                    className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                  >
                    Todos
                  </button>
                  <button
                    onClick={clearFilters}
                    className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                  >
                    Limpar
                  </button>
                </div>
              </div>
              
              <p className="text-[10px] text-muted-foreground mb-2">
                Top 3 ocorrências nos últimos {periodo} concursos (Sorteio {sorteioAtivo})
              </p>
              
              <div className="divide-y divide-border/50">
                <FiltroRow
                  label="Ímpares"
                  filtroKey="impares"
                  top3={currentData.filtros.impares.top3}
                  ultimoValor={currentData.filtros.impares.ultimoConcurso}
                  selectedValues={selectedFilters.impares}
                  onToggleValue={toggleFilterValue}
                />
                <FiltroRow
                  label="Repetidas"
                  filtroKey="repetidas"
                  top3={currentData.filtros.repetidas.top3}
                  ultimoValor={currentData.filtros.repetidas.ultimoConcurso}
                  selectedValues={selectedFilters.repetidas}
                  onToggleValue={toggleFilterValue}
                />
                <FiltroRow
                  label="Moldura"
                  filtroKey="moldura"
                  top3={currentData.filtros.moldura.top3}
                  ultimoValor={currentData.filtros.moldura.ultimoConcurso}
                  selectedValues={selectedFilters.moldura}
                  onToggleValue={toggleFilterValue}
                />
                <FiltroRow
                  label="Primos"
                  filtroKey="primos"
                  top3={currentData.filtros.primos.top3}
                  ultimoValor={currentData.filtros.primos.ultimoConcurso}
                  selectedValues={selectedFilters.primos}
                  onToggleValue={toggleFilterValue}
                />
              </div>

              {/* Botão de adicionar filtros */}
              {totalFilterValues > 0 && !addedGroups.filtros && (
                <Button 
                  onClick={() => setAddedGroups(prev => ({ ...prev, filtros: true }))}
                  size="sm"
                  className="w-full mt-3 gap-2 bg-highlight hover:bg-highlight/90 text-highlight-foreground font-semibold h-8 text-xs"
                >
                  <Sparkles className="h-3 w-3" />
                  Adicionar {totalFilterValues} filtros
                </Button>
              )}
              
              {addedGroups.filtros && totalFilterValues > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-3 py-1.5 px-2 rounded bg-amber-500/10 border border-amber-500/30">
                  <NotebookPen className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-[11px] text-amber-700 font-medium">Filtros no bloco de notas</span>
                </div>
              )}
            </div>

            {/* DEZENAS SUGERIDAS */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-duplasena-primary" />
                <span className="text-sm font-semibold">Dezenas Sugeridas</span>
              </div>
              
              {/* Fixas */}
              {currentData.fixas.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Fixar</span>
                    <span className="text-[10px] text-muted-foreground">(≥ 15%)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentData.fixas.map(({ dezena, frequencia }) => {
                      const isSelected = selectedFixas.includes(dezena);
                      return (
                        <button
                          key={dezena}
                          onClick={() => toggleFixa(dezena)}
                          className={`
                            relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                            ${isSelected 
                              ? "bg-foreground text-background ring-2 ring-highlight" 
                              : "bg-duplasena-primary/10 text-duplasena-primary hover:bg-duplasena-primary/20"
                            }
                          `}
                        >
                          {formatarDezena(dezena)}
                          <span className="absolute -bottom-0.5 -right-0.5 text-[8px] bg-duplasena-primary text-white px-1 rounded-full">
                            {frequencia}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Botão de adicionar fixas */}
                  {selectedFixas.length > 0 && !addedGroups.fixas && (
                    <Button 
                      onClick={() => setAddedGroups(prev => ({ ...prev, fixas: true }))}
                      size="sm"
                      className="w-full mt-2 gap-2 bg-highlight hover:bg-highlight/90 text-highlight-foreground font-semibold h-8 text-xs"
                    >
                      <Sparkles className="h-3 w-3" />
                      Adicionar {selectedFixas.length} fixas
                    </Button>
                  )}
                  
                  {addedGroups.fixas && selectedFixas.length > 0 && (
                    <div className="flex items-center justify-center gap-1.5 mt-2 py-1.5 px-2 rounded bg-amber-500/10 border border-amber-500/30">
                      <NotebookPen className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-[11px] text-amber-700 font-medium">Fixas no bloco de notas</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Excluídas */}
              {currentData.excluidas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs font-medium text-muted-foreground">Excluir</span>
                    <span className="text-[10px] text-muted-foreground">(≤ 5%)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentData.excluidas.map(({ dezena, frequencia }) => {
                      const isSelected = selectedExcluidas.includes(dezena);
                      return (
                        <button
                          key={dezena}
                          onClick={() => toggleExcluida(dezena)}
                          className={`
                            relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                            ${isSelected 
                              ? "bg-destructive text-destructive-foreground ring-2 ring-destructive/50" 
                              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                            }
                          `}
                        >
                          {formatarDezena(dezena)}
                          <span className="absolute -bottom-0.5 -right-0.5 text-[8px] bg-destructive text-destructive-foreground px-1 rounded-full">
                            {frequencia}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Botão de adicionar excluídas */}
                  {selectedExcluidas.length > 0 && !addedGroups.excluidas && (
                    <Button 
                      onClick={() => setAddedGroups(prev => ({ ...prev, excluidas: true }))}
                      size="sm"
                      className="w-full mt-2 gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold h-8 text-xs"
                    >
                      <Sparkles className="h-3 w-3" />
                      Adicionar {selectedExcluidas.length} excluídas
                    </Button>
                  )}
                  
                  {addedGroups.excluidas && selectedExcluidas.length > 0 && (
                    <div className="flex items-center justify-center gap-1.5 mt-2 py-1.5 px-2 rounded bg-amber-500/10 border border-amber-500/30">
                      <NotebookPen className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-[11px] text-amber-700 font-medium">Excluídas no bloco de notas</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* GRUPOS PERFEITOS */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-duplasena-primary" />
                <span className="text-sm font-semibold">Grupos Perfeitos</span>
              </div>
              
              <p className="text-[10px] text-muted-foreground mb-2">
                Combinações mais frequentes nos últimos {periodo} concursos
              </p>
              
              <div className="space-y-1">
                <GrupoRow
                  label="Dupla"
                  grupoKey="dupla"
                  grupo={currentData.grupos.dupla}
                  isSelected={selectedGrupo === "dupla"}
                  onToggle={toggleGrupo}
                />
                <GrupoRow
                  label="Trio"
                  grupoKey="trio"
                  grupo={currentData.grupos.trio}
                  isSelected={selectedGrupo === "trio"}
                  onToggle={toggleGrupo}
                />
                <GrupoRow
                  label="Quadra"
                  grupoKey="quadra"
                  grupo={currentData.grupos.quadra}
                  isSelected={selectedGrupo === "quadra"}
                  onToggle={toggleGrupo}
                />
                <GrupoRow
                  label="Quina"
                  grupoKey="quina"
                  grupo={currentData.grupos.quina}
                  isSelected={selectedGrupo === "quina"}
                  onToggle={toggleGrupo}
                />
                <GrupoRow
                  label="Sena"
                  grupoKey="sena"
                  grupo={currentData.grupos.sena}
                  isSelected={selectedGrupo === "sena"}
                  onToggle={toggleGrupo}
                />
              </div>

              {/* Botão de adicionar grupos */}
              {selectedGrupo && !addedGroups.grupos && (
                <Button 
                  onClick={handleAddGrupos}
                  size="sm"
                  className="w-full mt-3 gap-2 bg-highlight hover:bg-highlight/90 text-highlight-foreground font-semibold h-8 text-xs"
                >
                  <Sparkles className="h-3 w-3" />
                  Adicionar {selectedGrupo}
                </Button>
              )}
              
              {addedGroups.grupos && selectedGrupo && (
                <div className="flex items-center justify-center gap-1.5 mt-3 py-1.5 px-2 rounded bg-amber-500/10 border border-amber-500/30">
                  <NotebookPen className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-[11px] text-amber-700 font-medium">Grupo no bloco de notas</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}

        {/* FAB de Notas */}
        <FloatingNotes
          selectedFilters={floatingNotesFilters}
          selectedFixas={floatingNotesFixas}
          selectedExcluidas={floatingNotesExcluidas}
          selectedGrupoDezenas={floatingNotesGrupo}
          selectedGrupoLabel={addedGroups.grupos && selectedGrupo ? selectedGrupo : undefined}
          onNavigate={handleUsarFiltros}
          onRemoveFiltros={() => setAddedGroups(prev => ({ ...prev, filtros: false }))}
          onRemoveFixas={() => setAddedGroups(prev => ({ ...prev, fixas: false }))}
          onRemoveExcluidas={() => setAddedGroups(prev => ({ ...prev, excluidas: false }))}
          onRemoveGrupo={() => {
            setAddedGroups(prev => ({ ...prev, grupos: false }));
            setSelectedGrupo(null);
          }}
          onRemoveSingleFilter={(key, value) => {
            setSelectedFilters(prev => ({
              ...prev,
              [key]: prev[key].filter(v => v !== value),
            }));
          }}
          onRemoveSingleFixa={(dezena) => {
            setSelectedFixas(prev => prev.filter(d => d !== dezena));
          }}
          onRemoveSingleExcluida={(dezena) => {
            setSelectedExcluidas(prev => prev.filter(d => d !== dezena));
          }}
        />

        {/* Dialog de confirmação */}
        <ConfirmNavigationDialog
          isOpen={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          desdobramentoUrl={buildDesdobramentoUrl()}
        />
      </div>
    </MainLayout>
  );
}
