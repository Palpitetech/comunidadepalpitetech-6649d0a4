import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EstudoListItem {
  id: string;
  titulo: string | null;
  status: string;
  publicar_em: string | null;
  created_at: string;
  proximo_concurso: number | null;
  data_proximo_sorteio: string | null; // YYYY-MM-DD
}

interface Args {
  loteriaTag: string;
  temaEstudo: string;
  limit?: number;
  enabled?: boolean;
}

// Mapeia o valor exibido em postagens.loteria_tag -> slug usado em proximos_concursos.loteria
const TAG_TO_SLUG: Record<string, string> = {
  "Mega-Sena": "megasena",
  "Lotofácil": "lotofacil",
  "Quina": "quina",
  "Dupla-Sena": "duplasena",
  "Dupla Sena": "duplasena",
  "Lotomania": "lotomania",
  "Dia de Sorte": "diadesorte",
};

/**
 * Lista os estudos (rascunhos + publicados) de um tema específico de uma loteria,
 * ordenados pelo número do próximo concurso (mais recente primeiro).
 * Enriquece cada item com a data oficial do próximo sorteio (proximos_concursos).
 */
export function useEstudosGravacaoLista({
  loteriaTag,
  temaEstudo,
  limit = 30,
  enabled = true,
}: Args) {
  return useQuery({
    queryKey: ["estudos-gravacao-lista", loteriaTag, temaEstudo, limit],
    enabled: enabled && !!loteriaTag && !!temaEstudo,
    queryFn: async (): Promise<EstudoListItem[]> => {
      const { data, error } = await (supabase as any)
        .from("postagens")
        .select("id, titulo, status, publicar_em, created_at, fatos_snapshot")
        .eq("loteria_tag", loteriaTag)
        .eq("tema_estudo", temaEstudo)
        .in("status", ["publicado", "rascunho"])
        .not("fatos_snapshot", "is", null)
        .order("publicar_em", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      const base: EstudoListItem[] = (data || []).map((p: any) => ({
        id: p.id,
        titulo: p.titulo,
        status: p.status,
        publicar_em: p.publicar_em,
        created_at: p.created_at,
        proximo_concurso: p.fatos_snapshot?.proximo_concurso ?? null,
        data_proximo_sorteio: null,
      }));

      // Busca data oficial dos próximos concursos referenciados
      const slug = TAG_TO_SLUG[loteriaTag];
      const numeros = Array.from(
        new Set(
          base
            .map((e) => e.proximo_concurso)
            .filter((n): n is number => typeof n === "number"),
        ),
      ).map((n) => String(n));

      if (slug && numeros.length) {
        const { data: prox } = await (supabase as any)
          .from("proximos_concursos")
          .select("numero_concurso, data_sorteio")
          .eq("loteria", slug)
          .in("numero_concurso", numeros);
        const mapa = new Map<string, string>();
        for (const r of prox || []) mapa.set(String(r.numero_concurso), r.data_sorteio);
        for (const e of base) {
          if (e.proximo_concurso != null) {
            e.data_proximo_sorteio = mapa.get(String(e.proximo_concurso)) ?? null;
          }
        }
      }

      // Ordena por proximo_concurso desc (nulls por último)
      base.sort((a, b) => {
        const A = a.proximo_concurso ?? -Infinity;
        const B = b.proximo_concurso ?? -Infinity;
        return B - A;
      });

      return base;
    },
    staleTime: 60_000,
  });
}
