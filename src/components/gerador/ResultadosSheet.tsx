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
}

const ITEMS_PER_PAGE = 12;

export function ResultadosSheet({
  open,
  onOpenChange,
  jogos: jogosIniciais,
  ultimoConcursoDezenas = [],
  onClearAll,
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
      <SheetContent side="bottom" className="h-full flex flex-col p-0">
        {/* Header compacto */}
        <SheetHeader className="px-3 py-2 border-b shrink-0 flex-row items-center justify-between">
          <SheetTitle className="text-base font-semibold">
            {jogos.length} Palpite{jogos.length !== 1 ? "s" : ""}
          </SheetTitle>
        </SheetHeader>

        {/* Barra de Ações compacta */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/30 shrink-0">
          {/* Botão de seleção */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="gap-1.5 text-xs h-8"
          >
            {allSelected ? (
              <>
                <CheckSquare className="h-3.5 w-3.5" />
                Desmarcar
              </>
            ) : (
              <>
                <Square className="h-3.5 w-3.5" />
                Selecionar
              </>
            )}
          </Button>

          {/* Dropdown de ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <MoreHorizontal className="h-3.5 w-3.5" />
                Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover z-50 w-48">
              <DropdownMenuItem onClick={handleCopiarTodos} className="gap-2">
                <Copy className="h-4 w-4" />
                Copiar Todos
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

        {/* Lista de Palpites */}
        <div className="flex-1 overflow-y-auto p-3 pb-20">
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
        </div>

        {/* Paginação fixa no rodapé */}
        {totalPages > 1 && (
          <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-3 border-t bg-background shrink-0 safe-area-bottom">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="h-9 px-4"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[100px] text-center">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="h-9 px-4"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
