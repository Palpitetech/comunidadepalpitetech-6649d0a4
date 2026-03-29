import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { usePermissions } from "@/hooks/usePermission";
import { getFeatureForRoute, isVipFeature } from "@/lib/featureMap";
import { PremiumBadge } from "@/components/shared/PremiumBadge";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { FEATURE_LABELS } from "@/types/plans";
import { useState } from "react";
import {
  Target,
  BarChart3,
  TrendingUp,
  Flame,
  LayoutGrid,
  Table2,
  Dices,
  Shuffle,
  Wrench,
  ChevronRight,
} from "lucide-react";

const tools = [
  {
    title: "Análise do Dia",
    description: "Indicadores e filtros estatísticos para o próximo concurso",
    icon: Target,
    path: "/analise-do-dia",
    accent: "bg-primary/10 text-primary",
  },
  {
    title: "Resultados",
    description: "Histórico completo de resultados da Lotofácil",
    icon: BarChart3,
    path: "/resultados",
    accent: "bg-primary/10 text-primary",
  },
  {
    title: "Tendências",
    description: "Padrões e tendências dos últimos concursos",
    icon: TrendingUp,
    path: "/tendencias",
    accent: "bg-primary/10 text-primary",
  },
  {
    title: "Quentes e Frias",
    description: "Dezenas mais e menos sorteadas no período",
    icon: Flame,
    path: "/frequencia",
    accent: "bg-destructive/10 text-destructive",
  },
  {
    title: "Frequência das Dezenas",
    description: "Análise detalhada da frequência de cada dezena",
    icon: BarChart3,
    path: "/frequencia-dezenas",
    accent: "bg-primary/10 text-primary",
  },
  {
    title: "Dezenas por Posição",
    description: "Quais dezenas mais aparecem em cada posição",
    icon: Target,
    path: "/dezenas-por-posicao",
    accent: "bg-primary/10 text-primary",
  },
  {
    title: "Linhas e Colunas",
    description: "Distribuição das dezenas por linhas e colunas do volante",
    icon: LayoutGrid,
    path: "/linhas-colunas",
    accent: "bg-primary/10 text-primary",
  },
  {
    title: "Tabela de Movimentação",
    description: "Movimentação de entrada e saída das dezenas",
    icon: Table2,
    path: "/tabela-movimentacao",
    accent: "bg-primary/10 text-primary",
  },
  {
    title: "Gerador de Palpites",
    description: "Gere palpites inteligentes com base em estatísticas",
    icon: Dices,
    path: "/smart-gerador",
    accent: "bg-accent/10 text-accent",
  },
  {
    title: "Desdobramento",
    description: "Monte desdobramentos otimizados com filtros estatísticos",
    icon: Shuffle,
    path: "/desdobramento",
    accent: "bg-accent/10 text-accent",
  },
  {
    title: "Gerador de Fechamento",
    description: "Fechamentos com garantia de acerto mínimo",
    icon: Wrench,
    path: "/fechamento",
    accent: "bg-accent/10 text-accent",
  },
];

export default function HubLotofacil() {
  const { hasPermission } = usePermissions();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeLabel, setUpgradeLabel] = useState<string | undefined>();
  const [upgradeVariant, setUpgradeVariant] = useState<"premium" | "vip">("premium");

  const handleGatedClick = (e: React.MouseEvent, path: string) => {
    const feature = getFeatureForRoute(path);
    if (feature && !hasPermission(feature)) {
      e.preventDefault();
      setUpgradeLabel(FEATURE_LABELS[feature]);
      setUpgradeVariant(isVipFeature(feature) ? "vip" : "premium");
      setUpgradeOpen(true);
    }
  };

  const renderBadge = (path: string) => {
    const feature = getFeatureForRoute(path);
    if (!feature || hasPermission(feature)) return null;
    return <PremiumBadge variant={isVipFeature(feature) ? "vip" : "premium"} />;
  };

  return (
    <MainLayout pageTitle="Lotofácil" hideBackButton>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🍀</span>
            <h2 className="text-xl font-bold text-foreground">Ferramentas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Todas as ferramentas de análise e geração para a Lotofácil
          </p>
        </div>

        {/* Tools Grid */}
        <div className="space-y-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const badge = renderBadge(tool.path);

            return (
              <Link
                key={tool.path}
                to={tool.path}
                onClick={(e) => handleGatedClick(e, tool.path)}
                className="block"
              >
                <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${tool.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{tool.title}</h3>
                      {badge}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {tool.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureLabel={upgradeLabel}
        variant={upgradeVariant}
      />
    </MainLayout>
  );
}
