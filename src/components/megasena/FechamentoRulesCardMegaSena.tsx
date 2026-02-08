import type { EstrategiaFechamentoMegaSenaUI } from "@/lib/fechamentoMegaSena";

interface FechamentoRulesCardMegaSenaProps {
  estrategia: EstrategiaFechamentoMegaSenaUI;
}

export function FechamentoRulesCardMegaSena({ estrategia }: FechamentoRulesCardMegaSenaProps) {
  const temFixas = estrategia.fixasObrigatorias > 0;
  const qtdFixas = estrategia.fixasObrigatorias;
  const totalVariaveis = estrategia.dezenas - qtdFixas;
  
  // Variáveis usadas por jogo = 6 (Mega Sena sempre tem 6 números por jogo)
  const variaveisNoJogo = 6 - qtdFixas;

  // Descrição customizada da garantia por estratégia
  const renderGarantia = () => {
    // Estratégias com fixas (quando houver no futuro)
    if (temFixas) {
      return (
        <>
          Você vai ter <strong>garantia de {estrategia.garantia} pontos</strong> caso venha acertar{" "}
          <strong>{variaveisNoJogo} de {totalVariaveis} variáveis</strong> +{" "}
          <strong>{qtdFixas} das {qtdFixas} fixas</strong>
        </>
      );
    }
    
    // Estratégias sem fixas
    const nomeGarantia = 
      estrategia.garantia === 6 ? "SENA" : 
      estrategia.garantia === 5 ? "QUINA" : 
      "QUADRA";
    
    return (
      <>
        Você vai ter <strong>garantia de {nomeGarantia}</strong>{" "}
        caso venha acertar <strong>{estrategia.condicao.toLowerCase()}</strong>
      </>
    );
  };

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
        <li>{renderGarantia()}</li>
        <li>Serão gerados <strong>{estrategia.jogos} jogos</strong> de 6 dezenas</li>
      </ol>
    </div>
  );
}
