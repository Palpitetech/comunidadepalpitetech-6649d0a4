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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Pencil, Trash2, FileText, ChevronsUpDown, Check, Send, Pause, Play, Timer, Filter, Repeat, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplateSegmentationSection } from "./TemplateSegmentationSection";
import { VariantSlotSelector, type VariantSlot } from "./VariantSlotSelector";
import { getEventLabel } from "@/lib/whatsapp-event-labels";
import type { MessageTemplateVariant } from "@/types/whatsapp";
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";

const MAX_SLOTS = 10;

function buildEmptySlots(mainContent = ""): VariantSlot[] {
  return Array.from({ length: MAX_SLOTS }, (_, i) => ({
    position: i + 1,
    content: i === 0 ? mainContent : "",
    isActive: true,
    timesUsed: 0,
    exists: i === 0,
  }));
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  event_trigger: string;
  category: "transactional" | "marketing";
  created_at: string;
  is_active?: boolean;
  delay_enabled?: boolean;
  delay_minutes?: number;
  include_tags?: string[];
  exclude_tags?: string[];
  exclude_tags_recent?: string[];
  exclude_recent_window_hours?: number;
  plan_ids?: string[];
  tags_match_mode?: string;
}

interface PlanOption {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  content: string;
  event_trigger: string;
  category: "transactional" | "marketing";
  delay_enabled: boolean;
  delay_minutes: number;
  include_tags: string[];
  exclude_tags: string[];
  exclude_tags_recent: string[];
  exclude_recent_window_hours: number;
  plan_ids: string[];
  tags_match_mode: "any" | "all";
}

const emptyForm: FormData = {
  name: "", content: "", event_trigger: "manual",
  category: "marketing",
  delay_enabled: false, delay_minutes: 0,
  include_tags: [], exclude_tags: [],
  exclude_tags_recent: [], exclude_recent_window_hours: 24,
  plan_ids: [], tags_match_mode: "any",
};

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

