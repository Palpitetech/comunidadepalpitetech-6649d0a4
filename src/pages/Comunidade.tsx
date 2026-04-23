import { useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/components/layout/MainLayout";

import { PostCard } from "@/components/comunidade/PostCard";
import { PostCardSkeleton } from "@/components/comunidade/PostCardSkeleton";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { LatestResults } from "@/components/home/LatestResults";
import { Pin, Sparkles, ChevronRight, MessageSquare, Lock, Crown } from "lucide-react";
import { usePermissionContext } from "@/contexts/PermissionContext";
import { cn } from "@/lib/utils";

type LoteriaFiltro = "lotofacil" | "megasena";

const LOTERIA_TAG_MAP: Record<LoteriaFiltro, string> = {
  lotofacil: "Lotofácil",
  megasena: "Mega-Sena",
};

export default function Comunidade() {
  const navigate = useNavigate();
  const { plan } = usePermissionContext();
  const isMobile = useIsMobile();
  const { data: posts, isLoading, error, prefetchPost } = useCommunityPosts();
  const [loteriaFiltro, setLoteriaFiltro] = useState<LoteriaFiltro>("lotofacil");

  const { pinnedPost, otherPosts } = useMemo(() => {
    if (!posts || posts.length === 0) return { pinnedPost: null, otherPosts: [] };
    const tag = LOTERIA_TAG_MAP[loteriaFiltro];
    const filtered = posts.filter((p) => p.loteria_tag === tag);
    if (filtered.length === 0) return { pinnedPost: null, otherPosts: [] };
    const resultPost = filtered.find((p) => p.tipo === "resultado_oficial");
    if (!resultPost) return { pinnedPost: null, otherPosts: filtered };
    const others = filtered.filter((p) => p.id !== resultPost.id);
    return { pinnedPost: resultPost, otherPosts: others };
  }, [posts, loteriaFiltro]);

  const handleClick = useCallback(
    (post: { id: string; slug: string | null }) => navigate(`/comunidade/post/${post.slug || post.id}`),
    [navigate]
  );

  const handlePrefetch = useCallback(
    (postId: string) => prefetchPost(postId),
    [prefetchPost]
  );

  return (
    <MainLayout pageTitle="Estudos" hideBackButton>
      <div className="max-w-2xl mx-auto px-4 pt-2 pb-6 bg-clovers min-h-full bg-primary/5">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/gerar-jogos')}
            className="group relative flex items-center justify-center gap-2.5 min-h-[52px] px-3 py-2 rounded-xl text-center text-white bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 border border-green-500/40 shadow-lg shadow-green-600/30 hover:shadow-green-500/40 transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2"
          >
            <span className="font-bold text-xs leading-tight">Gerar meus<br />palpites</span>
          </button>

          {(() => {
            const isTrial = plan?.slug === 'trial' || plan?.slug === 'teste-gratis-3-dias';
            const isPaid = !!plan && !isTrial;
            const link = isPaid ? "https://www.palpitetech.com.br/g/grupo-vip-assinantes" : "https://www.palpitetech.com.br/g/entrar-sala-secreta";
            return (
              <button
                type="button"
                onClick={() => window.open(link, '_blank')}
                className="group relative flex items-center justify-center gap-2.5 min-h-[52px] px-3 py-2 rounded-xl text-center text-white bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 border border-green-500/40 shadow-lg shadow-green-600/30 hover:shadow-green-500/40 transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2"
              >
                <span className="font-bold text-xs leading-tight">
                  {isPaid ? <>15 palpites<br />diários</> : <>Entrar na<br />Sala Secreta</>}
                </span>
              </button>
            );
          })()}
        </div>

        {isLoading && <PostCardSkeleton count={5} />}

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4">
            <p>Erro ao carregar os posts. Tente novamente.</p>
          </div>
        )}

        {!isLoading && posts && posts.length === 0 && (
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum post ainda. Seja o primeiro a compartilhar!
            </p>
          </div>
        )}

        {posts && posts.length > 0 && (
          <div className="space-y-4">
            {pinnedPost && (
              <div className="relative">
                <div className="absolute -top-2 left-3 z-10 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                  <Pin className="h-3 w-3" />
                  Fixado
                </div>
                <div className="ring-2 ring-primary/30 rounded-xl">
                  <PostCard
                    post={pinnedPost}
                    onClick={() => handleClick(pinnedPost)}
                    onPrefetch={() => handlePrefetch(pinnedPost.id)}
                  />
                </div>
              </div>
            )}

            {otherPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => handleClick(post)}
                onPrefetch={() => handlePrefetch(post.id)}
              />
            ))}
          </div>
        )}

        {/* Section 2: Latest Results */}
        <div className="w-full mt-6">
          <LatestResults />
        </div>
      </div>
    </MainLayout>
  );
}
