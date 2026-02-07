import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  Bookmark, 
  Trash2, 
  Dices,
  FolderPlus,
  Folder
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
      // Palpites são mantidos mas sem pasta
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
      label={palpite.estrategia ? `🎯 ${palpite.estrategia.substring(0, 20)}...` : undefined}
      hideStats
    />
  );

  return (
    <MainLayout>
      <div className="container-senior py-6 space-y-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Meus Palpites</h1>
          </div>
          <div className="flex items-center gap-2">
            {palpites.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {palpites.length} salvo{palpites.length > 1 ? "s" : ""}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNovaPastaOpen(true)}
              className="gap-1 h-8"
            >
              <FolderPlus className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Pasta</span>
            </Button>
          </div>
        </div>

        {/* Ações em massa */}
        {palpites.length > 0 && (
          <div className="flex items-center justify-between py-2">
            <Button
              variant={selected.size === palpites.length ? "default" : "outline"}
              size="sm"
              onClick={handleSelectAll}
              className="text-xs h-8"
            >
              {selected.size === palpites.length ? "Desmarcar todos" : "Selecionar todos"}
            </Button>
            
            {selected.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-xs h-8 gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir ({selected.size})
              </Button>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Lista vazia */}
        {!isLoading && palpites.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Dices className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Nenhum palpite salvo</p>
                <p className="text-sm text-muted-foreground">
                  Gere palpites e salve seus favoritos
                </p>
              </div>
              <Link to="/gerador">
                <Button size="sm" className="gap-2">
                  <Dices className="h-4 w-4" />
                  Ir para o Gerador
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Pastas e palpites */}
        {!isLoading && palpites.length > 0 && (
          <div className="space-y-3">
            {/* Pastas com palpites */}
            {pastas.map((pasta) => {
              const palpitesDaPasta = palpitesPorPasta[pasta.id] || [];
              if (palpitesDaPasta.length === 0) return null;
              
              return (
                <PastaItem
                  key={pasta.id}
                  pasta={{ ...pasta, count: palpitesDaPasta.length }}
                  isExpanded={expandedPastas.has(pasta.id)}
                  onToggle={() => handleTogglePasta(pasta.id)}
                  onRename={(nome) => handleRenomearPasta(pasta.id, nome)}
                  onDelete={() => handleExcluirPasta(pasta.id)}
                >
                  <div className="space-y-2">
                    {palpitesDaPasta.map((palpite, idx) => renderPalpiteCard(palpite, idx))}
                  </div>
                </PastaItem>
              );
            })}

            {/* Pastas vazias */}
            {pastas.filter(p => (palpitesPorPasta[p.id] || []).length === 0).map((pasta) => (
              <PastaItem
                key={pasta.id}
                pasta={{ ...pasta, count: 0 }}
                isExpanded={expandedPastas.has(pasta.id)}
                onToggle={() => handleTogglePasta(pasta.id)}
                onRename={(nome) => handleRenomearPasta(pasta.id, nome)}
                onDelete={() => handleExcluirPasta(pasta.id)}
              >
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Pasta vazia
                </p>
              </PastaItem>
            ))}

            {/* Palpites sem pasta */}
            {palpitesPorPasta["sem-pasta"]?.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => handleTogglePasta("sem-pasta")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Folder className="h-4 w-4" />
                  <span>Sem pasta ({palpitesPorPasta["sem-pasta"].length})</span>
                </button>
                
                {expandedPastas.has("sem-pasta") && (
                  <div className="space-y-2 pl-6">
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
