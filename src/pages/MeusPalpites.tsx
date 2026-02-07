import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { PalpiteCard } from "@/components/shared/PalpiteCard";
import { PastaItem } from "@/components/palpites/PastaItem";
import { NovaPastaDialog } from "@/components/palpites/NovaPastaDialog";
import { formatarDezena } from "@/lib/lotofacil";
import { 
  Trash2, 
  Dices,
  FolderPlus,
  Folder,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function MeusPalpites() {
  const { 
    buscarPalpites, 
    buscarPastas,
    excluirPalpite, 
    excluirVarios,
    criarPasta,
    renomearPasta,
    excluirPasta,
    isLoading 
  } = usePalpitesSalvos();
  
  const [palpites, setPalpites] = useState<PalpiteSalvo[]>([]);
  const [pastas, setPastas] = useState<PalpitePasta[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedPastas, setExpandedPastas] = useState<Set<string>>(new Set(["sem-pasta"]));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [palpiteToDelete, setPalpiteToDelete] = useState<string | null>(null);
  const [novaPastaOpen, setNovaPastaOpen] = useState(false);
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

  // Agrupar palpites por pasta
  const palpitesPorPasta = useMemo(() => {
    const grouped: Record<string, PalpiteSalvo[]> = { "sem-pasta": [] };
    
    pastas.forEach(p => {
      grouped[p.id] = [];
    });
    
    palpites.forEach(palpite => {
      const key = palpite.pasta_id || "sem-pasta";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(palpite);
    });
    
    return grouped;
  }, [palpites, pastas]);

  const handleTogglePasta = (pastaId: string) => {
    const newExpanded = new Set(expandedPastas);
    if (newExpanded.has(pastaId)) {
      newExpanded.delete(pastaId);
    } else {
      newExpanded.add(pastaId);
    }
    setExpandedPastas(newExpanded);
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.size === palpites.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(palpites.map(p => p.id)));
    }
  };

  const handleCopiar = async (palpite: PalpiteSalvo) => {
    const texto = palpite.dezenas.map(formatarDezena).join(" ");
    await navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado! 📋",
      description: "Dezenas copiadas para a área de transferência.",
    });
  };

  const handleDelete = async (id: string) => {
    const success = await excluirPalpite(id);
    if (success) {
      setPalpites(prev => prev.filter(p => p.id !== id));
      setSelected(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
    setPalpiteToDelete(null);
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
      setExpandedPastas(prev => new Set([...prev, pasta.id]));
    }
    setNovaPastaOpen(false);
  };

  const handleRenomearPasta = async (id: string, nome: string) => {
    const success = await renomearPasta(id, nome);
    if (success) {
      setPastas(prev => prev.map(p => p.id === id ? { ...p, nome } : p));
    }
  };

  const handleExcluirPasta = async (id: string) => {
    const success = await excluirPasta(id);
    if (success) {
      setPastas(prev => prev.filter(p => p.id !== id));
      setPalpites(prev => prev.map(p => p.pasta_id === id ? { ...p, pasta_id: null } : p));
    }
  };

  const renderPalpiteCard = (palpite: PalpiteSalvo, index: number) => (
    <PalpiteCard
      key={palpite.id}
      index={index}
      dezenas={palpite.dezenas}
      isSelected={selected.has(palpite.id)}
      onSelectChange={() => handleToggleSelect(palpite.id)}
      onDelete={() => setPalpiteToDelete(palpite.id)}
      onCopy={() => handleCopiar(palpite)}
      createdAt={palpite.created_at}
      acertos={palpite.conferido ? palpite.acertos : undefined}
      label={palpite.estrategia ? `🎯 ${palpite.estrategia}` : undefined}
      hideStats
    />
  );

  return (
    <MainLayout>
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {/* Header Fixo */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Dices className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-lg font-bold">Meus Palpites</h1>
                  <p className="text-xs text-muted-foreground">
                    {palpites.length} palpite{palpites.length !== 1 ? "s" : ""} salvo{palpites.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNovaPastaOpen(true)}
                className="gap-2 h-9"
              >
                <FolderPlus className="h-4 w-4" />
                Nova Pasta
              </Button>
            </div>

            {/* Barra de ações em massa */}
            {palpites.length > 0 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <Button
                  variant={selected.size === palpites.length ? "default" : "ghost"}
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-sm h-8"
                >
                  {selected.size === palpites.length ? "Desmarcar todos" : "Selecionar todos"}
                </Button>
                
                {selected.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="h-8 gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir {selected.size}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo Principal - Full Width */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading */}
          {isLoading && (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          )}

          {/* Lista vazia */}
          {!isLoading && palpites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Dices className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Nenhum palpite salvo</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Gere palpites e salve seus favoritos para acessar aqui
              </p>
              <Link to="/gerador">
                <Button className="gap-2">
                  <Dices className="h-5 w-5" />
                  Ir para o Gerador
                </Button>
              </Link>
            </div>
          )}

          {/* Pastas e palpites */}
          {!isLoading && palpites.length > 0 && (
            <div className="divide-y">
              {/* Pastas com palpites */}
              {pastas.map((pasta) => {
                const palpitesDaPasta = palpitesPorPasta[pasta.id] || [];
                if (palpitesDaPasta.length === 0 && pastas.length > 3) return null;
                
                const isExpanded = expandedPastas.has(pasta.id);
                
                return (
                  <div key={pasta.id} className="bg-background">
                    <PastaItem
                      pasta={{ ...pasta, count: palpitesDaPasta.length }}
                      isExpanded={isExpanded}
                      onToggle={() => handleTogglePasta(pasta.id)}
                      onRename={(nome) => handleRenomearPasta(pasta.id, nome)}
                      onDelete={() => handleExcluirPasta(pasta.id)}
                    >
                      {palpitesDaPasta.length > 0 ? (
                        <div className="space-y-2 pb-2">
                          {palpitesDaPasta.map((palpite, idx) => renderPalpiteCard(palpite, idx))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                          Pasta vazia
                        </p>
                      )}
                    </PastaItem>
                  </div>
                );
              })}

              {/* Palpites sem pasta */}
              {palpitesPorPasta["sem-pasta"]?.length > 0 && (
                <div className="bg-background">
                  <button
                    onClick={() => handleTogglePasta("sem-pasta")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    {expandedPastas.has("sem-pasta") ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Folder className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1 font-medium">Sem pasta</span>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {palpitesPorPasta["sem-pasta"].length}
                    </span>
                  </button>
                  
                  {expandedPastas.has("sem-pasta") && (
                    <div className="px-4 pb-4 space-y-2">
                      {palpitesPorPasta["sem-pasta"].map((palpite, idx) => 
                        renderPalpiteCard(palpite, idx)
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog Nova Pasta */}
      <NovaPastaDialog
        open={novaPastaOpen}
        onOpenChange={setNovaPastaOpen}
        onConfirm={handleCriarPasta}
        isLoading={isLoading}
      />

      {/* Dialog de confirmação - Excluir único */}
      <AlertDialog open={!!palpiteToDelete} onOpenChange={() => setPalpiteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir palpite?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => palpiteToDelete && handleDelete(palpiteToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
