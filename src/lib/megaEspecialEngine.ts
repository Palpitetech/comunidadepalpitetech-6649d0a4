/**
 * MEGA ESPECIAL ENGINE — Núcleo determinístico
 *
 * Esta é a ÚNICA fonte de cálculo dos 15 estudos da Mega 30 Anos.
 * Slides de gravação (admin) e tabelas do hub público (/mega-30) consomem
 * EXATAMENTE estas funções. Mesma entrada → mesma saída.
 *
 * A IA NUNCA calcula. Ela recebe o JSON `EstudoResultado` pronto e apenas
 * gera narrativa em cima dele.
 */

import {
  getLinha,
  getColuna,
  getQuadrante,
  contarPorLinha,
  contarPorColuna,
  contarPorQuadrante,
  contarPares,
  contarMoldura,
  calcularSoma,
  contarSequencias,
  contarRepetidas,
  formatarDezena,
} from "./megasena";

// =============================================================================
// VERSIONAMENTO
// =============================================================================

/** Versão da engine. Bump em qualquer mudança que altere resultados. */
export const ENGINE_VERSION = "mega30.v1.0.0";

// =============================================================================
// TIPOS BASE
// =============================================================================

export interface ConcursoMega {
  concurso: number;
  data_sorteio: string; // ISO yyyy-mm-dd
  dezenas: number[]; // 6 dezenas, 1..60
}

export type Agrupamento =
  | "dezena"
  | "linha"
  | "coluna"
  | "quadrante"
  | "mini";

export type PeriodoTipo =
  | "total"
  | "ano"
  | "mes"
  | "semestre"
  | "virada";

export interface PeriodoFiltro {
  tipo: PeriodoTipo;
  /** ano (1996..), mes (1..12), semestre (1|2). Ignorado em 'total' e 'virada'. */
  valor?: number;
}

export interface RankingItem {
  /** Identificador (numero da dezena, linha 1..6, coluna 1..10, quadrante 1..4, mini 1..16) */
  chave: number;
  /** Rótulo legível ("01", "Linha 3", "MQ4") */
  label: string;
  /** Frequência absoluta no recorte */
  freq: number;
  /** Posição no ranking (1 = mais sorteado) */
  posicao: number;
}

export interface EstudoResultadoMeta {
  totalConcursos: number;
  periodoLabel: string;
  engineVersion: string;
}

export interface EstudoResultado {
  estudoId: string;
  agrupamento: Agrupamento;
  periodo: PeriodoFiltro;
  topN: number;
  ranking: RankingItem[];
  meta: EstudoResultadoMeta;
}

// =============================================================================
// MINI-QUADRANTES (16) — DEFINIÇÃO ÚNICA
// =============================================================================

/**
 * Cada quadrante grande (15 dezenas, 3 linhas × 5 colunas) é dividido em 4:
 *
 * Regra:
 *  - Eixo vertical: topo (2 linhas superiores do quadrante) × base (1 linha inferior)
 *  - Eixo horizontal: esquerda (2 colunas) × direita (3 colunas)
 *
 * Resultado: 16 mini-quadrantes (4 por quadrante).
 *
 * Mapa explícito (auditável):
 *  Q1 (01-05, 11-15, 21-25)
 *    MQ1  = topo-esq:    01,02, 11,12
 *    MQ2  = topo-dir:    03,04,05, 13,14,15
 *    MQ3  = base-esq:    21,22
 *    MQ4  = base-dir:    23,24,25
 *  Q2 (06-10, 16-20, 26-30)
 *    MQ5  = topo-esq:    06,07, 16,17
 *    MQ6  = topo-dir:    08,09,10, 18,19,20
 *    MQ7  = base-esq:    26,27
 *    MQ8  = base-dir:    28,29,30
 *  Q3 (31-35, 41-45, 51-55)
 *    MQ9  = topo-esq:    31,32, 41,42
 *    MQ10 = topo-dir:    33,34,35, 43,44,45
 *    MQ11 = base-esq:    51,52
 *    MQ12 = base-dir:    53,54,55
 *  Q4 (36-40, 46-50, 56-60)
 *    MQ13 = topo-esq:    36,37, 46,47
 *    MQ14 = topo-dir:    38,39,40, 48,49,50
 *    MQ15 = base-esq:    56,57
 *    MQ16 = base-dir:    58,59,60
 */
