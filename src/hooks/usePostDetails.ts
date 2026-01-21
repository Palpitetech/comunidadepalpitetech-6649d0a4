import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export interface PostComment {
  id: string;
  conteudo: string;
  created_at: string;
  user_id: string;
  perfis: {
    nome: string | null;
    avatar_url: string | null;
    is_bot: boolean | null;
  } | null;
}

export interface PostDetails {
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

export function usePostDetails(postId: string) {
  const { user } = useAuthContext();

  const postQuery = useQuery({
    queryKey: ["post", postId],
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
        .eq("id", postId)
        .single();

      if (error) throw error;
      return data as PostDetails;
    },
    enabled: !!postId,
  });

  const commentsQuery = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      // Buscar comentários
      const { data: commentsData, error: commentsError } = await supabase
        .from("post_comments")
        .select("id, conteudo, created_at, user_id")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) return [];

      // Buscar perfis dos autores
      const userIds = [...new Set(commentsData.map((c) => c.user_id))];
      const { data: profilesData } = await supabase
        .from("perfis")
        .select("id, nome, avatar_url, is_bot")
        .in("id", userIds);

      const profilesMap = new Map(
        profilesData?.map((p) => [p.id, { nome: p.nome, avatar_url: p.avatar_url, is_bot: p.is_bot }]) || []
      );

      // Combinar dados
      return commentsData.map((comment) => ({
        ...comment,
        perfis: profilesMap.get(comment.user_id) || null,
      })) as PostComment[];
    },
    enabled: !!postId,
  });

  const likeQuery = useQuery({
    queryKey: ["post-like", postId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!postId && !!user?.id,
  });

  return {
    post: postQuery.data,
    isLoadingPost: postQuery.isLoading,
    comments: commentsQuery.data || [],
    isLoadingComments: commentsQuery.isLoading,
    isLiked: likeQuery.data || false,
    refetchComments: commentsQuery.refetch,
    refetchPost: postQuery.refetch,
    refetchLike: likeQuery.refetch,
  };
}
