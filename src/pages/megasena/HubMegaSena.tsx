import { MainLayout } from "@/components/layout/MainLayout";
import { HubLoteriaGrid, type HubTool } from "@/components/shared/HubLoteriaGrid";
import {
  Target, BarChart3, TrendingUp, Flame, LayoutGrid,
  Table2, Dices, Shuffle, Wrench,
} from "lucide-react";

const THEME_COLOR = "125, 70%, 40%"; // Verde Mega Sena

const tools: HubTool[] = [
  { title: "Análise do Dia", description: "Indicadores e filtros estatísticos para o próximo concurso", icon: Target, path: "/megasena/analise-do-dia" },
  { title: "Resultados", description: "Histórico completo de resultados da Mega Sena", icon: BarChart3, path: "/megasena/resultados" },
  { title: "Tendências", description: "Padrões e tendências dos últimos concursos", icon: TrendingUp, path: "/megasena/tendencias" },
  { title: "Quentes e Frias", description: "Dezenas mais e menos sorteadas no período", icon: Flame, path: "/megasena/frequencia" },
  { title: "Frequência das Dezenas", description: "Análise detalhada da frequência de cada dezena", icon: BarChart3, path: "/megasena/frequencia-dezenas" },
  { title: "Dezenas por Posição", description: "Quais dezenas mais aparecem em cada posição", icon: Target, path: "/megasena/dezenas-por-posicao" },
  { title: "Linhas e Colunas", description: "Distribuição das dezenas por linhas e colunas do volante", icon: LayoutGrid, path: "/megasena/linhas-colunas" },
  { title: "Tabela de Movimentação", description: "Movimentação de entrada e saída das dezenas", icon: Table2, path: "/megasena/tabela-movimentacao" },
  { title: "Gerador de Palpites", description: "Gere palpites inteligentes com base em estatísticas", icon: Dices, path: "/megasena/gerador" },
  { title: "Desdobramento", description: "Monte desdobramentos otimizados com filtros estatísticos", icon: Shuffle, path: "/megasena/desdobramento" },
  { title: "Gerador de Fechamento", description: "Fechamentos com garantia de acerto mínimo", icon: Wrench, path: "/megasena/fechamento" },
];

export default function HubMegaSena() {
  return (
    <MainLayout pageTitle="Mega Sena" hideBackButton>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🎱</span>
            <h2 className="text-xl font-bold text-foreground">Ferramentas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Todas as ferramentas de análise e geração para a Mega Sena
          </p>
        </div>
        <HubLoteriaGrid tools={tools} themeColor={THEME_COLOR} />
      </div>
    </MainLayout>
  );
}