export const MINI_QUADRANTES: Record<number, number[]> = {
  1: [1, 2, 11, 12],
  2: [3, 4, 5, 13, 14, 15],
  3: [21, 22],
  4: [23, 24, 25],
  5: [6, 7, 16, 17],
  6: [8, 9, 10, 18, 19, 20],
  7: [26, 27],
  8: [28, 29, 30],
  9: [31, 32, 41, 42],
  10: [33, 34, 35, 43, 44, 45],
  11: [51, 52],
  12: [53, 54, 55],
  13: [36, 37, 46, 47],
  14: [38, 39, 40, 48, 49, 50],
  15: [56, 57],
  16: [58, 59, 60],
};

const _miniLookup: number[] = (() => {
  const arr = new Array(61).fill(0);
  for (const [mqStr, dezenas] of Object.entries(MINI_QUADRANTES)) {
    const mq = Number(mqStr);
    for (const d of dezenas) arr[d] = mq;
  }
  return arr;
})();

/** Retorna o mini-quadrante (1..16) de uma dezena. */
export function getMiniQuadrante(dezena: number): number {
  return _miniLookup[dezena] ?? 0;
}

// =============================================================================
// FILTRO DE PERÍODO
// =============================================================================

/**
 * Mega da Virada acontece em concursos de virada de ano (28-31 dezembro).
 * Detectamos por mês 12 + dia >= 28 para evitar dependência de tabela auxiliar.
 */
function isMegaDaVirada(data: string): boolean {
  // data: yyyy-mm-dd
  const [_, mes, dia] = data.split("-").map(Number);
  return mes === 12 && dia >= 28;
}

export function filtrarConcursos(
  concursos: ConcursoMega[],
  periodo: PeriodoFiltro,
): ConcursoMega[] {
  if (periodo.tipo === "total") return concursos;

  if (periodo.tipo === "virada") {
    return concursos.filter((c) => isMegaDaVirada(c.data_sorteio));
  }

  return concursos.filter((c) => {
    const dt = new Date(c.data_sorteio + "T00:00:00");
    if (periodo.tipo === "ano") return dt.getFullYear() === periodo.valor;
    if (periodo.tipo === "mes") return dt.getMonth() + 1 === periodo.valor;
    if (periodo.tipo === "semestre") {
      const m = dt.getMonth() + 1;
      const sem = m <= 6 ? 1 : 2;
      return sem === periodo.valor;
    }
    return true;
  });
}

export function periodoLabel(periodo: PeriodoFiltro): string {
  switch (periodo.tipo) {
    case "total":
      return "30 anos completos";
    case "ano":
      return `Ano ${periodo.valor}`;
    case "mes": {
      const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
      ];
      return `Mês de ${meses[(periodo.valor ?? 1) - 1]}`;
    }
    case "semestre":
      return periodo.valor === 1 ? "1º Semestre" : "2º Semestre";
    case "virada":
      return "Mega da Virada (todos os anos)";
  }
}

// =============================================================================
// CONTAGEM POR AGRUPAMENTO
// =============================================================================

function contarAgrupamento(
  concursos: ConcursoMega[],
  agrupamento: Agrupamento,
): Map<number, number> {
  const counts = new Map<number, number>();

  for (const c of concursos) {
    for (const d of c.dezenas) {
      let chave: number;
      switch (agrupamento) {
        case "dezena":
          chave = d;
          break;
        case "linha":
          chave = getLinha(d);
          break;
        case "coluna":
          chave = getColuna(d);
          break;
        case "quadrante":
          chave = getQuadrante(d);
          break;
        case "mini":
          chave = getMiniQuadrante(d);
          break;
      }
      counts.set(chave, (counts.get(chave) ?? 0) + 1);
    }
  }

  return counts;
}

