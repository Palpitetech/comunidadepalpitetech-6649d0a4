// =============================================================================
// Cálculo de estatísticas comuns para todos os geradores.
// Espelha o que cada motor calculava localmente.
// =============================================================================

export interface ResultadoRow {
  concurso?: number;
  concurso_id?: number;
  data_sorteio: string;
  dezenas: number[];
  qtd_pares: number | null;
  qtd_impares: number | null;
  qtd_moldura: number | null;
  qtd_primos: number | null;
  qtd_repetidas: number | null;
  ciclo_numero: number | null;
  dezenas_faltantes_ciclo: number[] | null;
}

export interface EstatisticasJanela {
  total: number;
  ultimoConcurso: number;
  ultimoSorteio: number[];
  dezenasFaltantesCiclo: number[];
  cicloAtual: number | null;
  frequencias: Record<number, number>;
  dezenasMaisFrequentes: number[];   // top 10
  dezenasMenosFrequentes: number[];  // bottom 10
  mediaPares: number;
  mediaMoldura: number;
  mediaPrimos: number;
  mediaRepetidas: number;
}

export function calcularEstatisticas(
  resultados: ResultadoRow[],
  totalDezenas: number,
): EstatisticasJanela {
  const frequencias: Record<number, number> = {};
  for (let i = 1; i <= totalDezenas; i++) frequencias[i] = 0;

  for (const r of resultados) {
    for (const d of r.dezenas) {
      if (d >= 1 && d <= totalDezenas) frequencias[d]++;
    }
  }

  const sortedByFreq = Object.entries(frequencias)
    .map(([d, c]) => ({ d: parseInt(d), c }))
    .sort((a, b) => b.c - a.c);

  const dezenasMaisFrequentes = sortedByFreq.slice(0, 10).map((x) => x.d);
  const dezenasMenosFrequentes = sortedByFreq.slice(-10).map((x) => x.d).reverse();

  const ultimoResultado = resultados[0];
  const ultimoConcurso = (ultimoResultado?.concurso ?? ultimoResultado?.concurso_id ?? 0) as number;

  const n = resultados.length || 1;
  return {
    total: resultados.length,
    ultimoConcurso,
    ultimoSorteio: ultimoResultado?.dezenas || [],
    dezenasFaltantesCiclo: ultimoResultado?.dezenas_faltantes_ciclo || [],
    cicloAtual: ultimoResultado?.ciclo_numero ?? null,
    frequencias,
    dezenasMaisFrequentes,
    dezenasMenosFrequentes,
    mediaPares: resultados.reduce((s, r) => s + (r.qtd_pares || 0), 0) / n,
    mediaMoldura: resultados.reduce((s, r) => s + (r.qtd_moldura || 0), 0) / n,
    mediaPrimos: resultados.reduce((s, r) => s + (r.qtd_primos || 0), 0) / n,
    mediaRepetidas: resultados.reduce((s, r) => s + (r.qtd_repetidas || 0), 0) / n,
  };
}
