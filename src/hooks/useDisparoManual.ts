import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TemplateOption {
  id: string;
  name: string;
  content: string;
}

export interface PlanOption {
  id: string;
  name: string;
  slug: string;
}

const VARIABLES = ["{{nome}}", "{{telefone}}", "{{email}}", "{{produto}}", "{{plano_nome}}"];

export function useDisparoManual() {
  // ── Tags state ──
  const [allTags, setAllTags] = useState<string[]>([]);
  const [includeTags, setIncludeTags] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const [exactMatch, setExactMatch] = useState(false);

  // ── Advanced filters ──
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedVerification, setSelectedVerification] = useState<"all" | "verified" | "unverified">("all");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");

  // ── Contact count ──
  const [contactCount, setContactCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  // ── Message state ──
  const [messageMode, setMessageMode] = useState<"template" | "livre">("template");
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [freeMessage, setFreeMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Dispatch state ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  // ── Load initial data ──
  useEffect(() => {
    const loadInitial = async () => {
      const [tagsRes, tplRes, plansRes, eventsRes] = await Promise.all([
        supabase.rpc("get_distinct_tags" as any),
        supabase.from("message_templates").select("id, name, content").order("name"),
        supabase.from("plans").select("id, name, slug").eq("is_active", true).order("display_order"),
        supabase.from("events").select("event_type").limit(1000),
      ]);

      // Tags
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

      setTemplates((tplRes.data as any[]) || []);
      setPlans((plansRes.data as any[]) || []);

      // Distinct event types
      if (eventsRes.data) {
        const uniqueEvents = [...new Set((eventsRes.data as any[]).map((e: any) => e.event_type))].sort();
        setEventTypes(uniqueEvents);
      }
    };
    loadInitial();
  }, []);

  // ── Build query helper ──
  const buildProfileQuery = useCallback((selectFields: string, countOnly: boolean) => {
    let query = countOnly
      ? supabase.from("perfis").select(selectFields, { count: "exact", head: true })
      : supabase.from("perfis").select(selectFields);

    query = query.eq("is_bot", false).not("celular", "is", null).neq("celular", "");

    if (includeTags.length > 0) {
      if (exactMatch) {
        query = query.contains("tags", includeTags);
      } else {
        query = query.overlaps("tags", includeTags);
      }
    }

    if (excludeTags.length > 0) {
      for (const tag of excludeTags) {
        query = query.not("tags", "cs", `{${tag}}`);
      }
    }

    if (selectedPlanIds.length > 0) {
      query = query.in("plan_id", selectedPlanIds);
    }

    if (selectedStatus) {
      query = query.eq("status_assinatura", selectedStatus);
    }

    if (selectedVerification === "verified") {
      query = query.eq("email_verificado", true);
    } else if (selectedVerification === "unverified") {
      query = query.or("email_verificado.is.null,email_verificado.eq.false");
    }

    return query;
  }, [includeTags, excludeTags, exactMatch, selectedPlanIds, selectedStatus, selectedVerification]);

  // ── Count contacts ──
  const fetchCount = useCallback(async () => {
    setCountLoading(true);
    try {
      if (selectedEvent) {
        // Need to get user_ids from events first, then count matching perfis
        const { data: eventUsers } = await supabase
          .from("events")
          .select("user_id")
          .eq("event_type", selectedEvent);

        if (!eventUsers || eventUsers.length === 0) {
          setContactCount(0);
          return;
        }

        const userIds = [...new Set((eventUsers as any[]).map((e: any) => e.user_id))];
        let query = buildProfileQuery("id", true);
        query = query.in("id", userIds);
        const { count, error } = await query;
        if (error) throw error;
        setContactCount(count ?? 0);
      } else {
        const query = buildProfileQuery("id", true);
        const { count, error } = await query;
        if (error) throw error;
        setContactCount(count ?? 0);
      }
    } catch (err) {
      console.error(err);
      setContactCount(null);
    } finally {
      setCountLoading(false);
    }
  }, [buildProfileQuery, selectedEvent]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // ── Helpers ──
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const toggleTag = (tag: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  const insertVariable = (variable: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setFreeMessage((m) => m + variable);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newContent = freeMessage.slice(0, start) + variable + freeMessage.slice(end);
    setFreeMessage(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + variable.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const canDispatch =
    (contactCount ?? 0) > 0 &&
    (messageMode === "template" ? !!selectedTemplateId : freeMessage.trim().length > 0);

  // ── Active filters summary ──
  const activeFilters: string[] = [];
  if (includeTags.length > 0) activeFilters.push(`Tags: ${includeTags.join(", ")}`);
  if (excludeTags.length > 0) activeFilters.push(`Excluindo: ${excludeTags.join(", ")}`);
  if (selectedPlanIds.length > 0) {
    const planNames = selectedPlanIds.map((id) => plans.find((p) => p.id === id)?.name || id);
    activeFilters.push(`Plano: ${planNames.join(", ")}`);
  }
  if (selectedStatus) activeFilters.push(`Status: ${selectedStatus}`);
  if (selectedVerification === "verified") activeFilters.push("Apenas verificados");
  if (selectedVerification === "unverified") activeFilters.push("Apenas não verificados");
  if (selectedEvent) activeFilters.push(`Evento: ${selectedEvent}`);

  // ── Dispatch logic ──
  const handleDispatch = async () => {
    setConfirmOpen(false);
    setDispatching(true);
    try {
      let profileIds: string[] | null = null;

      // If event filter, pre-fetch user_ids
      if (selectedEvent) {
        const { data: eventUsers } = await supabase
          .from("events")
          .select("user_id")
          .eq("event_type", selectedEvent);

        if (!eventUsers || eventUsers.length === 0) {
          toast.error("Nenhum contato encontrado");
          return;
        }
        profileIds = [...new Set((eventUsers as any[]).map((e: any) => e.user_id))];
      }

      let query = buildProfileQuery("id, nome, celular, email, plan_id", false);
      if (profileIds) {
        query = query.in("id", profileIds);
      }

      const { data: profiles, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      if (!profiles || profiles.length === 0) {
        toast.error("Nenhum contato encontrado");
        return;
      }

      // Build plan name map for {{produto}} variable
      const planMap = new Map(plans.map((p) => [p.id, p.name]));

      const now = new Date().toISOString();
      const rows = (profiles as any[]).map((p: any) => {
        const planName = p.plan_id ? planMap.get(p.plan_id) || "" : "";
        const variables: Record<string, string> = {
          nome: p.nome || "",
          telefone: p.celular || "",
          email: p.email || "",
          produto: planName,
          plano_nome: planName,
        };

        if (messageMode === "livre") {
          variables.mensagem_livre = freeMessage.trim();
        }

        return {
          recipient_phone: p.celular,
          recipient_name: p.nome || "",
          template_id: messageMode === "template" ? selectedTemplateId : null,
          variables,
          status: "pending",
          scheduled_at: now,
          priority: 0, // Manual bulk = lowest priority
        };
      });

      const batchSize = 500;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from("message_queue" as any).insert(batch);
        if (error) throw error;
      }

      toast.success(`${rows.length} mensagens adicionadas à fila!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao disparar mensagens");
    } finally {
      setDispatching(false);
    }
  };

  return {
    // Tags
    allTags,
    includeTags,
    setIncludeTags,
    excludeTags,
    setExcludeTags,
    exactMatch,
    setExactMatch,
    toggleTag,

    // Advanced filters
    plans,
    selectedPlanIds,
    setSelectedPlanIds,
    selectedStatus,
    setSelectedStatus,
    selectedVerification,
    setSelectedVerification,
    eventTypes,
    selectedEvent,
    setSelectedEvent,

    // Contact count
    contactCount,
    countLoading,

    // Message
    messageMode,
    setMessageMode,
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    selectedTemplate,
    freeMessage,
    setFreeMessage,
    textareaRef,
    insertVariable,
    VARIABLES,

    // Dispatch
    confirmOpen,
    setConfirmOpen,
    dispatching,
    canDispatch,
    handleDispatch,

    // Summary
    activeFilters,
  };
}
