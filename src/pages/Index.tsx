import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, Lock, Dices, Table, CalendarDays, MessageSquare, Sparkles } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePermissionContext } from "@/contexts/PermissionContext";
import { LatestResults } from "@/components/home/LatestResults";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const Index = () => {
  const { isAuthenticated } = useAuthContext();
  const { plan } = usePermissionContext();
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
      <div className="container-senior pt-2 pb-6 flex flex-col items-center overflow-x-hidden">
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
        <div className="grid grid-cols-2 gap-3 mb-4 w-full px-1">
          <Card 
            className="bg-green-600 sm:hover:bg-green-700 transition-all cursor-pointer text-white border-none shadow-lg overflow-hidden active:scale-[0.98] active:opacity-90 select-none touch-manipulation"
            onClick={() => navigate('/gerar-jogos')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center justify-center h-full min-h-[60px]">
              <h3 className="font-bold text-[13px] sm:text-base leading-tight text-center">Gerar meus palpites</h3>
            </CardContent>
          </Card>
          <Card 
            className="bg-green-600 sm:hover:bg-green-700 transition-all cursor-pointer text-white border-none shadow-lg overflow-hidden active:scale-[0.98] active:opacity-90 select-none touch-manipulation"
            onClick={() => {
              const isTrial = plan?.slug === 'trial' || plan?.slug === 'teste-gratis-3-dias';
              const isPaid = !!plan && !isTrial;
              const link = isPaid ? "https://www.palpitetech.com.br/g/grupo-vip-assinantes" : "https://www.palpitetech.com.br/g/entrar-sala-secreta";
              window.open(link, '_blank');
            }}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center justify-center h-full min-h-[60px]">
              {(() => {
                const isTrial = plan?.slug === 'trial' || plan?.slug === 'teste-gratis-3-dias';
                const isPaid = !!plan && !isTrial;
                return (
                  <>
                    <h3 className="font-bold text-[13px] sm:text-base leading-tight">
                      {isPaid ? "Receba 15 palpites diários" : "Entrar na Sala Secreta"}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] opacity-90 mt-0.5 leading-none">
                      {isPaid ? "E análise do resultado" : "Receba atualizações diárias"}
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Floating Boxes Grid */}
        <div className="grid grid-cols-2 gap-2 w-full mb-2 px-1">
          {menuItems.map((item, index) => {
            if (item.id) {
              return (
                <DropdownMenu key={index}>
                  <DropdownMenuTrigger asChild>
                    <Card className="sm:hover:border-primary transition-all duration-200 cursor-pointer border-none shadow-md bg-white active:scale-[0.98] active:bg-gray-50 flex flex-col items-center justify-center p-2 text-center h-full min-h-[60px] select-none touch-manipulation">
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
                          "cursor-pointer transition-colors duration-200 py-3 sm:py-2",
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
              <Link key={index} to={item.to || "#"} className="block group select-none touch-manipulation">
                <Card className="sm:hover:border-primary transition-all duration-200 cursor-pointer border-none shadow-md bg-white active:scale-[0.98] active:bg-gray-50 flex flex-col items-center justify-center p-2 text-center h-full min-h-[60px]">
                  <span className="text-[10px] sm:text-[13px] font-semibold text-senior-dark leading-tight line-clamp-2">
                    {item.title}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>

        {!isAuthenticated && (
          <div className="mt-4 w-full px-4">
            <Link to="/login" className="w-full">
              <Button className="w-full h-11 bg-primary sm:hover:bg-primary/90 text-white rounded-xl shadow-md font-bold text-base active:scale-95 transition-transform touch-manipulation">
                Criar conta grátis
              </Button>
            </Link>
          </div>
        )}


        {/* Section 2: Latest Results */}
        <div className="w-full mt-4">
          <LatestResults />
        </div>

        {/* Snippet Comparison */}
        <section id="snippet-comparison" className="w-full mt-10 px-4 mb-8">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-senior-dark">
              Palpite Tech é melhor que outros geradores de palpites?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              O Palpite Tech se destaca por oferecer estratégias explicadas, teste gratuito e maior transparência, 
              enquanto muitos geradores de palpites entregam apenas números aleatórios sem análise.
            </p>
          </div>
        </section>

        {/* FAQ SEO Section */}
        <section id="faq-seo" className="w-full mt-10 px-4 mb-12">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-senior-dark text-center">
              Perguntas frequentes sobre o Palpite Tech
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-bold text-senior-dark text-sm sm:text-base">Palpite Tech é seguro?</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Sim, o Palpite Tech é seguro, pois oferece acesso transparente, teste gratuito e não exige cartão para começar.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-senior-dark text-sm sm:text-base">Palpite Tech tem garantia de ganho?</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Não, o Palpite Tech não garante ganhos, pois loterias dependem de sorte e probabilidades.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-senior-dark text-sm sm:text-base">Palpite Tech vale a pena para iniciantes?</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Sim, principalmente para iniciantes que desejam apostar com mais estratégia e menos aleatoriedade.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
