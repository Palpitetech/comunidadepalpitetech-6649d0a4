import { MainLayout } from "@/components/layout/MainLayout";
import { HubLoteriaGrid, type HubTool } from "@/components/shared/HubLoteriaGrid";
import { Button } from "@/components/ui/button";
import {
  Target, BarChart3, TrendingUp, Flame, LayoutGrid,
  Table2, Dices, Shuffle, Wrench,
} from "lucide-react";

const THEME_COLOR = "270, 60%, 50%"; // Roxo Lotofácil

const tools: HubTool[] = [
  { title: "Análise do Dia", description: "Indicadores e filtros estatísticos para o próximo concurso", icon: Target, path: "/analise-do-dia" },
  { title: "Resultados", description: "Histórico completo de resultados da Lotofácil", icon: BarChart3, path: "/resultados" },
  { title: "Tendências", description: "Padrões e tendências dos últimos concursos", icon: TrendingUp, path: "/tendencias" },
  { title: "Quentes e Frias", description: "Dezenas mais e menos sorteadas no período", icon: Flame, path: "/frequencia" },
  { title: "Frequência das Dezenas", description: "Análise detalhada da frequência de cada dezena", icon: BarChart3, path: "/frequencia-dezenas" },
  { title: "Dezenas por Posição", description: "Quais dezenas mais aparecem em cada posição", icon: Target, path: "/dezenas-por-posicao" },
  { title: "Linhas e Colunas", description: "Distribuição das dezenas por linhas e colunas do volante", icon: LayoutGrid, path: "/linhas-colunas" },
  { title: "Tabela de Movimentação", description: "Movimentação de entrada e saída das dezenas", icon: Table2, path: "/tabela-movimentacao" },
  { title: "Gerador de Palpites", description: "Gere palpites inteligentes com base em estatísticas", icon: Dices, path: "/smart-gerador" },
  { title: "Desdobramento", description: "Monte desdobramentos otimizados com filtros estatísticos", icon: Shuffle, path: "/desdobramento" },
  { title: "Gerador de Fechamento", description: "Fechamentos com garantia de acerto mínimo", icon: Wrench, path: "/fechamento" },
];

export default function HubLotofacil() {
  return (
    <MainLayout pageTitle="Lotofácil" hideBackButton>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🍀</span>
            <h2 className="text-xl font-bold text-foreground">Ferramentas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Todas as ferramentas de análise e geração para a Lotofácil
          </p>
        </div>
        <HubLoteriaGrid tools={tools} themeColor={THEME_COLOR} />

        <div className="flex justify-center mt-8">
          <Button 
            variant="outline" 
            className="w-[85%] sm:w-[70%] h-auto py-5 px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white border-none shadow-xl flex flex-col items-center gap-1 rounded-[2rem] active:scale-95 transition-all"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 fill-white" />
              <span className="text-[10px] uppercase font-black tracking-widest opacity-90">WhatsApp</span>
            </div>
            <span className="text-sm font-bold">
              Quero receber Resultados no meu whatsapp
            </span>
          </Button>
        </div>
      </div>

    </MainLayout>
  );
}
