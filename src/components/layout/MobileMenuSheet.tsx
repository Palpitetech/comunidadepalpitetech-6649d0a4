import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
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
  MessageCircle,
  LogOut,
  FileText,
  Bot,
} from "lucide-react";

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const { isAuthenticated, profile, signOut } = useAuthContext();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const [menuMode, setMenuMode] = useState<"ferramentas" | "admin">(
    location.pathname.startsWith('/admin') ? "admin" : "ferramentas"
  );

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

        {/* Toggle Ferramentas/Admin - Apenas para Admins */}
        {isAdmin && (
          <div className="px-4 pt-4 mb-2">
            <div className="flex rounded-lg p-1 bg-muted/50">
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
                  ${menuMode === "ferramentas" 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setMenuMode("ferramentas")}
              >
                Ferramentas
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
                  ${menuMode === "admin" 
                    ? "bg-red-500 text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setMenuMode("admin")}
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {/* Corpo do Menu - Condicional */}
        <div className="flex-1 overflow-y-auto">
          {menuMode === "ferramentas" ? (
            <>
              {/* Itens Fixos de Navegação */}
              <nav className="px-4 py-6 space-y-1">
                <Link to="/" onClick={closeAndNavigate}>
                  <div className="flex items-center gap-3 py-3 text-base text-foreground hover:text-primary transition-colors">
                    <Home className="h-5 w-5 stroke-[1.5]" />
                    Início
                  </div>
                </Link>
                <Link to="/comunidade" onClick={closeAndNavigate}>
                  <div className="flex items-center gap-3 py-3 text-base text-foreground hover:text-primary transition-colors">
                    <Users className="h-5 w-5 stroke-[1.5]" />
                    Comunidade
                  </div>
                </Link>
              </nav>

              {/* Accordion de Ferramentas de Análise */}
              <div className="px-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="ferramentas" className="border-none">
                    <AccordionTrigger className="py-3 text-base hover:no-underline hover:text-primary">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 stroke-[1.5]" />
                        <span>Ferramentas de Análise</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="pl-8 space-y-0">
                        <Link to="/resultados" onClick={closeAndNavigate}>
                          <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                            Resultados
                          </div>
                        </Link>
                        <Link to="/tendencias" onClick={closeAndNavigate}>
                          <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                            Tendências
                          </div>
                        </Link>
                        <Link to="/frequencia" onClick={closeAndNavigate}>
                          <div className="py-2.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                            Quentes e Frias
                          </div>
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </>
          ) : (
            /* Conteúdo Admin - Estilo com Destaque Vermelho */
            <div className="mx-4 mt-2 p-3 rounded-r-md bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500">
              <nav className="space-y-1">
                <Link to="/admin/planos" onClick={closeAndNavigate}>
                  <div className="flex items-center gap-3 py-3 text-base text-foreground hover:text-red-600 transition-colors">
                    <FileText className="h-5 w-5 stroke-[1.5]" />
                    Planos
                  </div>
                </Link>
                <Link to="/admin/usuarios" onClick={closeAndNavigate}>
                  <div className="flex items-center gap-3 py-3 text-base text-foreground hover:text-red-600 transition-colors">
                    <Users className="h-5 w-5 stroke-[1.5]" />
                    Usuários
                  </div>
                </Link>
                <Link to="/admin/bots" onClick={closeAndNavigate}>
                  <div className="flex items-center gap-3 py-3 text-base text-foreground hover:text-red-600 transition-colors">
                    <Bot className="h-5 w-5 stroke-[1.5]" />
                    Bots
                  </div>
                </Link>
              </nav>
            </div>
          )}
        </div>

        {/* Rodapé Minimalista */}
        <div className="mt-auto px-4 py-4 border-t border-border/30 space-y-3">
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
  );
}
