import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, Smartphone, QrCode, RefreshCw, Power, LogOut, MessageSquare, Clock, Link2, Globe, Replace, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { maskIp } from "./shared/mask-ip";
import { ProfilePictureCard } from "./ProfilePictureCard";
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";

interface WhatsAppInstance {
  id: string;
  name: string;
  friendly_name: string;
  phone_number: string;
  evolution_instance_id: string;
  status: string;
  daily_limit: number;
  messages_sent_today: number;
  last_message_at: string | null;
  created_at: string;
  cooldown_queue: number[];
  cooldown_queue_index: number;
  webhook_configured: boolean;
}

interface FormData {
  name: string;
  friendly_name: string;
  phone_number: string;
  evolution_instance_id: string;
  daily_limit: number;
  cooldown_queue: number[];
}

const emptyForm: FormData = {
  name: "",
  friendly_name: "",
  phone_number: "",
  evolution_instance_id: "",
  daily_limit: 100,
  cooldown_queue: [3],
};

async function callEvolution(action: string, instanceName?: string) {
  const { data, error } = await supabase.functions.invoke("evolution-proxy", {
    body: { action, instanceName },
  });
  if (error) throw new Error(error.message || "Erro na chamada Evolution");
  if (data?.error) throw new Error(data.error);
  return data;
}

interface ProxyInfo {
  id: string;
  label: string;
  external_ip: string | null;
}

// maskIp moved to ./shared/mask-ip

