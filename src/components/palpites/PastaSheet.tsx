import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PalpiteCard } from "@/components/shared/PalpiteCard";
import { formatarDezena } from "@/lib/lotofacil";
import { useToast } from "@/hooks/use-toast";
import { usePalpitesSalvos, type PalpiteSalvo } from "@/hooks/usePalpitesSalvos";
import { supabase } from "@/integrations/supabase/client";
import { 
  Copy, 
  CopyCheck, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  CheckSquare,
  Square,
  MoreHorizontal,
  ArrowLeft,
  Folder,
  Trophy,
  ChevronDown,
  Check
} from "lucide-react";

interface ConcursoOption {
  concurso_id: number;
  data_sorteio: string;
  dezenas: number[];
}

interface PastaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pastaNome: string;
  pastaCor: string;
  palpites: PalpiteSalvo[];
  onPalpitesChange: (palpites: PalpiteSalvo[]) => void;
}

const ITEMS_PER_PAGE = 12;

export function PastaSheet({
  open,
  onOpenChange,
  pastaNome,
  pastaCor,
  palpites: palpitesIniciais,
  onPalpitesChange,
}: PastaSheetProps) {
  const { toast } = useToast();
  const { excluirPalpite, excluirVarios } = usePalpitesSalvos();
  const [palpites, setPalpites] = useState<PalpiteSalvo[]>(palpitesIniciais);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [ultimoConcursoDezenas, setUltimoConcursoDezenas] = useState<number[]>([]);
  
  // Estado para verificação de prêmios
  const [concursos, setConcursos] = useState<ConcursoOption[]>([]);
  const [loadingConcursos, setLoadingConcursos] = useState(false);
  const [concursosLoaded, setConcursosLoaded] = useState(false);
  const [concursoSelecionado, setConcursoSelecionado] = useState<ConcursoOption | null>(null);
  const [acertosPorPalpite, setAcertosPorPalpite] = useState<Record<string, number>>({});

  // Sincronizar palpites quando props mudam
  useEffect(() => {
    setPalpites(palpitesIniciais);
    setSelected(new Set());
    setCurrentPage(0);
    setAcertosPorPalpite({});
    setConcursoSelecionado(null);
  }, [palpitesIniciais]);

  // Buscar último concurso
  useEffect(() => {
    const fetchUltimoConcurso = async () => {
      const { data } = await supabase
        .from("resultados")
        .select("dezenas")
        .order("concurso_id", { ascending: false })
        .limit(1)
        .single();
      
      if (data?.dezenas) {
        setUltimoConcursoDezenas(data.dezenas);
      }
    };
    if (open) fetchUltimoConcurso();
  }, [open]);

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
    palpites.forEach(palpite => {
      const acertos = palpite.dezenas.filter(d => concurso.dezenas.includes(d)).length;
      novosAcertos[palpite.id] = acertos;
    });
    setAcertosPorPalpite(novosAcertos);
    setConcursoSelecionado(concurso);
    toast({
      title: "Verificação concluída! 🎯",
      description: `${palpites.length} palpite(s) verificado(s) contra o concurso #${concurso.concurso_id}`,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const totalPages = Math.ceil(palpites.length / ITEMS_PER_PAGE);
  
  const palpitesPaginados = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return palpites.slice(start, start + ITEMS_PER_PAGE);
  }, [palpites, currentPage]);

  const handleSelectChange = (id: string, checked: boolean) => {
    const newSelected = new Set(selected);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelected(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.size === palpites.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(palpites.map((p) => p.id)));
    }
  };

  const formatPalpiteParaCopia = (palpite: PalpiteSalvo, index: number) => {
    return `Palpite ${index + 1}: ${palpite.dezenas.map(formatarDezena).join(" ")}`;
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
      .filter((p) => selected.has(p.id))
      .map((palpite, i) => formatPalpiteParaCopia(palpite, i))
      .join("\n");

    await navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado! 📋",
      description: `${selected.size} palpite(s) copiado(s).`,
    });
  };

  const handleCopiarTodos = async () => {
    const texto = palpites.map((p, i) => formatPalpiteParaCopia(p, i)).join("\n");
    await navigator.clipboard.writeText(texto);
    toast({
      title: "Todos copiados! 📋",
      description: `${palpites.length} palpite(s) copiado(s).`,
    });
  };

  const handleExcluirSelecionados = async () => {
    if (selected.size === 0) return;
    
    const success = await excluirVarios(Array.from(selected));
    if (success) {
      const novosPalpites = palpites.filter((p) => !selected.has(p.id));
      setPalpites(novosPalpites);
      onPalpitesChange(novosPalpites);
      setSelected(new Set());
      
      const newTotalPages = Math.ceil(novosPalpites.length / ITEMS_PER_PAGE);
      if (currentPage >= newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages - 1);
      }

      if (novosPalpites.length === 0) {
        onOpenChange(false);
      }
    }
  };

  const handleDeleteSingle = async (id: string) => {
    const success = await excluirPalpite(id);
    if (success) {
      const novosPalpites = palpites.filter((p) => p.id !== id);
      setPalpites(novosPalpites);
      onPalpitesChange(novosPalpites);
      
      const newSelected = new Set(selected);
      newSelected.delete(id);
      setSelected(newSelected);
      
      const newTotalPages = Math.ceil(novosPalpites.length / ITEMS_PER_PAGE);
      if (currentPage >= newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages - 1);
      }

      if (novosPalpites.length === 0) {
        onOpenChange(false);
      }
    }
  };

  const handleCopySingle = async (palpite: PalpiteSalvo) => {
    const texto = palpite.dezenas.map(formatarDezena).join(" ");
    await navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado! 📋",
      description: "Dezenas copiadas.",
    });
  };

  const allSelected = selected.size === palpites.length && palpites.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[100dvh] p-0 overflow-y-auto z-50"
        onInteractOutside={(e) => e.preventDefault()}
        hideCloseButton
        hideOverlay
      >
        {/* Header fixo */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <SheetHeader className="px-4 py-3 flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Folder className="h-5 w-5" style={{ color: pastaCor }} />
              <SheetTitle className="text-lg font-bold">
                {pastaNome}
              </SheetTitle>
              <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-full">
                {palpites.length} palpite{palpites.length !== 1 ? "s" : ""}
              </span>
            </div>
          </SheetHeader>
        </div>

        {/* Conteúdo */}
        <div className="px-3 py-3 space-y-3">
          {/* Barra de seleção e ações */}
          <div className="flex items-center justify-between py-2 gap-2">
            <Button
              variant={allSelected ? "default" : "outline"}
              size="icon"
              onClick={handleSelectAll}
              className="h-8 w-8 shrink-0"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
            
            {/* Verificar Prêmios - Dropdown Universal */}
            <DropdownMenu onOpenChange={(open) => open && handleLoadConcursos()}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={concursoSelecionado ? "default" : "outline"} 
                  size="sm" 
                  className="gap-1.5 text-xs h-8 flex-1 max-w-[160px]"
                >
                  <Trophy className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {concursoSelecionado ? `Prêmio #${concursoSelecionado.concurso_id}` : "Verificar Prêmio"}
                  </span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
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
            
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <span className="text-xs text-muted-foreground">
                  {selected.size}/{palpites.length}
                </span>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2">
                    <MoreHorizontal className="h-4 w-4" />
                    Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover z-50 w-56">
                  <DropdownMenuItem onClick={handleCopiarTodos} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copiar Todos ({palpites.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleCopiarSelecionados} 
                    disabled={selected.size === 0}
                    className="gap-2"
                  >
                    <CopyCheck className="h-4 w-4" />
                    Copiar Selecionados ({selected.size})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleExcluirSelecionados} 
                    disabled={selected.size === 0}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Selecionados ({selected.size})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Lista de Palpites */}
          <div className="grid gap-2">
            {palpitesPaginados.map((palpite, localIndex) => {
              const globalIndex = currentPage * ITEMS_PER_PAGE + localIndex;
              return (
                <PalpiteCard
                  key={palpite.id}
                  index={globalIndex}
                  dezenas={palpite.dezenas}
                  ultimoConcursoDezenas={ultimoConcursoDezenas}
                  isSelected={selected.has(palpite.id)}
                  onSelectChange={(checked) => handleSelectChange(palpite.id, checked)}
                  onDelete={() => handleDeleteSingle(palpite.id)}
                  onCopy={() => handleCopySingle(palpite)}
                  createdAt={palpite.created_at}
                  acertos={acertosPorPalpite[palpite.id] ?? (palpite.conferido ? palpite.acertos : undefined)}
                  label={palpite.estrategia ? `🎯 ${palpite.estrategia}` : undefined}
                  hideVerificar
                />
              );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-4 border-t mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="h-10 px-4 gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium">
                  {currentPage + 1} / {totalPages}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {currentPage * ITEMS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ITEMS_PER_PAGE, palpites.length)} de {palpites.length}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="h-10 px-4 gap-1"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="h-8" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
