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
}

interface ListResponse {
  success: boolean;
  loteria: string;
  ultimo_concurso_oficial: number;
  estudos: EstudoDisponivel[];
}

export function useEstudosDisponiveis(loteria: "lotofacil" | "megasena") {
  return useQuery({
    queryKey: ["estudos-disponiveis", loteria],
    queryFn: async (): Promise<ListResponse> => {
      const { data, error } = await supabase.functions.invoke("list-estudos-disponiveis", {
        body: undefined,
        method: "GET",
        // @ts-expect-error - invoke aceita query via path
        headers: {},
      });
      // Fallback manual para garantir query string
      if (error || !data) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-estudos-disponiveis?loteria=${loteria}&limit=10`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!resp.ok) throw new Error("Erro ao listar estudos");
        return await resp.json();
      }
      return data as ListResponse;
    },
    staleTime: 60_000,
  });
}
