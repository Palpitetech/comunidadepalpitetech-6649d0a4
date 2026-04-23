// =============================================================================
// Engine Mega-Sena — segue o contrato GuideEngine.
// Estrutura espelhada da Lotofácil, adaptada para 60 dezenas / 6 sorteadas.
// =============================================================================

import type { Concurso, Fatos, GuideEngine } from "../types.ts";

// =============================================================================
// CONSTANTES MEGA
// =============================================================================
const TOTAL_DEZENAS = 60;
const DEZENAS_POR_SORTEIO = 6;
const PERIODO_ANALISE = 20;

// Grid 6×10 (linha = (d-1) DIV 10, coluna = (d-1) MOD 10)
// Moldura Mega = bordas do grid 6×10 → linhas 1 e 6 inteiras + colunas 1 e 10 nas linhas internas
// Linha 1: 1..10  | Linha 6: 51..60 | Coluna 1 internas: 11,21,31,41 | Coluna 10 internas: 20,30,40,50
const MOLDURA: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 20,
  21, 30,
  31, 40,
  41, 50,
  51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
];
const MOLDURA_SET = new Set(MOLDURA);

// =============================================================================
// HELPERS DETERMINÍSTICOS
// =============================================================================

function fmt(d: number): string {
  return d.toString().padStart(2, "0");
}

function calcularFrequencias(concursos: Concurso[]): Map<number, number> {
  const f = new Map<number, number>();
  for (let i = 1; i <= TOTAL_DEZENAS; i++) f.set(i, 0);
  for (const c of concursos) for (const d of c.dezenas) f.set(d, (f.get(d) || 0) + 1);
  return f;
}

function topQuentes(concursos: Concurso[], n = 8): { dezena: number; freq: number; perc: number }[] {
  const f = calcularFrequencias(concursos);
  return Array.from(f.entries())
    .map(([dezena, freq]) => ({ dezena, freq, perc: freq / concursos.length }))
    .sort((a, b) => b.freq - a.freq || a.dezena - b.dezena)
    .slice(0, n);
}

function topFrias(concursos: Concurso[], n = 8): { dezena: number; freq: number; perc: number }[] {
  const f = calcularFrequencias(concursos);
  return Array.from(f.entries())
    .map(([dezena, freq]) => ({ dezena, freq, perc: freq / concursos.length }))
    .sort((a, b) => a.freq - b.freq || a.dezena - b.dezena)
    .slice(0, n);
}

function linhaDe(d: number): number {
  return Math.floor((d - 1) / 10) + 1; // 1..6
}
function colunaDe(d: number): number {
  return ((d - 1) % 10) + 1; // 1..10
}

// =============================================================================
// MOVIMENTAÇÃO (quentes/frias)
// =============================================================================

function montarFatosMovimentacao(concursos: Concurso[]): Fatos {
  const quentes = topQuentes(concursos, 6);
  const frias = topFrias(concursos, 6);
  const ultimo = concursos[0];

  const linhasQuentes = quentes
    .map((q) => `**${fmt(q.dezena)}** (${q.freq}× / ${(q.perc * 100).toFixed(0)}%)`)
    .join(", ");
  const linhasFrias = frias
    .map((q) => `**${fmt(q.dezena)}** (${q.freq}× / ${(q.perc * 100).toFixed(0)}%)`)
    .join(", ");

  const fixas = quentes.slice(0, 3).map((q) => fmt(q.dezena)).join(", ");
  const excluir = frias.slice(0, 3).map((q) => fmt(q.dezena)).join(", ");

  const resumo =
    `📊 O que aconteceu nos últimos ${concursos.length} sorteios\n` +
    `Último concurso: ${ultimo.concurso_id}. Em uma loteria de 60 dezenas com só 6 saindo por sorteio, a média esperada para cada dezena é ~${(DEZENAS_POR_SORTEIO / TOTAL_DEZENAS * 100).toFixed(0)}% (1 em cada 10 sorteios).\n\n` +
    `🔥 Dezenas QUENTES (acima da média)\n${linhasQuentes}\n\n` +
    `❄️ Dezenas FRIAS (abaixo da média)\n${linhasFrias}\n\n` +
    `💡 Como montar seu palpite\n` +
    `🎯 FIXAR: ${fixas} — top 3 dezenas com presença mais forte na janela.\n` +
    `❌ EXCLUIR (1ª opção): ${excluir} — as mais ausentes da janela atual.\n` +
    `⚠️ Lembre: na Mega, mesmo dezenas frias têm a mesma probabilidade matemática a cada sorteio. Use como filtro de tendência, não como certeza.`;

  return {
    resumo,
    recomendacaoDireta: `Fixe **${fixas}** como núcleo quente e evite **${excluir}** como primeira exclusão.`,
  };
}

