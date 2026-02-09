import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EstrategiaCard, type EstrategiaData } from "@/components/gerador/EstrategiaCard";
import { useToast } from "@/hooks/use-toast";
import { usePalpitesSalvos, type PalpitePasta } from "@/hooks/usePalpitesSalvos";
import { NovaPastaDialog } from "@/components/palpites/NovaPastaDialog";
import { SelecionarPastaDialog } from "@/components/palpites/SelecionarPastaDialog";
import { JogoCardDuplaSena } from "@/components/duplasena/JogoCardDuplaSena";
import { PalpitesToolbarDuplaSena } from "@/components/duplasena/PalpitesToolbarDuplaSena";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [acertosPorPalpite, setAcertosPorPalpite] = useState<Record<string, { s1: number; s2: number }>>({});
  
  const [pastas, setPastas] = useState<PalpitePasta[]>([]);
  const [selecionarPastaOpen, setSelecionarPastaOpen] = useState(false);
  const [novaPastaOpen, setNovaPastaOpen] = useState(false);
  const [salvarTodosMode, setSalvarTodosMode] = useState(false);

  useEffect(() => {
    setJogos(jogosIniciais);
    setSelected(new Set());
    setCurrentPage(0);
    setAcertosPorPalpite({});
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

    const indices = Array.from(selected)
      .map(id => parseInt(id.replace('gerador-', '')))
      .sort((a, b) => a - b);

    const texto = indices
      .map((i) => `Jogo ${i + 1}: ${jogos[i].dezenas.map(formatDezena).join(" ")}`)
      .join("\n");

    await navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado! 📋",
      description: `${selected.size} palpite(s) copiado(s).`,
    });
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
    setSelecionarPastaOpen(true);
  };

  const handleSalvarTodos = () => {
    setSalvarTodosMode(true);
    setSelecionarPastaOpen(true);
  };

  const handleSelecionarPasta = async (pastaId: string | null) => {
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

  const handleConfirmarNovaPasta = async (nome: string, cor: string, loteria: string) => {
    const novaPasta = await criarPasta(nome, cor, loteria);
    if (novaPasta) {
      setPastas(prev => [...prev, novaPasta]);
      
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

  const handleVerificarTodos = (concurso: any, acertos: Record<string, { s1: number; s2: number }>) => {
    setAcertosPorPalpite(acertos);
  };

  // Obter acertos para um jogo específico (maior entre S1 e S2)
  const getAcertosJogo = (index: number): number | null => {
    const id = `gerador-${index}`;
    const acertos = acertosPorPalpite[id];
    if (!acertos) return null;
    return Math.max(acertos.s1, acertos.s2);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[100dvh] bottom-0 p-0 overflow-y-auto z-50"
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

          {/* Toolbar universal */}
          <PalpitesToolbarDuplaSena
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
          />

          {/* Lista de Palpites */}
          <div className="grid gap-2">
            {jogosPaginados.map((jogo, localIndex) => {
              const globalIndex = currentPage * ITEMS_PER_PAGE + localIndex;
              return (
                <JogoCardDuplaSena
                  key={globalIndex}
                  index={globalIndex}
                  dezenas={jogo.dezenas}
                  dezenasFixes={dezenasFixes}
                  ultimoConcursoDezenas={ultimoConcursoDezenas}
                  isSelected={selected.has(`gerador-${globalIndex}`)}
                  onSelectChange={(checked) => handleSelectChange(globalIndex, checked)}
                  onDelete={() => handleDeleteSingle(globalIndex)}
                  showPatterns={true}
                  acertos={getAcertosJogo(globalIndex)}
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

      <SelecionarPastaDialog
        open={selecionarPastaOpen}
        onOpenChange={setSelecionarPastaOpen}
        pastas={pastas.map(p => ({ id: p.id, nome: p.nome, cor: p.cor }))}
        onSelect={handleSelecionarPasta}
        onNovaPasta={handleCriarNovaPasta}
        loteria="duplasena"
        isLoading={isSaving}
      />

      <NovaPastaDialog
        open={novaPastaOpen}
        onOpenChange={setNovaPastaOpen}
        onConfirm={handleConfirmarNovaPasta}
        loteria="duplasena"
        isLoading={isSaving}
      />
    </Sheet>
  );
}
