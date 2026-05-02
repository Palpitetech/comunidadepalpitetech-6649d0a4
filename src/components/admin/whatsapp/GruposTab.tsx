import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Copy, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
    <div className="space-y-4 pt-2">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Select value={selectedInstance} onValueChange={setSelectedInstance} disabled={loadingInstances}>
            <SelectTrigger>
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
        </div>
        <Button onClick={fetchGroups} disabled={loading || !selectedInstance} className="shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          Buscar Grupos
        </Button>
      </div>

      {/* Results */}
      {groups.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {groups.length} grupo(s) · {selectedInst?.friendly_name}
        </div>
      )}

      {groups.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Selecione uma instância e clique em "Buscar Grupos"</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {groups.length > 0 && !isMobile && (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Grupo</TableHead>
                <TableHead>ID (JID)</TableHead>
                <TableHead className="text-center">Participantes</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.subject}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono max-w-[200px] truncate">{g.id}</TableCell>
                  <TableCell className="text-center">{g.size}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => copyId(g.id)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {groups.length > 0 && isMobile && (
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.id} className="rounded-xl border p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-sm leading-tight">{g.subject}</span>
                <Badge variant="secondary" className="text-[10px] shrink-0">{g.size} memb.</Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground font-mono truncate flex-1">{g.id}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => copyId(g.id)}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
