import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BotHealth {
  id: string;
  name: string;
  ativo: boolean;
  can_create_posts: boolean;
  ultimo_post_em: string | null;
  total_posts: number;
  successRate: number;
  recentErrors: number;
  role: string;
}

export function BotHealthWidget() {
  const [bots, setBots] = useState<BotHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBots: 0,
    activeBots: 0,
    totalPosts24h: 0,
    totalErrors24h: 0
  });

  useEffect(() => {
    fetchBotHealth();
  }, []);

  const fetchBotHealth = async () => {
    try {
      // Fetch bots with profiles
      const { data: guides, error: guidesError } = await supabase
        .from("guide_personas")
        .select(`
          id,
          ativo,
          can_create_posts,
          ultimo_post_em,
          total_posts,
          is_result_author,
          is_strategy_author,
          is_sales_author,
          is_system_sales_author,
          perfis:perfil_id (
            nome
          )
        `)
        .order("created_at", { ascending: true });

      if (guidesError) throw guidesError;

      // Fetch logs from last 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: logs, error: logsError } = await supabase
        .from("bot_publishing_logs")
        .select("guide_persona_id, event_type, created_at")
        .gte("created_at", yesterday.toISOString());

      if (logsError) throw logsError;

      // Process bot health data
      const botsHealth: BotHealth[] = (guides || []).map((guide) => {
        const botLogs = (logs || []).filter(l => l.guide_persona_id === guide.id);
        const successLogs = botLogs.filter(l => l.event_type === "success");
        const errorLogs = botLogs.filter(l => l.event_type === "error" || l.event_type === "permission_denied");
        
        const totalLogs = botLogs.filter(l => l.event_type !== "skipped").length;
        const successRate = totalLogs > 0 ? (successLogs.length / totalLogs) * 100 : 100;

        // Determine role
        let role = "Geral";
        if (guide.is_result_author) role = "Resultados";
        else if (guide.is_strategy_author) role = "Estratégia";
        else if (guide.is_sales_author) role = "Vendas";
        else if (guide.is_system_sales_author) role = "Vendas Sistema";

        return {
          id: guide.id,
          name: (guide.perfis as { nome: string } | null)?.nome || "Bot",
          ativo: guide.ativo ?? false,
          can_create_posts: guide.can_create_posts ?? false,
          ultimo_post_em: guide.ultimo_post_em,
          total_posts: guide.total_posts || 0,
          successRate,
          recentErrors: errorLogs.length,
          role
        };
      });

      // Calculate global stats
      const totalPosts24h = (logs || []).filter(l => l.event_type === "success").length;
      const totalErrors24h = (logs || []).filter(l => l.event_type === "error" || l.event_type === "permission_denied").length;

      setStats({
        totalBots: botsHealth.length,
        activeBots: botsHealth.filter(b => b.ativo && b.can_create_posts).length,
        totalPosts24h,
        totalErrors24h
      });

      setBots(botsHealth);
    } catch (err) {
      console.error("Error fetching bot health:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (bot: BotHealth) => {
    if (!bot.ativo) {
      return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Inativo</Badge>;
    }
    if (!bot.can_create_posts) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Sem Permissão</Badge>;
    }
    if (bot.recentErrors > 0) {
      return <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600"><AlertTriangle className="h-3 w-3" /> {bot.recentErrors} erros</Badge>;
    }
    return <Badge variant="outline" className="gap-1 border-green-500 text-green-600"><CheckCircle2 className="h-3 w-3" /> OK</Badge>;
  };

  const formatLastPost = (date: string | null) => {
    if (!date) return "Nunca postou";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Saúde dos Bots
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-senior-lg">
          <Activity className="h-5 w-5 text-primary" />
          Saúde dos Bots
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.totalBots}</div>
            <div className="text-xs text-muted-foreground">Total Bots</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeBots}</div>
            <div className="text-xs text-muted-foreground">Ativos</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalPosts24h}</div>
            <div className="text-xs text-muted-foreground">Posts (24h)</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.totalErrors24h}</div>
            <div className="text-xs text-muted-foreground">Erros (24h)</div>
          </div>
        </div>

        {/* Bot List */}
        <div className="space-y-2">
          {bots.map((bot) => (
            <div 
              key={bot.id} 
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{bot.name}</span>
                  <Badge variant="outline" className="text-xs">{bot.role}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatLastPost(bot.ultimo_post_em)}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {bot.total_posts} posts
                  </span>
                  <span className={`${bot.successRate >= 80 ? "text-green-600" : bot.successRate >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                    {bot.successRate.toFixed(0)}% sucesso
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 ml-2">
                {getStatusBadge(bot)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
