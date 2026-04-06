import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, Users, Bot, DollarSign, Gift, ShoppingCart, Crown, 
  UserCheck, UserX, Loader2, ChevronRight, Activity, Plug, Clock, BarChart2, Video
} from "lucide-react";
import { BotHealthWidget } from "@/components/admin/BotHealthWidget";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function UserStatsWidget() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-user-stats"],
    queryFn: async () => {
      const [{ data: perfis }, { data: roles }, { data: plans }] = await Promise.all([
        supabase.from("perfis").select("id, plan_id, is_bot, status_assinatura, email_verificado").eq("is_bot", false),
        supabase.from("user_roles").select("user_id, role").eq("role", "premium"),
        supabase.from("plans").select("id, name, price").order("display_order"),
      ]);

      const users = perfis || [];
      const premiumUserIds = new Set((roles || []).map(r => r.user_id));
      const paidPlanIds = new Set((plans || []).filter(p => p.price > 0).map(p => p.id));

      const total = users.length;
      const verificados = users.filter(u => u.email_verificado === true).length;
      const pendentes = total - verificados;
      const pagos = users.filter(u =>
        premiumUserIds.has(u.id) ||
        (u.plan_id && paidPlanIds.has(u.plan_id)) ||
        u.status_assinatura === "ativa"
      ).length;
      const free = total - pagos;

      const planList = (plans || []).map(plan => ({
        name: plan.name,
        count: users.filter(u => u.plan_id === plan.id).length,
      })).filter(p => p.count > 0);

      const semPlano = users.filter(u => !u.plan_id).length;

      return { total, verificados, pendentes, pagos, free, planList, semPlano };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-3">
      {/* Cadastros: total, verificados, pendentes */}
      <div className="bg-muted/30 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" /> Total cadastros
          </p>
          <span className="text-xl font-bold">{stats.total}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <UserCheck className="h-3 w-3 text-green-600" /> Verificados
          </span>
          <span className="font-medium">
            {stats.verificados}
            <span className="text-muted-foreground ml-1">
              {stats.total > 0 ? `${Math.round((stats.verificados / stats.total) * 100)}%` : "0%"}
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3 text-yellow-500" /> Pendentes
          </span>
          <span className="font-medium">
            {stats.pendentes}
            <span className="text-muted-foreground ml-1">
              {stats.total > 0 ? `${Math.round((stats.pendentes / stats.total) * 100)}%` : "0%"}
            </span>
          </span>
        </div>
      </div>

      {/* Pagos / Free */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/40 rounded-xl p-3 text-center">
          <UserCheck className="h-4 w-4 text-green-600 mx-auto mb-1" />
          <p className="text-xl font-bold">{stats.pagos}</p>
          <p className="text-[10px] text-muted-foreground">Pagos</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-3 text-center">
          <UserX className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
          <p className="text-xl font-bold">{stats.free}</p>
          <p className="text-[10px] text-muted-foreground">Free</p>
        </div>
      </div>

      {/* Plan breakdown */}
      <div className="bg-muted/30 rounded-xl p-3 space-y-1.5">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Crown className="h-3.5 w-3.5 text-primary" /> Por Plano
        </p>
        {stats.planList.map(plan => (
          <div key={plan.name} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{plan.name}</span>
            <span className="font-medium">{plan.count}</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-xs border-t pt-1.5 border-border/50">
          <span className="text-muted-foreground">Sem plano</span>
          <span className="font-medium">{stats.semPlano}</span>
        </div>
      </div>
    </div>
  );
}

const ADMIN_MODULES = [
  { to: "/admin/planos", icon: FileText, label: "Planos", desc: "Criar e configurar planos" },
  { to: "/admin/usuarios", icon: Users, label: "Usuários", desc: "Perfis, planos e permissões" },
  { to: "/admin/bots", icon: Bot, label: "Bots", desc: "Automação e especialistas" },
  { to: "/admin/custos", icon: DollarSign, label: "Custos IA", desc: "Monitorar gastos com IA" },
  { to: "/admin/convites", icon: Gift, label: "Convites", desc: "Ranking de indicações" },
  { to: "/admin/vendas", icon: ShoppingCart, label: "Vendas", desc: "Histórico Kirvano" },
  { to: "/admin/eventos", icon: Activity, label: "Eventos", desc: "Timeline de eventos por lead" },
  { to: "/admin/metricas", icon: BarChart2, label: "Métricas", desc: "UTM, conversão e receita" },
  { to: "/admin/integracoes", icon: Plug, label: "Integrações", desc: "Webhooks e fontes externas" },
  { to: "/admin/gravacao/lotofacil", icon: Video, label: "Gravação", desc: "Slides para gravação OBS" },
];

export default function AdminIndex() {
  return (
    <AdminLayout
      pageTitle="Admin"
    >
      <div className="px-4 py-3 md:container-senior md:py-8 space-y-4 md:space-y-6">
        {/* Desktop title */}
        <h1 className="hidden md:block text-3xl font-bold">Painel Administrativo</h1>

        {/* User Stats */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 md:text-lg md:text-foreground">Usuários</h2>
          <UserStatsWidget />
        </div>

        {/* Bot Health */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 md:text-lg md:text-foreground">Saúde dos Bots</h2>
          <BotHealthWidget />
        </div>

        {/* Quick Access Modules */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 md:text-lg md:text-foreground">Módulos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
            {ADMIN_MODULES.map(({ to, icon: Icon, label, desc }) => (
              <Link key={to} to={to}>
                <Card className="hover:bg-accent/50 transition-colors border-border/60">
                  <CardContent className="p-3 md:p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