// Event labels: usar helper compartilhado em src/lib/whatsapp-event-labels.ts

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
  const [allTags, setAllTags] = useState<string[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [variantCounts, setVariantCounts] = useState<Record<string, number>>({});
  const [slots, setSlots] = useState<VariantSlot[]>(() => buildEmptySlots());
  const [activeSlot, setActiveSlot] = useState<number>(1);
  // Track ids of variants loaded from DB (position -> id) so we can update/delete on save
  const [variantIds, setVariantIds] = useState<Record<number, string>>({});
  // Track positions removed during the current edit session (to delete on save)
  const [removedPositions, setRemovedPositions] = useState<number[]>([]);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const mainHasContent = (slots[0]?.content ?? "").trim().length > 0;

  const fetchVariantCounts = useCallback(async () => {
    const { data, error } = await supabase
      .from("message_template_variants" as any)
      .select("template_id");
    if (error) {
      console.error(error);
      return;
    }
    const counts: Record<string, number> = {};
    ((data as any[]) || []).forEach((v: any) => {
      counts[v.template_id] = (counts[v.template_id] ?? 0) + 1;
    });
    setVariantCounts(counts);
  }, []);

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

  const fetchTagsAndPlans = useCallback(async () => {
    const [tagsRes, plansRes] = await Promise.all([
      supabase.rpc("get_distinct_tags" as any),
      supabase.from("plans").select("id, name").eq("is_active", true).order("display_order"),
    ]);

    if (tagsRes.error) {
      const { data } = await supabase.from("perfis").select("tags");
      if (data) {
        const set = new Set<string>();
        data.forEach((p: any) => (p.tags || []).forEach((t: string) => set.add(t)));
        setAllTags([...set].sort());
      }
    } else {
      setAllTags(((tagsRes.data as any[]) || []).map((r: any) => r.tag || r).sort());
    }

    setPlans((plansRes.data as any[]) || []);
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchEventTypes();
    fetchTagsAndPlans();
    fetchVariantCounts();
  }, [fetchTemplates, fetchEventTypes, fetchTagsAndPlans, fetchVariantCounts]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSlots(buildEmptySlots(""));
    setVariantIds({});
    setRemovedPositions([]);
    setActiveSlot(1);
    setHasGenerated(false);
    setDialogOpen(true);
  };

  const openEdit = async (t: MessageTemplate) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      content: t.content,
      event_trigger: t.event_trigger,
      category: t.category ?? "marketing",
      delay_enabled: t.delay_enabled ?? false,
      delay_minutes: t.delay_minutes ?? 0,
      include_tags: t.include_tags ?? [],
      exclude_tags: t.exclude_tags ?? [],
      exclude_tags_recent: t.exclude_tags_recent ?? [],
      exclude_recent_window_hours: t.exclude_recent_window_hours ?? 24,
      plan_ids: t.plan_ids ?? [],
      tags_match_mode: (t.tags_match_mode as "any" | "all") ?? "any",
    });

    const baseSlots = buildEmptySlots(t.content);
    const ids: Record<number, string> = {};
    const { data, error } = await supabase
      .from("message_template_variants" as any)
      .select("*")
      .eq("template_id", t.id)
      .order("position", { ascending: true });
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar variações");
    } else {
      ((data as any[]) || []).forEach((v: MessageTemplateVariant) => {
        const idx = v.position - 1;
        if (idx >= 0 && idx < MAX_SLOTS) {
          baseSlots[idx] = {
            position: v.position,
            content: v.content,
            isActive: v.is_active,
            timesUsed: v.times_used,
            exists: true,
          };
          ids[v.position] = v.id;
        }
      });
    }
    setSlots(baseSlots);
    setVariantIds(ids);
    setRemovedPositions([]);
    setActiveSlot(1);
    // Considera "já gerou" se há ao menos 1 variante (slot 2-10) já preenchida
    setHasGenerated(baseSlots.slice(1).some((s) => s.exists && s.content.trim().length > 0));
    setDialogOpen(true);
  };

  const insertVariable = (variable: string) => {
    const ta = textareaRef.current;
    const current = slots[activeSlot - 1]?.content ?? "";
    if (!ta) {
      updateActiveSlotContent(current + variable);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newContent = current.slice(0, start) + variable + current.slice(end);
    updateActiveSlotContent(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + variable.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleSave = async () => {
    const mainContent = slots[0]?.content?.trim() ?? "";
    if (!form.name.trim() || !mainContent || !form.event_trigger) {
      toast.error("Preencha nome, evento e a mensagem principal (slot 1)");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        content: mainContent,
        event_trigger: form.event_trigger,
        category: form.category,
        delay_enabled: form.delay_enabled,
        delay_minutes: form.delay_enabled ? form.delay_minutes : 0,
        include_tags: form.category === "marketing" ? form.include_tags : [],
        exclude_tags: form.category === "marketing" ? form.exclude_tags : [],
        exclude_tags_recent: form.category === "marketing" ? form.exclude_tags_recent : [],
        exclude_recent_window_hours: form.exclude_recent_window_hours,
        plan_ids: form.plan_ids,
        tags_match_mode: form.tags_match_mode,
      };

      let templateId = editingId;
      if (editingId) {
        const { error } = await supabase.from("message_templates" as any).update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("message_templates" as any)
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        templateId = (data as any).id;
      }

      // Sync variants (slots 2..10)
      if (templateId) {
        const variantOps: Array<PromiseLike<{ error: any }>> = [];
        for (let i = 1; i < MAX_SLOTS; i++) {
          const slot = slots[i];
          const existingId = variantIds[slot.position];
          const trimmed = slot.content.trim();
          if (existingId && trimmed) {
            variantOps.push(
              supabase
                .from("message_template_variants" as any)
                .update({ content: trimmed, is_active: slot.isActive })
                .eq("id", existingId) as unknown as PromiseLike<{ error: any }>
            );
          } else if (existingId && !trimmed) {
            variantOps.push(
              supabase.from("message_template_variants" as any).delete().eq("id", existingId) as unknown as PromiseLike<{ error: any }>
            );
          } else if (!existingId && trimmed) {
            variantOps.push(
              supabase.from("message_template_variants" as any).insert({
                template_id: templateId,
                position: slot.position,
                content: trimmed,
                is_active: slot.isActive,
              }) as unknown as PromiseLike<{ error: any }>
            );
          }
        }
        // Explicit deletions queued via "excluir variação" button
        for (const pos of removedPositions) {
          const id = variantIds[pos];
          if (id) {
            variantOps.push(
              supabase.from("message_template_variants" as any).delete().eq("id", id) as unknown as PromiseLike<{ error: any }>
            );
          }
        }
        const results = await Promise.all(variantOps);
        const firstError = results.find((r) => r?.error);
        if (firstError?.error) throw firstError.error;
      }

      toast.success(editingId ? "Template atualizado" : "Template criado");
      setDialogOpen(false);
      fetchTemplates();
      fetchVariantCounts();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar template");
    } finally {
      setSaving(false);
    }
  };

  // Update content of the currently active slot
  const updateActiveSlotContent = (value: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.position === activeSlot ? { ...s, content: value, exists: s.position === 1 ? true : value.length > 0 || s.exists } : s
      )
    );
  };

  const handleSlotSelect = (position: number) => {
    setSlots((prev) =>
      prev.map((s) => (s.position === position && !s.exists && position !== 1 ? { ...s, exists: true } : s))
    );
    setActiveSlot(position);
  };

  const toggleActiveSlotPaused = () => {
    if (activeSlot === 1) return;
    setSlots((prev) => prev.map((s) => (s.position === activeSlot ? { ...s, isActive: !s.isActive } : s)));
  };

  const deleteActiveSlot = () => {
    if (activeSlot === 1) return;
    const pos = activeSlot;
    setSlots((prev) =>
      prev.map((s) => (s.position === pos ? { ...s, content: "", isActive: true, exists: false, timesUsed: 0 } : s))
    );
    if (variantIds[pos]) {
      setRemovedPositions((prev) => (prev.includes(pos) ? prev : [...prev, pos]));
    }
    setActiveSlot(1);
  };

  const handleGenerateVariants = async () => {
    const main = (slots[0]?.content ?? "").trim();
    if (!main) {
      toast.error("Escreva a mensagem principal (slot 1) primeiro");
      return;
    }
    const hasExisting = slots.slice(1).some((s) => s.exists && s.content.trim().length > 0);
    if (hasExisting) {
      const ok = window.confirm(
        "Substituir as 9 variações existentes? O slot #1 (principal) não muda."
      );
      if (!ok) return;
    }
    setGeneratingVariants(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-message-variants", {
        body: { main_content: main, count: 9 },
      });
      if (error) {
        // Tenta extrair mensagem amigável do contexto
        const ctx: any = (error as any).context;
        let msg = "Erro ao gerar variações";
        if (ctx?.status === 429) msg = "Muitas requisições. Aguarde alguns segundos.";
        else if (ctx?.status === 402) msg = "Créditos de IA esgotados. Adicione créditos no workspace.";
        else if (ctx?.status === 403) msg = "Apenas administradores podem gerar variações.";
        try {
          const body = await ctx?.json?.();
          if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        toast.error(msg);
        return;
      }
      const variants: string[] = Array.isArray(data?.variants) ? data.variants : [];
      if (variants.length === 0) {
        toast.error("A IA não retornou variações válidas. Tente novamente.");
        return;
      }
      setSlots((prev) =>
        prev.map((s, i) => {
          if (i === 0) return s; // mantém slot #1
          const v = variants[i - 1];
          if (!v) return s;
          return {
            ...s,
            content: v.slice(0, 2000),
            isActive: true,
            exists: true,
          };
        })
      );
      setHasGenerated(true);
      toast.success(`${variants.length} variações geradas com IA`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar variações");
    } finally {
      setGeneratingVariants(false);
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
          <DialogContent className="sm:max-w-lg max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Template" : "Novo Template"}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(85vh-80px)] pr-3">
            <div className="space-y-4 pt-2">
              <div className="flex gap-4 p-1 bg-muted/50 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: 'marketing' }))}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium rounded-md transition-all",
                    form.category === 'marketing' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Marketing
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: 'transactional' }))}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium rounded-md transition-all",
                    form.category === 'transactional' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Transacional
                </button>
              </div>

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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Conteúdo da mensagem (até 10 variações)</Label>
                  <span className="text-[10px] text-muted-foreground">
                    Variação ativa: <strong>#{activeSlot}</strong>
                    {activeSlot === 1 && " (principal)"}
                  </span>
                </div>
                <VariantSlotSelector slots={slots} activeSlot={activeSlot} onSelect={handleSlotSelect} />
                <div className="rounded-md bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground border border-border">
                  Use até 10 variações com o <strong>mesmo conteúdo</strong> escrito de formas diferentes.
                  O sistema rotaciona automaticamente para evitar bloqueio por mensagens repetidas.
                </div>
                <Textarea
                  id="tpl-content"
                  ref={textareaRef}
                  placeholder={activeSlot === 1 ? "Olá {{nome}}, tudo bem?" : "Variação alternativa..."}
                  value={slots[activeSlot - 1]?.content ?? ""}
                  onChange={(e) => updateActiveSlotContent(e.target.value)}
                  rows={5}
                  maxLength={2000}
                />
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
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
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {(slots[activeSlot - 1]?.content ?? "").length}/2000
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateVariants}
                  disabled={!mainHasContent || generatingVariants}
                  className={cn(
                    "w-full gap-1.5 transition-colors",
                    !mainHasContent && "opacity-50",
                    mainHasContent && !hasGenerated &&
                      "border-amber-500/60 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 animate-pulse",
                    hasGenerated &&
                      "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                  )}
                  title={
                    !mainHasContent
                      ? "Escreva a mensagem principal primeiro"
                      : hasGenerated
                      ? "Regenerar as 9 variações com IA"
                      : "Gerar 9 variações automáticas com IA"
                  }
                >
                  {generatingVariants ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {generatingVariants
                    ? "Gerando 9 variações..."
                    : hasGenerated
                    ? "Regenerar variações com IA"
                    : "Gerar variações com IA"}
                </Button>
                {activeSlot !== 1 && slots[activeSlot - 1]?.exists && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={toggleActiveSlotPaused}
                    >
                      {slots[activeSlot - 1]?.isActive ? (
                        <><Pause className="h-3.5 w-3.5" /> Pausar variação</>
                      ) : (
                        <><Play className="h-3.5 w-3.5" /> Ativar variação</>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs text-destructive hover:text-destructive"
                      onClick={deleteActiveSlot}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir variação
                    </Button>
                  </div>
                )}
              </div>

              <TemplateSegmentationSection
                category={form.category}
                allTags={allTags}
                includeTags={form.include_tags}
                excludeTags={form.exclude_tags}
                excludeTagsRecent={form.exclude_tags_recent}
                excludeRecentWindowHours={form.exclude_recent_window_hours}
                tagsMatchMode={form.tags_match_mode}
                planIds={form.plan_ids}
                plans={plans}
                onIncludeTagsChange={(tags) => setForm((f) => ({ ...f, include_tags: tags }))}
                onExcludeTagsChange={(tags) => setForm((f) => ({ ...f, exclude_tags: tags }))}
                onExcludeTagsRecentChange={(tags) => setForm((f) => ({ ...f, exclude_tags_recent: tags }))}
                onExcludeRecentWindowHoursChange={(hours) => setForm((f) => ({ ...f, exclude_recent_window_hours: hours }))}
                onTagsMatchModeChange={(mode) => setForm((f) => ({ ...f, tags_match_mode: mode }))}
                onPlanIdsChange={(ids) => setForm((f) => ({ ...f, plan_ids: ids }))}
              />

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingId ? "Salvar Alterações" : "Criar Template"}
              </Button>
            </div>
            </ScrollArea>
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
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge 
                    variant={tpl.category === 'transactional' ? "default" : "secondary"} 
                    className={cn(
                      "text-[9px] uppercase tracking-wider py-0 px-1.5 h-4",
                      tpl.category === 'transactional' 
                        ? "bg-emerald-500 hover:bg-emerald-600 border-none text-white" 
                        : "bg-blue-500 hover:bg-blue-600 border-none text-white"
                    )}
                  >
                    {tpl.category === 'transactional' ? 'Transacional' : 'Marketing'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{tpl.content}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {tpl.category === 'marketing' && ((tpl.include_tags && tpl.include_tags.length > 0) || (tpl.exclude_tags && tpl.exclude_tags.length > 0)) && (
                    <div className="flex items-center gap-1">
                      <Filter className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Segmentado</span>
                    </div>
                  )}
                  {tpl.plan_ids && tpl.plan_ids.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{tpl.plan_ids.length} plano(s)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Repeat className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {(variantCounts[tpl.id] ?? 0) + 1}/10 variantes
                    </span>
                  </div>
                </div>
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
