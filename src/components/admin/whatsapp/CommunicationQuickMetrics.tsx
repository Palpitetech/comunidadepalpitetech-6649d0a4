import { useEffect, useState } from "react";
import { Smartphone, Send, ScrollText, AlertCircle, Loader2, Globe, FileText, CheckCircle2, Clock, Mail, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CommunicationQuickMetricsProps {
  activeTab: string;
}

export function CommunicationQuickMetrics({ activeTab }: CommunicationQuickMetricsProps) {
  const [metrics, setMetrics] = useState<{
    whatsapp?: { online: number; total: number };
    proxies?: { online: number; total: number };
    templates?: { approved: number; pending: number };
    queue?: { pending: number; processed: number };
    logs?: { errors: number };
    email?: { sent: number; bounce: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        // Em um cenário real, você buscaria esses dados de suas tabelas do Supabase
        // Como o foco é a UI, vamos simular os dados, mas estruturado para expansão
        
        // Simulação de busca nas tabelas (substituir pelas queries reais quando necessário)
        const { count: instancesOnline } = await supabase
          .from("whatsapp_instances")
          .select("*", { count: 'exact', head: true })
          .eq("status", "connected");

        const { count: totalInstances } = await supabase
          .from("whatsapp_instances")
          .select("*", { count: 'exact', head: true });

        // Simulando outros dados por enquanto
        setMetrics({
          instancesOnline: instancesOnline || 0,
          totalInstances: totalInstances || 0,
          pendingQueue: 12, // Exemplo
          errorsToday: 0    // Exemplo
        });
      } catch (error) {
        console.error("Erro ao buscar métricas rápidas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    
    // Refresh a cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex items-center gap-4 py-1 animate-pulse">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 md:gap-5 py-1 px-1 overflow-x-auto no-scrollbar">
      {/* WhatsApp Status */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Smartphone className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Whats:</span>
        <span className={cn(
          "text-[10px] md:text-xs font-bold",
          metrics?.instancesOnline === metrics?.totalInstances ? "text-green-500" : "text-yellow-500"
        )}>
          {metrics?.instancesOnline}/{metrics?.totalInstances}
        </span>
      </div>

      <div className="h-3 w-px bg-border shrink-0" />

      {/* Queue Status */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Send className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Fila:</span>
        <span className="text-[10px] md:text-xs font-bold text-foreground">
          {metrics?.pendingQueue}
        </span>
      </div>

      <div className="h-3 w-px bg-border shrink-0" />

      {/* Errors Status */}
      <div className="flex items-center gap-1.5 shrink-0">
        <AlertCircle className={cn(
          "h-3 w-3",
          (metrics?.errorsToday || 0) > 0 ? "text-destructive" : "text-muted-foreground"
        )} />
        <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Erros:</span>
        <span className={cn(
          "text-[10px] md:text-xs font-bold",
          (metrics?.errorsToday || 0) > 0 ? "text-destructive" : "text-foreground"
        )}>
          {metrics?.errorsToday}
        </span>
      </div>

      {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto shrink-0" />}
    </div>
  );
}