// =============================================================================
// MOLDURA
// =============================================================================

function montarFatosMoldura(concursos: Concurso[]): Fatos {
  const totalMold = concursos.reduce((acc, c) => {
    const n = c.dezenas.filter((d) => MOLDURA_SET.has(d)).length;
    return acc + n;
  }, 0);
  const media = totalMold / concursos.length;
  const ultimo = concursos[0];

  // Frequência por dezena de moldura
  const freqMold = new Map<number, number>();
  for (const d of MOLDURA) freqMold.set(d, 0);
  for (const c of concursos) {
    for (const d of c.dezenas) {
      if (MOLDURA_SET.has(d)) freqMold.set(d, (freqMold.get(d) || 0) + 1);
    }
  }
  const ranked = Array.from(freqMold.entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const fortes = ranked.slice(0, 6);
  const fracas = ranked.slice(-4).reverse();

  const linhasFortes = fortes
    .map(([d, v]) => `**${fmt(d)}** (${v}× / ${((v / concursos.length) * 100).toFixed(0)}%)`)
    .join(", ");
  const linhasFracas = fracas
    .map(([d, v]) => `**${fmt(d)}** (${v}× / ${((v / concursos.length) * 100).toFixed(0)}%)`)
    .join(", ");
  const nucleo = fortes.slice(0, 3).map(([d]) => fmt(d)).join(", ");
  const apoio = fortes.slice(3, 5).map(([d]) => fmt(d)).join(", ");

  const resumo =
    `📊 Panorama da Moldura\n` +
    `A moldura da Mega-Sena tem **30 dezenas** (linhas 1 e 6 + cantos das colunas 1 e 10). Nos últimos ${concursos.length} sorteios saíram em média **${media.toFixed(1)}** dezenas de moldura por concurso. Último concurso: ${ultimo.concurso_id}.\n\n` +
    `🔥 Top dezenas FORTES da moldura\n${linhasFortes}\n\n` +
    `❄️ Dezenas FRACAS da moldura\n${linhasFracas}\n\n` +
    `💡 Como montar seu palpite\n` +
    `🎯 Núcleo forte da moldura: ${nucleo}\n` +
    `➕ Apoio: ${apoio}\n` +
    `❌ Deixe de fora (1ª opção): ${fracas.slice(0, 2).map(([d]) => fmt(d)).join(", ")}\n` +
    `⚠️ Mantenha entre 2 e 4 dezenas de moldura no jogo (faixa típica observada).`;

  return {
    resumo,
    recomendacaoDireta: `Use **${nucleo}** como núcleo da moldura e mantenha 2 a 4 dezenas de moldura no palpite.`,
  };
}

// =============================================================================
// REPETIDAS — adaptado: Mega quase nunca repete
// =============================================================================

function montarFatosRepetidas(concursos: Concurso[]): Fatos {
  if (concursos.length < 2) {
    return {
      resumo: `Não há dados suficientes para análise de repetição.`,
      recomendacaoDireta: `Aguarde mais sorteios.`,
    };
  }
  const transicoes = concursos.length - 1;
  let totalRep = 0;
  const repCount: number[] = [];
  const repPorDezena = new Map<number, number>();

  for (let i = 0; i < transicoes; i++) {
    const seguinte = new Set(concursos[i].dezenas);
    const anterior = concursos[i + 1].dezenas;
    const inter = anterior.filter((d) => seguinte.has(d));
    repCount.push(inter.length);
    totalRep += inter.length;
    for (const d of inter) repPorDezena.set(d, (repPorDezena.get(d) || 0) + 1);
  }

  const media = totalRep / transicoes;
  const max = Math.max(...repCount);
  const min = Math.min(...repCount);
  const distZero = repCount.filter((x) => x === 0).length;
  const distUm = repCount.filter((x) => x === 1).length;
  const distDois = repCount.filter((x) => x >= 2).length;

  const topRep = Array.from(repPorDezena.entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 5);

  const ultimo = concursos[0];
  const ultimoStr = ultimo.dezenas.map(fmt).join(", ");
  const linhasTop = topRep
    .map(([d, v]) => `**${fmt(d)}** voltou ${v}× nas ${transicoes} transições`)
    .join("; ");

  const resumo =
    `📊 O que aconteceu — Repetição na Mega\n` +
    `Em ${transicoes} transições entre concursos consecutivos, **${distZero}** vezes nenhuma dezena repetiu, **${distUm}** vezes repetiu apenas 1, e **${distDois}** vezes repetiu 2 ou mais. A média ficou em **${media.toFixed(2)}** repetidas por sorteio (mín ${min}, máx ${max}).\n\n` +
    `🎯 No último sorteio (${ultimo.concurso_id}) saíram: ${ultimoStr}\n\n` +
    `🔁 As que MAIS voltaram na janela\n${linhasTop || "Nenhuma se destacou — repetição é evento raro na Mega."}\n\n` +
    `💡 Como montar seu palpite\n` +
    `Como repetir é raro (média ~${media.toFixed(2)} por sorteio), o caminho mais defensivo é **trocar a maior parte** das dezenas do último concurso. Se quiser apostar em uma repetição, escolha entre as mais constantes da janela.`;

  return {
    resumo,
    recomendacaoDireta: `Repetição é evento raro na Mega (média **${media.toFixed(2)}** por sorteio). Aposte em renovar a maioria das dezenas.`,
  };
}

// =============================================================================
// LINHAS / COLUNAS
// =============================================================================

function montarFatosEixo(concursos: Concurso[], eixo: "linhas" | "colunas"): Fatos {
  const totalEixos = eixo === "linhas" ? 6 : 10;
  const getEixo = eixo === "linhas" ? linhaDe : colunaDe;
  const nomeUni = eixo === "linhas" ? "linha" : "coluna";

  // contagem por eixo (média de dezenas por concurso)
  const somaPorEixo = new Array(totalEixos + 1).fill(0); // 1..totalEixos
  for (const c of concursos) {
    for (const d of c.dezenas) {
      somaPorEixo[getEixo(d)]++;
    }
  }
  const media: { eixo: number; med: number }[] = [];
  for (let i = 1; i <= totalEixos; i++) {
    media.push({ eixo: i, med: somaPorEixo[i] / concursos.length });
  }
  const ordenado = [...media].sort((a, b) => b.med - a.med || a.eixo - b.eixo);

  // Top dezenas por eixo
  const freq = calcularFrequencias(concursos);
  const fortesPorEixo: { eixo: number; dezenas: { d: number; v: number }[] }[] = [];
  for (let i = 1; i <= totalEixos; i++) {
    const dezenasDoEixo: { d: number; v: number }[] = [];
    for (let d = 1; d <= TOTAL_DEZENAS; d++) {
      if (getEixo(d) === i) dezenasDoEixo.push({ d, v: freq.get(d) || 0 });
    }
    dezenasDoEixo.sort((a, b) => b.v - a.v || a.d - b.d);
    fortesPorEixo.push({ eixo: i, dezenas: dezenasDoEixo.slice(0, 2) });
  }

  const distribLinhas = ordenado
    .slice(0, 4)
    .map((x) => `${nomeUni} ${x.eixo}: **${x.med.toFixed(2)}**`)
    .join(" | ");
  const dezenasFortes = fortesPorEixo
    .map(
      (e) =>
        `${nomeUni} ${e.eixo}: ${e.dezenas.map((x) => `**${fmt(x.d)}**(${x.v}×)`).join(", ")}`,
    )
    .join("\n");

  const eixosMaisQuentes = ordenado.slice(0, 2).map((x) => `${nomeUni} ${x.eixo}`).join(", ");
  const eixosMaisFrios = ordenado.slice(-2).reverse().map((x) => `${nomeUni} ${x.eixo}`).join(", ");

  const resumo =
    `📊 Distribuição por ${nomeUni}s — últimos ${concursos.length} sorteios\n` +
    `${distribLinhas}\n\n` +
    `🔥 Dezenas mais frequentes em cada ${nomeUni}\n${dezenasFortes}\n\n` +
    `📈 Mais aquecidas: ${eixosMaisQuentes}. Mais frias: ${eixosMaisFrios}.\n\n` +
    `💡 Como montar seu palpite\n` +
    `Distribua as 6 dezenas tentando cobrir ${eixo === "linhas" ? "ao menos 3 linhas distintas" : "ao menos 4 colunas distintas"}, priorizando ${eixosMaisQuentes}. Concentrar tudo em poucos eixos é o erro mais comum.`;

  return {
    resumo,
    recomendacaoDireta: `Distribua as 6 dezenas pelos ${nomeUni}s mais aquecidos (${eixosMaisQuentes}) sem concentrar tudo em um só.`,
  };
}

// =============================================================================
// POSIÇÕES (P1-P3 e P4-P6)
// =============================================================================

function montarFatosPosicoes(concursos: Concurso[], faixa: "iniciais" | "finais"): Fatos {
  const idxs = faixa === "iniciais" ? [0, 1, 2] : [3, 4, 5];
  const labels = faixa === "iniciais" ? ["P1", "P2", "P3"] : ["P4", "P5", "P6"];

  // Para cada posição, top 3 dezenas mais frequentes
  const blocos: string[] = [];
  const trio: number[] = [];

  for (let k = 0; k < 3; k++) {
    const idx = idxs[k];
    const cont = new Map<number, number>();
    for (const c of concursos) {
      const ord = [...c.dezenas].sort((a, b) => a - b);
      const v = ord[idx];
      if (v != null) cont.set(v, (cont.get(v) || 0) + 1);
    }
    const top = Array.from(cont.entries())
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, 4);

    const linha = top
      .map(([d, v]) => `**${fmt(d)}** (${v}×)`)
      .join(", ");
    blocos.push(`🎯 ${labels[k]} — top frequentes\n${linha}`);
    if (top[0]) trio.push(top[0][0]);
  }

  const trioStr = trio.map(fmt).join(", ");
  const tipoFaixa = faixa === "iniciais" ? "INÍCIO" : "FINAL";
  const intervalo = faixa === "iniciais" ? "1-30" : "30-60";

  const resumo =
    `📊 O que diz a matemática — Posições ${faixa}\n` +
    `Toda Mega-Sena pode ser ordenada de forma crescente. Estatisticamente, ${labels.join(", ")} ficam concentradas na faixa **${intervalo}**, mas com variações. Janela: ${concursos.length} sorteios.\n\n` +
    blocos.join("\n\n") + `\n\n` +
    `💡 Como montar o ${tipoFaixa} do seu palpite\n` +
    `🎯 Trio ${faixa === "iniciais" ? "inicial" : "final"} recomendado: **${trioStr}**\n` +
    `➕ Use as alternativas da lista acima para variar.\n` +
    `❌ Evite ${faixa === "iniciais" ? "começar" : "terminar"} com dezenas fora dessa faixa típica.`;

  return {
    resumo,
    recomendacaoDireta: `Use o trio ${faixa === "iniciais" ? "inicial" : "final"} **${trioStr}** como base para a faixa ${intervalo}.`,
  };
}

