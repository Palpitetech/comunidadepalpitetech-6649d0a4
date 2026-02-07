import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  // CTA data for bots
  cta_override_enabled?: boolean;
  cta_override_text?: string | null;
  cta_override_buttons?: CtaButton[];
}

export function useCommunityPosts() {
  return useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => {
      // Buscar posts com dados do perfil
      const { data: postsData, error: postsError } = await supabase
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

      if (postsError) throw postsError;
      if (!postsData) return [];

      // Identificar posts de bots para buscar dados de CTA
      const botUserIds = postsData
        .filter((p) => p.perfis?.is_bot)
        .map((p) => p.user_id);

      // Buscar dados de CTA dos bots
      let ctaMap = new Map<string, { enabled: boolean; text: string | null; buttons: CtaButton[] }>();
      
      if (botUserIds.length > 0) {
        const { data: ctaData } = await supabase
          .from("guide_personas")
          .select("perfil_id, cta_override_enabled, cta_override_text, cta_override_buttons")
          .in("perfil_id", botUserIds)
          .eq("cta_override_enabled", true);

        if (ctaData) {
          ctaData.forEach((cta) => {
            ctaMap.set(cta.perfil_id, {
              enabled: cta.cta_override_enabled,
              text: cta.cta_override_text,
              buttons: (cta.cta_override_buttons as unknown as CtaButton[]) || [],
            });
          });
        }
      }

      // Enriquecer posts com dados de CTA
      return postsData.map((post) => {
        const ctaInfo = ctaMap.get(post.user_id);
        return {
          ...post,
          cta_override_enabled: ctaInfo?.enabled || false,
          cta_override_text: ctaInfo?.text || null,
          cta_override_buttons: ctaInfo?.buttons || [],
        } as CommunityPost;
      });
    },
  });
}
