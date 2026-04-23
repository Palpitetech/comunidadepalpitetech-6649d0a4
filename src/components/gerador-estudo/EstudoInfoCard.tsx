import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, AlertTriangle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { EstudoDisponivel } from "@/hooks/useEstudosDisponiveis";
import { labelDataRelativa } from "@/lib/dateLabel";

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

function montarLinhaResumo(estudo: EstudoDisponivel): string {
  const partes: string[] = [];
  partes.push(estudo.eh_futuro ? "Próximo" : "Já realizado");
  if (estudo.proximo_concurso != null) partes.push(String(estudo.proximo_concurso));
  const dataLabel = labelDataRelativa(estudo.data_sorteio);
  if (dataLabel) partes.push(dataLabel);
  return partes.join(" · ");
}

export function EstudoInfoCard({ estudo }: Props) {
  const temaLabel = (estudo.tema_estudo && TEMA_LABEL[estudo.tema_estudo]) || "Estudo da Comunidade";
  const dataLabel = labelDataRelativa(estudo.data_sorteio);
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
              variant={estudo.eh_futuro ? "default" : "destructive"}
              className="text-[10px]"
            >
              {montarLinhaResumo(estudo)}
            </Badge>
          )}
        </div>

        {estudo.recomendacao_direta && (
          <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-2">
            {estudo.recomendacao_direta}
          </p>
        )}

        {estudo.slug && (
          <Link
            to={`/comunidade/post/${estudo.slug}`}
            className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            Ver estudo completo
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}

        {!estudo.eh_futuro && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
            <p className="text-[11px] text-destructive leading-relaxed">
              Este estudo é para um concurso já realizado{dataLabel ? ` (${dataLabel})` : ""}. Os palpites gerados são apenas para fins de estudo e comparação.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