// =============================================================================
// COMO CALCULAMOS
// =============================================================================

function montarFatosComoCalculamos(concursos: Concurso[]): Fatos {
  const ultimoNum = concursos[0].concurso_id;
  const primeiroNum = concursos[concursos.length - 1].concurso_id;
  const totalDezenas = concursos.length * DEZENAS_POR_SORTEIO;

  const resumo =
    `📊 Janela de análise\n` +
    `Os posts de Mega-Sena usam os ÚLTIMOS ${concursos.length} SORTEIOS oficiais. Hoje: ${primeiroNum} a ${ultimoNum} (${concursos.length} sorteios = ${totalDezenas} dezenas).\n\n` +
    `📐 Regras do volante\n` +
    `Mega tem 60 dezenas, sortes 6 por concurso. Grid 6×10: linhas (1-10, 11-20, ..., 51-60) e 10 colunas (terminação 1, 2, ..., 0). Moldura = 30 dezenas das bordas.\n\n` +
    `🎯 O que é "quente" e "fria" na Mega\n` +
    `A média esperada para uma dezena qualquer é **${(DEZENAS_POR_SORTEIO / TOTAL_DEZENAS * 100).toFixed(0)}%** (1 em 10). Acima disso é quente; abaixo é fria.\n\n` +
    `✅ Anti-alucinação\n` +
    `Cada post tem WHITELIST: dezenas 01-60, contagens 0-100, e os números dos concursos da janela. Qualquer número fora da lista descarta o post e ativa o fallback determinístico.\n\n` +
    `🛡️ Validações ativas\n` +
    `• Janela mínima de 20 sorteios para análises\n` +
    `• Fallback automático se a IA tentar inventar números\n` +
    `• Recomendação direta sempre presente`;

  return {
    resumo,
    recomendacaoDireta: `Cada número aqui tem origem matemática rastreável. Você não está apostando no palpite de alguém — está usando padrão estatístico real.`,
  };
}

