import { EstrategiaFechamento } from "./EstrategiaFechamentoSelector";

interface FechamentoRulesCardProps {
  estrategia: EstrategiaFechamento;
}

export function FechamentoRulesCard({ estrategia }: FechamentoRulesCardProps) {
  // Por enquanto, nenhum fechamento tem fixas obrigatórias
  const temFixas = false;
  const qtdFixas = 0;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        O <strong className="text-foreground font-semibold">{estrategia.nome}</strong> tem as seguintes regras:
      </p>
      
      <ol className="space-y-2 text-sm text-foreground list-decimal list-inside leading-relaxed">
        <li>Selecione <strong>{estrategia.dezenas} dezenas</strong></li>
        <li>
          {temFixas 
            ? `Fixe ${qtdFixas} dezenas`
            : `Não temos fixas no ${estrategia.nome}`
          }
        </li>
        <li>Você vai ter <strong>garantia de {estrategia.garantia} pontos</strong> caso venha acertar {estrategia.condicao.toLowerCase()}</li>
        <li>Clique em "Gerar Fechamento"</li>
      </ol>
    </div>
  );
}
