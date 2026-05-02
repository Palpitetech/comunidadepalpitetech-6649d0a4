import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Flame, MessageCircle, Users, Clock, Play, RefreshCw, Smartphone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";
import { cn } from "@/lib/utils";

/* ── Types ───────────────────────────────────────────── */

interface WarmingSchedule {
  id: string;
  hour_start: number;
  hour_end: number;
  min_messages: number;
  max_messages: number;
  is_active: boolean;
  theme: string;
  window_name: string;
  day_type: string;
}

interface WarmingLog {
  id: string;
  from_instance_id: string;
  to_instance_id: string;
  message_content: string | null;
  window_name: string | null;
  sent_at: string | null;
}

interface InstanceMap {
  [id: string]: string;
}

/* ── Helpers ─────────────────────────────────────────── */

function saoPauloNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
}

function getDayType(date: Date): string {
  const dow = date.getDay();
  if (dow === 0) return "sunday";
  if (dow === 6) return "saturday";
  return "weekday";
}

function formatWindowName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function windowEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("bom_dia") || lower.includes("manha")) return "🌅";
  if (lower.includes("almoco") || lower.includes("tarde")) return "☀️";
  if (lower.includes("noite")) return "🌙";
  return "⏰";
}

/* ── Component ───────────────────────────────────────── */

