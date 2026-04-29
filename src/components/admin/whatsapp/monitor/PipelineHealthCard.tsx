import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  CalendarCheck,
  ListChecks,
  Smartphone,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  formatBRT,
  timeAgoBRT,
  currentHourBRT,
  toBRTDate,
  todayBRT,
} from "@/lib/dateUtils";
import { getHealthStyle, type HealthStatus } from "./healthStatus";

interface CardData {
  status: HealthStatus;
  primary: string;
  secondary: React.ReactNode;
}

const REFRESH_MS = 60_000;

export default function PipelineHealthCard() {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [prepare, setPrepare] = useState<CardData | null>(null);
  const [fila, setFila] = useState<CardData | null>(null);
  const [instancias, setInstancias] = useState<CardData | null>(null);
  const [proximo, setProximo] = useState<CardData | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // ---------- PREPARE ----------
      const { data: prepData, error: prepErr } = await supabase
        .from("group_blast_prepare_runs")
        .select("ran_at, slots_scheduled, slots_resolved, slots_failed_resolution, error_message")
        .order("ran_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prepErr) throw prepErr;

      const today = todayBRT();
      const ranDate = prepData ? toBRTDate(prepData.ran_at) : null;
      const hour = currentHourBRT();
      let prepStatus: HealthStatus = "warn";
      if (prepData && ranDate === today) prepStatus = "ok";
      else if (hour >= 5) prepStatus = "critical";

      setPrepare({
        status: prepStatus,
        primary: prepData ? String(prepData.slots_scheduled ?? 0) : "—",
        secondary: prepData ? formatBRT(prepData.ran_at) : "Nunca executou",
      });

      // ---------- FILA ----------
      // Pega janela de "hoje" em UTC equivalente a 00:00 BRT
      const startOfDayBRT = new Date(`${today}T00:00:00-03:00`).toISOString();
      const { data: logs, error: logsErr } = await supabase
        .from("group_blast_logs")
        .select("status, created_at")
        .gte("created_at", startOfDayBRT);
      if (logsErr) throw logsErr;

      const counts = { pending: 0, sent: 0, failed: 0, oldPending: 0 };
      const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
      (logs || []).forEach((l: any) => {
        if (l.status === "pending") {
          counts.pending++;
          if (new Date(l.created_at).getTime() < thirtyMinAgo) counts.oldPending++;
        } else if (l.status === "sent") counts.sent++;
        else if (l.status === "failed") counts.failed++;
      });

      let filaStatus: HealthStatus = "ok";
      if (counts.pending > 10 && counts.oldPending > 0) filaStatus = "critical";
      else if (counts.failed > 0) filaStatus = "warn";

      setFila({
        status: filaStatus,
        primary: String(counts.pending),
        secondary: (
          <span className="flex items-center gap-2">
            <span className="text-green-700">{counts.sent} enviados</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-red-700">{counts.failed} falhas</span>
          </span>
        ),
      });

      // ---------- INSTÂNCIAS ----------
      const { data: insts, error: instErr } = await supabase
        .from("whatsapp_instances")
        .select("id, friendly_name, name, status");
      if (instErr) throw instErr;

      const total = insts?.length ?? 0;
      const online = (insts || []).filter((i: any) => i.status === "open").length;
      const offlineNames = (insts || [])
        .filter((i: any) => i.status !== "open")
        .map((i: any) => i.friendly_name || i.name || "?");

      let instStatus: HealthStatus = "ok";
      if (total > 0 && online === 0) instStatus = "critical";
      else if (offlineNames.length > 0) instStatus = "warn";

      setInstancias({
        status: instStatus,
        primary: `${online} / ${total}`,
        secondary:
          offlineNames.length === 0 ? (
            "Todas online"
          ) : (
            <span className="text-red-700">
              {offlineNames.slice(0, 3).join(", ")}
              {offlineNames.length > 3 ? ` +${offlineNames.length - 3} mais` : ""}
            </span>
          ),
      });

      // ---------- PRÓXIMO ENVIO ----------
      const nowIso = new Date().toISOString();
      const { data: next, error: nextErr } = await supabase
        .from("group_blast_logs")
        .select("scheduled_for, group_jid, config_id")
        .eq("status", "pending")
        .gt("scheduled_for", nowIso)
        .order("scheduled_for", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (nextErr) throw nextErr;

      let proxStatus: HealthStatus = "warn";
      let proxPrimary = "—";
      let proxSecondary: React.ReactNode = "Nenhum agendamento futuro";

      if (next) {
        const sameDay = toBRTDate(next.scheduled_for) === today;
        proxStatus = sameDay ? "ok" : "warn";
        proxPrimary = formatBRT(next.scheduled_for);

        let configName = "—";
        if (next.config_id) {
          const { data: cfg } = await supabase
            .from("group_blast_configs")
            .select("name")
            .eq("id", next.config_id)
            .maybeSingle();
          configName = cfg?.name ?? "—";
        }
        const jid = (next.group_jid || "").slice(-12);
        proxSecondary = `${configName} · …${jid}`;
      }

      setProximo({
        status: proxStatus,
        primary: proxPrimary,
        secondary: proxSecondary,
      });

      setLastUpdated(new Date().toISOString());
    } catch (err: any) {
      toast.error("Falha ao carregar Pipeline Health: " + (err?.message ?? "erro"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Pipeline Health</h3>
          <p className="text-xs text-muted-foreground">
            {lastUpdated ? `Atualizado ${timeAgoBRT(lastUpdated)}` : "Carregando…"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchAll}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </Button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HealthCard
          icon={<CalendarCheck className="h-4 w-4" />}
          title="Prepare"
          data={prepare}
        />
        <HealthCard
          icon={<ListChecks className="h-4 w-4" />}
          title="Fila"
          data={fila}
        />
        <HealthCard
          icon={<Smartphone className="h-4 w-4" />}
          title="Instâncias"
          data={instancias}
        />
        <HealthCard
          icon={<Clock className="h-4 w-4" />}
          title="Próximo Envio"
          data={proximo}
        />
      </div>
    </section>
  );
}

function HealthCard({
  icon,
  title,
  data,
}: {
  icon: React.ReactNode;
  title: string;
  data: CardData | null;
}) {
  const status: HealthStatus = data?.status ?? "neutral";
  const style = getHealthStyle(status);

  return (
    <Card className={cn("border-l-4", style.borderClass)}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {icon}
            <span className="text-xs font-medium uppercase tracking-wide">
              {title}
            </span>
          </div>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-md font-medium",
              style.badgeClass,
            )}
          >
            {style.label}
          </span>
        </div>
        <div>
          <div className="text-2xl font-bold leading-tight">
            {data?.primary ?? "…"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {data?.secondary ?? " "}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
