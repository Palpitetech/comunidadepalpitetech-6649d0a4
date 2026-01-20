import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// CONSTANTES LOTOFÁCIL - ÚNICA VERDADE (replicadas do frontend)
// =============================================================================

const MOLDURA_LOTOFACIL = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
const PRIMOS_LOTOFACIL = [2, 3, 5, 7, 11, 13, 17, 19, 23];
const TOTAL_DEZENAS = 25;

// =============================================================================
// CORS HEADERS
// =============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// FUNÇÕES DE CÁLCULO
// =============================================================================

function calcularIndicadores(dezenas: number[], dezenasAnteriores?: number[]) {
  return {
    qtd_pares: dezenas.filter(d => d % 2 === 0).length,
    qtd_impares: dezenas.filter(d => d % 2 !== 0).length,
    qtd_moldura: dezenas.filter(d => MOLDURA_LOTOFACIL.includes(d)).length,
    qtd_primos: dezenas.filter(d => PRIMOS_LOTOFACIL.includes(d)).length,
    qtd_repetidas: dezenasAnteriores 
      ? dezenas.filter(d => dezenasAnteriores.includes(d)).length 
      : 0
  };
}

function calcularCiclo(
  dezenas: number[], 
  dezenasAnterioresFaltantes: number[] | null,
  cicloAnterior: number | null
): { ciclo_numero: number; dezenas_faltantes_ciclo: number[] } {
  
  // Se não houver ciclo anterior, inicia ciclo 1
  if (!dezenasAnterioresFaltantes || dezenasAnterioresFaltantes.length === 0) {
    const faltantes = Array.from({ length: TOTAL_DEZENAS }, (_, i) => i + 1)
      .filter(d => !dezenas.includes(d));
    
    const novoCiclo = (cicloAnterior || 0) + 1;
    console.log(`[CICLO] Iniciando ciclo ${novoCiclo} - ${faltantes.length} dezenas faltantes`);
    
    return { ciclo_numero: novoCiclo, dezenas_faltantes_ciclo: faltantes };
  }
  
  // Remove as dezenas sorteadas das faltantes
  const novasFaltantes = dezenasAnterioresFaltantes.filter(d => !dezenas.includes(d));
  
  // Se zerou, ciclo fechou
  if (novasFaltantes.length === 0) {
    console.log(`[CICLO] Ciclo ${cicloAnterior} FECHADO!`);
    const faltantes = Array.from({ length: TOTAL_DEZENAS }, (_, i) => i + 1)
      .filter(d => !dezenas.includes(d));
    return { ciclo_numero: (cicloAnterior || 0) + 1, dezenas_faltantes_ciclo: faltantes };
  }
  
  return { ciclo_numero: cicloAnterior || 1, dezenas_faltantes_ciclo: novasFaltantes };
}

