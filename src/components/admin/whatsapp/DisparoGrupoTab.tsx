import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Pause, Play, TestTube, X, Clock, Send, Trash2, Sparkles, Bot, PenLine, Dices, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

interface Slot {
  id: string;
  schedule_times: string[];
  last_scheduled_index: number;
  message_type: "ai" | "manual" | "palpite";
  message_content: string;
}

interface BlastConfig {
  id: string;
  name: string;
  group_jids: string[];
  slots: Slot[];
  is_active: boolean;
  include_palpites: boolean;
  vip_group_link: string | null;
  member_tag: string | null;
  created_at: string;
  updated_at: string;
}

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
}

export function DisparoGrupoTab() {
  const [configs, setConfigs] = useState<BlastConfig[]>([]);
  const [logs, setLogs] = useState<BlastLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BlastConfig | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [configFilter, setConfigFilter] = useState<string>("all");

  // Form state
  const [formName, setFormName] = useState("");
  const [formGroupJids, setFormGroupJids] = useState<string[]>([""]);
  const [formSlots, setFormSlots] = useState<Slot[]>([]);
  const [formActive, setFormActive] = useState(true);
  const [formIncludePalpites, setFormIncludePalpites] = useState(true);
  const [formVipGroupLink, setFormVipGroupLink] = useState("");
  const [formMemberTag, setFormMemberTag] = useState("");
  const [formTimeInputs, setFormTimeInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Last log per config
  const [lastLogs, setLastLogs] = useState<Record<string, BlastLog>>({});

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchConfigs(), fetchLogs()]);
    setLoading(false);
  }

  async function fetchConfigs() {
    const { data, error } = await supabase
      .from("group_blast_configs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    const parsed = (data || []).map((c: any) => ({
      ...c,
      slots: Array.isArray(c.slots) ? c.slots : [],
    }));
    setConfigs(parsed);

    // Fetch last log for each config
    if (parsed.length > 0) {
      const map: Record<string, BlastLog> = {};
      for (const c of parsed) {
        const { data: logData } = await supabase
          .from("group_blast_logs")
          .select("*")
          .eq("config_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (logData && logData.length > 0) {
          map[c.id] = logData[0] as any;
        }
      }
      setLastLogs(map);
    }
  }

  async function fetchLogs() {
    const { data, error } = await supabase
      .from("group_blast_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error(error);
      return;
    }
    setLogs((data as any) || []);
  }

  function createEmptySlot(index: number): Slot {
    return { id: `slot_${index}`, schedule_times: [], last_scheduled_index: -1, message_type: "ai", message_content: "" };
  }

  function openNewDialog() {
    setEditingConfig(null);
    setFormName("");
    setFormGroupJids([""]);
    setFormSlots([createEmptySlot(1)]);
    setFormActive(true);
    setFormIncludePalpites(true);
    setFormVipGroupLink("");
    setFormMemberTag("");
    setFormTimeInputs({ slot_1: "12:00" });
    setDialogOpen(true);
  }

  function openEditDialog(config: BlastConfig) {
    setEditingConfig(config);
    setFormName(config.name);
    setFormGroupJids(config.group_jids.length > 0 ? config.group_jids : [""]);
    const slots = config.slots.length > 0
      ? config.slots.map(s => ({
          ...s,
          schedule_times: (s.schedule_times || []).map(t => t.substring(0, 5)).sort(),
          message_type: (s as any).message_type || "ai",
          message_content: (s as any).message_content || "",
        }))
      : [createEmptySlot(1)];
    setFormSlots(slots);
    setFormActive(config.is_active);
    setFormIncludePalpites(config.include_palpites ?? true);
    setFormVipGroupLink(config.vip_group_link || "");
    setFormMemberTag((config as any).member_tag || "");
    const inputs: Record<string, string> = {};
    slots.forEach(s => { inputs[s.id] = "12:00"; });
    setFormTimeInputs(inputs);
    setDialogOpen(true);
  }

  function addSlot() {
    if (formSlots.length >= 3) {
      toast.error("Máximo de 3 slots");
      return;
    }
    const nextNum = formSlots.length + 1;
    const newSlot = createEmptySlot(nextNum);
    setFormSlots([...formSlots, newSlot]);
    setFormTimeInputs(prev => ({ ...prev, [newSlot.id]: "12:00" }));
  }

  function removeSlot(slotId: string) {
    if (formSlots.length <= 1) {
      toast.error("Mínimo de 1 slot");
      return;
    }
    setFormSlots(formSlots.filter(s => s.id !== slotId));
  }

  function addTimeToSlot(slotId: string) {
    const slot = formSlots.find(s => s.id === slotId);
    if (!slot) return;
    if (slot.schedule_times.length >= 10) {
      toast.error("Máximo de 10 horários por slot");
      return;
    }
    const timeVal = formTimeInputs[slotId] || "12:00";
    if (slot.schedule_times.includes(timeVal)) {
      toast.error("Horário já adicionado neste slot");
      return;
    }
    setFormSlots(formSlots.map(s =>
      s.id === slotId
        ? { ...s, schedule_times: [...s.schedule_times, timeVal].sort() }
        : s
    ));
  }

  function removeTimeFromSlot(slotId: string, time: string) {
    setFormSlots(formSlots.map(s =>
      s.id === slotId
        ? { ...s, schedule_times: s.schedule_times.filter(t => t !== time) }
        : s
    ));
  }

  async function handleSave() {
    const cleanJids = formGroupJids.map(j => j.trim()).filter(j => j !== "");
    if (!formName.trim() || cleanJids.length === 0) {
      toast.error("Preencha nome e pelo menos 1 ID de grupo");
    }

    // Validate each slot
    for (const slot of formSlots) {
      if (slot.schedule_times.length === 0) {
        toast.error(`Slot ${slot.id.replace("slot_", "")} precisa de pelo menos 1 horário`);
        return;
      }
      if (slot.message_type === "manual" && !slot.message_content.trim()) {
        toast.error(`Slot ${slot.id.replace("slot_", "")} precisa de uma mensagem`);
        return;
      }
    }

    setSaving(true);

    // Format times with seconds for DB
    const slotsPayload = formSlots.map(s => ({
      id: s.id,
      schedule_times: s.schedule_times.map(t => t.length === 5 ? `${t}:00` : t),
      last_scheduled_index: s.last_scheduled_index ?? -1,
      message_type: s.message_type,
      message_content: s.message_type === "manual" ? s.message_content : "",
    }));

    const payload: any = {
      name: formName.trim(),
      group_jids: cleanJids,
      slots: slotsPayload,
      is_active: formActive,
      include_palpites: formIncludePalpites,
      vip_group_link: formVipGroupLink.trim() || null,
      member_tag: formMemberTag.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editingConfig) {
      const { error } = await supabase
        .from("group_blast_configs")
        .update(payload)
        .eq("id", editingConfig.id);
      if (error) {
        toast.error("Erro ao salvar: " + error.message);
      } else {
        toast.success("Configuração atualizada!");
        setDialogOpen(false);
        fetchConfigs();
      }
    } else {
      const { error } = await supabase
        .from("group_blast_configs")
        .insert(payload);
      if (error) {
        toast.error("Erro ao criar: " + error.message);
      } else {
        toast.success("Configuração criada!");
        setDialogOpen(false);
        fetchConfigs();
      }
    }
    setSaving(false);
  }

  async function toggleActive(config: BlastConfig) {
    const { error } = await supabase
      .from("group_blast_configs")
      .update({ is_active: !config.is_active, updated_at: new Date().toISOString() })
      .eq("id", config.id);
    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success(config.is_active ? "Pausado" : "Ativado");
      fetchConfigs();
    }
  }

  async function handleTest(config: BlastConfig) {
    if (!confirm(`Enviar ${config.slots.length} mensagem(ns) de teste agora?`)) return;

    try {
      const { data, error } = await supabase.functions.invoke("group-blast", {
        body: { action: "prepare", force: true, config_id: config.id },
      });
      if (error) throw error;
      toast.success(`✅ ${config.slots.length} mensagem(ns) agendada(s) para teste!`);
      setTimeout(() => fetchLogs(), 2000);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  }

  async function handleSendNow(configId: string, slotId: string) {
    try {
      const { data, error } = await supabase.functions.invoke("group-blast", {
        body: { action: "send_now", config_id: configId, slot_id: slotId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`🚀 Disparo agendado! Será enviado em ~5s.`);
      setTimeout(() => fetchLogs(), 3000);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  }

  async function handleSyncMembers(configId: string) {
    if (!confirm("Sincronizar tags de membros atuais dos grupos? Isso pode levar alguns segundos.")) return;
    try {
      const { data, error } = await supabase.functions.invoke("sync-group-members", {
        body: { config_id: configId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`✅ Sincronizado! ${data.updated} perfil(is) atualizado(s), ${data.notFound} não encontrado(s).`);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  }

  function getConfigName(configId: string) {
    return configs.find((c) => c.id === configId)?.name || "—";
  }

  const filteredLogs = logs.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (configFilter !== "all" && l.config_id !== configFilter) return false;
    return true;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-600 text-white">✅ Enviado</Badge>;
      case "pending":
        return <Badge variant="secondary">⏳ Pendente</Badge>;
      case "failed":
        return <Badge variant="destructive">❌ Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Disparo em Grupos</h2>
          <p className="text-xs text-muted-foreground">
            Mensagens automáticas com IA baseadas nos posts da comunidade
          </p>
        </div>
        <Button size="sm" onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Configuração
        </Button>
      </div>

      {/* Config Cards */}
      {configs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma configuração criada. Clique em "+ Nova Configuração".
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {configs.map((config) => {
            const lastLog = lastLogs[config.id];

            return (
              <Card key={config.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          config.is_active ? "bg-green-500" : "bg-muted-foreground/40"
                        }`}
                      />
                      {config.name}
                    </CardTitle>
                    <Badge variant={config.is_active ? "default" : "secondary"}>
                      {config.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {config.group_jids.join(", ")} ({config.group_jids.length} grupo{config.group_jids.length !== 1 ? "s" : ""})
                  </p>
                  {(config.slots || []).some((s: any) => s.message_type === "palpite") && (
                    <Badge variant="outline" className="text-[10px] w-fit mt-1">
                      {config.include_palpites ? "🎰 Com Palpites" : "📊 Só Estratégia + CTA"}
                    </Badge>
                  )}
                  {(config as any).member_tag && (
                    <Badge variant="outline" className="text-[10px] w-fit mt-1">
                      🏷️ Tag: {(config as any).member_tag}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Slots display */}
                  <div className="space-y-2">
                    {(config.slots || []).map((slot) => {
                      const times = (slot.schedule_times || []).map(t => t.substring(0, 5)).sort();
                      const nextIdx = ((slot.last_scheduled_index ?? -1) + 1) % (times.length || 1);
                      return (
                        <div key={slot.id} className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-muted-foreground flex items-center gap-1">
                            {(slot as any).message_type === "manual" ? <PenLine className="h-3 w-3" /> : (slot as any).message_type === "palpite" ? <Dices className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                              {(slot as any).message_type === "manual" ? "✏️ Manual" : (slot as any).message_type === "palpite" ? "🎰 Palpite" : "🤖 IA"} — Próximo: {times[nextIdx] || "—"} ({times.length} horário{times.length !== 1 ? "s" : ""})
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => handleSendNow(config.id, slot.id)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Disparar
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {times.map((t, i) => (
                              <Badge
                                key={t}
                                variant={i === nextIdx ? "default" : "outline"}
                                className={i === nextIdx ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>


                  {/* Last send */}
                  {lastLog && (
                    <p className="text-xs text-muted-foreground">
                      Último envio:{" "}
                      {lastLog.sent_at
                        ? format(new Date(lastLog.sent_at), "dd/MM HH:mm")
                        : "—"}{" "}
                      {lastLog.status === "sent" ? "✅" : lastLog.status === "pending" ? "⏳" : "❌"}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(config)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(config)}>
                      {config.is_active ? (
                        <><Pause className="h-3 w-3 mr-1" />Pausar</>
                      ) : (
                        <><Play className="h-3 w-3 mr-1" />Ativar</>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleTest(config)}>
                      <TestTube className="h-3 w-3 mr-1" />
                      Testar
                    </Button>
                    {(config as any).member_tag && (
                      <Button variant="outline" size="sm" onClick={() => handleSyncMembers(config.id)}>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sincronizar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Logs Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-4 w-4" />
          Histórico de Envios
        </h3>

        <div className="flex gap-2 flex-wrap">
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
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Config</TableHead>
                <TableHead className="text-xs">Slot</TableHead>
                <TableHead className="text-xs">Instância</TableHead>
                <TableHead className="text-xs">Agendado</TableHead>
                <TableHead className="text-xs">Enviado</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground text-xs py-6">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-medium">
                      {getConfigName(log.config_id)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.slot_id?.replace("_", " ") || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {log.evolution_instance_id
                        ? log.evolution_instance_id.substring(0, 12) + "…"
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(log.scheduled_for), "dd/MM HH:mm")}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.sent_at ? format(new Date(log.sent_at), "dd/MM HH:mm") : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(log.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? "Editar Configuração" : "Nova Configuração"}
            </DialogTitle>
            <DialogDescription>
              A IA gera convites automáticos baseados no post mais recente da comunidade
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Grupo Loteria VIP"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Grupos ({formGroupJids.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormGroupJids([...formGroupJids, ""])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Grupo
                </Button>
              </div>
              {formGroupJids.map((jid, idx) => (
                <div key={idx} className="flex gap-1">
                  <Input
                    value={jid}
                    onChange={(e) => {
                      const updated = [...formGroupJids];
                      updated[idx] = e.target.value;
                      setFormGroupJids(updated);
                    }}
                    placeholder="120363XXXXXXXXXX@g.us"
                    className="text-xs"
                  />
                  {formGroupJids.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-destructive"
                      onClick={() => setFormGroupJids(formGroupJids.filter((_, i) => i !== idx))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground">
                Copie o ID na aba Grupos. Adicione múltiplos grupos para enviar a mesma mensagem para todos.
              </p>
            </div>

            {/* Slots Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Slots de Envio ({formSlots.length}/3)</Label>
                {formSlots.length < 3 && (
                  <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar Slot
                  </Button>
                )}
              </div>

              {formSlots.map((slot, idx) => (
                <Card key={slot.id} className="border-dashed">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">Slot {idx + 1}</p>
                      {formSlots.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => removeSlot(slot.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={formTimeInputs[slot.id] || "12:00"}
                        onChange={(e) =>
                          setFormTimeInputs(prev => ({ ...prev, [slot.id]: e.target.value }))
                        }
                        className="w-[130px]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeToSlot(slot.id)}
                        disabled={slot.schedule_times.length >= 10}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {slot.schedule_times.map((t) => (
                        <Badge key={t} variant="secondary" className="gap-1 pr-1">
                          {t}
                          <button
                            onClick={() => removeTimeFromSlot(slot.id, t)}
                            className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    {slot.schedule_times.length === 0 && (
                      <p className="text-[10px] text-destructive">
                        Mínimo 1 horário obrigatório
                      </p>
                    )}

                    {/* Message type toggle */}
                    <div className="space-y-2 pt-1 border-t border-dashed">
                      <Label className="text-[10px] text-muted-foreground">Tipo de mensagem</Label>
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          type="button"
                          variant={slot.message_type === "ai" ? "default" : "outline"}
                          size="sm"
                          className="text-[10px] h-7"
                          onClick={() => setFormSlots(formSlots.map(s =>
                            s.id === slot.id ? { ...s, message_type: "ai" } : s
                          ))}
                        >
                          <Bot className="h-3 w-3 mr-1" />
                          🤖 Gerada por IA
                        </Button>
                        <Button
                          type="button"
                          variant={slot.message_type === "manual" ? "default" : "outline"}
                          size="sm"
                          className="text-[10px] h-7"
                          onClick={() => setFormSlots(formSlots.map(s =>
                            s.id === slot.id ? { ...s, message_type: "manual" } : s
                          ))}
                        >
                          <PenLine className="h-3 w-3 mr-1" />
                          ✏️ Escrever manualmente
                        </Button>
                        <Button
                          type="button"
                          variant={slot.message_type === "palpite" ? "default" : "outline"}
                          size="sm"
                          className="text-[10px] h-7"
                          onClick={() => setFormSlots(formSlots.map(s =>
                            s.id === slot.id ? { ...s, message_type: "palpite" } : s
                          ))}
                        >
                          <Dices className="h-3 w-3 mr-1" />
                          🎰 Palpite Lotofácil
                        </Button>
                      </div>

                      {slot.message_type === "ai" ? (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          A IA gera um convite baseado no post mais recente no momento do envio.
                        </p>
                      ) : slot.message_type === "palpite" ? (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Dices className="h-3 w-3" />
                          Gera 15 palpites com estratégia baseada nos 5 últimos concursos da Lotofácil.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          <Label className="text-[10px]">Mensagem *</Label>
                          <Textarea
                            value={slot.message_content}
                            onChange={(e) => setFormSlots(formSlots.map(s =>
                              s.id === slot.id ? { ...s, message_content: e.target.value } : s
                            ))}
                            placeholder="Digite a mensagem do grupo..."
                            rows={4}
                            className="text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Suporta *negrito*, _itálico_, emojis
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Palpite mode toggle */}
            {formSlots.some(s => s.message_type === "palpite") && (
              <div className="space-y-3 rounded-lg border border-dashed p-3">
                <Label className="text-xs font-semibold">Modo Palpite Lotofácil</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formIncludePalpites ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setFormIncludePalpites(true)}
                  >
                    🎰 Com Palpites
                  </Button>
                  <Button
                    type="button"
                    variant={!formIncludePalpites ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setFormIncludePalpites(false)}
                  >
                    📊 Só Estratégia + CTA
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {formIncludePalpites
                    ? "Envia a estratégia completa + os 15 jogos gerados."
                    : "Envia apenas a estratégia e um CTA para entrar no Grupo VIP."}
                </p>

                {!formIncludePalpites && (
                  <div className="space-y-1">
                    <Label className="text-[10px]">Link do Grupo VIP</Label>
                    <Input
                      value={formVipGroupLink}
                      onChange={(e) => setFormVipGroupLink(e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      className="text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Link que aparecerá no CTA para entrar no grupo VIP.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label className="text-xs">Ativo</Label>
            </div>

            {/* Member Tag */}
            <div className="space-y-1.5 rounded-lg border border-dashed p-3">
              <Label className="text-xs font-semibold">🏷️ Tag de Membro</Label>
              <Input
                value={formMemberTag}
                onChange={(e) => setFormMemberTag(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="grupo_free"
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Tag adicionada automaticamente nos perfis quando alguém entra no grupo e removida quando sai. Deixe vazio para desativar.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
