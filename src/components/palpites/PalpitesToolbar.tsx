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
  X
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
  /** Esconder botão de excluir */
  hideExcluir?: boolean;
  /** Esconder verificação de prêmios */
  hidePremios?: boolean;
  /** Esconder estratégias */
  hideEstrategias?: boolean;
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
  hideExcluir = false,
  hidePremios = false,
  hideEstrategias = false,
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

  // Calcular resumo de estratégias
  const resumoEstrategias = useMemo(() => {
    if (hideEstrategias) return null;
    const contagem: Record<string, number> = {};
    palpites.forEach(palpite => {
      if (palpite.estrategia) {
        contagem[palpite.estrategia] = (contagem[palpite.estrategia] || 0) + 1;
      }
    });
    const estrategias = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    return estrategias.length > 0 ? estrategias : null;
  }, [palpites, hideEstrategias]);

  // Calcular resumo de premiações
  const resumoPremiacoes = useMemo(() => {
    if (Object.keys(acertosPorPalpite).length === 0) return null;
    
    const contagem = { 11: 0, 12: 0, 13: 0, 14: 0, 15: 0 };
    Object.values(acertosPorPalpite).forEach(acertos => {
      if (acertos >= 11 && acertos <= 15) {
        contagem[acertos as keyof typeof contagem]++;
      }
    });
    
    const total = contagem[11] + contagem[12] + contagem[13] + contagem[14] + contagem[15];
    return { contagem, total };
  }, [acertosPorPalpite]);

  // Carregar concursos quando abrir o dropdown
  const handleLoadConcursos = async () => {
    if (concursosLoaded) return;
    
    setLoadingConcursos(true);
    try {
      const { data } = await supabase
        .from("resultados")
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
    let tem15Acertos = false;
    
    palpites.forEach(palpite => {
      const acertos = palpite.dezenas.filter(d => concurso.dezenas.includes(d)).length;
      novosAcertos[palpite.id] = acertos;
      if (acertos === 15) tem15Acertos = true;
    });
    
    setAcertosPorPalpite(novosAcertos);
    setConcursoSelecionado(concurso);
    setResumoVisivel(true);
    
    // 🎉 Confetes se tiver 15 acertos!
    if (tem15Acertos) {
      const duration = 4000;
      const end = Date.now() + duration;
      
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b']
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
    
    toast({
      title: tem15Acertos ? "🎉 PARABÉNS! 15 ACERTOS!" : "Verificação concluída! 🎯",
      description: tem15Acertos 
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
            <DropdownMenuContent align="end" className="bg-popover z-50 w-56">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
                Estratégias utilizadas
              </div>
              {resumoEstrategias.map(([estrategia, count]) => (
                <DropdownMenuItem 
                  key={estrategia} 
                  className="gap-2 cursor-pointer"
                  onClick={() => onEstrategiaClick?.(estrategia)}
                >
                  <span className="flex-1 truncate">{estrategia}</span>
                  <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                    {count}
                  </span>
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
        <div className="bg-emerald-950 border border-emerald-600 rounded-xl p-3 animate-fade-in shadow-lg shadow-emerald-900/30 relative">
          <button
            onClick={() => setResumoVisivel(false)}
            className="absolute top-2 right-2 text-emerald-400 hover:text-white transition-colors p-1"
            aria-label="Fechar resumo"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-emerald-300" />
            <span className="font-bold text-emerald-200 text-sm">
              🎉 {resumoPremiacoes.total} Premiação{resumoPremiacoes.total > 1 ? "ões" : ""}!
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {resumoPremiacoes.contagem[15] > 0 && (
              <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full animate-pulse shadow-md">
                🏆 15 pts: {resumoPremiacoes.contagem[15]}
              </span>
            )}
            {resumoPremiacoes.contagem[14] > 0 && (
              <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                14 pts: {resumoPremiacoes.contagem[14]}
              </span>
            )}
            {resumoPremiacoes.contagem[13] > 0 && (
              <span className="bg-emerald-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                13 pts: {resumoPremiacoes.contagem[13]}
              </span>
            )}
            {resumoPremiacoes.contagem[12] > 0 && (
              <span className="bg-emerald-800 text-emerald-50 text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                12 pts: {resumoPremiacoes.contagem[12]}
              </span>
            )}
            {resumoPremiacoes.contagem[11] > 0 && (
              <span className="bg-emerald-900 text-emerald-100 text-xs font-bold px-2.5 py-1.5 rounded-full border border-emerald-700 shadow-md">
                11 pts: {resumoPremiacoes.contagem[11]}
              </span>
            )}
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
