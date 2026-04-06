import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Wallet, Ticket, Trophy, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from "@supabase/supabase-js";

interface TransacoesTabProps {
  user: User | null;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <ScrollText className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function TransacoesTab({ user }: TransacoesTabProps) {
  const userId = user?.id;

  const { data: movimentacoes, isLoading: loadingMov } = useQuery({
    queryKey: ["carteira_movimentacoes", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carteira_movimentacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
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
        .limit(50);
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
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const isLoading = loadingMov || loadingCotas || loadingResgates;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <Tabs defaultValue="log" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-9">
          <TabsTrigger value="log" className="text-xs">Log</TabsTrigger>
          <TabsTrigger value="cotas" className="text-xs">Cotas</TabsTrigger>
          <TabsTrigger value="premiacoes" className="text-xs">Premiações</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-3">
          {!movimentacoes?.length ? (
            <EmptyState message="Nenhuma transação encontrada" />
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden divide-y">
              {movimentacoes.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.descricao}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(m.created_at!), "dd/MM/yy HH:mm")}
                    </p>
                  </div>
                  <Badge
                    variant={m.tipo === "entrada" ? "default" : "secondary"}
                    className="text-xs shrink-0"
                  >
                    {m.tipo === "entrada" ? "+" : "-"}R$ {Number(m.valor).toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cotas" className="mt-3">
          {!cotas?.length ? (
            <EmptyState message="Nenhuma cota comprada" />
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden divide-y">
              {cotas.map((c) => {
                const bolao = c.boloes as any;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Ticket className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Cota #{c.numero_cota} {bolao ? `— ${bolao.codigo}` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {bolao?.loteria} • Concurso {bolao?.concurso_numero}
                      </p>
                    </div>
                    <Badge variant={c.status === "pago" ? "default" : "outline"} className="text-xs shrink-0">
                      {c.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="premiacoes" className="mt-3">
          {!resgates?.length ? (
            <EmptyState message="Nenhuma premiação recebida" />
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden divide-y">
              {resgates.map((r) => {
                const bolao = r.boloes as any;
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Premiação {bolao ? `— ${bolao.codigo}` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(r.created_at!), "dd/MM/yy")}
                      </p>
                    </div>
                    <Badge variant="default" className="text-xs shrink-0">
                      R$ {Number(r.valor || 0).toFixed(2)}
                    </Badge>
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
