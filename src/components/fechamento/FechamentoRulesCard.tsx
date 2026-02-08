import { EstrategiaFechamento } from "./EstrategiaFechamentoSelector";

interface FechamentoRulesCardProps {
  estrategia: EstrategiaFechamento;
}

export function FechamentoRulesCard({ estrategia }: FechamentoRulesCardProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        O fechamento <strong className="text-foreground font-semibold">{estrategia.nome}</strong> tem as seguintes regras:
      </p>
      
      <ol className="space-y-2 text-sm text-foreground list-decimal list-inside leading-relaxed">
        <li>Selecione {estrategia.dezenas} números + Fixas (opcional)</li>
        <li>Clique em Gerar</li>
        <li>Garantia: {estrategia.garantia} pontos</li>
        <li>{estrategia.condicao}</li>
      </ol>
    </div>
  );
}
