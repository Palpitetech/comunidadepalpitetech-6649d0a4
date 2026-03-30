import { useState, useEffect, useCallback, useRef } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Pencil, Trash2, FileText, ChevronsUpDown, Check, Send, Pause, Play, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  event_trigger: string;
  created_at: string;
  is_active?: boolean;
  delay_enabled?: boolean;
  delay_minutes?: number;
}

interface FormData {
  name: string;
  content: string;
  event_trigger: string;
  delay_enabled: boolean;
  delay_minutes: number;
}

const emptyForm: FormData = { name: "", content: "", event_trigger: "manual", delay_enabled: false, delay_minutes: 0 };

const DELAY_OPTIONS = [
  { value: 2, label: "2 min" },
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 1440, label: "24h" },
];

function formatDelay(minutes: number): string {
  if (minutes === 1440) return "24h";
  return `${minutes} min`;
}

const EVENT_MASKS: Record<string, string> = {
  novo_cadastro: "Novo Cadastro",
  compra_aprovada: "Compra Aprovada",
  pix_gerado: "PIX Gerado",
  pix_expirado: "PIX Expirado",
  boleto_gerado: "Boleto Gerado",
  boleto_expirado: "Boleto Expirado",
  assinatura_cancelada: "Assinatura Cancelada",
  assinatura_inadimplente: "Inadimplente",
  checkout_abandonado: "Checkout Abandonado",
  carrinho_abandonado: "Carrinho Abandonado",
  SALE_APPROVED: "Venda Aprovada",
  SALE_REFUSED: "Venda Recusada",
  SALE_CHARGEBACK: "Chargeback",
  SALE_REFUNDED: "Reembolso",
  BANK_SLIP_GENERATED: "Boleto Gerado",
  BANK_SLIP_EXPIRED: "Boleto Expirado",
  PIX_GENERATED: "PIX Gerado",
  PIX_EXPIRED: "PIX Expirado",
  SUBSCRIPTION_CANCELED: "Assinatura Cancelada",
  SUBSCRIPTION_OVERDUE: "Inadimplente",
  SUBSCRIPTION_RENEWED: "Assinatura Renovada",
  SUBSCRIPTION_REACTIVATED: "Assinatura Reativada",
  SUBSCRIPTION_TRIAL_STARTED: "Teste Iniciado",
  SUBSCRIPTION_TRIAL_ENDED: "Teste Encerrado",
  CHECKOUT_ABANDONED: "Checkout Abandonado",
  ABANDONED_CART: "Carrinho Abandonado",
  SUBSCRIPTION_EXPIRED: "Assinatura Expirada",
  manual: "Manual",
  lead_created: "Lead Cadastrado",
  sale_confirmed: "Venda Confirmada",
};

function getEventLabel(eventType: string): string {
  return EVENT_MASKS[eventType] || eventType;
}

const VARIABLES = ["{{nome}}", "{{telefone}}", "{{email}}", "{{produto}}"];
const TEST_PHONE = "5516997175392";

