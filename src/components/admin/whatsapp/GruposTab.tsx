import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Copy, Users, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";
import { cn } from "@/lib/utils";

interface WhatsAppInstance {
  id: string;
  name: string;
  friendly_name: string;
  evolution_instance_id: string;
  status: string;
}

interface GroupInfo {
  id: string;
  subject: string;
  size: number;
}

export function GruposTab() {
  const isMobile = useIsMobile();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInstances, setLoadingInstances] = useState(true);

  useEffect(() => {
    loadInstances();
  }, []);

  async function loadInstances() {
    setLoadingInstances(true);
    const { data } = await supabase
      .from("whatsapp_instances")
      .select("id, name, friendly_name, evolution_instance_id, status")
      .order("friendly_name");
    if (data) setInstances(data);
    setLoadingInstances(false);
  }

  async function fetchGroups() {
    if (!selectedInstance) {
      toast.error("Selecione uma instância");
      return;
    }

    const instance = instances.find((i) => i.id === selectedInstance);
    if (!instance) return;

    setLoading(true);
    setGroups([]);

    try {
      const { data, error } = await supabase.functions.invoke("evolution-proxy", {
        body: {
          action: "fetchGroups",
          instanceName: instance.evolution_instance_id,
        },
      });

      if (error) throw error;

      const rawGroups = Array.isArray(data) ? data : data?.data ?? data?.groups ?? [];

      const parsed: GroupInfo[] = rawGroups.map((g: any) => ({
        id: g.id ?? g.jid ?? g.group_jid ?? "",
        subject: g.subject ?? g.name ?? "Sem nome",
        size: g.size ?? g.participants?.length ?? 0,
      }));

      setGroups(parsed);
      toast.success(`${parsed.length} grupo(s) encontrado(s)`);
    } catch (err: any) {
      console.error("Erro ao buscar grupos:", err);
      toast.error("Erro ao buscar grupos: " + (err.message || "desconhecido"));
    } finally {
      setLoading(false);
    }
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id);
    toast.success("ID copiado!");
  }

  const selectedInst = instances.find((i) => i.id === selectedInstance);

  return (
    <UnifiedLayout>
      <UnifiedToolbar
        left={
          <div className="flex items-center gap-2 min-w-[200px] sm:min-w-[300px]">
            <Select value={selectedInstance} onValueChange={setSelectedInstance} disabled={loadingInstances}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={loadingInstances ? "Carregando..." : "Selecione a instância"} />
              </SelectTrigger>
              <SelectContent>
                {instances.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.friendly_name} ({inst.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ActionButton
              label="Buscar"
              icon={Search}
              onClick={fetchGroups}
              loading={loading}
              disabled={!selectedInstance}
              variant="default"
            />
          </div>
        }
        right={
          <ActionButton
            label="Atualizar"
            icon={RefreshCw}
            onClick={loadInstances}
          />
        }
      />

      <UnifiedList
        isLoading={loading}
        count={groups.length}
        empty={{
          icon: Users,
          message: "Nenhum grupo exibido",
          submessage: "Selecione uma instância e clique em 'Buscar Grupos'"
        }}
      >
        <div className="grid gap-2">
          {groups.map((g) => (
            <UnifiedCardItem key={g.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{g.subject}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{g.id}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="secondary" className="h-5 text-[10px] px-2 tabular-nums">
                  {g.size} memb.
                </Badge>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyId(g.id)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </UnifiedCardItem>
          ))}
        </div>
      </UnifiedList>
    </UnifiedLayout>
  );
}
