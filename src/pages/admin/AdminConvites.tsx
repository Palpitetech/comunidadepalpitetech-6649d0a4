import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, Users, ShoppingCart, Trophy, Gift, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RewardInfo {
  id: string;
  milestone_type: string;
  milestone_count: number;
  days_granted: number;
  created_at: string;
  claimed_at: string | null;
}

interface ReferrerStats {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  email: string | null;
  referral_code: string | null;
  total_cadastros: number;
  total_vendas: number;
  cadastros_atual: number;
  vendas_atual: number;
  rewards: RewardInfo[];
  total_days_claimed: number;
  total_days_unclaimed: number;
}

export default function AdminConvites() {
  const [stats, setStats] = useState<ReferrerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
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

      const [convitesRes, rewardsRes] = await Promise.all([
        supabase
          .from("convites")
          .select("referrer_id, converted_at, created_at")
          .in("referrer_id", referrerIds),
        supabase
          .from("referral_rewards")
          .select("id, user_id, milestone_type, milestone_count, days_granted, created_at, claimed_at")
          .in("user_id", referrerIds)
          .order("created_at", { ascending: false }),
      ]);

      if (convitesRes.error) throw convitesRes.error;
      if (rewardsRes.error) throw rewardsRes.error;

      const convites = convitesRes.data || [];
      const rewards = rewardsRes.data || [];

      const rewardsMap = new Map<string, RewardInfo[]>();
      rewards.forEach((r) => {
        const list = rewardsMap.get(r.user_id) || [];
        list.push(r);
        rewardsMap.set(r.user_id, list);
      });

      const countMap = new Map<string, { cadastros: number; vendas: number; cadastros_atual: number; vendas_atual: number }>();
      const lastClaimMap = new Map<string, string>();
      rewards.forEach((r) => {
        if (r.claimed_at) {
          const existing = lastClaimMap.get(r.user_id);
          if (!existing || r.claimed_at > existing) {
            lastClaimMap.set(r.user_id, r.claimed_at);
          }
        }
      });

      convites.forEach((c) => {
        const entry = countMap.get(c.referrer_id) || { cadastros: 0, vendas: 0, cadastros_atual: 0, vendas_atual: 0 };
        entry.cadastros++;
        if (c.converted_at) entry.vendas++;
        const lastClaim = lastClaimMap.get(c.referrer_id);
        if (!lastClaim || c.created_at > lastClaim) {
          entry.cadastros_atual++;
          if (c.converted_at) entry.vendas_atual++;
        }
        countMap.set(c.referrer_id, entry);
      });

      const mapped: ReferrerStats[] = referrers.map((r) => {
        const counts = countMap.get(r.id) || { cadastros: 0, vendas: 0, cadastros_atual: 0, vendas_atual: 0 };
        const userRewards = rewardsMap.get(r.id) || [];
        return {
          id: r.id,
          nome: r.nome,
          avatar_url: r.avatar_url,
          email: r.email,
          referral_code: r.referral_code,
          total_cadastros: counts.cadastros,
          total_vendas: counts.vendas,
          cadastros_atual: counts.cadastros_atual,
          vendas_atual: counts.vendas_atual,
          rewards: userRewards,
          total_days_claimed: userRewards.filter((rw) => rw.claimed_at).reduce((sum, rw) => sum + rw.days_granted, 0),
          total_days_unclaimed: userRewards.filter((rw) => !rw.claimed_at).reduce((sum, rw) => sum + rw.days_granted, 0),
        };
      });

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
  const totalRewardsClaimed = stats.reduce((sum, s) => sum + s.total_days_claimed, 0);

  const getInitials = (nome: string | null) => {
    if (!nome) return "U";
    return nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Convites">
      <div className="container-senior py-4 md:py-8">
        <div className="mb-4 md:mb-6 hidden md:block">
          <h1 className="text-lg md:text-senior-2xl font-bold">Convites</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Ranking de indicadores
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
          <Card>
            <CardContent className="flex flex-col md:flex-row items-center gap-1 md:gap-3 py-3 md:py-4 px-2 md:px-4">
              <Users className="h-5 w-5 md:h-8 md:w-8 text-primary shrink-0" />
              <div className="text-center md:text-left">
                <p className="text-lg md:text-2xl font-bold leading-none">{stats.length}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Indicadores</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col md:flex-row items-center gap-1 md:gap-3 py-3 md:py-4 px-2 md:px-4">
              <Trophy className="h-5 w-5 md:h-8 md:w-8 text-primary shrink-0" />
              <div className="text-center md:text-left">
                <p className="text-lg md:text-2xl font-bold leading-none">{totalCadastros}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Cadastros</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col md:flex-row items-center gap-1 md:gap-3 py-3 md:py-4 px-2 md:px-4">
              <ShoppingCart className="h-5 w-5 md:h-8 md:w-8 text-primary shrink-0" />
              <div className="text-center md:text-left">
                <p className="text-lg md:text-2xl font-bold leading-none">{totalVendas}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Vendas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col md:flex-row items-center gap-1 md:gap-3 py-3 md:py-4 px-2 md:px-4">
              <Gift className="h-5 w-5 md:h-8 md:w-8 text-primary shrink-0" />
              <div className="text-center md:text-left">
                <p className="text-lg md:text-2xl font-bold leading-none">{totalRewardsClaimed}d</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Reinvind.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-4 md:mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Mobile: Compact list */}
        <div className="md:hidden space-y-0.5">
          {filteredStats.map((s, idx) => (
            <div key={s.id}>
              <div
                className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg active:bg-muted/60 cursor-pointer border-b border-border/40 last:border-0"
                onClick={() => setExpandedUser(expandedUser === s.id ? null : s.id)}
              >
                <span className="text-[11px] font-bold text-muted-foreground w-5 text-right shrink-0">
                  {idx + 1}
                </span>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={s.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(s.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.nome || "Sem nome"}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{s.total_cadastros} cad.</span>
                    <span className="text-primary font-semibold">{s.total_vendas} vend.</span>
                    {s.total_days_claimed > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Check className="h-3 w-3 text-primary" />
                        {s.total_days_claimed}d
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expandedUser === s.id ? 'rotate-90' : ''}`} />
              </div>

              {/* Expanded details */}
              {expandedUser === s.id && (
                <div className="ml-10 mr-2 mb-2 p-3 rounded-lg bg-muted/30 border border-border/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Código</span>
                    <span className="font-mono font-medium">{s.referral_code}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Atual</span>
                    <span>{s.cadastros_atual} cad. / {s.vendas_atual} vend.</span>
                  </div>
                  {s.total_days_unclaimed > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Pendente</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                        <Gift className="h-3 w-3" />
                        {s.total_days_unclaimed}d
                      </Badge>
                    </div>
                  )}
                  {s.rewards.length > 0 && (
                    <div className="pt-1 border-t border-border/40 space-y-1">
                      <p className="text-[10px] font-semibold text-muted-foreground">Recompensas</p>
                      {s.rewards.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {r.claimed_at ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <Gift className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span>{r.milestone_type === "cadastros" ? "Cad." : "Vend."} {r.milestone_count}</span>
                          </div>
                          <span className={r.claimed_at ? "text-primary font-medium" : "text-muted-foreground"}>
                            {r.claimed_at
                              ? format(new Date(r.claimed_at), "dd/MM/yy", { locale: ptBR })
                              : "Pendente"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredStats.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchTerm ? "Nenhum resultado" : "Nenhum indicador ativo"}
            </div>
          )}
        </div>

        {/* Desktop: Full Table */}
        <div className="hidden md:block border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Atual</TableHead>
                <TableHead className="text-center">Recompensas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStats.map((s, idx) => (
                <>
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedUser(expandedUser === s.id ? null : s.id)}
                  >
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
                    <TableCell className="text-center">
                      <div className="text-xs space-y-0.5">
                        <p><span className="font-semibold">{s.total_cadastros}</span> cad.</p>
                        <p><span className="font-semibold text-primary">{s.total_vendas}</span> vend.</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-xs space-y-0.5">
                        <p><span className="font-semibold">{s.cadastros_atual}</span> cad.</p>
                        <p><span className="font-semibold text-primary">{s.vendas_atual}</span> vend.</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {s.rewards.length > 0 ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {s.total_days_claimed > 0 && (
                            <Badge variant="default" className="text-xs gap-1">
                              <Check className="h-3 w-3" />
                              {s.total_days_claimed}d
                            </Badge>
                          )}
                          {s.total_days_unclaimed > 0 && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Gift className="h-3 w-3" />
                              {s.total_days_unclaimed}d
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedUser === s.id && s.rewards.length > 0 && (
                    <TableRow key={`${s.id}-details`}>
                      <TableCell colSpan={7} className="bg-muted/30 px-6 py-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Histórico de recompensas</p>
                        <div className="space-y-1.5">
                          {s.rewards.map((r) => (
                            <div key={r.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                {r.claimed_at ? (
                                  <Check className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <Gift className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <span>
                                  {r.milestone_type === "cadastros" ? "Cadastros" : "Vendas"} — Meta {r.milestone_count} — {r.days_granted} dias
                                </span>
                              </div>
                              <div className="text-muted-foreground">
                                {r.claimed_at ? (
                                  <span className="text-primary font-medium">
                                    Reinvindicado em {format(new Date(r.claimed_at), "dd/MM/yy", { locale: ptBR })}
                                  </span>
                                ) : (
                                  <span>Pendente</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
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
    </AdminLayout>
  );
}
