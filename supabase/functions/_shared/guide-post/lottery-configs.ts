// =============================================================================
// Configurações numéricas por loteria.
// A tag visual (loteria_tag) e o slug (loteria) são fontes únicas de verdade.
// =============================================================================

export interface LotteryConfig {
  /** Slug usado em consultas a resultados_loterias e post_schedules */
  loteria: string;
  /** Tag de exibição salva em postagens.loteria_tag */
  loteria_tag: string;
  /** Quantidade total de dezenas no volante */
  total_dezenas: number;
  /** Quantidade de dezenas sorteadas por concurso */
  dezenas_por_sorteio: number;
  /** Janela de concursos analisados nos posts */
  periodo_analise: number;
}

export const LOTTERY_CONFIGS: Record<string, LotteryConfig> = {
  lotofacil: {
    loteria: "lotofacil",
    loteria_tag: "Lotofácil",
    total_dezenas: 25,
    dezenas_por_sorteio: 15,
    periodo_analise: 10,
  },
  megasena: {
    loteria: "megasena",
    loteria_tag: "Mega-Sena",
    total_dezenas: 60,
    dezenas_por_sorteio: 6,
    periodo_analise: 20,
  },
};

export function getConfig(loteria: string): LotteryConfig {
  const c = LOTTERY_CONFIGS[loteria];
  if (!c) throw new Error(`Config não cadastrada para loteria=${loteria}`);
  return c;
}
