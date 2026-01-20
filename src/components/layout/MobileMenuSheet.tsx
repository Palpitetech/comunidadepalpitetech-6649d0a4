import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
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
  ArrowLeft,
  Home,
  Users,
  BarChart3,
  TrendingUp,
  Flame,
  MessageCircle,
  LogOut,
} from "lucide-react";

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const { isAuthenticated, profile, signOut } = useAuthContext();

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

  const supportWhatsApp = "https://wa.me/5516997175392?text=Olá! Preciso de ajuda com o Palpite Tech.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col" hideCloseButton>
        <SheetHeader className="sr-only">
          <SheetTitle>Menu Principal</SheetTitle>
        </SheetHeader>

        {/* Header Unificado: Voltar + Perfil Compacto */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          {/* Lado Esquerdo: Voltar */}
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[13px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          {/* Lado Direito: Perfil Compacto */}
          {isAuthenticated ? (
            <Link to="/perfil" onClick={closeAndNavigate}>
              <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="text-[13px] font-medium text-foreground">
                  {profile?.nome?.split(' ')[0] || 'Usuário'}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(profile?.nome)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </Link>
          ) : (
            <Link to="/login" onClick={closeAndNavigate}>
              <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="text-[13px] text-muted-foreground">Entrar</span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">?</AvatarFallback>
                </Avatar>
              </div>
            </Link>
          )}
        </div>

        {/* Corpo do Menu */}
        <div className="flex-1 overflow-y-auto">
          {/* Itens Fixos de Navegação */}
          <nav className="px-4 py-6 space-y-1">
            <Link to="/" onClick={closeAndNavigate}>
              <div className="flex items-center gap-3 py-3 text-[13px] text-foreground hover:text-primary transition-colors">
                <Home className="h-[18px] w-[18px] stroke-[1.5]" />
                Início
              </div>
            </Link>
            <Link to="/comunidade" onClick={closeAndNavigate}>
              <div className="flex items-center gap-3 py-3 text-[13px] text-foreground hover:text-primary transition-colors">
                <Users className="h-[18px] w-[18px] stroke-[1.5]" />
                Comunidade
              </div>
            </Link>
          </nav>

          {/* Accordion de Ferramentas de Análise */}
          <div className="px-4">
            <Accordion type="single" collapsible>
              <AccordionItem value="ferramentas" className="border-none">
                <AccordionTrigger className="py-3 text-[13px] hover:no-underline hover:text-primary">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-[18px] w-[18px] stroke-[1.5]" />
                    <span>Ferramentas de Análise</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="pl-7 space-y-0">
                    <Link to="/resultados" onClick={closeAndNavigate}>
                      <div className="py-2.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                        Resultados
                      </div>
                    </Link>
                    <Link to="/tendencias" onClick={closeAndNavigate}>
                      <div className="py-2.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                        Tendências
                      </div>
                    </Link>
                    <Link to="/frequencia" onClick={closeAndNavigate}>
                      <div className="py-2.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                        Quentes e Frias
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
          <a
            href={supportWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-[13px] transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Preciso de Suporte
          </a>

          {isAuthenticated && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-muted-foreground hover:text-destructive text-[13px] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
