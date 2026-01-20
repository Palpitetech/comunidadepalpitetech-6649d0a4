import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, Users, BarChart3, Bell, LogOut, User, PlusCircle } from "lucide-react";

export function DesktopHeader() {
  const { isAuthenticated, profile, signOut } = useAuthContext();

  const handleSignOut = async () => {
    try {
      await signOut();
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container-senior flex items-center justify-between py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <span className="text-3xl">🍀</span>
          <span className="text-senior-xl font-bold text-primary">Palpite Tech</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" className="text-senior-base gap-2 h-12">
              <Home className="h-5 w-5" />
              Início
            </Button>
          </Link>
          <Link to="/comunidade">
            <Button variant="ghost" className="text-senior-base gap-2 h-12">
              <Users className="h-5 w-5" />
              Comunidade
            </Button>
          </Link>
          <Link to="/resultados">
            <Button variant="ghost" className="text-senior-base gap-2 h-12">
              <BarChart3 className="h-5 w-5" />
              Resultados
            </Button>
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Criar Post */}
              <Link to="/criar-post">
                <Button className="h-12 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <PlusCircle className="h-5 w-5" />
                  Criar Post
                </Button>
              </Link>

              {/* Notificações */}
              <Link to="/notificacoes">
                <Button variant="ghost" size="icon" className="h-12 w-12">
                  <Bell className="h-6 w-6" />
                </Button>
              </Link>

              {/* Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-12 w-12 rounded-full">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-senior-base">
                        {getInitials(profile?.nome)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-senior-base font-medium">{profile?.nome || "Usuário"}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {profile?.celular || "Sem celular"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="text-senior-base gap-2 py-3 cursor-pointer">
                    <Link to="/perfil">
                      <User className="h-5 w-5" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-senior-base gap-2 py-3 cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/login">
              <Button className="btn-senior bg-accent hover:bg-accent/90 text-accent-foreground">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
