import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
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
      // Buscar planos
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

      // Buscar usuários (excluindo bots)
      const { data: usersData, error: usersError } = await supabase
        .from("perfis")
        .select("*")
        .eq("is_bot", false)
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Mapear planos aos usuários
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
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-senior py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-senior-2xl font-bold text-white">Gestão de Usuários</h1>
            <p className="text-white/70">
              {users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Buscar por nome, email ou celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
          />
        </div>

        {/* Tabela */}
        <div className="border border-white/20 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-transparent">
                <TableHead className="w-12 text-white/70"></TableHead>
                <TableHead className="text-white/70">Nome</TableHead>
                <TableHead className="text-white/70">Email</TableHead>
                <TableHead className="text-white/70">Plano</TableHead>
                <TableHead className="text-white/70">Status</TableHead>
                <TableHead className="text-white/70">Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer border-white/10 hover:bg-white/5"
                  onClick={() => handleRowClick(user)}
                >
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-white/20 text-white">
                        {getInitials(user.nome)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {user.nome || "Sem nome"}
                  </TableCell>
                  <TableCell className="text-white/70">
                    {user.email || user.celular || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {user.plan?.name || "Sem plano"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_blocked ? (
                      <Badge variant="destructive">Bloqueado</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/80 text-white border-emerald-500/80">
                        Ativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-white/70">
                    {new Date(user.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}

              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-white/70">
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
    </AdminLayout>
  );
}
