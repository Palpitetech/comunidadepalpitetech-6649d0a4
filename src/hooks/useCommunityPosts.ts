import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommunityPost {
  id: string;
  titulo: string | null;
  conteudo: string;
  loteria_tag: string | null;
  media_url: string | null;
  media_type: string | null;
  curtidas: number | null;
  respostas_count: number | null;
  created_at: string;
  user_id: string;
  tool_snapshot: boolean | null;
  external_link_url: string | null;
  external_link_text: string | null;
  perfis: {
    nome: string | null;
    avatar_url: string | null;
    is_bot: boolean | null;
  } | null;
}

export function useCommunityPosts() {
  return useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("postagens")
        .select(
          `
          id,
          titulo,
          conteudo,
          loteria_tag,
          media_url,
          media_type,
          curtidas,
          respostas_count,
          created_at,
          user_id,
          tool_snapshot,
          external_link_url,
          external_link_text,
          perfis:user_id (nome, avatar_url, is_bot)
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CommunityPost[];
    },
  });
}
