import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Loader2, Plus, Pencil, Trash2, FileText, ChevronsUpDown, Check, 
  Send, Pause, Play, Timer, Filter, Repeat, Sparkles, RefreshCw,
  X, Copy, User, Mail, Globe, Hash, Phone, MessageSquare, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TemplateSegmentationSection } from "./TemplateSegmentationSection";
import { VariantSlotSelector, type VariantSlot } from "./VariantSlotSelector";
import { getEventLabel } from "@/lib/whatsapp-event-labels";
import type { MessageTemplateVariant } from "@/types/whatsapp";
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";
import { AdminListContainer, AdminListItem } from "../AdminListComponents";
import { MobileInfoRow } from "./shared/MobileInfoRow";

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
  type: "single" | "sequence" | "random"; // Added for Phase 1
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
  type: "single" | "sequence" | "random";
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
  type: "single",
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
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
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
  const [variantIds, setVariantIds] = useState<Record<number, string>>({});
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
      type: t.type ?? "single",
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
        type: form.type,
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

  return (
    <UnifiedLayout>
      <UnifiedToolbar
        left={
          <ActionButton
            label="Novo Template"
            icon={Plus}
            onClick={openCreate}
            variant="default"
          />
        }
        right={
          <ActionButton
            label="Atualizar"
            icon={RefreshCw}
            onClick={fetchTemplates}
          />
        }
      />

      <UnifiedList
        isLoading={loading}
        count={templates.length}
        empty={{
          icon: FileText,
          message: "Nenhum template encontrado",
          submessage: "Crie templates para automatizar suas mensagens"
        }}
      >
        {/* Desktop View */}
        <div className="hidden md:grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <UnifiedCardItem
              key={t.id}
              className={cn(
                "space-y-3",
                !(t.is_active ?? true) && "opacity-60 bg-muted/20"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold truncate">{t.name}</h3>
                </div>
                <Badge variant={(t.is_active ?? true) ? "default" : "secondary"} className="text-[10px]">
                  {(t.is_active ?? true) ? "Ativo" : "Pausado"}
                </Badge>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Repeat className="h-3 w-3" />
                  <span>Gatilho: {getEventLabel(t.event_trigger)}</span>
                </div>
                <p className="line-clamp-2 italic">"{t.content}"</p>
              </div>

              <div className="flex items-center gap-1 pt-2 border-t border-border">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(t)} disabled={!!togglingId}>
                        {(t.is_active ?? true) ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{(t.is_active ?? true) ? "Pausar" : "Ativar"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex-1" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TooltipProvider>
              </div>
            </UnifiedCardItem>
          ))}
        </div>

        {/* Mobile View - Eventos Style */}
        <div className="md:hidden border-t border-border/40">
          <AdminListContainer loading={loading && templates.length === 0}>
            {templates.map((t) => (
              <AdminListItem
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                title={t.name}
                badge={{
                  text: (t.is_active ?? true) ? "Ativo" : "Pausado",
                  color: (t.is_active ?? true) ? "bg-green-500/10 text-green-700 border-green-200/50" : "bg-muted/50 text-muted-foreground border-border/50",
                  icon: (t.is_active ?? true) ? Play : Pause
                }}
                subtitle={`${getEventLabel(t.event_trigger)} • ${t.content.slice(0, 40)}${t.content.length > 40 ? "..." : ""}`}
                timestamp={format(new Date(t.created_at), "HH:mm", { locale: ptBR })}
              />
            ))}
          </AdminListContainer>
        </div>
      </UnifiedList>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(85vh-80px)] pr-3">
            <div className="space-y-4 pt-2">
              <div className="space-y-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex gap-2 p-1 bg-background rounded-md border border-border">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: 'marketing' }))}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] font-semibold rounded transition-all",
                      form.category === 'marketing'
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Marketing
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: 'transactional' }))}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] font-semibold rounded transition-all",
                      form.category === 'transactional'
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Transacional
                  </button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Modo de Disparo</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'single', label: 'Único', icon: MessageSquare },
                      { id: 'sequence', label: 'Sequência', icon: Timer },
                      { id: 'random', label: 'Random', icon: Sparkles }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, type: mode.id as any }))}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 p-2 rounded-md border transition-all",
                          form.type === mode.id 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-background border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        <mode.icon className="h-4 w-4" />
                        <span className="text-[10px] font-bold">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight px-1">
                    {form.type === 'single' && "Envia apenas a mensagem principal do Slot 1."}
                    {form.type === 'sequence' && "Envia as variações em ordem (1, 2, 3...) para cada novo contato."}
                    {form.type === 'random' && "Escolhe uma variação ativa aleatoriamente para cada envio."}
                  </p>
                </div>
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
                    <Button variant="outline" className="w-full justify-between font-normal">
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

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-sm font-bold">Conteúdo do Slot #{activeSlot}</Label>
                  <div className="flex gap-1">
                    {activeSlot > 1 && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={deleteActiveSlot}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-muted/20 rounded-lg p-2 border border-border/50">
                  <VariantSlotSelector slots={slots} activeSlot={activeSlot} onSelect={handleSlotSelect} />
                </div>

                <div className="relative group">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Olá {{nome}}, tudo bem?"
                    value={slots[activeSlot - 1]?.content ?? ""}
                    onChange={(e) => updateActiveSlotContent(e.target.value)}
                    className="min-h-[160px] text-sm resize-none pr-10 focus-visible:ring-1"
                  />
                  <div className="absolute right-2 top-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/80 shadow-sm" onClick={() => updateActiveSlotContent("")}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Limpar texto</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {VARIABLES.map((v) => (
                    <Button
                      key={v}
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[10px] font-bold border-dashed hover:border-primary hover:text-primary transition-colors"
                      onClick={() => insertVariable(v)}
                    >
                      {v}
                    </Button>
                  ))}
                </div>

                <div className="pt-2">
                  <Button
                    variant="secondary"
                    className="w-full h-9 text-xs font-bold gap-2 bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10"
                    onClick={handleGenerateVariants}
                    disabled={generatingVariants || !mainHasContent}
                  >
                    {generatingVariants ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {hasGenerated ? "Regerar Variações com IA" : "Gerar 9 Variações com IA"}
                  </Button>
                  {!mainHasContent && (
                    <p className="text-[10px] text-center text-muted-foreground mt-1.5">
                      Preencha o Slot #1 primeiro para usar IA
                    </p>
                  )}
                </div>
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
                onIncludeTagsChange={(tags) => setForm(f => ({ ...f, include_tags: tags }))}
                onExcludeTagsChange={(tags) => setForm(f => ({ ...f, exclude_tags: tags }))}
                onExcludeTagsRecentChange={(tags) => setForm(f => ({ ...f, exclude_tags_recent: tags }))}
                onExcludeRecentWindowHoursChange={(hours) => setForm(f => ({ ...f, exclude_recent_window_hours: hours }))}
                onTagsMatchModeChange={(mode) => setForm(f => ({ ...f, tags_match_mode: mode }))}
                onPlanIdsChange={(ids) => setForm(f => ({ ...f, plan_ids: ids }))}
              />

              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold">Delay de Envio</Label>
                    <p className="text-[10px] text-muted-foreground">Aguardar antes de disparar</p>
                  </div>
                  <Switch
                    checked={form.delay_enabled}
                    onCheckedChange={(v) => setForm(f => ({ ...f, delay_enabled: v }))}
                  />
                </div>

                {form.delay_enabled && (
                  <div className="grid grid-cols-5 gap-1.5 px-1">
                    {DELAY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, delay_minutes: opt.value }))}
                        className={cn(
                          "py-1.5 text-[10px] font-bold rounded-md border transition-all",
                          form.delay_minutes === opt.value
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-background border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {/* Mobile Detail View */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-white shrink-0 z-50 relative">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedTemplate(null)}
              className="text-gray-500 hover:bg-transparent p-0"
            >
              <X size={24} strokeWidth={1.5} />
            </Button>
            <h2 className="text-base font-bold absolute left-1/2 -translate-x-1/2">Detalhes do Template</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-500 hover:bg-transparent p-0"
              onClick={() => fetchTemplates()}
            >
              <RefreshCw size={22} strokeWidth={1.5} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
            <div className="flex flex-col min-h-full">
              <div className="p-4 space-y-6 pb-[calc(4rem+env(safe-area-inset-bottom))]">
                {/* Status Card */}
                <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4 border border-gray-100/50">
                  <div className={cn(
                    "p-3 rounded-2xl shrink-0 flex items-center justify-center relative",
                    (selectedTemplate.is_active ?? true) ? "bg-green-500/10" : "bg-gray-100"
                  )}>
                    <FileText size={28} className={cn((selectedTemplate.is_active ?? true) ? "text-green-600" : "text-gray-400")} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5 font-medium">
                      {format(new Date(selectedTemplate.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <Badge variant={(selectedTemplate.is_active ?? true) ? "default" : "secondary"} className="mt-2">
                      {(selectedTemplate.is_active ?? true) ? "Ativo" : "Pausado"}
                    </Badge>
                  </div>
                </div>

                {/* Identification */}
                <div className="space-y-5 px-1">
                  <MobileInfoRow 
                    icon={Repeat} 
                    label="Gatilho / Evento" 
                    value={getEventLabel(selectedTemplate.event_trigger)} 
                    copyable
                  />
                  <MobileInfoRow 
                    icon={Info} 
                    label="Categoria" 
                    value={selectedTemplate.category === "marketing" ? "Marketing" : "Transacional"} 
                  />
                  <MobileInfoRow 
                    icon={Timer} 
                    label="Delay" 
                    value={selectedTemplate.delay_enabled ? `${selectedTemplate.delay_minutes} minutos` : "Desativado"} 
                  />
                  <MobileInfoRow 
                    icon={Hash} 
                    label="ID do Template" 
                    value={selectedTemplate.id} 
                    copyable 
                  />
                </div>

                {/* Content */}
                <div className="space-y-3 px-1 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-600">Conteúdo da Mensagem</h4>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-7 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-bold rounded-lg px-3"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTemplate.content);
                        toast.success("Conteúdo copiado!");
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-[18px] p-4 border border-gray-100 shadow-inner">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap italic">
                      "{selectedTemplate.content}"
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-3">
                  <Button 
                    variant="default"
                    className="w-full h-14 bg-primary hover:bg-primary/90 rounded-[18px] text-lg font-bold gap-3"
                    onClick={() => handleTestSend(selectedTemplate)}
                    disabled={!!testingId}
                  >
                    {testingId === selectedTemplate.id ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                    Testar Mensagem
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-14 border-primary/20 text-primary hover:bg-primary/5 rounded-[18px] text-lg font-bold gap-3"
                    onClick={() => {
                      setSelectedTemplate(null);
                      openEdit(selectedTemplate);
                    }}
                  >
                    <Pencil size={24} />
                    Editar Template
                  </Button>
                  <Button 
                    variant="outline"
                    className={cn(
                      "w-full h-14 border-border rounded-[18px] text-lg font-bold gap-3",
                      (selectedTemplate.is_active ?? true) ? "text-amber-600 border-amber-100 hover:bg-amber-50" : "text-green-600 border-green-100 hover:bg-green-50"
                    )}
                    onClick={() => handleToggleActive(selectedTemplate)}
                    disabled={!!togglingId}
                  >
                    {(selectedTemplate.is_active ?? true) ? <Pause size={24} /> : <Play size={24} />}
                    {(selectedTemplate.is_active ?? true) ? "Pausar Template" : "Ativar Template"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sheet View (Reusing the same logic for consistency) */}
      <Sheet open={!!selectedTemplate && window.innerWidth >= 768} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <SheetContent 
          side="right" 
          className="p-0 flex flex-col border-l border-border bg-white w-full md:max-w-lg outline-none focus:ring-0 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white shrink-0 z-50">
            <SheetTitle className="text-base font-semibold">Detalhes do Template</SheetTitle>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setSelectedTemplate(null)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="flex-1 bg-white">
            {selectedTemplate && (
              <div className="p-4 space-y-6 pb-20">
                {/* Status Card */}
                <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4 border border-gray-100/50">
                  <div className={cn(
                    "p-3 rounded-2xl shrink-0 flex items-center justify-center",
                    (selectedTemplate.is_active ?? true) ? "bg-green-500/10" : "bg-gray-100"
                  )}>
                    <FileText size={28} className={cn((selectedTemplate.is_active ?? true) ? "text-green-600" : "text-gray-400")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{selectedTemplate.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 font-medium">
                      {format(new Date(selectedTemplate.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <MobileInfoRow icon={Repeat} label="Gatilho" value={getEventLabel(selectedTemplate.event_trigger)} copyable />
                  <MobileInfoRow icon={Info} label="Categoria" value={selectedTemplate.category} />
                  <MobileInfoRow icon={Timer} label="Delay" value={selectedTemplate.delay_enabled ? `${selectedTemplate.delay_minutes} min` : "Não"} />
                  <MobileInfoRow icon={Hash} label="ID" value={selectedTemplate.id} copyable />
                </div>

                <div className="bg-gray-50 rounded-[18px] p-5 border border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap italic">
                    "{selectedTemplate.content}"
                  </p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button 
                    variant="default" 
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold" 
                    onClick={() => handleTestSend(selectedTemplate)}
                    disabled={!!testingId}
                  >
                    {testingId === selectedTemplate.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Testar Mensagem
                  </Button>
                  <div className="flex gap-3">
                    <Button className="flex-1 h-12 rounded-xl" onClick={() => { setSelectedTemplate(null); openEdit(selectedTemplate); }}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => handleToggleActive(selectedTemplate)}>
                      {(selectedTemplate.is_active ?? true) ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {(selectedTemplate.is_active ?? true) ? "Pausar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </UnifiedLayout>
  );
}
