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
import { supabase } from "@/integrations/supabase/client";
import { 
  Dices,
  Folder,
  ChevronRight,
  Plus,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

// Configuração das loterias
const LOTERIAS_CONFIG = {
  lotofacil: {
    nome: "Lotofácil",
    cor: "#8b5cf6",
    icone: "🍀",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30"
  },
  megasena: {
    nome: "Mega Sena", 
    cor: "#22c55e",
    icone: "🎱",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30"
  },
  duplasena: {
    nome: "Dupla Sena", 
    cor: "#f97316",
    icone: "🎯",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/30"
  }
} as const;

type LoteriaKey = keyof typeof LOTERIAS_CONFIG;

// Navegação por níveis: loterias → subpastas → palpites
type ViewLevel = "loterias" | "subpastas" | "palpites";

interface PastaComHierarquia extends PalpitePasta {
  parent_id?: string | null;
  is_root?: boolean;
}

interface NavigationState {
  level: ViewLevel;
  loteria?: LoteriaKey;
  subpasta?: { id: string; nome: string; cor: string };
}

export default function MeusPalpites() {
  const isMobile = useIsMobile();
  const { 
    buscarPalpites, 
    excluirVarios,
    excluirPasta,
    isLoading 
  } = usePalpitesSalvos();
  
  const [palpites, setPalpites] = useState<PalpiteSalvo[]>([]);
  const [pastas, setPastas] = useState<PastaComHierarquia[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [novaPastaOpen, setNovaPastaOpen] = useState(false);
  const [nav, setNav] = useState<NavigationState>({ level: "loterias" });
  const [loadingPastas, setLoadingPastas] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingPastas(true);
    try {
      const palpitesData = await buscarPalpites();
      setPalpites(palpitesData);
      
      // Buscar todas as pastas com hierarquia
      const { data: pastasData } = await supabase
        .from("palpites_pastas")
        .select("*")
        .order("nome");
      
      setPastas((pastasData || []) as PastaComHierarquia[]);
    } finally {
      setLoadingPastas(false);
    }
  };

  // Contar palpites por loteria
  const contarPorLoteria = useMemo(() => {
    const counts: Record<string, number> = {};
    palpites.forEach(p => {
      const lot = p.loteria || "lotofacil";
      counts[lot] = (counts[lot] || 0) + 1;
    });
    return counts;
  }, [palpites]);

  // Obter subpastas de uma loteria (incluindo pastas antigas sem parent_id)
  const getSubpastas = (loteriaKey: string) => {
    // Encontrar pasta raiz da loteria
    const raiz = pastas.find(p => p.loteria === loteriaKey && p.is_root === true);
    
    // Buscar subpastas: 
    // 1. Pastas com parent_id apontando para a raiz (novo formato)
    // 2. Pastas da mesma loteria sem parent_id e que não são raiz (formato antigo)
    return pastas.filter(p => 
      p.loteria === loteriaKey && 
      p.is_root !== true && 
      (p.parent_id === raiz?.id || p.parent_id === null)
    );
  };

  // Contar palpites por subpasta
  const contarPorSubpasta = (subpastaId: string) => {
    return palpites.filter(p => p.pasta_id === subpastaId).length;
  };

  // Navegação
  const navigateToLoteria = (loteria: LoteriaKey) => {
    setNav({ level: "subpastas", loteria });
  };

  const navigateToSubpasta = (subpasta: { id: string; nome: string; cor: string }) => {
    setNav(prev => ({ ...prev, level: "palpites", subpasta }));
  };

  const navigateBack = () => {
    if (nav.level === "palpites") {
      setNav(prev => ({ level: "subpastas", loteria: prev.loteria }));
    } else if (nav.level === "subpastas") {
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

  const handleCriarSubpasta = async (nome: string, cor: string, loteria: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar ou criar pasta raiz
      let raiz = pastas.find(p => p.loteria === loteria && p.is_root === true);
      
      if (!raiz) {
        const config = LOTERIAS_CONFIG[loteria as LoteriaKey];
        const { data } = await supabase
          .from("palpites_pastas")
          .insert({
            user_id: user.id,
            nome: config?.nome || loteria,
            cor: config?.cor || "#8b5cf6",
            loteria: loteria,
            is_root: true,
          })
          .select()
          .single();
        
        if (data) {
          raiz = data as PastaComHierarquia;
          setPastas(prev => [...prev, raiz!]);
        }
      }

      if (!raiz) return;

      // Criar subpasta
      const { data: subpasta } = await supabase
        .from("palpites_pastas")
        .insert({
          user_id: user.id,
          nome: nome,
          cor: cor,
          loteria: loteria,
          parent_id: raiz.id,
          is_root: false,
        })
        .select()
        .single();

      if (subpasta) {
        setPastas(prev => [...prev, subpasta as PastaComHierarquia]);
        toast({
          title: "Pasta criada! 📁",
          description: `Pasta "${nome}" criada com sucesso.`,
        });
      }
    } catch (error) {
      console.error("Erro ao criar subpasta:", error);
      toast({
        title: "Erro ao criar pasta",
        variant: "destructive",
      });
    } finally {
      setNovaPastaOpen(false);
    }
  };

  const handlePalpitesChange = (novosPalpites: PalpiteSalvo[]) => {
    if (!nav.subpasta) return;
    
    const outrosPalpites = palpites.filter(p => p.pasta_id !== nav.subpasta!.id);
    setPalpites([...outrosPalpites, ...novosPalpites]);
    
    if (novosPalpites.length === 0) {
      navigateBack();
    }
  };

  const handleExcluirSubpasta = async (id: string) => {
    const success = await excluirPasta(id);
    if (success) {
      setPastas(prev => prev.filter(p => p.id !== id));
      setPalpites(prev => prev.map(p => p.pasta_id === id ? { ...p, pasta_id: null } : p));
    }
  };

  const getPalpitesDaSubpasta = () => {
    if (!nav.subpasta) return [];
    return palpites.filter(p => p.pasta_id === nav.subpasta!.id);
  };

  // Determinar breadcrumb e título baseado no estado de navegação
  const getPageConfig = () => {
    if (nav.level === "palpites" && nav.subpasta && nav.loteria) {
      const loteriaConfig = LOTERIAS_CONFIG[nav.loteria];
      return {
        title: nav.subpasta.nome,
        breadcrumb: [
          { label: "Meus Palpites", onClick: () => setNav({ level: "loterias" }) },
          { label: loteriaConfig.nome, onClick: navigateBack }
        ],
        onBack: navigateBack
      };
    }
    
    if (nav.level === "subpastas" && nav.loteria) {
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

  // Level 0: Lista de loterias (pastas raiz fixas)
  const renderLoteriasLevel = () => {
    const totalPalpites = palpites.length;
    
    return (
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
                    {totalPalpites} palpite{totalPalpites !== 1 ? "s" : ""} salvos
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile subtitle */}
        {isMobile && totalPalpites > 0 && (
          <div className="px-4 py-2 border-b">
            <p className="text-sm text-muted-foreground">
              {totalPalpites} palpite{totalPalpites !== 1 ? "s" : ""} salvos
            </p>
          </div>
        )}

        {/* Loading */}
        {(isLoading || loadingPastas) && (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Lista vazia */}
        {!isLoading && !loadingPastas && totalPalpites === 0 && (
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

        {/* Cards de Loterias (sempre visíveis se há palpites) */}
        {!isLoading && !loadingPastas && totalPalpites > 0 && (
          <div className="p-4 space-y-3">
            {(Object.keys(LOTERIAS_CONFIG) as LoteriaKey[]).map((loteriaKey) => {
              const config = LOTERIAS_CONFIG[loteriaKey];
              const totalLoteria = contarPorLoteria[loteriaKey] || 0;
              const subpastas = getSubpastas(loteriaKey);

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
                        {totalLoteria} palpite{totalLoteria !== 1 ? "s" : ""} • {subpastas.length} pasta{subpastas.length !== 1 ? "s" : ""}
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
  };

  // Level 1: Subpastas de uma loteria
  const renderSubpastasLevel = () => {
    if (!nav.loteria) return null;
    
    const config = LOTERIAS_CONFIG[nav.loteria];
    const subpastas = getSubpastas(nav.loteria);
    const totalLoteria = contarPorLoteria[nav.loteria] || 0;

    return (
      <div className="flex-1">
        {/* Header com ícone da loteria */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icone}</span>
            <p className="text-sm text-muted-foreground">
              {totalLoteria} palpite{totalLoteria !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNovaPastaOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Pasta
          </Button>
        </div>

        {/* Lista de subpastas */}
        {subpastas.length > 0 ? (
          <div className="divide-y">
            {subpastas.map((pasta) => {
              const count = contarPorSubpasta(pasta.id);
              
              return (
                <button
                  key={pasta.id}
                  onClick={() => navigateToSubpasta(pasta)}
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
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Folder className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              Nenhuma pasta criada para {config.nome}
            </p>
            <Button onClick={() => setNovaPastaOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeira Pasta
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Level 2: Palpites de uma subpasta
  const renderPalpitesLevel = () => {
    if (!nav.subpasta || !nav.loteria) return null;
    
    return (
      <PastaContent
        pastaNome={nav.subpasta.nome}
        pastaCor={nav.subpasta.cor}
        palpites={getPalpitesDaSubpasta()}
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
        {nav.level === "subpastas" && renderSubpastasLevel()}
        {nav.level === "palpites" && renderPalpitesLevel()}
      </div>

      {/* Dialog Nova Pasta */}
      <NovaPastaDialog
        open={novaPastaOpen}
        onOpenChange={setNovaPastaOpen}
        onConfirm={handleCriarSubpasta}
        loteria={nav.loteria || "lotofacil"}
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
