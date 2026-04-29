import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatBRT } from "@/lib/dateUtils";
import { getHealthStyle, type HealthStatus } from "./healthStatus";

interface Instance {
  id: string;
  friendly_name: string | null;
  name: string;
  status: string | null;
  last_message_at: string | null;
}

export default function InstanceGroupMatrix() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [groupJids, setGroupJids] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [instRes, cfgRes, mapRes] = await Promise.all([
        supabase
          .from("whatsapp_instances")
          .select("id, friendly_name, name, status, last_message_at")
          .order("friendly_name", { ascending: true }),
        supabase.from("group_blast_configs").select("group_jids").eq("is_active", true),
        supabase.from("whatsapp_instance_groups").select("instance_id, group_jid"),
      ]);
      if (instRes.error) throw instRes.error;
      if (cfgRes.error) throw cfgRes.error;
      if (mapRes.error) throw mapRes.error;

      setInstances((instRes.data || []) as Instance[]);

      const jidSet = new Set<string>();
      (cfgRes.data || []).forEach((c: any) => {
        (c.group_jids || []).forEach((j: string) => j && jidSet.add(j));
      });
      setGroupJids(Array.from(jidSet).sort());

      const m = new Set<string>();
      (mapRes.data || []).forEach((row: any) => {
        m.add(`${row.instance_id}::${row.group_jid}`);
      });
      setMappings(m);
    } catch (err: any) {
      toast.error("Falha ao carregar matriz: " + (err?.message ?? "erro"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const truncatedJids = useMemo(
    () =>
      groupJids.map((jid) => ({
        full: jid,
        short: jid.replace("@g.us", "").slice(-10),
      })),
    [groupJids],
  );

  const instanceStatus = (s: string | null): HealthStatus => {
    if (s === "open") return "ok";
    if (!s || s === "close" || s === "closed") return "critical";
    return "warn";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Instâncias × Grupos</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mapeamento de qual instância envia para qual grupo
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
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <TooltipProvider delayDuration={150}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Instância</TableHead>
                  {truncatedJids.map((j) => (
                    <TableHead key={j.full} className="text-center px-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-mono text-xs cursor-help">
                            …{j.short}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span className="font-mono text-xs">{j.full}</span>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                  ))}
                  {truncatedJids.length === 0 && (
                    <TableHead className="text-xs text-muted-foreground">
                      Nenhum grupo configurado
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={Math.max(truncatedJids.length + 1, 2)}
                      className="text-center text-sm text-muted-foreground py-6"
                    >
                      Nenhuma instância cadastrada
                    </TableCell>
                  </TableRow>
                )}
                {instances.map((inst) => {
                  const status = instanceStatus(inst.status);
                  const style = getHealthStyle(status);
                  const offline = status !== "ok";
                  return (
                    <TableRow
                      key={inst.id}
                      className={cn(offline && "bg-red-50 hover:bg-red-100/70")}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-md font-medium",
                              style.badgeClass,
                            )}
                          >
                            {style.label}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {inst.friendly_name || inst.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {inst.last_message_at
                                ? `último envio ${formatBRT(inst.last_message_at)}`
                                : "sem envios"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      {truncatedJids.map((j) => {
                        const mapped = mappings.has(`${inst.id}::${j.full}`);
                        return (
                          <TableCell key={j.full} className="text-center">
                            {mapped ? (
                              <Check className="h-4 w-4 text-green-600 inline-block" />
                            ) : (
                              <span className="text-muted-foreground/40">·</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
        <p className="text-xs text-muted-foreground px-4 py-3 border-t">
          Instâncias offline não recebem novos envios.
        </p>
      </CardContent>
    </Card>
  );
}