function labelDe(agrupamento: Agrupamento, chave: number): string {
  switch (agrupamento) {
    case "dezena":
      return formatarDezena(chave);
    case "linha":
      return `Linha ${chave}`;
    case "coluna":
      return `Coluna ${chave}`;
    case "quadrante":
      return `Q${chave}`;
    case "mini":
      return `MQ${chave}`;
  }
}

// =============================================================================
// API PRINCIPAL — calcularEstudo
// =============================================================================

export interface CalcularEstudoParams {
  estudoId: string;
  agrupamento: Agrupamento;
  periodo: PeriodoFiltro;
  topN?: number;
  /** Filtro adicional: restringir dezenas a uma sub-zona (ex: só dezenas da linha 3) */
  restringirA?: number[];
}

export function calcularEstudo(
  concursos: ConcursoMega[],
  params: CalcularEstudoParams,
): EstudoResultado {
  const topN = params.topN ?? 15;
  const filtrados = filtrarConcursos(concursos, params.periodo);

  let counts = contarAgrupamento(filtrados, params.agrupamento);

  if (params.restringirA && params.agrupamento === "dezena") {
    const allowed = new Set(params.restringirA);
    counts = new Map(Array.from(counts).filter(([k]) => allowed.has(k)));
  }

  const ranking: RankingItem[] = Array.from(counts.entries())
    .map(([chave, freq]) => ({ chave, freq }))
    .sort((a, b) => b.freq - a.freq || a.chave - b.chave)
    .slice(0, topN)
    .map((item, i) => ({
      chave: item.chave,
      label: labelDe(params.agrupamento, item.chave),
      freq: item.freq,
      posicao: i + 1,
    }));

  return {
    estudoId: params.estudoId,
    agrupamento: params.agrupamento,
    periodo: params.periodo,
    topN,
    ranking,
    meta: {
      totalConcursos: filtrados.length,
      periodoLabel: periodoLabel(params.periodo),
      engineVersion: ENGINE_VERSION,
    },
  };
}

// =============================================================================
// HELPERS DE ALTO NÍVEL — usados pelos slides existentes
// =============================================================================

/** Top N dezenas em todos os concursos. */
export function topDezenasGeral(
  concursos: ConcursoMega[],
  topN = 15,
): EstudoResultado {
  return calcularEstudo(concursos, {
    estudoId: "01-geral",
    agrupamento: "dezena",
    periodo: { tipo: "total" },
    topN,
  });
}

/** Top N dezenas por mês (1..12). Retorna mapa mes → resultado. */
export function topDezenasPorMes(
  concursos: ConcursoMega[],
  topN = 15,
): Record<number, EstudoResultado> {
  const out: Record<number, EstudoResultado> = {};
  for (let m = 1; m <= 12; m++) {
    out[m] = calcularEstudo(concursos, {
      estudoId: `01-mes-${m}`,
      agrupamento: "dezena",
      periodo: { tipo: "mes", valor: m },
      topN,
    });
  }
  return out;
}

/** Top N dezenas por ano. */
export function topDezenasPorAno(
  concursos: ConcursoMega[],
  topN = 15,
): Record<number, EstudoResultado> {
  const anos = new Set<number>();
  for (const c of concursos) {
    anos.add(new Date(c.data_sorteio + "T00:00:00").getFullYear());
  }
  const out: Record<number, EstudoResultado> = {};
  for (const ano of Array.from(anos).sort((a, b) => a - b)) {
    out[ano] = calcularEstudo(concursos, {
      estudoId: `01-ano-${ano}`,
      agrupamento: "dezena",
      periodo: { tipo: "ano", valor: ano },
      topN,
    });
  }
  return out;
}

/** Top N dezenas por semestre. */
export function topDezenasPorSemestre(
  concursos: ConcursoMega[],
  topN = 15,
): { primeiro: EstudoResultado; segundo: EstudoResultado } {
  return {
    primeiro: calcularEstudo(concursos, {
      estudoId: "01-sem-1",
      agrupamento: "dezena",
      periodo: { tipo: "semestre", valor: 1 },
      topN,
    }),
    segundo: calcularEstudo(concursos, {
      estudoId: "01-sem-2",
      agrupamento: "dezena",
      periodo: { tipo: "semestre", valor: 2 },
      topN,
    }),
  };
}

