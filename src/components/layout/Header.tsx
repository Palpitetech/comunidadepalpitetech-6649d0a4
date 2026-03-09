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
import { Home, Users, BarChart3, LogOut, User, Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { isAuthenticated, profile, signOut } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <img src="/logo.png" alt="Palpite Tech" className="h-9 w-9 rounded-md" />
          <span className="text-senior-xl font-bold text-primary hidden sm:inline">Palpite Tech</span>
          <span className="text-senior-xl font-bold text-primary sm:hidden">Palpite</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
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

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
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
                <DropdownMenuItem className="text-senior-base gap-2 py-3 cursor-pointer">
                  <User className="h-5 w-5" />
                  Meu Perfil
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
          ) : (
          <Link to="/login">
              <Button className="btn-senior bg-accent hover:bg-accent/90 text-accent-foreground">
                Entrar
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-12 w-12"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-card p-4 space-y-2">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-senior-base gap-3 h-14">
              <Home className="h-6 w-6" />
              Início
            </Button>
          </Link>
          <Link to="/comunidade" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-senior-base gap-3 h-14">
              <Users className="h-6 w-6" />
              Comunidade
            </Button>
          </Link>
          <Link to="/resultados" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-senior-base gap-3 h-14">
              <BarChart3 className="h-6 w-6" />
              Resultados
            </Button>
          </Link>
        </nav>
      )}
    </header>
  );
}
