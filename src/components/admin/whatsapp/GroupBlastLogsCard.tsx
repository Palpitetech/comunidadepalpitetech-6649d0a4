import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { ChevronDown, RotateCw, Send } from "lucide-react";
import { MessageStatusBadge } from "./shared/MessageStatusBadge";
import { fmtDate } from "./shared/format-date";

interface BlastLog {
  id: string;
  config_id: string;
  slot_id: string | null;
  instance_id: string | null;
  evolution_instance_id: string | null;
  group_jid: string;
  message_content: string;
  status: string;
  scheduled_for: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  retry_count: number;
  last_error_at: string | null;
}

interface ConfigLite {
  id: string;
  name: string;
}

interface PrepareRun {
  id: string;
  ran_at: string;
  config_id: string | null;
  slots_scheduled: number;
  skipped_dedup: number;
  error_message: string | null;
}

interface Props {
  configs: ConfigLite[];
}

const PAGE_SIZE = 100;

export function GroupBlastLogsCard({ configs }: Props) {
  const [logs, setLogs] = useState<BlastLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [configFilter, setConfigFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const [lastRun, setLastRun] = useState<PrepareRun | null>(null);

  useEffect(() => {
    fetchLogs();
    fetchLastRun();
  }, [statusFilter, configFilter, dateFrom, dateTo]);

  async function fetchLogs() {
    setLoading(true);
    let q = supabase
      .from("group_blast_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (configFilter !== "all") q = q.eq("config_id", configFilter);
    if (dateFrom) q = q.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      q = q.lte("created_at", end.toISOString());
    }

    const { data, error } = await q;
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar logs");
      setLoading(false);
      return;
    }
    setLogs((data as any) || []);
    setLoading(false);
  }

  async function fetchLastRun() {
    const { data } = await supabase
      .from("group_blast_prepare_runs")
      .select("*")
      .order("ran_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLastRun((data as any) || null);
  }

  async function handleRetry(log: BlastLog) {
    setRetrying((s) => ({ ...s, [log.id]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("group-blast-send", {
        body: { action: "retry", log_id: log.id },
      });
      if (error) throw error;
      if (data?.ok) {
        toast.success(`Reenviado via ${data.sent_via}`);
      } else {
        toast.error(data?.error || "Falha no reenvio");
      }
      await fetchLogs();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao reenviar");
    } finally {
      setRetrying((s) => ({ ...s, [log.id]: false }));
    }
  }

  function getConfigName(configId: string) {
    return configs.find((c) => c.id === configId)?.name || "—";
  }

  return (
    <div className="space-y-3">
      {/* Auditoria do último prepare */}
      {lastRun && (
        <Card className="border-dashed">
          <CardContent className="py-3 px-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="font-medium">Último prepare:</span>
            <span>{fmtDate(lastRun.ran_at, "full")}</span>
            <Badge variant="secondary" className="text-[10px]">
              {lastRun.slots_scheduled} agendados
            </Badge>
            {lastRun.skipped_dedup > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {lastRun.skipped_dedup} dedup
              </Badge>
            )}
            {lastRun.error_message && (
              <span className="text-destructive truncate max-w-md">
                {lastRun.error_message}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Send className="h-4 w-4" />
            Histórico Detalhado de Envios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sent">Enviados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>

            <Select value={configFilter} onValueChange={setConfigFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Config" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas configs</SelectItem>
                {configs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 text-xs w-[140px]"
              placeholder="De"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 text-xs w-[140px]"
              placeholder="Até"
            />

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                fetchLogs();
                fetchLastRun();
              }}
            >
              Atualizar
            </Button>
          </div>

          {/* Tabela */}
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Config / Grupo</TableHead>
                  <TableHead className="text-xs">Instância</TableHead>
                  <TableHead className="text-xs">Agendado</TableHead>
                  <TableHead className="text-xs">Enviado</TableHead>
                  <TableHead className="text-xs">Tent.</TableHead>
                  <TableHead className="text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground text-xs py-6"
                    >
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground text-xs py-6"
                    >
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <LogRow
                      key={log.id}
                      log={log}
                      configName={getConfigName(log.config_id)}
                      retrying={!!retrying[log.id]}
                      onRetry={() => handleRetry(log)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {logs.length === PAGE_SIZE && (
            <p className="text-[10px] text-muted-foreground text-center">
              Exibindo os {PAGE_SIZE} mais recentes. Use os filtros para refinar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LogRow({
  log,
  configName,
  retrying,
  onRetry,
}: {
  log: BlastLog;
  configName: string;
  retrying: boolean;
  onRetry: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasError = !!log.error_message;
  const groupShort = log.group_jid.length > 22
    ? log.group_jid.slice(0, 14) + "…" + log.group_jid.slice(-6)
    : log.group_jid;

  return (
    <>
      <TableRow>
        <TableCell>
          <MessageStatusBadge status={log.status} variant="short" />
        </TableCell>
        <TableCell className="text-xs">
          <div className="font-medium">{configName}</div>
          <div className="font-mono text-[10px] text-muted-foreground">{groupShort}</div>
        </TableCell>
        <TableCell className="text-xs font-mono">
          {log.evolution_instance_id
            ? log.evolution_instance_id.length > 14
              ? log.evolution_instance_id.slice(0, 14) + "…"
              : log.evolution_instance_id
            : "—"}
        </TableCell>
        <TableCell className="text-xs">{fmtDate(log.scheduled_for, "short")}</TableCell>
        <TableCell className="text-xs">{fmtDate(log.sent_at, "short")}</TableCell>
        <TableCell className="text-xs text-center">
          {log.retry_count > 0 ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {log.retry_count}
            </Badge>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            {hasError && (
              <Collapsible open={open} onOpenChange={setOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            )}
            {log.status === "failed" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={onRetry}
                disabled={retrying}
              >
                <RotateCw className={`h-3 w-3 mr-1 ${retrying ? "animate-spin" : ""}`} />
                Reenviar
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {hasError && open && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/30 py-2">
            <div className="text-[11px] space-y-1">
              <div className="font-semibold text-destructive">Erro:</div>
              <div className="font-mono whitespace-pre-wrap break-all text-muted-foreground">
                {log.error_message}
              </div>
              {log.last_error_at && (
                <div className="text-[10px] text-muted-foreground">
                  Última falha: {fmtDate(log.last_error_at, "full")}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
