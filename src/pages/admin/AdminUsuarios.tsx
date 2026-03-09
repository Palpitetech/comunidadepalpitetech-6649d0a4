import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserDetailSheet } from "@/components/admin/UserDetailSheet";
import type { Plan, PlanFeatures, ExtendedProfile } from "@/types/plans";

interface UserWithPlan extends ExtendedProfile {
  plan?: Plan | null;
}

export default function AdminUsuarios() {
  const [users, setUsers] = useState<UserWithPlan[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithPlan | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchData = async () => {
    try {
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select("*")
        .order("display_order");

      if (plansError) throw plansError;

      const formattedPlans: Plan[] = (plansData || []).map((p) => ({
        ...p,
        price: Number(p.price),
        features: p.features as PlanFeatures,
      }));
      setPlans(formattedPlans);

      const { data: usersData, error: usersError } = await supabase
        .from("perfis")
        .select("*")
        .eq("is_bot", false)
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

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

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.nome?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.celular?.includes(search)
    );
  });

  const handleRowClick = (user: UserWithPlan) => {
    setSelectedUser(user);
    setSheetOpen(true);
  };

  const handleUserUpdated = () => {
    fetchData();
  };

  const getInitials = (nome: string | null) => {
    if (!nome) return "U";
    return nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-senior py-4 md:py-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h1 className="text-lg md:text-senior-2xl font-bold">Gestão de Usuários</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {users.length} usuário{users.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative mb-4 md:mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Mobile: Card list */}
        <div className="md:hidden space-y-1">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg active:bg-muted/60 cursor-pointer border-b border-border/40 last:border-0"
              onClick={() => handleRowClick(user)}
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-[11px]">
                  {getInitials(user.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
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
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 shrink-0">
                {user.plan?.name || "Free"}
              </Badge>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchTerm ? "Nenhum resultado" : "Nenhum usuário"}
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
              {filteredUsers.map((user) => (
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
                    {searchTerm
                      ? "Nenhum usuário encontrado para esta busca"
                      : "Nenhum usuário cadastrado"}
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
          onUserUpdated={handleUserUpdated}
        />
      </div>
    </MainLayout>
  );
}