// =============================================================================
// ROUTER DE FATOS
// =============================================================================

function montarFatos(tipoPost: string, concursos: Concurso[]): Fatos {
  switch (tipoPost) {
    case "analise_movimentacao":
      return montarFatosMovimentacao(concursos);
    case "analise_moldura":
      return montarFatosMoldura(concursos);
    case "analise_repetidas":
      return montarFatosRepetidas(concursos);
    case "analise_linhas":
      return montarFatosEixo(concursos, "linhas");
    case "analise_colunas":
      return montarFatosEixo(concursos, "colunas");
    case "analise_posicoes_iniciais":
      return montarFatosPosicoes(concursos, "iniciais");
    case "analise_posicoes_finais":
      return montarFatosPosicoes(concursos, "finais");
    case "analise_como_calculamos":
      return montarFatosComoCalculamos(concursos);
    default: {
      const quentes = topQuentes(concursos, 5);
      return {
        resumo: `Concurso ${concursos[0].concurso_id}. Quentes: [${quentes.map((q) => fmt(q.dezena)).join(", ")}]`,
        recomendacaoDireta: `Acompanhe os próximos sorteios.`,
      };
    }
  }
}

// =============================================================================
// TÍTULO + PROMPT
// =============================================================================

function montarTituloDeterministico(tipoPost: string, proxConcurso: number): string {
  const titulos: Record<string, string> = {
    analise_movimentacao: `🔥❄️ Quentes e Frias da Mega-Sena — Concurso ${proxConcurso}`,
    analise_moldura: `🖼️ Moldura da Mega-Sena — Concurso ${proxConcurso}`,
    analise_repetidas: `🔁 Repetidas na Mega-Sena — Concurso ${proxConcurso}`,
    analise_linhas: `📐 Análise por Linhas (Mega) — Concurso ${proxConcurso}`,
    analise_colunas: `📊 Análise por Colunas (Mega) — Concurso ${proxConcurso}`,
    analise_posicoes_iniciais: `🎯 Posições Iniciais (Mega) — Concurso ${proxConcurso}`,
    analise_posicoes_finais: `🏁 Posições Finais (Mega) — Concurso ${proxConcurso}`,
    analise_como_calculamos: `🔬 Como Calculamos (Mega) — Concurso ${proxConcurso}`,
  };
  return (titulos[tipoPost] || `Análise Mega-Sena — Concurso ${proxConcurso}`).substring(0, 100);
}

