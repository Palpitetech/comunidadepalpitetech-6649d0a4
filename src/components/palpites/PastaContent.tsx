import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PalpiteCard } from "@/components/shared/PalpiteCard";
import { JogoCardMegaSena } from "@/components/megasena/JogoCardMegaSena";
import { JogoCardDuplaSena } from "@/components/duplasena/JogoCardDuplaSena";
import { EstrategiaCard } from "@/components/gerador/EstrategiaCard";
import { EstrategiaCardMegaSena } from "@/components/megasena/EstrategiaCardMegaSena";
import { PalpitesToolbar } from "./PalpitesToolbar";
import { PalpitesToolbarDuplaSena } from "@/components/duplasena/PalpitesToolbarDuplaSena";
import { formatarDezena } from "@/lib/lotofacil";
import { useToast } from "@/hooks/use-toast";
import { usePalpitesSalvos, type PalpiteSalvo } from "@/hooks/usePalpitesSalvos";
import { supabase } from "@/integrations/supabase/client";
import { 
  ChevronLeft, 
  ChevronRight,
  Dices
} from "lucide-react";

interface PastaContentProps {
  pastaNome: string;
  pastaCor: string;
  palpites: PalpiteSalvo[];
  onPalpitesChange: (palpites: PalpiteSalvo[]) => void;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 12;

export function PastaContent({
  pastaNome,
  pastaCor,
  palpites: palpitesIniciais,
  onPalpitesChange,
  onClose,
}: PastaContentProps) {
  const { toast } = useToast();
  const { excluirPalpite, excluirVarios } = usePalpitesSalvos();
  const [palpites, setPalpites] = useState<PalpiteSalvo[]>(palpitesIniciais);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [ultimoConcursoDezenas, setUltimoConcursoDezenas] = useState<number[]>([]);
  const [acertosPorPalpite, setAcertosPorPalpite] = useState<Record<string, number>>({});
  const [acertosDuplaSena, setAcertosDuplaSena] = useState<Record<string, { s1: number; s2: number }>>({});
  const [estrategiaSelecionada, setEstrategiaSelecionada] = useState<string | null>(null);
  
  // Estados para a visualização de estratégia
  const [selectedEstrategia, setSelectedEstrategia] = useState<Set<string>>(new Set());
  const [acertosPorEstrategia, setAcertosPorEstrategia] = useState<Record<string, number>>({});
  const [acertosDuplaSenaEstrategia, setAcertosDuplaSenaEstrategia] = useState<Record<string, { s1: number; s2: number }>>({});

  // Sincronizar palpites quando props mudam
  useEffect(() => {
    setPalpites(palpitesIniciais);
    setSelected(new Set());
    setCurrentPage(0);
    setAcertosPorPalpite({});
    setAcertosDuplaSena({});
    setEstrategiaSelecionada(null);
    setSelectedEstrategia(new Set());
    setAcertosPorEstrategia({});
    setAcertosDuplaSenaEstrategia({});
  }, [palpitesIniciais]);

  // Detectar loteria predominante
  const loteriaAtual = useMemo(() => {
    if (palpites.length === 0) return "lotofacil";
    return palpites[0]?.loteria || "lotofacil";
  }, [palpites]);

  const isMegaSena = loteriaAtual === "megasena";
  const isDuplaSena = loteriaAtual === "duplasena";

  // Buscar último concurso baseado na loteria
  useEffect(() => {
    const fetchUltimoConcurso = async () => {
      if (isDuplaSena) {
        // Dupla Sena: combina S1 e S2
        const { data } = await supabase
          .from("resultados_duplasena")
          .select("dezenas_sorteio1, dezenas_sorteio2")
          .order("concurso_id", { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          const combined = [...(data.dezenas_sorteio1 || []), ...(data.dezenas_sorteio2 || [])];
          setUltimoConcursoDezenas([...new Set(combined)]);
        }
      } else {
        const tabela = isMegaSena ? "resultados_megasena" : "resultados";
        const { data } = await supabase
          .from(tabela)
          .select("dezenas")
          .order("concurso_id", { ascending: false })
          .limit(1)
          .single();
        
        if (data?.dezenas) {
          setUltimoConcursoDezenas(data.dezenas);
        }
      }
    };
    fetchUltimoConcurso();
  }, [isMegaSena, isDuplaSena]);

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
        onClose();
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
      onClose();
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
        onClose();
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

  const handleVerificarTodosDuplaSena = (_concurso: any, novosAcertos: Record<string, { s1: number; s2: number }>) => {
    setAcertosDuplaSena(novosAcertos);
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
        onClose();
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
        onClose();
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
        onClose();
      }
    }
  };

