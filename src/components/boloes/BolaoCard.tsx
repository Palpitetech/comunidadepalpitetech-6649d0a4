import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type BolaoPublico,
  LOTERIA_LABELS,
  LOTERIA_BADGE_COLORS,
  getProgressColor,
  getStatusBadgeProps,
  formatBolaoDate,
  formatBolaoCurrency,
} from "@/lib/boloes";

interface BolaoCardProps {
  bolao: BolaoPublico;
  onOpen: (bolao: BolaoPublico) => void;
}

export function BolaoCard({ bolao, onOpen }: BolaoCardProps) {
  const cotasDisp = bolao.total_cotas - (bolao.cotas_vendidas || 0);
  const pct = Math.round(((bolao.cotas_vendidas || 0) / bolao.total_cotas) * 100);
  const esgotado = cotasDisp <= 0;
  const statusBadge = getStatusBadgeProps(bolao.status || "");

  return (
    <Card
      className="cursor-pointer hover:bg-muted/30 transition-colors border-border/60"
      onClick={() => onOpen(bolao)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Row 1: badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={LOTERIA_BADGE_COLORS[bolao.loteria] || ""}>
            {LOTERIA_LABELS[bolao.loteria] || bolao.loteria}
          </Badge>
          {statusBadge && <Badge variant="outline" className={statusBadge.className}>{statusBadge.label}</Badge>}
        </div>

        {/* Row 2: code & concurso */}
        <div>
          <p className="text-base font-bold">{bolao.codigo}</p>
          <p className="text-xs text-muted-foreground">
            {LOTERIA_LABELS[bolao.loteria] || bolao.loteria} — Concurso {bolao.concurso_numero}
          </p>
        </div>

        {/* Row 3: info */}
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Sorteio: {formatBolaoDate(bolao.data_concurso)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>
              Cotas: <strong className={esgotado ? "text-destructive" : ""}>{cotasDisp}/{bolao.total_cotas}</strong>
              {esgotado && " — Esgotado"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground shrink-0">💰</span>
            <span><strong className="text-primary">{formatBolaoCurrency(bolao.valor_cota)}</strong> por cota</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", getProgressColor(pct))} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground text-right">{pct}% vendido</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); onOpen(bolao); }}>
            Ver Estratégia
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs"
            disabled={bolao.status !== "ativo" || esgotado}
            onClick={(e) => { e.stopPropagation(); onOpen(bolao); }}
          >
            {esgotado ? "Esgotado" : "Adquirir Cota"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
