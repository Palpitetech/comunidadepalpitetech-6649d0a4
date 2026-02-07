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
import { PalpiteCard } from "./PalpiteCard";
import { EstrategiaCard, type EstrategiaData } from "./EstrategiaCard";
import { formatarDezena } from "@/lib/lotofacil";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  CopyCheck, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  CheckSquare,
  Square,
  MoreHorizontal
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
}

const ITEMS_PER_PAGE = 12;

export function ResultadosSheet({
  open,
  onOpenChange,
  jogos: jogosIniciais,
  ultimoConcursoDezenas = [],
  onClearAll,
  estrategia,
}: ResultadosSheetProps) {
  const { toast } = useToast();
  const [jogos, setJogos] = useState<JogoGerado[]>(jogosIniciais);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);

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

  const allSelected = selected.size === jogos.length && jogos.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-full p-0 overflow-y-auto">
        {/* Header fixo no topo */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <SheetHeader className="px-4 py-3 flex-row items-center justify-between">
            <div className="flex items-center gap-3">
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
          {/* Barra de seleção e ações - Primeiro */}
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
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover z-50 w-52">
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

          {/* Estratégia de Geração */}
          {estrategia && (
            <EstrategiaCard estrategia={estrategia} />
          )}

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
                  isSelected={selected.has(globalIndex)}
                  onSelectChange={(checked) => handleSelectChange(globalIndex, checked)}
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
    </Sheet>
  );
}
