// =============================================================================
// Construtor de EstrategiaData rica + humanização opcional via IA.
// =============================================================================

import type { BaseGeracao } from "../guide-post/types.ts";
import type { DezenaInfo, EstrategiaData, FiltroInfo } from "./types.ts";
import { callAiGateway, logUsoIa } from "./ai-call.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function rotuloTema(tema: string): string {
  const map: Record<string, string> = {
    analise_moldura: "Análise da Moldura",
    analise_movimentacao: "Quentes & Frias",
    analise_repetidas: "Repetidas do Concurso Anterior",
    analise_ciclo: "Ciclo de Dezenas",
    analise_cenarios: "Cenários do Dia (Equilibrado)",
    analise_ficar_de_olho: "Ficar de Olho — Desaceleração",
    analise_linhas: "Distribuição por Linhas",
    analise_colunas: "Distribuição por Colunas",
    analise_posicoes_iniciais: "Posições Iniciais",
    analise_posicoes_finais: "Posições Finais",
    analise_como_calculamos: "Como Calculamos",
    estatistica_classica: "Análise Estatística",
  };
  return map[tema] || "Análise do Estudo";
}

export interface MontarEstrategiaCtx {
  base: BaseGeracao;
  qtdDezenas: number;
  quantidade: number;
  cotaApoioMin: number;
  /** Para ferramentas/contexto (ex.: "Estudo do concurso 3500"). */
  ferramentasExtras?: string[];
  /** Texto ao final como "Base 3499 → 3500". */
  baseTextoFerramenta?: string;
  ultimoConcurso?: number;
  proximoConcurso?: number;
  /** Conflitos detectados ao mesclar filtros do usuário. */
  conflitosUsuario?: string[];
  /** Pedido especial do usuário (texto livre) — vira filtro informativo. */
  pedidoEspecial?: string;
}

export function montarEstrategia(ctx: MontarEstrategiaCtx): EstrategiaData {
  const { base, qtdDezenas, quantidade, cotaApoioMin } = ctx;
  const labelTema = rotuloTema(base.tema);

  const ferramentas = [
    labelTema,
    ...(ctx.ferramentasExtras || []),
    ctx.baseTextoFerramenta
      ?? (ctx.ultimoConcurso && ctx.proximoConcurso
        ? `Base ${ctx.ultimoConcurso} → ${ctx.proximoConcurso}`
        : null),
    "Motor determinístico v2",
  ].filter(Boolean) as string[];

  const dezenas_fixas: DezenaInfo[] = [];
  if (base.fixar.length > 0) {
    dezenas_fixas.push({
      dezenas: [...base.fixar].sort((a, b) => a - b),
      motivo: `${base.motivo_fixar || "Núcleo do estudo"}. Entram em TODOS os ${quantidade} jogo(s).`,
    });
  }
  if (base.apoio.length > 0) {
    dezenas_fixas.push({
      dezenas: [...base.apoio].sort((a, b) => a - b),
      motivo: `${base.motivo_apoio || "Apoio do estudo"}. Cada jogo carrega no mínimo ${cotaApoioMin} destas.`,
    });
  }

  const dezenas_evitadas: DezenaInfo[] = [];
  if (base.excluir.length > 0) {
    dezenas_evitadas.push({
      dezenas: [...base.excluir].sort((a, b) => a - b),
      motivo: `${base.motivo_excluir || "Excluídas pela estratégia"}. NÃO aparecem em nenhum jogo.`,
    });
  }

  const filtros_aplicados: FiltroInfo[] = [];
  if (base.fixar.length > 0) {
    filtros_aplicados.push({
      filtro: "Núcleo obrigatório",
      valor_alvo: `${base.fixar.length} dezena(s) em 100% dos jogos`,
      motivo: `Definidas como núcleo de maior probabilidade.`,
    });
  }
  if (base.apoio.length > 0) {
    filtros_aplicados.push({
      filtro: "Apoio mínimo por jogo",
      valor_alvo: `${cotaApoioMin}+ por jogo`,
      motivo: `Cada jogo precisa carregar pelo menos ${cotaApoioMin} dezena(s) do grupo de apoio.`,
    });
  }
  if (base.excluir.length > 0) {
    filtros_aplicados.push({
      filtro: "Exclusão definitiva",
      valor_alvo: `${base.excluir.length} dezena(s)`,
      motivo: `Padrão histórico mostra baixa probabilidade dessas dezenas no próximo sorteio.`,
    });
  }
  if (base.qtd_repetidas_alvo) {
    filtros_aplicados.push({
      filtro: "Repetidas do último sorteio",
      valor_alvo: `entre ${base.qtd_repetidas_alvo.min} e ${base.qtd_repetidas_alvo.max}`,
      motivo: ctx.ultimoConcurso
        ? `Histórico aponta essa faixa como mais provável (concurso ${ctx.ultimoConcurso}).`
        : `Histórico aponta essa faixa como mais provável.`,
    });
  }
  if (base.qtd_moldura_alvo) {
    filtros_aplicados.push({
      filtro: "Dezenas da moldura",
      valor_alvo: `entre ${base.qtd_moldura_alvo.min} e ${base.qtd_moldura_alvo.max}`,
      motivo: `Janela analisada mostra esse range como padrão dominante.`,
    });
  }
  filtros_aplicados.push({
    filtro: "Diversidade entre jogos",
    valor_alvo: "Hamming ≥3",
    motivo: "Cada jogo difere do anterior em pelo menos 3 dezenas — evita palpites quase iguais.",
  });

  if (ctx.pedidoEspecial && ctx.pedidoEspecial.trim().length > 0) {
    filtros_aplicados.push({
      filtro: "Pedido do usuário",
      valor_alvo: ctx.pedidoEspecial.trim().slice(0, 80),
      motivo: "Solicitação manual considerada na estratégia.",
    });
  }

  if (ctx.conflitosUsuario && ctx.conflitosUsuario.length > 0) {
    filtros_aplicados.push({
      filtro: "Conflitos resolvidos",
      valor_alvo: `${ctx.conflitosUsuario.length} ajuste(s)`,
      motivo: ctx.conflitosUsuario.join(" "),
    });
  }

  return {
    ferramentas,
    dezenas_fixas,
    dezenas_evitadas: dezenas_evitadas.length > 0 ? dezenas_evitadas : undefined,
    filtros_aplicados,
    conclusao: conclusaoTemplate(ctx),
  };
}

