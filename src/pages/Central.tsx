import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { BarChart3, BookOpen, Lock, Dices, Table, CalendarDays, MessageSquare } from "lucide-react";
import { LatestResults } from "@/components/home/LatestResults";

const Central = () => {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const menuItems = [
    { title: "Resultados", icon: BarChart3, color: "text-blue-500", to: "/resultados" },
    { title: "Estudos", icon: BookOpen, color: "text-green-500", to: "#" },
    { title: "Fechamentos", icon: Lock, color: "text-orange-500", to: "/fechamento" },
    { title: "Gerador de Palpite", icon: Dices, color: "text-purple-500", to: "/smart-gerador" },
    { title: "Tabela de Movimentação", icon: Table, color: "text-red-500", to: "/tabela-movimentacao" },
    { title: "Analise do Dia", icon: CalendarDays, color: "text-yellow-500", to: "/analise-do-dia" },
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

        {/* WhatsApp Button Box */}
        <div className="flex justify-center w-full">
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
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {menuItems.map((item, index) => (
            <Link key={index} to={item.to} className="block group">
              <Card className="hover:border-primary transition-all duration-300 cursor-pointer h-32 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white group-active:scale-95 flex flex-col items-center justify-center p-4 text-center rounded-3xl">
                <div className="bg-gray-50 p-3 rounded-2xl mb-2 group-hover:bg-primary/5 transition-colors">
                  <item.icon className={`h-8 w-8 ${item.color} group-hover:scale-110 transition-transform`} />
                </div>
                <span className="text-xs font-bold text-senior-dark leading-tight px-2">
                  {item.title}
                </span>
              </Card>
            </Link>
          ))}
        </div>

        {/* Section 2: Latest Results */}
        <div className="w-full mt-6">
          <LatestResults />
        </div>

        {/* Section 3: Daily Studies */}
        <div className="w-full mt-12 space-y-8">
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
                
                <div className="aspect-video w-full bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center text-muted-foreground text-xs italic border border-dashed border-gray-200">
                  [Foto na horizontal]
                </div>

                <div className="flex justify-center pt-2">
                  <Button 
                    className="h-10 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 transition-all active:scale-95"
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

export default Central;
