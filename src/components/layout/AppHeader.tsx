import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePermissionContext } from "@/contexts/PermissionContext";
import { ArrowLeft } from "lucide-react";

import { usePermissions } from "@/hooks/usePermission";
import { getFeatureForRoute, isVipFeature } from "@/lib/featureMap";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { FEATURE_LABELS } from "@/types/plans";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3, LogOut, User, Wrench, TrendingUp, Flame,
  ChevronDown, Dices, Shuffle, Ticket, LayoutGrid, Target,
  Table2, Gift, Lock, CreditCard, Calendar, Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Helper: cria os itens de um dropdown de loteria
function LotteryDropdownItem({
  to, icon: Icon, label, onGatedClick, renderBadge,
}: {
  to: string;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  onGatedClick: (e: React.MouseEvent, path: string) => void;
  renderBadge: (path: string) => React.ReactNode;
}) {
  return (
    <DropdownMenuItem className="gap-3 py-3 cursor-pointer text-base" onClick={(e) => onGatedClick(e, to)} asChild>
      <Link to={to}>
        {Icon && <Icon className="h-5 w-5" />}
        {label}
        {renderBadge(to)}
      </Link>
    </DropdownMenuItem>
  );
}

// Dados das loterias com ferramentas completas
export const LOTOFACIL_TOOLS: ToolItem[] = [
  { to: "/lotofacil", label: "Ver Todas as Ferramentas", gated: false, bold: true },
  { to: "/analise-do-dia", label: "Análise do Dia", icon: Target, gated: true },
  { to: "/resultados", label: "Resultados", icon: BarChart3, gated: false },
  { to: "/tendencias", label: "Tendências", icon: TrendingUp, gated: true },
  { to: "/frequencia", label: "Quentes e Frias", icon: Flame, gated: true },
  { to: "/frequencia-dezenas", label: "Frequência das Dezenas", icon: BarChart3, gated: true },
  { to: "/dezenas-por-posicao", label: "Dezenas por Posição", icon: Target, gated: true },
  { to: "/linhas-colunas", label: "Linhas e Colunas", icon: LayoutGrid, gated: true },
  { to: "/tabela-movimentacao", label: "Tabela de Movimentação", icon: Table2, gated: true },
  { to: "/smart-gerador", label: "Gerador", icon: Dices, gated: true },
  { to: "/desdobramento", label: "Desdobramento", icon: Shuffle, gated: true },
  { to: "/fechamento", label: "Fechamento", icon: Wrench, gated: true },
];

export const MEGASENA_TOOLS: ToolItem[] = [
  { to: "/megasena", label: "Ver Todas as Ferramentas", gated: false, bold: true },
  { to: "/megasena/analise-do-dia", label: "Análise do Dia", icon: Target, gated: true },
  { to: "/megasena/resultados", label: "Resultados", icon: BarChart3, gated: false },
  { to: "/megasena/tendencias", label: "Tendências", icon: TrendingUp, gated: true },
  { to: "/megasena/frequencia", label: "Quentes e Frias", icon: Flame, gated: true },
  { to: "/megasena/frequencia-dezenas", label: "Frequência das Dezenas", icon: BarChart3, gated: true },
  { to: "/megasena/dezenas-por-posicao", label: "Dezenas por Posição", icon: Target, gated: true },
  { to: "/megasena/linhas-colunas", label: "Linhas e Colunas", icon: LayoutGrid, gated: true },
  { to: "/megasena/tabela-movimentacao", label: "Tabela de Movimentação", icon: Table2, gated: true },
  { to: "/megasena/gerador", label: "Gerador", icon: Dices, gated: true },
  { to: "/megasena/desdobramento", label: "Desdobramento", icon: Shuffle, gated: true },
  { to: "/megasena/fechamento", label: "Fechamento", icon: Wrench, gated: true },
];

