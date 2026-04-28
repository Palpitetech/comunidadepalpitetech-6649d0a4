import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { ChevronDown, RefreshCw, ShieldCheck, ShieldPlus, UserCheck, UserPlus, UserX } from "lucide-react";

type ParticipantStatus = "admin" | "superadmin" | "member" | "not_in_group";

interface InstanceState {
  id: string;
  name: string;
  evolution_instance_id: string;
  phone_number: string;
  status: string;
  group_status: ParticipantStatus;
}

interface GroupResult {
  instances: InstanceState[];
  next_in_queue: string | null;
  has_admin_instance: boolean;
  probe_error?: string | null;
}

interface Props {
  groupJids: string[];
}

export function GroupAdminsCard({ groupJids }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, GroupResult>>({});
  const [promoting, setPromoting] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    const map: Record<string, GroupResult> = {};
    for (const jid of groupJids) {
      try {
        const { data, error } = await supabase.functions.invoke("group-promote-admin", {
          body: { action: "list", group_jid: jid },
        });
        if (error) throw error;
        if (data?.ok) {
          map[jid] = {
            instances: data.instances || [],
            next_in_queue: data.next_in_queue,
            has_admin_instance: data.has_admin_instance,
            probe_error: data.probe_error,
          };
        } else {
          toast.error(`${jid}: ${data?.error || "erro"}`);
        }
      } catch (e: any) {
        toast.error(`${jid}: ${e?.message || "erro"}`);
      }
    }
    setResults(map);
    setLoading(false);
  }

  function toggleOpen(v: boolean) {
    setOpen(v);
    if (v && Object.keys(results).length === 0) {
      loadAll();
    }
  }

  async function handlePromote(jid: string, instanceId: string) {
    setPromoting(`${jid}:${instanceId}`);
    try {
      const { data, error } = await supabase.functions.invoke("group-promote-admin", {
        body: { action: "promote", group_jid: jid, instance_id: instanceId },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha");
      toast.success(`${data.promoted_instance} promovido a admin`);
      await loadAll();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao promover");
    } finally {
      setPromoting(null);
    }
  }

  async function handleAddAndPromote(jid: string, instanceId: string) {
    setPromoting(`${jid}:${instanceId}`);
    try {
      const { data, error } = await supabase.functions.invoke("group-promote-admin", {
        body: { action: "add_and_promote", group_jid: jid, instance_id: instanceId },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha");
      if (data.promote_error) {
        toast.warning(`${data.added_instance} adicionada, mas promoção falhou: ${data.promote_error}`);
      } else {
        toast.success(`${data.added_instance} adicionada ao grupo e promovida a admin`);
      }
      await loadAll();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao adicionar/promover");
    } finally {
      setPromoting(null);
    }
  }

  return (
    <Collapsible open={open} onOpenChange={toggleOpen}>
      <div className="rounded-md border border-dashed">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted/40">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Administradores do Grupo
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="px-3 pb-3 space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px]"
              onClick={loadAll}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {loading && Object.keys(results).length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-2">
              Carregando participantes...
            </p>
          ) : (
            groupJids.map((jid) => {
              const r = results[jid];
              return (
                <div key={jid} className="space-y-1.5">
                  <div className="text-[10px] font-mono text-muted-foreground truncate">{jid}</div>

                  {!r ? (
                    <p className="text-[10px] text-muted-foreground">—</p>
                  ) : r.probe_error ? (
                    <p className="text-[10px] text-destructive">{r.probe_error}</p>
                  ) : (
                    <>
                      {!r.has_admin_instance && (
                        <p className="text-[10px] text-amber-600">
                          ⚠️ Nenhuma instância é admin ainda. Promova a 1ª manualmente pelo WhatsApp para liberar a promoção automática das demais.
                        </p>
                      )}
                      <div className="rounded border divide-y">
                        {r.instances.map((inst) => {
                          const isAdmin =
                            inst.group_status === "admin" || inst.group_status === "superadmin";
                          const isMember = inst.group_status === "member";
                          const isNext = inst.id === r.next_in_queue;
                          const busy = promoting === `${jid}:${inst.id}`;

                          return (
                            <div
                              key={inst.id}
                              className="flex items-center justify-between px-2 py-1.5 text-[11px] gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-medium truncate">{inst.name}</span>
                                <span className="font-mono text-[10px] text-muted-foreground hidden sm:inline">
                                  {inst.phone_number}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isAdmin ? (
                                  <Badge variant="default" className="text-[10px] h-5 gap-1 bg-green-600 hover:bg-green-600">
                                    <ShieldCheck className="h-3 w-3" />
                                    {inst.group_status === "superadmin" ? "Dono" : "Admin"}
                                  </Badge>
                                ) : isMember ? (
                                  <>
                                    {isNext && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] h-5 border-orange-500 text-orange-600"
                                      >
                                        Próxima da fila
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-[10px] h-5 gap-1">
                                      <UserCheck className="h-3 w-3" />
                                      Membro
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant={isNext ? "default" : "outline"}
                                      className="h-6 px-2 text-[10px]"
                                      disabled={busy || !r.has_admin_instance}
                                      onClick={() => handlePromote(jid, inst.id)}
                                    >
                                      <ShieldPlus className={`h-3 w-3 mr-1 ${busy ? "animate-spin" : ""}`} />
                                      Promover
                                    </Button>
                                  </>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                                    <UserX className="h-3 w-3" />
                                    Fora do grupo
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {r.instances.length === 0 && (
                          <p className="text-[10px] text-muted-foreground p-2 text-center">
                            Nenhuma instância cadastrada.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
