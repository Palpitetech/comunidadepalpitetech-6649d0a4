// =============================================================================
// Motor determinístico de geração de jogos — extraído de generate-palpites-from-estudo.
// Usado por TODOS os geradores (estudo + lotofacil + mega + quina + dupla).
// =============================================================================

import type { BaseGeracao } from "../guide-post/types.ts";

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function intersecCount(a: number[], b: number[]): number {
  const set = new Set(a);
  let n = 0;
  for (const x of b) if (set.has(x)) n++;
  return n;
}

/** Distância de Hamming entre dois conjuntos (qtd em A não presentes em B). */
export function hamming(a: number[], b: number[]): number {
  const setB = new Set(b);
  let diff = 0;
  for (const x of a) if (!setB.has(x)) diff++;
  return diff;
}

export interface GerarJogoOpts {
  total: number;
  qtdDezenas: number;
  base: BaseGeracao;
  cotaApoioMin: number;
  jaGerados: number[][];
  /** Moldura para validar `qtd_moldura_alvo` (default Lotofácil). */
  moldura?: number[];
}

/**
 * Gera UM jogo respeitando: fixar (100%), apoio (cota mín),
 * excluir (0%), filtros opcionais e diversidade vs jaGerados.
 * Retorna `null` se não conseguir em 80 tentativas.
 */
export function gerarJogo(opts: GerarJogoOpts): number[] | null {
  const { total, qtdDezenas, base, cotaApoioMin, jaGerados, moldura } = opts;

  const fixarSet = new Set(base.fixar.filter((d) => d >= 1 && d <= total));
  const excluirSet = new Set(
    base.excluir.filter((d) => d >= 1 && d <= total && !fixarSet.has(d)),
  );
  const apoioPool = base.apoio.filter(
    (d) => d >= 1 && d <= total && !fixarSet.has(d) && !excluirSet.has(d),
  );
  const olhoPool = (base.ficar_de_olho || []).filter(
    (d) =>
      d >= 1
      && d <= total
      && !fixarSet.has(d)
      && !excluirSet.has(d)
      && !apoioPool.includes(d),
  );

  const universoLivre: number[] = [];
  for (let d = 1; d <= total; d++) {
    if (
      !fixarSet.has(d)
      && !excluirSet.has(d)
      && !apoioPool.includes(d)
      && !olhoPool.includes(d)
    ) {
      universoLivre.push(d);
    }
  }

  const espacoLivre = qtdDezenas - fixarSet.size;
  if (espacoLivre < 0) return null;

  const moldSetForCheck = moldura ? new Set(moldura) : null;

  const TENT_MAX = 80;
  for (let t = 0; t < TENT_MAX; t++) {
    const dezenas = new Set<number>(fixarSet);

    // 1) Apoio: cota mínima
    const cotaReal = Math.min(cotaApoioMin, apoioPool.length, espacoLivre);
    for (const d of shuffle(apoioPool).slice(0, cotaReal)) dezenas.add(d);

    // 2) Coringa olho: 0-1 com 50% de chance
    if (olhoPool.length > 0 && dezenas.size < qtdDezenas && Math.random() < 0.5) {
      const c = olhoPool[Math.floor(Math.random() * olhoPool.length)];
      dezenas.add(c);
    }

    // 3) Completar
    const restantes = [
      ...apoioPool.filter((d) => !dezenas.has(d)),
      ...universoLivre,
      ...olhoPool.filter((d) => !dezenas.has(d)),
    ];
    for (const d of shuffle(restantes)) {
      if (dezenas.size >= qtdDezenas) break;
      dezenas.add(d);
    }

    if (dezenas.size !== qtdDezenas) continue;
    const arr = Array.from(dezenas).sort((a, b) => a - b);

    // Validações
    if (
      base.qtd_repetidas_alvo
      && base.ultimo_sorteio
      && base.ultimo_sorteio.length > 0
    ) {
      const rep = intersecCount(arr, base.ultimo_sorteio);
      const { min, max } = base.qtd_repetidas_alvo;
      if (rep < min || rep > max) continue;
    }
    if (base.qtd_moldura_alvo && moldSetForCheck) {
      const qm = arr.filter((d) => moldSetForCheck.has(d)).length;
      const { min, max } = base.qtd_moldura_alvo;
      if (qm < min || qm > max) continue;
    }

    // Diversidade vs jogos já gerados (Hamming ≥ 3)
    let okDiv = true;
    for (const prev of jaGerados) {
      if (hamming(arr, prev) < 3) {
        okDiv = false;
        break;
      }
    }
    if (!okDiv) continue;

    return arr;
  }

  return null;
}

