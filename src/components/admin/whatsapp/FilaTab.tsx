import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Play, RotateCcw, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QueueItem {
  id: string;
  instance_id: string | null;
  template_id: string | null;
  recipient_phone: string;
  recipient_name: string | null;
  variables: Record<string, string>;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

interface TemplateOption {
  id: string;
  name: string;
  content: string;
  event_trigger: string;
}

interface InstanceOption {
  id: string;
  name: string;
  friendly_name: string;
}

interface FormData {
  recipient_phone: string;
  recipient_name: string;
  template_id: string;
  produto: string;
}

const emptyForm: FormData = { recipient_phone: "", recipient_name: "", template_id: "", produto: "" };

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendente" },
  { value: "sending", label: "Enviando" },
  { value: "sent", label: "Enviado" },
  { value: "failed", label: "Falhou" },
];

export function FilaTab() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [instances, setInstances] = useState<InstanceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [queueRes, templatesRes, instancesRes] = await Promise.all([
      supabase
        .from("message_queue" as any)
        .select("*")
        .order("scheduled_at", { ascending: false })
        .limit(200),
      supabase
        .from("message_templates" as any)
        .select("id, name, content, event_trigger")
        .order("name"),
      supabase
        .from("whatsapp_instances" as any)
        .select("id, name, friendly_name")
        .order("name"),
    ]);

    if (queueRes.error) console.error(queueRes.error);
    if (templatesRes.error) console.error(templatesRes.error);
    if (instancesRes.error) console.error(instancesRes.error);

    setQueue((queueRes.data as any[]) || []);
    setTemplates((templatesRes.data as any[]) || []);
    setInstances((instancesRes.data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const selectedTemplate = templates.find((t) => t.id === form.template_id);
  const needsProduto = selectedTemplate?.content?.includes("{{produto}}") ?? false;

  const handleSave = async () => {
    if (!form.recipient_phone.trim() || !form.recipient_name.trim() || !form.template_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const variables: Record<string, string> = {
        nome: form.recipient_name.trim(),
        telefone: form.recipient_phone.trim(),
      };
      if (needsProduto && form.produto.trim()) {
        variables.produto = form.produto.trim();
      }

      const { error } = await supabase.from("message_queue" as any).insert({
        recipient_phone: form.recipient_phone.trim(),
        recipient_name: form.recipient_name.trim(),
        template_id: form.template_id,
        variables,
        status: "pending",
        scheduled_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Envio adicionado à fila");
      setDialogOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao criar envio");
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = async (id: string) => {
    const { error } = await supabase
      .from("message_queue" as any)
      .update({ status: "pending", error_message: null })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao retentar");
    } else {
      toast.success("Reenviado para a fila");
      fetchAll();
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-queue", {
        method: "POST",
      });
      if (error) throw error;
      const processed = data?.processed ?? 0;
      toast.success(`Fila processada: ${processed} mensagem(ns) enviada(s)`);
      fetchAll();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao processar fila");
    } finally {
      setProcessing(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "sending":
        return <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 text-[11px]">Enviando</Badge>;
      case "sent":
        return <Badge className="bg-green-500/15 text-green-700 border-green-500/30 text-[11px]">Enviado</Badge>;
      case "failed":
        return <Badge className="bg-red-500/15 text-red-700 border-red-500/30 text-[11px]">Falhou</Badge>;
      default:
        return <Badge variant="secondary" className="text-[11px]">Pendente</Badge>;
    }
  };

  const getTemplateName = (id: string | null) => templates.find((t) => t.id === id)?.name || "—";
  const getInstanceName = (id: string | null) => instances.find((i) => i.id === id)?.name || "—";

  const formatDate = (d: string | null) =>
    d ? format(new Date(d), "dd/MM/yy HH:mm", { locale: ptBR }) : "—";

  const filtered = queue.filter((item) => {
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (filterDate) {
      const itemDate = item.scheduled_at?.slice(0, 10) || "";
      if (itemDate !== filterDate) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            className="w-[160px] h-9 text-xs"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          {filterDate && (
            <Button variant="ghost" size="sm" className="text-xs h-9" onClick={() => setFilterDate("")}>
              Limpar
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleProcess} disabled={processing}>
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Processar Fila
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            Novo Envio Manual
          </Button>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Envio Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Telefone do destinatário *</Label>
              <Input
                placeholder="5511999999999"
                value={form.recipient_phone}
                onChange={(e) => setForm((f) => ({ ...f, recipient_phone: e.target.value }))}
                maxLength={20}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nome do destinatário *</Label>
              <Input
                placeholder="Ex: João Silva"
                value={form.recipient_name}
                onChange={(e) => setForm((f) => ({ ...f, recipient_name: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Template *</Label>
              <Select value={form.template_id} onValueChange={(v) => setForm((f) => ({ ...f, template_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {needsProduto && (
              <div className="space-y-1.5">
                <Label>Produto</Label>
                <Input
                  placeholder="Nome do produto"
                  value={form.produto}
                  onChange={(e) => setForm((f) => ({ ...f, produto: e.target.value }))}
                  maxLength={200}
                />
              </div>
            )}
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Adicionar à Fila
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Send className="h-8 w-8 opacity-40" />
          <p className="text-sm">Nenhum envio na fila</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Destinatário</TableHead>
                <TableHead className="text-xs">Template</TableHead>
                <TableHead className="text-xs">Instância</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Agendado</TableHead>
                <TableHead className="text-xs">Enviado</TableHead>
                <TableHead className="text-xs w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs">
                    <div className="font-medium">{item.recipient_name || "—"}</div>
                    <div className="text-muted-foreground">{item.recipient_phone}</div>
                  </TableCell>
                  <TableCell className="text-xs">{getTemplateName(item.template_id)}</TableCell>
                  <TableCell className="text-xs">{getInstanceName(item.instance_id)}</TableCell>
                  <TableCell>{statusBadge(item.status)}</TableCell>
                  <TableCell className="text-xs tabular-nums">{formatDate(item.scheduled_at)}</TableCell>
                  <TableCell className="text-xs tabular-nums">{formatDate(item.sent_at)}</TableCell>
                  <TableCell>
                    {item.status === "failed" && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleRetry(item.id)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retentar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {filtered.length} de {queue.length} registro(s)
      </p>
    </div>
  );
}
