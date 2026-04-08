import { MainLayout } from "@/components/layout/MainLayout";
import { HubLoteriaGrid, type HubTool } from "@/components/shared/HubLoteriaGrid";
import {
  Target, BarChart3, TrendingUp, Flame, LayoutGrid,
  Table2, Dices, Shuffle,
} from "lucide-react";

const THEME_COLOR = "260, 65%, 45%"; // Roxo Quina

const tools: HubTool[] = [
  { title: "Análise do Dia", description: "Indicadores e filtros estatísticos para o próximo concurso", icon: Target, path: "/quina/analise-do-dia" },
  { title: "Resultados", description: "Histórico completo de resultados da Quina", icon: BarChart3, path: "/quina/resultados" },
  { title: "Tendências", description: "Padrões e tendências dos últimos concursos", icon: TrendingUp, path: "/quina/tendencias" },
  { title: "Quentes e Frias", description: "Dezenas mais e menos sorteadas no período", icon: Flame, path: "/quina/frequencia" },
  { title: "Frequência das Dezenas", description: "Análise detalhada da frequência de cada dezena", icon: BarChart3, path: "/quina/frequencia-dezenas" },
  { title: "Dezenas por Posição", description: "Quais dezenas mais aparecem em cada posição", icon: Target, path: "/quina/dezenas-posicao" },
  { title: "Linhas e Colunas", description: "Distribuição das dezenas por linhas e colunas do volante", icon: LayoutGrid, path: "/quina/linhas-colunas" },
  { title: "Tabela de Movimentação", description: "Movimentação de entrada e saída das dezenas", icon: Table2, path: "/quina/tabela-movimentacao" },
  { title: "Gerador de Palpites", description: "Gere palpites inteligentes com base em estatísticas", icon: Dices, path: "/quina/gerador" },
  { title: "Desdobramento", description: "Monte desdobramentos otimizados com filtros estatísticos", icon: Shuffle, path: "/quina/desdobramento" },
];

export default function HubQuina() {
  return (
    <MainLayout pageTitle="Quina" hideBackButton>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl font-bold text-foreground">Ferramentas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Todas as ferramentas de análise e geração para a Quina
          </p>
        </div>
        <HubLoteriaGrid tools={tools} themeColor={THEME_COLOR} />
      </div>
    </MainLayout>
  );
}
