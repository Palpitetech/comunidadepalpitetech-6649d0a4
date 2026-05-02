import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, TrendingUp, ShieldAlert, AlertTriangle, Inbox, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format, startOfDay, subDays, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MetricCard, toneClass, type Tone } from "./shared/MetricCard";

interface ScheduleInfo {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  last_ran_at: string | null;
  next_run_at: string | null;
}

function describeSchedule(schedule: string): string {
  const m = schedule.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
  if (m) return `A cada ${m[1]} minuto${m[1] === "1" ? "" : "s"}`;
  return schedule;
}

interface RunRow {
  id: string;
  ran_at: string;
  enqueued: number;
  skipped_dedupe: number;
  skipped_converted: number;
  skipped_paid_profile: number;
  skipped_no_phone: number;
  blocked_by_db_constraint: number;
  errors_dedupe_db: number;
  errors_sales_db: number;
  errors_insert_db: number;
  errors: string[] | null;
}

interface DailyAgg {
  day: string;
  enqueued: number;
  dedupe: number;
  db_errors: number;
  runs: number;
}

export function RetargetingPanelTab() {
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);
  const [now, setNow] = useState(() => new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const since = subDays(new Date(), 7).toISOString();

    const runsRes = await supabase
      .from("lead_retargeting_runs" as never)
      .select("*")
      .gte("ran_at", since)
      .order("ran_at", { ascending: false })
      .limit(200);
    if (!runsRes.error && runsRes.data) setRuns(runsRes.data as unknown as RunRow[]);

    const schedRes = await (supabase.rpc as unknown as (
      fn: string
    ) => Promise<{ data: unknown; error: unknown }>)("get_lead_retargeting_schedule");
    if (!schedRes.error && Array.isArray(schedRes.data) && schedRes.data.length > 0) {
      setSchedule(schedRes.data[0] as ScheduleInfo);
    } else {
      setSchedule(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tick a cada 30s para atualizar contagem regressiva da próxima execução
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Aggregate by day (memoized)
  const { dailyRows, today, total7d } = useMemo(() => {
    const byDay = new Map<string, DailyAgg>();
    for (const r of runs) {
      const day = startOfDay(new Date(r.ran_at)).toISOString().slice(0, 10);
      const acc = byDay.get(day) ?? { day, enqueued: 0, dedupe: 0, db_errors: 0, runs: 0 };
      acc.enqueued += r.enqueued;
      acc.dedupe += r.skipped_dedupe + r.blocked_by_db_constraint;
      acc.db_errors += r.errors_dedupe_db + r.errors_sales_db + r.errors_insert_db;
      acc.runs += 1;
      byDay.set(day, acc);
    }
    const dailyRows = Array.from(byDay.values()).sort((a, b) => b.day.localeCompare(a.day));
    const todayKey = startOfDay(new Date()).toISOString().slice(0, 10);
    const today = byDay.get(todayKey) ?? { day: todayKey, enqueued: 0, dedupe: 0, db_errors: 0, runs: 0 };
    const total7d = dailyRows.reduce(
      (acc, d) => ({
        enqueued: acc.enqueued + d.enqueued,
        dedupe: acc.dedupe + d.dedupe,
        db_errors: acc.db_errors + d.db_errors,
      }),
      { enqueued: 0, dedupe: 0, db_errors: 0 }
    );
    return { dailyRows, today, total7d };
  }, [runs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Métricas das execuções automáticas de retargeting (últimos 7 dias).
        </p>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
      </div>

      {/* Status do agendamento */}
      <ScheduleStatusCard schedule={schedule} now={now} />

      {/* Legacy summary metrics removed - centralized in CommunicationQuickMetrics via Header */}

      {/* Daily breakdown */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Por dia
        </h3>
        {dailyRows.length === 0 ? (
          <Card className="p-6 flex flex-col items-center text-muted-foreground gap-2">
            <Inbox className="h-7 w-7 opacity-40" />
            <p className="text-sm">Nenhuma execução registrada nos últimos 7 dias</p>
          </Card>
        ) : (
          <Card className="divide-y">
            {dailyRows.map((d) => (
              <div key={d.day} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {format(new Date(d.day + "T12:00:00"), "EEE, dd/MM", { locale: ptBR })}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {d.runs} execução(ões)
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <Stat label="Enfileiradas" value={d.enqueued} tone="success" />
                  <Stat label="Dedupe" value={d.dedupe} tone="warning" />
                  <Stat label="Erros" value={d.db_errors} tone={d.db_errors > 0 ? "error" : "muted"} />
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Recent errors */}
      {runs.some((r) => r.errors && r.errors.length > 0) && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Últimos erros registrados
          </h3>
          <Card className="divide-y max-h-72 overflow-y-auto">
            {runs
              .filter((r) => r.errors && r.errors.length > 0)
              .slice(0, 10)
              .map((r) => (
                <div key={r.id} className="px-3 py-2.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {format(new Date(r.ran_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                    </span>
                    <Badge variant="destructive" className="text-[10px]">
                      {r.errors!.length} erro(s)
                    </Badge>
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
                    {r.errors!.slice(0, 3).map((e, i) => (
                      <li key={i} className="break-words">{e}</li>
                    ))}
                    {r.errors!.length > 3 && (
                      <li className="opacity-60">+{r.errors!.length - 3} outros…</li>
                    )}
                  </ul>
                </div>
              ))}
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <div className={`rounded-md border px-2 py-1 text-center min-w-[58px] ${toneClass(tone)}`}>
      <p className="text-sm font-bold tabular-nums leading-none">{value}</p>
      <p className="text-[9px] uppercase tracking-wide opacity-80 mt-0.5">{label}</p>
    </div>
  );
}

function ScheduleStatusCard({
  schedule,
  now,
}: {
  schedule: ScheduleInfo | null;
  now: Date;
}) {
  if (!schedule) {
    return (
      <Card className="p-3 flex items-center gap-2 border-amber-500/40 bg-amber-500/5">
        <XCircle className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700">
          Nenhum agendamento automático foi encontrado para o retargeting.
        </p>
      </Card>
    );
  }

  const next = schedule.next_run_at ? new Date(schedule.next_run_at) : null;
  const last = schedule.last_ran_at ? new Date(schedule.last_ran_at) : null;
  const inFuture = next && next.getTime() > now.getTime();
  const countdown = inFuture
    ? formatDistanceToNowStrict(next, { locale: ptBR, addSuffix: false })
    : null;

  return (
    <Card className="p-3 sm:p-4 border-primary/30 bg-primary/5">
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        <div className="flex items-center gap-2 min-w-0">
          {schedule.active ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Frequência</p>
            <p className="text-sm font-semibold leading-tight truncate">
              {describeSchedule(schedule.schedule)}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono leading-tight">
              {schedule.schedule} {schedule.active ? "" : "(inativo)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Próxima execução
            </p>
            <p className="text-sm font-semibold leading-tight tabular-nums">
              {next ? format(next, "HH:mm", { locale: ptBR }) : "—"}
              {countdown && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (em {countdown})
                </span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {next ? format(next, "dd/MM 'às' HH:mm:ss", { locale: ptBR }) : "indisponível"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Última execução
            </p>
            <p className="text-sm font-semibold leading-tight tabular-nums">
              {last ? format(last, "HH:mm:ss", { locale: ptBR }) : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {last
                ? `há ${formatDistanceToNowStrict(last, { locale: ptBR })}`
                : "nunca executou"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
