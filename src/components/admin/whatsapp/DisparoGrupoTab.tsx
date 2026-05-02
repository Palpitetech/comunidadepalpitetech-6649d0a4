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
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";
import { cn } from "@/lib/utils";

import { GroupBlastScheduleCard } from "./GroupBlastScheduleCard";
import { GroupAdminsCard } from "./GroupAdminsCard";
import { useGroupBlastConfigs } from "@/hooks/useGroupBlastConfigs";

type BlastLoteria = "lotofacil" | "megasena";

const LOTERIA_LABELS: Record<BlastLoteria, string> = {
  lotofacil: "Lotofácil",
  megasena: "Mega-Sena",
};

const LOTERIA_EMOJI: Record<BlastLoteria, string> = {
  lotofacil: "🟣",
  megasena: "🟢",
};

interface PalpiteSettingsByLoteria {
  lotofacil?: { include_palpites: boolean; vip_group_link: string | null };
  megasena?: { include_palpites: boolean; vip_group_link: string | null };
}

interface Slot {
  id: string;
  schedule_times: string[];
  last_scheduled_index: number;
  message_type: "ai" | "manual" | "palpite";
  message_content: string;
  loteria: BlastLoteria;
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
  palpite_settings: PalpiteSettingsByLoteria;
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
  const { configs, loading: configsLoading, refetch: refetchConfigs } = useGroupBlastConfigs();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BlastConfig | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formGroupJids, setFormGroupJids] = useState<string[]>([""]);
  const [formSlots, setFormSlots] = useState<Slot[]>([]);
  const [formActive, setFormActive] = useState(true);
  const [formMemberTag, setFormMemberTag] = useState("");
  const [formTimeInputs, setFormTimeInputs] = useState<Record<string, string>>({});
  const [formPalpiteSettings, setFormPalpiteSettings] = useState<PalpiteSettingsByLoteria>({
    lotofacil: { include_palpites: true, vip_group_link: null },
    megasena: { include_palpites: true, vip_group_link: null },
  });
  const [saving, setSaving] = useState(false);

  // Last log per config (mostrado nos cards de configuração)
  const [lastLogs, setLastLogs] = useState<Record<string, BlastLog>>({});

  useEffect(() => {
    setLoading(configsLoading);
  }, [configsLoading]);

  // Atualiza últimas mensagens sempre que a lista de configs muda
  useEffect(() => {
    if (configs.length === 0) {
      setLastLogs({});
      return;
    }
    let cancelled = false;
    (async () => {
      const ids = configs.map((c) => c.id);
      const { data } = await supabase
        .from("group_blast_logs")
        .select("*")
        .in("config_id", ids)
        .order("created_at", { ascending: false });
      const map: Record<string, BlastLog> = {};
      for (const row of (data || []) as BlastLog[]) {
        if (!map[row.config_id]) map[row.config_id] = row;
      }
      if (!cancelled) setLastLogs(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [configs]);

  async function fetchAll() {
    await refetchConfigs();
  }

  function createEmptySlot(index: number): Slot {
    return { id: `slot_${index}`, schedule_times: [], last_scheduled_index: -1, message_type: "ai", message_content: "", loteria: "lotofacil" };
  }


  function openNewDialog() {
    setEditingConfig(null);
    setFormName("");
    setFormGroupJids([""]);
    setFormSlots([createEmptySlot(1)]);
    setFormActive(true);
    setFormPalpiteSettings({
      lotofacil: { include_palpites: true, vip_group_link: null },
      megasena: { include_palpites: true, vip_group_link: null },
    });
    setFormMemberTag("");
    setFormTimeInputs({ slot_1: "12:00" });
    setDialogOpen(true);
  }

  function openEditDialog(config: BlastConfig) {
    setEditingConfig(config);
    setFormName(config.name);
    setFormGroupJids(config.group_jids.length > 0 ? config.group_jids : [""]);
    const slots: Slot[] = config.slots.length > 0
      ? config.slots.map((s) => ({
          id: s.id,
          schedule_times: (s.schedule_times || []).map((t) => t.substring(0, 5)).sort(),
          last_scheduled_index: s.last_scheduled_index ?? -1,
          message_type: ((s as any).message_type as Slot["message_type"]) || "ai",
          message_content: (s as any).message_content || "",
          loteria: ((s as any).loteria as BlastLoteria) || "lotofacil",
        }))
      : [createEmptySlot(1)];
    setFormSlots(slots);
    setFormActive(config.is_active);
    // Carrega palpite_settings — fallback para legacy include_palpites/vip_group_link na Lotofácil
    const ps = (config as any).palpite_settings || {};
    setFormPalpiteSettings({
      lotofacil: ps.lotofacil ?? {
        include_palpites: config.include_palpites ?? true,
        vip_group_link: config.vip_group_link || null,
      },
      megasena: ps.megasena ?? { include_palpites: true, vip_group_link: null },
    });
    setFormMemberTag((config as any).member_tag || "");
    const inputs: Record<string, string> = {};
    slots.forEach((s) => { inputs[s.id] = "12:00"; });
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
    const slotsPayload = formSlots.map((s) => ({
      id: s.id,
      schedule_times: s.schedule_times.map((t) => (t.length === 5 ? `${t}:00` : t)),
      last_scheduled_index: s.last_scheduled_index ?? -1,
      message_type: s.message_type,
      message_content: s.message_type === "manual" ? s.message_content : "",
      loteria: s.message_type === "manual" ? "lotofacil" : s.loteria,
    }));

    // Compat: espelha settings da Lotofácil nos campos legacy
    const lotofacilSettings = formPalpiteSettings.lotofacil ?? { include_palpites: true, vip_group_link: null };

    const payload: any = {
      name: formName.trim(),
      group_jids: cleanJids,
      slots: slotsPayload,
      is_active: formActive,
      include_palpites: lotofacilSettings.include_palpites,
      vip_group_link: lotofacilSettings.vip_group_link || null,
      palpite_settings: formPalpiteSettings,
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
        refetchConfigs();
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
        refetchConfigs();
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
      refetchConfigs();
    }
  }

  async function handleTest(config: BlastConfig) {
    if (!confirm(`Enviar ${config.slots.length} mensagem(ns) de teste agora?`)) return;

    try {
      const { data, error } = await supabase.functions.invoke("group-blast-send", {
        body: { action: "prepare", force: true, config_id: config.id },
      });
      if (error) throw error;
      toast.success(`✅ ${config.slots.length} mensagem(ns) agendada(s) para teste!`);
      // Logs aparecem na aba "Monitor Grupos".
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  }

  async function handleSendNow(configId: string, slotId: string) {
    try {
      const { data, error } = await supabase.functions.invoke("group-blast-send", {
        body: { action: "send_now", config_id: configId, slot_id: slotId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`🚀 Disparo agendado! Será enviado em ~5s.`);
      // Logs aparecem na aba "Monitor Grupos".
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


  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <UnifiedLayout>
      <UnifiedToolbar
        left={
          <ActionButton
            label="Nova Configuração"
            icon={Plus}
            onClick={openNewDialog}
            variant="default"
          />
        }
        right={
          <ActionButton
            label="Atualizar"
            icon={RefreshCw}
            onClick={fetchAll}
          />
        }
      />

      <div className="space-y-6">
        <GroupBlastScheduleCard onAfterReschedule={fetchAll} />

        <UnifiedList
          isLoading={loading}
          count={configs.length}
          empty={{
            icon: Send,
            message: "Nenhuma configuração criada",
            submessage: "O disparo em grupos automatiza postagens com IA"
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {configs.map((config) => {
              const lastLog = lastLogs[config.id];
              return (
                <UnifiedCardItem
                  key={config.id}
                  className={cn(
                    "space-y-4",
                    !config.is_active && "opacity-60 grayscale-[0.3]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Send className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate">{config.name}</h3>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          {config.group_jids.length} grupo(s)
                        </p>
                      </div>
                    </div>
                    <Badge variant={config.is_active ? "default" : "secondary"} className="h-5 text-[9px] uppercase tracking-wider">
                      {config.is_active ? "Ativo" : "Pausado"}
                    </Badge>
                  </div>

                  <div className="space-y-2 border-l-2 border-primary/20 pl-3">
                    {config.slots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          {slot.message_type === "ai" ? <Bot className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
                          {slot.loteria.toUpperCase()}
                        </span>
                        <div className="flex gap-1">
                          {slot.schedule_times.map(t => (
                            <span key={t} className="bg-muted px-1 rounded font-mono text-[9px]">
                              {t.slice(0, 5)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 pt-2 border-t border-border">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(config)}>
                      {config.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTest(config)}>
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <div className="flex-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(config)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {/* handle delete */}}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </UnifiedCardItem>
              );
            })}
          </div>
        </UnifiedList>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {/* ... existing form content ... */}
      </Dialog>
    </UnifiedLayout>
  );
}
