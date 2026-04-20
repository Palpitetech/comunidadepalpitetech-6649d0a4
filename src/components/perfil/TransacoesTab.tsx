import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Wallet,
  Ticket,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { isToday, isYesterday, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface TransacoesTabProps {
  user: User | null;
}

type Periodo = "all" | "7" | "30" | "90";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "7", label: "7 dias" },
  { id: "30", label: "30 dias" },
  { id: "90", label: "90 dias" },
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dayKey(d: Date) {
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd 'de' MMM", { locale: ptBR });
}

function filterByPeriod<T extends { created_at?: string | null }>(items: T[] | undefined, periodo: Periodo): T[] {
  if (!items) return [];
  if (periodo === "all") return items;
  const days = parseInt(periodo, 10);
  const cutoff = subDays(new Date(), days);
  return items.filter((it) => it.created_at && new Date(it.created_at) >= cutoff);
}

function EmptyState({
  icon: Icon,
  title,
  cta,
  onCta,
}: {
  icon: typeof Wallet;
  title: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">{title}</p>
      {cta && onCta && (
        <Button onClick={onCta} variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          {cta}
        </Button>
      )}
    </div>
  );
}

export function TransacoesTab({ user }: TransacoesTabProps) {
  const userId = user?.id;
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<Periodo>("30");

  const { data: movimentacoes, isLoading: loadingMov } = useQuery({
    queryKey: ["carteira_movimentacoes", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carteira_movimentacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: cotas, isLoading: loadingCotas } = useQuery({
    queryKey: ["bolao_cotas_user", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bolao_cotas")
        .select("*, boloes(codigo, loteria, concurso_numero)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: resgates, isLoading: loadingResgates } = useQuery({
    queryKey: ["bolao_resgates_user", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bolao_resgates")
        .select("*, boloes(codigo, loteria, concurso_numero)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const isLoading = loadingMov || loadingCotas || loadingResgates;

  const movFiltradas = useMemo(() => filterByPeriod(movimentacoes, periodo), [movimentacoes, periodo]);
  const cotasFiltradas = useMemo(() => filterByPeriod(cotas, periodo), [cotas, periodo]);
  const resgatesFiltrados = useMemo(() => filterByPeriod(resgates, periodo), [resgates, periodo]);

  const { totalIn, totalOut, saldo } = useMemo(() => {
    let inAmt = 0;
    let outAmt = 0;
    movFiltradas.forEach((m: any) => {
      const v = Number(m.valor) || 0;
      if (m.tipo === "entrada" || m.tipo === "premio" || m.tipo === "bonus") inAmt += v;
      else outAmt += v;
    });
    return { totalIn: inAmt, totalOut: outAmt, saldo: inAmt - outAmt };
  }, [movFiltradas]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof movFiltradas> = {};
    movFiltradas.forEach((m: any) => {
      if (!m.created_at) return;
      const key = dayKey(new Date(m.created_at));
      (groups[key] ||= []).push(m);
    });
    return groups;
  }, [movFiltradas]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Saldo header */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Wallet className="h-3.5 w-3.5" />
          Saldo do período
        </div>
        <p className={cn("text-3xl font-bold tracking-tight", saldo < 0 ? "text-destructive" : "text-foreground")}>
          {formatBRL(saldo)}
        </p>
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Entradas</p>
              <p className="font-semibold text-emerald-600">{formatBRL(totalIn)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Saídas</p>
              <p className="font-semibold text-destructive">{formatBRL(totalOut)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtro de período */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-1">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              className={cn(
                "px-4 h-9 rounded-full text-xs font-medium whitespace-nowrap border transition-colors shrink-0",
                periodo === p.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>

      {/* Tabs */}
      <Tabs defaultValue="log" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-11">
          <TabsTrigger value="log" className="text-xs font-medium">
            Log {movFiltradas.length > 0 && `(${movFiltradas.length})`}
          </TabsTrigger>
          <TabsTrigger value="cotas" className="text-xs font-medium">
            Cotas {cotasFiltradas.length > 0 && `(${cotasFiltradas.length})`}
          </TabsTrigger>
          <TabsTrigger value="premiacoes" className="text-xs font-medium">
            Prêmios {resgatesFiltrados.length > 0 && `(${resgatesFiltrados.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Log */}
        <TabsContent value="log" className="mt-4 space-y-4">
          {!movFiltradas.length ? (
            <EmptyState
              icon={Wallet}
              title="Nenhuma transação no período"
              cta="Explorar Bolões"
              onCta={() => navigate("/boloes")}
            />
          ) : (
            Object.entries(grouped).map(([day, items]) => (
              <div key={day} className="space-y-1.5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 font-medium">
                  {day}
                </p>
                <div className="rounded-2xl border bg-card overflow-hidden divide-y">
                  {items.map((m: any) => {
                    const isIn = m.tipo === "entrada" || m.tipo === "premio" || m.tipo === "bonus";
                    const valueColor = isIn ? "text-emerald-600" : "text-destructive";
                    const Icon =
                      m.tipo === "premio" ? Trophy : m.tipo === "bonus" ? Sparkles : isIn ? ArrowUpRight : ArrowDownRight;
                    const iconBg =
                      m.tipo === "premio"
                        ? "bg-amber-500/10 text-amber-600"
                        : m.tipo === "bonus"
                        ? "bg-purple-500/10 text-purple-600"
                        : isIn
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-destructive/10 text-destructive";
                    return (
                      <div key={m.id} className="flex items-center gap-3 p-3.5 min-h-[64px]">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                            iconBg
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.descricao}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(m.created_at!), "HH:mm")}
                          </p>
                        </div>
                        <p className={cn("text-base font-bold shrink-0", valueColor)}>
                          {isIn ? "+" : "-"}
                          {formatBRL(Number(m.valor) || 0)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Cotas */}
        <TabsContent value="cotas" className="mt-4">
          {!cotasFiltradas.length ? (
            <EmptyState
              icon={Ticket}
              title="Nenhuma cota no período"
              cta="Ver Bolões Disponíveis"
              onCta={() => navigate("/boloes")}
            />
          ) : (
            <div className="rounded-2xl border bg-card overflow-hidden divide-y">
              {cotasFiltradas.map((c: any) => {
                const bolao = c.boloes;
                const isPaid = c.status === "pago";
                return (
                  <button
                    key={c.id}
                    onClick={() => bolao?.codigo && navigate(`/boloes`)}
                    className="w-full flex items-center gap-3 p-3.5 min-h-[64px] hover:bg-muted/50 transition-colors text-left"
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        isPaid ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Cota #{c.numero_cota}
                        {bolao ? ` — ${bolao.codigo}` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {bolao?.loteria} • Concurso {bolao?.concurso_numero}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase px-2 py-1 rounded-full shrink-0",
                        isPaid ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {c.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Premiações */}
        <TabsContent value="premiacoes" className="mt-4">
          {!resgatesFiltrados.length ? (
            <EmptyState icon={Trophy} title="Nenhuma premiação no período" />
          ) : (
            <div className="rounded-2xl border bg-card overflow-hidden divide-y">
              {resgatesFiltrados.map((r: any) => {
                const bolao = r.boloes;
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3.5 min-h-[64px]">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Trophy className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Premiação{bolao ? ` — ${bolao.codigo}` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(r.created_at!), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <p className="text-base font-bold text-amber-600 shrink-0">
                      +{formatBRL(Number(r.valor) || 0)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
