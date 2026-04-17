import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, BookOpen, Lock, Dices, Table, CalendarDays } from "lucide-react";

const Index = () => {
  const menuItems = [
    { title: "Resultados", icon: BarChart3, color: "text-blue-500", to: "/resultados" },
    { title: "Estudos", icon: BookOpen, color: "text-green-500", to: "#" },
    { title: "Fechamento", icon: Lock, color: "text-orange-500", to: "/fechamento" },
    { title: "Gerador", icon: Dices, color: "text-purple-500", to: "/gerador" },
    { title: "Tabela Movimentação", icon: Table, color: "text-red-500", to: "/tabela-movimentacao" },
    { title: "Analise do dia", icon: CalendarDays, color: "text-yellow-500", to: "/analise-do-dia" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur sticky top-0 z-50">
        <div className="container-senior flex items-center justify-between h-16 py-0">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Palpite Tech" className="h-8 w-8 rounded-md" />
            <span className="text-lg font-bold text-primary">Palpite Tech</span>
          </div>
          <Link to="/login">
            <Button variant="default" className="bg-primary hover:bg-primary/90 text-white px-6">
              Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container-senior py-12 px-4">
        {/* Headline */}
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-12 text-senior-dark max-w-2xl mx-auto leading-tight">
          Hub Completo para você se aproximar dos 14 pontos. O que deseja fazer:
        </h1>

        {/* Grid: 2 boxes per line */}
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {menuItems.map((item, index) => (
            <Link key={index} to={item.to} className="block group">
              <Card className="hover:border-primary transition-all duration-300 cursor-pointer h-full border-none shadow-lg bg-white/80 backdrop-blur-sm group-active:scale-95 flex flex-col items-center justify-center p-8 text-center min-h-[160px]">
                <item.icon className={`h-12 w-12 ${item.color} mb-4 group-hover:scale-110 transition-transform`} />
                <span className="text-lg font-semibold text-senior-dark leading-tight">
                  {item.title}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Palpite Tech. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