export function conclusaoTemplate(ctx: MontarEstrategiaCtx): string {
  const { base, qtdDezenas, quantidade } = ctx;
  const labelTema = rotuloTema(base.tema);
  const partes = [
    `Geramos ${quantidade} jogo(s) de ${qtdDezenas} dezenas seguindo "${labelTema}"${
      ctx.proximoConcurso ? ` para o concurso ${ctx.proximoConcurso}` : ""
    }.`,
  ];
  if (base.fixar.length > 0) partes.push(`Fixamos ${base.fixar.length} dezena(s) do núcleo em 100% dos jogos.`);
  if (base.excluir.length > 0) partes.push(`Excluímos ${base.excluir.length} dezena(s) desaconselhada(s).`);
  if (base.observacao_principal) partes.push(base.observacao_principal);
  return partes.join(" ");
}

export interface HumanizarParams {
  estrategiaBase: EstrategiaData;
  base: BaseGeracao;
  quantidade: number;
  qtdDezenas: number;
  proximoConcurso?: number;
  /** Para logar uso. */
  supabaseAdmin?: any;
  userId?: string | null;
  edgeFunction?: string;
}

/** Substitui apenas a `conclusao` por uma versão humanizada (timeout 4s). */
export async function humanizarConclusao(p: HumanizarParams): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return p.estrategiaBase.conclusao;

  const prompt = `Reescreva esta conclusão em 2-3 frases naturais e diretas (máx 280 caracteres). Mantenha os números e o tema. NÃO mencione IA.

Tema: ${rotuloTema(p.base.tema)}
${p.proximoConcurso ? `Concurso: ${p.proximoConcurso}` : ""}
Quantidade: ${p.quantidade} jogos de ${p.qtdDezenas} dezenas
Núcleo fixado: ${p.base.fixar.length} dezenas
Excluídas: ${p.base.excluir.length} dezenas
Conclusão atual: ${p.estrategiaBase.conclusao}

Responda APENAS o texto reescrito, sem aspas, sem markdown.`;

  const model = "google/gemini-2.5-flash";
  const result = await callAiGateway({
    apiKey,
    model,
    messages: [{ role: "user", content: prompt }],
    maxTokens: 200,
    timeoutMs: 4000,
  });

  if (!result.ok || !result.data) return p.estrategiaBase.conclusao;

  // Log fire-and-forget
  if (p.supabaseAdmin && p.edgeFunction) {
    logUsoIa({
      supabaseAdmin: p.supabaseAdmin,
      userId: p.userId ?? null,
      edgeFunction: p.edgeFunction,
      actionType: "humanizar_conclusao",
      model,
      usage: result.data.usage,
      metadata: {
        tema: p.base.tema,
        quantidade: p.quantidade,
        qtd_dezenas: p.qtdDezenas,
      },
    });
  }

  const texto = result.data?.choices?.[0]?.message?.content?.trim();
  return typeof texto === "string" && texto.length > 10 ? texto : p.estrategiaBase.conclusao;
}
