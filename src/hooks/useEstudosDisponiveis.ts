import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EstudoDisponivel {
  id: string;
  slug: string | null;
  titulo: string | null;
  tema_estudo: string | null;
  status: string;
  publicar_em: string | null;
  loteria_tag: string;
  proximo_concurso: number | null;
  ultimo_concurso: number | null;
  recomendacao_direta: string | null;
  eh_futuro: boolean;
  data_sorteio: string | null;
}

interface ListResponse {
  success: boolean;
  loteria: string;
  ultimo_concurso_oficial: number;
  estudos: EstudoDisponivel[];
}

const TAG_BY_LOTERIA: Record<string, string> = {
  lotofacil: "Lotofácil",
  megasena: "Mega-Sena",
};

const CACHE_PREFIX = "estudos-disponiveis-cache:v1:";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

function lerCache(loteria: string): ListResponse | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + loteria);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { ts: number; data: ListResponse };
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
}

function gravarCache(loteria: string, data: ListResponse) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + loteria,
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch {
    // localStorage cheio/bloqueado - silencia
  }
}

async function buscarEstudos(loteria: "lotofacil" | "megasena"): Promise<ListResponse> {
  const tag = TAG_BY_LOTERIA[loteria];

  // Consulta direta (mais rápida que edge function)
  const { data: posts, error } = await (supabase as any)
    .from("postagens")
    .select("id, titulo, tema_estudo, status, publicar_em, fatos_snapshot, slug, loteria_tag")
    .eq("loteria_tag", tag)
    .in("status", ["publicado", "rascunho"])
    .not("fatos_snapshot", "is", null)
    .order("publicar_em", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;

  const { data: ultimo } = await (supabase as any)
    .from("resultados_loterias")
    .select("concurso")
    .eq("loteria", loteria)
    .order("concurso", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ultimoConcursoOficial: number = ultimo?.concurso ?? 0;

  const numerosProximos = Array.from(
    new Set(
      (posts || [])
        .map((p: any) => p.fatos_snapshot?.proximo_concurso)
        .filter((n: any) => typeof n === "number"),
    ),
  ).map((n) => String(n));

  const dataPorConcurso: Record<string, string | null> = {};
  if (numerosProximos.length) {
    const { data: prox } = await (supabase as any)
      .from("proximos_concursos")
      .select("numero_concurso, data_sorteio")
      .eq("loteria", loteria)
      .in("numero_concurso", numerosProximos);
    for (const r of prox || []) {
      dataPorConcurso[r.numero_concurso] = r.data_sorteio;
    }
  }

  const estudos: EstudoDisponivel[] = (posts || []).map((p: any) => {
    const snap = p.fatos_snapshot || {};
    const proximo = snap.proximo_concurso ?? null;
    const ehFuturo = typeof proximo === "number" && proximo > ultimoConcursoOficial;
    const dataSorteio = proximo != null ? dataPorConcurso[String(proximo)] ?? null : null;
    return {
      id: p.id,
      slug: p.slug,
      titulo: p.titulo,
      tema_estudo: p.tema_estudo,
      status: p.status,
      publicar_em: p.publicar_em,
      loteria_tag: p.loteria_tag,
      proximo_concurso: proximo,
      ultimo_concurso: snap.ultimo_concurso ?? null,
      recomendacao_direta: snap.recomendacao_direta ?? null,
      eh_futuro: ehFuturo,
      data_sorteio: dataSorteio,
    };
  });

  const response: ListResponse = {
    success: true,
    loteria,
    ultimo_concurso_oficial: ultimoConcursoOficial,
    estudos,
  };
  gravarCache(loteria, response);
  return response;
}

export function useEstudosDisponiveis(loteria: "lotofacil" | "megasena") {
  return useQuery({
    queryKey: ["estudos-disponiveis", loteria],
    queryFn: () => buscarEstudos(loteria),
    staleTime: 60_000,
    placeholderData: () => lerCache(loteria),
  });
}
