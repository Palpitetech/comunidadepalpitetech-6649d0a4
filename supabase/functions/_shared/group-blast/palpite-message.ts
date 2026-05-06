// =============================================================================
// Geração de mensagem de palpites para WhatsApp.
// Usa o motor determinístico V3 (gerarPalpitesDeterministicos) — o MESMO motor
// dos endpoints /gerador e /gerador-megasena — garantindo consistência total
// entre o app e os disparos. Suporta Lotofácil e Mega-Sena.
// =============================================================================

import { gerarPalpitesDeterministicos } from "../gerador/pipeline.ts";
import { getProximoConcursoReal } from "../proximo-concurso-helper.ts";
import {
  getBlastLotteryConfig,
  type BlastLoteria,
} from "./lottery-config.ts";

const pad = (d: number) => d.toString().padStart(2, "0");

interface GenerateOpts {
  loteria: BlastLoteria;
  includePalpites?: boolean;
  vipGroupLink?: string | null;
}

/**
 * Gera mensagem rica de palpites baseada em análise estatística dos últimos
 * concursos da loteria selecionada. Usa o pipeline determinístico V3.
 *
 * - `includePalpites=true`  → lista os jogos no final.
 * - `includePalpites=false` → CTA para grupo VIP no lugar dos jogos.
 */
export async function generatePalpiteMessage(
  supabase: any,
  _apiKey: string, // mantido para compat de assinatura (pipeline usa o admin client)
  baseUrl: string,
  opts: GenerateOpts | boolean = true,
  vipGroupLinkLegacy: string | null = null,
): Promise<string | null> {
  // Compat: assinatura antiga era (supabase, apiKey, baseUrl, includePalpites, vipGroupLink)
  const normalized: GenerateOpts = typeof opts === "boolean"
    ? { loteria: "lotofacil", includePalpites: opts, vipGroupLink: vipGroupLinkLegacy }
    : { includePalpites: true, vipGroupLink: null, ...opts };

  const cfg = getBlastLotteryConfig(normalized.loteria);
  const includePalpites = normalized.includePalpites ?? true;
  const vipGroupLink = normalized.vipGroupLink ?? null;

  // Buscar último resultado para o cabeçalho da mensagem
  const { data: ultimoArr, error: resErr } = await supabase
    .from("resultados_loterias")
    .select("concurso, dezenas")
    .eq("loteria", cfg.slug)
    .order("concurso", { ascending: false })
    .limit(1);

  if (resErr || !ultimoArr || ultimoArr.length === 0) {
    console.error(
      `[palpite-message] Sem resultado mais recente para ${cfg.slug}:`,
      resErr?.message,
    );
    return null;
  }
  const ultimoResultado = ultimoArr[0];
  const concursoMax = ultimoResultado.concurso;
  const concursoMin = Math.max(1, concursoMax - cfg.periodoAnalise + 1);

  // Determinar o próximo concurso REAL (corrige atraso pós-sorteio)
  const proxInfo = await getProximoConcursoReal(supabase, cfg.slug);
  const proximoConcursoReal = proxInfo.proximoConcurso;

  console.log(
    `[palpite-message] ${cfg.slug}: DB max=${concursoMax}, próximo real=${proximoConcursoReal}, sorteioJaOcorreu=${proxInfo.sorteioJaOcorreu}`,
  );

  // Quantidade de jogos a gerar (para a mensagem):
  //  - Lotofácil: 15 jogos (legacy)
  //  - Mega-Sena: 8 jogos (mais sensato dado que cada jogo tem 6 dezenas)
  const quantidadeJogos = cfg.slug === "lotofacil" ? 15 : 8;

  let pipelineResult;
  try {
    pipelineResult = await gerarPalpitesDeterministicos({
      loteria: cfg.slug,
      quantidade: quantidadeJogos,
      qtdDezenas: cfg.qtdDezenas,
      periodoAnalise: cfg.periodoAnalise,
      filtros: {},
      userId: null,
      supabaseAdmin: supabase,
      edgeFunction: `group-blast-palpite-${cfg.slug}`,
      proximoConcurso: proximoConcursoReal,
    });
  } catch (err: any) {
    console.error(
      `[palpite-message] Pipeline falhou (${cfg.slug}):`,
      err?.message ?? err,
    );
    return null;
  }

  const jogosValidos = pipelineResult.jogos
    .map((dz: number[]) =>
      [...new Set(dz)]
        .filter((d) => d >= 1 && d <= cfg.qtdDezenas * 10) // sanity
        .sort((a, b) => a - b)
        .map(pad)
        .join("-")
    );

  if (jogosValidos.length === 0) {
    console.error(`[palpite-message] Nenhum jogo válido gerado (${cfg.slug})`);
    return null;
  }

  return formatPalpiteMessage({
    cfgLabel: cfg.label,
    hubPath: cfg.hubPath,
    utmContent: cfg.utmContent,
    baseUrl,
    includePalpites,
    vipGroupLink,
    ultimoResultado,
    concursoMin,
    concursoMax,
    proximoConcurso: proximoConcursoReal,
    estrategia: pipelineResult.estrategia,
    jogosValidos,
  });
}

