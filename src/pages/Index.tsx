import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, Lock, Dices, Table, CalendarDays, MessageSquare, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LatestResults } from "@/components/home/LatestResults";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
        quina: "/quina", // Quina não tem fechamento específico listado
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

  const menuItems = [
    { title: "Resultados", icon: BarChart3, color: "text-blue-500", to: "/resultados" },
    { title: "Estudos", icon: BookOpen, color: "text-green-500", to: "#" },
    { title: "Fechamentos", icon: Lock, color: "text-orange-500", id: "fechamento" },
    { title: "Gerador de Palpite", icon: Dices, color: "text-purple-500", id: "gerador" },
    { title: "Tabela de Movimentação", icon: Table, color: "text-red-500", id: "tabela" },
    { title: "Analise do Dia", icon: CalendarDays, color: "text-yellow-500", id: "analise" },
  ];

  return (
    <MainLayout hideBottomNav={!isAuthenticated}>
      <div className="container-senior pt-1 pb-4 flex flex-col items-center">
        {/* Hero Section - Text */}
        <div className="text-center space-y-0.5 mb-2 w-full px-4">
          <h1 className="text-[1.05rem] sm:text-senior-xl font-bold text-senior-dark">
            {isAuthenticated ? "Bem-vindo ao Palpite Tech" : "Comece a analisar agora!"}
          </h1>
          <p className="text-[11px] sm:text-senior-sm text-muted-foreground leading-tight line-clamp-1">
            {isAuthenticated 
              ? "Selecione uma ferramenta abaixo para começar sua análise." 
              : "Tenha acesso às melhores ferramentas de análise estatística."}
          </p>
        </div>
        
        {/* Main Action Boxes */}
        <div className="grid grid-cols-2 gap-3 mb-4 w-full">
          <Card 
            className="bg-green-600 hover:bg-green-700 transition-all cursor-pointer text-white border-none shadow-lg overflow-hidden group active:scale-95"
            onClick={() => navigate('/gerar-jogos')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center justify-center h-full min-h-[60px]">
              <h3 className="font-bold text-sm sm:text-base leading-tight">Gerar meus palpites</h3>
            </CardContent>
          </Card>
          <Card 
            className="bg-green-600 hover:bg-green-700 transition-all cursor-pointer text-white border-none shadow-lg overflow-hidden group active:scale-95"
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center justify-center h-full min-h-[60px]">
              <h3 className="font-bold text-sm sm:text-base leading-tight">Entrar no Grupo</h3>
            </CardContent>
          </Card>
        </div>

        {/* Floating Boxes Grid */}
        <div className="grid grid-cols-2 gap-2 w-full mb-2">
          {menuItems.map((item, index) => {
            if (item.id) {
              return (
                <DropdownMenu key={index}>
                  <DropdownMenuTrigger asChild>
                    <Card className="hover:border-primary transition-all duration-300 cursor-pointer border-none shadow-md bg-white/80 backdrop-blur-sm group-active:scale-95 flex flex-col items-center justify-center p-2 text-center h-full min-h-[60px] group">
                      <span className="text-[10px] sm:text-[13px] font-semibold text-senior-dark leading-tight line-clamp-2">
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

            return (
              <Link key={index} to={item.to || "#"} className="block group">
                <Card className="hover:border-primary transition-all duration-300 cursor-pointer border-none shadow-md bg-white/80 backdrop-blur-sm group-active:scale-95 flex flex-col items-center justify-center p-2 text-center h-full min-h-[60px]">
                  <span className="text-[10px] sm:text-[13px] font-semibold text-senior-dark leading-tight line-clamp-2">
                    {item.title}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>

        {!isAuthenticated && (
          <div className="mt-2 w-full px-4">
            <Link to="/login" className="w-full">
              <Button className="w-full h-8 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md font-bold text-sm">
                Criar conta grátis
              </Button>
            </Link>
          </div>
        )}

        {/* Section 2: Latest Results */}
        <div className="w-full mt-4">
          <LatestResults />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
