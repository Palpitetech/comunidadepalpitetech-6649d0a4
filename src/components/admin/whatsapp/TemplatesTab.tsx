import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Plus, Pencil, Trash2, FileText, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  event_trigger: string;
  created_at: string;
}

interface FormData {
  name: string;
  content: string;
  event_trigger: string;
}

const emptyForm: FormData = { name: "", content: "", event_trigger: "manual" };

const VARIABLES = ["{{nome}}", "{{telefone}}", "{{produto}}"];

export function TemplatesTab() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("message_templates" as any)
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar templates");
    } else {
      setTemplates((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  const fetchEventTypes = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("event_type");
    if (data) {
      const unique = [...new Set(data.map((d: any) => d.event_type as string))].sort();
      // Ensure "manual" is always present
      if (!unique.includes("manual")) unique.push("manual");
      setEventTypes(unique);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchEventTypes();
  }, [fetchTemplates, fetchEventTypes]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: MessageTemplate) => {
    setEditingId(t.id);
    setForm({ name: t.name, content: t.content, event_trigger: t.event_trigger });
    setDialogOpen(true);
  };

  const insertVariable = (variable: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setForm((f) => ({ ...f, content: f.content + variable }));
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = form.content.slice(0, start);
    const after = form.content.slice(end);
    const newContent = before + variable + after;
    setForm((f) => ({ ...f, content: newContent }));
    // Restore cursor after variable
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + variable.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim() || !form.event_trigger) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        content: form.content.trim(),
        event_trigger: form.event_trigger,
      };
      if (editingId) {
        const { error } = await supabase.from("message_templates" as any).update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Template atualizado");
      } else {
        const { error } = await supabase.from("message_templates" as any).insert(payload);
        if (error) throw error;
        toast.success("Template criado");
      }
      setDialogOpen(false);
      fetchTemplates();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este template?")) return;
    const { error } = await supabase.from("message_templates" as any).delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Template excluído");
      fetchTemplates();
    }
  };

  const triggerBadge = (trigger: string) => {
    switch (trigger) {
      case "lead_created":
        return <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 text-[11px]">Lead</Badge>;
      case "sale_confirmed":
        return <Badge className="bg-green-500/15 text-green-700 border-green-500/30 text-[11px]">Venda</Badge>;
      default:
        return <Badge variant="secondary" className="text-[11px]">Manual</Badge>;
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{templates.length} template(s)</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Template" : "Novo Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-name">Nome do template *</Label>
                <Input
                  id="tpl-name"
                  placeholder="Ex: Boas-vindas Lead"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Evento gatilho *</Label>
                <Popover open={triggerOpen} onOpenChange={setTriggerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={triggerOpen}
                      className="w-full justify-between font-normal"
                    >
                      {form.event_trigger || "Selecione o gatilho"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar evento..." />
                      <CommandList>
                        <CommandEmpty>Nenhum evento encontrado.</CommandEmpty>
                        <CommandGroup>
                          {eventTypes.map((evt) => (
                            <CommandItem
                              key={evt}
                              value={evt}
                              onSelect={(v) => {
                                setForm((f) => ({ ...f, event_trigger: v }));
                                setTriggerOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", form.event_trigger === evt ? "opacity-100" : "opacity-0")} />
                              {evt}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-content">Conteúdo da mensagem *</Label>
                <Textarea
                  id="tpl-content"
                  ref={textareaRef}
                  placeholder="Olá {{nome}}, tudo bem?"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={5}
                  maxLength={2000}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="px-2 py-0.5 rounded-md bg-muted text-xs font-mono text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors border border-border"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingId ? "Salvar Alterações" : "Criar Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <FileText className="h-8 w-8 opacity-40" />
          <p className="text-sm">Nenhum template cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <div key={tpl.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold truncate">{tpl.name}</h3>
                {triggerBadge(tpl.event_trigger)}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{tpl.content}</p>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => openEdit(tpl)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(tpl.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
