import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInCalendarDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const LOTERIA_META: Record<string, { emoji: string; label: string; color: string }> = {
  megasena: { emoji: "🎯", label: "Mega-Sena", color: "hsl(var(--chart-1))" },
  lotofacil: { emoji: "🍀", label: "Lotofácil", color: "hsl(var(--chart-2))" },
  duplasena: { emoji: "🎲", label: "Dupla Sena", color: "hsl(var(--chart-4))" },
  quina: { emoji: "🌟", label: "Quina", color: "hsl(var(--chart-3))" },
  lotomania: { emoji: "🎰", label: "Lotomania", color: "hsl(var(--chart-5))" },
  diadesorte: { emoji: "🍀", label: "Dia de Sorte", color: "hsl(var(--primary))" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function relativeDate(dateStr: string) {
  const date = parseISO(dateStr);
  const diff = differenceInCalendarDays(startOfDay(new Date()), startOfDay(date));
  if (diff < 0) {
    // Future
    const absDiff = Math.abs(diff);
    if (absDiff === 1) return "amanhã";
    return `em ${absDiff} dias`;
  }
  if (diff === 0) return "hoje";
  if (diff === 1) return "ontem";
  return `${diff} dias atrás`;
}

function formatDataSorteio(dateStr: string) {
  try {
    const date = parseISO(dateStr);
    return format(date, "EEEE, dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function relativeUpdated(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const diff = differenceInCalendarDays(startOfDay(new Date()), startOfDay(date));
    const time = format(date, "HH:mm");
    if (diff === 0) return `hoje às ${time}`;
    if (diff === 1) return `ontem às ${time}`;
    return `${diff} dias atrás`;
  } catch {
    return "";
  }
}

export default function ProximosConcursos() {
  useEffect(() => {
    document.title = "Próximos Concursos de Loteria | Palpite Tech";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Confira as datas e prêmios estimados dos próximos sorteios de Mega-Sena, Lotofácil, Dupla Sena e mais."
      );
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "description";
      newMeta.content =
        "Confira as datas e prêmios estimados dos próximos sorteios de Mega-Sena, Lotofácil, Dupla Sena e mais.";
      document.head.appendChild(newMeta);
    }
  }, []);

  const { data: concursos, isLoading } = useQuery({
    queryKey: ["proximos-concursos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proximos_concursos")
        .select("*")
        .order("data_sorteio", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  return (
    <MainLayout pageTitle="Próximos Concursos">
      <div className="px-4 py-3 md:container-senior md:py-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Próximos Concursos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sorteios programados e estimativas de prêmio
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !concursos || concursos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Dados sendo atualizados. Volte em breve!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {concursos.map((c: any) => {
              const meta = LOTERIA_META[c.loteria] || {
                emoji: "🎰",
                label: c.loteria,
                color: "hsl(var(--primary))",
              };
              const premio = Number(c.premio_estimado) || 0;

              return (
                <Card key={c.id} className="overflow-hidden">
                  <div className="h-1" style={{ backgroundColor: meta.color }} />
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold flex items-center gap-2">
                        <span className="text-xl">{meta.emoji}</span>
                        {meta.label}
                      </span>
                      {c.acumulado && (
                        <Badge variant="destructive" className="gap-1 text-xs font-bold">
                          <Flame className="h-3 w-3" />
                          ACUMULADO
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Concurso <span className="font-semibold text-foreground">{c.numero_concurso}</span>
                      </p>
                      {c.data_sorteio && (
                        <p className="text-sm flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="capitalize">{formatDataSorteio(c.data_sorteio)}</span>
                        </p>
                      )}
                    </div>

                    {premio > 0 && (
                      <div className="pt-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          Prêmio estimado
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {formatCurrency(premio)}
                        </p>
                      </div>
                    )}

                    {c.updated_at && (
                      <p className="text-[11px] text-muted-foreground/70">
                        Atualizado: {relativeUpdated(c.updated_at)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
