import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

import { usePermissions } from "@/hooks/usePermission";
import { getFeatureForRoute, isVipFeature } from "@/lib/featureMap";
import { PremiumBadge } from "@/components/shared/PremiumBadge";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { FEATURE_LABELS } from "@/types/plans";
import type { FeatureKey } from "@/types/plans";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Target, Table2, Flame, Gift } from "lucide-react";
import {
  ArrowLeft,
  Home,
  Users,
  BarChart3,
  MessageCircle,
  LogOut,
  Dices,
  Grid3X3,
  Shuffle,
  LayoutGrid,
} from "lucide-react";

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const { isAuthenticated, profile, signOut } = useAuthContext();
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeLabel, setUpgradeLabel] = useState<string | undefined>();
  const [upgradeVariant, setUpgradeVariant] = useState<"premium" | "vip">("premium");

  const handleSignOut = async () => {
    try {
      await signOut();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const getInitials = (nome: string | null) => {
    if (!nome) return "U";
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const closeAndNavigate = () => {
    onOpenChange(false);
  };

  const handleGatedClick = (e: React.MouseEvent, path: string) => {
    const feature = getFeatureForRoute(path);
    if (feature && !hasPermission(feature)) {
      e.preventDefault();
      onOpenChange(false);
      setTimeout(() => {
        setUpgradeLabel(FEATURE_LABELS[feature]);
        setUpgradeVariant(isVipFeature(feature) ? "vip" : "premium");
        setUpgradeOpen(true);
      }, 300);
    } else {
      closeAndNavigate();
    }
  };

  const renderBadge = (path: string) => {
    const feature = getFeatureForRoute(path);
    if (!feature || hasPermission(feature)) return null;
    return <PremiumBadge variant={isVipFeature(feature) ? "vip" : "premium"} className="ml-auto" />;
  };

  const supportWhatsApp = "https://wa.me/5516997175392?text=Olá! Preciso de ajuda com o Palpite Tech.";

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col z-[110]" hideCloseButton>
        <SheetHeader className="sr-only">
          <SheetTitle>Menu Principal</SheetTitle>
        </SheetHeader>

        {/* Header Unificado: Voltar + Perfil Compacto */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          {/* Lado Esquerdo: Voltar */}
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-base"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>

          {/* Lado Direito: Perfil Compacto */}
          {isAuthenticated ? (
            <Link to="/perfil" onClick={closeAndNavigate}>
              <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="text-base font-medium text-foreground">
                  {profile?.nome?.split(' ')[0] || 'Usuário'}
                </span>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(profile?.nome)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </Link>
          ) : (
            <Link to="/login" onClick={closeAndNavigate}>
              <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="text-base text-muted-foreground">Entrar</span>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm">?</AvatarFallback>
                </Avatar>
              </div>
            </Link>
          )}
        </div>


        {/* Corpo do Menu */}
        <div className="flex-1 overflow-y-auto">
              {/* Itens Fixos de Navegação */}
              <nav className="px-4 py-6 space-y-1">
                <Link to="/comunidade" onClick={closeAndNavigate}>
                  <div className="flex items-center gap-3 py-3 text-base text-foreground hover:text-primary transition-colors">
                    <Home className="h-5 w-5 stroke-[1.5]" />
                    Início
                  </div>
                </Link>
              </nav>

               {/* Accordion de Lotofácil */}
               <div className="mx-4 p-1 rounded-r-md border-l-4" style={{ borderLeftColor: "hsl(270, 60%, 50%)", backgroundColor: "hsl(270, 60%, 50%, 0.04)" }}>
                 <Accordion type="single" collapsible>
                   <AccordionItem value="ferramentas" className="border-none">
                     <AccordionTrigger className="py-3 text-base hover:no-underline hover:text-primary">
                       <div className="flex items-center gap-3">
                         <BarChart3 className="h-5 w-5 stroke-[1.5]" />
                         <span>Lotofácil</span>
                       </div>
                     </AccordionTrigger>
                    <AccordionContent className="pb-0">
                       <div className="pl-8 space-y-0">
                         <Link to="/lotofacil" onClick={closeAndNavigate}>
                           <div className="py-2.5 text-[15px] text-primary font-semibold hover:text-primary/80 transition-colors flex items-center gap-2">
                              Ver Todas as Ferramentas
                           </div>
                         </Link>
                         <div className="border-t border-border/50 my-1" />
                         <Link to="/analise-do-dia" onClick={(e) => handleGatedClick(e, "/analise-do-dia")}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                             <Target className="h-4 w-4" />
                             Análise do Dia
                             {renderBadge("/analise-do-dia")}
                           </div>
                         </Link>
                         <div className="border-t border-border/50 my-1" />
                         <Link to="/resultados" onClick={closeAndNavigate}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                             Resultados
                           </div>
                         </Link>
                         <Link to="/tendencias" onClick={(e) => handleGatedClick(e, "/tendencias")}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                             Tendências
                             {renderBadge("/tendencias")}
                           </div>
                         </Link>
                          <Link to="/frequencia" onClick={(e) => handleGatedClick(e, "/frequencia")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              Quentes e Frias
                              {renderBadge("/frequencia")}
                            </div>
                          </Link>
                          <Link to="/frequencia-dezenas" onClick={(e) => handleGatedClick(e, "/frequencia-dezenas")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Frequência das Dezenas
                              {renderBadge("/frequencia-dezenas")}
                            </div>
                          </Link>
                          <Link to="/dezenas-por-posicao" onClick={(e) => handleGatedClick(e, "/dezenas-por-posicao")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Dezenas por Posição
                              {renderBadge("/dezenas-por-posicao")}
                            </div>
                          </Link>
                          <Link to="/linhas-colunas" onClick={(e) => handleGatedClick(e, "/linhas-colunas")}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                             <LayoutGrid className="h-4 w-4" />
                             Linhas e Colunas
                             {renderBadge("/linhas-colunas")}
                           </div>
                         </Link>
                         <Link to="/tabela-movimentacao" onClick={(e) => handleGatedClick(e, "/tabela-movimentacao")}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                             <Table2 className="h-4 w-4" />
                             Tabela de Movimentação
                             {renderBadge("/tabela-movimentacao")}
                           </div>
                         </Link>
                         <Link to="/smart-gerador" onClick={(e) => handleGatedClick(e, "/smart-gerador")}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                             <Dices className="h-4 w-4" />
                             Gerador de Palpites
                             {renderBadge("/smart-gerador")}
                           </div>
                        </Link>
                         <Link to="/desdobramento" onClick={(e) => handleGatedClick(e, "/desdobramento")}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                             <Shuffle className="h-4 w-4" />
                             Desdobramento
                             {renderBadge("/desdobramento")}
                           </div>
                         </Link>
                         <Link to="/fechamento" onClick={(e) => handleGatedClick(e, "/fechamento")}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                             <Grid3X3 className="h-4 w-4" />
                             Gerador de Fechamento
                             {renderBadge("/fechamento")}
                           </div>
                         </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

               {/* Accordion de Dupla Sena */}
               <div className="mx-4 p-1 rounded-r-md border-l-4" style={{ borderLeftColor: "hsl(0, 75%, 55%)", backgroundColor: "hsl(0, 75%, 55%, 0.04)" }}>
                 <Accordion type="single" collapsible>
                   <AccordionItem value="duplasena" className="border-none">
                     <AccordionTrigger className="py-3 text-base hover:no-underline hover:text-primary">
                       <div className="flex items-center gap-3">
                         <BarChart3 className="h-5 w-5 stroke-[1.5]" />
                         <span>Dupla Sena</span>
                       </div>
                     </AccordionTrigger>
                     <AccordionContent className="pb-0">
                       <div className="pl-8 space-y-0">
                         <Link to="/duplasena" onClick={closeAndNavigate}>
                           <div className="py-2.5 text-[15px] text-primary font-semibold hover:text-primary/80 transition-colors flex items-center gap-2">
                              Ver Todas as Ferramentas
                           </div>
                         </Link>
                         <div className="border-t border-border/50 my-1" />
                           <Link to="/duplasena/analise-do-dia" onClick={(e) => handleGatedClick(e, "/duplasena/analise-do-dia")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Análise do Dia
                              {renderBadge("/duplasena/analise-do-dia")}
                            </div>
                          </Link>
                          <div className="border-t border-border/50 my-1" />
                          <Link to="/duplasena/resultados" onClick={closeAndNavigate}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                              Resultados
                            </div>
                          </Link>
                          <Link to="/duplasena/tendencias" onClick={(e) => handleGatedClick(e, "/duplasena/tendencias")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              Tendências
                              {renderBadge("/duplasena/tendencias")}
                            </div>
                          </Link>
                          <Link to="/duplasena/frequencia" onClick={(e) => handleGatedClick(e, "/duplasena/frequencia")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              Quentes e Frias
                              {renderBadge("/duplasena/frequencia")}
                            </div>
                          </Link>
                          <Link to="/duplasena/frequencia-dezenas" onClick={(e) => handleGatedClick(e, "/duplasena/frequencia-dezenas")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Frequência das Dezenas
                              {renderBadge("/duplasena/frequencia-dezenas")}
                            </div>
                          </Link>
                          <Link to="/duplasena/dezenas-por-posicao" onClick={(e) => handleGatedClick(e, "/duplasena/dezenas-por-posicao")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Dezenas por Posição
                              {renderBadge("/duplasena/dezenas-por-posicao")}
                            </div>
                          </Link>
                          <Link to="/duplasena/linhas-colunas" onClick={(e) => handleGatedClick(e, "/duplasena/linhas-colunas")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              <LayoutGrid className="h-4 w-4" />
                              Linhas e Colunas
                              {renderBadge("/duplasena/linhas-colunas")}
                            </div>
                          </Link>
                          <Link to="/duplasena/tabela-movimentacao" onClick={(e) => handleGatedClick(e, "/duplasena/tabela-movimentacao")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              <Table2 className="h-4 w-4" />
                              Tabela de Movimentação
                              {renderBadge("/duplasena/tabela-movimentacao")}
                            </div>
                          </Link>
                           <Link to="/duplasena/gerador" onClick={(e) => handleGatedClick(e, "/duplasena/gerador")}>
                             <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                               <Dices className="h-4 w-4" />
                               Gerador de Palpites
                               {renderBadge("/duplasena/gerador")}
                             </div>
                           </Link>
                           <Link to="/duplasena/desdobramento" onClick={(e) => handleGatedClick(e, "/duplasena/desdobramento")}>
                             <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                               <Shuffle className="h-4 w-4" />
                               Desdobramento
                               {renderBadge("/duplasena/desdobramento")}
                             </div>
                           </Link>
                           <Link to="/duplasena/fechamento" onClick={(e) => handleGatedClick(e, "/duplasena/fechamento")}>
                             <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                               <Grid3X3 className="h-4 w-4" />
                               Gerador de Fechamento
                               {renderBadge("/duplasena/fechamento")}
                             </div>
                           </Link>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

               {/* Accordion de Mega Sena */}
               <div className="mx-4 p-1 rounded-r-md border-l-4" style={{ borderLeftColor: "hsl(125, 70%, 40%)", backgroundColor: "hsl(125, 70%, 40%, 0.04)" }}>
                 <Accordion type="single" collapsible>
                   <AccordionItem value="megasena" className="border-none">
                     <AccordionTrigger className="py-3 text-base hover:no-underline hover:text-primary">
                       <div className="flex items-center gap-3">
                         <BarChart3 className="h-5 w-5 stroke-[1.5]" />
                         <span>Mega Sena</span>
                       </div>
                     </AccordionTrigger>
                    <AccordionContent className="pb-0">
                        <div className="pl-8 space-y-0">
                         <Link to="/megasena" onClick={closeAndNavigate}>
                           <div className="py-2.5 text-[15px] text-primary font-semibold hover:text-primary/80 transition-colors flex items-center gap-2">
                             Ver Todas as Ferramentas
                           </div>
                         </Link>
                         <div className="border-t border-border/50 my-1" />
                           <Link to="/megasena/analise-do-dia" onClick={(e) => handleGatedClick(e, "/megasena/analise-do-dia")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Análise do Dia
                              {renderBadge("/megasena/analise-do-dia")}
                            </div>
                          </Link>
                          <div className="border-t border-border/50 my-1" />
                          <Link to="/megasena/resultados" onClick={closeAndNavigate}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                             Resultados
                           </div>
                         </Link>
                         <Link to="/megasena/tendencias" onClick={(e) => handleGatedClick(e, "/megasena/tendencias")}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                             Tendências
                             {renderBadge("/megasena/tendencias")}
                           </div>
                         </Link>
                          <Link to="/megasena/frequencia" onClick={(e) => handleGatedClick(e, "/megasena/frequencia")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              Quentes e Frias
                              {renderBadge("/megasena/frequencia")}
                            </div>
                          </Link>
                          <Link to="/megasena/frequencia-dezenas" onClick={(e) => handleGatedClick(e, "/megasena/frequencia-dezenas")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Frequência das Dezenas
                              {renderBadge("/megasena/frequencia-dezenas")}
                            </div>
                          </Link>
                          <Link to="/megasena/dezenas-por-posicao" onClick={(e) => handleGatedClick(e, "/megasena/dezenas-por-posicao")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Dezenas por Posição
                              {renderBadge("/megasena/dezenas-por-posicao")}
                            </div>
                          </Link>
                          <Link to="/megasena/linhas-colunas" onClick={(e) => handleGatedClick(e, "/megasena/linhas-colunas")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              <LayoutGrid className="h-4 w-4" />
                              Linhas e Colunas
                              {renderBadge("/megasena/linhas-colunas")}
                            </div>
                          </Link>
                          <Link to="/megasena/tabela-movimentacao" onClick={(e) => handleGatedClick(e, "/megasena/tabela-movimentacao")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              <Table2 className="h-4 w-4" />
                              Tabela de Movimentação
                              {renderBadge("/megasena/tabela-movimentacao")}
                            </div>
                          </Link>
                          <Link to="/megasena/gerador" onClick={(e) => handleGatedClick(e, "/megasena/gerador")}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                             <Dices className="h-4 w-4" />
                             Gerador de Palpites
                             {renderBadge("/megasena/gerador")}
                           </div>
                         </Link>
                         <Link to="/megasena/desdobramento" onClick={(e) => handleGatedClick(e, "/megasena/desdobramento")}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                             <Shuffle className="h-4 w-4" />
                             Desdobramento
                             {renderBadge("/megasena/desdobramento")}
                           </div>
                         </Link>
                         <Link to="/megasena/fechamento" onClick={(e) => handleGatedClick(e, "/megasena/fechamento")}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                             <Grid3X3 className="h-4 w-4" />
                             Gerador de Fechamento
                             {renderBadge("/megasena/fechamento")}
                           </div>
                         </Link>
                      </div>
                    </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

               {/* Accordion de Quina */}
               <div className="mx-4 p-1 rounded-r-md border-l-4" style={{ borderLeftColor: "hsl(260, 65%, 45%)", backgroundColor: "hsl(260, 65%, 45%, 0.04)" }}>
                 <Accordion type="single" collapsible>
                   <AccordionItem value="quina" className="border-none">
                     <AccordionTrigger className="py-3 text-base hover:no-underline hover:text-primary">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-5 w-5 stroke-[1.5]" />
                          <span>Quina</span>
                       </div>
                     </AccordionTrigger>
                      <AccordionContent className="pb-0">
                        <div className="pl-8 space-y-0">
                          <Link to="/quina/resultados" onClick={closeAndNavigate}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                              Resultados
                            </div>
                          </Link>
                           <Link to="/quina/tendencias" onClick={(e) => handleGatedClick(e, "/quina/tendencias")}>
                            <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                              Tendências
                              {renderBadge("/quina/tendencias")}
                            </div>
                          </Link>
                          <Link to="/quina/frequencia" onClick={(e) => handleGatedClick(e, "/quina/frequencia")}>
                             <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                               Quentes e Frias
                               {renderBadge("/quina/frequencia")}
                             </div>
                           </Link>
                           <Link to="/quina/frequencia-dezenas" onClick={(e) => handleGatedClick(e, "/quina/frequencia-dezenas")}>
                             <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                               Frequência Dezenas
                               {renderBadge("/quina/frequencia-dezenas")}
                              </div>
                           </Link>
                           <Link to="/quina/dezenas-posicao" onClick={(e) => handleGatedClick(e, "/quina/dezenas-posicao")}>
                              <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                                Dezenas por Posição
                                {renderBadge("/quina/dezenas-posicao")}
                              </div>
                            </Link>
                           <Link to="/quina/linhas-colunas" onClick={(e) => handleGatedClick(e, "/quina/linhas-colunas")}>
                              <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                                Linhas e Colunas
                                {renderBadge("/quina/linhas-colunas")}
                              </div>
                            </Link>
                         </div>
                      </AccordionContent>
                   </AccordionItem>
                 </Accordion>
               </div>

               {/* Accordion de Dia de Sorte */}
               <div className="mx-4 p-1 rounded-r-md border-l-4" style={{ borderLeftColor: "hsl(43, 96%, 50%)", backgroundColor: "hsl(43, 96%, 50%, 0.04)" }}>
                 <Accordion type="single" collapsible>
                   <AccordionItem value="diadesorte" className="border-none">
                     <AccordionTrigger className="py-3 text-base hover:no-underline hover:text-primary">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-5 w-5 stroke-[1.5]" />
                          <span>Dia de Sorte</span>
                       </div>
                     </AccordionTrigger>
                     <AccordionContent className="pb-0">
                       <div className="pl-8 space-y-0">
                         <Link to="/diadesorte/resultados" onClick={closeAndNavigate}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                             Resultados
                           </div>
                         </Link>
                       </div>
                     </AccordionContent>
                   </AccordionItem>
                 </Accordion>
               </div>

               {/* Accordion de Lotomania */}
               <div className="mx-4 p-1 rounded-r-md border-l-4" style={{ borderLeftColor: "hsl(28, 90%, 52%)", backgroundColor: "hsl(28, 90%, 52%, 0.04)" }}>
                 <Accordion type="single" collapsible>
                   <AccordionItem value="lotomania" className="border-none">
                     <AccordionTrigger className="py-3 text-base hover:no-underline hover:text-primary">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-5 w-5 stroke-[1.5]" />
                          <span>Lotomania</span>
                       </div>
                     </AccordionTrigger>
                     <AccordionContent className="pb-0">
                       <div className="pl-8 space-y-0">
                         <Link to="/lotomania/resultados" onClick={closeAndNavigate}>
                           <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                             Resultados
                           </div>
                         </Link>
                       </div>
                     </AccordionContent>
                   </AccordionItem>
                 </Accordion>
               </div>
        </div>

        {/* Rodapé Minimalista */}
        <div className="mt-auto px-4 py-4 border-t border-border/30 space-y-3">
          <Link to="/convites" onClick={closeAndNavigate}>
            <div className="flex items-center gap-2 text-primary font-medium text-base transition-colors hover:opacity-80">
              <Gift className="h-5 w-5" />
               Ganhar Assinatura grátis
            </div>
          </Link>

          <a
            href={supportWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-base transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Preciso de Suporte
          </a>

          {isAuthenticated && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-muted-foreground hover:text-destructive text-base transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sair da conta
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>

    <UpgradeModal
      open={upgradeOpen}
      onOpenChange={setUpgradeOpen}
      featureLabel={upgradeLabel}
      variant={upgradeVariant}
    />
    </>
  );
}
