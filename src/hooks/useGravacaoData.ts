import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  contarPares,
  contarImpares,
  contarPrimos,
  contarMoldura,
  contarRepetidas,
  calcularSoma,
  formatarDezena,
  TOTAL_DEZENAS_VOLANTE,
  DEZENAS_POR_SORTEIO,
} from "@/lib/lotofacil";

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

export interface EstrategiaIA {
  conclusao: string;
  ferramentas: string[];
  filtros_aplicados: { filtro: string; valor_alvo: string; motivo: string }[];
  dezenas_fixas: { dezenas: number[]; motivo: string }[];
  dezenas_evitadas: { dezenas: number[]; motivo: string }[];
}

export interface TendenciaFaixa {
  valor: number;
  complementar: number;
  ocorrencias: number;
  atraso: number;
  media: number;
  isDestaque: boolean;  // atraso >= media (pronto para sair)
  isTopOcorrencia: boolean; // top 3 ocorrências
}

export interface TendenciaIndicador {
  label: string;
  emoji: string;
  faixas: TendenciaFaixa[];
}

export interface FrequenciaDezena {
  dezena: number;
  freq: number;
  pct: number;
  tipo: "quente" | "fria" | "neutra";
}

export interface DuplaFrequente {
  d1: number;
  d2: number;
  freq: number;
}

export interface FaixaPremiacao {
  faixa: string;
  ganhadores: number;
  valorPremio: number;
  valorPremioFormatado: string;
}

export interface ConcursoHistorico {
  concurso: number;
  dezenas: number[];
}

export interface ProximoConcursoInfo {
  numero: string | null;
  data: string | null;
  premioEstimadoFormatado: string | null;
  acumulado: boolean;
}

export interface GravacaoData {
  concurso: number;
  data: string;
  premiacao: string;
  faixasPremiacao: FaixaPremiacao[];
  proximoConcurso?: ProximoConcursoInfo;
  dezenas: number[];
  dezenasFormatadas: string[];
  estatisticas: EstatisticaItem[];
  jogos: GravacaoJogo[];
  estrategiaIA?: EstrategiaIA;
  tendencias: TendenciaIndicador[];
  frequenciaDezenas: FrequenciaDezena[];
  topDuplas: DuplaFrequente[];
  historicoConcursos: ConcursoHistorico[];
  loading: boolean;
}

interface ConcursoRaw {
  concurso: number;
  dezenas: number[];
  data_sorteio: string | null;
  valor_premio_principal: number | null;
}

// ── Stats helpers ──

function calcJogoStats(dezenas: number[], dezenasAnteriores?: number[], concursos?: ConcursoRaw[]): JogoStats {
  // Count quentes/frios based on last 5 concursos frequency
  let quentes = 0;
  let frios = 0;
  if (concursos && concursos.length >= 5) {
    const ultimos5 = concursos.slice(0, 5);
    for (const d of dezenas) {
      const freq = ultimos5.filter(c => c.dezenas.includes(d)).length;
      if (freq >= 3) quentes++;
      else if (freq <= 1) frios++;
    }
  }

  return {
    pares: contarPares(dezenas),
    impares: contarImpares(dezenas),
    primos: contarPrimos(dezenas),
    moldura: contarMoldura(dezenas),
    soma: calcularSoma(dezenas),
    repetidas: dezenasAnteriores ? contarRepetidas(dezenas, dezenasAnteriores) : 0,
    quentes,
    frios,
  };
}

// ── Faixas e estatísticas ──

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
  if (min > 20) {
    if (Math.abs(valor - min) <= 10 || Math.abs(valor - max) <= 10) return "limite";
  }
  return "fora";
}

// ── Tendências helper ──

type CampoTendencia = "qtd_pares" | "qtd_primos" | "qtd_moldura" | "qtd_repetidas";

interface TendenciaConfig {
  campo: CampoTendencia;
  label: string;
  emoji: string;
}

const TENDENCIA_CONFIGS: TendenciaConfig[] = [
  { campo: "qtd_pares", label: "Pares/Ímpares", emoji: "🎯" },
  { campo: "qtd_primos", label: "Primos", emoji: "🔢" },
  { campo: "qtd_moldura", label: "Moldura/Miolo", emoji: "🖼️" },
  { campo: "qtd_repetidas", label: "Repetidas/Novas", emoji: "🔄" },
];

