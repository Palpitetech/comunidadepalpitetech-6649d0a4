import { MainLayout } from "@/components/layout/MainLayout";
import { useEffect } from "react";
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

  useEffect(() => {
    // FAQ Schema removed for SEO focus change
  }, []);

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
      <div className="flex flex-col items-center overflow-x-hidden">
        {/* Hero Section - Text */}
        <section className="cluster-container text-center w-full px-4 pt-4 pb-8">
          <p className="meta-update">Atualizado em: {new Date().toLocaleDateString('pt-BR')}</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
            Palpite Tech: O Gerador de Palpites para Loterias
          </h1>
          <p className="text-[#333] text-lg max-w-2xl mx-auto">
            {isAuthenticated 
              ? "Selecione uma ferramenta abaixo para começar sua análise personalizada e aumentar suas chances." 
              : "Tenha acesso às melhores ferramentas de análise estatística para Lotofácil, Mega-Sena e mais."}
          </p>
        </section>
        
        {/* Main Action Boxes */}
        <div className="cluster-container w-full pt-0 pb-6 grid grid-cols-2 gap-3">
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
        <div className="cluster-container py-0 grid grid-cols-2 gap-2 w-full mb-8">
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
          <div className="cluster-container w-full pt-0 pb-8">
            <Link to="/login" className="w-full">
              <Button className="w-full h-11 bg-primary sm:hover:bg-primary/90 text-white rounded-xl shadow-md font-bold text-base active:scale-95 transition-transform touch-manipulation">
                Criar conta grátis
              </Button>
            </Link>
          </div>
        )}


        {/* Section 2: Latest Results - Micro variation background */}
        <div className="w-full bg-slate-50/80 py-10 border-y border-slate-100">
          <div className="cluster-container py-0">
            <h2 className="text-center mb-6">Últimos Resultados</h2>
            <LatestResults />
          </div>
        </div>

        {/* Section 3: FAQ SEO - Standard white bg */}
        <div className="cluster-container py-10">
          <div className="w-full faq-seo" id="faq-seo">
            <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes sobre Loterias</h2>
            
            {/* Snippet moved here: Home (Index) snippet optional/moderated */}
            <div className="snippet-answer mb-10">
              O Palpite Tech é uma plataforma de análise estatística que gera palpites otimizados para as principais loterias da Caixa, como Lotofácil e Mega-Sena, utilizando frequências e tendências reais.
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">Como ganhar na Lotofácil?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Para aumentar suas chances de ganhar na Lotofácil, é fundamental utilizar estatísticas de fechamentos, tendências de números pares e ímpares, além de analisar os sorteios anteriores para identificar padrões recorrentes.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold">O gerador de palpites é confiável?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Sim, o Palpite Tech utiliza algoritmos baseados na frequência dos sorteios oficiais da Caixa, fornecendo palpites estatisticamente otimizados para maximizar seu potencial de acerto.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Box - Highlight variation background */}
        <div className="w-full bg-primary/[0.03] py-12 border-t border-primary/5">
          <div className="cluster-container py-0">
            <div className="intent-commercial">
              <div className="trust-box border-primary/10 bg-white/50">
                <h3 className="text-xl font-bold mt-0 mb-3 text-primary">Por que confiar no Palpite Tech?</h3>
                <p className="text-lg text-slate-700 mb-0 leading-relaxed">
                  Mais de 10.000 apostadores utilizam nossas ferramentas diariamente para melhorar suas apostas com base em dados reais e transparência total nos processos estatísticos.
                </p>
              </div>
            </div>
          </div>
        </div>


      </div>
    </MainLayout>
  );
};

export default Index;
