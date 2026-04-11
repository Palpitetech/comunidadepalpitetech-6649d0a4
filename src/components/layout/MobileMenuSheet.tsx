import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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
