import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface CtaButton {
  label: string;
  action: {
    type: "navigate" | "open_chat_topic";
    url?: string;
    topic?: string;
    autoSend?: boolean;
    message?: string;
  };
}

export interface PostComment {
  id: string;
  conteudo: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  perfis: {
    nome: string | null;
    avatar_url: string | null;
    is_bot: boolean | null;
  } | null;
  replies?: PostComment[];
}

export interface PostDetails {
  id: string;
  slug: string | null;
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
  cta_override_enabled?: boolean;
  cta_override_text?: string | null;
  cta_override_buttons?: CtaButton[];
}

export function usePostDetails(slugOrId: string) {
  const { user } = useAuthContext();

  const postQuery = useQuery({
    queryKey: ["post", slugOrId],
    queryFn: async (): Promise<PostDetails> => {
      // Try slug first, then fallback to id
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

      let postData: any = null;

      if (!isUuid) {
        const { data } = await supabase
          .from("postagens")
          .select(
            `id, slug, titulo, conteudo, loteria_tag, media_url, media_type, curtidas,
             respostas_count, created_at, user_id, tool_snapshot,
             external_link_url, external_link_text`
          )
          .eq("slug", slugOrId)
          .maybeSingle();
        postData = data;
      }

      if (!postData) {
        const { data, error } = await supabase
          .from("postagens")
          .select(
            `id, slug, titulo, conteudo, loteria_tag, media_url, media_type, curtidas,
             respostas_count, created_at, user_id, tool_snapshot,
             external_link_url, external_link_text`
          )
          .eq("id", isUuid ? slugOrId : slugOrId)
          .single();
        if (error) throw error;
        postData = data;
      }

      // Profile + CTA in parallel
      const profilePromise = supabase
        .from("perfis_publicos" as any)
        .select("id, nome, avatar_url, is_bot")
        .eq("id", postData.user_id)
        .maybeSingle();

      const ctaPromise = supabase
        .from("guide_personas_publico" as any)
        .select("cta_override_enabled, cta_override_text, cta_override_buttons")
        .eq("perfil_id", postData.user_id)
        .eq("cta_override_enabled", true)
        .maybeSingle();

      const [profileResult, ctaResult] = await Promise.all([profilePromise, ctaPromise]);

      const perfis = profileResult.data
        ? { nome: (profileResult.data as any).nome, avatar_url: (profileResult.data as any).avatar_url, is_bot: (profileResult.data as any).is_bot }
        : null;

      const ctaData = ctaResult.data as any;

      return {
        ...postData,
        perfis,
        cta_override_enabled: ctaData?.cta_override_enabled || false,
        cta_override_text: ctaData?.cta_override_text || null,
        cta_override_buttons: (ctaData?.cta_override_buttons as CtaButton[]) || [],
      } as PostDetails;
    },
    enabled: !!slugOrId,
    staleTime: 30_000,
  });

  const resolvedPostId = postQuery.data?.id;

  const commentsQuery = useQuery({
    queryKey: ["post-comments", resolvedPostId],
    queryFn: async () => {
      const { data: commentsData, error: commentsError } = await supabase
        .from("post_comments")
        .select("id, conteudo, created_at, user_id, parent_id")
        .eq("post_id", resolvedPostId!)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;
      if (!commentsData || commentsData.length === 0) return [];

      const userIds = [...new Set(commentsData.map((c) => c.user_id))];
      const { data: profilesData } = await supabase
        .from("perfis_publicos" as any)
        .select("id, nome, avatar_url, is_bot")
        .in("id", userIds);

      const profilesMap = new Map(
        (profilesData as any[])?.map((p: any) => [p.id, { nome: p.nome, avatar_url: p.avatar_url, is_bot: p.is_bot }]) || []
      );

      const rootComments: PostComment[] = [];
      const repliesMap = new Map<string, PostComment[]>();

      for (const comment of commentsData) {
        const enrichedComment: PostComment = {
          ...comment,
          perfis: profilesMap.get(comment.user_id) || null,
          replies: [],
        };

        if (comment.parent_id) {
          const existing = repliesMap.get(comment.parent_id) || [];
          repliesMap.set(comment.parent_id, [...existing, enrichedComment]);
        } else {
          rootComments.push(enrichedComment);
        }
      }

      return rootComments.map((comment) => ({
        ...comment,
        replies: repliesMap.get(comment.id) || [],
      }));
    },
    enabled: !!resolvedPostId,
    staleTime: 15_000,
  });

  const likeQuery = useQuery({
    queryKey: ["post-like", resolvedPostId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", resolvedPostId!)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!resolvedPostId && !!user?.id,
    staleTime: 30_000,
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
