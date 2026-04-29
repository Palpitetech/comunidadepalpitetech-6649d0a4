import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ScheduleInfo {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  last_ran_at: string | null;
  next_run_at: string | null;
}

function describeSchedule(schedule: string): string {
  if (schedule === "* * * * *") return "A cada 1 minuto";
  if (schedule === "*/30 * * * *") return "A cada 30 minutos";
  if (schedule === "0 7 * * *") return "Diário às 04:00 BRT (07:00 UTC)";
  return schedule;
}

interface TodayCounts {
  pending: number;
  sent: number;
  failed: number;
}

interface Props {
  onAfterReschedule?: () => void;
}

export function GroupBlastScheduleCard({ onAfterReschedule }: Props) {
  const [items, setItems] = useState<ScheduleInfo[]>([]);
  const [counts, setCounts] = useState<TodayCounts>({ pending: 0, sent: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    const [scheduleRes, countsRes] = await Promise.all([
      (supabase.rpc as unknown as (
        fn: string
      ) => Promise<{ data: unknown; error: unknown }>)(
        "get_group_blast_schedule"
      ),
      (async () => {
        // Janela de "hoje" em BRT (UTC-3): das 03:00 UTC do dia atual até 03:00 UTC do dia seguinte
        const nowUtc = new Date();
        const startBrt = new Date(nowUtc);
        startBrt.setUTCHours(3, 0, 0, 0);
        if (nowUtc.getTime() < startBrt.getTime()) {
          startBrt.setUTCDate(startBrt.getUTCDate() - 1);
        }
        const endBrt = new Date(startBrt.getTime() + 24 * 60 * 60 * 1000);
        const { data } = await supabase
          .from("group_blast_logs")
          .select("status")
          .gte("scheduled_for", startBrt.toISOString())
          .lt("scheduled_for", endBrt.toISOString());
        const acc: TodayCounts = { pending: 0, sent: 0, failed: 0 };
        for (const row of data ?? []) {
          const s = (row as { status: string }).status;
          if (s === "pending") acc.pending++;
          else if (s === "sent") acc.sent++;
          else if (s === "failed") acc.failed++;
        }
        return acc;
      })(),
    ]);

    if (!scheduleRes.error && Array.isArray(scheduleRes.data)) {
      setItems(scheduleRes.data as ScheduleInfo[]);
    } else {
      setItems([]);
    }
    setCounts(countsRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  async function handleReschedule() {
    if (
      !confirm(
        "Reagendar agora todos os disparos pendentes? Isso força um 'prepare' fora do horário automático."
      )
    )
      return;
    setRescheduling(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "group-blast-send",
        { body: { action: "prepare" } }
      );
      if (error) throw error;
      const prepared = (data as { prepared?: number })?.prepared ?? 0;
      const skipped = (data as { skipped_dedup?: number })?.skipped_dedup ?? 0;
      toast.success(
        `✅ Reagendado: ${prepared} novo(s), ${skipped} pulados por dedup`
      );
      await fetchSchedule();
      onAfterReschedule?.();
    } catch (err: any) {
      toast.error("Erro ao reagendar: " + (err?.message ?? String(err)));
    } finally {
      setRescheduling(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-3 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-3 flex items-center gap-2 border-amber-500/40 bg-amber-500/5">
        <XCircle className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700">
          Nenhum agendamento automático encontrado.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-3 sm:p-4 border-primary/30 bg-primary/5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Agendamento automático
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSchedule}
            className="h-7 px-2 gap-1 text-xs"
          >
            <RefreshCw className="h-3 w-3" /> Atualizar
          </Button>
          <Button
            size="sm"
            onClick={handleReschedule}
            disabled={rescheduling}
            className="h-7 px-2 gap-1 text-xs"
          >
            {rescheduling ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <PlayCircle className="h-3 w-3" />
            )}
            Reagendar agora
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((s) => {
          const next = s.next_run_at ? new Date(s.next_run_at) : null;
          const last = s.last_ran_at ? new Date(s.last_ran_at) : null;
          const inFuture = next && next.getTime() > now.getTime();
          const countdown =
            inFuture && next
              ? formatDistanceToNowStrict(next, { locale: ptBR })
              : null;

          return (
            <div
              key={s.jobid}
              className="rounded-md border bg-card p-2.5 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                {s.active ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                )}
                <p className="text-xs font-semibold truncate">{s.jobname}</p>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {describeSchedule(s.schedule)}
                {!s.active && (
                  <span className="ml-1 text-red-600">(inativo)</span>
                )}
              </p>

              <div className="flex items-center gap-1.5 text-[11px]">
                <Clock className="h-3 w-3 text-primary shrink-0" />
                <span className="text-muted-foreground">Próx.:</span>
                <span className="font-semibold tabular-nums">
                  {next
                    ? format(next, "dd/MM HH:mm", { locale: ptBR })
                    : "—"}
                </span>
                {countdown && (
                  <span className="text-muted-foreground">
                    (em {countdown})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Última:</span>
                <span className="font-semibold tabular-nums">
                  {last
                    ? format(last, "dd/MM HH:mm:ss", { locale: ptBR })
                    : "nunca"}
                </span>
                {last && (
                  <span className="text-muted-foreground">
                    (há {formatDistanceToNowStrict(last, { locale: ptBR })})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
