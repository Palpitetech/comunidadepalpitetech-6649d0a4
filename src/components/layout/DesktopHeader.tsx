import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

import { usePermissions } from "@/hooks/usePermission";
import { getFeatureForRoute, isVipFeature } from "@/lib/featureMap";
import { PremiumBadge } from "@/components/shared/PremiumBadge";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { FEATURE_LABELS } from "@/types/plans";
import type { FeatureKey } from "@/types/plans";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Users, BarChart3, Bell, LogOut, User, Wrench, TrendingUp, Flame, ChevronDown, Dices, Shuffle, Ticket, LayoutGrid, Target, Table2, Gift, Lock, CreditCard, Calendar, Save } from "lucide-react";

export function DesktopHeader() {
  const { isAuthenticated, profile, signOut } = useAuthContext();
  const { isAdmin } = useUserRole();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeLabel, setUpgradeLabel] = useState<string | undefined>();
  const [upgradeVariant, setUpgradeVariant] = useState<"premium" | "vip">("premium");

  const handleGatedClick = (e: React.MouseEvent, path: string) => {
    const feature = getFeatureForRoute(path);
    if (feature && !hasPermission(feature)) {
      e.preventDefault();
      e.stopPropagation();
      setUpgradeLabel(FEATURE_LABELS[feature]);
      setUpgradeVariant(isVipFeature(feature) ? "vip" : "premium");
      setUpgradeOpen(true);
    }
  };

  const renderBadge = (path: string) => {
    const feature = getFeatureForRoute(path);
    if (!feature || hasPermission(feature)) return null;
    return <Lock className="h-3 w-3 text-muted-foreground/60 ml-auto" />;
  };

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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 overflow-x-hidden">
      <div className="container-senior flex items-center justify-between py-3 gap-2">
        {/* Logo - Compacto */}
        <Link to="/home" className="flex items-center gap-2 no-underline shrink-0">
          <img src="/logo.png" alt="Palpite Tech" className="h-8 w-8 rounded-md" />
          <span className="text-lg font-bold text-primary hidden sm:inline">Palpite Tech</span>
        </Link>

        {/* Desktop Navigation - Compacto */}
        <nav className="flex items-center gap-1">
          <Link to="/comunidade">
            <Button variant="ghost" className="gap-1.5 h-10 px-3 text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Comunidade</span>
            </Button>
          </Link>
          <Link to="/proximos-concursos">
            <Button variant="ghost" className="gap-1.5 h-10 px-3 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline">Próximos Concursos</span>
            </Button>
          </Link>

          {/* Loterias Dropdown com Submenus */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1.5 h-10 px-3 text-sm">
                <Ticket className="h-4 w-4" />
                Loterias
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 p-1 bg-popover z-50">
              {/* Lotofácil Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 py-2 cursor-pointer">
                  <BarChart3 className="h-4 w-4" />
                  Lotofácil
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-52 bg-popover z-50">
                  <DropdownMenuItem asChild className="gap-3 py-2 cursor-pointer font-semibold">
                    <Link to="/lotofacil">
                      🍀 Ver Todas as Ferramentas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/analise-do-dia")} asChild>
                    <Link to="/analise-do-dia">
                      <Target className="h-4 w-4" />
                      Análise do Dia
                      {renderBadge("/analise-do-dia")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-3 py-2 cursor-pointer">
                    <Link to="/resultados">
                      <BarChart3 className="h-4 w-4" />
                      Resultados
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/tendencias")} asChild>
                    <Link to="/tendencias">
                      <TrendingUp className="h-4 w-4" />
                      Tendências
                      {renderBadge("/tendencias")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/frequencia")} asChild>
                    <Link to="/frequencia">
                      <Flame className="h-4 w-4" />
                      Quentes e Frias
                      {renderBadge("/frequencia")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/frequencia-dezenas")} asChild>
                    <Link to="/frequencia-dezenas">
                      <BarChart3 className="h-4 w-4" />
                      Frequência das Dezenas
                      {renderBadge("/frequencia-dezenas")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/dezenas-por-posicao")} asChild>
                    <Link to="/dezenas-por-posicao">
                      <Target className="h-4 w-4" />
                      Dezenas por Posição
                      {renderBadge("/dezenas-por-posicao")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/linhas-colunas")} asChild>
                    <Link to="/linhas-colunas">
                      <LayoutGrid className="h-4 w-4" />
                      Linhas e Colunas
                      {renderBadge("/linhas-colunas")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/tabela-movimentacao")} asChild>
                    <Link to="/tabela-movimentacao">
                      <Table2 className="h-4 w-4" />
                      Tabela de Movimentação
                      {renderBadge("/tabela-movimentacao")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/smart-gerador")} asChild>
                    <Link to="/smart-gerador">
                      <Dices className="h-4 w-4" />
                      Gerador
                      {renderBadge("/smart-gerador")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/desdobramento")} asChild>
                    <Link to="/desdobramento">
                      <Shuffle className="h-4 w-4" />
                      Desdobramento
                      {renderBadge("/desdobramento")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/fechamento")} asChild>
                    <Link to="/fechamento">
                      <Wrench className="h-4 w-4" />
                      Fechamento
                      {renderBadge("/fechamento")}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

               {/* Mega Sena Submenu */}
               <DropdownMenuSub>
                 <DropdownMenuSubTrigger className="gap-2 py-2 cursor-pointer">
                   <span className="text-base">🎱</span>
                   Mega Sena
                 </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52 bg-popover z-50">
                    <DropdownMenuItem asChild className="gap-3 py-2 cursor-pointer font-semibold">
                      <Link to="/megasena">
                        🍀 Ver Todas as Ferramentas
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/megasena/analise-do-dia")} asChild>
                     <Link to="/megasena/analise-do-dia">
                       <Target className="h-4 w-4" />
                       Análise do Dia
                       {renderBadge("/megasena/analise-do-dia")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem asChild className="gap-3 py-2 cursor-pointer">
                     <Link to="/megasena/resultados">
                       <BarChart3 className="h-4 w-4" />
                       Resultados
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/megasena/tendencias")} asChild>
                     <Link to="/megasena/tendencias">
                       <TrendingUp className="h-4 w-4" />
                       Tendências
                       {renderBadge("/megasena/tendencias")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/megasena/frequencia")} asChild>
                     <Link to="/megasena/frequencia">
                       <Flame className="h-4 w-4" />
                       Quentes e Frias
                       {renderBadge("/megasena/frequencia")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/megasena/frequencia-dezenas")} asChild>
                     <Link to="/megasena/frequencia-dezenas">
                       <BarChart3 className="h-4 w-4" />
                       Frequência das Dezenas
                       {renderBadge("/megasena/frequencia-dezenas")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/megasena/dezenas-por-posicao")} asChild>
                     <Link to="/megasena/dezenas-por-posicao">
                       <Target className="h-4 w-4" />
                       Dezenas por Posição
                       {renderBadge("/megasena/dezenas-por-posicao")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/megasena/linhas-colunas")} asChild>
                     <Link to="/megasena/linhas-colunas">
                       <LayoutGrid className="h-4 w-4" />
                       Linhas e Colunas
                       {renderBadge("/megasena/linhas-colunas")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/megasena/tabela-movimentacao")} asChild>
                     <Link to="/megasena/tabela-movimentacao">
                       <Table2 className="h-4 w-4" />
                       Tabela de Movimentação
                       {renderBadge("/megasena/tabela-movimentacao")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/megasena/gerador")} asChild>
                     <Link to="/megasena/gerador">
                       <Dices className="h-4 w-4" />
                       Gerador
                       {renderBadge("/megasena/gerador")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/megasena/desdobramento")} asChild>
                     <Link to="/megasena/desdobramento">
                       <Shuffle className="h-4 w-4" />
                       Desdobramento
                       {renderBadge("/megasena/desdobramento")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/megasena/fechamento")} asChild>
                     <Link to="/megasena/fechamento">
                       <Wrench className="h-4 w-4" />
                       Fechamento
                       {renderBadge("/megasena/fechamento")}
                     </Link>
                   </DropdownMenuItem>
                 </DropdownMenuSubContent>
               </DropdownMenuSub>

               {/* Dupla Sena Submenu */}
               <DropdownMenuSub>
                 <DropdownMenuSubTrigger className="gap-2 py-2 cursor-pointer">
                   <span className="text-base">🎯</span>
                   Dupla Sena
                 </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52 bg-popover z-50">
                    <DropdownMenuItem asChild className="gap-3 py-2 cursor-pointer font-semibold">
                      <Link to="/duplasena">
                        🍀 Ver Todas as Ferramentas
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/duplasena/analise-do-dia")} asChild>
                     <Link to="/duplasena/analise-do-dia">
                       <Target className="h-4 w-4" />
                       Análise do Dia
                       {renderBadge("/duplasena/analise-do-dia")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem asChild className="gap-3 py-2 cursor-pointer">
                     <Link to="/duplasena/resultados">
                       <BarChart3 className="h-4 w-4" />
                       Resultados
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/duplasena/tendencias")} asChild>
                     <Link to="/duplasena/tendencias">
                       <TrendingUp className="h-4 w-4" />
                       Tendências
                       {renderBadge("/duplasena/tendencias")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/duplasena/frequencia")} asChild>
                     <Link to="/duplasena/frequencia">
                       <Flame className="h-4 w-4" />
                       Quentes e Frias
                       {renderBadge("/duplasena/frequencia")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/duplasena/frequencia-dezenas")} asChild>
                     <Link to="/duplasena/frequencia-dezenas">
                       <BarChart3 className="h-4 w-4" />
                       Frequência das Dezenas
                       {renderBadge("/duplasena/frequencia-dezenas")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/duplasena/dezenas-por-posicao")} asChild>
                     <Link to="/duplasena/dezenas-por-posicao">
                       <Target className="h-4 w-4" />
                       Dezenas por Posição
                       {renderBadge("/duplasena/dezenas-por-posicao")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/duplasena/linhas-colunas")} asChild>
                     <Link to="/duplasena/linhas-colunas">
                       <LayoutGrid className="h-4 w-4" />
                       Linhas e Colunas
                       {renderBadge("/duplasena/linhas-colunas")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/duplasena/tabela-movimentacao")} asChild>
                     <Link to="/duplasena/tabela-movimentacao">
                       <Table2 className="h-4 w-4" />
                       Tabela de Movimentação
                       {renderBadge("/duplasena/tabela-movimentacao")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/duplasena/gerador")} asChild>
                     <Link to="/duplasena/gerador">
                       <Dices className="h-4 w-4" />
                       Gerador
                       {renderBadge("/duplasena/gerador")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/duplasena/desdobramento")} asChild>
                     <Link to="/duplasena/desdobramento">
                       <Shuffle className="h-4 w-4" />
                       Desdobramento
                       {renderBadge("/duplasena/desdobramento")}
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={(e) => handleGatedClick(e, "/duplasena/fechamento")} asChild>
                     <Link to="/duplasena/fechamento">
                       <Wrench className="h-4 w-4" />
                       Fechamento
                       {renderBadge("/duplasena/fechamento")}
                     </Link>
                   </DropdownMenuItem>
                 </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                {/* Quina Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 py-2 cursor-pointer">
                     <BarChart3 className="h-4 w-4" />
                    Quina
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52 bg-popover z-50">
                    <DropdownMenuItem asChild className="gap-3 py-2 cursor-pointer">
                      <Link to="/quina/resultados">
                        <BarChart3 className="h-4 w-4" />
                        Resultados
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Dia de Sorte Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 py-2 cursor-pointer">
                     <BarChart3 className="h-4 w-4" />
                    Dia de Sorte
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52 bg-popover z-50">
                    <DropdownMenuItem asChild className="gap-3 py-2 cursor-pointer">
                      <Link to="/diadesorte/resultados">
                        <BarChart3 className="h-4 w-4" />
                        Resultados
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Lotomania Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 py-2 cursor-pointer">
                     <BarChart3 className="h-4 w-4" />
                    Lotomania
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52 bg-popover z-50">
                    <DropdownMenuItem asChild className="gap-3 py-2 cursor-pointer">
                      <Link to="/lotomania/resultados">
                        <BarChart3 className="h-4 w-4" />
                        Resultados
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
             </DropdownMenuContent>
           </DropdownMenu>

        </nav>

        {/* User Actions - Compacto */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Jogos Salvos */}
              <Link to="/meus-palpites">
                <Button variant="ghost" size="icon" className="h-10 w-10" title="Jogos Salvos">
                  <Save className="h-5 w-5" />
                </Button>
              </Link>

              {/* Badge Convites */}
              <Link to="/convites">
                <Button variant="ghost" size="icon" className="h-10 w-10" title="Ganhar Assinatura grátis">
                  <Gift className="h-5 w-5" />
                </Button>
              </Link>

              {/* Notificações */}
              <Link to="/notificacoes">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Bell className="h-5 w-5" />
                </Button>
              </Link>

              {/* Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(profile?.nome)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{profile?.nome || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile?.celular || "Sem celular"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-2 py-2 cursor-pointer">
                    <Link to="/perfil/dados">
                      <User className="h-4 w-4" />
                      Dados
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-2 py-2 cursor-pointer">
                    <Link to="/perfil/transacoes">
                      <CreditCard className="h-4 w-4" />
                      Transações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-2 py-2 cursor-pointer">
                    <Link to="/perfil/assinatura">
                      <Ticket className="h-4 w-4" />
                      Assinatura
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-2 py-2 cursor-pointer">
                    <Link to="/perfil/seguranca">
                      <Lock className="h-4 w-4" />
                      Segurança
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 py-2 cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/login">
              <Button className="h-10 px-4 bg-accent hover:bg-accent/90 text-accent-foreground text-sm">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureLabel={upgradeLabel}
        variant={upgradeVariant}
      />
    </header>
  );
}