/** Helper: gera N jogos com fallback (relaxa diversidade no final se preciso). */
export function gerarLote(opts: {
  total: number;
  qtdDezenas: number;
  base: BaseGeracao;
  cotaApoioMin: number;
  quantidade: number;
  moldura?: number[];
}): number[][] {
  const jogosArr: number[][] = [];
  let tentativas = 0;
  const limite = opts.quantidade * 30;
  while (jogosArr.length < opts.quantidade && tentativas < limite) {
    tentativas++;
    const jogo = gerarJogo({
      total: opts.total,
      qtdDezenas: opts.qtdDezenas,
      base: opts.base,
      cotaApoioMin: opts.cotaApoioMin,
      jaGerados: jogosArr,
      moldura: opts.moldura,
    });
    if (jogo) jogosArr.push(jogo);
  }
  // Fallback: relaxa diversidade
  while (jogosArr.length < opts.quantidade) {
    const jogo = gerarJogo({
      total: opts.total,
      qtdDezenas: opts.qtdDezenas,
      base: opts.base,
      cotaApoioMin: opts.cotaApoioMin,
      jaGerados: [],
      moldura: opts.moldura,
    });
    if (!jogo) break;
    jogosArr.push(jogo);
  }
  return jogosArr;
}

/** Mescla filtros do usuário com a base do estudo (usuário tem prioridade). */
export function aplicarFiltrosUsuario(
  base: BaseGeracao,
  filtros: { dezenasFixas?: number[]; dezenasExcluidas?: number[] },
  total: number,
): { base: BaseGeracao; conflitos: string[] } {
  const conflitos: string[] = [];
  const userFixas = (filtros.dezenasFixas || []).filter((d) => d >= 1 && d <= total);
  const userExcl = (filtros.dezenasExcluidas || []).filter((d) => d >= 1 && d <= total);

  // Conflito 1: fixa do usuário ∩ excluir do estudo  → usuário ganha (remove do excluir)
  const novoExcluir = base.excluir.filter((d) => {
    if (userFixas.includes(d)) {
      conflitos.push(`Dezena ${d}: você fixou, mas o estudo excluía. Sua escolha prevaleceu.`);
      return false;
    }
    return !userExcl.includes(d) ? true : true; // mantém
  });

  // Conflito 2: excluir usuário ∩ fixar do estudo  → estudo ganha (não exclui o que o estudo fixou)
  const userExclEfetivo = userExcl.filter((d) => {
    if (base.fixar.includes(d)) {
      conflitos.push(`Dezena ${d}: você excluiu, mas o estudo fixava. Mantida pelo estudo.`);
      return false;
    }
    return true;
  });

  // Junta fixar
  const novoFixar = Array.from(new Set([...base.fixar, ...userFixas]));

  // Adiciona userExcl ao excluir
  const excluirFinal = Array.from(new Set([...novoExcluir, ...userExclEfetivo]));

  // Remove dezenas excluídas pelo usuário do apoio/ficar_de_olho
  const novoApoio = base.apoio.filter((d) => !excluirFinal.includes(d) && !novoFixar.includes(d));
  const novoOlho = (base.ficar_de_olho || []).filter(
    (d) => !excluirFinal.includes(d) && !novoFixar.includes(d),
  );

  return {
    base: {
      ...base,
      fixar: novoFixar,
      apoio: novoApoio,
      excluir: excluirFinal,
      ficar_de_olho: novoOlho,
    },
    conflitos,
  };
}
