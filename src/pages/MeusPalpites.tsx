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
import { PastaSheet } from "@/components/palpites/PastaSheet";
import { 
  Trash2, 
  Dices,
  FolderPlus,
  Folder,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function MeusPalpites() {
  const isMobile = useIsMobile();
  const { 
    buscarPalpites, 
    buscarPastas,
    excluirVarios,
    criarPasta,
    renomearPasta,
    excluirPasta,
    isLoading 
  } = usePalpitesSalvos();
  
  const [palpites, setPalpites] = useState<PalpiteSalvo[]>([]);
  const [pastas, setPastas] = useState<PalpitePasta[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [novaPastaOpen, setNovaPastaOpen] = useState(false);
  const [pastaSheetOpen, setPastaSheetOpen] = useState(false);
  const [selectedPasta, setSelectedPasta] = useState<{ id: string; nome: string; cor: string } | null>(null);
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

  const handleSelectAll = () => {
    if (selected.size === palpites.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(palpites.map(p => p.id)));
    }
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

  const handleOpenPasta = (pasta: { id: string; nome: string; cor: string }) => {
    setSelectedPasta(pasta);
    setPastaSheetOpen(true);
  };

  const handleOpenSemPasta = () => {
    setSelectedPasta({ id: "sem-pasta", nome: "Sem pasta", cor: "#6b7280" });
    setPastaSheetOpen(true);
  };

  const handlePalpitesChange = (novosPalpites: PalpiteSalvo[]) => {
    if (!selectedPasta) return;
    
    if (selectedPasta.id === "sem-pasta") {
      // Atualizar palpites sem pasta
      const outrosPalpites = palpites.filter(p => p.pasta_id !== null);
      setPalpites([...outrosPalpites, ...novosPalpites]);
    } else {
      // Atualizar palpites da pasta específica
      const outrosPalpites = palpites.filter(p => p.pasta_id !== selectedPasta.id);
      setPalpites([...outrosPalpites, ...novosPalpites]);
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
    return palpitesPorPasta[selectedPasta.id] || [];
  };

  return (
    <MainLayout pageTitle="Meus Palpites">
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
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
              <Link to="/gerador">
                <Button size="lg" className="gap-2">
                  <Dices className="h-5 w-5" />
                  Ir para o Gerador
                </Button>
              </Link>
            </div>
          )}

           {/* Lista de Pastas */}
           {!isLoading && palpites.length > 0 && (
             <div className="divide-y">
               {/* Pastas com palpites */}
               {pastas.map((pasta) => {
                 const count = (palpitesPorPasta[pasta.id] || []).length;
                 
                 return (
                   <div key={pasta.id}>
                     <button
                       onClick={() => handleOpenPasta(pasta)}
                       className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 active:bg-muted/75 transition-colors text-left"
                     >
                       <Folder className="h-6 w-6 shrink-0" style={{ color: pasta.cor }} />
                       <div className="flex-1 min-w-0">
                         <p className="font-medium truncate">{pasta.nome}</p>
                         <p className="text-sm text-muted-foreground">
                           {count} palpite{count !== 1 ? "s" : ""}
                         </p>
                       </div>
                       <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                     </button>
                   </div>
                 );
               })}

               {/* Palpites sem pasta */}
               {palpitesPorPasta["sem-pasta"]?.length > 0 && (
                 <div>
                   <button
                     onClick={handleOpenSemPasta}
                     className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 active:bg-muted/75 transition-colors text-left"
                   >
                     <Folder className="h-6 w-6 text-muted-foreground shrink-0" />
                     <div className="flex-1 min-w-0">
                       <p className="font-medium">Sem pasta</p>
                       <p className="text-sm text-muted-foreground">
                         {palpitesPorPasta["sem-pasta"].length} palpite{palpitesPorPasta["sem-pasta"].length !== 1 ? "s" : ""}
                       </p>
                     </div>
                     <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                   </button>
                 </div>
               )}

               {/* Pastas vazias */}
               {pastas.filter(p => (palpitesPorPasta[p.id] || []).length === 0).length > 0 && (
                 <div className="px-4 py-3 border-t">
                   <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-semibold">Pastas vazias</p>
                   <div className="space-y-2">
                     {pastas.filter(p => (palpitesPorPasta[p.id] || []).length === 0).map((pasta) => (
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
      </div>

      {/* Dialog Nova Pasta */}
      <NovaPastaDialog
        open={novaPastaOpen}
        onOpenChange={setNovaPastaOpen}
        onConfirm={handleCriarPasta}
        isLoading={isLoading}
      />

      {/* Sheet da Pasta */}
      {selectedPasta && (
        <PastaSheet
          open={pastaSheetOpen}
          onOpenChange={setPastaSheetOpen}
          pastaNome={selectedPasta.nome}
          pastaCor={selectedPasta.cor}
          palpites={getPalpitesDaPasta()}
          onPalpitesChange={handlePalpitesChange}
        />
      )}

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
