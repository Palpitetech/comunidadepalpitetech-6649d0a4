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
  X,
  Bookmark,
  Save
} from "lucide-react";

interface ConcursoOption {
  concurso_id: number;
  data_sorteio: string;
  dezenas_sorteio1: number[];
  dezenas_sorteio2: number[];
}

interface PalpiteBase {
  id: string;
  dezenas: number[];
}

export interface PalpitesToolbarDuplaSenaProps {
  palpites: PalpiteBase[];
  selected: Set<string>;
  onSelectAll: () => void;
  onCopiarTodos: () => void;
  onCopiarSelecionados: () => void;
  onExcluirSelecionados?: () => void;
  onExcluirTodos?: () => void;
  onVerificarTodos?: (concurso: ConcursoOption, acertosPorPalpite: Record<string, { s1: number; s2: number }>) => void;
  onSalvarTodos?: () => void;
  onSalvarSelecionados?: () => void;
  hideExcluir?: boolean;
  hidePremios?: boolean;
}

export function PalpitesToolbarDuplaSena({
  palpites,
  selected,
  onSelectAll,
  onCopiarTodos,
  onCopiarSelecionados,
  onExcluirSelecionados,
  onExcluirTodos,
  onVerificarTodos,
  onSalvarTodos,
  onSalvarSelecionados,
  hideExcluir = false,
  hidePremios = false,
}: PalpitesToolbarDuplaSenaProps) {
  const { toast } = useToast();
  
  const [concursos, setConcursos] = useState<ConcursoOption[]>([]);
  const [loadingConcursos, setLoadingConcursos] = useState(false);
  const [concursosLoaded, setConcursosLoaded] = useState(false);
  const [concursoSelecionado, setConcursoSelecionado] = useState<ConcursoOption | null>(null);
  const [resumoVisivel, setResumoVisivel] = useState(true);
  const [acertosPorPalpite, setAcertosPorPalpite] = useState<Record<string, { s1: number; s2: number }>>({});

  const allSelected = selected.size === palpites.length && palpites.length > 0;

  // Calcular resumo de premiações - Dupla Sena: 3 a 6 acertos
  const resumoPremiacoes = useMemo(() => {
    if (Object.keys(acertosPorPalpite).length === 0) return null;
    
    // Dupla Sena premia de 3 a 6 acertos em cada sorteio
    const contagem = { 3: 0, 4: 0, 5: 0, 6: 0 };
    Object.values(acertosPorPalpite).forEach(({ s1, s2 }) => {
      // Maior acerto entre S1 e S2
      const maior = Math.max(s1, s2);
      if (maior >= 3 && maior <= 6) {
        contagem[maior as keyof typeof contagem]++;
      }
    });
    
    const total = contagem[3] + contagem[4] + contagem[5] + contagem[6];
    return { contagem, total };
  }, [acertosPorPalpite]);

  const handleLoadConcursos = async () => {
    if (concursosLoaded) return;
    
    setLoadingConcursos(true);
    try {
      const { data } = await supabase
        .from("resultados_duplasena")
        .select("concurso_id, data_sorteio, dezenas_sorteio1, dezenas_sorteio2")
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

  const handleVerificarTodos = (concurso: ConcursoOption) => {
    const novosAcertos: Record<string, { s1: number; s2: number }> = {};
    let tem6Acertos = false;
    
    palpites.forEach(palpite => {
      const acertosS1 = palpite.dezenas.filter(d => concurso.dezenas_sorteio1.includes(d)).length;
      const acertosS2 = palpite.dezenas.filter(d => concurso.dezenas_sorteio2.includes(d)).length;
      novosAcertos[palpite.id] = { s1: acertosS1, s2: acertosS2 };
      if (acertosS1 === 6 || acertosS2 === 6) tem6Acertos = true;
    });
    
    setAcertosPorPalpite(novosAcertos);
    setConcursoSelecionado(concurso);
    setResumoVisivel(true);
    
    // 🎉 Confetes se tiver 6 acertos!
    if (tem6Acertos) {
      const duration = 4000;
      const end = Date.now() + duration;
      
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f97316', '#ea580c', '#c2410c', '#fbbf24', '#f59e0b']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f97316', '#ea580c', '#c2410c', '#fbbf24', '#f59e0b']
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
    
    toast({
      title: tem6Acertos ? "🎉 PARABÉNS! SENA!" : "Verificação concluída! 🎯",
      description: tem6Acertos 
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
                      <Check className="h-4 w-4 text-duplasena-primary" />
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

        {/* Contador de selecionados */}
        {selected.size > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {selected.size}/{palpites.length}
          </span>
        )}
      </div>

      {/* Resumo de Premiações */}
      {!hidePremios && resumoPremiacoes && resumoPremiacoes.total > 0 && resumoVisivel && (
        <div className="bg-orange-950 border border-orange-600 rounded-xl p-3 animate-fade-in shadow-lg shadow-orange-900/30 relative">
          <button
            onClick={() => setResumoVisivel(false)}
            className="absolute top-2 right-2 text-orange-400 hover:text-white transition-colors p-1"
            aria-label="Fechar resumo"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-orange-300" />
            <span className="font-bold text-orange-200 text-sm">
              🎉 {resumoPremiacoes.total} Premiação{resumoPremiacoes.total > 1 ? "ões" : ""}!
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {resumoPremiacoes.contagem[6] > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full animate-pulse shadow-md">
                🏆 SENA: {resumoPremiacoes.contagem[6]}
              </span>
            )}
            {resumoPremiacoes.contagem[5] > 0 && (
              <span className="bg-orange-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                QUINA: {resumoPremiacoes.contagem[5]}
              </span>
            )}
            {resumoPremiacoes.contagem[4] > 0 && (
              <span className="bg-orange-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                QUADRA: {resumoPremiacoes.contagem[4]}
              </span>
            )}
            {resumoPremiacoes.contagem[3] > 0 && (
              <span className="bg-orange-800 text-orange-50 text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md">
                TERNO: {resumoPremiacoes.contagem[3]}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
