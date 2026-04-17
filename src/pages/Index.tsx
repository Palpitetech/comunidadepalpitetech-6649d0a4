import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart3, BookOpen, Lock, Dices, Table, CalendarDays, MessageSquare } from "lucide-react";

const Index = () => {
  const menuItems = [
    { title: "Resultados", icon: BarChart3, color: "text-blue-500", to: "/resultados" },
    { title: "Estudos", icon: BookOpen, color: "text-green-500", to: "#" },
    { title: "Fechamentos", icon: Lock, color: "text-orange-500", to: "/fechamento" },
    { title: "Gerador de Palpite", icon: Dices, color: "text-purple-500", to: "/gerador" },
    { title: "Tabela de Movimentação", icon: Table, color: "text-red-500", to: "/tabela-movimentacao" },
    { title: "Analise do Dia", icon: CalendarDays, color: "text-yellow-500", to: "/analise-do-dia" },
  ];

  return (
    <MainLayout pageTitle="Início">
      <div className="container-senior pt-4 pb-8 space-y-8">
        {/* Floating Boxes Grid */}
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <Link key={index} to={item.to} className="block group">
              <Card className="hover:border-primary transition-all duration-300 cursor-pointer h-100 border-none shadow-lg bg-white/80 backdrop-blur-sm group-active:scale-95 flex flex-col items-center justify-center p-6 text-center">
                <item.icon className={`h-10 w-10 ${item.color} mb-3 group-hover:scale-110 transition-transform`} />
                <span className="text-senior-sm font-semibold text-senior-dark leading-tight">
                  {item.title}
                </span>
              </Card>
            </Link>
          ))}
        </div>

        {/* WhatsApp Button Box */}
        <div className="flex justify-center w-full">
          <Button 
            variant="outline" 
            className="w-[70%] h-auto py-4 px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white border-none shadow-lg flex-col gap-1 rounded-2xl group active:scale-95 transition-all"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 fill-white" />
              <span className="text-xs uppercase font-bold tracking-wider">WhatsApp</span>
            </div>
            <span className="text-sm font-medium">
              Quero receber Resultados no meu whatsapp
            </span>
          </Button>
        </div>

        {/* CTA para não logados */}
        <div className="mt-8 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-8">
              <h2 className="text-senior-xl font-semibold mb-4 text-senior-dark">
                Comece a analisar agora!
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Crie sua conta gratuita e tenha acesso às melhores ferramentas de análise da Lotofácil.
              </p>
              <Link to="/login">
                <Button size="lg" className="h-14 px-8 text-senior-lg bg-primary hover:bg-primary/90 text-white rounded-full">
                  Criar conta grátis
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;

