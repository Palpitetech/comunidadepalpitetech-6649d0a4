import { EstrategiaFechamento } from "./EstrategiaFechamentoSelector";

interface FechamentoRulesCardProps {
  estrategia: EstrategiaFechamento;
}

export function FechamentoRulesCard({ estrategia }: FechamentoRulesCardProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        O fechamento <strong className="text-foreground">"{estrategia.id}"</strong> tem as seguintes regras:
      </p>
      
      <ol className="space-y-1 text-sm text-foreground list-decimal list-inside">
        <li>Selecione {estrategia.dezenas} números + Fixas (opcional)</li>
        <li>Clique em Gerar</li>
        <li>Garantia: {estrategia.garantia} pontos</li>
        <li>{estrategia.condicao}</li>
      </ol>
    </div>
  );
}
