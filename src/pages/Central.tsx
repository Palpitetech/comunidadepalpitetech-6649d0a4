import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { BarChart3, BookOpen, Lock, Dices, Table, CalendarDays, MessageSquare } from "lucide-react";
import { LatestResults } from "@/components/home/LatestResults";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const Central = () => {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const lotteries = [
    { name: "Lotofácil", id: "lotofacil" },
    { name: "Mega-Sena", id: "megasena" },
    { name: "Quina", id: "quina" },
    { name: "Dupla-Sena", id: "duplasena" },
  ];

  const getPath = (toolId: string, lotteryId: string) => {
    const paths: Record<string, Record<string, string>> = {
      fechamento: {
        lotofacil: "/fechamento",
        megasena: "/megasena/fechamento",
        quina: "/quina",
        duplasena: "/duplasena/fechamento",
      },
      gerador: {
        lotofacil: "/smart-gerador",
        megasena: "/megasena/gerador",
        quina: "/quina/gerador",
        duplasena: "/duplasena/gerador",
      },
      tabela: {
        lotofacil: "/tabela-movimentacao",
        megasena: "/megasena/tabela-movimentacao",
        quina: "/quina/tabela-movimentacao",
        duplasena: "/duplasena/tabela-movimentacao",
      },
      analise: {
        lotofacil: "/analise-do-dia",
        megasena: "/megasena/analise-do-dia",
        quina: "/quina/analise-do-dia",
        duplasena: "/duplasena/analise-do-dia",
      },
    };

    return paths[toolId]?.[lotteryId] || `/${lotteryId}`;
  };

  const menuItems: Array<{
    title: string;
    icon: any;
    color: string;
    id?: string;
    to?: string;
    onClick?: () => void;
  }> = [
    { title: "Resultados", icon: BarChart3, color: "text-blue-500", onClick: () => document.getElementById('sessao-2')?.scrollIntoView({ behavior: 'smooth' }) },
    { title: "Estudos", icon: BookOpen, color: "text-green-500", onClick: () => document.getElementById('sessao-3')?.scrollIntoView({ behavior: 'smooth' }) },
    { title: "Fechamentos", icon: Lock, color: "text-orange-500", id: "fechamento" },
    { title: "Gerador de Palpite", icon: Dices, color: "text-purple-500", id: "gerador" },
    { title: "Tabela de Movimentação", icon: Table, color: "text-red-500", id: "tabela" },
    { title: "Analise do Dia", icon: CalendarDays, color: "text-yellow-500", id: "analise" },
  ];

  return (
    <MainLayout hideBottomNav>
      <div className="container-senior pt-20 pb-8 space-y-6 px-4">
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-3xl font-black text-senior-dark leading-tight line-clamp-2">
            Central completa para você fazer sua <span className="text-primary">fézinha</span>
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground font-medium line-clamp-1">
            O que deseja fazer agora?
          </p>
        </div>

        {/* Floating Boxes Grid */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {menuItems.map((item, index) => {
            if (item.id) {
              return (
                <DropdownMenu key={index}>
                  <DropdownMenuTrigger asChild>
                    <Card className="hover:border-primary transition-all duration-300 cursor-pointer h-32 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white group-active:scale-95 flex flex-col items-center justify-center p-4 text-center rounded-3xl group">
                      <div className="bg-gray-50 p-3 rounded-2xl mb-2 group-hover:bg-primary/5 transition-colors">
                        <item.icon className={`h-8 w-8 ${item.color} group-hover:scale-110 transition-transform`} />
                      </div>
                      <span className="text-xs font-bold text-senior-dark leading-tight px-2">
                        {item.title}
                      </span>
                    </Card>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    {lotteries.map((lottery) => (
                      <DropdownMenuItem 
                        key={lottery.id}
                        className={cn(
                          "cursor-pointer transition-colors duration-200",
                          lottery.id === "lotofacil" && "focus:bg-[#943391] focus:text-white",
                          lottery.id === "megasena" && "focus:bg-[#209869] focus:text-white",
                          lottery.id === "quina" && "focus:bg-[#260085] focus:text-white",
                          lottery.id === "duplasena" && "focus:bg-[#a61324] focus:text-white"
                        )}
                        onClick={() => navigate(getPath(item.id!, lottery.id))}
                      >
                        {lottery.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            const CardContent = (
              <Card className="hover:border-primary transition-all duration-300 cursor-pointer h-32 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white group-active:scale-95 flex flex-col items-center justify-center p-4 text-center rounded-3xl">
                <div className="bg-gray-50 p-3 rounded-2xl mb-2 group-hover:bg-primary/5 transition-colors">
                  <item.icon className={`h-8 w-8 ${item.color} group-hover:scale-110 transition-transform`} />
                </div>
                <span className="text-xs font-bold text-senior-dark leading-tight px-2">
                  {item.title}
                </span>
              </Card>
            );

            if ('onClick' in item) {
              return (
                <div key={index} onClick={item.onClick} className="block group cursor-pointer">
                  {CardContent}
                </div>
              );
            }

            return (
              <Link key={index} to={item.to || "#"} className="block group">
                {CardContent}
              </Link>
            );
          })}
        </div>

        {/* Section 2: Latest Results */}
        <div id="sessao-2" className="w-full mt-6 scroll-mt-20">
          <LatestResults />
        </div>

        {/* Section 3: Daily Studies */}
        <div id="sessao-3" className="w-full mt-12 space-y-8 scroll-mt-20">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-senior-dark leading-tight">
              Receba Estudos diários sem custo nenhum, 100% de graça.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              Todos os dias publicamos analises e estudos atualizados para te ajudar na jornada do 14 e 15 pontos.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 w-full pb-10">
            {[
              "Raio X do Resultado.",
              "Análise de Pares e Ímpares",
              "Análise de Ciclo",
              "Analise de Movimentação",
              "Análise técnica",
              "Análise moldura",
              "Analise Repetidas"
            ].map((title, index) => (
              <Card key={index} className="overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/95 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:-translate-y-2 flex flex-col p-5 space-y-4 rounded-[2rem]">
                <h3 className="font-extrabold text-senior-dark text-lg px-2">{title}</h3>
                
                <div className="aspect-[3/4] w-full bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center text-muted-foreground text-xs italic border border-dashed border-gray-200">
                  [Foto na vertical]
                </div>

                <div className="flex justify-center pt-2">
                  <Button 
                    className="h-10 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black shadow-lg shadow-green-600/20 transition-all active:scale-95"
                    asChild
                  >
                    <Link to="/login">Receber estudos diários Grátis</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Central;
