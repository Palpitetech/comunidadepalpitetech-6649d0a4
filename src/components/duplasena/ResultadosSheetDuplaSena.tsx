import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EstrategiaCard, type EstrategiaData } from "@/components/gerador/EstrategiaCard";
import { useToast } from "@/hooks/use-toast";
import { usePalpitesSalvos, type PalpitePasta } from "@/hooks/usePalpitesSalvos";
import { NovaPastaDialog } from "@/components/palpites/NovaPastaDialog";
import { SelecionarPastaDialog } from "@/components/palpites/SelecionarPastaDialog";
import { ChevronLeft, ChevronRight, ArrowLeft, Check, Copy, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface JogoGerado {
  dezenas: number[];
}

interface ResultadosSheetDuplaSenaProps {
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

export function ResultadosSheetDuplaSena({
  open,
  onOpenChange,
  jogos: jogosIniciais,
  ultimoConcursoDezenas = [],
  onClearAll,
  estrategia,
  periodoAnalise,
  dezenasFixes = [],
}: ResultadosSheetDuplaSenaProps) {
  const { toast } = useToast();
  const { salvarPalpites, buscarPastas, criarPasta, isLoading: isSaving } = usePalpitesSalvos();
  const [jogos, setJogos] = useState<JogoGerado[]>(jogosIniciais);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  
  const [pastas, setPastas] = useState<PalpitePasta[]>([]);
  const [selecionarPastaOpen, setSelecionarPastaOpen] = useState(false);
  const [novaPastaOpen, setNovaPastaOpen] = useState(false);
  const [salvarTodosMode, setSalvarTodosMode] = useState(false);

  useEffect(() => {
    setJogos(jogosIniciais);
    setSelected(new Set());
    setCurrentPage(0);
  }, [jogosIniciais]);

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

  const formatDezena = (n: number) => n.toString().padStart(2, "0");

  const handleSelectChange = (index: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
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

  const handleSalvarTodos = () => {
    setSalvarTodosMode(true);
    setSelecionarPastaOpen(true);
  };

  const handleSelecionarPasta = async (pastaId: string | null) => {
    const palpitesParaSalvar = salvarTodosMode ? jogos : Array.from(selected).map(i => jogos[i]);
    
    const getEstrategiaTexto = () => {
      if (!estrategia) return undefined;
      return estrategia.ferramentas.slice(0, 2).join(" + ");
    };
    
    await salvarPalpites(
      palpitesParaSalvar, 
      periodoAnalise, 
      pastaId, 
      getEstrategiaTexto(), 
      estrategia,
      "duplasena"
    );
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
      
      const palpitesParaSalvar = salvarTodosMode ? jogos : Array.from(selected).map(i => jogos[i]);
      
      const getEstrategiaTexto = () => {
        if (!estrategia) return undefined;
        return estrategia.ferramentas.slice(0, 2).join(" + ");
      };
      
      await salvarPalpites(
        palpitesParaSalvar, 
        periodoAnalise, 
        novaPasta.id, 
        getEstrategiaTexto(), 
        estrategia,
        "duplasena"
      );
    }
    setNovaPastaOpen(false);
  };

  const handleExcluirTodos = () => {
    onClearAll();
    onOpenChange(false);
  };

  const handleDeleteSingle = (index: number) => {
    const novosJogos = jogos.filter((_, i) => i !== index);
    setJogos(novosJogos);
    
    const newSelected = new Set<number>();
    selected.forEach((i) => {
      if (i < index) newSelected.add(i);
      else if (i > index) newSelected.add(i - 1);
    });
    setSelected(newSelected);
    
    if (novosJogos.length === 0) {
      onClearAll();
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[100dvh] p-0 overflow-y-auto z-50"
        onInteractOutside={(e) => e.preventDefault()}
        hideCloseButton
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
                Palpites Dupla Sena
              </SheetTitle>
              <span className="text-xs bg-duplasena-primary/20 text-duplasena-primary font-semibold px-2 py-1 rounded-full">
                {jogos.length} gerados
              </span>
            </div>
          </SheetHeader>
        </div>

        <div className="px-3 py-3 space-y-3">
          {estrategia && (
            <EstrategiaCard estrategia={estrategia} />
          )}

          {/* Toolbar simplificada */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="gap-1"
            >
              <Check className="h-4 w-4" />
              {selected.size === jogos.length ? "Desmarcar" : "Selecionar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopiarTodos}
              className="gap-1"
            >
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSalvarTodos}
              className="gap-1"
            >
              <Save className="h-4 w-4" />
              Salvar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExcluirTodos}
              className="gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Limpar
            </Button>
          </div>

          {/* Lista de Palpites */}
          <div className="grid gap-2">
            {jogosPaginados.map((jogo, localIndex) => {
              const globalIndex = currentPage * ITEMS_PER_PAGE + localIndex;
              return (
                <div
                  key={globalIndex}
                  className={cn(
                    "p-3 rounded-lg border transition-colors",
                    selected.has(globalIndex) 
                      ? "border-duplasena-primary bg-duplasena-primary/5" 
                      : "border-border"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectChange(globalIndex)}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                          selected.has(globalIndex)
                            ? "bg-duplasena-primary border-duplasena-primary text-white"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {selected.has(globalIndex) && <Check className="h-3 w-3" />}
                      </button>
                      <span className="text-sm font-medium text-muted-foreground">
                        Jogo {globalIndex + 1}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSingle(globalIndex)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {jogo.dezenas.map((dezena) => (
                      <span
                        key={dezena}
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold",
                          dezenasFixes?.includes(dezena)
                            ? "bg-foreground text-background"
                            : ultimoConcursoDezenas.includes(dezena)
                            ? "bg-duplasena-primary text-white"
                            : "bg-duplasena-primary/20 text-duplasena-primary"
                        )}
                      >
                        {formatDezena(dezena)}
                      </span>
                    ))}
                  </div>
                </div>
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

      <SelecionarPastaDialog
        open={selecionarPastaOpen}
        onOpenChange={setSelecionarPastaOpen}
        pastas={pastas.map(p => ({ id: p.id, nome: p.nome, cor: p.cor }))}
        onSelect={handleSelecionarPasta}
        onNovaPasta={handleCriarNovaPasta}
        isLoading={isSaving}
      />

      <NovaPastaDialog
        open={novaPastaOpen}
        onOpenChange={setNovaPastaOpen}
        onConfirm={handleConfirmarNovaPasta}
        isLoading={isSaving}
      />
    </Sheet>
  );
}