export function InstanciasTab() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [proxiesByInstance, setProxiesByInstance] = useState<Map<string, ProxyInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrInstanceId, setQrInstanceId] = useState<string | null>(null);
  const [qrEvolutionId, setQrEvolutionId] = useState<string | null>(null);
  const [qrPhase, setQrPhase] = useState<"creating" | "waiting" | "connected" | "expired" | "error" | "no_proxy">("creating");
  const [qrPhone, setQrPhone] = useState<string>("");
  const [qrErrorMsg, setQrErrorMsg] = useState<string>("");
  const [qrSecondsLeft, setQrSecondsLeft] = useState(90);
  const [createApelido, setCreateApelido] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<WhatsAppInstance | null>(null);
  const [syncing, setSyncing] = useState(false);

  const setInstanceAction = (id: string, action: string | null) => {
    setActionLoading((prev) => {
      if (action) return { ...prev, [id]: action };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("whatsapp_instances" as any)
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar instâncias");
      setLoading(false);
      return;
    }

    const localInstances = (data as any[]) || [];

    try {
      const evoData = await callEvolution("fetchInstances");
      if (Array.isArray(evoData)) {
        const statusMap = new Map<string, string>();
        for (const evo of evoData) {
          const instanceName = evo.name || evo.instance?.instanceName || evo.instanceName;
          const connStatus = evo.connectionStatus || evo.instance?.status || evo.state;
          if (instanceName) {
            statusMap.set(instanceName, connStatus === "open" ? "online" : "offline");
          }
        }

        for (const inst of localInstances) {
          const evoStatus = statusMap.get(inst.evolution_instance_id);
          if (evoStatus && evoStatus !== inst.status) {
            await supabase
              .from("whatsapp_instances" as any)
              .update({ status: evoStatus })
              .eq("id", inst.id);
            inst.status = evoStatus;
          }
        }
      }
    } catch (err: any) {
      console.warn("Não foi possível sincronizar com Evolution API:", err.message);
    }

    setInstances(localInstances);

    // Carrega proxies vinculados
    const { data: proxData } = await supabase
      .from("whatsapp_proxies" as any)
      .select("id, label, external_ip, instance_id")
      .not("instance_id", "is", null);
    const map = new Map<string, ProxyInfo>();
    for (const p of (proxData as any[]) || []) {
      if (p.instance_id) map.set(p.instance_id, { id: p.id, label: p.label, external_ip: p.external_ip });
    }
    setProxiesByInstance(map);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const openCreate = () => {
    setEditingId(null);
    setCreateApelido("");
    setDialogOpen(true);
  };

  const openEdit = (inst: WhatsAppInstance) => {
    setEditingId(inst.id);
    setForm({
      name: inst.name,
      friendly_name: inst.friendly_name,
      phone_number: inst.phone_number,
      evolution_instance_id: inst.evolution_instance_id,
      daily_limit: inst.daily_limit,
      cooldown_queue: Array.isArray(inst.cooldown_queue) ? inst.cooldown_queue : [3],
    });
    setDialogOpen(true);
  };

  // Polling de status para detectar conexão automaticamente
  useEffect(() => {
    if (!qrDialogOpen || qrPhase !== "waiting" || !qrInstanceId) return;

    let cancelled = false;
    setQrSecondsLeft(90);

    const tick = async () => {
      if (cancelled) return;
      try {
        const { data } = await supabase.functions.invoke("evolution-proxy", {
          body: { action: "syncInstancePhone", instanceId: qrInstanceId },
        });
        if (cancelled) return;
        if (data?.status === "online") {
          setQrPhone(data.phone || "");
          setQrPhase("connected");
          setTimeout(() => {
            if (!cancelled) {
              setQrDialogOpen(false);
              fetchInstances();
            }
          }, 1500);
        }
      } catch {
        /* mantém polling */
      }
    };

    const pollId = setInterval(tick, 2000);
    const countdownId = setInterval(() => {
      setQrSecondsLeft((s) => {
        if (s <= 1) {
          setQrPhase("expired");
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    // primeira chamada imediata
    tick();

    return () => {
      cancelled = true;
      clearInterval(pollId);
      clearInterval(countdownId);
    };
  }, [qrDialogOpen, qrPhase, qrInstanceId, fetchInstances]);

  // Cleanup ao fechar manualmente o dialog
  useEffect(() => {
    if (!qrDialogOpen) {
      setQrData(null);
      setQrPhase("creating");
      setQrPhone("");
      setQrErrorMsg("");
    }
  }, [qrDialogOpen]);

  const startCreateAndConnect = async (apelido: string) => {
    setQrPhase("creating");
    setQrData(null);
    setQrErrorMsg("");
    setQrPhone("");
    setQrDialogOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke("evolution-proxy", {
        body: { action: "createAndConnect", apelido },
      });
      if (error) throw new Error(error.message || "Erro ao criar instância");

      if (data?.code === "no_proxy_available") {
        setQrPhase("no_proxy");
        setQrErrorMsg(data.error || "Sem proxy disponível.");
        return;
      }
      if (data?.code === "proxy_invalid") {
        setQrPhase("error");
        setQrErrorMsg(data.error || "Proxy com dados inválidos.");
        return;
      }
      if (!data?.success) {
        setQrPhase("error");
        setQrErrorMsg(data?.error || "Falha ao criar instância na Evolution.");
        return;
      }

      setQrInstanceId(data.instanceId);
      setQrEvolutionId(data.evolutionInstanceId);
      setQrData(data.qrCode || null);
      setQrPhase("waiting");
      // refetch para o card já aparecer offline imediatamente
      fetchInstances();
    } catch (err: any) {
      setQrPhase("error");
      setQrErrorMsg(err?.message || "Erro inesperado");
    }
  };

  const handleCreateSubmit = async () => {
    const apelido = createApelido.trim();
    if (!apelido) {
      toast.error("Digite um apelido");
      return;
    }
    setDialogOpen(false);
    await startCreateAndConnect(apelido);
  };

  const handleRetryQr = async () => {
    // Apaga a instância criada e tenta novamente com o mesmo apelido
    if (qrInstanceId && qrEvolutionId) {
      try {
        await callEvolution("delete", qrEvolutionId);
      } catch { /* ignore */ }
      await supabase.from("whatsapp_instances" as any).delete().eq("id", qrInstanceId);
      setQrInstanceId(null);
      setQrEvolutionId(null);
    }
    const apelido = createApelido || "instancia";
    await startCreateAndConnect(apelido);
  };

  const handleCancelQr = async () => {
    if (qrInstanceId && qrEvolutionId && qrPhase !== "connected") {
      try {
        await callEvolution("delete", qrEvolutionId);
      } catch { /* ignore */ }
      await supabase.from("whatsapp_instances" as any).delete().eq("id", qrInstanceId);
    }
    setQrDialogOpen(false);
    setQrInstanceId(null);
    setQrEvolutionId(null);
    fetchInstances();
  };

  const handleSave = async () => {
    if (!editingId) {
      // Modo criação agora usa startCreateAndConnect via handleCreateSubmit
      return;
    }
    if (!form.name.trim() || !form.friendly_name.trim() || !form.phone_number.trim() || !form.evolution_instance_id.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("whatsapp_instances" as any)
        .update({
          name: form.name.trim(),
          friendly_name: form.friendly_name.trim(),
          phone_number: form.phone_number.trim(),
          evolution_instance_id: form.evolution_instance_id.trim(),
          daily_limit: form.daily_limit,
          cooldown_queue: form.cooldown_queue,
        })
        .eq("id", editingId);
      if (error) throw error;
      toast.success("Instância atualizada");
      setDialogOpen(false);
      fetchInstances();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar instância");
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async (inst: WhatsAppInstance) => {
    setQrLoading(true);
    setQrData(null);
    setQrInstanceId(inst.id);
    setQrDialogOpen(true);
    try {
      // Chamada direta para capturar response completo (incluindo code: proxy_invalid)
      const { data, error } = await supabase.functions.invoke("evolution-proxy", {
        body: { action: "connect", instanceName: inst.evolution_instance_id },
      });
      if (error) throw new Error(error.message || "Erro ao gerar QR Code");
      if (data?.code === "proxy_invalid") {
        toast.error(`Proxy ${data.proxyLabel || ""} com dados inválidos`, {
          description: `Faltam: ${(data.invalidFields || []).join(", ")}. Corrija em WhatsApp → Proxies antes de tentar novamente.`,
          duration: 8000,
        });
        setQrDialogOpen(false);
        return;
      }
      if (data?.error) throw new Error(data.error);

      const base64 = data?.base64 || data?.qrcode?.base64 || data?.qr || null;
      if (!base64) {
        toast.success("Instância já conectada!");
        await supabase.from("whatsapp_instances" as any).update({ status: "online" }).eq("id", inst.id);
        setQrDialogOpen(false);
        fetchInstances();
        return;
      }
      setQrData(base64);
    } catch (err: any) {
      const msg = err?.message || "Erro ao gerar QR Code";
      if (msg.includes("Sem proxy disponível") || msg.includes("no_proxy_available")) {
        toast.error("Sem proxy disponível", { description: "Adicione novos proxies em WhatsApp → Proxies." });
      } else {
        toast.error(msg);
      }
      setQrDialogOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleSwapProxy = async (inst: WhatsAppInstance) => {
    setInstanceAction(inst.id, "swap");
    try {
      const { data, error } = await supabase.functions.invoke("evolution-proxy", {
        body: { action: "swapProxy", instanceName: inst.evolution_instance_id },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Proxy liberado. O próximo Conectar reservará um novo IP.");
      fetchInstances();
    } catch (err: any) {
      toast.error(err.message || "Erro ao trocar proxy");
    } finally {
      setInstanceAction(inst.id, null);
    }
  };

  const handleAssignProxy = async (inst: WhatsAppInstance) => {
    setInstanceAction(inst.id, "assign");
    try {
      const { data, error } = await supabase.functions.invoke("evolution-proxy", {
        body: { action: "assignProxy", instanceName: inst.evolution_instance_id },
      });
      if (error) throw new Error(error.message);
      if (data?.code === "proxy_invalid") {
        toast.error(`Proxy ${data.proxyLabel || ""} com dados inválidos`, {
          description: `Faltam: ${(data.invalidFields || []).join(", ")}. Corrija em WhatsApp → Proxies antes de tentar novamente.`,
          duration: 8000,
        });
        return;
      }
      if (data?.error) throw new Error(data.error);
      toast.success(`Proxy atribuído: ${data?.proxy?.label || "OK"}`, {
        description: "A instância foi reiniciada para aplicar o novo IP.",
      });
      fetchInstances();
    } catch (err: any) {
      const msg = err.message || "Erro ao atribuir proxy";
      if (msg.includes("Sem proxy") || msg.includes("no_proxy_available")) {
        toast.error("Sem proxy disponível", { description: "Adicione novos proxies em WhatsApp → Proxies." });
      } else {
        toast.error(msg);
      }
    } finally {
      setInstanceAction(inst.id, null);
    }
  };

  const handleCheckStatus = async (inst: WhatsAppInstance) => {
    setInstanceAction(inst.id, "status");
    try {
      const data = await callEvolution("connectionState", inst.evolution_instance_id);
      const state = data?.instance?.state || data?.state || data?.connectionStatus;
      const newStatus = state === "open" ? "online" : "offline";
      await supabase.from("whatsapp_instances" as any).update({ status: newStatus }).eq("id", inst.id);
      toast.success(`Status: ${newStatus}`);
      fetchInstances();
    } catch (err: any) {
      toast.error(err.message || "Erro ao verificar status");
    } finally {
      setInstanceAction(inst.id, null);
    }
  };

  const handleRestart = async (inst: WhatsAppInstance) => {
    setInstanceAction(inst.id, "restart");
    try {
      await callEvolution("restart", inst.evolution_instance_id);
      toast.success("Instância reiniciada");
      fetchInstances();
    } catch (err: any) {
      toast.error(err.message || "Erro ao reiniciar");
    } finally {
      setInstanceAction(inst.id, null);
    }
  };

  const handleLogout = async (inst: WhatsAppInstance) => {
    setInstanceAction(inst.id, "logout");
    try {
      await callEvolution("logout", inst.evolution_instance_id);
      await supabase.from("whatsapp_instances" as any).update({ status: "offline" }).eq("id", inst.id);
      toast.success("Instância deslogada");
      fetchInstances();
    } catch (err: any) {
      toast.error(err.message || "Erro ao deslogar");
    } finally {
      setInstanceAction(inst.id, null);
    }
  };

  const handleDelete = async (inst: WhatsAppInstance) => {
    setInstanceAction(inst.id, "delete");
    try {
      await callEvolution("delete", inst.evolution_instance_id);
    } catch (err: any) {
      console.warn("Erro ao excluir na Evolution (pode já não existir):", err.message);
    }
    const { error } = await supabase
      .from("whatsapp_instances" as any)
      .delete()
      .eq("id", inst.id);
    if (error) {
      toast.error("Erro ao excluir do banco");
    } else {
      toast.success("Instância excluída");
    }
    setInstanceAction(inst.id, null);
    setDeleteConfirm(null);
    fetchInstances();
  };

  const handleQrScanned = async () => {
    if (!qrInstanceId) return;
    await supabase.from("whatsapp_instances" as any).update({ status: "online" }).eq("id", qrInstanceId);
    toast.success("Instância conectada!");
    setQrDialogOpen(false);
    fetchInstances();
  };

  const handleSyncFromEvolution = async () => {
    setSyncing(true);
    try {
      const evoData = await callEvolution("fetchInstances");
      if (!Array.isArray(evoData)) {
        toast.error("Resposta inesperada da Evolution API");
        return;
      }

      const { data: existing } = await supabase
        .from("whatsapp_instances" as any)
        .select("evolution_instance_id");
      const existingIds = new Set((existing as any[] || []).map((e: any) => e.evolution_instance_id));

      // Filtra somente as novas
      const novas = evoData.filter((evo: any) => {
        const instanceName = evo.name || evo.instance?.instanceName || evo.instanceName;
        return instanceName && !existingIds.has(instanceName);
      });

      if (novas.length === 0) {
        toast.info("Nenhuma instância nova encontrada");
        return;
      }

      // Pré-checagem: existe algum proxy disponível?
      const { count: availableProxies } = await supabase
        .from("whatsapp_proxies" as any)
        .select("id", { count: "exact", head: true })
        .eq("status", "available")
        .is("instance_id", null);

      if (!availableProxies || availableProxies < 1) {
        toast.warning(
          `${novas.length} instância(s) encontrada(s), mas nenhum proxy disponível. Adicione proxies em WhatsApp → Proxies antes de importar.`,
          { duration: 8000 }
        );
        return;
      }

      let imported = 0;
      let skippedNoProxy = 0;
      let invalidProxy = 0;
      let failed = 0;
      const invalidProxyLabels = new Set<string>();

      for (const evo of novas) {
        const instanceName = evo.name || evo.instance?.instanceName || evo.instanceName;
        const connStatus = evo.connectionStatus || evo.instance?.status || evo.state;
        const phone = evo.ownerJid || evo.instance?.owner || evo.owner || "";

        const { data: result, error } = await supabase.functions.invoke("evolution-proxy", {
          body: {
            action: "importInstanceWithProxy",
            instanceName,
            phone,
            status: connStatus,
          },
        });

        if (error) {
          failed++;
          continue;
        }

        if (result?.success) {
          imported++;
        } else if (result?.code === "no_proxy_available") {
          skippedNoProxy++;
        } else if (result?.code === "proxy_invalid") {
          invalidProxy++;
          if (result.proxyLabel) invalidProxyLabels.add(result.proxyLabel);
        } else {
          failed++;
        }
      }

      if (imported > 0) {
        toast.success(`${imported} instância(s) importada(s) com proxy aplicado`);
      }
      if (skippedNoProxy > 0) {
        toast.warning(
          `${skippedNoProxy} instância(s) puladas: sem proxy disponível. Adicione mais proxies em WhatsApp → Proxies.`,
          { duration: 8000 }
        );
      }
      if (invalidProxy > 0) {
        const labels = Array.from(invalidProxyLabels).join(", ");
        toast.error(
          `${invalidProxy} instância(s) puladas: proxy com dados incompletos${labels ? ` (${labels})` : ""}. Corrija em WhatsApp → Proxies.`,
          { duration: 10000 }
        );
      }
      if (failed > 0) {
        toast.error(`${failed} instância(s) falharam ao importar/aplicar proxy`);
      }
      if (imported === 0 && skippedNoProxy === 0 && invalidProxy === 0 && failed === 0) {
        toast.info("Nenhuma instância nova encontrada");
      }

      fetchInstances();
    } catch (err: any) {
      toast.error(err.message || "Erro ao buscar instâncias da Evolution");
    } finally {
      setSyncing(false);
    }
  };

  const statusConfig = (status: string) => {
    switch (status) {
      case "online":
        return { label: "Online", dotClass: "bg-accent animate-pulse", badgeClass: "bg-accent/10 text-accent border-accent/20" };
      case "banned":
        return { label: "Banido", dotClass: "bg-destructive", badgeClass: "bg-destructive/10 text-destructive border-destructive/20" };
      default:
        return { label: "Offline", dotClass: "bg-muted-foreground", badgeClass: "bg-muted text-muted-foreground border-border" };
    }
  };

  return (
    <UnifiedLayout>
      <UnifiedToolbar
        left={
          <ActionButton
            label="Nova Instância"
            icon={Plus}
            onClick={openCreate}
            variant="default"
          />
        }
        right={
          <ActionButton
            label="Sincronizar"
            icon={RefreshCw}
            onClick={fetchInstances}
            loading={syncing}
          />
        }
      />

      <UnifiedList
        isLoading={loading}
        count={instances.length}
        empty={{
          icon: Smartphone,
          message: "Nenhuma instância encontrada",
          submessage: "Clique em '+ Nova Instância' para conectar seu WhatsApp"
        }}
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {instances.map((inst) => {
            const proxy = proxiesByInstance.get(inst.id);
            const isOnline = inst.status === "online";
            const currentAction = actionLoading[inst.id];
            const pct = inst.daily_limit > 0 ? Math.min((inst.messages_sent_today / inst.daily_limit) * 100, 100) : 0;
            const status = statusConfig(inst.status);

            return (
              <UnifiedCardItem
                key={inst.id}
                className={cn(
                  "space-y-4",
                  isOnline ? "border-accent/30" : "border-border"
                )}
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold truncate text-card-foreground">{inst.friendly_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{inst.phone_number}</p>
                  </div>
                  <Badge className={`shrink-0 gap-1.5 text-[11px] font-medium ${status.badgeClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                    {status.label}
                  </Badge>
                  {(inst as any).webhook_configured && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link2 className="h-3.5 w-3.5 text-accent shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>Webhook de grupos ativo</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {/* Proxy info */}
                <div className="flex items-center gap-1.5 text-xs">
                  <Globe className={`h-3.5 w-3.5 shrink-0 ${proxy ? "text-accent" : "text-muted-foreground"}`} />
                  {proxy ? (
                    <span className="text-card-foreground truncate">
                      {proxy.label}
                      {proxy.external_ip && (
                        <span className="text-muted-foreground font-mono ml-1">· {maskIp(proxy.external_ip)}</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sem proxy</span>
                  )}
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Mensagens hoje
                    </span>
                    <span className="font-semibold tabular-nums text-card-foreground">
                      {inst.messages_sent_today}
                      <span className="text-muted-foreground font-normal">/{inst.daily_limit}</span>
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className={`h-2 ${pct >= 90 ? "[&>div]:bg-destructive" : pct >= 70 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-accent"}`}
                  />
                {/* Last message */}
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {inst.last_message_at
                    ? format(new Date(inst.last_message_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : "Nenhuma mensagem enviada"}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-2 border-t border-border">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleConnect(inst)} disabled={!!currentAction}>
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Conectar</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCheckStatus(inst)} disabled={!!currentAction}>
                          {currentAction === "status" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Status</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRestart(inst)} disabled={!!currentAction}>
                          {currentAction === "restart" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reiniciar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="flex-1" />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(inst)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(inst)} disabled={!!currentAction}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </UnifiedCardItem>
            );
          })}
        </div>
      </UnifiedList>

      {/* Forms and Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Instância" : "Nova Instância"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {!editingId ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="apelido">Apelido *</Label>
                  <Input
                    id="apelido"
                    placeholder="Ex: Tablet Sala"
                    value={createApelido}
                    onChange={(e) => setCreateApelido(e.target.value)}
                    maxLength={100}
                    autoFocus
                  />
                </div>
                <Button className="w-full" onClick={handleCreateSubmit} disabled={!createApelido.trim()}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Gerar QR Code
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Apelido *</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="friendly_name">Nome amigável *</Label>
                  <Input id="friendly_name" value={form.friendly_name} onChange={(e) => setForm(f => ({ ...f, friendly_name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone_number">Telefone *</Label>
                  <Input id="phone_number" value={form.phone_number} onChange={(e) => setForm(f => ({ ...f, phone_number: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="daily_limit">Limite diário</Label>
                  <Input id="daily_limit" type="number" value={form.daily_limit} onChange={(e) => setForm(f => ({ ...f, daily_limit: parseInt(e.target.value) || 0 }))} />
                </div>
                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={qrDialogOpen} onOpenChange={(o) => !o && handleCancelQr()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Conectar Instância</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-8">
            {qrPhase === "creating" && <Loader2 className="h-8 w-8 animate-spin" />}
            {qrPhase === "waiting" && qrData && (
              <>
                <img src={qrData.startsWith("data:") ? qrData : `data:image/png;base64,${qrData}`} alt="QR Code" className="w-64 h-64 border rounded" />
                <p className="text-xs text-muted-foreground text-center">Escaneie o código no seu WhatsApp</p>
              </>
            )}
            {qrPhase === "connected" && (
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <p className="font-medium">Conectado!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir instância?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá a instância definitivamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnifiedLayout>
  );
}


