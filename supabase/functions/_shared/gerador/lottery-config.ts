// =============================================================================
// Configuração canônica de cada loteria suportada pelos motores de geração.
// Centralizada para garantir consistência entre /gerador-* e /gerador-estudo.
// =============================================================================

export interface LotteryConfig {
  /** Slug usado em `resultados_loterias.loteria` */
  loteriaDb: string;
  /** Total de dezenas no universo (1..total) */
  total: number;
  /** Min/Max de dezenas que o usuário pode escolher por jogo */
  sorteadasMin: number;
  sorteadasMax: number;
  /** Quantidade padrão se o cliente não enviar */
  defaultDezenas: number;
  /** Dezenas que compõem a moldura do volante (para filtros e estatísticas) */
  moldura: number[];
  /** Primos no universo da loteria */
  primos: number[];
  /** Rótulo bonito para UI/logs */
  label: string;
}

const PRIMOS_GERAL = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47,
  53, 59, 61, 67, 71, 73, 79,
];

function primosAteN(n: number): number[] {
  return PRIMOS_GERAL.filter((p) => p <= n);
}

export const LOTTERY_CONFIG: Record<string, LotteryConfig> = {
  lotofacil: {
    loteriaDb: "lotofacil",
    total: 25,
    sorteadasMin: 15,
    sorteadasMax: 20,
    defaultDezenas: 15,
    moldura: [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25],
    primos: primosAteN(25),
    label: "Lotofácil",
  },
  megasena: {
    loteriaDb: "megasena",
    total: 60,
    sorteadasMin: 6,
    sorteadasMax: 15,
    defaultDezenas: 6,
    moldura: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
    ],
    primos: primosAteN(60),
    label: "Mega-Sena",
  },
  quina: {
    loteriaDb: "quina",
    total: 80,
    sorteadasMin: 5,
    sorteadasMax: 15,
    defaultDezenas: 5,
    // Moldura aproximada (1ª/última linha + colunas extremas) — usada apenas para filtros visuais
    moldura: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
    ],
    primos: primosAteN(80),
    label: "Quina",
  },
  duplasena: {
    loteriaDb: "duplasena",
    total: 50,
    sorteadasMin: 6,
    sorteadasMax: 15,
    defaultDezenas: 6,
    moldura: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
    ],
    primos: primosAteN(50),
    label: "Dupla Sena",
  },
};

export function getLotteryConfig(loteria: string): LotteryConfig | null {
  return LOTTERY_CONFIG[loteria] ?? null;
}

export function clampQtdDezenas(loteria: string, qtd: number | undefined): number {
  const cfg = LOTTERY_CONFIG[loteria];
  if (!cfg) return qtd ?? 0;
  const v = Number(qtd) || cfg.defaultDezenas;
  return Math.min(Math.max(v, cfg.sorteadasMin), cfg.sorteadasMax);
}