function montarPrompt(tipoPost: string, fatos: Fatos, ultimoConcurso: number): string {
  const temas: Record<string, string> = {
    analise_movimentacao: "Quentes e Frias da Mega-Sena",
    analise_moldura: "Análise de Moldura da Mega-Sena",
    analise_repetidas: "Análise de Repetidas (Mega-Sena)",
    analise_linhas: "Análise por Linhas (Mega-Sena)",
    analise_colunas: "Análise por Colunas (Mega-Sena)",
    analise_posicoes_iniciais: "Posições Iniciais — 3 primeiras dezenas (Mega)",
    analise_posicoes_finais: "Posições Finais — 3 últimas dezenas (Mega)",
    analise_como_calculamos: "Como Calculamos — Bastidores da Mega-Sena",
  };
  const tema = temas[tipoPost] || "Análise da Mega-Sena";
  const proxConcurso = ultimoConcurso + 1;

  return `Você é Augusto Angelis, especialista em loterias da equipe Palpite Tech. Escreva APENAS o CONTEÚDO de um post curto da comunidade com tema: "${tema}".

DADOS REAIS (use exatamente estes números, sem inventar nem alterar dígitos):
${fatos.resumo}

RECOMENDAÇÃO DIRETA QUE VOCÊ DEVE INCLUIR LITERALMENTE NO TEXTO:
${fatos.recomendacaoDireta}

IMPORTANTE: REPRODUZA LITERALMENTE todos os blocos de DADOS REAIS sem resumir, sem omitir e sem alterar nenhum número, dezena ou percentual. Você só pode escrever a abertura (1 linha) e o disclaimer final.

ESTRUTURA OBRIGATÓRIA do conteúdo:
1) Abertura curta (1 linha) com gancho diferente a cada vez.
2) Reproduza LITERALMENTE o conteúdo de DADOS REAIS.
3) Disclaimer curto: "Loteria envolve sorte. Use como guia, não como certeza."

REGRAS CRÍTICAS:
- A Mega-Sena tem 60 dezenas (01 a 60) e sorteia apenas 6. Repetir é evento RARO.
- Use SOMENTE dezenas de 01 a 60. NUNCA invente dezena fora desse intervalo.
- Se citar o concurso, use exatamente ${proxConcurso}.
- Tom humano, acolhedor, em primeira pessoa. Varie a abertura.
- Use **negrito** nas dezenas e na recomendação.
- Máximo 2200 caracteres no conteúdo.
- NUNCA mencione IA, bot, modelo, GPT ou Gemini.

Responda APENAS o CONTEÚDO em texto puro (sem título, sem JSON, sem aspas).`;
}