export const DUPLASENA_TOOLS: ToolItem[] = [
  { to: "/duplasena", label: "Ver Todas as Ferramentas", gated: false, bold: true },
  { to: "/duplasena/analise-do-dia", label: "Análise do Dia", icon: Target, gated: true },
  { to: "/duplasena/resultados", label: "Resultados", icon: BarChart3, gated: false },
  { to: "/duplasena/tendencias", label: "Tendências", icon: TrendingUp, gated: true },
  { to: "/duplasena/frequencia", label: "Quentes e Frias", icon: Flame, gated: true },
  { to: "/duplasena/frequencia-dezenas", label: "Frequência das Dezenas", icon: BarChart3, gated: true },
  { to: "/duplasena/dezenas-por-posicao", label: "Dezenas por Posição", icon: Target, gated: true },
  { to: "/duplasena/linhas-colunas", label: "Linhas e Colunas", icon: LayoutGrid, gated: true },
  { to: "/duplasena/tabela-movimentacao", label: "Tabela de Movimentação", icon: Table2, gated: true },
  { to: "/duplasena/gerador", label: "Gerador", icon: Dices, gated: true },
  { to: "/duplasena/desdobramento", label: "Desdobramento", icon: Shuffle, gated: true },
  { to: "/duplasena/fechamento", label: "Fechamento", icon: Wrench, gated: true },
];

export const QUINA_TOOLS: ToolItem[] = [
  { to: "/quina", label: "Ver Todas as Ferramentas", gated: false, bold: true },
  { to: "/quina/analise-do-dia", label: "Análise do Dia", icon: Target, gated: true },
  { to: "/quina/resultados", label: "Resultados", icon: BarChart3, gated: false },
  { to: "/quina/tendencias", label: "Tendências", icon: TrendingUp, gated: true },
  { to: "/quina/frequencia", label: "Quentes e Frias", icon: Flame, gated: true },
  { to: "/quina/frequencia-dezenas", label: "Frequência Dezenas", icon: LayoutGrid, gated: true },
  { to: "/quina/dezenas-posicao", label: "Dezenas por Posição", icon: Target, gated: true },
  { to: "/quina/linhas-colunas", label: "Linhas e Colunas", icon: LayoutGrid, gated: true },
  { to: "/quina/tabela-movimentacao", label: "Tabela Movimentação", icon: Table2, gated: true },
  { to: "/quina/gerador", label: "Gerador", icon: Dices, gated: true },
  { to: "/quina/desdobramento", label: "Desdobramento", icon: Shuffle, gated: true },
];

export const SIMPLE_LOTTERIES = [
  { name: "Dia de Sorte", resultsPath: "/diadesorte/resultados" },
  { name: "Lotomania", resultsPath: "/lotomania/resultados" },
];

export interface ToolItem {
  to: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  gated: boolean;
  bold?: boolean;
}

interface AppHeaderProps {
  pageTitle?: string;
  onBack?: () => void;
  hideBackButton?: boolean;
}

// Mapeamento de rotas para navegação de retorno
const getParentRoute = (pathname: string): string => {
  if (pathname.startsWith("/megasena/")) return "/megasena/resultados";
  if (["/desdobramento", "/fechamento", "/gerador", "/tendencias", "/frequencia"].includes(pathname)) return "/resultados";
  return "/home";
};

