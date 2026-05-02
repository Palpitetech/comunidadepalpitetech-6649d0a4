import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Search, Loader2, Users, UserCheck, ChevronRight, ChevronLeft, X, 
  ArrowLeft, Timer, CheckCircle2, AlertCircle, Circle, Inbox, 
  Globe, Columns3, RefreshCw, Filter, Shield, User as UserIcon
} from "lucide-react";
import { toast } from "sonner";
import { UserDetailSheet } from "@/components/admin/UserDetailSheet";
import { LeadDetailSheet, type LeadInbox } from "@/components/admin/LeadDetailSheet";
import { TagFilterPopover } from "@/components/admin/TagFilterPopover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";


import type { Plan, PlanFeatures, ExtendedProfile } from "@/types/plans";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminHeader, AdminListContainer, AdminListItem, AdminPagination } from "@/components/admin/AdminListComponents";


const getValidadeInfo = (validade: string | null | undefined) => {
  if (!validade) return null;
  const date = new Date(validade);
  if (isNaN(date.getTime())) return null;
  const dias = differenceInDays(date, new Date());
  const dataFormatada = format(date, "dd/MM/yyyy", { locale: ptBR });

  let label: string;
  let tone: "neutral" | "warning" | "danger";

  if (dias < 0) {
    const abs = Math.abs(dias);
    label = `Há ${abs} dia${abs !== 1 ? "s" : ""}`;
    tone = "danger";
  } else if (dias === 0) {
    label = "Hoje";
    tone = "warning";
  } else if (dias <= 7) {
    label = `Em ${dias} dia${dias !== 1 ? "s" : ""}`;
    tone = "warning";
  } else {
    label = `Em ${dias} dias`;
    tone = "neutral";
  }

  return { dataFormatada, label, tone };
};

const TONE_CLASSES: Record<"neutral" | "warning" | "danger", string> = {
  neutral: "text-muted-foreground",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
};

interface UserWithPlan extends ExtendedProfile {
  plan?: Plan | null;
}

// Slugs que contam como "plano pago ativo"
const PAID_SLUGS = new Set(["mensal", "semestral", "anual", "plano-anual-vip", "palpites-lotofacil-grupo"]);
const TRIAL_SLUG = "teste-gratis-3-dias";

const isPaidActive = (u: UserWithPlan) =>
  !!u.plan && PAID_SLUGS.has(u.plan.slug) && u.status_assinatura === "ativa";

const isTrialActive = (u: UserWithPlan) =>
  u.plan?.slug === TRIAL_SLUG && u.status_assinatura === "ativa";

type FilterPrincipal = "todos" | "pagos" | "trial" | "leads";
type FilterSecundario =
  | "nao_verificados"
  | "verificados"
  | "celular_ok"
  | "trial_ok"
  | "trial_ativo"
  | "pago_mensal"
  | "pago_anual"
  | "pago_anualvip"
  | "plano_vencido"
  | "plano_cancelado_ativo"
  | "plano_cancelado_inativo"
  | "bloqueados"
  | null;

const FILTROS_PRINCIPAIS: { key: FilterPrincipal; label: string; icon: typeof Users }[] = [
  { key: "todos", label: "Todos", icon: Users },
  { key: "pagos", label: "Pagos", icon: UserCheck },
  { key: "trial", label: "Trial", icon: Timer },
  { key: "leads", label: "Leads", icon: Inbox },
];

type SubFilterKey = Exclude<FilterSecundario, null>;
type SubFilterGroup = { label: string; items: { key: SubFilterKey; label: string }[] };

