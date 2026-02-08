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
  FolderOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

// Configuração das loterias
const LOTERIAS_CONFIG = {
  lotofacil: {
    nome: "Lotofácil",
    cor: "#8b5cf6", // roxo
    icone: "🍀",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30"
  },
  megasena: {
    nome: "Mega Sena", 
    cor: "#22c55e", // verde
    icone: "🎱",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30"
  }
} as const;

type LoteriaKey = keyof typeof LOTERIAS_CONFIG;

// Navegação por níveis: loterias → pastas → palpites
type ViewLevel = "loterias" | "pastas" | "palpites";

interface NavigationState {
  level: ViewLevel;
  loteria?: LoteriaKey;
  pasta?: { id: string; nome: string; cor: string };
}

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
  const [nav, setNav] = useState<NavigationState>({ level: "loterias" });
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

  // Navegação
  const navigateToLoteria = (loteria: LoteriaKey) => {
    setNav({ level: "pastas", loteria });
  };

  const navigateToPasta = (pasta: { id: string; nome: string; cor: string }) => {
    setNav(prev => ({ ...prev, level: "palpites", pasta }));
  };

  const navigateToSemPasta = () => {
    setNav(prev => ({ 
      ...prev, 
      level: "palpites", 
      pasta: { id: "sem-pasta", nome: "Sem pasta", cor: "#6b7280" } 
    }));
  };

  const navigateBack = () => {
    if (nav.level === "palpites") {
      setNav(prev => ({ level: "pastas", loteria: prev.loteria }));
    } else if (nav.level === "pastas") {
      setNav({ level: "loterias" });
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

  const handlePalpitesChange = (novosPalpites: PalpiteSalvo[]) => {
    if (!nav.pasta || !nav.loteria) return;
    
    const isLoteriaSemPasta = nav.pasta.id === "sem-pasta";
    
    if (isLoteriaSemPasta) {
      const outrosPalpites = palpites.filter(p => 
        p.pasta_id !== null || p.loteria !== nav.loteria
      );
      setPalpites([...outrosPalpites, ...novosPalpites]);
    } else {
      // Filtrar pela pasta E loteria
      const outrosPalpites = palpites.filter(p => 
        !(p.pasta_id === nav.pasta!.id && p.loteria === nav.loteria)
      );
      setPalpites([...outrosPalpites, ...novosPalpites]);
    }
    
    if (novosPalpites.length === 0) {
      navigateBack();
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
    if (!nav.pasta || !nav.loteria) return [];
    
    if (nav.pasta.id === "sem-pasta") {
      return palpitesPorLoteriaEPasta[nav.loteria]?.semPasta || [];
    }
    
    return palpitesPorLoteriaEPasta[nav.loteria]?.porPasta[nav.pasta.id] || [];
  };

  // Verificar se uma pasta tem palpites de uma loteria específica
  const getPastaCountForLoteria = (pastaId: string, loteria: string) => {
    return palpitesPorLoteriaEPasta[loteria]?.porPasta[pastaId]?.length || 0;
  };

  // Determinar breadcrumb e título baseado no estado de navegação
  const getPageConfig = () => {
    if (nav.level === "palpites" && nav.pasta && nav.loteria) {
      const loteriaConfig = LOTERIAS_CONFIG[nav.loteria];
      return {
        title: nav.pasta.nome,
        breadcrumb: [
          { label: "Meus Palpites", onClick: () => setNav({ level: "loterias" }) },
          { label: loteriaConfig.nome, onClick: navigateBack }
        ],
        onBack: navigateBack
      };
    }
    
    if (nav.level === "pastas" && nav.loteria) {
      const loteriaConfig = LOTERIAS_CONFIG[nav.loteria];
      return {
        title: loteriaConfig.nome,
        breadcrumb: [
          { label: "Meus Palpites", onClick: () => setNav({ level: "loterias" }) }
        ],
        onBack: navigateBack
      };
    }
    
    return {
      title: "Meus Palpites",
      breadcrumb: undefined,
      onBack: undefined
    };
  };

  const pageConfig = getPageConfig();

  // ==================== RENDER LEVELS ====================

  // Level 0: Lista de loterias
  const renderLoteriasLevel = () => (
    <>
      {/* Header Fixo - Desktop only */}
      {!isMobile && (
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Dices className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Meus Palpites</h1>
                <p className="text-sm text-muted-foreground">
                  {palpites.length} palpite{palpites.length !== 1 ? "s" : ""} salvos
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile subtitle */}
      {isMobile && palpites.length > 0 && (
        <div className="px-4 py-2 border-b">
          <p className="text-sm text-muted-foreground">
            {palpites.length} palpite{palpites.length !== 1 ? "s" : ""} salvos
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="p-4 space-y-3">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
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

      {/* Cards de Loterias */}
      {!isLoading && palpites.length > 0 && (
        <div className="p-4 space-y-3">
          {(Object.keys(LOTERIAS_CONFIG) as LoteriaKey[]).map((loteriaKey) => {
            const config = LOTERIAS_CONFIG[loteriaKey];
            const totalLoteria = contarPorLoteria(loteriaKey);
            
            // Contar pastas com palpites desta loteria
            const pastasComPalpites = pastas.filter(p => 
              getPastaCountForLoteria(p.id, loteriaKey) > 0
            ).length;
            const temSemPasta = palpitesPorLoteriaEPasta[loteriaKey]?.semPasta.length > 0;
            const totalPastas = pastasComPalpites + (temSemPasta ? 1 : 0);

            return (
              <button
                key={loteriaKey}
                onClick={() => navigateToLoteria(loteriaKey)}
                className={`w-full p-4 rounded-xl border-2 ${config.bgClass} ${config.borderClass} hover:opacity-90 active:scale-[0.99] transition-all text-left`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{config.icone}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg" style={{ color: config.cor }}>
                      {config.nome}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {totalLoteria} palpite{totalLoteria !== 1 ? "s" : ""} • {totalPastas} pasta{totalPastas !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );

  // Level 1: Pastas de uma loteria
  const renderPastasLevel = () => {
    if (!nav.loteria) return null;
    
    const config = LOTERIAS_CONFIG[nav.loteria];
    const loteriaData = palpitesPorLoteriaEPasta[nav.loteria];
    
    // Pastas com palpites desta loteria
    const pastasComPalpites = pastas.filter(p => 
      getPastaCountForLoteria(p.id, nav.loteria!) > 0
    );

    return (
      <div className="flex-1">
        {/* Header com ícone da loteria */}
        <div className="px-4 py-3 border-b flex items-center gap-3">
          <span className="text-2xl">{config.icone}</span>
          <p className="text-sm text-muted-foreground">
            {contarPorLoteria(nav.loteria)} palpite{contarPorLoteria(nav.loteria) !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="divide-y">
          {/* Pastas com palpites */}
          {pastasComPalpites.map((pasta) => {
            const count = getPastaCountForLoteria(pasta.id, nav.loteria!);
            
            return (
              <button
                key={pasta.id}
                onClick={() => navigateToPasta(pasta)}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 active:bg-muted/75 transition-colors text-left"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: pasta.cor + "20" }}
                >
                  <Folder className="h-5 w-5" style={{ color: pasta.cor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{pasta.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {count} palpite{count !== 1 ? "s" : ""}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </button>
            );
          })}

          {/* Sem pasta */}
          {loteriaData?.semPasta.length > 0 && (
            <button
              onClick={navigateToSemPasta}
              className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 active:bg-muted/75 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Sem pasta</p>
                <p className="text-sm text-muted-foreground">
                  {loteriaData.semPasta.length} palpite{loteriaData.semPasta.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </button>
          )}
        </div>

        {/* Pastas vazias (só mostra se não há nenhum palpite) */}
        {pastasComPalpites.length === 0 && loteriaData?.semPasta.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Folder className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Nenhum palpite salvo para {config.nome}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Level 2: Palpites de uma pasta
  const renderPalpitesLevel = () => {
    if (!nav.pasta || !nav.loteria) return null;
    
    const config = LOTERIAS_CONFIG[nav.loteria];
    
    return (
      <PastaContent
        pastaNome={nav.pasta.nome}
        pastaCor={nav.pasta.id === "sem-pasta" ? config.cor : nav.pasta.cor}
        palpites={getPalpitesDaPasta()}
        onPalpitesChange={handlePalpitesChange}
        onClose={navigateBack}
      />
    );
  };

  return (
    <MainLayout 
      pageTitle={pageConfig.title} 
      breadcrumb={pageConfig.breadcrumb}
      onBack={pageConfig.onBack}
    >
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {nav.level === "loterias" && renderLoteriasLevel()}
        {nav.level === "pastas" && renderPastasLevel()}
        {nav.level === "palpites" && renderPalpitesLevel()}
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
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
