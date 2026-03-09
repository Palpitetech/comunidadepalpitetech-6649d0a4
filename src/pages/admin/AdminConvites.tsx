import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, Users, ShoppingCart, Trophy } from "lucide-react";
import { toast } from "sonner";

interface ReferrerStats {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  email: string | null;
  referral_code: string | null;
  total_cadastros: number;
  total_vendas: number;
}

export default function AdminConvites() {
  const [stats, setStats] = useState<ReferrerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get all referrers with referral_code
      const { data: referrers, error: refError } = await supabase
        .from("perfis")
        .select("id, nome, avatar_url, email, referral_code")
        .not("referral_code", "is", null)
        .eq("is_bot", false);

      if (refError) throw refError;
      if (!referrers || referrers.length === 0) {
        setStats([]);
        setLoading(false);
        return;
      }

      const referrerIds = referrers.map((r) => r.id);

      // Get all convites for these referrers
      const { data: convites, error: convError } = await supabase
        .from("convites")
        .select("referrer_id, converted_at")
        .in("referrer_id", referrerIds);

      if (convError) throw convError;

      // Aggregate
      const countMap = new Map<string, { cadastros: number; vendas: number }>();
      (convites || []).forEach((c) => {
        const entry = countMap.get(c.referrer_id) || { cadastros: 0, vendas: 0 };
        entry.cadastros++;
        if (c.converted_at) entry.vendas++;
        countMap.set(c.referrer_id, entry);
      });

      const mapped: ReferrerStats[] = referrers.map((r) => ({
        id: r.id,
        nome: r.nome,
        avatar_url: r.avatar_url,
        email: r.email,
        referral_code: r.referral_code,
        total_cadastros: countMap.get(r.id)?.cadastros || 0,
        total_vendas: countMap.get(r.id)?.vendas || 0,
      }));

      // Sort: vendas desc, then cadastros desc
      mapped.sort((a, b) => {
        if (b.total_vendas !== a.total_vendas) return b.total_vendas - a.total_vendas;
        return b.total_cadastros - a.total_cadastros;
      });

      setStats(mapped);
    } catch (error) {
      console.error("Erro ao buscar convites:", error);
      toast.error("Erro ao carregar dados de convites");
    } finally {
      setLoading(false);
    }
  };

  const filteredStats = stats.filter((s) => {
    const search = searchTerm.toLowerCase();
    return (
      s.nome?.toLowerCase().includes(search) ||
      s.email?.toLowerCase().includes(search) ||
      s.referral_code?.toLowerCase().includes(search)
    );
  });

  const totalCadastros = stats.reduce((sum, s) => sum + s.total_cadastros, 0);
  const totalVendas = stats.reduce((sum, s) => sum + s.total_vendas, 0);

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
      <div className="container-senior py-8">
        <div className="mb-6">
          <h1 className="text-senior-2xl font-bold">Convites</h1>
          <p className="text-muted-foreground">
            Ranking de desempenho dos indicadores
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.length}</p>
                <p className="text-xs text-muted-foreground">Indicadores</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Trophy className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{totalCadastros}</p>
                <p className="text-xs text-muted-foreground">Cadastros</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <ShoppingCart className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{totalVendas}</p>
                <p className="text-xs text-muted-foreground">Vendas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-center">Cadastros</TableHead>
                <TableHead className="text-center">Vendas</TableHead>
                <TableHead className="text-center">Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStats.map((s, idx) => {
                const conversion = s.total_cadastros > 0
                  ? ((s.total_vendas / s.total_cadastros) * 100).toFixed(0)
                  : "0";
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-bold text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={s.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(s.nome)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{s.nome || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{s.email || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {s.referral_code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {s.total_cadastros}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-emerald-600">
                        {s.total_vendas}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {conversion}%
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Nenhum indicador encontrado" : "Nenhum indicador ativo"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
