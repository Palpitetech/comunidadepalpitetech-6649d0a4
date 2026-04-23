// =============================================================================
// Constrói uma BaseGeracao "ad-hoc" a partir de estatísticas históricas.
// Usado pelos geradores tradicionais (/gerador, /gerador-megasena, etc.)
// para que TODOS os geradores convirjam no mesmo motor determinístico.
// =============================================================================

import type { BaseGeracao } from "../guide-post/types.ts";
import type { EstatisticasJanela } from "./stats.ts";
import type { LotteryConfig } from "./lottery-config.ts";

export interface MontarBaseEstatisticaParams {
  cfg: LotteryConfig;
  stats: EstatisticasJanela;
  qtdDezenas: number;
  /** Filtros vindos do usuário (já validados em range). */
  dezenasFixasUsuario?: number[];
  dezenasExcluidasUsuario?: number[];
  pedidoEspecial?: string;
}

/**
 * Heurística:
 *   - fixar: 2 mais frequentes (núcleo histórico) — apenas se qtdDezenas permitir
 *   - apoio: top quentes (≈30% de qtdDezenas), faltantes do ciclo, repetidas do último
 *   - excluir: 2 menos frequentes (frias persistentes)
 *   - qtd_repetidas_alvo: ±1 da média histórica
 *   - qtd_moldura_alvo: ±1 da média (quando moldura fizer sentido)
 *
 * Combina filtros do usuário com prioridade absoluta.
 */
export function montarBaseGeracaoEstatistica(p: MontarBaseEstatisticaParams): BaseGeracao {
  const { cfg, stats, qtdDezenas } = p;
  const userFixas = (p.dezenasFixasUsuario || []).filter((d) => d >= 1 && d <= cfg.total);
  const userExcl = (p.dezenasExcluidasUsuario || []).filter(
    (d) => d >= 1 && d <= cfg.total && !userFixas.includes(d),
  );

  // FIXAR: usuário + 2 mais frequentes (limitado a metade de qtdDezenas)
  const limiteCoreFixo = Math.max(0, Math.min(2, qtdDezenas - userFixas.length - 1));
  const coreFromStats = stats.dezenasMaisFrequentes
    .filter((d) => !userFixas.includes(d) && !userExcl.includes(d))
    .slice(0, limiteCoreFixo);
  const fixar = Array.from(new Set([...userFixas, ...coreFromStats]));

  // EXCLUIR: usuário + 2 menos frequentes
  const friasFromStats = stats.dezenasMenosFrequentes
    .filter((d) => !fixar.includes(d) && !userExcl.includes(d))
    .slice(0, 2);
  const excluir = Array.from(new Set([...userExcl, ...friasFromStats]));

  // APOIO: top quentes (não fixar/excluir) + faltantes do ciclo + repetidas do último
  const apoioPool = new Set<number>();
  const targetApoio = Math.max(4, Math.ceil(qtdDezenas * 0.6));

  for (const d of stats.dezenasMaisFrequentes) {
    if (!fixar.includes(d) && !excluir.includes(d)) apoioPool.add(d);
    if (apoioPool.size >= targetApoio) break;
  }
  for (const d of stats.dezenasFaltantesCiclo) {
    if (apoioPool.size >= targetApoio + 4) break;
    if (!fixar.includes(d) && !excluir.includes(d)) apoioPool.add(d);
  }
  for (const d of stats.ultimoSorteio) {
    if (apoioPool.size >= targetApoio + 8) break;
    if (!fixar.includes(d) && !excluir.includes(d)) apoioPool.add(d);
  }
  const apoio = Array.from(apoioPool);

  // FICAR DE OLHO: dezenas frias mas não excluídas
  const ficar_de_olho = stats.dezenasMenosFrequentes
    .filter((d) => !fixar.includes(d) && !excluir.includes(d) && !apoio.includes(d))
    .slice(0, 3);

  // Filtros opcionais — só faz sentido para Lotofácil/Mega onde repetidas é estável
  const isLotofacil = cfg.loteriaDb === "lotofacil";
  const isMegaSena = cfg.loteriaDb === "megasena";

  const qtd_repetidas_alvo = (isLotofacil || isMegaSena)
    ? {
      min: Math.max(0, Math.floor(stats.mediaRepetidas - 1)),
      max: Math.min(qtdDezenas, Math.ceil(stats.mediaRepetidas + 1)),
    }
    : undefined;

  const qtd_moldura_alvo = isLotofacil
    ? {
      min: Math.max(0, Math.floor(stats.mediaMoldura - 1)),
      max: Math.min(qtdDezenas, Math.ceil(stats.mediaMoldura + 1)),
    }
    : undefined;

  const obs = [
    `Base estatística dos últimos ${stats.total} concursos.`,
    fixar.length > 0 ? `Núcleo de ${fixar.length} dezena(s) com frequência alta.` : "",
    excluir.length > 0 ? `${excluir.length} dezena(s) frias evitadas.` : "",
  ].filter(Boolean).join(" ");

  return {
    tema: "estatistica_classica",
    fixar,
    apoio,
    excluir,
    ficar_de_olho,
    ultimo_sorteio: stats.ultimoSorteio,
    qtd_repetidas_alvo,
    qtd_moldura_alvo,
    observacao_principal: obs,
    motivo_fixar: userFixas.length > 0
      ? `Inclui ${userFixas.length} dezena(s) escolhida(s) por você + dezenas mais frequentes da janela.`
      : `Dezenas mais frequentes da janela analisada.`,
    motivo_apoio: `Combinação de quentes, faltantes do ciclo${stats.cicloAtual ? ` (ciclo ${stats.cicloAtual})` : ""} e repetidas do concurso ${stats.ultimoConcurso}.`,
    motivo_excluir: userExcl.length > 0
      ? `Inclui ${userExcl.length} dezena(s) excluída(s) por você + dezenas menos frequentes.`
      : `Dezenas menos sorteadas — esfriamento prolongado.`,
  };
}
