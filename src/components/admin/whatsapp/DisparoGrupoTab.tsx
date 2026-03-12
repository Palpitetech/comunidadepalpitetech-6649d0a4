import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Pause, Play, TestTube, X, Clock, Send } from "lucide-react";
import { format } from "date-fns";

interface BlastConfig {
  id: string;
  name: string;
  group_jid: string;
  message_content: string;
  schedule_times: string[];
  last_scheduled_index: number;
  messages_per_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BlastLog {
  id: string;
  config_id: string;
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
  const [formGroupJid, setFormGroupJid] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formTimes, setFormTimes] = useState<string[]>([]);
  const [formActive, setFormActive] = useState(true);
  const [formMessagesPerDay, setFormMessagesPerDay] = useState(1);
  const [formTimeInput, setFormTimeInput] = useState("12:00");
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
    setConfigs((data as any) || []);

    // Fetch last log for each config
    if (data && data.length > 0) {
      const map: Record<string, BlastLog> = {};
      for (const c of data) {
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

  function openNewDialog() {
    setEditingConfig(null);
    setFormName("");
    setFormGroupJid("");
    setFormMessage("");
    setFormTimes([]);
    setFormActive(true);
    setFormTimeInput("12:00");
    setDialogOpen(true);
  }

  function openEditDialog(config: BlastConfig) {
    setEditingConfig(config);
    setFormName(config.name);
    setFormGroupJid(config.group_jid);
    setFormMessage(config.message_content);
    setFormTimes(
      (config.schedule_times || [])
        .map((t: string) => t.substring(0, 5))
        .sort()
    );
    setFormActive(config.is_active);
    setFormTimeInput("12:00");
    setDialogOpen(true);
  }

  function addTime() {
    if (formTimes.length >= 10) {
      toast.error("Máximo de 10 horários");
      return;
    }
    if (formTimes.includes(formTimeInput)) {
      toast.error("Horário já adicionado");
      return;
    }
    setFormTimes([...formTimes, formTimeInput].sort());
  }

  function removeTime(t: string) {
    setFormTimes(formTimes.filter((x) => x !== t));
  }

  async function handleSave() {
    if (!formName.trim() || !formGroupJid.trim() || !formMessage.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (formTimes.length === 0) {
      toast.error("Adicione pelo menos 1 horário");
      return;
    }

    setSaving(true);
    const payload = {
      name: formName.trim(),
      group_jid: formGroupJid.trim(),
      message_content: formMessage.trim(),
      schedule_times: formTimes.map((t) => `${t}:00`),
      is_active: formActive,
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
        .insert({ ...payload, last_scheduled_index: 0 });
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
    if (!confirm("Enviar mensagem agora para o grupo?")) return;

    try {
      const { data, error } = await supabase.functions.invoke("group-blast", {
        body: { action: "prepare", force: true, config_id: config.id },
      });
      if (error) throw error;
      toast.success("✅ Mensagem agendada para 30 segundos!");
      setTimeout(() => fetchLogs(), 2000);
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
            Configure mensagens automáticas com rotação de horários
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
            const times = (config.schedule_times || [])
              .map((t: string) => t.substring(0, 5))
              .sort();
            const nextIndex = (config.last_scheduled_index + 1) % (times.length || 1);
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
                    {config.group_jid}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Times queue */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Horários (fila):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {times.map((t: string, i: number) => (
                        <Badge
                          key={t}
                          variant={i === nextIndex ? "default" : "outline"}
                          className={
                            i === nextIndex
                              ? "bg-orange-500 hover:bg-orange-600 text-white"
                              : ""
                          }
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Próximo: {times[nextIndex] || "—"} (índice{" "}
                      {nextIndex + 1}/{times.length})
                    </p>
                  </div>

                  {/* Last send */}
                  {lastLog && (
                    <p className="text-xs text-muted-foreground">
                      Último envio:{" "}
                      {lastLog.sent_at
                        ? format(new Date(lastLog.sent_at), "dd/MM HH:mm")
                        : "—"}{" "}
                      {lastLog.status === "sent"
                        ? "✅"
                        : lastLog.status === "pending"
                        ? "⏳"
                        : "❌"}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(config)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(config)}
                    >
                      {config.is_active ? (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Ativar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(config)}
                    >
                      <TestTube className="h-3 w-3 mr-1" />
                      Testar
                    </Button>
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
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Config</TableHead>
                <TableHead className="text-xs">Grupo</TableHead>
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
                    <TableCell className="text-xs font-mono max-w-[120px] truncate">
                      {log.group_jid}
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
                      {log.sent_at
                        ? format(new Date(log.sent_at), "dd/MM HH:mm")
                        : "—"}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? "Editar Configuração" : "Nova Configuração"}
            </DialogTitle>
            <DialogDescription>
              Configure uma mensagem automática para um grupo do WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Resultado Mega-Sena"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">ID do Grupo *</Label>
              <Input
                value={formGroupJid}
                onChange={(e) => setFormGroupJid(e.target.value)}
                placeholder="120363XXXXXXXXXX@g.us"
              />
              <p className="text-[10px] text-muted-foreground">
                Copie o ID na aba Grupos
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Mensagem *</Label>
              <Textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                placeholder="Texto da mensagem..."
                rows={4}
              />
              <p className="text-[10px] text-muted-foreground">
                Suporta *negrito*, _itálico_, emojis
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Horários de envio * ({formTimes.length}/10)
              </Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={formTimeInput}
                  onChange={(e) => setFormTimeInput(e.target.value)}
                  className="w-[130px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTime}
                  disabled={formTimes.length >= 10}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {formTimes.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 pr-1">
                    {t}
                    <button
                      onClick={() => removeTime(t)}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {formTimes.length === 0 && (
                <p className="text-[10px] text-destructive">
                  Mínimo 1 horário obrigatório
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formActive}
                onCheckedChange={setFormActive}
              />
              <Label className="text-xs">Ativo</Label>
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
