import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { BarChart3, BookOpen, Lock, Dices, Table, CalendarDays, MessageSquare } from "lucide-react";

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
      <div className="container-senior pt-24 pb-12 space-y-10 px-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-senior-dark leading-tight">
            Central completa para você fazer sua <span className="text-primary">fézinha</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            O que deseja fazer agora?
          </p>
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

        {/* WhatsApp Button Box */}
        <div className="flex justify-center w-full pt-4">
          <Button 
            variant="outline" 
            className="w-[85%] sm:w-[70%] h-auto py-5 px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white border-none shadow-xl rounded-[2rem] active:scale-95 transition-all p-0"
            asChild
          >
            <a 
              href="https://wa.me/5551981854281" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 w-full h-full text-center"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 fill-white" />
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
};

export default Central;
