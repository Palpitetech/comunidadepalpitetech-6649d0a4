import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, ArrowRight, Bot, DollarSign, Gift, ShoppingCart, Crown, UserCheck, UserX, Loader2 } from "lucide-react";
import { BotHealthWidget } from "@/components/admin/BotHealthWidget";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function UserStatsWidget() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-user-stats"],
    queryFn: async () => {
      const [{ data: perfis }, { data: roles }, { data: plans }] = await Promise.all([
        supabase.from("perfis").select("id, plan_id, is_bot, status_assinatura").eq("is_bot", false),
        supabase.from("user_roles").select("user_id, role").eq("role", "premium"),
        supabase.from("plans").select("id, name, price").order("display_order"),
      ]);

      const users = perfis || [];
      const premiumUserIds = new Set((roles || []).map(r => r.user_id));
      const paidPlanIds = new Set((plans || []).filter(p => p.price > 0).map(p => p.id));

      const total = users.length;
      const pagos = users.filter(u =>
        premiumUserIds.has(u.id) ||
        (u.plan_id && paidPlanIds.has(u.plan_id)) ||
        u.status_assinatura === "ativa"
      ).length;
      const free = total - pagos;

      const planList = (plans || []).map(plan => ({
        name: plan.name,
        count: users.filter(u => u.plan_id === plan.id).length,
      }));

      const semPlano = users.filter(u => !u.plan_id).length;

      return { total, pagos, free, planList, semPlano };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Resumo de Usuários</h2>
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.pagos}</p>
            <p className="text-xs text-muted-foreground">Pagos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserX className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.free}</p>
            <p className="text-xs text-muted-foreground">Free</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" /> Por Plano
          </p>
          {stats.planList.map(plan => (
            <div key={plan.name} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{plan.name}</span>
              <span className="font-medium">{plan.count}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm border-t pt-2 border-border">
            <span className="text-muted-foreground">Sem plano</span>
            <span className="font-medium">{stats.semPlano}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminIndex() {
  return (
    <MainLayout>
      <div className="container-senior py-8">
        <h1 className="text-3xl font-bold mb-8">Painel Administrativo</h1>
        
        {/* User Stats */}
        <div className="mb-8">
          <UserStatsWidget />
        </div>

        {/* Bot Health Widget */}
        <div className="mb-8">
          <BotHealthWidget />
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Planos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-senior-lg">
                <FileText className="h-6 w-6 text-primary" />
                Gerenciar Planos
              </CardTitle>
              <CardDescription className="text-senior-base">
                Criar, editar e configurar planos e features do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/planos">
                <Button className="w-full gap-2 h-12 text-senior-base">
                  Acessar <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Usuários */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-senior-lg">
                <Users className="h-6 w-6 text-primary" />
                Gerenciar Usuários
              </CardTitle>
              <CardDescription className="text-senior-base">
                Administrar perfis, planos e permissões de usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/usuarios">
                <Button className="w-full gap-2 h-12 text-senior-base">
                  Acessar <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Bots */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-senior-lg">
                <Bot className="h-6 w-6 text-primary" />
                Gerenciar Bots
              </CardTitle>
              <CardDescription className="text-senior-base">
                Administrar especialistas virtuais e automação de posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/bots">
                <Button className="w-full gap-2 h-12 text-senior-base">
                  Acessar <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Custos IA */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-senior-lg">
                <DollarSign className="h-6 w-6 text-primary" />
                Custos de IA
              </CardTitle>
              <CardDescription className="text-senior-base">
                Monitorar gastos com tokens, bots e ferramentas de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/custos">
                <Button className="w-full gap-2 h-12 text-senior-base">
                  Acessar <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Convites */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-senior-lg">
                <Gift className="h-6 w-6 text-primary" />
                Convites
              </CardTitle>
              <CardDescription className="text-senior-base">
                Ranking de indicadores por vendas e cadastros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/convites">
                <Button className="w-full gap-2 h-12 text-senior-base">
                  Acessar <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Vendas Kirvano */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-senior-lg">
                <ShoppingCart className="h-6 w-6 text-primary" />
                Vendas Kirvano
              </CardTitle>
              <CardDescription className="text-senior-base">
                Histórico de vendas e webhooks recebidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/vendas">
                <Button className="w-full gap-2 h-12 text-senior-base">
                  Acessar <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
