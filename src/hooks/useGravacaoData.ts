import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  calcularIndicadores,
  contarPares,
  contarImpares,
  contarPrimos,
  contarMoldura,
  contarRepetidas,
  calcularSoma,
  contarSequencias,
  formatarDezena,
  TOTAL_DEZENAS_VOLANTE,
  DEZENAS_POR_SORTEIO,
} from "@/lib/lotofacil";

export interface DezenaScore {
  dezena: number;
  ocorrencias: number;
  atraso: number;
  scoreOcorrencia: number;
  scoreTiming: number;
  scoreTendencia: number;
  scoreFinal: number;
  estado: "quente" | "neutro" | "frio";
}

export interface JogoStats {
  pares: number;
  impares: number;
  primos: number;
  moldura: number;
  soma: number;
  repetidas: number;
  quentes: number;
  frios: number;
}

export interface GravacaoJogo {
  dezenas: number[];
  label: string;
  tipo: "recomendado" | "forca" | "oportunidade";
  stats: JogoStats;
}

export interface EstatisticaItem {
  label: string;
  valor: number;
  faixaMin: number;
  faixaMax: number;
  status: "dentro" | "limite" | "fora";
}

export interface GravacaoData {
  concurso: number;
  data: string;
  premiacao: string;
  dezenas: number[];
  dezenasFormatadas: string[];
  estatisticas: EstatisticaItem[];
  jogos: GravacaoJogo[];
  loading: boolean;
}

interface ConcursoRaw {
  concurso: number;
  dezenas: number[];
  data_sorteio: string | null;
  valor_premio_principal: number | null;
}

function calcularAtraso(dezena: number, concursos: ConcursoRaw[]): number {
  for (let i = 0; i < concursos.length; i++) {
    if (concursos[i].dezenas.includes(dezena)) return i;
  }
  return concursos.length;
}

function determinarEstado(freqRecente: number): "quente" | "neutro" | "frio" {
  if (freqRecente >= 3) return "quente";
  if (freqRecente === 2) return "neutro";
  return "frio";
}

function calcularScores(concursos: ConcursoRaw[]): DezenaScore[] {
  const ultimos5 = concursos.slice(0, 5);
  const scores: DezenaScore[] = [];

  // Count occurrences
  const ocorrenciasMap: Record<number, number> = {};
  for (let d = 1; d <= TOTAL_DEZENAS_VOLANTE; d++) {
    ocorrenciasMap[d] = ultimos5.filter(c => c.dezenas.includes(d)).length;
  }
  const maxOcorrencias = Math.max(...Object.values(ocorrenciasMap), 1);

  // Expected frequency in 5 draws: 15/25 * 5 = 3
  const freqEsperada = (DEZENAS_POR_SORTEIO / TOTAL_DEZENAS_VOLANTE) * 5;

  for (let d = 1; d <= TOTAL_DEZENAS_VOLANTE; d++) {
    const ocorrencias = ocorrenciasMap[d];
    const atraso = calcularAtraso(d, concursos);
    const estado = determinarEstado(ocorrencias);

    const scoreOcorrencia = ocorrencias / maxOcorrencias;
    const rawTiming = 1 - Math.abs(atraso - freqEsperada) / freqEsperada;
    const scoreTiming = Math.max(0, Math.min(1, rawTiming));
    const scoreTendencia = estado === "quente" ? 1 : estado === "neutro" ? 0.5 : 0;

    const scoreFinal =
      0.3 * scoreOcorrencia +
      0.5 * scoreTiming +
      0.2 * scoreTendencia;

    scores.push({
      dezena: d,
      ocorrencias,
      atraso,
      scoreOcorrencia,
      scoreTiming,
      scoreTendencia,
      scoreFinal,
      estado,
    });
  }

  return scores;
}

function contarConsecutivos(dezenas: number[]): number {
  const sorted = [...dezenas].sort((a, b) => a - b);
  let maxSeq = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      current++;
      maxSeq = Math.max(maxSeq, current);
    } else {
      current = 1;
    }
  }
  return maxSeq;
}

function validarJogo(dezenas: number[]): boolean {
  if (contarConsecutivos(dezenas) > 4) return false;
  const pares = contarPares(dezenas);
  if (pares < 5 || pares > 10) return false;
  const baixos = dezenas.filter(d => d <= 12).length;
  if (baixos < 4 || baixos > 11) return false;
  return true;
}

function montarJogo(
  scores: DezenaScore[],
  sortKey: (s: DezenaScore) => number,
  tentativas = 100
): number[] {
  const sorted = [...scores].sort((a, b) => sortKey(b) - sortKey(a));
  
  for (let t = 0; t < tentativas; t++) {
    const quentes = sorted.filter(s => s.estado === "quente");
    const neutros = sorted.filter(s => s.estado === "neutro");
    const frios = sorted.filter(s => s.estado === "frio");

    const nQuentes = 5 + Math.floor(Math.random() * 3); // 5-7
    const nFrios = 2 + Math.floor(Math.random() * 3);    // 2-4
    const nNeutros = 15 - nQuentes - nFrios;

    const pick = (arr: DezenaScore[], n: number): number[] => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(n, arr.length)).map(s => s.dezena);
    };

    const selected = [
      ...pick(quentes, nQuentes),
      ...pick(neutros, nNeutros),
      ...pick(frios, nFrios),
    ];

    // Deduplicate and fill to 15
    const unique = [...new Set(selected)];
    if (unique.length < 15) {
      const remaining = sorted
        .filter(s => !unique.includes(s.dezena))
        .map(s => s.dezena);
      while (unique.length < 15 && remaining.length > 0) {
        unique.push(remaining.shift()!);
      }
    }

    const jogo = unique.slice(0, 15).sort((a, b) => a - b);
    if (validarJogo(jogo)) return jogo;
  }

  // Fallback: top 15 by score
  return sorted.slice(0, 15).map(s => s.dezena).sort((a, b) => a - b);
}

