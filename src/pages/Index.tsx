import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart3, BookOpen, Lock, Dices, Table, CalendarDays, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LatestResults } from "@/components/home/LatestResults";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const menuItems = [
    { title: "Resultados", icon: BarChart3, color: "text-blue-500", to: "/resultados" },
    { title: "Estudos", icon: BookOpen, color: "text-green-500", to: "#" },
    { title: "Fechamentos", icon: Lock, color: "text-orange-500", to: "/fechamento" },
    { title: "Gerador de Palpite", icon: Dices, color: "text-purple-500", to: "/gerador" },
    { title: "Tabela de Movimentação", icon: Table, color: "text-red-500", to: "/tabela-movimentacao" },
    { title: "Analise do Dia", icon: CalendarDays, color: "text-yellow-500", to: "/analise-do-dia" },
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

        {/* WhatsApp Button Box */}
        <div className="flex justify-center w-full px-4 mb-3">
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

        {/* Floating Boxes Grid */}
        <div className="grid grid-cols-2 gap-2 w-full mb-2">
          {menuItems.map((item, index) => (
            <Link key={index} to={item.to} className="block group">
              <Card className="hover:border-primary transition-all duration-300 cursor-pointer border-none shadow-md bg-white/80 backdrop-blur-sm group-active:scale-95 flex flex-col items-center justify-center p-2 text-center h-full min-h-[80px]">
                <item.icon className={`h-5 w-5 sm:h-8 sm:w-8 ${item.color} mb-1 sm:mb-2 group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] sm:text-[13px] font-semibold text-senior-dark leading-tight line-clamp-2">
                  {item.title}
                </span>
              </Card>
            </Link>
          ))}
        </div>

        {!isAuthenticated && (
          <div className="mt-2 w-full px-4">
            <Link to="/login" className="w-full">
              <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md font-bold text-sm">
                Criar conta grátis
              </Button>
            </Link>
          </div>
        )}

        {/* Section 2: Latest Results */}
        <div className="w-full mt-4">
          <LatestResults />
        </div>

        {/* Section 3: Daily Studies */}
        <div className="w-full mt-8 px-4 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-senior-dark leading-tight">
              Receba Estudos diários sem custo nenhum, 100% de graça.
            </h2>
            <p className="text-[11px] sm:text-senior-sm text-muted-foreground leading-snug">
              Todos os dias publicamos analises e estudos atualizados para te ajudar na jornada do 14 e 15 pontos.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 w-full pb-8">
            {[
              "Raio X do Resultado.",
              "Análise de Pares e Ímpares",
              "Análise de Ciclo",
              "Analise de Movimentação",
              "Análise técnica",
              "Análise moldura",
              "Analise Repetidas"
            ].map((title, index) => (
              <Card key={index} className="overflow-hidden border-none shadow-xl bg-white/90 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col p-4 space-y-3">
                <h3 className="font-bold text-senior-dark text-base">{title}</h3>
                
                <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center text-muted-foreground text-xs italic">
                  [Foto na horizontal]
                </div>

                <div className="flex justify-center pt-1">
                  <Button 
                    className="h-8 px-4 bg-primary hover:bg-primary/90 text-white rounded-full text-[10px] font-bold shadow-md transition-transform active:scale-95"
                    asChild
                  >
                    <Link to="/login">Fazer meu Cadastro Gratuíto</Link>
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

export default Index;
