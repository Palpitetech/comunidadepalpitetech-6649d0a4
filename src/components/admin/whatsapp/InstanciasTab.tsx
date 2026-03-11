import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Pencil, Trash2, Smartphone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
}

interface FormData {
  name: string;
  friendly_name: string;
  phone_number: string;
  evolution_instance_id: string;
  daily_limit: number;
}

const emptyForm: FormData = {
  name: "",
  friendly_name: "",
  phone_number: "",
  evolution_instance_id: "",
  daily_limit: 100,
};

export function InstanciasTab() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("whatsapp_instances" as any)
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar instâncias");
    } else {
      setInstances((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
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
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.friendly_name.trim() || !form.phone_number.trim() || !form.evolution_instance_id.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("whatsapp_instances" as any)
          .update({
            name: form.name.trim(),
            friendly_name: form.friendly_name.trim(),
            phone_number: form.phone_number.trim(),
            evolution_instance_id: form.evolution_instance_id.trim(),
            daily_limit: form.daily_limit,
          })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Instância atualizada");
      } else {
        const { error } = await supabase
          .from("whatsapp_instances" as any)
          .insert({
            name: form.name.trim(),
            friendly_name: form.friendly_name.trim(),
            phone_number: form.phone_number.trim(),
            evolution_instance_id: form.evolution_instance_id.trim(),
            daily_limit: form.daily_limit,
          });
        if (error) throw error;
        toast.success("Instância criada");
      }
      setDialogOpen(false);
      fetchInstances();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar instância");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta instância?")) return;
    const { error } = await supabase
      .from("whatsapp_instances" as any)
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Instância excluída");
      fetchInstances();
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500/15 text-green-700 border-green-500/30 text-[11px]">Online</Badge>;
      case "banned":
        return <Badge className="bg-red-500/15 text-red-700 border-red-500/30 text-[11px]">Banido</Badge>;
      default:
        return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30 text-[11px]">Offline</Badge>;
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{instances.length} instância(s)</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nova Instância
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Instância" : "Nova Instância"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Apelido *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Chip Principal"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="friendly_name">Nome de amigo *</Label>
                <Input
                  id="friendly_name"
                  placeholder="Ex: Carlos"
                  value={form.friendly_name}
                  onChange={(e) => setForm((f) => ({ ...f, friendly_name: e.target.value }))}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">Este nome será usado nas conversas de aquecimento</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone_number">Número de telefone *</Label>
                <Input
                  id="phone_number"
                  placeholder="5511999999999"
                  value={form.phone_number}
                  onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                  maxLength={20}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="evolution_id">ID da instância na Evolution API *</Label>
                <Input
                  id="evolution_id"
                  placeholder="Ex: instance_abc123"
                  value={form.evolution_instance_id}
                  onChange={(e) => setForm((f) => ({ ...f, evolution_instance_id: e.target.value }))}
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="daily_limit">Limite diário de mensagens *</Label>
                <Input
                  id="daily_limit"
                  type="number"
                  min={1}
                  value={form.daily_limit}
                  onChange={(e) => setForm((f) => ({ ...f, daily_limit: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingId ? "Salvar Alterações" : "Criar Instância"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards */}
      {instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Smartphone className="h-8 w-8 opacity-40" />
          <p className="text-sm">Nenhuma instância cadastrada</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((inst) => {
            const pct = inst.daily_limit > 0 ? Math.min((inst.messages_sent_today / inst.daily_limit) * 100, 100) : 0;
            return (
              <div key={inst.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                {/* Top */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold truncate">{inst.friendly_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{inst.name} · {inst.phone_number}</p>
                  </div>
                  {statusBadge(inst.status)}
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Enviadas hoje</span>
                    <span className="tabular-nums">{inst.messages_sent_today}/{inst.daily_limit}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>

                {/* Last message */}
                <p className="text-xs text-muted-foreground">
                  Última msg:{" "}
                  {inst.last_message_at
                    ? format(new Date(inst.last_message_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : "—"}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => openEdit(inst)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(inst.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
