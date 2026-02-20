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
  tipo: string | null;
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
      const { data: postsData, error } = await supabase
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
          tipo,
          tool_snapshot,
          external_link_url,
          external_link_text
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!postsData || postsData.length === 0) return [];

      // Fetch public profiles separately (uses perfis_publicos view - no sensitive data)
      const userIds = [...new Set(postsData.map((p) => p.user_id))];
      const { data: profilesData } = await supabase
        .from("perfis_publicos" as any)
        .select("id, nome, avatar_url, is_bot")
        .in("id", userIds);

      const profilesMap = new Map(
        profilesData?.map((p: any) => [p.id, { nome: p.nome, avatar_url: p.avatar_url, is_bot: p.is_bot }]) || []
      );

      const data = postsData.map((post) => ({
        ...post,
        perfis: profilesMap.get(post.user_id) || null,
      }));

      if (error) throw error;
      return data as CommunityPost[];
    },
  });
}
