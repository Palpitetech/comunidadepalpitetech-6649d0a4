// =============================================================================
// Tipos compartilhados do motor de posts-guia (Augusto Angelis e futuras personas)
// =============================================================================

export interface Concurso {
  concurso_id: number;
  dezenas: number[];
  data_sorteio: string;
  ciclo_numero: number | null;
  dezenas_faltantes_ciclo: number[] | null;
  qtd_pares: number;
  qtd_impares: number;
  qtd_repetidas: number;
  qtd_primos: number;
  qtd_moldura: number;
}

export interface CicloHistorico {
  ciclo_numero: number;
  duracao: number;
}

export interface Fatos {
  resumo: string;
  recomendacaoDireta: string;
  extras?: { totalCiclos?: number };
}

/**
 * Estrutura canônica usada pelo gerador de palpites a partir de estudo.
 * Persistida em postagens.fatos_snapshot.base_geracao.
 *
 * Convenções:
 *   - fixar: dezenas que entram em 100% dos jogos (núcleo)
 *   - apoio: dezenas que entram em ≥60% dos jogos (cota mínima por jogo)
 *   - excluir: dezenas que NÃO entram em nenhum jogo
 *   - ficar_de_olho: 1 ou 2 podem entrar como coringa em alguns jogos
 *   - ultimo_sorteio: para validar `qtd_repetidas_alvo`
 *   - qtd_repetidas_alvo / qtd_moldura_alvo: filtros opcionais por jogo
 */
export interface BaseGeracao {
  tema: string;
  fixar: number[];
  apoio: number[];
  excluir: number[];
  ficar_de_olho?: number[];
  ultimo_sorteio?: number[];
  qtd_repetidas_alvo?: { min: number; max: number };
  qtd_moldura_alvo?: { min: number; max: number };
  observacao_principal: string;
  /** Texto curto descrevendo o motivo do núcleo (vai pro card). */
  motivo_fixar?: string;
  motivo_apoio?: string;
  motivo_excluir?: string;
}

/**
 * Contrato que toda loteria precisa cumprir para gerar posts-guia.
 * A camada HTTP (generate-guide-post/index.ts) só conhece esta interface,
 * tornando trivial adicionar Mega-Sena/Quina/etc no futuro.
 */
export interface GuideEngine {
  /** Identificador da loteria (ex.: "lotofacil"). */
  loteria: string;
  /** Lista os tipos de post que esta engine sabe gerar. */
  tiposSuportados(): string[];
  /** Calcula fatos determinísticos a partir do histórico. */
  montarFatos(
    tipoPost: string,
    concursos: Concurso[],
    historicoCiclos?: CicloHistorico[],
  ): Fatos;
  /** Constrói o título determinístico para o post. */
  montarTituloDeterministico(tipoPost: string, proxConcurso: number): string;
  /** Constrói o prompt do usuário para a IA. */
  montarPrompt(
    tipoPost: string,
    fatos: Fatos,
    ultimoConcurso: number,
  ): string;
  /** Calcula o limite de caracteres do conteúdo final. */
  limiteConteudo(tipoPost: string): number;
  /** Conjunto de números permitidos no texto (whitelist anti-alucinação). */
  extrairNumerosPermitidos(
    concursos: Concurso[],
    proxConcurso: number,
    extras?: { totalCiclos?: number },
  ): Set<number>;
  /** Validador de números fora da whitelist. */
  validarConteudoNumerico(
    texto: string,
    permitidos: Set<number>,
  ): { ok: boolean; motivo?: string };
  /** Gera conteúdo determinístico quando IA falha. */
  fallbackConteudo(fatos: Fatos): string;
  /** Sanitiza menções a IA, espaçamentos, etc. */
  sanitizar(texto: string): string;
  /**
   * Extrai a base canônica de geração de palpites a partir do histórico.
   * Opcional — engines que não implementarem fazem o gerador cair no
   * caminho default (universo livre).
   */
  extrairBaseGeracao?(
    tipoPost: string,
    concursos: Concurso[],
    historicoCiclos?: CicloHistorico[],
  ): BaseGeracao | null;
}
