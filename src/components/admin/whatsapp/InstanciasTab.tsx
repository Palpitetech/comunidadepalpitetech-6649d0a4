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
import { maskIp } from "./shared/mask-ip";
import { EvolutionHealthBanner } from "./shared/EvolutionHealthBanner";
import { ProfilePictureCard } from "./ProfilePictureCard";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legacy metrics removed - centralized in CommunicationQuickMetrics via Header */}

      {/* Header - Ações principais unificadas */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar instâncias..."
              className="pl-9 h-11 sm:h-10 rounded-xl bg-card border-border/60"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none gap-2 h-11 sm:h-10 rounded-xl border-border/60 text-xs">
                  <Replace className="h-4 w-4" />
                  <span>Mudar Foto</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Mudar Foto de Perfil</DialogTitle>
                </DialogHeader>
                <div className="pt-4 max-h-[70vh] overflow-y-auto pr-2">
                  <ProfilePictureCard />
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              onClick={handleSyncFromEvolution} 
              disabled={syncing}
              className="flex-1 sm:flex-none gap-2 h-11 sm:h-10 rounded-xl border-border/60 text-xs"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span>Buscar</span>
            </Button>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} className="flex-1 sm:flex-none gap-2 h-11 sm:h-10 rounded-xl shadow-lg shadow-primary/20 text-xs">
                  <Plus className="h-4 w-4" />
                  <span>Nova</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Instância" : "Nova Instância"}</DialogTitle>
                </DialogHeader>

                {!editingId ? (
                  /* === Modo CRIAÇÃO: 1 campo, gera QR automático === */
                  <div className="space-y-4 pt-2">

                  <div className="space-y-1.5">
                    <Label htmlFor="apelido">Apelido *</Label>
                    <Input
                      id="apelido"
                      placeholder="Ex: Tablet Sala"
                      value={createApelido}
                      onChange={(e) => setCreateApelido(e.target.value)}
                      maxLength={100}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && createApelido.trim()) {
                          e.preventDefault();
                          handleCreateSubmit();
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Este será o nome interno e o identificador na Evolution. Telefone e configurações serão preenchidos automaticamente após conectar.
                    </p>
                  </div>
                  <Button className="w-full" onClick={handleCreateSubmit} disabled={!createApelido.trim()}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Criar e gerar QR Code
                  </Button>
                </div>
              ) : (
                /* === Modo EDIÇÃO: campos completos === */
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Apelido *</Label>
                    <Input id="name" placeholder="Ex: Chip Principal" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="friendly_name">Nome de amigo *</Label>
                    <Input id="friendly_name" placeholder="Ex: Carlos" value={form.friendly_name} onChange={(e) => setForm((f) => ({ ...f, friendly_name: e.target.value }))} maxLength={100} />
                    <p className="text-xs text-muted-foreground">Este nome será usado nas conversas de aquecimento</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone_number">Número de telefone *</Label>
                    <Input id="phone_number" placeholder="5511999999999" value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} maxLength={20} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="evolution_id">ID na Evolution (gerado automaticamente)</Label>
                    <Input id="evolution_id" value={form.evolution_instance_id} readOnly disabled className="font-mono text-xs bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="daily_limit">Limite diário de mensagens *</Label>
                    <Input id="daily_limit" type="number" min={1} value={form.daily_limit} onChange={(e) => setForm((f) => ({ ...f, daily_limit: parseInt(e.target.value) || 1 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fila de descanso (minutos) — ciclo rotativo</Label>
                    <p className="text-xs text-muted-foreground">
                      Após cada envio, a instância descansa pelo tempo atual e avança para o próximo. Máximo 10 tempos.
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {form.cooldown_queue.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={1}
                            max={60}
                            className="w-16 h-8 text-xs text-center"
                            value={val}
                            onChange={(e) => {
                              const newQueue = [...form.cooldown_queue];
                              newQueue[idx] = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
                              setForm((f) => ({ ...f, cooldown_queue: newQueue }));
                            }}
                          />
                          {form.cooldown_queue.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => {
                                const newQueue = form.cooldown_queue.filter((_, i) => i !== idx);
                                setForm((f) => ({ ...f, cooldown_queue: newQueue }));
                              }}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      {form.cooldown_queue.length < 10 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setForm((f) => ({ ...f, cooldown_queue: [...f.cooldown_queue, 3] }))}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Adicionar
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          const randomQueue = Array.from({ length: 10 }, () => Math.floor(Math.random() * 15) + 1);
                          setForm((f) => ({ ...f, cooldown_queue: randomQueue }));
                        }}
                        title="Preenche os 10 slots com valores aleatórios entre 1 e 15 minutos"
                      >
                        🎲 Aleatório (1-15min)
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Ciclo: {form.cooldown_queue.map((v) => `${v}min`).join(" → ")} → volta ao início
                    </p>
                  </div>
                  <Button className="w-full" onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Salvar Alterações
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      </div>

      {/* QR Code Dialog */}

      <Dialog
        open={qrDialogOpen}

        onOpenChange={(open) => {
          if (!open && qrPhase !== "connected") {
            handleCancelQr();
          } else if (!open) {
            setQrDialogOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {qrPhase === "connected" ? "Conectado!" : qrPhase === "expired" ? "QR Code expirou" : qrPhase === "error" ? "Falha ao conectar" : qrPhase === "no_proxy" ? "Sem proxy disponível" : "Conectar Instância"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4 min-h-[280px] justify-center">
            {qrPhase === "creating" && (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-card-foreground">Criando instância…</p>
                  <p className="text-xs text-muted-foreground">Reservando proxy e gerando QR Code</p>
                </div>
              </>
            )}

            {qrPhase === "waiting" && qrData && (
              <>
                <img
                  src={qrData.startsWith("data:") ? qrData : `data:image/png;base64,${qrData}`}
                  alt="QR Code"
                  className="w-56 h-56 sm:w-64 sm:h-64 rounded-lg border bg-white p-1"
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </span>
                  Aguardando leitura do QR Code…
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Abra o WhatsApp → Aparelhos conectados → Conectar aparelho
                  <br />
                  <span className="text-[10px] tabular-nums">Expira em {qrSecondsLeft}s</span>
                </p>
              </>
            )}

            {qrPhase === "waiting" && !qrData && (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Gerando QR Code…</p>
              </>
            )}

            {qrPhase === "connected" && (
              <>
                <div className="rounded-full bg-accent/10 p-4">
                  <CheckCircle2 className="h-12 w-12 text-accent" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-base font-semibold text-card-foreground">Conectado com sucesso!</p>
                  {qrPhone && (
                    <p className="text-sm text-muted-foreground font-mono">+{qrPhone}</p>
                  )}
                </div>
              </>
            )}

            {qrPhase === "expired" && (
              <>
                <div className="rounded-full bg-muted p-4">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-card-foreground">QR Code expirou</p>
                  <p className="text-xs text-muted-foreground">Gere um novo QR para continuar.</p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1" onClick={handleCancelQr}>Cancelar</Button>
                  <Button className="flex-1" onClick={handleRetryQr}>Gerar novo QR</Button>
                </div>
              </>
            )}

            {qrPhase === "error" && (
              <>
                <div className="rounded-full bg-destructive/10 p-4">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-card-foreground">Falha ao conectar</p>
                  <p className="text-xs text-muted-foreground">{qrErrorMsg}</p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1" onClick={handleCancelQr}>Cancelar</Button>
                  <Button className="flex-1" onClick={handleRetryQr}>Tentar novamente</Button>
                </div>
              </>
            )}

            {qrPhase === "no_proxy" && (
              <>
                <div className="rounded-full bg-muted p-4">
                  <Globe className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-card-foreground">Sem proxy disponível</p>
                  <p className="text-xs text-muted-foreground">{qrErrorMsg}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={handleCancelQr}>
                  Fechar
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir instância?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá a instância "{deleteConfirm?.friendly_name}" da Evolution API e do banco de dados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cards */}
      {instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Smartphone className="h-8 w-8 opacity-40" />
          <p className="text-sm">Nenhuma instância cadastrada</p>
        </div>
      ) : (
        <TooltipProvider delayDuration={300}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {instances.map((inst) => {
              const pct = inst.daily_limit > 0 ? Math.min((inst.messages_sent_today / inst.daily_limit) * 100, 100) : 0;
              const currentAction = actionLoading[inst.id];
              const status = statusConfig(inst.status);
              const isOnline = inst.status === "online";

              return (
                <div
                  key={inst.id}
                  className={`rounded-xl border bg-card p-4 space-y-4 transition-shadow hover:shadow-md ${
                    isOnline ? "border-accent/30" : "border-border"
                  }`}
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link2 className="h-3.5 w-3.5 text-accent shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>Webhook de grupos ativo</TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Proxy chip */}
                  {(() => {
                    const proxy = proxiesByInstance.get(inst.id);
                    return (
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
                          <>
                            <span className="text-muted-foreground">Sem proxy</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 ml-auto text-xs"
                                  onClick={() => handleAssignProxy(inst)}
                                  disabled={!!currentAction}
                                >
                                  {currentAction === "assign" ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Atribuir proxy"
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reserva e aplica um proxy nesta instância (reinicia)</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                        {proxy && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-auto"
                                onClick={() => handleSwapProxy(inst)}
                                disabled={!!currentAction}
                              >
                                {currentAction === "swap" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Replace className="h-3 w-3" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Trocar proxy (libera o atual)</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    );
                  })()}

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
                  </div>

                  {/* Cooldown queue info */}
                  {(() => {
                    const queue = Array.isArray((inst as any).cooldown_queue) ? (inst as any).cooldown_queue as number[] : [3];
                    const idx = (inst as any).cooldown_queue_index ?? 0;
                    const current = queue[idx % queue.length] ?? 3;
                    return (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Descanso atual: <span className="font-semibold text-card-foreground">{current}min</span></span>
                        {queue.length > 1 && (
                          <span className="text-[10px]">({queue.map((v, i) => i === idx % queue.length ? `[${v}]` : v).join("→")})</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Last message */}
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {inst.last_message_at
                      ? format(new Date(inst.last_message_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : "Nenhuma mensagem enviada"}
                  </p>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 pt-1 border-t border-border">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleConnect(inst)} disabled={!!currentAction}>
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Conectar (QR Code)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCheckStatus(inst)} disabled={!!currentAction}>
                          {currentAction === "status" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Verificar status</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRestart(inst)} disabled={!!currentAction}>
                          {currentAction === "restart" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reiniciar</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleLogout(inst)} disabled={!!currentAction}>
                          {currentAction === "logout" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Deslogar</TooltipContent>
                    </Tooltip>

                    <div className="flex-1" />

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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(inst)} disabled={!!currentAction}>
                          {currentAction === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}


