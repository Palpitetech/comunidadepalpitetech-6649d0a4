import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EstrategiaCard, type EstrategiaData } from "@/components/gerador/EstrategiaCard";
import { useToast } from "@/hooks/use-toast";
import { usePalpitesSalvos } from "@/hooks/usePalpitesSalvos";
import { SelecionarSubpastaDialog } from "@/components/palpites/SelecionarSubpastaDialog";
import { JogoCardMegaSena } from "@/components/megasena/JogoCardMegaSena";
import { PalpitesToolbar } from "@/components/palpites/PalpitesToolbar";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

interface JogoGerado {
  dezenas: number[];
}

interface ResultadosSheetMegaSenaProps {
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

export function ResultadosSheetMegaSena({
  open,
  onOpenChange,
  jogos: jogosIniciais,
  ultimoConcursoDezenas = [],
  onClearAll,
  estrategia,
  periodoAnalise,
  dezenasFixes = [],
}: ResultadosSheetMegaSenaProps) {
  const { toast } = useToast();
  const { salvarPalpites, isLoading: isSaving } = usePalpitesSalvos();
  const [jogos, setJogos] = useState<JogoGerado[]>(jogosIniciais);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [acertosPorPalpite, setAcertosPorPalpite] = useState<Record<string, number>>({});
  
  const [selecionarSubpastaOpen, setSelecionarSubpastaOpen] = useState(false);
  const [salvarTodosMode, setSalvarTodosMode] = useState(false);

  useEffect(() => {
    setJogos(jogosIniciais);
    setSelected(new Set());
    setCurrentPage(0);
    setAcertosPorPalpite({});
  }, [jogosIniciais]);

  const totalPages = Math.ceil(jogos.length / ITEMS_PER_PAGE);
  
  const jogosPaginados = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return jogos.slice(start, start + ITEMS_PER_PAGE);
  }, [jogos, currentPage]);

  const formatDezena = (n: number) => n.toString().padStart(2, "0");

  // Converter jogos para formato de palpite para toolbar
  const palpitesParaToolbar = jogos.map((jogo, i) => ({
    id: `gerador-${i}`,
    dezenas: jogo.dezenas,
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

  const handleSelectAll = () => {
    if (selected.size === jogos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(jogos.map((_, i) => `gerador-${i}`)));
    }
  };

  const handleCopiarTodos = async () => {
    const texto = jogos
      .map((jogo, i) => `Jogo ${i + 1}: ${jogo.dezenas.map(formatDezena).join(" ")}`)
      .join("\n");
    await navigator.clipboard.writeText(texto);
    toast({
      title: "Todos copiados! 📋",
      description: `${jogos.length} palpite(s) copiado(s).`,
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

    const texto = jogos
      .filter((_, i) => selected.has(`gerador-${i}`))
      .map((jogo, i) => `Jogo ${i + 1}: ${jogo.dezenas.map(formatDezena).join(" ")}`)
      .join("\n");
    await navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado! 📋",
      description: `${selected.size} palpite(s) copiado(s).`,
    });
  };

  const handleSalvarTodos = () => {
    setSalvarTodosMode(true);
    setSelecionarSubpastaOpen(true);
  };

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

  const handleSelecionarSubpasta = async (pastaId: string) => {
    const jogosParaSalvar = salvarTodosMode 
      ? jogos 
      : jogos.filter((_, i) => selected.has(`gerador-${i}`));
    
    const getEstrategiaTexto = () => {
      if (!estrategia) return undefined;
      const partes = [];
      if ('titulo' in estrategia && estrategia.titulo) partes.push(estrategia.titulo);
      if ('resumo' in estrategia && estrategia.resumo) partes.push(estrategia.resumo);
      return partes.join(" - ") || "Estratégia IA";
    };

    const success = await salvarPalpites(
      jogosParaSalvar.map(j => ({ dezenas: j.dezenas })),
      periodoAnalise,
      pastaId,
      getEstrategiaTexto(),
      estrategia,
      "megasena"
    );

    if (success) {
      toast({
        title: "Palpites salvos! 🎉",
        description: `${jogosParaSalvar.length} palpite(s) salvo(s) na pasta.`,
      });
    }
    
    setSelecionarSubpastaOpen(false);
  };

  const handleExcluirSelecionados = () => {
    if (selected.size === 0) return;
    
    const novosJogos = jogos.filter((_, i) => !selected.has(`gerador-${i}`));
    setJogos(novosJogos);
    setSelected(new Set());
    
    const newTotalPages = Math.ceil(novosJogos.length / ITEMS_PER_PAGE);
    if (currentPage >= newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages - 1);
    }
    
    if (novosJogos.length === 0) {
      onClearAll();
      onOpenChange(false);
    }
  };

  const handleExcluirTodos = () => {
    setJogos([]);
    setSelected(new Set());
    onClearAll();
    onOpenChange(false);
  };

  const handleVerificarTodos = (_concurso: any, novosAcertos: Record<string, number>) => {
    setAcertosPorPalpite(novosAcertos);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[calc(100dvh-4rem-4rem)] p-0 overflow-y-auto z-40"
        onInteractOutside={(e) => e.preventDefault()}
        hideCloseButton
        hideOverlay
      >
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
                Palpites Mega Sena
              </SheetTitle>
              <span className="text-xs bg-megasena-primary/20 text-megasena-primary font-semibold px-2 py-1 rounded-full">
                {jogos.length} gerados
              </span>
            </div>
          </SheetHeader>
        </div>

        <div className="px-3 py-3 space-y-3">
          {estrategia && (
            <EstrategiaCard estrategia={estrategia} />
          )}

          {/* Toolbar com verificação de prêmios */}
          <PalpitesToolbar
            palpites={palpitesParaToolbar}
            selected={selected}
            onSelectAll={handleSelectAll}
            onCopiarTodos={handleCopiarTodos}
            onCopiarSelecionados={handleCopiarSelecionados}
            onExcluirSelecionados={handleExcluirSelecionados}
            onExcluirTodos={handleExcluirTodos}
            onVerificarTodos={handleVerificarTodos}
            onSalvarTodos={handleSalvarTodos}
            onSalvarSelecionados={handleSalvarSelecionados}
            hideEstrategias
            loteria="megasena"
          />

          {/* Lista de Palpites */}
          <div className="grid gap-2">
            {jogosPaginados.map((jogo, localIndex) => {
              const globalIndex = currentPage * ITEMS_PER_PAGE + localIndex;
              const id = `gerador-${globalIndex}`;
              return (
                <JogoCardMegaSena
                  key={globalIndex}
                  index={globalIndex}
                  dezenas={jogo.dezenas}
                  dezenasFixes={dezenasFixes}
                  isSelected={selected.has(id)}
                  onSelectChange={(checked) => handleSelectChange(globalIndex, checked)}
                  acertos={acertosPorPalpite[id]}
                  ultimoConcursoDezenas={ultimoConcursoDezenas}
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

          <div className="h-8" />
        </div>
      </SheetContent>

      <SelecionarSubpastaDialog
        open={selecionarSubpastaOpen}
        onOpenChange={setSelecionarSubpastaOpen}
        onSelect={handleSelecionarSubpasta}
        loteria="megasena"
        isLoading={isSaving}
      />
    </Sheet>
  );
}
