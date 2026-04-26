// =============================================================================
// Pipeline ÚNICO de geração de palpites determinísticos.
// Usado por /gerador, /gerador-megasena, /gerador-quina, /gerador-duplasena
// e (parcialmente) por /gerador-estudo (que injeta sua própria BaseGeracao).
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { BaseGeracao } from "../guide-post/types.ts";
import type { EstrategiaData } from "./types.ts";
import { getLotteryConfig, type LotteryConfig } from "./lottery-config.ts";
import { calcularEstatisticas, type EstatisticasJanela, type ResultadoRow } from "./stats.ts";
import { montarBaseGeracaoEstatistica } from "./base-from-stats.ts";
import { aplicarFiltrosUsuario, gerarLote } from "./validate-jogo.ts";
import { humanizarConclusao, montarEstrategia } from "./strategy-builder.ts";
import {
  aplicarAjustesPedido,
  parsePedidoEspecial,
  type PedidoAjustes,
} from "./pedido-especial-parser.ts";

export interface PipelineFiltros {
  dezenasFixas?: number[];
  dezenasExcluidas?: number[];
  pedidoEspecial?: string;
}

export interface PipelineInput {
  loteria: "lotofacil" | "megasena" | "quina" | "duplasena";
  quantidade: number;
  qtdDezenas: number;
  periodoAnalise: number;
  filtros: PipelineFiltros;
  userId: string | null;
  /** Quando vier de /gerador-estudo, injeta a BaseGeracao já pronta e pula stats. */
  baseDoEstudo?: BaseGeracao;
  /** Concursos extras para mostrar no card (ex: "Estudo do concurso 3500"). */
  ferramentasExtras?: string[];
  /** Próximo concurso (opcional, melhora a conclusão). */
  proximoConcurso?: number;
  /** Cliente admin já criado pelo wrapper. */
  supabaseAdmin: any;
  /** Nome da edge function chamando (para ai_usage_logs). */
  edgeFunction: string;
}

export interface PipelineOutput {
  jogos: number[][];
  estrategia: EstrategiaData;
  stats: EstatisticasJanela | null;
  cfg: LotteryConfig;
  base: BaseGeracao;
  conflitos: string[];
}

/** Busca os últimos N concursos da loteria. */
async function fetchUltimosResultados(
  supabaseAdmin: any,
  loteriaDb: string,
  periodoAnalise: number,
): Promise<ResultadoRow[]> {
  const { data, error } = await supabaseAdmin
    .from("resultados_loterias")
    .select(
      "concurso, data_sorteio, dezenas, qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas, ciclo_numero, dezenas_faltantes_ciclo",
    )
    .eq("loteria", loteriaDb)
    .order("concurso", { ascending: false })
    .limit(periodoAnalise);

  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    concurso: r.concurso,
    concurso_id: r.concurso,
    data_sorteio: r.data_sorteio,
    dezenas: r.dezenas,
    qtd_pares: r.qtd_pares,
    qtd_impares: r.qtd_impares,
    qtd_moldura: r.qtd_moldura,
    qtd_primos: r.qtd_primos,
    qtd_repetidas: r.qtd_repetidas,
    ciclo_numero: r.ciclo_numero,
    dezenas_faltantes_ciclo: r.dezenas_faltantes_ciclo,
  }));
}

/**
 * Pipeline determinístico completo.
 * Erros lançados:
 *   - "LOTERIA_NAO_SUPORTADA"
 *   - "SEM_RESULTADOS"
 *   - "GERACAO_FALHOU"
 */