function calcJogoStats(dezenas: number[], scores: DezenaScore[], dezenasAnteriores?: number[]): JogoStats {
  return {
    pares: contarPares(dezenas),
    impares: contarImpares(dezenas),
    primos: contarPrimos(dezenas),
    moldura: contarMoldura(dezenas),
    soma: calcularSoma(dezenas),
    repetidas: dezenasAnteriores ? contarRepetidas(dezenas, dezenasAnteriores) : 0,
    quentes: dezenas.filter(d => scores.find(s => s.dezena === d)?.estado === "quente").length,
    frios: dezenas.filter(d => scores.find(s => s.dezena === d)?.estado === "frio").length,
  };
}

function gerarJogos(scores: DezenaScore[], dezenasAnteriores?: number[]): GravacaoJogo[] {
  const recomendado = montarJogo(scores, s => s.scoreFinal);
  const forca = montarJogo(scores, s => s.scoreOcorrencia);
  const oportunidade = montarJogo(
    scores,
    s => (s.estado === "frio" ? 1 : 0) * 0.6 + s.scoreTiming * 0.4
  );

  return [
    { dezenas: recomendado, label: "Recomendado", tipo: "recomendado", stats: calcJogoStats(recomendado, scores, dezenasAnteriores) },
    { dezenas: forca, label: "Alternativa 1", tipo: "forca", stats: calcJogoStats(forca, scores, dezenasAnteriores) },
    { dezenas: oportunidade, label: "Alternativa 2", tipo: "oportunidade", stats: calcJogoStats(oportunidade, scores, dezenasAnteriores) },
  ];
}

// Faixas de tendência da Lotofácil (15 de 25)
const FAIXAS: Record<string, [number, number]> = {
  Repetidas: [7, 11],
  Primos: [4, 7],
  Moldura: [8, 12],
  Pares: [6, 9],
  Ímpares: [6, 9],
  Soma: [170, 220],
};

function statusFromFaixa(valor: number, min: number, max: number): "dentro" | "limite" | "fora" {
  if (valor >= min && valor <= max) return "dentro";
  if (valor === min - 1 || valor === max + 1) return "limite";
  // For soma, allow wider limit range
  if (min > 20) {
    if (Math.abs(valor - min) <= 10 || Math.abs(valor - max) <= 10) return "limite";
  }
  return "fora";
}

export function useGravacaoData() {
  return useQuery({
    queryKey: ["gravacao-lotofacil"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, dezenas, data_sorteio, valor_premio_principal")
        .eq("loteria", "lotofacil")
        .order("concurso", { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Sem dados");

      const concursos: ConcursoRaw[] = data.map((r: any) => ({
        concurso: r.concurso,
        dezenas: r.dezenas as number[],
        data_sorteio: r.data_sorteio,
        valor_premio_principal: r.valor_premio_principal,
      }));

      const ultimo = concursos[0];
      const anterior = concursos[1];
      const dezenas = [...ultimo.dezenas].sort((a, b) => a - b);

      // Estatísticas
      const repetidas = anterior ? contarRepetidas(dezenas, anterior.dezenas) : 0;
      const primos = contarPrimos(dezenas);
      const moldura = contarMoldura(dezenas);
      const pares = contarPares(dezenas);
      const impares = contarImpares(dezenas);
      const soma = calcularSoma(dezenas);

      const estatisticas: EstatisticaItem[] = [
        { label: "Repetidas", valor: repetidas, faixaMin: FAIXAS.Repetidas[0], faixaMax: FAIXAS.Repetidas[1], status: statusFromFaixa(repetidas, ...FAIXAS.Repetidas) },
        { label: "Primos", valor: primos, faixaMin: FAIXAS.Primos[0], faixaMax: FAIXAS.Primos[1], status: statusFromFaixa(primos, ...FAIXAS.Primos) },
        { label: "Moldura", valor: moldura, faixaMin: FAIXAS.Moldura[0], faixaMax: FAIXAS.Moldura[1], status: statusFromFaixa(moldura, ...FAIXAS.Moldura) },
        { label: "Pares", valor: pares, faixaMin: FAIXAS.Pares[0], faixaMax: FAIXAS.Pares[1], status: statusFromFaixa(pares, ...FAIXAS.Pares) },
        { label: "Ímpares", valor: impares, faixaMin: FAIXAS.Ímpares[0], faixaMax: FAIXAS.Ímpares[1], status: statusFromFaixa(impares, ...FAIXAS.Ímpares) },
        { label: "Soma", valor: soma, faixaMin: FAIXAS.Soma[0], faixaMax: FAIXAS.Soma[1], status: statusFromFaixa(soma, ...FAIXAS.Soma) },
      ];

      // V3 scoring
      const scores = calcularScores(concursos);
      const jogos = gerarJogos(scores);

      // Format date
      let dataFormatada = "";
      if (ultimo.data_sorteio) {
        const d = new Date(ultimo.data_sorteio + "T00:00:00");
        dataFormatada = d.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }

      // Format prize
      const premiacaoFormatada = ultimo.valor_premio_principal
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ultimo.valor_premio_principal)
        : "—";

      return {
        concurso: ultimo.concurso,
        data: dataFormatada,
        premiacao: premiacaoFormatada,
        dezenas,
        dezenasFormatadas: dezenas.map(formatarDezena),
        estatisticas,
        jogos,
        loading: false,
      } as GravacaoData;
    },
  });
}
