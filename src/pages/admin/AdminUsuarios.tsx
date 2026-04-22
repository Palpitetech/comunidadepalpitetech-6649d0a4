import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Users, UserCheck, ChevronRight, ChevronLeft, X, ArrowLeft, Timer, CheckCircle2, AlertCircle, Circle, Inbox, Globe } from "lucide-react";
import { toast } from "sonner";
import { UserDetailSheet } from "@/components/admin/UserDetailSheet";
import { LeadDetailSheet, type LeadInbox } from "@/components/admin/LeadDetailSheet";
import { TagFilterPopover } from "@/components/admin/TagFilterPopover";
import { cn } from "@/lib/utils";

import type { Plan, PlanFeatures, ExtendedProfile } from "@/types/plans";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const PAGE_SIZE = 25;

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
      l.source?.toLowerCase().includes(s) ||
      l.utm_source?.toLowerCase().includes(s) ||
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

  if (loading) {
    return (
      <AdminLayout pageTitle="Usuários">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      pageTitle="Usuários"
      headerRightContent={
        <span className="text-xs text-muted-foreground font-medium">{stats.total}</span>
      }
    >
      {/* ======= MOBILE ======= */}
      <div className="md:hidden px-4 py-3 space-y-3">
        {/* Filtros principais */}
        <div className="grid grid-cols-4 gap-1">
          {FILTROS_PRINCIPAIS.map(({ key, label, icon: Icon }) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl p-2 transition-colors text-center",
                  isActive ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/40 hover:bg-muted/60"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="text-lg font-bold">{getPrincipalCount(key)}</span>
                <span className={cn("text-[10px]", isActive ? "text-primary font-medium" : "text-muted-foreground")}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Subfiltros (rolagem horizontal, agrupados) */}
        <div className="-mx-4 px-4 overflow-x-auto">
          <div className="flex items-center gap-2 w-max">
            {FILTROS_SECUNDARIOS_GRUPOS.map((grupo, idx) => (
              <div key={grupo.label} className="flex items-center gap-1.5">
                {idx > 0 && <div className="h-5 w-px bg-border mx-1" aria-hidden />}
                {grupo.items.map(({ key, label }) => {
                  const isActive = activeSubFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => toggleSubFilter(key)}
                      className={cn(
                        "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border inline-flex items-center gap-1",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {label} <span className="opacity-70">{getSubCount(key)}</span>
                      {isActive && <X className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Search + Tag filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar nome, email ou celular..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-9 pr-9" />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <TagFilterPopover
            allTags={allTags}
            includeTags={includeTags}
            excludeTags={excludeTags}
            exactMatch={exactMatch}
            onIncludeTagsChange={setIncludeTags}
            onExcludeTagsChange={setExcludeTags}
            onExactMatchChange={setExactMatch}
            align="end"
          />
        </div>

        {/* Lista — usuários OU leads */}
        {activeFilter === "leads" ? (
          <div className="space-y-0.5">
            {filteredLeads.map((lead) => (
              <button
                key={lead.id}
                className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg active:bg-muted/60 transition-colors border-b border-border/30 last:border-0"
                onClick={() => handleLeadClick(lead)}
              >
                <div className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center">
                  <Inbox className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{lead.nome || "Sem nome"}</p>
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", getLeadStatusClass(lead.status))}>
                      {lead.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {lead.email || lead.celular || "—"}
                  </p>
                  {lead.pagina_origem && (
                    <p className="text-[10px] text-muted-foreground/70 truncate">{lead.pagina_origem}</p>
                  )}
                </div>
                {getUtmBadge(lead.utm_source)}
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </button>
            ))}
            {filteredLeads.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {searchTerm ? "Nenhum lead encontrado" : "Nenhum lead capturado ainda"}
              </div>
            )}
          </div>
        ) : (
        <div className="space-y-0.5">
          {paginatedUsers.map((user) => (
            <button
              key={user.id}
              className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg active:bg-muted/60 transition-colors border-b border-border/30 last:border-0"
              onClick={() => handleRowClick(user)}
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-[11px]">{getInitials(user.nome)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{user.nome || "Sem nome"}</p>
                  {user.is_blocked && <span className="w-2 h-2 rounded-full bg-destructive shrink-0" title="Bloqueado" />}
                  {user.email_verificado
                    ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" aria-label="Verificado" />
                    : <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" aria-label="Não verificado" />}
                  {isPaidActive(user) && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Plano ativo" />}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{user.email || user.celular || "-"}</p>
                {(() => {
                  const info = getValidadeInfo(user.validade_assinatura);
                  if (!info) return null;
                  return (
                    <p className={cn("text-[10px] font-medium truncate", TONE_CLASSES[info.tone])}>
                      Vence {info.dataFormatada} · {info.label}
                    </p>
                  );
                })()}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {getUtmBadge(user.utm_source)}
                <Badge variant="secondary" className={cn(
                  "text-[10px] px-1.5 py-0.5",
                  user.plan && user.plan.price > 0 && "bg-primary/10 text-primary border-primary/20",
                  user.plan?.slug === TRIAL_SLUG && "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200"
                )}>
                  {user.plan?.name || "Free"}
                </Badge>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {searchTerm ? "Nenhum resultado encontrado" : "Nenhum usuário"}
            </div>
          )}
        </div>
        )}

        {/* Bottom pagination mobile */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 pb-4">
            <p className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredUsers.length)} de {filteredUsers.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-xs text-muted-foreground min-w-[3ch] text-center">{page + 1}/{totalPages}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* ======= DESKTOP ======= */}
      <div className="hidden md:flex flex-col flex-1 min-h-0">
        {/* Toolbar — linha 1 (principais + busca) */}
        <div className="border-b border-border bg-card/50 px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold mr-2">Usuários</h1>

          <div className="flex items-center gap-1">
            {FILTROS_PRINCIPAIS.map(({ key, label }) => {
              const isActive = activeFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {label} <span className="opacity-70">{getPrincipalCount(key)}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          <TagFilterPopover
            allTags={allTags}
            includeTags={includeTags}
            excludeTags={excludeTags}
            exactMatch={exactMatch}
            onIncludeTagsChange={setIncludeTags}
            onExcludeTagsChange={setExcludeTags}
            onExactMatchChange={setExactMatch}
            align="end"
          />

          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={activeFilter === "leads" ? "Buscar lead por nome, email ou celular..." : "Buscar..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-sm bg-background"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Toolbar — linha 2 (subfiltros agrupados) — escondido em Leads */}
        {activeFilter !== "leads" && (
          <div className="border-b border-border bg-background px-6 py-2 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mr-1">Filtros:</span>
            {FILTROS_SECUNDARIOS_GRUPOS.map((grupo, idx) => (
              <div key={grupo.label} className="flex items-center gap-1.5">
                {idx > 0 && <div className="h-4 w-px bg-border mx-1" aria-hidden />}
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-medium">{grupo.label}</span>
                {grupo.items.map(({ key, label }) => {
                  const isActive = activeSubFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => toggleSubFilter(key)}
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors border inline-flex items-center gap-1",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {label} <span className="opacity-70">{getSubCount(key)}</span>
                      {isActive && <X className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-6"></TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nome</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email / Celular</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plano</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-center">Verificado</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-center">Ativo</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Próx. vencimento</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Origem</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tags</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cadastro</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer group"
                  onClick={() => handleRowClick(user)}
                >
                  <TableCell className="pl-6 py-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-muted">{getInitials(user.nome)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate max-w-[200px]">{user.nome || "Sem nome"}</span>
                      {user.is_blocked && <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" title="Bloqueado" />}
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 text-sm text-muted-foreground truncate max-w-[220px]">
                    {user.email || user.celular || "—"}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      user.plan && user.plan.price > 0 ? "text-primary bg-primary/10" :
                      user.plan?.slug === TRIAL_SLUG ? "text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/40" :
                      "text-muted-foreground bg-muted/50"
                    )}>
                      {user.plan?.name || "Free"}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    {user.email_verificado ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400" title="Email verificado">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">Sim</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400" title="Email não verificado">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">Não</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    {isPaidActive(user) ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400" title="Plano pago ativo">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">Ativo</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60" title="Sem plano pago ativo">
                        <Circle className="h-3 w-3" />
                        <span className="hidden lg:inline">—</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5">
                    {(() => {
                      const info = getValidadeInfo(user.validade_assinatura);
                      if (!info) return <span className="text-xs text-muted-foreground/60">—</span>;
                      return (
                        <div className="flex flex-col leading-tight">
                          <span className="text-xs tabular-nums text-foreground">{info.dataFormatada}</span>
                          <span className={cn("text-[10px] font-medium", TONE_CLASSES[info.tone])}>{info.label}</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="py-2.5">
                    {getUtmBadge(user.utm_source) || <span className="text-[10px] text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex flex-wrap gap-1 max-w-[280px]">
                      {user.tags?.slice(0, 4).map((tag) => (
                        <span key={tag} className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                      {user.tags && user.tags.length > 4 && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                          +{user.tags.length - 4}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground tabular-nums">
                    {format(new Date(user.created_at), "dd/MM/yy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="py-2.5 pr-4">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-16 text-sm text-muted-foreground">
                    {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-border px-6 py-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredUsers.length)} de {filteredUsers.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <span className="text-xs text-muted-foreground min-w-[3ch] text-center">{page + 1}/{totalPages}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </div>

      <UserDetailSheet
        user={selectedUser}
        plans={plans}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUserUpdated={() => fetchData()}
      />
    </AdminLayout>
  );
}
