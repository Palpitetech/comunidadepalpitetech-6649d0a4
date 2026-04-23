import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, AlertTriangle } from "lucide-react";
import type { EstudoDisponivel } from "@/hooks/useEstudosDisponiveis";

interface Props {
  estudo: EstudoDisponivel;
}

const TEMA_LABEL: Record<string, string> = {
  analise_moldura: "Análise da Moldura",
  analise_moldura_megasena: "Análise da Moldura",
  analise_repetidas: "Repetidas do Concurso Anterior",
  analise_movimentacao: "Movimentação das Dezenas",
  analise_quentes: "Dezenas Quentes",
  analise_frias: "Dezenas Frias",
  analise_ciclo: "Ciclo de Dezenas",
};

export function EstudoInfoCard({ estudo }: Props) {
  const temaLabel = (estudo.tema_estudo && TEMA_LABEL[estudo.tema_estudo]) || "Estudo da Comunidade";
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-start gap-2">
          <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
              Estudo selecionado
            </p>
            <p className="text-sm font-semibold text-foreground line-clamp-2">
              {estudo.titulo || "Estudo"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px]">{temaLabel}</Badge>
          <Badge variant="outline" className="text-[10px]">{estudo.loteria_tag}</Badge>
          {estudo.proximo_concurso !== null && (
            <Badge
              variant="outline"
              className={
                estudo.eh_futuro
                  ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400 text-[10px]"
                  : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400 text-[10px]"
              }
            >
              Concurso {estudo.proximo_concurso}
            </Badge>
          )}
        </div>

        {estudo.recomendacao_direta && (
          <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-2">
            {estudo.recomendacao_direta}
          </p>
        )}

        {!estudo.eh_futuro && (
          <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 p-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
              Este estudo é para um concurso já realizado. Os palpites gerados são apenas para fins de estudo e comparação.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