function parseData(dataStr: string | undefined): string {
  if (!dataStr) {
    return new Date().toISOString().split('T')[0];
  }
  // DD/MM/YYYY -> YYYY-MM-DD
  if (dataStr.includes('/')) {
    const parts = dataStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  // YYYY-MM-DD já está ok
  if (dataStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dataStr.split('T')[0];
  }
  return dataStr;
}

// Extrair dezenas de diferentes formatos da API
function extrairDezenas(concurso: Record<string, unknown>): number[] {
  // Formato 1: array de strings ["01", "02", ...]
  if (Array.isArray(concurso.dezenas)) {
    return concurso.dezenas.map((d: string | number) => 
      typeof d === 'string' ? parseInt(d, 10) : d
    ).sort((a: number, b: number) => a - b);
  }
  
  // Formato 2: campos individuais numero_1, numero_2, etc
  const dezenas: number[] = [];
  for (let i = 1; i <= 15; i++) {
    const key = `numero_${i}`;
    if (concurso[key] !== undefined) {
      dezenas.push(Number(concurso[key]));
    }
  }
  if (dezenas.length > 0) {
    return dezenas.sort((a, b) => a - b);
  }
  
  // Formato 3: listaDezenas como string separada por vírgula ou array
  if (concurso.listaDezenas) {
    if (Array.isArray(concurso.listaDezenas)) {
      return (concurso.listaDezenas as (string | number)[]).map((d) => 
        typeof d === 'string' ? parseInt(d, 10) : d
      ).sort((a: number, b: number) => a - b);
    }
    if (typeof concurso.listaDezenas === 'string') {
      return concurso.listaDezenas.split(/[,\s-]+/).map((d: string) => parseInt(d.trim(), 10)).filter((n: number) => !isNaN(n)).sort((a: number, b: number) => a - b);
    }
  }
  
  return [];
}

// Extrair número do concurso
function extrairNumeroConcurso(concurso: Record<string, unknown>): number | null {
  if (typeof concurso.concurso === 'number') return concurso.concurso;
  if (typeof concurso.concurso === 'string') return parseInt(concurso.concurso, 10);
  if (typeof concurso.numero === 'number') return concurso.numero;
  if (typeof concurso.numero === 'string') return parseInt(concurso.numero, 10);
  if (typeof concurso.numero_concurso === 'number') return concurso.numero_concurso;
  if (typeof concurso.numero_concurso === 'string') return parseInt(concurso.numero_concurso, 10);
  return null;
}

// Extrair data do concurso
function extrairData(concurso: Record<string, unknown>): string {
  const campos = ['data', 'data_sorteio', 'dataApuracao', 'dataSorteio'];
  for (const campo of campos) {
    if (concurso[campo] && typeof concurso[campo] === 'string') {
      return parseData(concurso[campo] as string);
    }
  }
  return new Date().toISOString().split('T')[0];
}

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiToken = Deno.env.get('LOTOFACIL_API_TOKEN');

    if (!apiToken) {
      throw new Error('LOTOFACIL_API_TOKEN não configurado');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const concursoEspecifico = url.searchParams.get('concurso');
    const debug = url.searchParams.get('debug') === 'true';

    let apiUrl: string;
    if (concursoEspecifico && concursoEspecifico !== 'ultimos100') {
      apiUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=lotofacil&token=${apiToken}&concurso=${concursoEspecifico}`;
    } else {
      apiUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=lotofacil&token=${apiToken}&concurso=ultimos100`;
    }

    console.log(`[SYNC] Buscando dados da API...`);

    const apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok) {
      throw new Error(`API retornou erro: ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();
    
    // Log de debug para ver estrutura da API
    if (debug) {
      console.log(`[DEBUG] Estrutura da resposta:`, JSON.stringify(apiData).substring(0, 500));
    }
    
    // Normalizar para array
    let rawConcursos: Record<string, unknown>[];
    if (Array.isArray(apiData)) {
      rawConcursos = apiData;
    } else if (apiData && typeof apiData === 'object') {
      rawConcursos = [apiData];
    } else {
      throw new Error('Formato de resposta da API não reconhecido');
    }
    
    console.log(`[SYNC] ${rawConcursos.length} registros recebidos da API`);
    
    // Log do primeiro concurso para debug
    if (rawConcursos.length > 0 && debug) {
      console.log(`[DEBUG] Primeiro registro:`, JSON.stringify(rawConcursos[0]));
    }

    // Processar e filtrar concursos válidos
    const concursosProcessados: Array<{
      numero: number;
      data: string;
      dezenas: number[];
      raw: Record<string, unknown>;
    }> = [];

    for (const raw of rawConcursos) {
      const numero = extrairNumeroConcurso(raw);
      const dezenas = extrairDezenas(raw);
      
      if (numero && dezenas.length === 15) {
        concursosProcessados.push({
          numero,
          data: extrairData(raw),
          dezenas,
          raw
        });
      } else {
        console.log(`[WARN] Concurso inválido: numero=${numero}, dezenas=${dezenas.length}`);
      }
    }

    console.log(`[SYNC] ${concursosProcessados.length} concursos válidos para processar`);

    // Ordenar do mais antigo para o mais novo
    concursosProcessados.sort((a, b) => a.numero - b.numero);

    // Buscar último concurso salvo
    const { data: ultimoSalvo } = await supabase
      .from('resultados')
      .select('concurso_id, dezenas, dezenas_faltantes_ciclo, ciclo_numero')
      .order('concurso_id', { ascending: false })
      .limit(1)
      .single();

    let dezenasAnteriores: number[] | undefined = ultimoSalvo?.dezenas;
    let dezenasAnterioresFaltantes: number[] | null = ultimoSalvo?.dezenas_faltantes_ciclo || null;
    let cicloAtual: number | null = ultimoSalvo?.ciclo_numero || null;

    const resultados = {
      novos: 0,
      existentes: 0,
      erros: [] as Array<{ concurso: number; erro: string }>
    };

    for (let i = 0; i < concursosProcessados.length; i++) {
      const concurso = concursosProcessados[i];
      
      try {
        console.log(`[SYNC] Processando concurso ${concurso.numero} (${i + 1}/${concursosProcessados.length})`);

        // Verificar se já existe
        const { data: existente } = await supabase
          .from('resultados')
          .select('id')
          .eq('concurso_id', concurso.numero)
          .single();

        if (existente) {
          console.log(`[SYNC] Concurso ${concurso.numero} já existe, pulando...`);
          resultados.existentes++;
          
          const { data: dadosExistente } = await supabase
            .from('resultados')
            .select('dezenas, dezenas_faltantes_ciclo, ciclo_numero')
            .eq('concurso_id', concurso.numero)
            .single();
          
          if (dadosExistente) {
            dezenasAnteriores = dadosExistente.dezenas;
            dezenasAnterioresFaltantes = dadosExistente.dezenas_faltantes_ciclo;
            cicloAtual = dadosExistente.ciclo_numero;
          }
          continue;
        }

        const indicadores = calcularIndicadores(concurso.dezenas, dezenasAnteriores);
        const cicloInfo = calcularCiclo(concurso.dezenas, dezenasAnterioresFaltantes, cicloAtual);

        // Extrair premiação se disponível
        const raw = concurso.raw;
        let premiacao_json: Array<{ faixa: string; ganhadores: number; valor: number }> = [];
        let locais_ganhadores: Array<{ cidade: string; uf: string; ganhadores: number }> = [];
        let acumulou = false;
        let valor_estimado_proximo: number | null = null;
        let valor_acumulado_especial: number | null = null;
        let local_sorteio: string | null = null;

        // Tentar extrair premiação
        if (Array.isArray(raw.premiacoes)) {
          premiacao_json = (raw.premiacoes as Array<Record<string, unknown>>).map(p => ({
            faixa: `${p.acertos || p.faixa || ''} acertos`,
            ganhadores: Number(p.vencedores || p.ganhadores || 0),
            valor: parseFloat(String(p.premio || p.valor || 0))
          }));
        } else if (Array.isArray(raw.listaRateioPremio)) {
          premiacao_json = (raw.listaRateioPremio as Array<Record<string, unknown>>).map(p => ({
            faixa: `${p.descricaoFaixa || p.faixa || ''} acertos`,
            ganhadores: Number(p.numeroDeGanhadores || 0),
            valor: parseFloat(String(p.valorPremio || 0))
          }));
        }

        // Tentar extrair locais ganhadores
        if (Array.isArray(raw.estadosPremiados)) {
          locais_ganhadores = (raw.estadosPremiados as Array<Record<string, unknown>>).map(e => ({
            cidade: String(e.cidade || ''),
            uf: String(e.uf || ''),
            ganhadores: Number(e.vencedores || 0)
          }));
        } else if (Array.isArray(raw.listaMunicipioUFGanhadores)) {
          locais_ganhadores = (raw.listaMunicipioUFGanhadores as Array<Record<string, unknown>>).map(e => ({
            cidade: String(e.municipio || e.cidade || ''),
            uf: String(e.uf || ''),
            ganhadores: Number(e.ganhadores || 1)
          }));
        }

        // Outros campos
        if (typeof raw.acumulou === 'boolean') acumulou = raw.acumulou;
        if (typeof raw.acumulado === 'boolean') acumulou = raw.acumulado;
        if (raw.proximoValor) valor_estimado_proximo = Number(raw.proximoValor);
        if (raw.valorEstimadoProximoConcurso) valor_estimado_proximo = Number(raw.valorEstimadoProximoConcurso);
        if (raw.valorAcumuladoEspecial) valor_acumulado_especial = Number(raw.valorAcumuladoEspecial);
        if (raw.local) local_sorteio = String(raw.local);
        if (raw.localSorteio) local_sorteio = String(raw.localSorteio);

        const registro = {
          concurso_id: concurso.numero,
          data_sorteio: concurso.data,
          dezenas: concurso.dezenas,
          ...indicadores,
          ...cicloInfo,
          acumulou,
          valor_estimado_proximo,
          valor_acumulado_especial,
          premiacao_json,
          locais_ganhadores,
          local_sorteio
        };

        const { error: insertError } = await supabase
          .from('resultados')
          .insert(registro);

        if (insertError) {
          throw new Error(insertError.message);
        }

        console.log(`[SYNC] ✓ Concurso ${concurso.numero} inserido`);
        console.log(`       P:${indicadores.qtd_pares} I:${indicadores.qtd_impares} M:${indicadores.qtd_moldura} Pr:${indicadores.qtd_primos} R:${indicadores.qtd_repetidas}`);
        console.log(`       Ciclo ${cicloInfo.ciclo_numero} | Faltantes: ${cicloInfo.dezenas_faltantes_ciclo.length}`);

        resultados.novos++;

        dezenasAnteriores = concurso.dezenas;
        dezenasAnterioresFaltantes = cicloInfo.dezenas_faltantes_ciclo;
        cicloAtual = cicloInfo.ciclo_numero;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`[ERRO] Concurso ${concurso.numero}: ${errorMessage}`);
        resultados.erros.push({ concurso: concurso.numero, erro: errorMessage });
      }
    }

    console.log(`[SYNC] ========================================`);
    console.log(`[SYNC] Concluído! Novos: ${resultados.novos} | Existentes: ${resultados.existentes} | Erros: ${resultados.erros.length}`);
    console.log(`[SYNC] ========================================`);

    return new Response(
      JSON.stringify({ sucesso: true, ...resultados }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[ERRO FATAL] ${errorMessage}`);
    
    return new Response(
      JSON.stringify({ sucesso: false, erro: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
