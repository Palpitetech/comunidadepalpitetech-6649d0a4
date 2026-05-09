// Helpers da Aula 01 — dezenas de cada subdivisão do volante.
// Usado pelos slides de "Top dezenas por linha/coluna/quadrante/mini-quadrante".



/** 6 linhas de 10 dezenas. */
export const DEZENAS_LINHA: Record<number, number[]> = {
  1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  2: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  3: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
  4: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
  5: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
  6: [51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
};

/** 10 colunas de 6 dezenas. Coluna N = {N, N+10, N+20, N+30, N+40, N+50}. */
export const DEZENAS_COLUNA: Record<number, number[]> = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => {
    const c = i + 1;
    return [c, [c, c + 10, c + 20, c + 30, c + 40, c + 50]];
  }),
);

/** 4 quadrantes de 15 dezenas (3 linhas × 5 colunas). */
export const DEZENAS_QUADRANTE: Record<number, number[]> = {
  1: [1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 21, 22, 23, 24, 25],
  2: [6, 7, 8, 9, 10, 16, 17, 18, 19, 20, 26, 27, 28, 29, 30],
  3: [31, 32, 33, 34, 35, 41, 42, 43, 44, 45, 51, 52, 53, 54, 55],
  4: [36, 37, 38, 39, 40, 46, 47, 48, 49, 50, 56, 57, 58, 59, 60],
};

/**
 * Mini-quadrantes da Aula 01 — 15 blocos de 4 dezenas cada.
 * Volante 6×10 dividido em 3 bandas de linhas (1-2, 3-4, 5-6)
 * × 5 bandas de colunas (1-2, 3-4, 5-6, 7-8, 9-10) = 15 mini-quadrantes.
 */
export const DEZENAS_MINI: Record<number, number[]> = (() => {
  const out: Record<number, number[]> = {};
  let mq = 1;
  for (let bandaLinha = 0; bandaLinha < 3; bandaLinha++) {
    for (let bandaCol = 0; bandaCol < 5; bandaCol++) {
      const linhaTop = bandaLinha * 2 + 1; // 1, 3, 5
      const colEsq = bandaCol * 2 + 1; // 1, 3, 5, 7, 9
      const base1 = (linhaTop - 1) * 10; // 0, 20, 40
      const base2 = linhaTop * 10; // 10, 30, 50
      out[mq] = [
        base1 + colEsq,
        base1 + colEsq + 1,
        base2 + colEsq,
        base2 + colEsq + 1,
      ];
      mq++;
    }
  }
  return out;
})();

