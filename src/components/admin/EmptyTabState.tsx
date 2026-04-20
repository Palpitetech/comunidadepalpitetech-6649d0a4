import { Button } from "@/components/ui/button";
import { CalendarRange, Inbox } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmptyTabStateProps {
  /** O que estamos procurando (ex: "bot", "usuário", "ferramenta"). */
  what: string;
  /** Início do período atualmente filtrado (YYYY-MM-DD). */
  startDate: string;
  /** Fim do período atualmente filtrado (YYYY-MM-DD). */
  endDate: string;
  /** Data ISO da última atividade existente fora do filtro (ou null se nunca). */
  lastActivity: string | null;
  /** Texto auxiliar (ex: "12 chamadas no total"). */
  lastActivitySuffix?: string;
  /** Callback acionado pelo botão "Ver últimos 30 dias". */
  onExpand30Days: () => void;
  /** Callback opcional para ir até o dia da última atividade. */
  onJumpToLastActivity?: () => void;
}

/**
 * Empty state inteligente: avisa o usuário quando não há dados no período filtrado
 * mas existem dados em outro período, oferecendo atalhos para ampliar o intervalo.
 */
export function EmptyTabState({
  what,
  startDate,
  endDate,
  lastActivity,
  lastActivitySuffix,
  onExpand30Days,
  onJumpToLastActivity,
}: EmptyTabStateProps) {
  const formattedStart = format(new Date(startDate + "T00:00:00"), "dd/MM", { locale: ptBR });
  const formattedEnd = format(new Date(endDate + "T00:00:00"), "dd/MM", { locale: ptBR });

  // Sem nenhuma atividade no banco: não há para onde ampliar
  if (!lastActivity) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <Inbox className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="font-medium">Nenhum {what} consumiu tokens ainda</p>
          <p className="text-xs text-muted-foreground mt-1">
            Quando houver atividade, ela aparecerá aqui.
          </p>
        </div>
      </div>
    );
  }

  const lastActivityDate = new Date(lastActivity);
  const formattedLast = format(lastActivityDate, "dd/MM/yyyy", { locale: ptBR });
  const daysSince = differenceInDays(new Date(), lastActivityDate);
  const daysSinceLabel =
    daysSince === 0 ? "hoje" : daysSince === 1 ? "ontem" : `há ${daysSince} dias`;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
      <Inbox className="h-10 w-10 text-muted-foreground/50" />
      <div className="max-w-md space-y-1">
        <p className="font-medium">
          Nenhum {what} consumiu tokens entre {formattedStart} e {formattedEnd}
        </p>
        <p className="text-sm text-muted-foreground">
          Última atividade: <span className="font-medium text-foreground">{formattedLast}</span>{" "}
          ({daysSinceLabel})
          {lastActivitySuffix ? ` · ${lastActivitySuffix}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="sm" variant="default" onClick={onExpand30Days} className="gap-2">
          <CalendarRange className="h-4 w-4" />
          Ver últimos 30 dias
        </Button>
        {onJumpToLastActivity && (
          <Button size="sm" variant="outline" onClick={onJumpToLastActivity} className="gap-2">
            Ir para {formattedLast}
          </Button>
        )}
      </div>
    </div>
  );
}