function LotteryDropdown({
  name,
  tools,
  handleGatedClick,
  renderBadge,
}: {
  name: string;
  tools: ToolItem[];
  handleGatedClick: (e: React.MouseEvent, path: string) => void;
  renderBadge: (path: string) => React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1 h-9 px-2.5 text-sm">
          {name}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64 p-1 bg-popover z-50 max-h-[70vh] overflow-y-auto">
        {tools.map((tool, idx) => (
          <div key={tool.to}>
            {idx === 1 && <DropdownMenuSeparator />}
            {tool.bold ? (
              <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer font-semibold text-base">
                <Link to={tool.to}>{tool.label}</Link>
              </DropdownMenuItem>
            ) : tool.gated ? (
              <LotteryDropdownItem
                to={tool.to}
                icon={tool.icon}
                label={tool.label}
                onGatedClick={handleGatedClick}
                renderBadge={renderBadge}
              />
            ) : (
              <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base">
                <Link to={tool.to}>
                  {tool.icon && <tool.icon className="h-5 w-5" />}
                  {tool.label}
                </Link>
              </DropdownMenuItem>
            )}
            {idx === 1 && <DropdownMenuSeparator />}
            {idx === 8 && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Dropdown unificado "Loterias" para md (768-1023px) — evita quebra de linha
function LotteriasUnifiedDropdown({
  handleGatedClick,
  renderBadge,
}: {
  handleGatedClick: (e: React.MouseEvent, path: string) => void;
  renderBadge: (path: string) => React.ReactNode;
}) {
  const groups = [
    { name: "Lotofácil", tools: LOTOFACIL_TOOLS },
    { name: "Mega Sena", tools: MEGASENA_TOOLS },
    { name: "Dupla Sena", tools: DUPLASENA_TOOLS },
    { name: "Quina", tools: QUINA_TOOLS },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1 h-9 px-2.5 text-sm">
          Loterias
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56 p-1 bg-popover z-50">
        {groups.map((g) => (
          <DropdownMenuSub key={g.name}>
            <DropdownMenuSubTrigger className="gap-3 py-3 text-base">{g.name}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64 p-1 bg-popover z-50 max-h-[70vh] overflow-y-auto">
              {g.tools.map((tool, idx) => (
                <div key={tool.to}>
                  {idx === 1 && <DropdownMenuSeparator />}
                  {tool.bold ? (
                    <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer font-semibold text-base">
                      <Link to={tool.to}>{tool.label}</Link>
                    </DropdownMenuItem>
                  ) : tool.gated ? (
                    <LotteryDropdownItem
                      to={tool.to}
                      icon={tool.icon}
                      label={tool.label}
                      onGatedClick={handleGatedClick}
                      renderBadge={renderBadge}
                    />
                  ) : (
                    <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base">
                      <Link to={tool.to}>
                        {tool.icon && <tool.icon className="h-5 w-5" />}
                        {tool.label}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {idx === 8 && <DropdownMenuSeparator />}
                </div>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
        <DropdownMenuSeparator />
        {SIMPLE_LOTTERIES.map((lottery) => (
          <DropdownMenuItem key={lottery.name} asChild className="gap-3 py-3 cursor-pointer text-base">
            <Link to={lottery.resultsPath}>
              <BarChart3 className="h-5 w-5" />
              {lottery.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader({ pageTitle, onBack, hideBackButton }: AppHeaderProps) {
  const { isAuthenticated, profile, signOut } = useAuthContext();
  const { isAdmin } = usePermissionContext();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeLabel, setUpgradeLabel] = useState<string | undefined>();
  const [upgradeVariant, setUpgradeVariant] = useState<"premium" | "vip">("premium");
  const isHomePage = location.pathname === "/";

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(getParentRoute(location.pathname));
    }
  };

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
    return nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Mostra back no mobile quando há pageTitle e não está na home
  const showMobileBack = !!pageTitle && !hideBackButton && !isHomePage;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      style={{ paddingTop: "max(0px, env(safe-area-inset-top, 0px))" }}
    >
      <div className="w-full max-w-[1400px] mx-auto px-3 md:px-4">
        {/* Linha superior: grid 3 colunas — esquerda | centro | direita */}
        <div className="grid grid-cols-[48px_1fr_48px] md:grid-cols-[auto_1fr_auto] items-center h-12 min-h-12 md:h-14 md:min-h-14 gap-2">
          {/* ESQUERDA: back (mobile com pageTitle) OU logo (sempre única) */}
          <div className="flex items-center justify-start min-w-0">
            {showMobileBack ? (
              <>
                {/* Mobile: botão voltar */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-10 w-10 -ml-2"
                  onClick={handleBack}
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                {/* Desktop: logo (back não usa no desktop) */}
                <Link to="/" className="hidden md:flex items-center gap-2 no-underline shrink-0">
                  <img src="/logo.png" alt="Palpite Tech" className="h-8 w-8 rounded-md" />
                  <span className="hidden lg:inline text-base lg:text-lg font-bold text-primary">
                    Palpite Tech
                  </span>
                </Link>
              </>
            ) : (
              <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
                <img src="/logo.png" alt="Palpite Tech" className="h-7 w-7 md:h-8 md:w-8 rounded-md" />
                <span className="hidden md:inline text-base lg:text-lg font-bold text-primary">
                  Palpite Tech
                </span>
              </Link>
            )}
          </div>

          {/* CENTRO: título único centralizado (mobile) OU navegação desktop */}
          <div className="flex items-center justify-center min-w-0 overflow-hidden">
            {/* Mobile: título único (pageTitle ou "Palpite Tech" na home) */}
            <h1 className="md:hidden text-base font-semibold text-foreground truncate text-center w-full px-1 leading-none mx-auto">
              {pageTitle || (isHomePage ? "Palpite Tech" : "")}
            </h1>

            {/* Desktop: navegação centralizada (apenas fora da home) */}
            {!isHomePage && (
              <nav className="hidden md:flex items-center gap-0.5 flex-nowrap overflow-hidden">
                {/* Bolões */}
                {isAdmin ? (
                  <Link to="/boloes">
                    <Button variant="ghost" className="gap-1.5 h-9 px-2 text-sm">
                      <Trophy className="h-4 w-4" />
                      <span className="hidden lg:inline">Bolões</span>
                      <Badge variant="outline" className="hidden xl:inline-flex text-[10px] px-1.5 py-0 h-4 ml-0.5 border-amber-500/50 text-amber-500">
                        Em Breve
                      </Badge>
                    </Button>
                  </Link>
                ) : (
                  <Button variant="ghost" className="gap-1.5 h-9 px-2 text-sm cursor-default opacity-60" disabled>
                    <Trophy className="h-4 w-4" />
                    <span className="hidden lg:inline">Bolões</span>
                  </Button>
                )}

                <Link to="/gerar-jogos">
                  <Button variant="ghost" className="gap-1.5 h-9 px-2 text-sm">
                    <Dices className="h-4 w-4" />
                    <span className="hidden lg:inline">Gerar Jogos</span>
                  </Button>
                </Link>

                <Link to="/proximos-concursos">
                  <Button variant="ghost" className="gap-1.5 h-9 px-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden lg:inline">Concursos</span>
                  </Button>
                </Link>

                {/* md (768-1023px): dropdown unificado "Loterias" */}
                <div className="lg:hidden">
                  <LotteriasUnifiedDropdown
                    handleGatedClick={handleGatedClick}
                    renderBadge={renderBadge}
                  />
                </div>

                {/* lg+ (≥1024px): 4 dropdowns separados + simples */}
                <div className="hidden lg:flex items-center gap-0.5">
                  <LotteryDropdown
                    name="Lotofácil"
                    tools={LOTOFACIL_TOOLS}
                    handleGatedClick={handleGatedClick}
                    renderBadge={renderBadge}
                  />
                  <LotteryDropdown
                    name="Mega Sena"
                    tools={MEGASENA_TOOLS}
                    handleGatedClick={handleGatedClick}
                    renderBadge={renderBadge}
                  />
                  <LotteryDropdown
                    name="Dupla Sena"
                    tools={DUPLASENA_TOOLS}
                    handleGatedClick={handleGatedClick}
                    renderBadge={renderBadge}
                  />
                  <LotteryDropdown
                    name="Quina"
                    tools={QUINA_TOOLS}
                    handleGatedClick={handleGatedClick}
                    renderBadge={renderBadge}
                  />
                  {SIMPLE_LOTTERIES.map((lottery) => (
                    <DropdownMenu key={lottery.name}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-1 h-9 px-2 text-sm">
                          {lottery.name}
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="w-56 p-1 bg-popover z-50">
                        <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base">
                          <Link to={lottery.resultsPath}>
                            <BarChart3 className="h-5 w-5" />
                            Resultados
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ))}
                </div>
              </nav>
            )}
          </div>

          {/* DIREITA: avatar / entrar */}
          <div className="flex items-center justify-end gap-1 shrink-0">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hidden md:flex">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(profile?.nome)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-popover z-50">
                  <div className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold">{profile?.nome || "Usuário"}</p>
                      {profile?.status_assinatura === "ativa" ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">Premium</Badge>
                      ) : profile?.trial_used ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-destructive/10 text-destructive border-destructive/20 whitespace-nowrap">Teste Vencido</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-muted-foreground/20">Plano Free</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {profile?.celular || "Sem celular"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base">
                    <Link to="/perfil/dados"><User className="h-5 w-5" />Dados</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base">
                    <Link to="/perfil/transacoes"><CreditCard className="h-5 w-5" />Transações</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base">
                    <Link to="/perfil/assinatura"><Ticket className="h-5 w-5" />Assinatura</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base">
                    <Link to="/perfil/seguranca"><Lock className="h-5 w-5" />Segurança</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-3 py-3 cursor-pointer text-base">
                    <Link to="/convites"><Gift className="h-5 w-5" />Convidar Amigos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-3 py-3 cursor-pointer text-base text-destructive focus:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5" />Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button className="h-9 px-3 bg-accent hover:bg-accent/90 text-accent-foreground text-sm">
                  Entrar
                </Button>
              </Link>
            )}
          </div>
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
