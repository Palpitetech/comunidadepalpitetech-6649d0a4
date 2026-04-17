import { MainLayout } from "@/components/layout/MainLayout";
import { HubLoteriaGrid, type HubTool } from "@/components/shared/HubLoteriaGrid";
import { Button } from "@/components/ui/button";
import {
  Target, BarChart3, TrendingUp, Flame, LayoutGrid,
  Table2, Dices, Shuffle, Wrench, MessageSquare
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

        <div className="flex justify-center mb-8">
          <Button 
            variant="outline" 
            className="w-full sm:w-[85%] h-auto py-4 px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white border-none shadow-xl rounded-[1.5rem] active:scale-95 transition-all p-0"
            asChild
          >
            <a 
              href="https://wa.me/5551981854281" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full h-full text-center"
            >
              <MessageSquare className="h-5 w-5 fill-white" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase font-black tracking-widest opacity-90 leading-none">WhatsApp</span>
                <span className="text-sm font-bold leading-tight">
                  Quero receber Resultados no whatsapp
                </span>
              </div>
            </a>
          </Button>
        </div>

        <HubLoteriaGrid tools={tools} themeColor={THEME_COLOR} />

            asChild
          >
            <a 
              href="https://wa.me/5551981854281" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 w-full h-full text-center"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 fill-white" />
                <span className="text-[10px] uppercase font-black tracking-widest opacity-90">WhatsApp</span>
              </div>
              <span className="text-sm font-bold leading-tight px-4">
                Quero receber Resultados no meu whatsapp
              </span>
            </a>
          </Button>
        </div>
      </div>

    </MainLayout>
  );
}
