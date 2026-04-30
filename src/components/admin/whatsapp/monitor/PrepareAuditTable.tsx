// Tabela dos 7 últimos runs do prepare, com expansão para mensagens de erro.
import { useCallback, useEffect, useState, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatBRT } from "@/lib/dateUtils";

interface PrepareRun {
  id: string;
  ran_at: string;
  config_id: string | null;
  slots_scheduled: number;
  slots_resolved: number;
  slots_failed_resolution: number;
  skipped_dedup: number;
  error_message: string | null;
  config_name?: string | null;
}

export default function PrepareAuditTable() {
  const [runs, setRuns] = useState<PrepareRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("group_blast_prepare_runs")
        .select(
          "id, ran_at, config_id, slots_scheduled, slots_resolved, slots_failed_resolution, skipped_dedup, error_message",
        )
        .order("ran_at", { ascending: false })
        .limit(7);
      if (error) throw error;

      const configIds = Array.from(
        new Set((data || []).map((r) => r.config_id).filter(Boolean) as string[]),
      );
      const nameMap = new Map<string, string>();
      if (configIds.length > 0) {
        const { data: cfgs } = await supabase
          .from("group_blast_configs")
          .select("id, name")
          .in("id", configIds);
        (cfgs || []).forEach((c: any) => nameMap.set(c.id, c.name));
      }

      setRuns(
        (data || []).map((r) => ({
          ...r,
          config_name: r.config_id ? nameMap.get(r.config_id) ?? "—" : "Global",
        })),
      );
    } catch (err: any) {
      toast.error("Falha ao carregar auditoria: " + (err?.message ?? "erro"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Auditoria do Prepare</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Últimos 7 runs do prepare
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRuns}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Data/hora</TableHead>
                <TableHead>Config</TableHead>
                <TableHead className="text-right">Agendados</TableHead>
                <TableHead className="text-right">Dedup</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                    Nenhum run registrado
                  </TableCell>
                </TableRow>
              )}
              {runs.map((r) => {
                const isFailed = !!r.error_message;
                const isWarning = r.slots_scheduled === 0 && r.skipped_dedup === 0 && !r.error_message;
                const isOk = !r.error_message && !isWarning;
                
                const isExpanded = expanded === r.id;
                const canExpand = isFailed;
                const rowDanger = isFailed;
                const rowWarning = isWarning;
                
                return (
                  <Fragment key={r.id}>
                    <TableRow
                      onClick={() => canExpand && setExpanded(isExpanded ? null : r.id)}
                      className={cn(
                        canExpand && "cursor-pointer",
                        rowDanger && "bg-red-50 hover:bg-red-100/70",
                        rowWarning && "bg-amber-50 hover:bg-amber-100/70",
                      )}
                    >
                      <TableCell className="w-8">
                        {canExpand ? (
                          isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatBRT(r.ran_at)}
                      </TableCell>
                      <TableCell className="text-sm">{r.config_name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {r.slots_scheduled}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {r.skipped_dedup}
                      </TableCell>
                      <TableCell className="text-center">
                        {ok ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 text-green-800 text-xs font-medium border border-green-200">
                            <CheckCircle2 className="h-3 w-3" /> OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-xs font-medium border border-red-200">
                            <XCircle className="h-3 w-3" /> Falha
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && r.error_message && (
                      <TableRow className="bg-red-50/60">
                        <TableCell />
                        <TableCell colSpan={5} className="text-xs text-red-900 whitespace-pre-wrap py-2">
                          <strong>Erro:</strong> {r.error_message}
                          {r.slots_failed_resolution > 0 && (
                            <div className="mt-1 text-red-800">
                              Slots com falha de resolução: {r.slots_failed_resolution}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
