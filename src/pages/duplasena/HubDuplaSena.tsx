import { MainLayout } from "@/components/layout/MainLayout";
import { HubLoteriaGrid, type HubTool } from "@/components/shared/HubLoteriaGrid";
import {
  Target, BarChart3, TrendingUp, Flame, LayoutGrid,
  Table2, Dices, Shuffle, Wrench,
} from "lucide-react";

const THEME_COLOR = "0, 75%, 55%"; // Vermelho Dupla Sena

const tools: HubTool[] = [
  { title: "Análise do Dia", description: "Indicadores e filtros estatísticos para o próximo concurso", icon: Target, path: "/duplasena/analise-do-dia" },
  { title: "Resultados", description: "Histórico completo de resultados da Dupla Sena", icon: BarChart3, path: "/duplasena/resultados" },
  { title: "Tendências", description: "Padrões e tendências dos últimos concursos", icon: TrendingUp, path: "/duplasena/tendencias" },
  { title: "Quentes e Frias", description: "Dezenas mais e menos sorteadas no período", icon: Flame, path: "/duplasena/frequencia" },
  { title: "Frequência das Dezenas", description: "Análise detalhada da frequência de cada dezena", icon: BarChart3, path: "/duplasena/frequencia-dezenas" },
  { title: "Dezenas por Posição", description: "Quais dezenas mais aparecem em cada posição", icon: Target, path: "/duplasena/dezenas-por-posicao" },
  { title: "Linhas e Colunas", description: "Distribuição das dezenas por linhas e colunas do volante", icon: LayoutGrid, path: "/duplasena/linhas-colunas" },
  { title: "Tabela de Movimentação", description: "Movimentação de entrada e saída das dezenas", icon: Table2, path: "/duplasena/tabela-movimentacao" },
  { title: "Gerador de Palpites", description: "Gere palpites inteligentes com base em estatísticas", icon: Dices, path: "/duplasena/gerador" },
  { title: "Desdobramento", description: "Monte desdobramentos otimizados com filtros estatísticos", icon: Shuffle, path: "/duplasena/desdobramento" },
  { title: "Gerador de Fechamento", description: "Fechamentos com garantia de acerto mínimo", icon: Wrench, path: "/duplasena/fechamento" },
];

export default function HubDuplaSena() {
  return (
    <MainLayout pageTitle="Dupla Sena" hideBackButton>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl font-bold text-foreground">Ferramentas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Todas as ferramentas de análise e geração para a Dupla Sena
          </p>
        </div>
        <HubLoteriaGrid tools={tools} themeColor={THEME_COLOR} />
      </div>
    </MainLayout>
  );
}