const FILTROS_SECUNDARIOS_GRUPOS: SubFilterGroup[] = [
  {
    label: "Verificação",
    items: [
      { key: "verificados", label: "Verificados" },
      { key: "nao_verificados", label: "Não Verificados" },
      { key: "celular_ok", label: "Celular OK" },
    ],
  },
  {
    label: "Plano",
    items: [
      { key: "pago_mensal", label: "Pago Mensal" },
      { key: "pago_anual", label: "Pago Anual" },
      { key: "pago_anualvip", label: "Pago Anual VIP" },
      { key: "trial_ativo", label: "Trial Ativo" },
      { key: "trial_ok", label: "Trial OK" },
    ],
  },
  {
    label: "Status",
    items: [
      { key: "plano_vencido", label: "Plano Vencido" },
      { key: "plano_cancelado_ativo", label: "Cancelado Ativo" },
      { key: "plano_cancelado_inativo", label: "Cancelado Inativo" },
      { key: "bloqueados", label: "Bloqueados" },
    ],
  },
];

// ── Lead table column config ───────────────────────────────────
type LeadColumnKey =
  | "status"
  | "nome"
  | "email"
  | "celular"
  | "origem"      // slug → utm_source fallback
  | "campanha"    // utm_campaign
  | "medium"
  | "content"
  | "term"
  | "referrer"
  | "click_ids"
  | "pagina"
  | "tags"
  | "data";

const LEAD_COLUMNS: { key: LeadColumnKey; label: string; defaultVisible: boolean }[] = [
  { key: "status",    label: "Status",    defaultVisible: true },
  { key: "nome",      label: "Nome",      defaultVisible: true },
  { key: "email",     label: "Email",     defaultVisible: true },
  { key: "celular",   label: "Celular",   defaultVisible: true },
  { key: "origem",    label: "Origem",    defaultVisible: true },
  { key: "campanha",  label: "Campanha",  defaultVisible: true },
  { key: "data",      label: "Data",      defaultVisible: true },
  { key: "medium",    label: "Medium",    defaultVisible: false },
  { key: "content",   label: "Content",   defaultVisible: false },
  { key: "term",      label: "Term",      defaultVisible: false },
  { key: "referrer",  label: "Referrer",  defaultVisible: false },
  { key: "click_ids", label: "Click IDs", defaultVisible: false },
  { key: "pagina",    label: "Página",    defaultVisible: false },
  { key: "tags",      label: "Tags",      defaultVisible: false },
];

const LEAD_COLUMNS_STORAGE_KEY = "admin_leads_columns_v1";

const loadStoredColumns = (): LeadColumnKey[] => {
  try {
    const raw = localStorage.getItem(LEAD_COLUMNS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        const valid = LEAD_COLUMNS.map((c) => c.key);
        return parsed.filter((k): k is LeadColumnKey => valid.includes(k as LeadColumnKey));
      }
    }
  } catch {/* ignore */}
  return LEAD_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
};

// Helpers de status de assinatura
const todayISO = () => new Date().toISOString().split("T")[0];

const isPlanoVencido = (u: UserWithPlan) => {
  const hoje = todayISO();
  return !!u.validade_assinatura && u.validade_assinatura < hoje && u.status_assinatura !== "cancelada";
};

const isCanceladoInativo = (u: UserWithPlan) => {
  const hoje = todayISO();
  return u.status_assinatura === "cancelada" && (!u.validade_assinatura || u.validade_assinatura < hoje);
};

const isCanceladoAtivo = (u: UserWithPlan) => {
  const hoje = todayISO();
  return u.status_assinatura === "cancelada" && !!u.validade_assinatura && u.validade_assinatura >= hoje;
};

const isTrialAtivoFull = (u: UserWithPlan) => {
  const hoje = todayISO();
  return u.plan?.slug === TRIAL_SLUG && u.status_assinatura === "ativa" && !!u.validade_assinatura && u.validade_assinatura >= hoje;
};

const isCelularOk = (u: UserWithPlan) => {
  const digits = (u.celular || "").replace(/\D/g, "");
  return digits.startsWith("55") && (digits.length === 12 || digits.length === 13);
};