function calcTendenciaIndicador(
  allData: any[],
  config: TendenciaConfig,
  concursoMaisRecente: number
): TendenciaIndicador {
  const totalConcursos = allData.length;
  const agrupado = new Map<number, { ocorrencias: number; ultimaOcorrencia: number }>();

  for (const r of allData) {
    const qtd = (r as Record<string, unknown>)[config.campo] as number ?? 0;
    if (!agrupado.has(qtd)) {
      agrupado.set(qtd, { ocorrencias: 0, ultimaOcorrencia: r.concurso });
    }
    const item = agrupado.get(qtd)!;
    item.ocorrencias++;
    if (r.concurso > item.ultimaOcorrencia) {
      item.ultimaOcorrencia = r.concurso;
    }
  }

  const faixasRaw = Array.from(agrupado.entries())
    .map(([valor, item]) => ({
      valor,
      complementar: 15 - valor,
      ocorrencias: item.ocorrencias,
      atraso: concursoMaisRecente - item.ultimaOcorrencia,
      media: Math.round(totalConcursos / item.ocorrencias),
    }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias);

  // Top 3 por ocorrências
  const top3Set = new Set(faixasRaw.slice(0, 3).map((f) => f.valor));

  // Destaque: atraso >= media (pronto para sair), top 5
  const destaquesOrdenados = faixasRaw
    .filter((f) => f.atraso >= f.media)
    .sort((a, b) => b.atraso - a.atraso)
    .slice(0, 5)
    .map((f) => f.valor);
  const destaqueSet = new Set(destaquesOrdenados);

  const faixas: TendenciaFaixa[] = faixasRaw.map((f) => ({
    ...f,
    isDestaque: destaqueSet.has(f.valor),
    isTopOcorrencia: top3Set.has(f.valor),
  }));

  return { label: config.label, emoji: config.emoji, faixas };
}

// ── Main hook ──

export function useGravacaoData() {
  return useQuery({
    queryKey: ["gravacao-lotofacil"],
    queryFn: async () => {
      // 1. Fetch last 12 concursos for stats display + historico slide
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, dezenas, data_sorteio, valor_premio_principal")
        .eq("loteria", "lotofacil")
        .order("concurso", { ascending: false })
        .limit(12);

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

      // 2. Estatísticas do último concurso
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

      // 2b. Frequência das dezenas nos últimos 5 concursos
      const ultimos5 = concursos.slice(0, Math.min(5, concursos.length));
      const freqMap = new Map<number, number>();
      for (let d = 1; d <= 25; d++) freqMap.set(d, 0);
      for (const c of ultimos5) {
        for (const d of c.dezenas) {
          freqMap.set(d, (freqMap.get(d) ?? 0) + 1);
        }
      }
      const totalSorteios5 = ultimos5.length * 15; // 15 dezenas por sorteio
      const frequenciaDezenas: FrequenciaDezena[] = Array.from(freqMap.entries())
        .map(([dez, freq]) => ({
          dezena: dez,
          freq,
          pct: (freq / ultimos5.length) * 100,
          tipo: freq >= 3 ? "quente" as const : freq <= 1 ? "fria" as const : "neutra" as const,
        }))
        .sort((a, b) => b.freq - a.freq || a.dezena - b.dezena);

      // 2b2. Top 3 duplas mais frequentes nos últimos 5 concursos
      const duplaMap = new Map<string, number>();
      for (const c of ultimos5) {
        const sorted = [...c.dezenas].sort((a, b) => a - b);
        for (let i = 0; i < sorted.length; i++) {
          for (let j = i + 1; j < sorted.length; j++) {
            const key = `${sorted[i]}-${sorted[j]}`;
            duplaMap.set(key, (duplaMap.get(key) ?? 0) + 1);
          }
        }
      }
      const topDuplas: DuplaFrequente[] = Array.from(duplaMap.entries())
        .map(([key, freq]) => {
          const [d1, d2] = key.split("-").map(Number);
          return { d1, d2, freq };
        })
        .sort((a, b) => b.freq - a.freq)
        .slice(0, 3);

      // 2c. Fetch ALL concursos for tendências calculation
      const { data: allTendData, error: tendError } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, qtd_pares, qtd_primos, qtd_moldura, qtd_repetidas")
        .eq("loteria", "lotofacil")
        .order("concurso", { ascending: false });

      if (tendError) throw tendError;

      const tendencias: TendenciaIndicador[] = allTendData && allTendData.length > 0
        ? TENDENCIA_CONFIGS.map((cfg) =>
            calcTendenciaIndicador(allTendData, cfg, allTendData[0].concurso)
          )
        : [];

      // 3. Call generate-palpites edge function (same as Gerador & WhatsApp)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Usuário não autenticado");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-palpites`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ quantidade: 3, qtdDezenas: 15, periodoAnalise: 5 }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ao gerar palpites (${response.status})`);
      }

      const aiData = await response.json();

      if (!aiData.jogos || aiData.jogos.length < 3) {
        throw new Error("IA retornou jogos insuficientes");
      }

      // 4. Map AI games to GravacaoJogo with local stats
      const tipos: Array<"recomendado" | "forca" | "oportunidade"> = ["recomendado", "forca", "oportunidade"];
      const labels = ["Recomendado", "Força Histórica", "Oportunidade"];

      const jogos: GravacaoJogo[] = aiData.jogos.slice(0, 3).map((j: { dezenas: number[] }, i: number) => {
        const dez = [...j.dezenas].sort((a, b) => a - b);
        return {
          dezenas: dez,
          label: labels[i],
          tipo: tipos[i],
          stats: calcJogoStats(dez, anterior?.dezenas, concursos),
        };
      });

      // 5. Extract AI strategy
      const estrategiaIA: EstrategiaIA | undefined = aiData.estrategia
        ? {
            conclusao: aiData.estrategia.conclusao || "",
            ferramentas: aiData.estrategia.ferramentas || [],
            filtros_aplicados: aiData.estrategia.filtros_aplicados || [],
            dezenas_fixas: aiData.estrategia.dezenas_fixas || [],
            dezenas_evitadas: aiData.estrategia.dezenas_evitadas || [],
          }
        : undefined;

      // 6. Format date & prize
      let dataFormatada = "";
      if (ultimo.data_sorteio) {
        const d = new Date(ultimo.data_sorteio + "T00:00:00");
        dataFormatada = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
      }

      // Calculate total prize from premiacao_json if available
      let premiacaoTotal = 0;
      const { data: premData } = await (supabase as any)
        .from("resultados_loterias")
        .select("premiacao_json")
        .eq("loteria", "lotofacil")
        .eq("concurso", ultimo.concurso)
        .single();

      const faixasPremiacao: FaixaPremiacao[] = [];
      const currFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

      if (premData?.premiacao_json && Array.isArray(premData.premiacao_json) && premData.premiacao_json.length > 0) {
        for (const f of premData.premiacao_json as any[]) {
          const premio = f.valorPremio ?? f.valor_premio ?? f.valor ?? 0;
          const ganhadores = f.ganhadores ?? f.numero_ganhadores ?? 0;
          const faixa = f.faixa ?? f.descricao ?? f.acertos ?? "";
          premiacaoTotal += ganhadores * premio;
          faixasPremiacao.push({
            faixa: String(faixa),
            ganhadores,
            valorPremio: premio,
            valorPremioFormatado: currFmt.format(premio),
          });
        }
      }

      const premiacaoFormatada = premiacaoTotal > 0
        ? currFmt.format(premiacaoTotal)
        : ultimo.valor_premio_principal
          ? currFmt.format(ultimo.valor_premio_principal)
          : "—";

      // Build historico (all 12 concursos, sorted desc)
      const historicoConcursos: ConcursoHistorico[] = concursos.map(c => ({
        concurso: c.concurso,
        dezenas: [...c.dezenas].sort((a, b) => a - b),
      }));

      return {
        concurso: ultimo.concurso,
        data: dataFormatada,
        premiacao: premiacaoFormatada,
        faixasPremiacao,
        dezenas,
        dezenasFormatadas: dezenas.map(formatarDezena),
        estatisticas,
        jogos,
        estrategiaIA,
        tendencias,
        frequenciaDezenas,
        topDuplas,
        historicoConcursos,
        loading: false,
      } as GravacaoData;
    },
  });
}
