import { type EstrategiaFechamentoUI } from "@/types/fechamento";

// Alias para compatibilidade
type EstrategiaFechamento = EstrategiaFechamentoUI;

interface FechamentoRulesCardProps {
  estrategia: EstrategiaFechamento;
}

export function FechamentoRulesCard({ estrategia }: FechamentoRulesCardProps) {
  const temFixas = estrategia.fixasObrigatorias > 0;
  const qtdFixas = estrategia.fixasObrigatorias;
  const totalVariaveis = estrategia.dezenas - qtdFixas;
  
  // Variáveis usadas por jogo = dezenas por jogo - fixas
  const variaveisNoJogo = 15 - qtdFixas; // 15 é dezenasPorJogo

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        O <strong className="text-foreground font-semibold">{estrategia.nome}</strong> tem as seguintes regras:
      </p>
      
      <ol className="space-y-2 text-sm text-foreground list-decimal list-inside leading-relaxed">
        <li>Selecione <strong>{estrategia.dezenas} dezenas</strong></li>
        <li>
          {temFixas 
            ? <>Fixe <strong>{qtdFixas} dezena{qtdFixas > 1 ? "s" : ""}</strong> obrigatoriamente</>
            : <>Não temos fixas obrigatórias no {estrategia.nome}</>
          }
        </li>
        <li>
          {temFixas ? (
            <>
              Você vai ter <strong>garantia de {estrategia.garantia} pontos</strong> caso venha acertar{" "}
              <strong>{variaveisNoJogo} de {totalVariaveis} variáveis</strong> +{" "}
              <strong>{qtdFixas} das {qtdFixas} fixas</strong>
            </>
          ) : (
            <>
              Você vai ter <strong>garantia de {estrategia.garantia} pontos</strong>{" "}
              caso venha acertar {estrategia.condicao.toLowerCase()}
            </>
          )}
        </li>
        <li>Serão gerados <strong>{estrategia.jogos} jogos</strong> de 15 dezenas</li>
      </ol>
    </div>
  );
}