export function TemplatesTab() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
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
    const [eventsResult, kirvanoResult] = await Promise.all([
      supabase.from("events").select("event_type"),
      supabase.from("kirvano_webhook_logs_masked").select("event"),
    ]);

    const allTypes = new Set<string>();
    eventsResult.data?.forEach((d: any) => { if (d.event_type) allTypes.add(d.event_type); });
    kirvanoResult.data?.forEach((d: any) => { if (d.event) allTypes.add(d.event); });
    allTypes.add("manual");
    setEventTypes([...allTypes].sort());
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
    setForm({
      name: t.name,
      content: t.content,
      event_trigger: t.event_trigger,
      delay_enabled: t.delay_enabled ?? false,
      delay_minutes: t.delay_minutes ?? 0,
    });
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
        delay_enabled: form.delay_enabled,
        delay_minutes: form.delay_enabled ? form.delay_minutes : 0,
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

  const handleToggleActive = async (tpl: MessageTemplate) => {
    const newStatus = !(tpl.is_active ?? true);
    setTogglingId(tpl.id);
    try {
      const { error } = await supabase
        .from("message_templates" as any)
        .update({ is_active: newStatus })
        .eq("id", tpl.id);
      if (error) throw error;
      toast.success(newStatus ? "Template ativado" : "Template pausado");
      fetchTemplates();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleTestSend = async (tpl: MessageTemplate) => {
    setTestingId(tpl.id);
    try {
      // Replace variables with test values
      const testContent = tpl.content
        .replace(/\{\{nome\}\}/g, "Teste")
        .replace(/\{\{telefone\}\}/g, TEST_PHONE)
        .replace(/\{\{email\}\}/g, "teste@teste.com")
        .replace(/\{\{produto\}\}/g, "Produto Teste");

      const { error } = await supabase.from("message_queue" as any).insert({
        recipient_phone: TEST_PHONE,
        recipient_name: "Teste",
        template_id: tpl.id,
        variables: { nome: "Teste", telefone: TEST_PHONE, email: "teste@teste.com", produto: "Produto Teste" },
        scheduled_at: new Date().toISOString(),
        status: "pending",
      });

      if (error) throw error;
      toast.success(`Mensagem de teste enfileirada para ${TEST_PHONE}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao enviar teste");
    } finally {
      setTestingId(null);
    }
  };

  const triggerBadge = (trigger: string) => {
    return <Badge variant="secondary" className="text-[11px]">{getEventLabel(trigger)}</Badge>;
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
                      {form.event_trigger ? getEventLabel(form.event_trigger) : "Selecione o gatilho"}
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
                              value={`${evt} ${getEventLabel(evt)}`}
                              onSelect={() => {
                                setForm((f) => ({ ...f, event_trigger: evt }));
                                setTriggerOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", form.event_trigger === evt ? "opacity-100" : "opacity-0")} />
                              <span>{getEventLabel(evt)}</span>
                              <span className="ml-auto text-[10px] text-muted-foreground font-mono">{evt}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Delay de envio</Label>
                  <Switch
                    checked={form.delay_enabled}
                    onCheckedChange={(checked) => {
                      setForm((f) => ({
                        ...f,
                        delay_enabled: checked,
                        delay_minutes: checked && f.delay_minutes === 0 ? 5 : f.delay_minutes,
                      }));
                    }}
                  />
                </div>
                {form.delay_enabled && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Enviar após:</p>
                    <div className="flex flex-wrap gap-2">
                      {DELAY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, delay_minutes: opt.value }))}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            form.delay_minutes === opt.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
          {templates.map((tpl) => {
            const isActive = tpl.is_active ?? true;
            return (
              <div
                key={tpl.id}
                className={cn(
                  "rounded-xl border border-border bg-card p-4 space-y-3 transition-opacity",
                  !isActive && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold truncate">{tpl.name}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isActive && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                        Pausado
                      </Badge>
                    )}
                    {tpl.delay_enabled && tpl.delay_minutes && tpl.delay_minutes > 0 && (
                      <Badge variant="outline" className="text-[10px] gap-0.5">
                        <Timer className="h-3 w-3" />
                        {formatDelay(tpl.delay_minutes)}
                      </Badge>
                    )}
                    {triggerBadge(tpl.event_trigger)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{tpl.content}</p>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => openEdit(tpl)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => handleTestSend(tpl)}
                    disabled={testingId === tpl.id}
                    title="Enviar teste"
                  >
                    {testingId === tpl.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "gap-1.5 text-xs",
                      isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"
                    )}
                    onClick={() => handleToggleActive(tpl)}
                    disabled={togglingId === tpl.id}
                    title={isActive ? "Pausar" : "Ativar"}
                  >
                    {togglingId === tpl.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isActive ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(tpl.id)}
                  >
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