interface FormatArgs {
  cfgLabel: string;
  hubPath: string;
  utmContent: string;
  baseUrl: string;
  includePalpites: boolean;
  vipGroupLink: string | null;
  ultimoResultado: any;
  concursoMin: number;
  concursoMax: number;
  proximoConcurso: number;
  estrategia: any;
  jogosValidos: string[];
}

function formatPalpiteMessage(a: FormatArgs): string {
  const trackedPalpiteLink =
    `${a.baseUrl}${a.hubPath}?utm_source=whatsapp&utm_medium=group&utm_campaign=blast_palpite&utm_content=${a.utmContent}`;
  const trackedVipLink =
    `${a.baseUrl}${a.hubPath}?utm_source=whatsapp&utm_medium=group&utm_campaign=blast_vip&utm_content=${a.utmContent}`;

  let msg = `🎰 *Palpites ${a.cfgLabel} — Concurso ${a.concursoMax + 1}*\n\n`;
  msg += `📢 *Último Resultado (Concurso ${a.ultimoResultado.concurso}):*\n`;
  msg += `${
    [...a.ultimoResultado.dezenas]
      .sort((x: number, y: number) => x - y)
      .map(pad)
      .join(" - ")
  }\n\n`;
  msg += `📊 *Análise baseada nos concursos ${a.concursoMin} a ${a.concursoMax}*\n\n`;

  const e = a.estrategia;
  if (e?.ferramentas?.length > 0) {
    msg += `🔧 *Ferramentas utilizadas:*\n`;
    for (const f of e.ferramentas) msg += `  • ${f}\n`;
    msg += `\n`;
  }

  if (e?.dezenas_fixas?.length > 0) {
    msg += `✅ *Dezenas Priorizadas:*\n`;
    for (const item of e.dezenas_fixas) {
      msg += `  • ${(item.dezenas || []).map(pad).join(", ")} — ${item.motivo}\n`;
    }
    msg += `\n`;
  }

  if (e?.dezenas_evitadas?.length > 0) {
    msg += `❌ *Dezenas Evitadas:*\n`;
    for (const item of e.dezenas_evitadas) {
      msg += `  • ${(item.dezenas || []).map(pad).join(", ")} — ${item.motivo}\n`;
    }
    msg += `\n`;
  }

  if (e?.filtros_aplicados?.length > 0) {
    msg += `🎯 *Filtros Aplicados:*\n`;
    for (const f of e.filtros_aplicados) {
      msg += `  • ${f.filtro}${f.valor_alvo ? ` → ${f.valor_alvo}` : ""}\n`;
      if (f.motivo) msg += `    ${f.motivo}\n`;
    }
    msg += `\n`;
  }

  if (e?.conclusao) {
    msg += `💡 *Conclusão:*\n${e.conclusao}\n\n`;
  }

  if (a.includePalpites) {
    for (let i = 0; i < a.jogosValidos.length; i++) {
      msg += `🎯 Jogo ${String(i + 1).padStart(2, "0")}: ${a.jogosValidos[i]}\n`;
    }
    msg += `\nBoa sorte! 🍀\nMais análises na comunidade 👇\n${trackedPalpiteLink}`;
  } else {
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🎯 *QUER RECEBER OS PALPITES?*\n\n`;
    msg += `Os jogos baseados nessa estratégia são enviados diariamente no *Grupo VIP da ${a.cfgLabel}*.\n\n`;
    msg += a.vipGroupLink
      ? `👉 *Entre agora:* ${a.vipGroupLink}\n`
      : `👉 Fale com a gente para entrar no Grupo VIP!\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `\nMais análises na comunidade 👇\n${trackedVipLink}`;
  }

  return msg;
}
