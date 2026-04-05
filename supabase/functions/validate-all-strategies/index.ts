import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VALIDATE-ALL-STRATEGIES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Edge function que valida TODAS as estratégias de fechamento (FC01-FC07)
 * contra resultados históricos de concursos da Lotofácil.
 * 
 * USO:
 *   POST /validate-all-strategies
 *   Body: { quantidade?: 30 }
 * 
 * RETORNA:
 *   - Relatório completo de cada estratégia
 *   - Taxa de sucesso por estratégia
 *   - Ranking de estratégias por performance
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface MatrizFechamento {
  id: string;
  nome: string;
  dezenas: number;
  garantia: number;
  dezenasPorJogo: number;
  fixasObrigatorias: number;
  condicao: string;
  matrizRemocoes: number[][];
}

interface StrategyTestResult {
  concurso: number;
  melhor_acerto: number;
  garantia_cumprida: boolean;
}

interface StrategyReport {
  nome: string;
  id: string;
  dezenas: number;
  jogos: number;
  garantia: number;
  fixas: number;
  condicao: string;
  total_testes: number;
  sucessos: number;
  falhas: number;
  taxa_sucesso: string;
  taxa_sucesso_num: number;
  distribuicao_acertos: Record<number, number>;
  melhor_resultado: StrategyTestResult | null;
  pior_resultado: StrategyTestResult | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFINIÇÃO DE TODAS AS MATRIZES FC01-FC07
// ═══════════════════════════════════════════════════════════════════════════════

const MATRIZES: Record<string, MatrizFechamento> = {
  FC01: {
    id: "16-14-4",
    nome: "FC01",
    dezenas: 16,
    garantia: 14,
    dezenasPorJogo: 15,
    fixasObrigatorias: 0,
    condicao: "Acertar 15 das 16 dezenas",
    matrizRemocoes: [
      [15],
      [14],
      [13],
      [12],
    ],
  },
  FC02: {
    id: "17-14-8",
    nome: "FC02",
    dezenas: 17,
    garantia: 14,
    dezenasPorJogo: 15,
    fixasObrigatorias: 0,
    condicao: "Acertar 15 das 17 dezenas",
    matrizRemocoes: [
      [15, 16],
      [13, 14],
      [10, 12],
      [8, 9],
      [6, 7],
      [4, 5],
      [1, 2],
      [0, 14],
    ],
  },
  FC03: {
    id: "19-14-6",
    nome: "FC03",
    dezenas: 19,
    garantia: 14,
    dezenasPorJogo: 15,
    fixasObrigatorias: 13,
    condicao: "Acertar todas as 13 fixas + 2+ variáveis",
    matrizRemocoes: [
      [15, 16, 17, 18],
      [13, 16, 17, 18],
      [13, 14, 17, 18],
      [13, 14, 15, 18],
      [13, 14, 15, 16],
      [14, 15, 16, 17],
    ],
  },
  FC04: {
    id: "21-14-7",
    nome: "FC04",
    dezenas: 21,
    garantia: 14,
    dezenasPorJogo: 15,
    fixasObrigatorias: 14,
    condicao: "Acertar 13+ das 14 fixas + 2+ variáveis",
    matrizRemocoes: [
      [15, 16, 17, 18, 19, 20],
      [14, 16, 17, 18, 19, 20],
      [14, 15, 17, 18, 19, 20],
      [14, 15, 16, 18, 19, 20],
      [14, 15, 16, 17, 19, 20],
      [14, 15, 16, 17, 18, 20],
      [14, 15, 16, 17, 18, 19],
    ],
  },
  FC05: {
    id: "20-14-350",
    nome: "FC05",
    dezenas: 20,
    garantia: 14,
    dezenasPorJogo: 15,
    fixasObrigatorias: 0,
    condicao: "Acertar 15 das 20 dezenas (probabilístico)",
    matrizRemocoes: generateFC05Matrix(),
  },
  FC06: {
    id: "18-14-24",
    nome: "FC06",
    dezenas: 18,
    garantia: 14,
    dezenasPorJogo: 15,
    fixasObrigatorias: 0,
    condicao: "Acertar 15 das 18 dezenas",
    matrizRemocoes: [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [9, 10, 11],
      [12, 13, 14],
      [15, 16, 17],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [9, 12, 15],
      [10, 13, 16],
      [11, 14, 17],
      [0, 4, 8],
      [1, 5, 6],
      [2, 3, 7],
      [9, 13, 17],
      [10, 14, 15],
      [11, 12, 16],
      [0, 5, 7],
      [1, 3, 8],
      [2, 4, 6],
      [9, 14, 16],
      [10, 12, 17],
      [11, 13, 15],
    ],
  },
  FC07: {
    id: "25-15-11",
    nome: "FC07",
    dezenas: 25,
    garantia: 15,
    dezenasPorJogo: 15,
    fixasObrigatorias: 14,
    condicao: "Acertar todas as 14 fixas + 1+ variável",
    matrizRemocoes: [
      [15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
      [14, 16, 17, 18, 19, 20, 21, 22, 23, 24],
      [14, 15, 17, 18, 19, 20, 21, 22, 23, 24],
      [14, 15, 16, 18, 19, 20, 21, 22, 23, 24],
      [14, 15, 16, 17, 19, 20, 21, 22, 23, 24],
      [14, 15, 16, 17, 18, 20, 21, 22, 23, 24],
      [14, 15, 16, 17, 18, 19, 21, 22, 23, 24],
      [14, 15, 16, 17, 18, 19, 20, 22, 23, 24],
      [14, 15, 16, 17, 18, 19, 20, 21, 23, 24],
      [14, 15, 16, 17, 18, 19, 20, 21, 22, 24],
      [14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    ],
  },
};

/**
 * Gera a matriz FC05 (350 jogos) - Simplificada para esta validação
 */
function generateFC05Matrix(): number[][] {
  // FC05 usa uma matriz de 350 jogos otimizada
  // Para simplificar, geramos todas as C(20,5) = 15504 combinações e pegamos 350
  const matriz: number[][] = [];
  
  // Abordagem: usar blocos estruturados para cobertura
  // Bloco 1: Consecutivos (0-4, 5-9, 10-14, 15-19)
  for (let i = 0; i <= 15; i++) {
    matriz.push([i, i+1, i+2, i+3, i+4].filter(x => x < 20));
  }
  
  // Bloco 2: Saltos de 4
  for (let start = 0; start < 4; start++) {
    const removal: number[] = [];
    for (let j = 0; j < 5; j++) {
      const idx = (start + j * 4) % 20;
      if (!removal.includes(idx)) removal.push(idx);
    }
    if (removal.length === 5) matriz.push(removal);
  }
  
  // Bloco 3: Combinações sistemáticas
  for (let a = 0; a < 16; a++) {
    for (let b = a + 1; b < 17; b++) {
      for (let c = b + 1; c < 18; c++) {
        for (let d = c + 1; d < 19; d++) {
          for (let e = d + 1; e < 20; e++) {
            if (matriz.length < 350) {
              matriz.push([a, b, c, d, e]);
            }
          }
        }
      }
    }
  }
  
  return matriz.slice(0, 350);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE VALIDAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Gera jogos a partir da matriz de remoções e dezenas selecionadas
 */
function gerarJogos(dezenas: number[], matriz: MatrizFechamento): number[][] {
  return matriz.matrizRemocoes.map((remocoes) => {
    return dezenas.filter((_, idx) => !remocoes.includes(idx));
  });
}

/**
 * Conta acertos entre um jogo e um sorteio
 */
function contarAcertos(jogo: number[], sorteio: number[]): number {
  return jogo.filter((d) => sorteio.includes(d)).length;
}

/**
 * Gera dezenas de teste baseado na estratégia e no sorteio
 * 
 * SIMULAÇÃO REALISTA:
 * - Para estratégias sem fixas: simula acertar X das Y dezenas
 * - Para estratégias com fixas: simula acertar N fixas + M variáveis
 */
function gerarDezenasSimuladas(
  matriz: MatrizFechamento,
  sorteio: number[]
): { dezenas: number[]; condicaoAtendida: boolean } {
  const todasDezenas = Array.from({ length: 25 }, (_, i) => i + 1);
  const dezenasForaSorteio = todasDezenas.filter((n) => !sorteio.includes(n));
  
  if (matriz.fixasObrigatorias === 0) {
    // Estratégias sem fixas (FC01, FC02, FC05, FC06)
    // Simula o cenário onde usuário acerta X das Y selecionadas
    const dezenasNecessarias = matriz.dezenas;
    const errosPermitidos = dezenasNecessarias - 15;
    
    // Pega 15 do sorteio + (dezenas - 15) de fora
    const extras = dezenasForaSorteio.slice(0, dezenasNecessarias - 15);
    const dezenas = [...sorteio, ...extras].sort((a, b) => a - b);
    
    // Verifica se condição é atendida (acertou 15 das dezenas selecionadas)
    const acertosNaSelecao = dezenas.filter((d) => sorteio.includes(d)).length;
    const condicaoAtendida = acertosNaSelecao >= 15;
    
    return { dezenas: dezenas.slice(0, dezenasNecessarias), condicaoAtendida };
  } else {
    // Estratégias com fixas (FC03, FC04, FC07)
    const numFixas = matriz.fixasObrigatorias;
    const numVariaveis = matriz.dezenas - numFixas;
    
    // Simula: fixas = todas acertadas, variáveis = misto
    // Pega fixas do sorteio e variáveis mistas
    const fixas = sorteio.slice(0, numFixas);
    
    // Variáveis: algumas do sorteio, algumas de fora
    const restantesSorteio = sorteio.slice(numFixas);
    const variaveisSorteio = restantesSorteio.slice(0, Math.min(2, restantesSorteio.length));
    const variaveisFora = dezenasForaSorteio.slice(0, numVariaveis - variaveisSorteio.length);
    const variaveis = [...variaveisSorteio, ...variaveisFora].slice(0, numVariaveis);
    
    const dezenas = [...fixas, ...variaveis].sort((a, b) => a - b);
    
    // Verifica condição específica
    let condicaoAtendida = false;
    const fixasAcertadas = fixas.filter((d) => sorteio.includes(d)).length;
    const variaveisAcertadas = variaveis.filter((d) => sorteio.includes(d)).length;
    
    if (matriz.nome === "FC03") {
      // FC03: 13 fixas + 2+ variáveis
      condicaoAtendida = fixasAcertadas === 13 && variaveisAcertadas >= 2;
    } else if (matriz.nome === "FC04") {
      // FC04: 13+ fixas + 2+ variáveis
      condicaoAtendida = fixasAcertadas >= 13 && variaveisAcertadas >= 2;
    } else if (matriz.nome === "FC07") {
      // FC07: 14 fixas + 1+ variável
      condicaoAtendida = fixasAcertadas === 14 && variaveisAcertadas >= 1;
    }
    
    return { dezenas, condicaoAtendida };
  }
}

/**
 * Testa uma estratégia contra um resultado histórico
 */
function testarEstrategia(
  matriz: MatrizFechamento,
  dezenas: number[],
  sorteio: number[]
): { melhorAcerto: number; distribuicao: Record<number, number> } {
  const jogos = gerarJogos(dezenas, matriz);
  
  const distribuicao: Record<number, number> = {};
  let melhorAcerto = 0;
  
  jogos.forEach((jogo) => {
    const acertos = contarAcertos(jogo, sorteio);
    distribuicao[acertos] = (distribuicao[acertos] || 0) + 1;
    if (acertos > melhorAcerto) {
      melhorAcerto = acertos;
    }
  });
  
  return { melhorAcerto, distribuicao };
}

/**
 * Valida uma estratégia contra múltiplos resultados históricos
 */
function validarEstrategia(
  matriz: MatrizFechamento,
  resultados: { concurso_id: number; dezenas: number[] }[]
): StrategyReport {
  let sucessos = 0;
  let falhas = 0;
  const distribuicaoGlobal: Record<number, number> = {};
  let melhorResultado: StrategyTestResult | null = null;
  let piorResultado: StrategyTestResult | null = null;
  
  for (const resultado of resultados) {
    const sorteio = [...resultado.dezenas].sort((a, b) => a - b);
    
    // Gera dezenas simuladas
    const { dezenas, condicaoAtendida } = gerarDezenasSimuladas(matriz, sorteio);
    
    // Só conta para estatísticas se a condição foi atendida
    if (!condicaoAtendida) {
      continue;
    }
    
    // Testa estratégia
    const { melhorAcerto, distribuicao } = testarEstrategia(matriz, dezenas, sorteio);
    
    // Agrega distribuição
    for (const [acertos, count] of Object.entries(distribuicao)) {
      const key = parseInt(acertos);
      distribuicaoGlobal[key] = (distribuicaoGlobal[key] || 0) + count;
    }
    
    const garantiaCumprida = melhorAcerto >= matriz.garantia;
    
    if (garantiaCumprida) {
      sucessos++;
    } else {
      falhas++;
    }
    
    const testResult: StrategyTestResult = {
      concurso: resultado.concurso_id,
      melhor_acerto: melhorAcerto,
      garantia_cumprida: garantiaCumprida,
    };
    
    if (!melhorResultado || melhorAcerto > melhorResultado.melhor_acerto) {
      melhorResultado = testResult;
    }
    
    if (!piorResultado || melhorAcerto < piorResultado.melhor_acerto) {
      piorResultado = testResult;
    }
  }
  
  const totalTestes = sucessos + falhas;
  const taxaSucesso = totalTestes > 0 ? (sucessos / totalTestes) * 100 : 0;
  
  return {
    nome: matriz.nome,
    id: matriz.id,
    dezenas: matriz.dezenas,
    jogos: matriz.matrizRemocoes.length,
    garantia: matriz.garantia,
    fixas: matriz.fixasObrigatorias,
    condicao: matriz.condicao,
    total_testes: totalTestes,
    sucessos,
    falhas,
    taxa_sucesso: `${taxaSucesso.toFixed(2)}%`,
    taxa_sucesso_num: taxaSucesso,
    distribuicao_acertos: Object.fromEntries(
      Object.entries(distribuicaoGlobal).sort(
        (a, b) => parseInt(b[0]) - parseInt(a[0])
      )
    ),
    melhor_resultado: melhorResultado,
    pior_resultado: piorResultado,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER DA EDGE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body = await req.json().catch(() => ({}));
    const { quantidade = 30, estrategias } = body;

    console.log(`[validate-all] Iniciando validação em ${quantidade} concursos`);

    // Fetch historical results
    const { data: resultados, error } = await supabase
      .from("resultados_loterias")
.eq("loteria", "lotofacil")
.select("concurso_id:concurso, data_sorteio, dezenas")
      .order("concurso", { ascending: false })
      .limit(quantidade);

    if (error) {
      throw new Error(`Erro ao buscar resultados: ${error.message}`);
    }

    if (!resultados?.length) {
      return new Response(
        JSON.stringify({ error: "Nenhum resultado encontrado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[validate-all] ${resultados.length} resultados carregados`);

    // Determina quais estratégias testar
    const estrategiasParaTestar = estrategias && estrategias.length > 0
      ? estrategias.filter((e: string) => MATRIZES[e])
      : Object.keys(MATRIZES);

    const reports: StrategyReport[] = [];

    for (const estrategiaNome of estrategiasParaTestar) {
      const matriz = MATRIZES[estrategiaNome];
      console.log(`[validate-all] Testando ${matriz.nome}...`);
      
      const report = validarEstrategia(matriz, resultados);
      reports.push(report);
      
      console.log(`[validate-all] ${matriz.nome}: ${report.taxa_sucesso} (${report.sucessos}/${report.total_testes})`);
    }

    // Ordena por taxa de sucesso (maior primeiro)
    reports.sort((a, b) => b.taxa_sucesso_num - a.taxa_sucesso_num);

    const summary = {
      titulo: "📊 Relatório de Validação de Estratégias de Fechamento",
      total_concursos: resultados.length,
      data_inicio: resultados[resultados.length - 1]?.data_sorteio,
      data_fim: resultados[0]?.data_sorteio,
      estrategias_testadas: estrategiasParaTestar.length,
      ranking: reports.map((r, idx) => ({
        posicao: idx + 1,
        nome: r.nome,
        taxa_sucesso: r.taxa_sucesso,
        testes: r.total_testes,
        garantia: r.garantia,
        jogos: r.jogos,
      })),
      detalhes: reports,
      legenda: {
        taxa_sucesso: "Percentual de vezes que a garantia foi cumprida quando a condição foi atendida",
        total_testes: "Número de cenários onde a condição foi satisfeita",
        garantia: "Pontuação mínima garantida",
        condicao: "Pré-requisito para a garantia funcionar",
      },
      nota: "Simulação baseada em cenários onde o usuário atende a condição de cada estratégia",
    };

    console.log(`[validate-all] Validação completa: ${reports.length} estratégias testadas`);

    return new Response(JSON.stringify(summary, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[validate-all] Erro na validação:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
