// =============================================================================
// Configuração das loterias suportadas pelo Disparo em Grupo.
// Centraliza slug do banco, tag de postagem, hub no site (UTM),
// quantidade padrão de dezenas e janela de análise estatística.
// =============================================================================

export type BlastLoteria = "lotofacil" | "megasena";

export interface BlastLotteryConfig {
  /** Slug usado em resultados_loterias.loteria e nos motores deterministícos */
  slug: BlastLoteria;
  /** Rótulo amigável para mensagens */
  label: string;
  /** Valor exato gravado em postagens.loteria_tag */
  loteriaTag: string;
  /** Quantidade padrão de dezenas por jogo */
  qtdDezenas: number;
  /** Janela de concursos analisados pelo motor */
  periodoAnalise: number;
  /** Caminho público do hub da loteria (usado no link UTM) */
  hubPath: string;
  /** Sufixo curto para chaves UTM */
  utmContent: string;
}

export const BLAST_LOTTERIES: Record<BlastLoteria, BlastLotteryConfig> = {
  lotofacil: {
    slug: "lotofacil",
    label: "Lotofácil",
    loteriaTag: "Lotofácil",
    qtdDezenas: 15,
    periodoAnalise: 5,
    hubPath: "/lotofacil",
    utmContent: "lotofacil",
  },
  megasena: {
    slug: "megasena",
    label: "Mega-Sena",
    loteriaTag: "Mega-Sena",
    qtdDezenas: 6,
    periodoAnalise: 10,
    hubPath: "/mega-sena",
    utmContent: "megasena",
  },
};

export function getBlastLotteryConfig(loteria: string | undefined | null): BlastLotteryConfig {
  const key = (loteria as BlastLoteria) ?? "lotofacil";
  return BLAST_LOTTERIES[key] ?? BLAST_LOTTERIES.lotofacil;
}
