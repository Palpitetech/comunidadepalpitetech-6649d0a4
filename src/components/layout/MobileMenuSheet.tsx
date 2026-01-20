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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronRight,
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

        {/* Botão Voltar */}
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full justify-start h-14 text-senior-base gap-3"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar para tela anterior
          </Button>
        </div>

        {/* Bloco Perfil Clicável */}
        <div className="p-4 border-b">
          {isAuthenticated ? (
            <Link to="/perfil" onClick={closeAndNavigate}>
              <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getInitials(profile?.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-senior-base font-semibold truncate">{profile?.nome || "Usuário"}</p>
                  <Badge variant="secondary" className="mt-1">Grátis</Badge>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          ) : (
            <Link to="/login" onClick={closeAndNavigate}>
              <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-muted text-muted-foreground text-lg">?</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-senior-base text-muted-foreground">Entrar na conta</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          )}
        </div>

        {/* Navegação Fixa + Accordion de Ferramentas */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Itens Fixos de Navegação */}
          <div className="space-y-2 mb-6">
            <Link to="/" onClick={closeAndNavigate}>
              <Button variant="ghost" className="w-full justify-start h-14 text-senior-base gap-3">
                <Home className="h-6 w-6" />
                Início
              </Button>
            </Link>
            <Link to="/comunidade" onClick={closeAndNavigate}>
              <Button variant="ghost" className="w-full justify-start h-14 text-senior-base gap-3">
                <Users className="h-6 w-6" />
                Comunidade
              </Button>
            </Link>
          </div>

          {/* Dropdown de Ferramentas de Análise */}
          <Accordion type="single" collapsible defaultValue="ferramentas">
            <AccordionItem value="ferramentas" className="border rounded-lg px-2">
              <AccordionTrigger className="text-senior-base py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5" />
                  Ferramentas de Análise
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <Link to="/resultados" onClick={closeAndNavigate}>
                  <Button variant="ghost" className="w-full justify-start h-12 text-senior-base gap-3 pl-8">
                    <BarChart3 className="h-5 w-5" />
                    Resultados Completos
                  </Button>
                </Link>
                <Link to="/tendencias" onClick={closeAndNavigate}>
                  <Button variant="ghost" className="w-full justify-start h-12 text-senior-base gap-3 pl-8">
                    <TrendingUp className="h-5 w-5" />
                    Tendências
                  </Button>
                </Link>
                <Link to="/frequencia" onClick={closeAndNavigate}>
                  <Button variant="ghost" className="w-full justify-start h-12 text-senior-base gap-3 pl-8">
                    <Flame className="h-5 w-5" />
                    Quentes e Frias
                  </Button>
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Suporte Minimalista no Rodapé */}
        <div className="mt-auto p-4 border-t space-y-2">
          <a
            href={supportWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-senior-base py-2 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Suporte via WhatsApp
          </a>

          {isAuthenticated && (
            <Button
              variant="ghost"
              className="w-full justify-start h-10 text-sm gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
