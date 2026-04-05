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

export interface GravacaoData {
  concurso: number;
  data: string;
  premiacao: string;
  dezenas: number[];
  dezenasFormatadas: string[];
  estatisticas: EstatisticaItem[];
  jogos: GravacaoJogo[];
  estrategiaIA?: EstrategiaIA;
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

// ── Main hook ──

export function useGravacaoData() {
  return useQuery({
    queryKey: ["gravacao-lotofacil"],
    queryFn: async () => {
      // 1. Fetch last 10 concursos for stats display
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
        estrategiaIA,
        loading: false,
      } as GravacaoData;
    },
  });
}
