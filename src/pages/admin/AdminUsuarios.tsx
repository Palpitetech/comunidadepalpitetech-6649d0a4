import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Users, UserCheck, UserX, ShieldOff, ChevronRight, ChevronLeft, X, ArrowLeft, Filter, Tag, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { UserDetailSheet } from "@/components/admin/UserDetailSheet";
import { cn } from "@/lib/utils";
import type { Plan, PlanFeatures, ExtendedProfile } from "@/types/plans";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserWithPlan extends ExtendedProfile {
  plan?: Plan | null;
}

type FilterTab = "todos" | "pagos" | "free" | "bloqueados";

const FILTER_TABS: { key: FilterTab; label: string; icon: typeof Users }[] = [
  { key: "todos", label: "Todos", icon: Users },
  { key: "pagos", label: "Pagos", icon: UserCheck },
  { key: "free", label: "Free", icon: UserX },
  { key: "bloqueados", label: "Bloqueados", icon: ShieldOff },
];

export default function AdminUsuarios() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithPlan[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithPlan | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("todos");
  const [page, setPage] = useState(0);
  const [includeTags, setIncludeTags] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const [exactMatch, setExactMatch] = useState(false);
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [includeSearch, setIncludeSearch] = useState("");
  const [excludeSearch, setExcludeSearch] = useState("");
  const PAGE_SIZE = 25;

  const fetchData = async () => {
    try {
      const [{ data: plansData, error: plansError }, { data: usersData, error: usersError }] = await Promise.all([
        supabase.from("plans").select("*").order("display_order"),
        supabase.from("perfis").select("*").eq("is_bot", false).order("created_at", { ascending: false }),
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
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => {
    const paidPlanIds = new Set(plans.filter(p => p.price > 0).map(p => p.id));
    const total = users.length;
    const bloqueados = users.filter(u => u.is_blocked).length;
    const pagos = users.filter(u =>
      (u.plan_id && paidPlanIds.has(u.plan_id)) || u.status_assinatura === "ativa"
    ).length;
    const free = total - pagos;
    return { total, pagos, free, bloqueados };
  }, [users, plans]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    users.forEach(u => u.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [users]);

  const tagFilterActive = includeTags.length > 0 || excludeTags.length > 0;

  const filteredUsers = useMemo(() => {
    const paidPlanIds = new Set(plans.filter(p => p.price > 0).map(p => p.id));
    let list = users;
    if (activeFilter === "pagos") {
      list = users.filter(u => (u.plan_id && paidPlanIds.has(u.plan_id)) || u.status_assinatura === "ativa");
    } else if (activeFilter === "free") {
      list = users.filter(u => !((u.plan_id && paidPlanIds.has(u.plan_id)) || u.status_assinatura === "ativa"));
    } else if (activeFilter === "bloqueados") {
      list = users.filter(u => u.is_blocked);
    }

    // Tag filters
    if (includeTags.length > 0) {
      list = list.filter(u => {
        const userTags = u.tags || [];
        if (exactMatch) {
          return includeTags.every(t => userTags.includes(t));
        }
        return includeTags.some(t => userTags.includes(t));
      });
    }
    if (excludeTags.length > 0) {
      list = list.filter(u => {
        const userTags = u.tags || [];
        return !excludeTags.some(t => userTags.includes(t));
      });
    }

    if (!searchTerm) return list;
    const search = searchTerm.toLowerCase();
    return list.filter((user) =>
      user.nome?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.celular?.includes(search) ||
      user.tags?.some(t => t.toLowerCase().includes(search))
    );
  }, [users, plans, activeFilter, searchTerm, includeTags, excludeTags, exactMatch]);

  useEffect(() => { setPage(0); }, [activeFilter, searchTerm, includeTags, excludeTags, exactMatch]);

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

  const getFilterCount = (key: FilterTab) => {
    switch (key) {
      case "todos": return stats.total;
      case "pagos": return stats.pagos;
      case "free": return stats.free;
      case "bloqueados": return stats.bloqueados;
    }
  };

  const toggleTag = (tag: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag]);
  };

  const clearTagFilters = () => {
    setIncludeTags([]);
    setExcludeTags([]);
    setExactMatch(false);
  };

  const tagFilterContent = (
    <div className="w-72 space-y-3 p-1">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Contém a tag</p>
        {/* Selected include tags */}
        {includeTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {includeTags.map(tag => (
              <button key={`sel-inc-${tag}`} onClick={() => toggleTag(tag, includeTags, setIncludeTags)} className="px-2 py-0.5 rounded-full text-[11px] border bg-primary/15 text-primary border-primary/30 flex items-center gap-0.5">
                {tag} <X className="h-2.5 w-2.5" />
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <Input
            placeholder="Digitar tag..."
            value={includeSearch}
            onChange={(e) => setIncludeSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        {includeSearch && (
          <div className="flex flex-wrap gap-1 mt-1.5 max-h-24 overflow-auto">
            {allTags
              .filter(t => t.toLowerCase().includes(includeSearch.toLowerCase()) && !includeTags.includes(t))
              .map(tag => (
                <button
                  key={`sug-inc-${tag}`}
                  onClick={() => { toggleTag(tag, includeTags, setIncludeTags); setIncludeSearch(""); }}
                  className="px-2 py-0.5 rounded-full text-[11px] border bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                >
                  {tag}
                </button>
              ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Não contém a tag</p>
        {/* Selected exclude tags */}
        {excludeTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {excludeTags.map(tag => (
              <button key={`sel-exc-${tag}`} onClick={() => toggleTag(tag, excludeTags, setExcludeTags)} className="px-2 py-0.5 rounded-full text-[11px] border bg-destructive/15 text-destructive border-destructive/30 flex items-center gap-0.5">
                {tag} <X className="h-2.5 w-2.5" />
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <Input
            placeholder="Digitar tag..."
            value={excludeSearch}
            onChange={(e) => setExcludeSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        {excludeSearch && (
          <div className="flex flex-wrap gap-1 mt-1.5 max-h-24 overflow-auto">
            {allTags
              .filter(t => t.toLowerCase().includes(excludeSearch.toLowerCase()) && !excludeTags.includes(t))
              .map(tag => (
                <button
                  key={`sug-exc-${tag}`}
                  onClick={() => { toggleTag(tag, excludeTags, setExcludeTags); setExcludeSearch(""); }}
                  className="px-2 py-0.5 rounded-full text-[11px] border bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                >
                  {tag}
                </button>
              ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <Switch checked={exactMatch} onCheckedChange={setExactMatch} className="scale-75" />
          Correspondência exata
        </label>
        {tagFilterActive && (
          <button onClick={clearTagFilters} className="text-[11px] text-muted-foreground hover:text-foreground underline">
            Limpar
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <MainLayout pageTitle="Usuários" onBack={() => navigate("/admin")}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      pageTitle="Usuários"
      onBack={() => navigate("/admin")}
      headerRightContent={
        <span className="text-xs text-muted-foreground font-medium">{stats.total}</span>
      }
    >
      {/* ======= MOBILE ======= */}
      <div className="md:hidden px-4 py-3 space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-1.5">
          {FILTER_TABS.map(({ key, label, icon: Icon }) => {
            const count = getFilterCount(key);
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
                <span className="text-lg font-bold">{count}</span>
                <span className={cn("text-[10px]", isActive ? "text-primary font-medium" : "text-muted-foreground")}>{label}</span>
              </button>
            );
          })}
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
          <Popover open={tagFilterOpen} onOpenChange={setTagFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={cn("h-9 w-9 shrink-0", tagFilterActive && "border-primary/40 bg-primary/5 text-primary")}>
                <Tag className="h-4 w-4" />
                {tagFilterActive && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{includeTags.length + excludeTags.length}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-3">
              {tagFilterContent}
            </PopoverContent>
          </Popover>
        </div>


        {/* User list */}
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
                  {user.is_blocked && <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{user.email || user.celular || "-"}</p>
              </div>
              <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0.5 shrink-0", user.plan && user.plan.price > 0 && "bg-primary/10 text-primary border-primary/20")}>
                {user.plan?.name || "Free"}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {searchTerm ? "Nenhum resultado encontrado" : "Nenhum usuário"}
            </div>
          )}
        </div>

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

      {/* ======= DESKTOP — fullscreen minimal ======= */}
      <div className="hidden md:flex flex-col flex-1 min-h-0">
        {/* Toolbar */}
        <div className="border-b border-border bg-card/50 px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold mr-2">Usuários</h1>

          {/* Filter pills */}
          <div className="flex items-center gap-1">
            {FILTER_TABS.map(({ key, label }) => {
              const count = getFilterCount(key);
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
                  {label} <span className="opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* Tag filter desktop */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 gap-1.5 text-xs", tagFilterActive && "border-primary/40 bg-primary/5 text-primary")}>
                <Tag className="h-3 w-3" />
                Tags
                {tagFilterActive && <span className="ml-0.5 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{includeTags.length + excludeTags.length}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-3">
              {tagFilterContent}
            </PopoverContent>
          </Popover>

          {/* Search */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
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

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-6"></TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nome</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email / Celular</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plano</TableHead>
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
                      {user.is_blocked && <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />}
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 text-sm text-muted-foreground truncate max-w-[220px]">
                    {user.email || user.celular || "—"}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className={cn(
                      "text-xs font-medium",
                      user.plan && user.plan.price > 0 ? "text-primary" : "text-muted-foreground"
                    )}>
                      {user.plan?.name || "Free"}
                    </span>
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
                  <TableCell colSpan={7} className="text-center py-16 text-sm text-muted-foreground">
                    {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Bottom pagination desktop */}
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
    </MainLayout>
  );
}
