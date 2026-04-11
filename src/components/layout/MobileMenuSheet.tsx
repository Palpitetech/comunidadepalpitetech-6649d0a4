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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Target, Table2, Flame, Gift, ArrowLeft, Home, 
  BarChart3, MessageCircle, LogOut, Dices, Shuffle, 
  LayoutGrid, Grid3X3, TrendingUp, TrendingDown,
  User, CreditCard, Ticket, Lock, Save, Calendar, 
  ChevronRight, Info
} from "lucide-react";
import { 
  LOTOFACIL_TOOLS, 
  MEGASENA_TOOLS, 
  DUPLASENA_TOOLS, 
  QUINA_TOOLS,
  SIMPLE_LOTTERIES,
  ToolItem
} from "./DesktopHeader";


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
    <div className="mx-4 border-b border-border/40">
      <Accordion type="single" collapsible>
        <AccordionItem value="tools" className="border-none">
          <AccordionTrigger className="py-3.5 text-sm hover:no-underline font-medium">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: color }} />
              <span>{name}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="pl-4 space-y-1">
              {tools.map((tool, idx) => (
                <Link 
                  key={tool.to}
                  to={tool.to} 
                  onClick={(e) => tool.gated ? handleGatedClick(e, tool.to) : closeAndNavigate()}
                >
                  <div className={cn(
                    "py-2.5 text-sm flex items-center justify-between transition-colors",
                    tool.bold ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  )}>
                    <div className="flex items-center gap-3">
                      {tool.icon && <tool.icon className="h-4 w-4 stroke-[1.5]" />}
                      {tool.label}
                    </div>
                    {tool.gated && renderBadge(tool.to)}
                  </div>
                </Link>
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

          <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
            <button onClick={() => onOpenChange(false)} className="flex items-center gap-2 text-muted-foreground/60 hover:text-foreground transition-colors text-sm font-medium">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-end gap-0.5 hover:opacity-80 transition-opacity">
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
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-popover z-[120]">
                  <div className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold">{profile?.nome || "Usuário"}</p>
                      {profile?.status_assinatura === "ativa" ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">Premium</Badge>
                      ) : profile?.trial_used ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-destructive/10 text-destructive border-destructive/20 whitespace-nowrap">Teste Vencido</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-muted-foreground/20">Plano Free</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {profile?.celular || "Sem celular"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base" onClick={() => onOpenChange(false)}>
                    <Link to="/perfil/dados"><User className="h-5 w-5" />Dados</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base" onClick={() => onOpenChange(false)}>
                    <Link to="/perfil/transacoes"><CreditCard className="h-5 w-5" />Transações</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base" onClick={() => onOpenChange(false)}>
                    <Link to="/perfil/assinatura"><Ticket className="h-5 w-5" />Assinatura</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base" onClick={() => onOpenChange(false)}>
                    <Link to="/perfil/seguranca"><Lock className="h-5 w-5" />Segurança</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base" onClick={() => onOpenChange(false)}>
                    <Link to="/convites"><Gift className="h-5 w-5" />Convidar Amigos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-3 py-3 cursor-pointer text-base text-destructive focus:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5" />Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            <nav className="px-6 py-4 space-y-1">
              <Link to="/home" onClick={closeAndNavigate}>
                <div className={cn("flex items-center gap-3 py-3 px-2 rounded-lg text-sm transition-all active:scale-95", isActive("/home") ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground")}>
                  <Home className="h-4 w-4 stroke-[1.5]" />
                  Página Inicial
                </div>
              </Link>
              <Link to="/meus-palpites" onClick={closeAndNavigate}>
                <div className={cn("flex items-center gap-3 py-3 px-2 rounded-lg text-sm transition-all active:scale-95", isActive("/meus-palpites") ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground")}>
                  <Save className="h-4 w-4 stroke-[1.5]" />
                  Palpites Salvos
                </div>
              </Link>
              <Link to="/proximos-concursos" onClick={closeAndNavigate}>
                <div className={cn("flex items-center gap-3 py-3 px-2 rounded-lg text-sm transition-all active:scale-95", isActive("/proximos-concursos") ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground")}>
                  <Calendar className="h-4 w-4 stroke-[1.5]" />
                  Concursos
                </div>
              </Link>
            </nav>

            <LotteryAccordion 
              name="Lotofácil" 
              color="hsl(270, 60%, 50%)" 
              tools={LOTOFACIL_TOOLS} 
            />

            <LotteryAccordion 
              name="Mega Sena" 
              color="hsl(145, 63%, 42%)" 
              tools={MEGASENA_TOOLS} 
            />

            <LotteryAccordion 
              name="Dupla Sena" 
              color="hsl(0, 75%, 55%)" 
              tools={DUPLASENA_TOOLS} 
            />

            <LotteryAccordion 
              name="Quina" 
              color="hsl(210, 80%, 45%)" 
              tools={QUINA_TOOLS} 
            />

            <div className="px-4 pt-4 border-t border-border/30 space-y-3">
              {SIMPLE_LOTTERIES.map((lottery) => (
                <Link key={lottery.name} to={lottery.resultsPath} onClick={closeAndNavigate}>
                  <div className="py-2.5 text-base text-muted-foreground hover:text-foreground transition-colors">
                    {lottery.name}
                  </div>
                </Link>
              ))}
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
