import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermission";
import { getFeatureForRoute, isVipFeature } from "@/lib/featureMap";
import { PremiumBadge } from "@/components/shared/PremiumBadge";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { FEATURE_LABELS } from "@/types/plans";
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
import { 
  Target, Table2, Flame, Gift, ArrowLeft, Home, 
  BarChart3, MessageCircle, LogOut, Dices, Shuffle, 
  LayoutGrid, Grid3X3, TrendingUp, TrendingDown 
} from "lucide-react";

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const { isAuthenticated, profile, signOut } = useAuthContext();
  const { hasPermission, isPremium } = usePermissions();
  const location = useLocation();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeLabel, setUpgradeLabel] = useState<string | undefined>();
  const [upgradeVariant, setUpgradeVariant] = useState<"premium" | "vip">("premium");
  const isActive = (path: string) => location.pathname === path;

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
    return nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
    // Se o usuário já é premium, não mostra nenhum distintivo/diamante
    if (isPremium) return null;

    const feature = getFeatureForRoute(path);
    if (!feature || hasPermission(feature)) return null;
    return <PremiumBadge variant={isVipFeature(feature) ? "vip" : "premium"} className="ml-auto" />;
  };

  const supportWhatsApp = "https://wa.me/5516997175392?text=Olá! Preciso de ajuda com o Palpite Tech.";

  const LotteryAccordion = ({ name, color, tools }: { name: string, color: string, tools: any[] }) => (
    <div className="mx-4 p-1 rounded-r-md border-l-4 mb-3" style={{ borderLeftColor: color, backgroundColor: `${color}0A` }}>
      <Accordion type="single" collapsible>
        <AccordionItem value="tools" className="border-none">
          <AccordionTrigger className="py-3 text-base hover:no-underline hover:text-primary">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 stroke-[1.5]" />
              <span>{name}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <div className="pl-8 space-y-0">
              {tools.map((tool, idx) => (
                <div key={tool.to}>
                  {idx > 0 && tool.bold && <div className="border-t border-border/50 my-1" />}
                  <Link 
                    to={tool.to} 
                    onClick={(e) => tool.gated ? handleGatedClick(e, tool.to) : closeAndNavigate()}
                  >
                    <div className={cn(
                      "py-2.5 text-[15px] flex items-center gap-2 transition-colors",
                      tool.bold ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                    )}>
                      {tool.icon && <tool.icon className="h-4 w-4" />}
                      {tool.label}
                      {tool.gated && renderBadge(tool.to)}
                    </div>
                  </Link>
                  {idx === 0 && <div className="border-t border-border/50 my-1" />}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col z-[110]" hideCloseButton>
          <SheetHeader className="sr-only">
            <SheetTitle>Menu Principal</SheetTitle>
          </SheetHeader>

          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <button onClick={() => onOpenChange(false)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-base">
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </button>

            {isAuthenticated ? (
              <Link to="/perfil/dados" onClick={closeAndNavigate}>
                <div className="flex flex-col items-end gap-0.5 hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-2">
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
                  {profile?.status_assinatura === "ativa" ? (
                    <span className="text-[10px] text-primary font-medium uppercase tracking-wider">Premium</span>
                  ) : profile?.trial_used ? (
                    <span className="text-[10px] text-destructive font-medium uppercase tracking-wider">Teste Vencido</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Plano Free</span>
                  )}
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

          <div className="flex-1 overflow-y-auto">
            <nav className="px-4 py-6 space-y-1">
              <Link to="/home" onClick={closeAndNavigate}>
                <div className="flex items-center gap-3 py-3 text-base text-foreground hover:text-primary transition-colors">
                  <Home className="h-5 w-5 stroke-[1.5]" />
                  Início
                </div>
              </Link>
              <Link to="/chat" onClick={closeAndNavigate}>
                <div className={cn("flex items-center gap-3 py-3 text-base transition-colors", isActive("/chat") ? "text-primary font-medium" : "text-foreground hover:text-primary")}>
                  <MessageCircle className="h-5 w-5 stroke-[1.5]" />
                  Chat IA
                </div>
              </Link>
            </nav>

            <LotteryAccordion 
              name="Lotofácil" 
              color="hsl(270, 60%, 50%)" 
              tools={[
                { to: "/lotofacil", label: "Ver Todas", gated: false, bold: true },
                { to: "/analise-do-dia", label: "Análise do Dia", icon: Target, gated: true },
                { to: "/resultados", label: "Resultados", gated: false },
                { to: "/smart-gerador", label: "Gerador", icon: Dices, gated: true },
                { to: "/desdobramento", label: "Desdobramento", icon: Shuffle, gated: true },
                { to: "/fechamento", label: "Fechamento", icon: LayoutGrid, gated: true },
              ]} 
            />

            <LotteryAccordion 
              name="Mega Sena" 
              color="hsl(145, 63%, 42%)" 
              tools={[
                { to: "/megasena", label: "Ver Todas", gated: false, bold: true },
                { to: "/megasena/analise-do-dia", label: "Análise do Dia", icon: Target, gated: true },
                { to: "/megasena/resultados", label: "Resultados", gated: false },
                { to: "/megasena/gerador", label: "Gerador", icon: Dices, gated: true },
              ]} 
            />

            <LotteryAccordion 
              name="Dupla Sena" 
              color="hsl(0, 75%, 55%)" 
              tools={[
                { to: "/duplasena", label: "Ver Todas", gated: false, bold: true },
                { to: "/duplasena/analise-do-dia", label: "Análise do Dia", icon: Target, gated: true },
                { to: "/duplasena/resultados", label: "Resultados", gated: false },
                { to: "/duplasena/gerador", label: "Gerador", icon: Dices, gated: true },
              ]} 
            />

            <LotteryAccordion 
              name="Quina" 
              color="hsl(210, 80%, 45%)" 
              tools={[
                { to: "/quina", label: "Ver Todas", gated: false, bold: true },
                { to: "/quina/analise-do-dia", label: "Análise do Dia", icon: Target, gated: true },
                { to: "/quina/resultados", label: "Resultados", gated: false },
                { to: "/quina/gerador", label: "Gerador", icon: Dices, gated: true },
              ]} 
            />

            <div className="px-4 pt-4 border-t border-border/30 space-y-3">
              <Link to="/diadesorte/resultados" onClick={closeAndNavigate}>
                <div className="py-2.5 text-base text-muted-foreground hover:text-foreground transition-colors">Dia de Sorte</div>
              </Link>
              <Link to="/lotomania/resultados" onClick={closeAndNavigate}>
                <div className="py-2.5 text-base text-muted-foreground hover:text-foreground transition-colors">Lotomania</div>
              </Link>
            </div>
          </div>

          <div className="mt-auto px-4 py-4 border-t border-border/30 space-y-3 bg-secondary/20">
            <Link to="/convites" onClick={closeAndNavigate}>
              <div className="flex items-center gap-2 text-primary font-semibold text-base">
                <Gift className="h-5 w-5" />
                Ganhar Assinatura Grátis
              </div>
            </Link>

            <a href={supportWhatsApp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-base">
              <MessageCircle className="h-5 w-5" />
              Suporte WhatsApp
            </a>

            {isAuthenticated && (
              <button onClick={handleSignOut} className="flex items-center gap-2 text-muted-foreground hover:text-destructive text-base w-full text-left">
                <LogOut className="h-5 w-5" />
                Sair
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