/** Lista ordenada de anos presentes na base. */
export function listarAnos(concursos: ConcursoMega[]): number[] {
  const anos = new Set<number>();
  for (const c of concursos) {
    anos.add(new Date(c.data_sorteio + "T00:00:00").getFullYear());
  }
  return Array.from(anos).sort((a, b) => a - b);
}

// =============================================================================
// AGREGADOS PARA OS DEMAIS ESTUDOS (10..14)
// =============================================================================

export interface ParImparPorAno {
  ano: number;
  pares: number;
  impares: number;
}

export function paridadePorAno(concursos: ConcursoMega[]): ParImparPorAno[] {
  const map = new Map<number, { pares: number; impares: number }>();
  for (const c of concursos) {
    const ano = new Date(c.data_sorteio + "T00:00:00").getFullYear();
    const p = contarPares(c.dezenas);
    const i = c.dezenas.length - p;
    const cur = map.get(ano) ?? { pares: 0, impares: 0 };
    cur.pares += p;
    cur.impares += i;
    map.set(ano, cur);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([ano, v]) => ({ ano, ...v }));
}

export interface MolduraCentroPorAno {
  ano: number;
  moldura: number;
  centro: number;
}

export function molduraCentroPorAno(
  concursos: ConcursoMega[],
): MolduraCentroPorAno[] {
  const map = new Map<number, { moldura: number; centro: number }>();
  for (const c of concursos) {
    const ano = new Date(c.data_sorteio + "T00:00:00").getFullYear();
    const m = contarMoldura(c.dezenas);
    const cen = c.dezenas.length - m;
    const cur = map.get(ano) ?? { moldura: 0, centro: 0 };
    cur.moldura += m;
    cur.centro += cen;
    map.set(ano, cur);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([ano, v]) => ({ ano, ...v }));
}

export interface FaixaSomaItem {
  faixa: string; // "60-100", "101-150", ...
  freq: number;
}

const FAIXAS_SOMA = [
  { min: 60, max: 100, label: "60-100" },
  { min: 101, max: 150, label: "101-150" },
  { min: 151, max: 200, label: "151-200" },
  { min: 201, max: 250, label: "201-250" },
  { min: 251, max: 300, label: "251-300" },
  { min: 301, max: 360, label: "301-360" },
];

export function distribuicaoSoma(concursos: ConcursoMega[]): FaixaSomaItem[] {
  const counts = FAIXAS_SOMA.map((f) => ({ ...f, freq: 0 }));
  for (const c of concursos) {
    const s = calcularSoma(c.dezenas);
    const faixa = counts.find((f) => s >= f.min && s <= f.max);
    if (faixa) faixa.freq++;
  }
  return counts.map(({ label, freq }) => ({ faixa: label, freq }));
}

export interface RepeticaoItem {
  qtdRepetidas: number; // 0..6
  freq: number;
}

export function distribuicaoRepeticoes(
  concursos: ConcursoMega[],
): RepeticaoItem[] {
  const counts = new Map<number, number>();
  const ordenados = [...concursos].sort((a, b) => a.concurso - b.concurso);
  for (let i = 1; i < ordenados.length; i++) {
    const r = contarRepetidas(ordenados[i].dezenas, ordenados[i - 1].dezenas);
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  return Array.from({ length: 7 }, (_, q) => ({
    qtdRepetidas: q,
    freq: counts.get(q) ?? 0,
  }));
}

export interface SequenciaItem {
  qtdSequencias: number; // 0..5
  freq: number;
}

export function distribuicaoSequencias(
  concursos: ConcursoMega[],
): SequenciaItem[] {
  const counts = new Map<number, number>();
  for (const c of concursos) {
    const s = contarSequencias(c.dezenas);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return Array.from({ length: 6 }, (_, q) => ({
    qtdSequencias: q,
    freq: counts.get(q) ?? 0,
  }));
}

// Re-export para conveniência dos consumidores
export {
  contarPorLinha,
  contarPorColuna,
  contarPorQuadrante,
  formatarDezena,
};