export async function gerarPalpitesDeterministicos(
  input: PipelineInput,
): Promise<PipelineOutput> {
  const cfg = getLotteryConfig(input.loteria);
  if (!cfg) throw new Error("LOTERIA_NAO_SUPORTADA");

  // Sanitiza filtros do usuário
  const dezenasFixasUser = (input.filtros.dezenasFixas || [])
    .map((d) => Math.round(Number(d)))
    .filter((d) => Number.isFinite(d) && d >= 1 && d <= cfg.total)
    .slice(0, Math.max(0, input.qtdDezenas - 1));
  const dezenasExcluidasUser = (input.filtros.dezenasExcluidas || [])
    .map((d) => Math.round(Number(d)))
    .filter((d) => Number.isFinite(d) && d >= 1 && d <= cfg.total)
    .slice(0, 15);
  const pedidoEspecial = (input.filtros.pedidoEspecial || "").trim().slice(0, 200);

  // 1) Stats (somente se não veio base do estudo)
  let stats: EstatisticasJanela | null = null;
  if (!input.baseDoEstudo) {
    const resultados = await fetchUltimosResultados(
      input.supabaseAdmin,
      cfg.loteriaDb,
      input.periodoAnalise,
    );
    if (resultados.length === 0) throw new Error("SEM_RESULTADOS");
    stats = calcularEstatisticas(resultados, cfg.total);
  }

  // 2) BaseGeracao
  let base: BaseGeracao = input.baseDoEstudo
    ?? montarBaseGeracaoEstatistica({
      cfg,
      stats: stats!,
      qtdDezenas: input.qtdDezenas,
      dezenasFixasUsuario: dezenasFixasUser,
      dezenasExcluidasUsuario: dezenasExcluidasUser,
      pedidoEspecial,
    });

  // 3) Pedido especial (IA curta) — só quando há texto e não há baseDoEstudo "pura"
  let pedidoAjustes: PedidoAjustes = { extraExcluir: [], extraApoio: [], resumo: "" };
  if (pedidoEspecial) {
    pedidoAjustes = await parsePedidoEspecial({
      texto: pedidoEspecial,
      totalDezenas: cfg.total,
      loteriaLabel: cfg.label,
      supabaseAdmin: input.supabaseAdmin,
      userId: input.userId,
      edgeFunction: input.edgeFunction,
    });
    base = aplicarAjustesPedido(base, pedidoAjustes);
  }

  // 4) Mesclar filtros do usuário (quando vem do estudo, montarBase não recebeu user)
  const merge = aplicarFiltrosUsuario(
    base,
    { dezenasFixas: dezenasFixasUser, dezenasExcluidas: dezenasExcluidasUser },
    cfg.total,
  );
  base = merge.base;
  const conflitos = merge.conflitos;

  // 5) Geração
  const espacoLivre = input.qtdDezenas - base.fixar.length;
  const cotaApoioMin = Math.max(0, Math.min(
    base.apoio.length,
    Math.ceil(espacoLivre * 0.6),
  ));

  const jogos = gerarLote({
    total: cfg.total,
    qtdDezenas: input.qtdDezenas,
    base,
    cotaApoioMin,
    quantidade: input.quantidade,
    moldura: cfg.moldura,
  });

  if (jogos.length === 0) throw new Error("GERACAO_FALHOU");

  // 6) Estratégia + humanização
  const estrategiaBase = montarEstrategia({
    base,
    qtdDezenas: input.qtdDezenas,
    quantidade: jogos.length,
    cotaApoioMin,
    ferramentasExtras: input.ferramentasExtras,
    ultimoConcurso: stats?.ultimoConcurso,
    proximoConcurso: input.proximoConcurso,
    conflitosUsuario: conflitos,
    pedidoEspecial: pedidoAjustes.resumo || pedidoEspecial,
  });

  const conclusaoFinal = await humanizarConclusao({
    estrategiaBase,
    base,
    quantidade: jogos.length,
    qtdDezenas: input.qtdDezenas,
    proximoConcurso: input.proximoConcurso,
    supabaseAdmin: input.supabaseAdmin,
    userId: input.userId,
    edgeFunction: input.edgeFunction,
  });

  return {
    jogos,
    estrategia: { ...estrategiaBase, conclusao: conclusaoFinal },
    stats,
    cfg,
    base,
    conflitos,
  };
}
