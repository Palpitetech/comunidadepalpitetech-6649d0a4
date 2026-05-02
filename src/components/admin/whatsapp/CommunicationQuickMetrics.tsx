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
        
        // WhatsApp Instances
        const { count: instancesOnline } = await supabase
          .from("whatsapp_instances")
          .select("*", { count: 'exact', head: true })
          .eq("status", "connected");

        const { count: totalInstances } = await supabase
          .from("whatsapp_instances")
          .select("*", { count: 'exact', head: true });

        setMetrics({
          whatsapp: { 
            online: instancesOnline || 0, 
            total: totalInstances || 0 
          },
          proxies: { 
            online: 8, // Mocked for now
            total: 10 
          },
          templates: { 
            approved: 45, // Mocked for now
            pending: 3 
          },
          queue: { 
            pending: 12, // Mocked for now
            processed: 850 
          },
          logs: { 
            errors: 2 // Mocked for now
          },
          email: { 
            sent: 1250, // Mocked for now
            bounce: 5 
          }
        });
      } catch (error) {
        console.error("Erro ao buscar métricas rápidas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center gap-4 py-1 animate-pulse">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === "instancias") {
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <Smartphone className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Instâncias Conectadas:</span>
          <span className={cn(
            "text-[10px] md:text-xs font-bold",
            metrics?.whatsapp?.online === metrics?.whatsapp?.total ? "text-green-500" : "text-yellow-500"
          )}>
            {metrics?.whatsapp?.online}/{metrics?.whatsapp?.total}
          </span>
        </div>
      );
    }

    if (activeTab === "proxies") {
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <Globe className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Proxies Online:</span>
          <span className="text-[10px] md:text-xs font-bold text-green-500">
            {metrics?.proxies?.online}/{metrics?.proxies?.total}
          </span>
        </div>
      );
    }

    if (activeTab === "templates" || activeTab === "email-templates") {
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Templates:</span>
          <span className="text-[10px] md:text-xs font-bold text-green-500">{metrics?.templates?.approved} aprovados</span>
          <span className="text-[10px] md:text-xs font-bold text-yellow-500">{metrics?.templates?.pending} pendentes</span>
        </div>
      );
    }

    if (activeTab.includes("fila") || activeTab.includes("disparo") || activeTab === "mensagens") {
      return (
        <>
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Aguardando:</span>
            <span className="text-[10px] md:text-xs font-bold text-yellow-500">{metrics?.queue?.pending}</span>
          </div>
          <div className="h-3 w-px bg-border shrink-0 mx-1" />
          <div className="flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Enviados (24h):</span>
            <span className="text-[10px] md:text-xs font-bold text-green-500">{metrics?.queue?.processed}</span>
          </div>
        </>
      );
    }

    if (activeTab.includes("logs") || activeTab === "email-suppressions") {
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <ShieldAlert className={cn("h-3 w-3", (metrics?.logs?.errors || 0) > 0 ? "text-destructive" : "text-muted-foreground")} />
          <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Alertas/Erros Recentes:</span>
          <span className={cn("text-[10px] md:text-xs font-bold", (metrics?.logs?.errors || 0) > 0 ? "text-destructive" : "text-green-500")}>
            {metrics?.logs?.errors}
          </span>
        </div>
      );
    }

    // Default Fallback
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <Smartphone className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Status Geral:</span>
        <span className="text-[10px] md:text-xs font-bold text-green-500">Operacional</span>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3 md:gap-5 py-1 px-1 overflow-x-auto no-scrollbar">
      {renderContent()}
      {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto shrink-0" />}
    </div>
  );
}