  const handleVerificarTodosEstrategia = (_concurso: any, novosAcertos: Record<string, number>) => {
    setAcertosPorEstrategia(novosAcertos);
  };

  const handleVerificarTodosEstrategiaDuplaSena = (_concurso: any, novosAcertos: Record<string, { s1: number; s2: number }>) => {
    setAcertosDuplaSenaEstrategia(novosAcertos);
  };

  // Helper para obter acertos da Dupla Sena (maior entre S1 e S2)
  const getAcertosDuplaSena = (id: string, source: 'main' | 'estrategia' = 'main'): number | undefined => {
    const acertos = source === 'estrategia' ? acertosDuplaSenaEstrategia[id] : acertosDuplaSena[id];
    if (!acertos) return undefined;
    return Math.max(acertos.s1, acertos.s2);
  };

  // Helper para obter estilo de cor baseado na loteria
  const getLoteriaColorClass = () => {
    if (isMegaSena) return { bg: "bg-megasena-primary", border: "border-megasena-primary", text: "text-megasena-primary" };
    if (isDuplaSena) return { bg: "bg-duplasena-primary", border: "border-duplasena-primary", text: "text-duplasena-primary" };
    return { bg: "bg-primary", border: "border-primary", text: "text-primary" };
  };

  const loteriaColors = getLoteriaColorClass();

