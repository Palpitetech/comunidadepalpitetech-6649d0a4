import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart3, BookOpen, Lock, Dices, Table, CalendarDays, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
      <div className="container-senior pt-1 pb-6 flex flex-col items-center">
        {/* Hero Section - Text */}
        <div className="text-center space-y-0.5 mb-3 w-full px-4">
          <h1 className="text-[1.05rem] sm:text-senior-xl font-bold text-senior-dark">
            {isAuthenticated ? "Bem-vindo ao Palpite Tech" : "Comece a analisar agora!"}
          </h1>
          <p className="text-[11px] sm:text-senior-sm text-muted-foreground leading-tight">
            {isAuthenticated 
              ? "Selecione uma ferramenta abaixo para começar sua análise." 
              : "Tenha acesso às melhores ferramentas de análise estatística."}
          </p>
        </div>

        {/* Floating Boxes Grid */}
        <div className="grid grid-cols-2 gap-2 w-full mb-3">
          {menuItems.map((item, index) => (
            <Link key={index} to={item.to} className="block group">
              <Card className="hover:border-primary transition-all duration-300 cursor-pointer border-none shadow-md bg-white/80 backdrop-blur-sm group-active:scale-95 flex flex-col items-center justify-center p-2.5 text-center h-full min-h-[85px]">
                <item.icon className={`h-5 w-5 sm:h-8 sm:w-8 ${item.color} mb-1 sm:mb-2 group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] sm:text-[13px] font-semibold text-senior-dark leading-tight">
                  {item.title}
                </span>
              </Card>
            </Link>
          ))}
        </div>

        {/* WhatsApp Button Box */}
        <div className="flex justify-center w-full px-4">
          <Button 
            variant="outline" 
            className="w-full max-w-[320px] h-11 bg-[#25D366] hover:bg-[#20ba5a] text-white border-none shadow-lg rounded-xl active:scale-95 transition-all"
            asChild
          >
            <a 
              href="https://wa.me/5551981854281" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-full text-left"
            >
              <MessageSquare className="h-5 w-5 fill-white shrink-0" />
              <div className="flex flex-col">
                <span className="text-[7px] uppercase font-bold tracking-wider opacity-90">WhatsApp</span>
                <span className="text-xs font-medium leading-tight whitespace-nowrap">
                  Receber Resultados no WhatsApp
                </span>
              </div>
            </a>
          </Button>
        </div>

        {!isAuthenticated && (
          <div className="mt-3 w-full px-4">
            <Link to="/login" className="w-full">
              <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md font-bold text-sm">
                Criar conta grátis
              </Button>
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;

