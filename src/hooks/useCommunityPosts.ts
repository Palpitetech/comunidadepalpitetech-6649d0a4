import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
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

async function fetchCommunityPosts(): Promise<CommunityPost[]> {
  const { data: postsData, error } = await supabase
    .from("postagens")
    .select(
      `id, titulo, conteudo, loteria_tag, media_url, media_type, curtidas,
       respostas_count, created_at, user_id, tipo, tool_snapshot,
       external_link_url, external_link_text`
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  if (!postsData || postsData.length === 0) return [];

  const userIds = [...new Set(postsData.map((p) => p.user_id))];
  const { data: profilesData } = await supabase
    .from("perfis_publicos" as any)
    .select("id, nome, avatar_url, is_bot")
    .in("id", userIds);

  const profilesMap = new Map(
    profilesData?.map((p: any) => [p.id, { nome: p.nome, avatar_url: p.avatar_url, is_bot: p.is_bot }]) || []
  );

  return postsData.map((post) => ({
    ...post,
    perfis: profilesMap.get(post.user_id) || null,
  })) as CommunityPost[];
}

export function useCommunityPosts() {
  const queryClient = useQueryClient();

  // Realtime subscription — invalidate query on any change
  useEffect(() => {
    const channel = supabase
      .channel("community-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "postagens" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["community-posts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const query = useQuery({
    queryKey: ["community-posts"],
    queryFn: fetchCommunityPosts,
    staleTime: 60_000, // 1 min — avoid refetching on every mount
    gcTime: 5 * 60_000, // 5 min cache
  });

  // Prefetch a post detail when the user is about to tap it
  const prefetchPost = useCallback(
    (postId: string) => {
      // Seed post detail from existing feed data (instant)
      const posts = queryClient.getQueryData<CommunityPost[]>(["community-posts"]);
      const cached = posts?.find((p) => p.id === postId);
      if (cached) {
        queryClient.setQueryData(["post", postId], (old: any) => {
          if (old) return old; // don't overwrite full detail
          return {
            ...cached,
            cta_override_enabled: false,
            cta_override_text: null,
            cta_override_buttons: [],
          };
        });
      }
    },
    [queryClient]
  );

  return { ...query, prefetchPost };
}
