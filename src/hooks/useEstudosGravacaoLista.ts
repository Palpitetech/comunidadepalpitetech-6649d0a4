import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EstudoListItem {
  id: string;
  titulo: string | null;
  status: string;
  publicar_em: string | null;
  created_at: string;
  proximo_concurso: number | null;
}

interface Args {
  loteriaTag: string;
  temaEstudo: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Lista os estudos (rascunhos + publicados) de um tema específico de uma loteria,
 * em ordem cronológica decrescente. Fonte: tabela `postagens`.
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
      return (data || []).map((p: any) => ({
        id: p.id,
        titulo: p.titulo,
        status: p.status,
        publicar_em: p.publicar_em,
        created_at: p.created_at,
        proximo_concurso: p.fatos_snapshot?.proximo_concurso ?? null,
      }));
    },
    staleTime: 60_000,
  });
}
