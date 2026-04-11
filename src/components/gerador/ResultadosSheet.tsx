import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PalpiteCard } from "@/components/shared/PalpiteCard";
import { EstrategiaCard, type EstrategiaData } from "./EstrategiaCard";
import { PalpitesToolbar } from "@/components/palpites/PalpitesToolbar";
import { SelecionarSubpastaDialog } from "@/components/palpites/SelecionarSubpastaDialog";
import { formatarDezena } from "@/lib/lotofacil";
import { useToast } from "@/hooks/use-toast";
import { usePalpitesSalvos } from "@/hooks/usePalpitesSalvos";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

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
  dezenasFixas?: number[];
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
  dezenasFixas = [],
}: ResultadosSheetProps) {
  const { toast } = useToast();
  const { salvarPalpites, isLoading: isSaving } = usePalpitesSalvos();
  const [jogos, setJogos] = useState<JogoGerado[]>(jogosIniciais);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  
  // Estados para dialog de subpasta
  const [selecionarSubpastaOpen, setSelecionarSubpastaOpen] = useState(false);
  const [salvarTodosMode, setSalvarTodosMode] = useState(false);

  // Sincronizar jogos quando props mudam
  useEffect(() => {
    setJogos(jogosIniciais);
    setSelected(new Set());
    setCurrentPage(0);
  }, [jogosIniciais]);

  const totalPages = Math.ceil(jogos.length / ITEMS_PER_PAGE);
  
  const jogosPaginados = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return jogos.slice(start, start + ITEMS_PER_PAGE);
  }, [jogos, currentPage]);

  // Converter jogos para formato de palpite para PalpitesToolbar
  const palpitesParaToolbar = jogos.map((jogo, i) => ({
    id: `gerador-${i}`,
    dezenas: jogo.dezenas,
    qtd_dezenas: jogo.dezenas.length,
    conferido: false,
    acertos: null as number | null,
  }));

  const handleSelectChange = (globalIndex: number, checked: boolean) => {
    const newSelected = new Set(selected);
    const id = `gerador-${globalIndex}`;
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelected(newSelected);
  };

  const formatJogoParaCopia = (jogo: JogoGerado, index: number) => {
    return `Palpite ${index + 1}: ${jogo.dezenas.map(formatarDezena).join(" ")}`;
  };

  const handleCopiarTodos = async () => {
    const texto = jogos.map((jogo, i) => formatJogoParaCopia(jogo, i)).join("\n");
    await navigator.clipboard.writeText(texto);
    toast({
      title: "Todos copiados! 📋",
      description: `${jogos.length} palpite(s) copiado(s) para a área de transferência.`,
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

    const indices = Array.from(selected)
      .map(id => parseInt(id.replace('gerador-', '')))
      .sort((a, b) => a - b);

    const texto = indices
      .map((i) => formatJogoParaCopia(jogos[i], i))
      .join("\n");

    await navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado! 📋",
      description: `${selected.size} palpite(s) copiado(s) para a área de transferência.`,
    });
  };

  // Funções para salvar
  const handleSalvarSelecionados = () => {
    if (selected.size === 0) {
      toast({
        title: "Nenhum palpite selecionado",
        description: "Selecione pelo menos um palpite para salvar.",
        variant: "destructive",
      });
      return;
    }
    setSalvarTodosMode(false);
    setSelecionarSubpastaOpen(true);
  };

  const handleSalvarTodos = () => {
    setSalvarTodosMode(true);
    setSelecionarSubpastaOpen(true);
  };

  const handleSelecionarSubpasta = async (pastaId: string) => {
    let palpitesParaSalvar: JogoGerado[];
    
    if (salvarTodosMode) {
      palpitesParaSalvar = jogos;
    } else {
      const indices = Array.from(selected)
        .map(id => parseInt(id.replace('gerador-', '')))
        .sort((a, b) => a - b);
      palpitesParaSalvar = indices.map(i => jogos[i]);
    }
    
    const getEstrategiaTexto = () => {
      if (!estrategia) return undefined;
      return estrategia.ferramentas.slice(0, 2).join(" + ");
    };
    
    await salvarPalpites(palpitesParaSalvar, periodoAnalise, pastaId, getEstrategiaTexto(), estrategia, "lotofacil");
    setSelecionarSubpastaOpen(false);
  };

  // Funções para excluir
  const handleExcluirSelecionados = () => {
    if (selected.size === 0) {
      toast({
        title: "Nenhum palpite selecionado",
        description: "Selecione pelo menos um palpite para excluir.",
        variant: "destructive",
      });
      return;
    }

    const indices = new Set(
      Array.from(selected).map(id => parseInt(id.replace('gerador-', '')))
    );
    
    const novosJogos = jogos.filter((_, i) => !indices.has(i));
    setJogos(novosJogos);
    setSelected(new Set());
    
    const newTotalPages = Math.ceil(novosJogos.length / ITEMS_PER_PAGE);
    if (currentPage >= newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages - 1);
    }

    toast({
      title: "Excluído!",
      description: `${selected.size} palpite(s) removido(s).`,
    });

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
    const newSelected = new Set<string>();
    selected.forEach((id) => {
      const i = parseInt(id.replace('gerador-', ''));
      if (i < index) newSelected.add(id);
      else if (i > index) newSelected.add(`gerador-${i - 1}`);
    });
    setSelected(newSelected);
    
    const newTotalPages = Math.ceil(novosJogos.length / ITEMS_PER_PAGE);
    if (currentPage >= newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages - 1);
    }

    if (novosJogos.length === 0) {
      onClearAll();
      onOpenChange(false);
    }
  };

  const handleSelectAll = () => {
    if (selected.size === jogos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(jogos.map((_, i) => `gerador-${i}`)));
    }
  };

  const toolbarProps = {
    palpites: palpitesParaToolbar,
    selected,
    onSelectAll: handleSelectAll,
    onCopiarTodos: handleCopiarTodos,
    onExcluirTodos: handleExcluirTodos,
    onVerificarTodos: () => {}, // Não usado em resultado
    onEstrategiaClick: () => {}, // Não usado em resultado
    onCopiarSelecionados: handleCopiarSelecionados,
    onExcluirSelecionados: handleExcluirSelecionados,
    onSalvarTodos: handleSalvarTodos,
    onSalvarSelecionados: handleSalvarSelecionados,
    hidePremios: true, // Não há verificação de prêmios no gerador
    hideEstrategias: true, // Estratégia já está exibida acima
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[calc(100dvh-3.5rem)] p-0 overflow-y-auto z-40"
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

        {/* Conteúdo com scroll */}
        <div className="px-3 py-3 space-y-3">
          {/* Estratégia de Geração */}
          {estrategia && (
            <EstrategiaCard estrategia={estrategia} />
          )}

          {/* Toolbar unificada */}
          <PalpitesToolbar {...toolbarProps} />

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
                  dezenasFixas={dezenasFixas}
                  isSelected={selected.has(`gerador-${globalIndex}`)}
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

      {/* Dialog Selecionar Subpasta */}
      <SelecionarSubpastaDialog
        open={selecionarSubpastaOpen}
        onOpenChange={setSelecionarSubpastaOpen}
        onSelect={handleSelecionarSubpasta}
        loteria="lotofacil"
        isLoading={isSaving}
      />
    </Sheet>
  );
}