export function AquecimentoTab() {
  const isMobile = useIsMobile();
  const [schedules, setSchedules] = useState<WarmingSchedule[]>([]);
  const [logs, setLogs] = useState<WarmingLog[]>([]);
  const [instances, setInstances] = useState<InstanceMap>({});
  const [loading, setLoading] = useState(true);
  const [warming, setWarming] = useState(false);
  const [testing, setTesting] = useState(false);

  const fetchData = useCallback(async () => {
    const now = saoPauloNow();

    const spMidnight = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 3, 0, 0)
    ).toISOString();

    const [schedulesRes, logsRes, instancesRes] = await Promise.all([
      supabase
        .from("warming_schedule" as any)
        .select("*")
        .eq("is_active", true)
        .order("hour_start"),
      supabase
        .from("warming_logs" as any)
        .select("*")
        .gte("sent_at", spMidnight)
        .order("sent_at", { ascending: false }),
      supabase
        .from("whatsapp_instances" as any)
        .select("id, friendly_name, name"),
    ]);

    setSchedules((schedulesRes.data as any[]) || []);
    setLogs((logsRes.data as any[]) || []);

    const map: InstanceMap = {};
    ((instancesRes.data as any[]) || []).forEach((i: any) => {
      map[i.id] = i.friendly_name || i.name;
    });
    setInstances(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* ── Derived state ─────────────────────────────────── */

  const now = saoPauloNow();
  const currentHour = now.getHours();
  const dayType = getDayType(now);

  const activeWindow = schedules.find(
    (s) =>
      s.day_type === dayType &&
      s.is_active &&
      currentHour >= s.hour_start &&
      currentHour < s.hour_end
  );

  const nextWindow = (() => {
    const todayWindows = schedules
      .filter((s) => s.day_type === dayType && s.is_active && s.hour_start > currentHour)
      .sort((a, b) => a.hour_start - b.hour_start);
    if (todayWindows.length > 0) return todayWindows[0];

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowType = getDayType(tomorrow);
    const tomorrowWindows = schedules
      .filter((s) => s.day_type === tomorrowType && s.is_active)
      .sort((a, b) => a.hour_start - b.hour_start);
    return tomorrowWindows.length > 0 ? tomorrowWindows[0] : null;
  })();

  const uniqueConversations = new Set<string>();
  logs.forEach((log) => {
    const key = [log.from_instance_id, log.to_instance_id].sort().join("|") + "|" + (log.window_name || "");
    uniqueConversations.add(key);
  });

  const totalConversations = uniqueConversations.size;
  const totalMessages = logs.length;

  const lastLog = logs.length > 0 ? logs[0] : null;
  const lastPairText = lastLog
    ? `${instances[lastLog.from_instance_id] || "?"} ↔ ${instances[lastLog.to_instance_id] || "?"}`
    : "—";
  const lastPairTime = lastLog?.sent_at
    ? format(new Date(lastLog.sent_at), "HH:mm", { locale: ptBR })
    : "";

  const historyGroups = (() => {
    const groups: Record<string, {
      firstSentAt: string;
      fromId: string;
      toId: string;
      windowName: string;
      count: number;
    }> = {};

    logs.forEach((log) => {
      const pairSorted = [log.from_instance_id, log.to_instance_id].sort().join("|");
      const key = pairSorted + "|" + (log.window_name || "manual");
      if (!groups[key]) {
        groups[key] = {
          firstSentAt: log.sent_at || "",
          fromId: [log.from_instance_id, log.to_instance_id].sort()[0],
          toId: [log.from_instance_id, log.to_instance_id].sort()[1],
          windowName: log.window_name || "manual",
          count: 0,
        };
      }
      groups[key].count++;
      if (log.sent_at && log.sent_at > groups[key].firstSentAt) {
        groups[key].firstSentAt = log.sent_at;
      }
    });

    return Object.values(groups).sort(
      (a, b) => new Date(b.firstSentAt).getTime() - new Date(a.firstSentAt).getTime()
    );
  })();

  /* ── Handlers ──────────────────────────────────────── */

  const handleManualWarm = async () => {
    setWarming(true);
    try {
      const body: any = {};
      if (activeWindow) {
        body.window_name = activeWindow.window_name;
      }
      const { data, error } = await supabase.functions.invoke("warming-manual", {
        method: "POST",
        body,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`✅ ${data.instanceA} e ${data.instanceB} conversaram agora`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao aquecer dupla");
    } finally {
      setWarming(false);
    }
  };

  const handleTestAutomation = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("warming-run", {
        body: { action: "prepare", force: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.skipped) {
        toast.info(`⏭️ Pulado: ${data.skipped}`);
      } else {
        toast.success(`✅ Conversa agendada! ${data.scheduled || 0} mensagens serão enviadas nos próximos minutos.`);
      }
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao testar automação");
    } finally {
      setTesting(false);
    }
  };

  /* ── Render ────────────────────────────────────────── */

  return (
    <UnifiedLayout>
      <UnifiedToolbar
        left={
          <div className="flex gap-2">
            <ActionButton
              label="Testar Automação"
              icon={Play}
              onClick={handleTestAutomation}
              loading={testing}
            />
            <ActionButton
              label="Aquecer Dupla"
              icon={Flame}
              onClick={handleManualWarm}
              loading={warming}
              disabled={!activeWindow}
              variant="default"
            />
          </div>
        }
        right={
          <ActionButton
            label="Atualizar"
            icon={RefreshCw}
            onClick={fetchData}
          />
        }
      />

      <div className="space-y-6">
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="flex items-center gap-3 py-4">
            <span className="relative flex h-2 w-2">
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", activeWindow ? "bg-green-500" : "bg-muted-foreground/40")} />
              <span className={cn("relative inline-flex rounded-full h-2 w-2", activeWindow ? "bg-green-500" : "bg-muted-foreground/40")} />
            </span>
            <p className="text-xs font-medium">
              {activeWindow
                ? `${windowEmoji(activeWindow.window_name)} Janela Ativa: ${formatWindowName(activeWindow.window_name)} (${String(activeWindow.hour_start).padStart(2, "0")}h às ${String(activeWindow.hour_end).padStart(2, "0")}h)`
                : "Nenhuma janela de aquecimento ativa agora"}
            </p>
          </CardContent>
        </Card>

        <UnifiedList
          isLoading={loading}
          count={historyGroups.length}
          empty={{
            icon: Flame,
            message: "Nenhum aquecimento hoje",
            submessage: "O aquecimento evita o bloqueio de novas instâncias"
          }}
        >
          <div className="grid gap-2">
            {historyGroups.map((group, idx) => (
              <UnifiedCardItem key={idx} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Smartphone className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {instances[group.fromId] || "—"} ↔ {instances[group.toId] || "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {windowEmoji(group.windowName)} {formatWindowName(group.windowName)}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="secondary" className="h-5 text-[10px] tabular-nums">
                    {group.count} msgs
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {group.firstSentAt ? format(new Date(group.firstSentAt), "HH:mm") : "—"}
                  </span>
                </div>
              </UnifiedCardItem>
            ))}
          </div>
        </UnifiedList>
      </div>
    </UnifiedLayout>
  );
}