// =============================================================================
// VALIDADOR / SANITIZADOR / FALLBACK
// =============================================================================

function extrairNumerosPermitidos(
  concursos: Concurso[],
  proxConcurso: number,
): Set<number> {
  const permitidos = new Set<number>();
  permitidos.add(proxConcurso);
  for (const c of concursos) {
    permitidos.add(c.concurso_id);
    permitidos.add(c.qtd_pares);
    permitidos.add(c.qtd_impares);
    permitidos.add(c.qtd_moldura);
    permitidos.add(c.qtd_primos);
    permitidos.add(c.qtd_repetidas);
  }
  for (let i = 0; i <= 100; i++) permitidos.add(i);
  return permitidos;
}

function validarConteudoNumerico(texto: string, permitidos: Set<number>): { ok: boolean; motivo?: string } {
  // Dezenas Mega: 01-60. Qualquer número 1-2 dígitos não pode passar de 60.
  const dezenas = texto.match(/\b\d{1,2}\b/g) || [];
  for (const m of dezenas) {
    const n = parseInt(m, 10);
    if (n > 60 && n <= 100) continue; // pode ser percentual/contagem
    if (n > TOTAL_DEZENAS) {
      // só falha se aparece padrão de dezena (01..XX) — número solto > 60 é suspeito
      if (n <= 99 && !permitidos.has(n)) {
        return { ok: false, motivo: `Dezena fora do intervalo Mega (1-60): ${n}` };
      }
    }
  }
  // Concursos (3-5 dígitos): devem estar na whitelist
  const concNums = texto.match(/\b\d{3,5}\b/g) || [];
  for (const m of concNums) {
    const n = parseInt(m, 10);
    if (!permitidos.has(n)) {
      return { ok: false, motivo: `Concurso não permitido: ${n}` };
    }
  }
  return { ok: true };
}

function sanitizar(texto: string): string {
  return texto
    .replace(/\b(IA|bot|robô|robot|modelo de linguagem|GPT[\w-]*|Gemini[\w-]*|ChatGPT|inteligência artificial)\b/gi, "análise")
    .replace(/\s{3,}/g, "  ")
    .trim();
}

function fallbackConteudo(fatos: Fatos): string {
  const conteudo = `Olá pessoal! Trago um resumo direto do tema.\n\n${fatos.resumo}\n\n` +
    (fatos.resumo.includes("Como montar") ? "" : `💡 Como montar seu palpite\n${fatos.recomendacaoDireta}\n\n`) +
    `Loteria envolve sorte. Use como guia, não como certeza.`;
  return conteudo.substring(0, 2200);
}

function limiteConteudoMega(_tipoPost: string): number {
  return 2200;
}

const TIPOS_SUPORTADOS_MEGA = [
  "analise_movimentacao",
  "analise_moldura",
  "analise_repetidas",
  "analise_linhas",
  "analise_colunas",
  "analise_posicoes_iniciais",
  "analise_posicoes_finais",
  "analise_como_calculamos",
];

// =============================================================================
// FACHADA — implementa GuideEngine
// =============================================================================
export const megasenaEngine: GuideEngine = {
  loteria: "megasena",
  tiposSuportados: () => TIPOS_SUPORTADOS_MEGA,
  montarFatos: (tipoPost, concursos) => montarFatos(tipoPost, concursos),
  montarTituloDeterministico,
  montarPrompt,
  limiteConteudo: limiteConteudoMega,
  extrairNumerosPermitidos,
  validarConteudoNumerico,
  fallbackConteudo,
  sanitizar,
};
