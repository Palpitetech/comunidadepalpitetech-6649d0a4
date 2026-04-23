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
}
