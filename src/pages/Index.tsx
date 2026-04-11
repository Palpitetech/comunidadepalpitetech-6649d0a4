import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  TrendingUp, 
  Flame, 
  Users, 
  Trophy, 
  Star,
  ChevronRight,
  LayoutGrid
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuthContext();
  const userName = user?.user_metadata?.nome || "Apostador";

  const quickActions = [
    { title: "Resultados", icon: BarChart3, path: "/resultados", color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Tendências", icon: TrendingUp, path: "/tendencias", color: "text-purple-500", bg: "bg-purple-50" },
    { title: "Quentes/Frias", icon: Flame, path: "/frequencia", color: "text-orange-500", bg: "bg-orange-50" },
    { title: "Comunidade", icon: Users, path: "/comunidade", color: "text-green-500", bg: "bg-green-50" },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col min-h-full bg-slate-50/50 pb-10">
        {/* Welcome Header - Mobile First Header */}
        <div className="bg-primary text-primary-foreground px-6 pt-8 pb-12 rounded-b-[2.5rem] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-primary-foreground/70 text-sm font-medium">Bem-vindo de volta,</p>
              <h1 className="text-2xl font-bold tracking-tight">{userName}! 🍀</h1>
            </div>
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
          
          <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white mt-6">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Último Resultado</p>
                <p className="text-sm font-bold">Lotofácil Concurso 3054</p>
              </div>
              <Link to="/resultados">
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 px-2 h-8">
                  Ver <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="px-6 -mt-6 space-y-8">
          {/* Quick Actions Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-primary" />
                Acesso Rápido
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link key={action.path} to={action.path}>
                  <Card className="hover:border-primary transition-all duration-200 border-none shadow-sm overflow-hidden group">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                      <div className={`h-12 w-12 rounded-2xl ${action.bg} ${action.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{action.title}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Feature Card */}
          <section>
            <Card className="bg-gradient-to-br from-indigo-600 to-primary text-white border-none shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative z-10">
                <h3 className="text-xl font-bold mb-2">Smart Gerador 🚀</h3>
                <p className="text-white/80 text-sm mb-6 max-w-[200px]">
                  Crie jogos baseados em estatísticas reais e aumente suas chances.
                </p>
                <Link to="/smart-gerador">
                  <Button className="bg-white text-primary hover:bg-slate-100 font-bold px-6">
                    Gerar agora
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>

          {/* Community Preview */}
          <section className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Comunidade</h2>
              <Link to="/comunidade" className="text-sm font-bold text-primary">Ver tudo</Link>
            </div>
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">João Silva</p>
                    <p className="text-xs text-slate-500">Há 5 minutos</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 italic mb-3">
                  "Pessoal, analisei as dezenas quentes e percebi que a 14 está para sair no próximo..."
                </p>
                <Button variant="outline" size="sm" className="w-full text-xs font-bold border-slate-200">
                  Participar da conversa
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;