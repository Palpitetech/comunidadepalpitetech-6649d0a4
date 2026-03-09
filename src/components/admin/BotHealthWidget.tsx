import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle2, XCircle, AlertTriangle, Clock, TrendingUp
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
      const { data: guides, error: guidesError } = await supabase
        .from("guide_personas")
        .select(`
          id, ativo, can_create_posts, ultimo_post_em, total_posts,
          is_result_author, is_strategy_author, is_sales_author, is_system_sales_author,
          perfis:perfil_id ( nome )
        `)
        .order("created_at", { ascending: true });

      if (guidesError) throw guidesError;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: logs, error: logsError } = await supabase
        .from("bot_publishing_logs")
        .select("guide_persona_id, event_type, created_at")
        .gte("created_at", yesterday.toISOString());

      if (logsError) throw logsError;

      const botsHealth: BotHealth[] = (guides || []).map((guide) => {
        const botLogs = (logs || []).filter(l => l.guide_persona_id === guide.id);
        const successLogs = botLogs.filter(l => l.event_type === "success");
        const errorLogs = botLogs.filter(l => l.event_type === "error" || l.event_type === "permission_denied");
        const totalLogs = botLogs.filter(l => l.event_type !== "skipped").length;
        const successRate = totalLogs > 0 ? (successLogs.length / totalLogs) * 100 : 100;

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

  const getStatusIcon = (bot: BotHealth) => {
    if (!bot.ativo) return <XCircle className="h-3.5 w-3.5 text-muted-foreground" />;
    if (!bot.can_create_posts) return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    if (bot.recentErrors > 0) return <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />;
    return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
  };

  const formatLastPost = (date: string | null) => {
    if (!date) return "Nunca";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-muted/40 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold">{stats.totalBots}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-green-600">{stats.activeBots}</p>
          <p className="text-[10px] text-muted-foreground">Ativos</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-blue-600">{stats.totalPosts24h}</p>
          <p className="text-[10px] text-muted-foreground">Posts 24h</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-red-600">{stats.totalErrors24h}</p>
          <p className="text-[10px] text-muted-foreground">Erros 24h</p>
        </div>
      </div>

      {/* Bot List */}
      <div className="space-y-1">
        {bots.map((bot) => (
          <div 
            key={bot.id} 
            className="flex items-center gap-2.5 p-2.5 bg-muted/30 rounded-lg"
          >
            {getStatusIcon(bot)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate">{bot.name}</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0">{bot.role}</Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {formatLastPost(bot.ultimo_post_em)}
                </span>
                <span>·</span>
                <span>{bot.total_posts} posts</span>
                <span>·</span>
                <span className={bot.successRate >= 80 ? "text-green-600" : bot.successRate >= 50 ? "text-yellow-600" : "text-red-600"}>
                  {bot.successRate.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
