import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  TrendingUp,
  Flame,
  MessageCircle,
  Mail,
  Lock,
  CreditCard,
  LogOut,
  Home,
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
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 text-left">
          <SheetTitle className="sr-only">Menu Principal</SheetTitle>
          
          {/* Bloco Perfil */}
          {isAuthenticated ? (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(profile?.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-senior-lg font-semibold">{profile?.nome || "Usuário"}</p>
                <Badge variant="secondary" className="mt-1">
                  Grátis
                </Badge>
              </div>
              
              {/* Botões do Perfil */}
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                <Link to="/perfil" onClick={closeAndNavigate}>
                  <Button variant="outline" size="sm" className="h-10 gap-2">
                    <Mail className="h-4 w-4" />
                    Alterar E-mail
                  </Button>
                </Link>
                <Link to="/recuperar-senha" onClick={closeAndNavigate}>
                  <Button variant="outline" size="sm" className="h-10 gap-2">
                    <Lock className="h-4 w-4" />
                    Trocar Senha
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="h-10 gap-2">
                  <CreditCard className="h-4 w-4" />
                  Assinatura
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                  ?
                </AvatarFallback>
              </Avatar>
              <p className="text-senior-base text-muted-foreground">Você não está logado</p>
              <Link to="/login" onClick={closeAndNavigate}>
                <Button className="btn-senior bg-accent hover:bg-accent/90 text-accent-foreground">
                  Entrar na conta
                </Button>
              </Link>
            </div>
          )}
        </SheetHeader>

        <Separator />

        {/* Bloco Navegação */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-3 mb-3">
              Navegação
            </p>
            
            <Link to="/" onClick={closeAndNavigate}>
              <Button variant="ghost" className="w-full justify-start h-14 text-senior-base gap-3">
                <Home className="h-6 w-6" />
                Início
              </Button>
            </Link>
          </div>

          <Separator className="my-4" />

          {/* Bloco Ferramentas de Análise */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-3 mb-3">
              📊 Ferramentas de Análise
            </p>
            
            <Link to="/resultados" onClick={closeAndNavigate}>
              <Button variant="ghost" className="w-full justify-start h-14 text-senior-base gap-3">
                <BarChart3 className="h-6 w-6" />
                Resultados Completos
              </Button>
            </Link>
            
            <Link to="/tendencias" onClick={closeAndNavigate}>
              <Button variant="ghost" className="w-full justify-start h-14 text-senior-base gap-3">
                <TrendingUp className="h-6 w-6" />
                Tendências
              </Button>
            </Link>
            
            <Link to="/frequencia" onClick={closeAndNavigate}>
              <Button variant="ghost" className="w-full justify-start h-14 text-senior-base gap-3">
                <Flame className="h-6 w-6" />
                Dezenas Quentes e Frias
              </Button>
            </Link>
          </div>
        </div>

        <Separator />

        {/* Bloco Suporte */}
        <div className="p-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground px-3">
            📞 Precisa de Ajuda?
          </p>
          
          <a
            href={supportWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full h-14 text-senior-base gap-3 bg-accent hover:bg-accent/90 text-accent-foreground">
              <MessageCircle className="h-6 w-6" />
              WhatsApp (16) 99717-5392
            </Button>
          </a>

          {isAuthenticated && (
            <Button
              variant="ghost"
              className="w-full h-12 text-senior-base gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sair da conta
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