export default function AdminUsuarios() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithPlan[]>([]);
  const [leads, setLeads] = useState<LeadInbox[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithPlan | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadInbox | null>(null);
  const [leadSheetOpen, setLeadSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterPrincipal>("todos");
  const [activeSubFilter, setActiveSubFilter] = useState<FilterSecundario>(null);
  const [page, setPage] = useState(0);
  const [includeTags, setIncludeTags] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const [exactMatch, setExactMatch] = useState(false);
  const [visibleLeadCols, setVisibleLeadCols] = useState<Set<LeadColumnKey>>(() => new Set(loadStoredColumns()));
  const PAGE_SIZE = 25;

  const isLeadColVisible = (key: LeadColumnKey) => visibleLeadCols.has(key);
  const toggleLeadCol = (key: LeadColumnKey) => {
    setVisibleLeadCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(LEAD_COLUMNS_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {/* ignore */}
      return next;
    });
  };

  const fetchData = async () => {
    try {
      const [
        { data: plansData, error: plansError },
        { data: usersData, error: usersError },
        { data: leadsData },
      ] = await Promise.all([
        supabase.from("plans").select("*").order("display_order"),
        supabase.from("perfis").select("*").eq("is_bot", false).order("created_at", { ascending: false }),
        supabase
          .from("leads_inbox" as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      if (plansError) throw plansError;
      if (usersError) throw usersError;

      const formattedPlans: Plan[] = (plansData || []).map((p) => ({
        ...p,
        price: Number(p.price),
        features: p.features as PlanFeatures,
      }));
      setPlans(formattedPlans);

      const usersWithPlans: UserWithPlan[] = (usersData || []).map((u) => ({
        ...u,
        custom_features: u.custom_features as PlanFeatures | null,
        plan: formattedPlans.find((p) => p.id === u.plan_id) || null,
      }));

      setUsers(usersWithPlans);
      setLeads(((leadsData as any) || []) as LeadInbox[]);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => ({
    total: users.length,
    pagos: users.filter(isPaidActive).length,
    trial: users.filter(isTrialActive).length,
    leads: leads.length,
    nao_verificados: users.filter(u => !u.email_verificado).length,
    verificados: users.filter(u => !!u.email_verificado).length,
    celular_ok: users.filter(isCelularOk).length,
    trial_ok: users.filter(u => !!u.trial_used).length,
    trial_ativo: users.filter(isTrialAtivoFull).length,
    pago_mensal: users.filter(u => u.plan?.slug === "mensal" && u.status_assinatura === "ativa").length,
    pago_anual: users.filter(u => u.plan?.slug === "anual" && u.status_assinatura === "ativa").length,
    pago_anualvip: users.filter(u => u.plan?.slug === "plano-anual-vip" && u.status_assinatura === "ativa").length,
    plano_vencido: users.filter(isPlanoVencido).length,
    plano_cancelado_ativo: users.filter(isCanceladoAtivo).length,
    plano_cancelado_inativo: users.filter(isCanceladoInativo).length,
    bloqueados: users.filter(u => u.is_blocked).length,
  }), [users, leads]);

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads;
    const s = searchTerm.toLowerCase();
    return leads.filter((l) =>
      l.nome?.toLowerCase().includes(s) ||
      l.email?.toLowerCase().includes(s) ||
      l.celular?.includes(s) ||
      l.slug?.toLowerCase().includes(s) ||
      l.utm_source?.toLowerCase().includes(s) ||
      l.utm_campaign?.toLowerCase().includes(s) ||
      l.tags?.some((t) => t.toLowerCase().includes(s)),
    );
  }, [leads, searchTerm]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    users.forEach(u => u.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    let list = users;

    // 1. Filtro principal
    if (activeFilter === "pagos") list = list.filter(isPaidActive);
    else if (activeFilter === "trial") list = list.filter(isTrialActive);

    // 2. Subfiltro
    if (activeSubFilter === "nao_verificados") list = list.filter(u => !u.email_verificado);
    else if (activeSubFilter === "verificados") list = list.filter(u => !!u.email_verificado);
    else if (activeSubFilter === "celular_ok") list = list.filter(isCelularOk);
    else if (activeSubFilter === "trial_ok") list = list.filter(u => !!u.trial_used);
    else if (activeSubFilter === "trial_ativo") list = list.filter(isTrialAtivoFull);
    else if (activeSubFilter === "pago_mensal") list = list.filter(u => u.plan?.slug === "mensal" && u.status_assinatura === "ativa");
    else if (activeSubFilter === "pago_anual") list = list.filter(u => u.plan?.slug === "anual" && u.status_assinatura === "ativa");
    else if (activeSubFilter === "pago_anualvip") list = list.filter(u => u.plan?.slug === "plano-anual-vip" && u.status_assinatura === "ativa");
    else if (activeSubFilter === "plano_vencido") list = list.filter(isPlanoVencido);
    else if (activeSubFilter === "plano_cancelado_ativo") list = list.filter(isCanceladoAtivo);
    else if (activeSubFilter === "plano_cancelado_inativo") list = list.filter(isCanceladoInativo);
    else if (activeSubFilter === "bloqueados") list = list.filter(u => u.is_blocked);

    // 3. Tags
    if (includeTags.length > 0) {
      list = list.filter(u => {
        const userTags = u.tags || [];
        if (exactMatch) return includeTags.every(t => userTags.includes(t));
        return includeTags.some(t => userTags.includes(t));
      });
    }
    if (excludeTags.length > 0) {
      list = list.filter(u => !excludeTags.some(t => (u.tags || []).includes(t)));
    }

    // 4. Busca
    if (!searchTerm) return list;
    const search = searchTerm.toLowerCase();
    return list.filter((user) =>
      user.nome?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.celular?.includes(search) ||
      user.tags?.some(t => t.toLowerCase().includes(search))
    );
  }, [users, activeFilter, activeSubFilter, searchTerm, includeTags, excludeTags, exactMatch]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedUser(null);
        setSelectedLead(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    
    if (selectedUser || selectedLead) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [selectedUser, selectedLead]);

  useEffect(() => { setPage(0); }, [activeFilter, activeSubFilter, searchTerm, includeTags, excludeTags, exactMatch]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleRowClick = (user: UserWithPlan) => {
    setSelectedUser(user);
    setSheetOpen(true);
  };

  const getInitials = (nome: string | null) => {
    if (!nome) return "U";
    return nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getPrincipalCount = (key: FilterPrincipal) => {
    if (key === "todos") return stats.total;
    if (key === "pagos") return stats.pagos;
    if (key === "trial") return stats.trial;
    return stats.leads;
  };

  const handleLeadClick = (lead: LeadInbox) => {
    setSelectedLead(lead);
    setLeadSheetOpen(true);
  };

  const getLeadStatusClass = (status: string) => {
    switch (status) {
      case "novo": return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case "contatado": return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "convertido": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getSubCount = (key: SubFilterKey) => stats[key];

  const toggleSubFilter = (key: SubFilterKey) => {
    setActiveSubFilter(prev => prev === key ? null : key);
  };

  const getUtmBadge = (utm: string | null | undefined) => {
    if (!utm) return null;
    const map: Record<string, { emoji: string; label: string; color: string }> = {
      bio: { emoji: "📱", label: "Bio", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
      grupo: { emoji: "👥", label: "Grupo", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
      meta: { emoji: "📣", label: "Meta", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
    };
    const entry = map[utm];
    if (entry) {
      return <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium", entry.color)}>{entry.emoji} {entry.label}</span>;
    }
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-medium">{utm}</span>;
  };

  const [filterView, setFilterView] = useState<'main' | 'subfilters' | 'tags'>('main');

  return (
    <AdminLayout pageTitle="Usuários">
      <div className="flex flex-col flex-1 min-h-0 bg-background">
        <AdminHeader 
          title=""
          search={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={fetchData}
          loading={loading}
          filters={[
            {
              label: "Filtros Avançados",
              isActive: activeSubFilter !== null || includeTags.length > 0 || excludeTags.length > 0,
              onClick: () => {},
              icon: Filter
            },
            ...FILTROS_PRINCIPAIS.map(f => ({
              label: f.label,
              isActive: activeFilter === f.key,
              onClick: () => setActiveFilter(f.key),
              icon: f.icon,
              count: getPrincipalCount(f.key)
            }))
          ]}
          customFilterContent={
            <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
              {filterView === 'main' && (
                <>
                  <DropdownMenuLabel className="flex items-center justify-between py-3 px-4">
                    <span>Filtrar usuários</span>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-[10px] uppercase font-bold text-primary" onClick={() => {
                      setActiveSubFilter(null);
                      setIncludeTags([]);
                      setExcludeTags([]);
                      fetchData();
                    }}>Resetar</Button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="m-0" />
                  <div className="p-2 space-y-1">
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); setFilterView('subfilters'); }} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <Circle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Status do Plano</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); setFilterView('tags'); }} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Filtrar por Tags</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                    </DropdownMenuItem>
                  </div>
                </>
              )}

              {filterView === 'subfilters' && (
                <div className="flex flex-col h-full bg-background">
                  <button 
                    onClick={(e) => { e.preventDefault(); setFilterView('main'); }}
                    className="flex items-center gap-2 px-4 py-3 border-b hover:bg-muted/50 transition-colors text-left w-full"
                  >
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold">Status do Plano</span>
                  </button>
                  <ScrollArea className="h-[300px]">
                    <div className="p-2 space-y-4">
                      {FILTROS_SECUNDARIOS_GRUPOS.map(grupo => (
                        <div key={grupo.label} className="space-y-1">
                          <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">{grupo.label}</p>
                          {grupo.items.map(item => (
                            <DropdownMenuCheckboxItem
                              key={item.key}
                              checked={activeSubFilter === item.key}
                              onCheckedChange={() => toggleSubFilter(item.key)}
                              className="py-2"
                              onSelect={(e) => e.preventDefault()}
                            >
                              {item.label}
                              {getSubCount(item.key) > 0 && (
                                <span className="ml-auto text-[10px] opacity-60 font-medium">{getSubCount(item.key)}</span>
                               )}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {filterView === 'tags' && (
                <div className="flex flex-col h-full bg-background">
                  <button 
                    onClick={(e) => { e.preventDefault(); setFilterView('main'); }}
                    className="flex items-center gap-2 px-4 py-3 border-b hover:bg-muted/50 transition-colors text-left w-full"
                  >
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold">Tags</span>
                  </button>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Correspondência Exata</span>
                      <Button 
                        variant={exactMatch ? "default" : "outline"} 
                        size="sm" 
                        className="h-7 text-[10px]"
                        onClick={() => setExactMatch(!exactMatch)}
                      >
                        {exactMatch ? "SIM" : "NÃO"}
                      </Button>
                    </div>
                    <ScrollArea className="h-[250px] pr-2">
                      <div className="space-y-1">
                        {allTags.map(tag => (
                          <div key={tag} className="flex items-center justify-between p-1">
                            <span className="text-xs truncate flex-1">{tag}</span>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant={includeTags.includes(tag) ? "default" : "outline"} 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => {
                                  setIncludeTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                                }}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant={excludeTags.includes(tag) ? "destructive" : "outline"} 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => {
                                  setExcludeTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </DropdownMenuContent>
          }
        />

        <div className="flex-1 overflow-auto bg-background">
          <div className="max-w-7xl mx-auto w-full">

            <AdminListContainer 
              loading={loading && users.length === 0 && leads.length === 0}
              emptyMessage={activeFilter === "leads" ? "Nenhum lead encontrado" : "Nenhum usuário encontrado"}
            >
              {activeFilter === "leads" ? (
                filteredLeads.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((lead) => (
                  <AdminListItem
                    key={lead.id}
                    onClick={() => handleLeadClick(lead)}
                    title={lead.nome || lead.email || "Lead sem nome"}
                    subtitle={`${lead.email || ""} ${lead.celular ? `• ${lead.celular}` : ""}`}
                    badge={{
                      text: lead.status || "Novo",
                      color: getLeadStatusClass(lead.status || "novo")
                    }}
                    timestamp={format(new Date(lead.created_at), "HH:mm", { locale: ptBR })}
                    rightContent={lead.slug && (
                      <span className="text-[10px] font-bold text-primary/40 uppercase tracking-tighter shrink-0">
                        {lead.slug}
                      </span>
                    )}
                  />
                ))
              ) : (
                paginatedUsers.map((user) => {
                  const validade = getValidadeInfo(user.validade_assinatura);
                  const isPaid = isPaidActive(user);
                  const isTrial = isTrialActive(user);
                  
                  return (
                    <AdminListItem
                      key={user.id}
                      onClick={() => handleRowClick(user)}
                      title={user.nome || user.email || "Usuário"}
                      subtitle={`${user.email || ""} ${user.celular ? `• ${user.celular}` : ""}`}
                      badge={{
                        text: user.plan?.name || (user.is_blocked ? "Bloqueado" : "Gratuito"),
                        color: user.is_blocked 
                          ? "bg-red-500/10 text-red-700 border-red-200" 
                          : isPaid 
                            ? "bg-green-500/10 text-green-700 border-green-200"
                            : isTrial
                              ? "bg-blue-500/10 text-blue-700 border-blue-200"
                              : "bg-muted/50 text-muted-foreground border-border/50",
                        icon: user.is_blocked ? AlertCircle : isPaid ? CheckCircle2 : UserIcon
                      }}
                      timestamp={format(new Date(user.created_at), "dd/MM", { locale: ptBR })}
                      rightContent={validade && (
                        <span className={cn("text-[10px] font-bold uppercase tracking-tighter shrink-0", TONE_CLASSES[validade.tone])}>
                          {validade.label}
                        </span>
                      )}
                    />
                  );
                })
              )}
            </AdminListContainer>

            <AdminPagination 
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={activeFilter === "leads" ? filteredLeads.length : filteredUsers.length}
              totalPages={activeFilter === "leads" ? Math.ceil(filteredLeads.length / PAGE_SIZE) : totalPages}
              onPageChange={setPage}
              hasNextPage={page < (activeFilter === "leads" ? Math.ceil(filteredLeads.length / PAGE_SIZE) : totalPages) - 1}
              hasPrevPage={page > 0}
            />
          </div>
        </div>
      </div>

      {/* Mobile Full Screen View - Usuário */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-white shrink-0 z-50 relative">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => setSelectedUser(null)}>
              <X className="h-6 w-6" />
            </Button>
            <h2 className="text-base font-bold absolute left-1/2 -translate-x-1/2">Perfil do Usuário</h2>
            <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-full", loading && "animate-spin")} onClick={fetchData}>
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
            <div className="p-4 pb-[calc(4rem+env(safe-area-inset-bottom))]">
              <UserDetailSheet
                user={selectedUser}
                plans={plans}
                open={true}
                onOpenChange={(open) => !open && setSelectedUser(null)}
                onUserUpdated={fetchData}
                isMobileView={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Full Screen View - Lead */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-white shrink-0 z-50 relative">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => setSelectedLead(null)}>
              <X className="h-6 w-6" />
            </Button>
            <h2 className="text-base font-bold absolute left-1/2 -translate-x-1/2 text-center w-full pointer-events-none px-12">Detalhes do Lead</h2>
            <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-full", loading && "animate-spin")} onClick={fetchData}>
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
            <div className="p-4 pb-[calc(4rem+env(safe-area-inset-bottom))]">
              <LeadDetailSheet
                lead={selectedLead}
                open={true}
                onOpenChange={(open) => !open && setSelectedLead(null)}
                onChanged={fetchData}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sheet Views */}
      <div className="hidden md:block">
        <UserDetailSheet
          user={selectedUser}
          plans={plans}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onUserUpdated={fetchData}
        />

        <LeadDetailSheet
          lead={selectedLead}
          open={leadSheetOpen}
          onOpenChange={setLeadSheetOpen}
          onChanged={fetchData}
        />
      </div>

    </AdminLayout>
  );
}

