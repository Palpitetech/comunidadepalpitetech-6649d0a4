import { MainLayout } from "@/components/layout/MainLayout";
import { HubLoteriaGrid, type HubTool } from "@/components/shared/HubLoteriaGrid";
import {
  Target, BarChart3, TrendingUp, Flame, LayoutGrid,
  Table2, Dices, Shuffle, Wrench,
} from "lucide-react";

const THEME_COLOR = "0, 100%, 50%"; // Vermelho Lotomania (H S L)

const tools: HubTool[] = [
  { title: "Resultados", description: "Histórico completo de resultados da Lotomania", icon: BarChart3, path: "/lotomania/resultados" },
  // Mais ferramentas podem ser adicionadas aqui conforme forem desenvolvidas
];

export default function HubLotomania() {
  return (
    <MainLayout pageTitle="Lotomania" hideBackButton>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🎱</span>
            <h2 className="text-xl font-bold text-foreground">Ferramentas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Todas as ferramentas de análise e geração para a Lotomania
          </p>
        </div>
        <HubLoteriaGrid tools={tools} themeColor={THEME_COLOR} />
      </div>
    </MainLayout>
  );
}
