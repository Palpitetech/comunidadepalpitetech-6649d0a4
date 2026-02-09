import { useState, useMemo, useEffect } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Copy, 
  CopyCheck, 
  Trash2, 
  CheckSquare,
  Square,
  MoreHorizontal,
  Trophy,
  ChevronDown,
  Check,
  Dices,
  X,
  Bookmark,
  Save
} from "lucide-react";
import { formatarDezena } from "@/lib/lotofacil";
import type { EstrategiaData } from "@/components/gerador/EstrategiaCard";

interface ConcursoOption {
  concurso_id: number;
  data_sorteio: string;
  dezenas: number[];
}

interface PalpiteBase {
  id: string;
  dezenas: number[];
  estrategia?: string | null;
  estrategia_data?: EstrategiaData | null;
  qtd_dezenas?: number;
  periodo_analise?: number | null;
}

export interface PalpitesToolbarProps<T extends PalpiteBase> {
  palpites: T[];
  selected: Set<string>;
  onSelectAll: () => void;
  onCopiarTodos: () => void;
  onCopiarSelecionados: () => void;
  onExcluirSelecionados?: () => void;
  onExcluirTodos?: () => void;
  onVerificarTodos?: (concurso: ConcursoOption, acertosPorPalpite: Record<string, number>) => void;
  onEstrategiaClick?: (estrategia: string) => void;
  /** Salvar todos os palpites */
  onSalvarTodos?: () => void;
  /** Salvar palpites selecionados */
  onSalvarSelecionados?: () => void;
  /** Esconder botão de excluir */
  hideExcluir?: boolean;
  /** Esconder verificação de prêmios */
  hidePremios?: boolean;
  /** Esconder estratégias */
  hideEstrategias?: boolean;
  /** Tipo de loteria (para verificar prêmios) */
  loteria?: "lotofacil" | "megasena";
}