  // Se estratégia está selecionada, mostrar conteúdo da estratégia
  if (estrategiaSelecionada) {
    return (
      <div className="px-3 py-3 space-y-3">
        {/* Card da Estratégia Completa - usa o card correto baseado na loteria */}
        {palpitesDaEstrategia[0]?.estrategia_data ? (
          isMegaSena && 'dezenas_justificadas' in palpitesDaEstrategia[0].estrategia_data ? (
            <EstrategiaCardMegaSena estrategia={palpitesDaEstrategia[0].estrategia_data as any} />
          ) : !isMegaSena && !isDuplaSena && 'dezenas_fixas' in palpitesDaEstrategia[0].estrategia_data ? (
            <EstrategiaCard estrategia={palpitesDaEstrategia[0].estrategia_data} />
          ) : (
            <div className={`${loteriaColors.bg}/5 border-${loteriaColors.border}/20 border rounded-xl p-4`}>
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-full ${loteriaColors.bg}/10 flex items-center justify-center shrink-0`}>
                  <Dices className={`h-5 w-5 ${loteriaColors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-base mb-1">
                    {estrategiaSelecionada}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Estratégia: {palpitesDaEstrategia.length} jogo{palpitesDaEstrategia.length !== 1 ? "s" : ""} salvos.
                  </p>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className={`${isMegaSena ? "bg-megasena-primary/5 border-megasena-primary/20" : isDuplaSena ? "bg-duplasena-primary/5 border-duplasena-primary/20" : "bg-primary/5 border-primary/20"} border rounded-xl p-4`}>
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-full ${isMegaSena ? "bg-megasena-primary/10" : isDuplaSena ? "bg-duplasena-primary/10" : "bg-primary/10"} flex items-center justify-center shrink-0`}>
                <Dices className={`h-5 w-5 ${isMegaSena ? "text-megasena-primary" : isDuplaSena ? "text-duplasena-primary" : "text-primary"}`} />
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

        {/* Toolbar para palpites da estratégia - usa toolbar correta baseada na loteria */}
        {isDuplaSena ? (
          <PalpitesToolbarDuplaSena
            palpites={palpitesDaEstrategia}
            selected={selectedEstrategia}
            onSelectAll={handleSelectAllEstrategia}
            onCopiarTodos={handleCopiarTodosEstrategia}
            onCopiarSelecionados={handleCopiarSelecionadosEstrategia}
            onExcluirSelecionados={handleExcluirSelecionadosEstrategia}
            onExcluirTodos={handleExcluirTodosEstrategia}
            onVerificarTodos={handleVerificarTodosEstrategiaDuplaSena}
          />
        ) : (
          <PalpitesToolbar
            palpites={palpitesDaEstrategia}
            selected={selectedEstrategia}
            onSelectAll={handleSelectAllEstrategia}
            onCopiarTodos={handleCopiarTodosEstrategia}
            onCopiarSelecionados={handleCopiarSelecionadosEstrategia}
            onExcluirSelecionados={handleExcluirSelecionadosEstrategia}
            onExcluirTodos={handleExcluirTodosEstrategia}
            onVerificarTodos={handleVerificarTodosEstrategia}
            loteria={isMegaSena ? "megasena" : "lotofacil"}
          />
        )}

        {/* Lista de Palpites da estratégia - usa o card correto baseado na loteria */}
        <div className="grid gap-2">
          {palpitesDaEstrategia.map((palpite, localIndex) => {
            if (isMegaSena) {
              return (
                <JogoCardMegaSena
                  key={palpite.id}
                  index={localIndex}
                  dezenas={palpite.dezenas}
                  isSelected={selectedEstrategia.has(palpite.id)}
                  onSelectChange={(checked) => handleSelectChangeEstrategia(palpite.id, checked)}
                  acertos={acertosPorEstrategia[palpite.id] ?? (palpite.conferido ? palpite.acertos : undefined)}
                  ultimoConcursoDezenas={ultimoConcursoDezenas}
                />
              );
            }
            
            if (isDuplaSena) {
              return (
                <JogoCardDuplaSena
                  key={palpite.id}
                  index={localIndex}
                  dezenas={palpite.dezenas}
                  isSelected={selectedEstrategia.has(palpite.id)}
                  onSelectChange={(checked) => handleSelectChangeEstrategia(palpite.id, checked)}
                  onDelete={() => handleDeleteSingleEstrategia(palpite.id)}
                  acertos={getAcertosDuplaSena(palpite.id, 'estrategia') ?? (palpite.conferido ? palpite.acertos : undefined)}
                  ultimoConcursoDezenas={ultimoConcursoDezenas}
                />
              );
            }
            
            return (
              <PalpiteCard
                key={palpite.id}
                index={localIndex}
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
            );
          })}
        </div>

        {/* Botão voltar para pasta */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setEstrategiaSelecionada(null)}
            className="w-full"
          >
            Voltar para {pastaNome}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 space-y-3">
      {/* Toolbar Universal - usa toolbar correta baseada na loteria */}
      {isDuplaSena ? (
        <PalpitesToolbarDuplaSena
          palpites={palpites}
          selected={selected}
          onSelectAll={handleSelectAll}
          onCopiarTodos={handleCopiarTodos}
          onCopiarSelecionados={handleCopiarSelecionados}
          onExcluirSelecionados={handleExcluirSelecionados}
          onExcluirTodos={handleExcluirTodos}
          onVerificarTodos={handleVerificarTodosDuplaSena}
        />
      ) : (
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
          loteria={isMegaSena ? "megasena" : "lotofacil"}
        />
      )}

      {/* Lista de Palpites - usa o card correto baseado na loteria */}
      <div className="grid gap-2">
        {palpitesPaginados.map((palpite, localIndex) => {
          const globalIndex = currentPage * ITEMS_PER_PAGE + localIndex;
          
          if (isMegaSena) {
            return (
              <JogoCardMegaSena
                key={palpite.id}
                index={globalIndex}
                dezenas={palpite.dezenas}
                isSelected={selected.has(palpite.id)}
                onSelectChange={(checked) => handleSelectChange(palpite.id, checked)}
                acertos={acertosPorPalpite[palpite.id] ?? (palpite.conferido ? palpite.acertos : undefined)}
                ultimoConcursoDezenas={ultimoConcursoDezenas}
              />
            );
          }
          
          if (isDuplaSena) {
            return (
              <JogoCardDuplaSena
                key={palpite.id}
                index={globalIndex}
                dezenas={palpite.dezenas}
                isSelected={selected.has(palpite.id)}
                onSelectChange={(checked) => handleSelectChange(palpite.id, checked)}
                onDelete={() => handleDeleteSingle(palpite.id)}
                acertos={getAcertosDuplaSena(palpite.id) ?? (palpite.conferido ? palpite.acertos : undefined)}
                ultimoConcursoDezenas={ultimoConcursoDezenas}
              />
            );
          }
          
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
  );
}
