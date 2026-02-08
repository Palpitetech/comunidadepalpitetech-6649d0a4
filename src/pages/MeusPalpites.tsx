import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePalpitesSalvos, type PalpiteSalvo, type PalpitePasta } from "@/hooks/usePalpitesSalvos";
import { NovaPastaDialog } from "@/components/palpites/NovaPastaDialog";
import { PastaContent } from "@/components/palpites/PastaContent";
import { 
  Dices,
  Folder,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Configuração das loterias
const LOTERIAS_CONFIG = {
  lotofacil: {
    nome: "Lotofácil",
    cor: "#8b5cf6", // roxo
    icone: "🍀"
  },
  megasena: {
    nome: "Mega Sena", 
    cor: "#22c55e", // verde
    icone: "🎱"
  }
} as const;

type LoteriaKey = keyof typeof LOTERIAS_CONFIG;

export default function MeusPalpites() {
  const isMobile = useIsMobile();
  const { 
    buscarPalpites, 
    buscarPastas,
    excluirVarios,
    criarPasta,
    excluirPasta,
    isLoading 
  } = usePalpitesSalvos();
  
  const [palpites, setPalpites] = useState<PalpiteSalvo[]>([]);
  const [pastas, setPastas] = useState<PalpitePasta[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [novaPastaOpen, setNovaPastaOpen] = useState(false);
  const [selectedPasta, setSelectedPasta] = useState<{ id: string; nome: string; cor: string; loteria?: string } | null>(null);
  const [expandedLoterias, setExpandedLoterias] = useState<Set<string>>(new Set(["lotofacil", "megasena"]));
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [palpitesData, pastasData] = await Promise.all([
      buscarPalpites(),
      buscarPastas()
    ]);
    setPalpites(palpitesData);
    setPastas(pastasData);
  };

  // Agrupar palpites por loteria e depois por pasta
  const palpitesPorLoteriaEPasta = useMemo(() => {
    const result: Record<string, {
      semPasta: PalpiteSalvo[];
      porPasta: Record<string, PalpiteSalvo[]>;
    }> = {};

    // Inicializar estrutura para cada loteria
    Object.keys(LOTERIAS_CONFIG).forEach(loteria => {
      result[loteria] = { semPasta: [], porPasta: {} };
      pastas.forEach(p => {
        result[loteria].porPasta[p.id] = [];
      });
    });

    // Distribuir palpites
    palpites.forEach(palpite => {
      const loteria = (palpite.loteria || "lotofacil") as string;
      if (!result[loteria]) {
        result[loteria] = { semPasta: [], porPasta: {} };
      }
      
      if (palpite.pasta_id) {
        if (!result[loteria].porPasta[palpite.pasta_id]) {
          result[loteria].porPasta[palpite.pasta_id] = [];
        }
        result[loteria].porPasta[palpite.pasta_id].push(palpite);
      } else {
        result[loteria].semPasta.push(palpite);
      }
    });

    return result;
  }, [palpites, pastas]);

  // Contar palpites por loteria
  const contarPorLoteria = (loteria: string) => {
    const data = palpitesPorLoteriaEPasta[loteria];
    if (!data) return 0;
    let total = data.semPasta.length;
    Object.values(data.porPasta).forEach(arr => {
      total += arr.length;
    });
    return total;
  };

  const toggleLoteria = (loteria: string) => {
    setExpandedLoterias(prev => {
      const next = new Set(prev);
      if (next.has(loteria)) {
        next.delete(loteria);
      } else {
        next.add(loteria);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    const success = await excluirVarios(Array.from(selected));
    if (success) {
      setPalpites(prev => prev.filter(p => !selected.has(p.id)));
      setSelected(new Set());
    }
    setDeleteDialogOpen(false);
  };

  const handleCriarPasta = async (nome: string, cor: string) => {
    const pasta = await criarPasta(nome, cor);
    if (pasta) {
      setPastas(prev => [...prev, pasta]);
    }
    setNovaPastaOpen(false);
  };

  const handleOpenPasta = (pasta: { id: string; nome: string; cor: string }, loteria?: string) => {
    setSelectedPasta({ ...pasta, loteria });
  };

  const handleOpenSemPasta = (loteria: string) => {
    const config = LOTERIAS_CONFIG[loteria as LoteriaKey];
    setSelectedPasta({ 
      id: `sem-pasta-${loteria}`, 
      nome: `Sem pasta`, 
      cor: config?.cor || "#6b7280",
      loteria 
    });
  };

  const handleClosePasta = () => {
    setSelectedPasta(null);
  };

  const handlePalpitesChange = (novosPalpites: PalpiteSalvo[]) => {
    if (!selectedPasta) return;
    
    const isLoteriaSemPasta = selectedPasta.id.startsWith("sem-pasta-");
    
    if (isLoteriaSemPasta) {
      const loteria = selectedPasta.loteria;
      const outrosPalpites = palpites.filter(p => 
        p.pasta_id !== null || p.loteria !== loteria
      );
      setPalpites([...outrosPalpites, ...novosPalpites]);
    } else {
      const outrosPalpites = palpites.filter(p => p.pasta_id !== selectedPasta.id);
      setPalpites([...outrosPalpites, ...novosPalpites]);
    }
    
    if (novosPalpites.length === 0) {
      setSelectedPasta(null);
    }
  };

  const handleExcluirPasta = async (id: string) => {
    const success = await excluirPasta(id);
    if (success) {
      setPastas(prev => prev.filter(p => p.id !== id));
      setPalpites(prev => prev.map(p => p.pasta_id === id ? { ...p, pasta_id: null } : p));
    }
  };

  const getPalpitesDaPasta = () => {
    if (!selectedPasta) return [];
    
    const isLoteriaSemPasta = selectedPasta.id.startsWith("sem-pasta-");
    
    if (isLoteriaSemPasta && selectedPasta.loteria) {
      return palpitesPorLoteriaEPasta[selectedPasta.loteria]?.semPasta || [];
    }
    
    // Palpites de uma pasta específica - filtrar por loteria se especificada
    if (selectedPasta.loteria) {
      return palpitesPorLoteriaEPasta[selectedPasta.loteria]?.porPasta[selectedPasta.id] || [];
    }
    
    // Fallback: todos os palpites da pasta
    return palpites.filter(p => p.pasta_id === selectedPasta.id);
  };

  // Verificar se uma pasta tem palpites de uma loteria específica
  const getPastaCountForLoteria = (pastaId: string, loteria: string) => {
    return palpitesPorLoteriaEPasta[loteria]?.porPasta[pastaId]?.length || 0;
  };

  // Determinar breadcrumb e título baseado no estado
  const pageTitle = selectedPasta ? selectedPasta.nome : "Meus Palpites";
  const breadcrumb = selectedPasta 
    ? [{ label: "Meus Palpites", onClick: handleClosePasta }]
    : undefined;

  return (
    <MainLayout 
      pageTitle={pageTitle} 
      breadcrumb={breadcrumb}
      onBack={selectedPasta ? handleClosePasta : undefined}
    >
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {/* Conteúdo da pasta selecionada */}
        {selectedPasta ? (
          <PastaContent
            pastaNome={selectedPasta.nome}
            pastaCor={selectedPasta.cor}
            palpites={getPalpitesDaPasta()}
            onPalpitesChange={handlePalpitesChange}
            onClose={handleClosePasta}
          />
        ) : (
          <>
            {/* Header Fixo - Desktop only */}
            {!isMobile && (
              <div className="sticky top-0 z-10 bg-background border-b">
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Dices className="h-7 w-7 text-primary" />
                      <div>
                        <h1 className="text-xl font-bold">Meus Palpites</h1>
                        <p className="text-sm text-muted-foreground">
                          {palpites.length} palpite{palpites.length !== 1 ? "s" : ""} • {pastas.length} pasta{pastas.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile subtitle */}
            {isMobile && palpites.length > 0 && (
              <div className="px-4 py-2 border-b">
                <p className="text-sm text-muted-foreground">
                  {palpites.length} palpite{palpites.length !== 1 ? "s" : ""} • {pastas.length} pasta{pastas.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Conteúdo Principal */}
            <div className="flex-1">
              {/* Loading */}
              {isLoading && (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              )}

              {/* Lista vazia */}
              {!isLoading && palpites.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                    <Dices className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Nenhum palpite salvo</h2>
                  <p className="text-muted-foreground mb-8 max-w-sm">
                    Gere palpites no Gerador e salve seus favoritos para acessar aqui
                  </p>
                  <Link to="/smart-gerador">
                    <Button size="lg" className="gap-2">
                      <Dices className="h-5 w-5" />
                      Ir para o Gerador
                    </Button>
                  </Link>
                </div>
              )}

              {/* Lista de Loterias */}
              {!isLoading && palpites.length > 0 && (
                <div className="divide-y">
                  {(Object.keys(LOTERIAS_CONFIG) as LoteriaKey[]).map((loteriaKey) => {
                    const config = LOTERIAS_CONFIG[loteriaKey];
                    const totalLoteria = contarPorLoteria(loteriaKey);
                    const isExpanded = expandedLoterias.has(loteriaKey);
                    const loteriaData = palpitesPorLoteriaEPasta[loteriaKey];
                    
                    if (totalLoteria === 0) return null;

                    return (
                      <Collapsible 
                        key={loteriaKey} 
                        open={isExpanded} 
                        onOpenChange={() => toggleLoteria(loteriaKey)}
                      >
                        {/* Header da Loteria */}
                        <CollapsibleTrigger className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors text-left">
                          <span className="text-2xl">{config.icone}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold" style={{ color: config.cor }}>{config.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {totalLoteria} palpite{totalLoteria !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <ChevronDown 
                            className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} 
                          />
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="pl-4 border-l-2 ml-6 mb-4" style={{ borderColor: config.cor + "40" }}>
                            {/* Pastas com palpites desta loteria */}
                            {pastas.map((pasta) => {
                              const count = getPastaCountForLoteria(pasta.id, loteriaKey);
                              if (count === 0) return null;
                              
                              return (
                                <button
                                  key={pasta.id}
                                  onClick={() => handleOpenPasta(pasta, loteriaKey)}
                                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/50 active:bg-muted/75 transition-colors text-left"
                                >
                                  <Folder className="h-5 w-5 shrink-0" style={{ color: pasta.cor }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm">{pasta.nome}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {count} palpite{count !== 1 ? "s" : ""}
                                    </p>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                </button>
                              );
                            })}

                            {/* Sem pasta desta loteria */}
                            {loteriaData?.semPasta.length > 0 && (
                              <button
                                onClick={() => handleOpenSemPasta(loteriaKey)}
                                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/50 active:bg-muted/75 transition-colors text-left"
                              >
                                <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">Sem pasta</p>
                                  <p className="text-xs text-muted-foreground">
                                    {loteriaData.semPasta.length} palpite{loteriaData.semPasta.length !== 1 ? "s" : ""}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              </button>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}

                  {/* Pastas vazias */}
                  {pastas.filter(p => {
                    let total = 0;
                    Object.keys(LOTERIAS_CONFIG).forEach(lot => {
                      total += getPastaCountForLoteria(p.id, lot);
                    });
                    return total === 0;
                  }).length > 0 && (
                    <div className="px-4 py-3 border-t">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-semibold">Pastas vazias</p>
                      <div className="space-y-2">
                        {pastas.filter(p => {
                          let total = 0;
                          Object.keys(LOTERIAS_CONFIG).forEach(lot => {
                            total += getPastaCountForLoteria(p.id, lot);
                          });
                          return total === 0;
                        }).map((pasta) => (
                          <div
                            key={pasta.id}
                            className="flex items-center justify-between py-2"
                          >
                            <div className="flex items-center gap-3">
                              <Folder className="h-5 w-5" style={{ color: pasta.cor }} />
                              <span className="text-sm text-muted-foreground">{pasta.nome}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExcluirPasta(pasta.id)}
                              className="text-xs text-destructive hover:text-destructive h-8"
                            >
                              Excluir
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Dialog Nova Pasta */}
      <NovaPastaDialog
        open={novaPastaOpen}
        onOpenChange={setNovaPastaOpen}
        onConfirm={handleCriarPasta}
        isLoading={isLoading}
      />

      {/* Dialog de confirmação - Excluir vários */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} palpite(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