export function PalpitesToolbar<T extends PalpiteBase>({
  palpites,
  selected,
  onSelectAll,
  onCopiarTodos,
  onCopiarSelecionados,
  onExcluirSelecionados,
  onExcluirTodos,
  onVerificarTodos,
  onEstrategiaClick,
  onSalvarTodos,
  onSalvarSelecionados,
  hideExcluir = false,
  hidePremios = false,
  hideEstrategias = false,
  loteria = "lotofacil",
}: PalpitesToolbarProps<T>) {
  const { toast } = useToast();
  
  // Estado para verificação de prêmios
  const [concursos, setConcursos] = useState<ConcursoOption[]>([]);
  const [loadingConcursos, setLoadingConcursos] = useState(false);
  const [concursosLoaded, setConcursosLoaded] = useState(false);
  const [concursoSelecionado, setConcursoSelecionado] = useState<ConcursoOption | null>(null);
  const [resumoVisivel, setResumoVisivel] = useState(true);
  const [acertosPorPalpite, setAcertosPorPalpite] = useState<Record<string, number>>({});

  const allSelected = selected.size === palpites.length && palpites.length > 0;

  // Calcular resumo de estratégias com dados completos
  const resumoEstrategias = useMemo(() => {
    if (hideEstrategias) return null;
    const estrategiasMap: Record<string, { 
      count: number; 
      data: EstrategiaData | null;
      periodo?: number | null;
      createdAt?: string;
    }> = {};
    
    palpites.forEach(palpite => {
      if (palpite.estrategia) {
        if (!estrategiasMap[palpite.estrategia]) {
          estrategiasMap[palpite.estrategia] = {
            count: 0,
            data: palpite.estrategia_data || null,
            periodo: palpite.periodo_analise,
            createdAt: (palpite as any).created_at,
          };
        }
        estrategiasMap[palpite.estrategia].count++;
        // Usar dados mais completos se disponíveis
        if (palpite.estrategia_data && !estrategiasMap[palpite.estrategia].data) {
          estrategiasMap[palpite.estrategia].data = palpite.estrategia_data;
        }
      }
    });
    
    const estrategias = Object.entries(estrategiasMap)
      .map(([nome, info]) => ({ nome, ...info }))
      .sort((a, b) => {
        // Ordenar por data de criação mais recente
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return b.count - a.count;
      });
    
    return estrategias.length > 0 ? estrategias : null;
  }, [palpites, hideEstrategias]);

  // Calcular resumo de premiações baseado na loteria
  const resumoPremiacoes = useMemo(() => {
    if (Object.keys(acertosPorPalpite).length === 0) return null;
    
    if (loteria === "megasena") {
      // Mega Sena: 4, 5, 6 acertos
      const contagem = { 4: 0, 5: 0, 6: 0 };
      Object.values(acertosPorPalpite).forEach(acertos => {
        if (acertos >= 4 && acertos <= 6) {
          contagem[acertos as keyof typeof contagem]++;
        }
      });
      const total = contagem[4] + contagem[5] + contagem[6];
      return { contagem, total, tipo: "megasena" as const };
    }
    
    // Lotofácil: 11 a 15 acertos
    const contagem = { 11: 0, 12: 0, 13: 0, 14: 0, 15: 0 };
    Object.values(acertosPorPalpite).forEach(acertos => {
      if (acertos >= 11 && acertos <= 15) {
        contagem[acertos as keyof typeof contagem]++;
      }
    });
    
    const total = contagem[11] + contagem[12] + contagem[13] + contagem[14] + contagem[15];
    return { contagem, total, tipo: "lotofacil" as const };
  }, [acertosPorPalpite, loteria]);

  // Carregar concursos quando abrir o dropdown (baseado na loteria)
  const handleLoadConcursos = async () => {
    if (concursosLoaded) return;
    
    setLoadingConcursos(true);
    try {
      const tabela = loteria === "megasena" ? "resultados_megasena" : "resultados";
      const { data } = await supabase
        .from(tabela)
        .select("concurso_id, data_sorteio, dezenas")
        .order("concurso_id", { ascending: false })
        .limit(30);
      
      if (data) {
        setConcursos(data);
        setConcursosLoaded(true);
      }
    } catch (error) {
      console.error("Erro ao carregar concursos:", error);
    } finally {
      setLoadingConcursos(false);
    }
  };

  // Verificar todos os palpites contra um concurso
  const handleVerificarTodos = (concurso: ConcursoOption) => {
    const novosAcertos: Record<string, number> = {};
    const maxAcertos = loteria === "megasena" ? 6 : 15;
    let temMaxAcertos = false;
    
    palpites.forEach(palpite => {
      const acertos = palpite.dezenas.filter(d => concurso.dezenas.includes(d)).length;
      novosAcertos[palpite.id] = acertos;
      if (acertos === maxAcertos) temMaxAcertos = true;
    });
    
    setAcertosPorPalpite(novosAcertos);
    setConcursoSelecionado(concurso);
    setResumoVisivel(true);
    
    // 🎉 Confetes se tiver acerto máximo!
    if (temMaxAcertos) {
      const duration = 4000;
      const end = Date.now() + duration;
      const colors = loteria === "megasena" 
        ? ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b']
        : ['#8b5cf6', '#7c3aed', '#6d28d9', '#fbbf24', '#f59e0b'];
      
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
    
    const premioNome = loteria === "megasena" ? "SENA" : "15 ACERTOS";
    toast({
      title: temMaxAcertos ? `🎉 PARABÉNS! ${premioNome}!` : "Verificação concluída! 🎯",
      description: temMaxAcertos 
        ? "Você acertou todas as dezenas! Mega prêmio!" 
        : `${palpites.length} palpite(s) verificado(s) contra o concurso #${concurso.concurso_id}`,
    });

    onVerificarTodos?.(concurso, novosAcertos);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      {/* Barra de seleção e ações */}
      <div className="flex items-center gap-2 py-2">
        {/* Seletor */}
        <Button
          variant={allSelected ? "default" : "outline"}
          size="icon"
          onClick={onSelectAll}
          className="h-8 w-8 shrink-0"
        >
          {allSelected ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </Button>
        
        {/* Verificar Prêmios */}
        {!hidePremios && (
          <DropdownMenu onOpenChange={(open) => open && handleLoadConcursos()}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={concursoSelecionado ? "default" : "outline"} 
                size="sm" 
                className="gap-1.5 text-xs h-8"
              >
                <Trophy className="h-4 w-4 shrink-0" />
                <span>
                  {concursoSelecionado ? `#${concursoSelecionado.concurso_id}` : "Prêmio"}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="bg-popover z-50 w-56 max-h-64 overflow-y-auto"
            >
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
                Verificar prêmios
              </div>
              {loadingConcursos ? (
                <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                  Carregando...
                </div>
              ) : concursos.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                  Nenhum concurso disponível
                </div>
              ) : (
                concursos.map((concurso) => (
                  <DropdownMenuItem
                    key={concurso.concurso_id}
                    onClick={() => handleVerificarTodos(concurso)}
                    className="gap-2 cursor-pointer"
                  >
                    <div className="flex-1">
                      <span className="font-medium">#{concurso.concurso_id}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {formatDate(concurso.data_sorteio)}
                      </span>
                    </div>
                    {concursoSelecionado?.concurso_id === concurso.concurso_id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Ações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <MoreHorizontal className="h-4 w-4" />
              Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-popover z-50 w-56">
            {/* Ações de Salvar */}
            {(onSalvarTodos || onSalvarSelecionados) && (
              <>
                {onSalvarTodos && (
                  <DropdownMenuItem onClick={onSalvarTodos} className="gap-2">
                    <Bookmark className="h-4 w-4" />
                    Salvar Todos ({palpites.length})
                  </DropdownMenuItem>
                )}
                {onSalvarSelecionados && (
                  <DropdownMenuItem 
                    onClick={onSalvarSelecionados} 
                    disabled={selected.size === 0}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Salvar Selecionados ({selected.size})
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            
            {/* Ações de Copiar */}
            <DropdownMenuItem onClick={onCopiarTodos} className="gap-2">
              <Copy className="h-4 w-4" />
              Copiar Todos ({palpites.length})
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onCopiarSelecionados} 
              disabled={selected.size === 0}
              className="gap-2"
            >
              <CopyCheck className="h-4 w-4" />
              Copiar Selecionados ({selected.size})
            </DropdownMenuItem>
            
            {/* Ações de Excluir */}
            {!hideExcluir && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onExcluirSelecionados} 
                  disabled={selected.size === 0}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Selecionados ({selected.size})
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onExcluirTodos}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Todos ({palpites.length})
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Botão Estratégias */}
        {!hideEstrategias && resumoEstrategias && resumoEstrategias.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                <Dices className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover z-50 w-64">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
                Estratégias utilizadas
              </div>
              {resumoEstrategias.map((estrategia) => (
                <DropdownMenuItem 
                  key={estrategia.nome} 
                  className="gap-2 cursor-pointer py-2"
                  onClick={() => onEstrategiaClick?.(estrategia.nome)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        {estrategia.createdAt ? new Date(estrategia.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Data não disponível'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70 truncate max-w-[140px]">
                        {estrategia.nome}
                      </span>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full ml-2 shrink-0">
                      {estrategia.count}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Contador de selecionados */}
        {selected.size > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {selected.size}/{palpites.length}
          </span>
        )}
      </div>

      {/* Resumo de Premiações */}
      {!hidePremios && resumoPremiacoes && resumoPremiacoes.total > 0 && resumoVisivel && (
        <div className={`${loteria === "megasena" ? "bg-green-950 border-green-600 shadow-green-900/30" : "bg-purple-950 border-purple-600 shadow-purple-900/30"} border rounded-xl p-3 animate-fade-in shadow-lg relative`}>
          <button
            onClick={() => setResumoVisivel(false)}
            className={`absolute top-2 right-2 ${loteria === "megasena" ? "text-green-400" : "text-purple-400"} hover:text-white transition-colors p-1`}
            aria-label="Fechar resumo"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className={`h-5 w-5 ${loteria === "megasena" ? "text-green-300" : "text-purple-300"}`} />
            <span className={`font-bold ${loteria === "megasena" ? "text-green-200" : "text-purple-200"} text-sm`}>
              🎉 {resumoPremiacoes.total} Premiação{resumoPremiacoes.total > 1 ? "ões" : ""}!
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {resumoPremiacoes.tipo === "megasena" ? (
              <>
                {(resumoPremiacoes.contagem as Record<number, number>)[6] > 0 && (
                  <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full animate-pulse shadow-md">
                    🏆 SENA: {(resumoPremiacoes.contagem as Record<number, number>)[6]}
                  </span>
                )}
                {(resumoPremiacoes.contagem as Record<number, number>)[5] > 0 && (
                  <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                    QUINA: {(resumoPremiacoes.contagem as Record<number, number>)[5]}
                  </span>
                )}
                {(resumoPremiacoes.contagem as Record<number, number>)[4] > 0 && (
                  <span className="bg-green-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                    QUADRA: {(resumoPremiacoes.contagem as Record<number, number>)[4]}
                  </span>
                )}
              </>
            ) : (
              <>
                {(resumoPremiacoes.contagem as Record<number, number>)[15] > 0 && (
                  <span className="bg-purple-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full animate-pulse shadow-md">
                    🏆 15 pts: {(resumoPremiacoes.contagem as Record<number, number>)[15]}
                  </span>
                )}
                {(resumoPremiacoes.contagem as Record<number, number>)[14] > 0 && (
                  <span className="bg-purple-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                    14 pts: {(resumoPremiacoes.contagem as Record<number, number>)[14]}
                  </span>
                )}
                {(resumoPremiacoes.contagem as Record<number, number>)[13] > 0 && (
                  <span className="bg-purple-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                    13 pts: {(resumoPremiacoes.contagem as Record<number, number>)[13]}
                  </span>
                )}
                {(resumoPremiacoes.contagem as Record<number, number>)[12] > 0 && (
                  <span className="bg-purple-800 text-purple-50 text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                    12 pts: {(resumoPremiacoes.contagem as Record<number, number>)[12]}
                  </span>
                )}
                {(resumoPremiacoes.contagem as Record<number, number>)[11] > 0 && (
                  <span className="bg-purple-900 text-purple-100 text-xs font-bold px-2.5 py-1.5 rounded-full border border-purple-700 shadow-md">
                    11 pts: {(resumoPremiacoes.contagem as Record<number, number>)[11]}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Fallback: Nenhuma premiação */}
      {!hidePremios && concursoSelecionado && resumoPremiacoes && resumoPremiacoes.total === 0 && resumoVisivel && (
        <div className="bg-muted/50 border border-border rounded-xl p-3 animate-fade-in relative">
          <button
            onClick={() => setResumoVisivel(false)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Fechar resumo"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Nenhuma premiação no concurso #{concursoSelecionado.concurso_id}. Continue tentando! 🍀
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para gerenciar estado da toolbar
export function usePalpitesToolbar<T extends PalpiteBase>(palpites: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acertosPorPalpite, setAcertosPorPalpite] = useState<Record<string, number>>({});
  const { toast } = useToast();

  // Reset selection quando palpites mudam
  useEffect(() => {
    setSelected(new Set());
    setAcertosPorPalpite({});
  }, [palpites]);

  const handleSelectAll = () => {
    if (selected.size === palpites.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(palpites.map(p => p.id)));
    }
  };

  const handleSelectChange = (id: string, checked: boolean) => {
    const newSelected = new Set(selected);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelected(newSelected);
  };

  const handleCopiarTodos = async () => {
    const texto = palpites.map((p, i) => 
      `Palpite ${String(i + 1).padStart(2, '0')}: ${p.dezenas.map(d => String(d).padStart(2, '0')).join(" ")}`
    ).join("\n");
    await navigator.clipboard.writeText(texto);
    toast({
      title: "Todos copiados! 📋",
      description: `${palpites.length} palpite(s) copiado(s).`,
    });
  };

  const handleCopiarSelecionados = async () => {
    if (selected.size === 0) {
      toast({
        title: "Nenhum palpite selecionado",
        description: "Selecione pelo menos um palpite para copiar.",
        variant: "destructive",
      });
      return;
    }

    const texto = palpites
      .filter(p => selected.has(p.id))
      .map((p, i) => `Palpite ${String(i + 1).padStart(2, '0')}: ${p.dezenas.map(d => String(d).padStart(2, '0')).join(" ")}`)
      .join("\n");

    await navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado! 📋",
      description: `${selected.size} palpite(s) copiado(s).`,
    });
  };

  const handleVerificarTodos = (concurso: ConcursoOption, novosAcertos: Record<string, number>) => {
    setAcertosPorPalpite(novosAcertos);
  };

  return {
    selected,
    setSelected,
    acertosPorPalpite,
    handleSelectAll,
    handleSelectChange,
    handleCopiarTodos,
    handleCopiarSelecionados,
    handleVerificarTodos,
  };
}
