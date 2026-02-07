import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PalpiteCard } from "@/components/shared/PalpiteCard";
import { EstrategiaCard } from "@/components/gerador/EstrategiaCard";
import { PalpitesToolbar } from "./PalpitesToolbar";
import { formatarDezena } from "@/lib/lotofacil";
import { useToast } from "@/hooks/use-toast";
import { usePalpitesSalvos, type PalpiteSalvo } from "@/hooks/usePalpitesSalvos";
import { supabase } from "@/integrations/supabase/client";
import { 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Folder,
  Dices
} from "lucide-react";

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
  const [acertosPorPalpite, setAcertosPorPalpite] = useState<Record<string, number>>({});
  const [estrategiaSelecionada, setEstrategiaSelecionada] = useState<string | null>(null);
  
  // Estados para a visualização de estratégia
  const [selectedEstrategia, setSelectedEstrategia] = useState<Set<string>>(new Set());
  const [acertosPorEstrategia, setAcertosPorEstrategia] = useState<Record<string, number>>({});

  // Sincronizar palpites quando props mudam
  useEffect(() => {
    setPalpites(palpitesIniciais);
    setSelected(new Set());
    setCurrentPage(0);
    setAcertosPorPalpite({});
    setEstrategiaSelecionada(null);
    setSelectedEstrategia(new Set());
    setAcertosPorEstrategia({});
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

  // Palpites filtrados por estratégia selecionada
  const palpitesDaEstrategia = useMemo(() => {
    if (!estrategiaSelecionada) return [];
    return palpites.filter(p => p.estrategia === estrategiaSelecionada);
  }, [palpites, estrategiaSelecionada]);

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

  const handleExcluirTodos = async () => {
    if (palpites.length === 0) return;
    
    const ids = palpites.map(p => p.id);
    const success = await excluirVarios(ids);
    if (success) {
      setPalpites([]);
      onPalpitesChange([]);
      setSelected(new Set());
      onOpenChange(false);
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

  const handleVerificarTodos = (_concurso: any, novosAcertos: Record<string, number>) => {
    setAcertosPorPalpite(novosAcertos);
  };

  // ========== Handlers para a visualização de estratégia ==========
  
  const handleSelectChangeEstrategia = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedEstrategia);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedEstrategia(newSelected);
  };

  const handleSelectAllEstrategia = () => {
    if (selectedEstrategia.size === palpitesDaEstrategia.length) {
      setSelectedEstrategia(new Set());
    } else {
      setSelectedEstrategia(new Set(palpitesDaEstrategia.map((p) => p.id)));
    }
  };

  const handleCopiarTodosEstrategia = async () => {
    const texto = palpitesDaEstrategia.map((p, i) => formatPalpiteParaCopia(p, i)).join("\n");
    await navigator.clipboard.writeText(texto);
    toast({
      title: "Todos copiados! 📋",
      description: `${palpitesDaEstrategia.length} palpite(s) copiado(s).`,
    });
  };

  const handleCopiarSelecionadosEstrategia = async () => {
    if (selectedEstrategia.size === 0) {
      toast({
        title: "Nenhum palpite selecionado",
        description: "Selecione pelo menos um palpite para copiar.",
        variant: "destructive",
      });
      return;
    }

    const texto = palpitesDaEstrategia
      .filter((p) => selectedEstrategia.has(p.id))
      .map((palpite, i) => formatPalpiteParaCopia(palpite, i))
      .join("\n");

    await navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado! 📋",
      description: `${selectedEstrategia.size} palpite(s) copiado(s).`,
    });
  };

  const handleExcluirSelecionadosEstrategia = async () => {
    if (selectedEstrategia.size === 0) return;
    
    const success = await excluirVarios(Array.from(selectedEstrategia));
    if (success) {
      const novosPalpites = palpites.filter((p) => !selectedEstrategia.has(p.id));
      setPalpites(novosPalpites);
      onPalpitesChange(novosPalpites);
      setSelectedEstrategia(new Set());
      
      // Fechar se não houver mais palpites da estratégia
      const restantes = novosPalpites.filter(p => p.estrategia === estrategiaSelecionada);
      if (restantes.length === 0) {
        setEstrategiaSelecionada(null);
      }
      
      if (novosPalpites.length === 0) {
        onOpenChange(false);
      }
    }
  };

  const handleExcluirTodosEstrategia = async () => {
    if (palpitesDaEstrategia.length === 0) return;
    
    const ids = palpitesDaEstrategia.map(p => p.id);
    const success = await excluirVarios(ids);
    if (success) {
      const novosPalpites = palpites.filter((p) => p.estrategia !== estrategiaSelecionada);
      setPalpites(novosPalpites);
      onPalpitesChange(novosPalpites);
      setSelectedEstrategia(new Set());
      setEstrategiaSelecionada(null);
      
      if (novosPalpites.length === 0) {
        onOpenChange(false);
      }
    }
  };

  const handleDeleteSingleEstrategia = async (id: string) => {
    const success = await excluirPalpite(id);
    if (success) {
      const novosPalpites = palpites.filter((p) => p.id !== id);
      setPalpites(novosPalpites);
      onPalpitesChange(novosPalpites);
      
      const newSelected = new Set(selectedEstrategia);
      newSelected.delete(id);
      setSelectedEstrategia(newSelected);
      
      // Fechar se não houver mais palpites da estratégia
      const restantes = novosPalpites.filter(p => p.estrategia === estrategiaSelecionada);
      if (restantes.length === 0) {
        setEstrategiaSelecionada(null);
      }
      
      if (novosPalpites.length === 0) {
        onOpenChange(false);
      }
    }
  };

  const handleVerificarTodosEstrategia = (_concurso: any, novosAcertos: Record<string, number>) => {
    setAcertosPorEstrategia(novosAcertos);
  };

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
          {/* Toolbar Universal */}
          <PalpitesToolbar
            palpites={palpites}
            selected={selected}
            onSelectAll={handleSelectAll}
            onCopiarTodos={handleCopiarTodos}
            onCopiarSelecionados={handleCopiarSelecionados}
            onExcluirSelecionados={handleExcluirSelecionados}
            onExcluirTodos={handleExcluirTodos}
            onVerificarTodos={handleVerificarTodos}
            onEstrategiaClick={setEstrategiaSelecionada}
          />

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

      {/* Sheet Fullscreen da Estratégia */}
      <Sheet 
        open={!!estrategiaSelecionada} 
        onOpenChange={(open) => !open && setEstrategiaSelecionada(null)}
      >
        <SheetContent 
          side="bottom" 
          className="h-[100dvh] p-0 overflow-y-auto z-[60]"
          onInteractOutside={(e) => e.preventDefault()}
          hideCloseButton
          hideOverlay
        >
          <div className="sticky top-0 z-10 bg-background border-b">
            <SheetHeader className="px-4 py-3 flex-row items-center gap-3">
              <button
                onClick={() => setEstrategiaSelecionada(null)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Dices className="h-5 w-5 text-primary" />
              <SheetTitle className="text-lg font-bold truncate flex-1">
                {estrategiaSelecionada}
              </SheetTitle>
              <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-full">
                {palpitesDaEstrategia.length} palpite{palpitesDaEstrategia.length !== 1 ? "s" : ""}
              </span>
            </SheetHeader>
          </div>

          <div className="px-3 py-3 space-y-3">
            {/* Card da Estratégia Completa */}
            {palpitesDaEstrategia[0]?.estrategia_data ? (
              <EstrategiaCard estrategia={palpitesDaEstrategia[0].estrategia_data} />
            ) : (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Dices className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-base mb-1">
                      {estrategiaSelecionada}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Estratégia utilizada para gerar {palpitesDaEstrategia.length} palpite{palpitesDaEstrategia.length !== 1 ? "s" : ""} nesta pasta.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Toolbar para palpites da estratégia */}
            <PalpitesToolbar
              palpites={palpitesDaEstrategia}
              selected={selectedEstrategia}
              onSelectAll={handleSelectAllEstrategia}
              onCopiarTodos={handleCopiarTodosEstrategia}
              onCopiarSelecionados={handleCopiarSelecionadosEstrategia}
              onExcluirSelecionados={handleExcluirSelecionadosEstrategia}
              onExcluirTodos={handleExcluirTodosEstrategia}
              onVerificarTodos={handleVerificarTodosEstrategia}
              hideEstrategias
            />

            {/* Lista de Palpites */}
            <div className="space-y-2">
              {palpitesDaEstrategia.map((palpite, idx) => (
                <PalpiteCard
                  key={palpite.id}
                  index={idx}
                  dezenas={palpite.dezenas}
                  ultimoConcursoDezenas={ultimoConcursoDezenas}
                  isSelected={selectedEstrategia.has(palpite.id)}
                  onSelectChange={(checked) => handleSelectChangeEstrategia(palpite.id, checked)}
                  onDelete={() => handleDeleteSingleEstrategia(palpite.id)}
                  onCopy={() => handleCopySingle(palpite)}
                  createdAt={palpite.created_at}
                  acertos={acertosPorEstrategia[palpite.id] ?? (palpite.conferido ? palpite.acertos : undefined)}
                  hideVerificar
                />
              ))}
            </div>
            <div className="h-8" />
          </div>
        </SheetContent>
      </Sheet>
    </Sheet>
  );
}
