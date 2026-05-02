import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Gift, ArrowLeft, MessageCircle, LogOut, ChevronRight,
  User, CreditCard, Ticket, Lock, Crown,
} from "lucide-react";
import { AppVersion } from "./AppVersion";

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LotteryItem = {
  name: string;
  to: string;
  /** HSL string like "270 60% 50%" */
  color: string;
};

const LOTTERIES: LotteryItem[] = [
  { name: "Lotofácil",   to: "/lotofacil",  color: "270 60% 50%" },
  { name: "Mega Sena",   to: "/megasena",   color: "145 63% 42%" },
  { name: "Dupla Sena",  to: "/duplasena",  color: "0 75% 55%"   },
  { name: "Quina",       to: "/quina",      color: "210 80% 45%" },
  { name: "Dia de Sorte",to: "/diadesorte", color: "45 95% 55%"  },
  { name: "Lotomania",   to: "/lotomania",  color: "25 90% 55%"  },
];

const SUPPORT_WHATSAPP =
  "https://wa.me/5551981854281?text=Olá! Preciso de ajuda com o Palpite Tech.";

function MenuCard({
  to,
  href,
  color,
  name,
  IconCmp,
  onClick,
}: {
  to?: string;
  href?: string;
  color: string;
  name: string;
  IconCmp: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border-l-4 shadow-sm",
        "bg-card transition-all duration-150 active:scale-[0.98] hover:shadow-md",
      )}
      style={{
        borderLeftColor: `hsl(${color})`,
        backgroundColor: `hsl(${color} / 0.05)`,
      }}
    >
      <div
        className="flex items-center justify-center rounded-lg shrink-0"
        style={{
          width: 44,
          height: 44,
          backgroundColor: `hsl(${color})`,
        }}
      >
        <IconCmp className="h-5 w-5 text-white" />
      </div>
      <span className="flex-1 text-[17px] font-semibold text-foreground">
        {name}
      </span>
      <ChevronRight
        className="h-5 w-5 shrink-0"
        style={{ color: `hsl(${color})` }}
      />
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {content}
      </a>
    );
  }
  return (
    <Link to={to!} onClick={onClick}>
      {content}
    </Link>
  );
}

export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const { isAuthenticated, profile, signOut } = useAuthContext();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);

  const close = () => onOpenChange(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      close();
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const getInitials = (nome: string | null | undefined) => {
    if (!nome) return "U";
    return nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isPremium = profile?.status_assinatura === "ativa";
  const isExpired = !isPremium && profile?.trial_used;

  const statusDot = isPremium
    ? "bg-primary"
    : isExpired
    ? "bg-destructive"
    : "bg-muted-foreground/40";

  const statusLabel = isPremium
    ? "Plano Premium"
    : isExpired
    ? "Plano expirado"
    : "Plano Free";

  const statusTextColor = isPremium
    ? "text-primary"
    : isExpired
    ? "text-destructive"
    : "text-muted-foreground";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col z-[110] bg-background"
          hideCloseButton
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu Principal</SheetTitle>
          </SheetHeader>

          {/* Top bar: Voltar */}
          <div
            className="flex items-center px-4 pb-3"
            style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
          >
            <button
              onClick={close}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors text-base font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {/* User Card */}
            {isAuthenticated ? (
              <div className="bg-card rounded-xl shadow-sm p-4 mb-6 border border-border/40">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 shrink-0">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {getInitials(profile?.nome)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="text-[18px] font-bold text-foreground truncate leading-tight">
                        {profile?.nome?.split(" ")[0] || "Usuário"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={cn("h-2 w-2 rounded-full", statusDot)} />
                        <span className={cn("text-sm font-medium", statusTextColor)}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProfileExpanded(!profileExpanded)}
                      className="shrink-0"
                    >
                      <ChevronRight className={cn("h-5 w-5 transition-transform", profileExpanded && "rotate-90")} />
                    </Button>
                  </div>

                  {profileExpanded && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Link to="/perfil/dados" onClick={close} className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 text-sm font-medium">
                        <User className="h-4 w-4 text-primary" /> Dados
                      </Link>
                      <Link to="/perfil/transacoes" onClick={close} className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 text-sm font-medium">
                        <CreditCard className="h-4 w-4 text-primary" /> Transações
                      </Link>
                      <Link to="/perfil/assinatura" onClick={close} className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 text-sm font-medium">
                        <Ticket className="h-4 w-4 text-primary" /> Assinatura
                      </Link>
                      <Link to="/perfil/seguranca" onClick={close} className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 text-sm font-medium">
                        <Lock className="h-4 w-4 text-primary" /> Segurança
                      </Link>
                      <Link to="/convites" onClick={close} className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 text-sm font-medium col-span-2">
                        <Gift className="h-4 w-4 text-primary" /> Convidar Amigos
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 text-destructive text-sm font-medium col-span-2"
                      >
                        <LogOut className="h-4 w-4" /> Sair da conta
                      </button>
                    </div>
                  )}
                </div>

                {!isPremium && (
                  <Link to="/perfil/assinatura" onClick={close} className="block mt-3">
                    <Button
                      className="w-full h-11 text-[15px] font-semibold gap-2"
                      variant="destructive"
                    >
                      <Crown className="h-4 w-4" />
                      {isExpired ? "Renovar acesso" : "Assinar agora"}
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Link to="/login" onClick={close}>
                <div className="bg-card rounded-xl shadow-sm p-4 mb-6 border border-border/40 flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-muted text-muted-foreground text-lg">?</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-[18px] font-bold text-foreground">Entrar</p>
                    <p className="text-sm text-muted-foreground">Acesse sua conta</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            )}

            {/* LOTERIAS */}
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Loterias
            </h3>
            <div className="flex flex-col gap-2.5 mb-6">
              {LOTTERIES.map((l) => (
                <MenuCard
                  key={l.to}
                  to={l.to}
                  color={l.color}
                  name={l.name}
                  IconCmp={Ticket}
                  onClick={close}
                />
              ))}
            </div>

            {/* BENEFÍCIOS */}
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Benefícios
            </h3>
            <div className="flex flex-col gap-2.5">
              <MenuCard
                to="/convites"
                color="270 60% 50%"
                name="Ganhar Assinatura Grátis"
                IconCmp={Gift}
                onClick={close}
              />
              <MenuCard
                href={SUPPORT_WHATSAPP}
                color="142 70% 40%"
                name="Suporte WhatsApp"
                IconCmp={MessageCircle}
                onClick={close}
              />
            </div>

            {/* Rodapé */}
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Seus dados estão protegidos
              </div>
              <AppVersion className="w-full max-w-[200px]" />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
