import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, Lock, Dices, Table, CalendarDays, MessageSquare, ArrowRight, ShieldCheck, Zap } from "lucide-react";

const Central = () => {
  const menuItems = [
    { title: "Resultados", icon: BarChart3, color: "text-blue-500", to: "/resultados" },
    { title: "Estudos", icon: BookOpen, color: "text-green-500", to: "#" },
    { title: "Fechamentos", icon: Lock, color: "text-orange-500", to: "/fechamento" },
    { title: "Gerador de Palpite", icon: Dices, color: "text-purple-500", to: "/smart-gerador" },
    { title: "Tabela de Movimentação", icon: Table, color: "text-red-500", to: "/tabela-movimentacao" },
    { title: "Analise do Dia", icon: CalendarDays, color: "text-yellow-500", to: "/analise-do-dia" },
  ];

  return (
    <MainLayout isLandingPage={true} hideBottomNav={true}>
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="pt-12 pb-16 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-6xl font-black text-senior-dark leading-tight tracking-tight">
              Aumente suas chances na <span className="text-primary italic">Loterias</span> com Inteligência
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
              Analises estatísticas, fechamentos matemáticos e geradores inteligentes para você parar de depender apenas da sorte.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="w-full sm:w-auto px-8 h-14 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all" asChild>
                <Link to="/login" className="flex items-center gap-2">
                  Começar Agora Grátis <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-14 text-lg font-bold rounded-2xl border-2" asChild>
                <Link to="/planos">Ver Planos Premium</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Preview Grid */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 space-y-2">
              <h2 className="text-3xl font-bold text-senior-dark">Nossas Ferramentas</h2>
              <p className="text-muted-foreground">Tudo o que você precisa em um só lugar</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {menuItems.slice(0, 6).map((item, index) => (
                <div key={index} className="p-8 rounded-3xl border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg bg-gray-50/30 group">
                  <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`h-8 w-8 ${item.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-senior-dark">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Acesse estatísticas detalhadas e otimize seus jogos com base em dados reais e atualizados.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-4 bg-senior-dark text-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-primary/20 p-4 rounded-full">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-bold">100% Seguro</h4>
              <p className="text-white/60">Seus dados e estratégias protegidos com tecnologia de ponta.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-primary/20 p-4 rounded-full">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-bold">Rápido e Prático</h4>
              <p className="text-white/60">Interface intuitiva focada na melhor experiência para o apostador.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-primary/20 p-4 rounded-full">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-bold">Dados em Tempo Real</h4>
              <p className="text-white/60">Resultados e análises atualizados logo após os sorteios oficiais.</p>
            </div>
          </div>
        </section>

        {/* WhatsApp Call to Action */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto bg-primary rounded-[3rem] p-10 md:p-16 text-center text-white space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <MessageSquare className="h-40 w-40" />
            </div>
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-4xl font-black">Receba os Resultados no seu WhatsApp!</h2>
              <p className="text-white/80 text-lg font-medium max-w-xl mx-auto">
                Não perca tempo conferindo um por um. Nós avisamos você assim que o resultado sair.
              </p>
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 h-16 px-10 text-lg font-bold rounded-2xl shadow-xl active:scale-95 transition-all"
                asChild
              >
                <a href="https://wa.me/5551981854281" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 fill-primary" />
                  Entrar para o Grupo Grátis
                </a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Central;
