import { type EstrategiaFechamentoUI } from "@/types/fechamento";

// Alias para compatibilidade
type EstrategiaFechamento = EstrategiaFechamentoUI;

interface FechamentoRulesCardProps {
  estrategia: EstrategiaFechamento;
}

export function FechamentoRulesCard({ estrategia }: FechamentoRulesCardProps) {
  const temFixas = estrategia.fixasObrigatorias > 0;
  const qtdFixas = estrategia.fixasObrigatorias;
  const qtdVariaveis = estrategia.dezenas - qtdFixas;
  
  // Para garantia, precisamos acertar 15 números (dezenasPorJogo)
  // Se tem fixas: precisa acertar X das variáveis + todas as fixas
  const acertosNecessarios = 15; // dezenas por jogo
  const acertosVariaveis = acertosNecessarios - qtdFixas;

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
              <strong>{acertosNecessarios} números</strong> de{" "}
              <strong>{acertosVariaveis} variáveis</strong> + <strong>{qtdFixas} fixas</strong> das {qtdFixas} fixas
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
