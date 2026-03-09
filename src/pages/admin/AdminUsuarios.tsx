import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Users, UserCheck, UserX, ShieldOff, ChevronRight, ChevronLeft, X } from "lucide-react";
import { toast } from "sonner";
import { UserDetailSheet } from "@/components/admin/UserDetailSheet";
import { cn } from "@/lib/utils";
import type { Plan, PlanFeatures, ExtendedProfile } from "@/types/plans";

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
  const PAGE_SIZE = 20;

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

      const paidPlanIds = new Set(formattedPlans.filter(p => p.price > 0).map(p => p.id));

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

  useEffect(() => {
    fetchData();
  }, []);

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

    if (!searchTerm) return list;
    const search = searchTerm.toLowerCase();
    return list.filter((user) =>
      user.nome?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.celular?.includes(search)
    );
  }, [users, plans, activeFilter, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [activeFilter, searchTerm]);

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
      <div className="px-4 py-3 md:container-senior md:py-8 space-y-3 md:space-y-6">
        {/* Desktop title */}
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">{stats.total} usuários cadastrados</p>
        </div>

        {/* Stats row - mobile compact */}
        <div className="grid grid-cols-4 gap-1.5 md:gap-3">
          {FILTER_TABS.map(({ key, label, icon: Icon }) => {
            const count = getFilterCount(key);
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl p-2 md:p-3 transition-colors text-center",
                  isActive
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : "bg-muted/40 hover:bg-muted/60"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="text-lg md:text-xl font-bold">{count}</span>
                <span className={cn("text-[10px] md:text-xs", isActive ? "text-primary font-medium" : "text-muted-foreground")}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nome, email ou celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 pr-9"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results count & page info */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filteredUsers.length > 0
              ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filteredUsers.length)} de ${filteredUsers.length}`
              : "0 resultados"}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3ch] text-center">
                {page + 1}/{totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Mobile: User list */}
        <div className="md:hidden space-y-0.5">
          {paginatedUsers.map((user) => (
            <button
              key={user.id}
              className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg active:bg-muted/60 transition-colors border-b border-border/30 last:border-0"
              onClick={() => handleRowClick(user)}
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-[11px]">
                  {getInitials(user.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">
                    {user.nome || "Sem nome"}
                  </p>
                  {user.is_blocked && (
                    <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user.email || user.celular || "-"}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] px-1.5 py-0.5 shrink-0",
                  user.plan && user.plan.price > 0 && "bg-primary/10 text-primary border-primary/20"
                )}
              >
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

        {/* Desktop: Table */}
        <div className="hidden md:block border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(user)}
                >
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.nome)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.nome || "Sem nome"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email || user.celular || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {user.plan?.name || "Sem plano"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_blocked ? (
                      <Badge variant="destructive">Bloqueado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                        Ativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}

              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Sheet de Detalhes */}
        <UserDetailSheet
          user={selectedUser}
          plans={plans}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onUserUpdated={() => fetchData()}
        />
      </div>
    </MainLayout>
  );
}
