import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Home, Users, BarChart3, Bell, LogOut, User, PlusCircle, Wrench, TrendingUp, Flame, ChevronDown, FileText, UserCog, Bot, Dices, Sparkles } from "lucide-react";

export function DesktopHeader() {
  const { isAuthenticated, profile, signOut } = useAuthContext();
  const { isAdmin } = useUserRole();

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-senior-base gap-2 h-12">
                <Wrench className="h-5 w-5" />
                Ferramentas
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64 p-2">
              {isAdmin ? (
                <Tabs defaultValue="ferramentas" className="w-full">
                  <TabsList className="w-full mb-2">
                    <TabsTrigger value="ferramentas" className="flex-1 text-sm">Ferramentas</TabsTrigger>
                    <TabsTrigger value="admin" className="flex-1 text-sm">Admin</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ferramentas" className="mt-0 space-y-1">
                    <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                      <Link to="/palpite-do-dia">
                        <Sparkles className="h-5 w-5" />
                        Análise do Dia
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                      <Link to="/resultados">
                        <BarChart3 className="h-5 w-5" />
                        Resultados
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                      <Link to="/tendencias">
                        <TrendingUp className="h-5 w-5" />
                        Tendências
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                      <Link to="/frequencia">
                        <Flame className="h-5 w-5" />
                        Quentes e Frias
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                      <Link to="/gerador">
                        <Dices className="h-5 w-5" />
                        Gerador de Palpites
                      </Link>
                    </DropdownMenuItem>
                  </TabsContent>
                  <TabsContent value="admin" className="mt-0 space-y-1">
                    <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                      <Link to="/admin">
                        <UserCog className="h-5 w-5" />
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                      <Link to="/admin/planos">
                        <FileText className="h-5 w-5" />
                        Planos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                      <Link to="/admin/usuarios">
                        <Users className="h-5 w-5" />
                        Usuários
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                      <Link to="/admin/bots">
                        <Bot className="h-5 w-5" />
                        Bots
                      </Link>
                    </DropdownMenuItem>
                  </TabsContent>
                </Tabs>
              ) : (
                <>
                  <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                    <Link to="/palpite-do-dia">
                      <Sparkles className="h-5 w-5" />
                      Análise do Dia
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                    <Link to="/resultados">
                      <BarChart3 className="h-5 w-5" />
                      Resultados
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                    <Link to="/tendencias">
                      <TrendingUp className="h-5 w-5" />
                      Tendências
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                    <Link to="/frequencia">
                      <Flame className="h-5 w-5" />
                      Quentes e Frias
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-senior-base gap-3 py-3 cursor-pointer">
                    <Link to="/gerador">
                      <Dices className="h-5 w-5" />
                      Gerador de Palpites
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
