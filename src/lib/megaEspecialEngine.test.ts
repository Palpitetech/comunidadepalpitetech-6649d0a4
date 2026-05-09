import { describe, it, expect } from "vitest";
import {
  ENGINE_VERSION,
  MINI_QUADRANTES,
  getMiniQuadrante,
  filtrarConcursos,
  calcularEstudo,
  topDezenasGeral,
  paridadePorAno,
  molduraCentroPorAno,
  distribuicaoSoma,
  distribuicaoRepeticoes,
  distribuicaoSequencias,
  type ConcursoMega,
} from "./megaEspecialEngine";

// Base sintética determinística
const base: ConcursoMega[] = [
  { concurso: 1, data_sorteio: "1996-03-11", dezenas: [4, 5, 30, 33, 41, 52] },
  { concurso: 2, data_sorteio: "1996-03-18", dezenas: [9, 37, 39, 41, 43, 49] },
  { concurso: 3, data_sorteio: "2000-12-30", dezenas: [3, 4, 7, 12, 41, 60] }, // virada
  { concurso: 4, data_sorteio: "2010-07-15", dezenas: [1, 2, 3, 4, 5, 6] },
  { concurso: 5, data_sorteio: "2024-12-31", dezenas: [10, 20, 30, 40, 50, 60] }, // virada
  { concurso: 6, data_sorteio: "2024-01-10", dezenas: [11, 22, 33, 44, 55, 60] },
];

describe("ENGINE_VERSION", () => {
  it("expõe versão estável", () => {
    expect(ENGINE_VERSION).toMatch(/^mega30\./);
  });
});

describe("MINI_QUADRANTES", () => {
  it("cobre todas as 60 dezenas exatamente uma vez", () => {
    const todas = Object.values(MINI_QUADRANTES).flat();
    expect(todas).toHaveLength(60);
    expect(new Set(todas).size).toBe(60);
    for (let d = 1; d <= 60; d++) {
      expect(getMiniQuadrante(d)).toBeGreaterThan(0);
      expect(getMiniQuadrante(d)).toBeLessThanOrEqual(16);
    }
  });

  it("mapeia exemplos do diagrama", () => {
    expect(getMiniQuadrante(1)).toBe(1);
    expect(getMiniQuadrante(15)).toBe(2);
    expect(getMiniQuadrante(25)).toBe(4);
    expect(getMiniQuadrante(60)).toBe(16);
    expect(getMiniQuadrante(31)).toBe(9);
  });
});

describe("filtrarConcursos", () => {
  it("filtra por ano", () => {
    expect(filtrarConcursos(base, { tipo: "ano", valor: 1996 })).toHaveLength(2);
  });
  it("filtra por mês (todos os anos)", () => {
    expect(filtrarConcursos(base, { tipo: "mes", valor: 12 })).toHaveLength(2);
  });
  it("filtra por semestre", () => {
    expect(filtrarConcursos(base, { tipo: "semestre", valor: 1 })).toHaveLength(3);
    expect(filtrarConcursos(base, { tipo: "semestre", valor: 2 })).toHaveLength(3);
  });
  it("filtra Mega da Virada", () => {
    const v = filtrarConcursos(base, { tipo: "virada" });
    expect(v.map((c) => c.concurso).sort()).toEqual([3, 5]);
  });
  it("'total' devolve tudo", () => {
    expect(filtrarConcursos(base, { tipo: "total" })).toHaveLength(base.length);
  });
});

describe("calcularEstudo — dezenas", () => {
  it("ranking determinístico, dezenas 04 e 41 empatam em 3x (desempate por menor)", () => {
    const r = topDezenasGeral(base, 5);
    // 04 aparece em c1, c3, c4 = 3x; 41 aparece em c1, c2, c3 = 3x.
    // Desempate por chave ascendente → 04 lidera.
    expect(r.ranking[0]).toEqual(
      expect.objectContaining({ chave: 4, freq: 3, posicao: 1, label: "04" }),
    );
    expect(r.ranking[1]).toEqual(
      expect.objectContaining({ chave: 41, freq: 3, posicao: 2 }),
    );
    expect(r.meta.engineVersion).toBe(ENGINE_VERSION);
    expect(r.meta.totalConcursos).toBe(6);
  });

  it("desempate por dezena ascendente", () => {
    const r = topDezenasGeral(base, 60);
    // varias dezenas com freq=1 — devem aparecer em ordem crescente
    const freq1 = r.ranking.filter((it) => it.freq === 1).map((it) => it.chave);
    const sorted = [...freq1].sort((a, b) => a - b);
    expect(freq1).toEqual(sorted);
  });
});

describe("calcularEstudo — agrupamentos", () => {
  it("linhas: 6 chaves possíveis", () => {
    const r = calcularEstudo(base, {
      estudoId: "test-linhas",
      agrupamento: "linha",
      periodo: { tipo: "total" },
      topN: 6,
    });
    expect(r.ranking.every((i) => i.chave >= 1 && i.chave <= 6)).toBe(true);
  });
  it("colunas: 10 chaves possíveis", () => {
    const r = calcularEstudo(base, {
      estudoId: "test-cols",
      agrupamento: "coluna",
      periodo: { tipo: "total" },
      topN: 10,
    });
    expect(r.ranking.every((i) => i.chave >= 1 && i.chave <= 10)).toBe(true);
  });
  it("quadrantes: 4 chaves possíveis", () => {
    const r = calcularEstudo(base, {
      estudoId: "test-q",
      agrupamento: "quadrante",
      periodo: { tipo: "total" },
      topN: 4,
    });
    expect(r.ranking.every((i) => i.chave >= 1 && i.chave <= 4)).toBe(true);
  });
  it("mini-quadrantes: 16 chaves possíveis", () => {
    const r = calcularEstudo(base, {
      estudoId: "test-mq",
      agrupamento: "mini",
      periodo: { tipo: "total" },
      topN: 16,
    });
    expect(r.ranking.every((i) => i.chave >= 1 && i.chave <= 16)).toBe(true);
  });
});

describe("agregadores", () => {
  it("paridadePorAno soma 6 dezenas/concurso", () => {
    const agg = paridadePorAno(base);
    for (const a of agg) {
      // pares + impares deve ser múltiplo de 6
      expect((a.pares + a.impares) % 6).toBe(0);
    }
  });
  it("molduraCentroPorAno soma 6 dezenas/concurso", () => {
    const agg = molduraCentroPorAno(base);
    for (const a of agg) {
      expect((a.moldura + a.centro) % 6).toBe(0);
    }
  });
  it("distribuicaoSoma cobre faixas 60-360 (concursos fora ficam de fora)", () => {
    const agg = distribuicaoSoma(base);
    const total = agg.reduce((acc, f) => acc + f.freq, 0);
    // concurso 4 (1+2+3+4+5+6=21) fica fora das faixas
    expect(total).toBe(base.length - 1);
  });
  it("distribuicaoRepeticoes tem 7 buckets (0..6)", () => {
    const agg = distribuicaoRepeticoes(base);
    expect(agg).toHaveLength(7);
    const total = agg.reduce((acc, r) => acc + r.freq, 0);
    expect(total).toBe(base.length - 1);
  });
  it("distribuicaoSequencias tem 6 buckets", () => {
    const agg = distribuicaoSequencias(base);
    expect(agg).toHaveLength(6);
    expect(agg.reduce((a, x) => a + x.freq, 0)).toBe(base.length);
  });
});
