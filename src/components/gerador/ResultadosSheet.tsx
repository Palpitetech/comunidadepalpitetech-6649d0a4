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
import { EstrategiaCard, type EstrategiaData } from "./EstrategiaCard";
import { NovaPastaDialog } from "@/components/palpites/NovaPastaDialog";
import { SelecionarPastaDialog } from "@/components/palpites/SelecionarPastaDialog";
import { formatarDezena } from "@/lib/lotofacil";
import { useToast } from "@/hooks/use-toast";
import { usePalpitesSalvos, type PalpitePasta } from "@/hooks/usePalpitesSalvos";
import { 
  Copy, 
  CopyCheck, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  CheckSquare,
  Square,
  MoreHorizontal,
  Save,
  Bookmark,
  ArrowLeft
} from "lucide-react";

interface JogoGerado {
  dezenas: number[];
}

interface ResultadosSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jogos: JogoGerado[];
  ultimoConcursoDezenas?: number[];
  onClearAll: () => void;
  estrategia?: EstrategiaData;
  periodoAnalise?: number;
  dezenasFixes?: number[];
}

const ITEMS_PER_PAGE = 12;

export function ResultadosSheet({
  open,
  onOpenChange,
  jogos: jogosIniciais,
  ultimoConcursoDezenas = [],
  onClearAll,
  estrategia,
  periodoAnalise,
  dezenasFixes = [],
}: ResultadosSheetProps) {
  const { toast } = useToast();
  const { salvarPalpites, buscarPastas, criarPasta, isLoading: isSaving } = usePalpitesSalvos();
  const [jogos, setJogos] = useState<JogoGerado[]>(jogosIniciais);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  
  // Estados para dialogs de pasta
  const [pastas, setPastas] = useState<PalpitePasta[]>([]);
  const [selecionarPastaOpen, setSelecionarPastaOpen] = useState(false);
  const [novaPastaOpen, setNovaPastaOpen] = useState(false);
  const [salvarTodosMode, setSalvarTodosMode] = useState(false);

  // Sincronizar jogos quando props mudam
  useEffect(() => {
    setJogos(jogosIniciais);
    setSelected(new Set());
    setCurrentPage(0);
  }, [jogosIniciais]);

  // Carregar pastas quando abrir
  useEffect(() => {
    if (open) {
      buscarPastas().then(setPastas);
    }
  }, [open]);

  const totalPages = Math.ceil(jogos.length / ITEMS_PER_PAGE);
  
  const jogosPaginados = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return jogos.slice(start, start + ITEMS_PER_PAGE);
  }, [jogos, currentPage]);

  const handleSelectChange = (globalIndex: number, checked: boolean) => {
    const newSelected = new Set(selected);
    if (checked) {
      newSelected.add(globalIndex);
    } else {
      newSelected.delete(globalIndex);
    }
    setSelected(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.size === jogos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(jogos.map((_, i) => i)));
    }
  };

  const formatJogoParaCopia = (jogo: JogoGerado, index: number) => {
    return `Palpite ${index + 1}: ${jogo.dezenas.map(formatarDezena).join(" ")}`;
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

    const texto = jogos
      .filter((_, i) => selected.has(i))
      .map((jogo, i) => {
        const originalIndex = Array.from(selected).sort((a, b) => a - b)[i];
        return formatJogoParaCopia(jogo, originalIndex);
      })
      .join("\n");

    await navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado! 📋",
      description: `${selected.size} palpite(s) copiado(s) para a área de transferência.`,
    });
  };

  const handleCopiarTodos = async () => {
    const texto = jogos.map((jogo, i) => formatJogoParaCopia(jogo, i)).join("\n");
    await navigator.clipboard.writeText(texto);
    toast({
      title: "Todos copiados! 📋",
      description: `${jogos.length} palpite(s) copiado(s) para a área de transferência.`,
    });
  };

  // Criar texto resumido da estratégia para salvar
  const getEstrategiaTexto = () => {
    if (!estrategia) return undefined;
    return estrategia.ferramentas.slice(0, 2).join(" + ");
  };

  // Fluxo de salvar com seleção de pasta
  const handleIniciarSalvarSelecionados = () => {
    if (selected.size === 0) {
      toast({
        title: "Nenhum palpite selecionado",
        description: "Selecione pelo menos um palpite para salvar.",
        variant: "destructive",
      });
      return;
    }
    setSalvarTodosMode(false);
    setSelecionarPastaOpen(true);
  };

  const handleIniciarSalvarTodos = () => {
    setSalvarTodosMode(true);
    setSelecionarPastaOpen(true);
  };

  const handleSelecionarPasta = async (pastaId: string | null) => {
    const palpitesParaSalvar = salvarTodosMode 
      ? jogos 
      : jogos.filter((_, i) => selected.has(i));
    
    await salvarPalpites(palpitesParaSalvar, periodoAnalise, pastaId, getEstrategiaTexto(), estrategia);
    setSelecionarPastaOpen(false);
  };

  const handleCriarNovaPasta = () => {
    setSelecionarPastaOpen(false);
    setNovaPastaOpen(true);
  };

  const handleConfirmarNovaPasta = async (nome: string, cor: string) => {
    const novaPasta = await criarPasta(nome, cor);
    if (novaPasta) {
      setPastas(prev => [...prev, novaPasta]);
      // Salvar na nova pasta
      const palpitesParaSalvar = salvarTodosMode 
        ? jogos 
        : jogos.filter((_, i) => selected.has(i));
      
      await salvarPalpites(palpitesParaSalvar, periodoAnalise, novaPasta.id, getEstrategiaTexto(), estrategia);
    }
    setNovaPastaOpen(false);
  };

  const handleExcluirSelecionados = () => {
    if (selected.size === 0) {
      toast({
        title: "Nenhum palpite selecionado",
        description: "Selecione pelo menos um palpite para excluir.",
        variant: "destructive",
      });
      return;
    }

    const novosJogos = jogos.filter((_, i) => !selected.has(i));
    setJogos(novosJogos);
    setSelected(new Set());
    
    // Ajustar página se necessário
    const newTotalPages = Math.ceil(novosJogos.length / ITEMS_PER_PAGE);
    if (currentPage >= newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages - 1);
    }

    toast({
      title: "Excluído!",
      description: `${selected.size} palpite(s) removido(s).`,
    });

    // Se não sobrou nenhum jogo, fechar o sheet
    if (novosJogos.length === 0) {
      onClearAll();
      onOpenChange(false);
    }
  };

  const handleExcluirTodos = () => {
    onClearAll();
    onOpenChange(false);
  };

  const handleDeleteSingle = (index: number) => {
    const novosJogos = jogos.filter((_, i) => i !== index);
    setJogos(novosJogos);
    
    // Atualizar seleção removendo índices inválidos
    const newSelected = new Set<number>();
    selected.forEach((i) => {
      if (i < index) newSelected.add(i);
      else if (i > index) newSelected.add(i - 1);
    });
    setSelected(newSelected);
    
    // Ajustar página se necessário
    const newTotalPages = Math.ceil(novosJogos.length / ITEMS_PER_PAGE);
    if (currentPage >= newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages - 1);
    }

    // Se não sobrou nenhum jogo, fechar o sheet
    if (novosJogos.length === 0) {
      onClearAll();
      onOpenChange(false);
    }
  };

  const allSelected = selected.size === jogos.length && jogos.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[calc(100%-4rem)] p-0 overflow-y-auto z-40"
        onInteractOutside={(e) => e.preventDefault()}
        hideCloseButton
        hideOverlay
      >
        {/* Header fixo no topo */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <SheetHeader className="px-4 py-3 flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <SheetTitle className="text-lg font-bold">
                Palpites
              </SheetTitle>
              <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-full">
                {jogos.length} gerados
              </span>
            </div>
          </SheetHeader>
        </div>

        {/* Conteúdo com scroll da página toda */}
        <div className="px-3 py-3 space-y-3">
          {/* Estratégia de Geração - Primeiro */}
          {estrategia && (
            <EstrategiaCard estrategia={estrategia} />
          )}

          {/* Barra de seleção e ações - Entre estratégia e palpites */}
          <div className="flex items-center justify-between py-2">
            <Button
              variant={allSelected ? "default" : "outline"}
              size="sm"
              onClick={handleSelectAll}
              className="gap-2 text-xs h-8"
            >
              {allSelected ? (
                <>
                  <CheckSquare className="h-4 w-4" />
                  Todos selecionados
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  Selecionar todos
                </>
              )}
            </Button>
            
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <span className="text-xs text-muted-foreground">
                  {selected.size} de {jogos.length}
                </span>
              )}
              
              {/* Dropdown de ações */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2" disabled={isSaving}>
                    <MoreHorizontal className="h-4 w-4" />
                    Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover z-50 w-56">
                  {/* Ações de Salvar */}
                  <DropdownMenuItem onClick={handleIniciarSalvarTodos} disabled={isSaving} className="gap-2">
                    <Bookmark className="h-4 w-4" />
                    Salvar Todos ({jogos.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleIniciarSalvarSelecionados} 
                    disabled={selected.size === 0 || isSaving}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Salvar Selecionados ({selected.size})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  
                  {/* Ações de Copiar */}
                  <DropdownMenuItem onClick={handleCopiarTodos} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copiar Todos ({jogos.length})
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
                  
                  {/* Ações de Excluir */}
                  <DropdownMenuItem 
                    onClick={handleExcluirSelecionados} 
                    disabled={selected.size === 0}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Selecionados ({selected.size})
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleExcluirTodos}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Limpar Tudo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Lista de Palpites */}
          <div className="grid gap-2">
            {jogosPaginados.map((jogo, localIndex) => {
              const globalIndex = currentPage * ITEMS_PER_PAGE + localIndex;
              return (
                <PalpiteCard
                  key={globalIndex}
                  index={globalIndex}
                  dezenas={jogo.dezenas}
                  ultimoConcursoDezenas={ultimoConcursoDezenas}
                  dezenasFixes={dezenasFixes}
                  isSelected={selected.has(globalIndex)}
                  onSelectChange={(checked) => handleSelectChange(globalIndex, checked)}
                  onDelete={() => handleDeleteSingle(globalIndex)}
                />
              );
            })}
          </div>

          {/* Paginação inline */}
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
                  {currentPage * ITEMS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ITEMS_PER_PAGE, jogos.length)} de {jogos.length}
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

          {/* Espaço extra no final */}
          <div className="h-8" />
        </div>
      </SheetContent>

      {/* Dialog Selecionar Pasta */}
      <SelecionarPastaDialog
        open={selecionarPastaOpen}
        onOpenChange={setSelecionarPastaOpen}
        pastas={pastas.map(p => ({ id: p.id, nome: p.nome, cor: p.cor }))}
        onSelect={handleSelecionarPasta}
        onNovaPasta={handleCriarNovaPasta}
        isLoading={isSaving}
      />

      {/* Dialog Nova Pasta */}
      <NovaPastaDialog
        open={novaPastaOpen}
        onOpenChange={setNovaPastaOpen}
        onConfirm={handleConfirmarNovaPasta}
        isLoading={isSaving}
      />
    </Sheet>
  );
}
