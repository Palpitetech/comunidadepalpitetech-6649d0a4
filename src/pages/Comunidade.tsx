import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/components/layout/MainLayout";
import { FeedHeader } from "@/components/comunidade/FeedHeader";
import { PostCard } from "@/components/comunidade/PostCard";
import { PostCardSkeleton } from "@/components/comunidade/PostCardSkeleton";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { DownloadBanner } from "@/components/pwa/DownloadBanner";
import { PWAUpdateBanner } from "@/components/pwa/PWAUpdateBanner";
import { Pin, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Comunidade() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: posts, isLoading, error, prefetchPost } = useCommunityPosts();

  const { pinnedPost, otherPosts } = useMemo(() => {
    if (!posts || posts.length === 0) return { pinnedPost: null, otherPosts: [] };
    const resultPost = posts.find((p) => p.tipo === "resultado_oficial");
    if (!resultPost) return { pinnedPost: null, otherPosts: posts };
    const others = posts.filter((p) => p.id !== resultPost.id);
    return { pinnedPost: resultPost, otherPosts: others };
  }, [posts]);

  const handleClick = useCallback(
    (post: { id: string; slug: string | null }) => navigate(`/comunidade/post/${post.slug || post.id}`),
    [navigate]
  );

  const handlePrefetch = useCallback(
    (postId: string) => prefetchPost(postId),
    [prefetchPost]
  );

  return (
    <MainLayout pageTitle="Comunidade" hideBackButton>
      <DownloadBanner />
      <PWAUpdateBanner />
      <div className="max-w-2xl mx-auto px-4 py-6 bg-clovers min-h-full bg-primary/5">
        {!isMobile && <FeedHeader />}

        <Card 
          className="mb-6 bg-gradient-to-r from-primary to-primary/80 hover:to-primary transition-all cursor-pointer text-white border-none shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden group active:scale-95"
          onClick={() => navigate('/gerar-jogos')}
        >
          <CardContent className="p-5 sm:p-6 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles className="h-24 w-24 text-white" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-white/25 p-3 rounded-2xl group-hover:rotate-12 transition-all">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl sm:text-2xl leading-tight">Gerar meus Palpites</h3>
                <p className="text-white/90 text-xs sm:text-sm mt-1 font-medium italic">IA otimizada para seus jogos</p>
              </div>
            </div>
            <ChevronRight className="h-7 w-7 text-white/80 group-hover:translate-x-1 transition-transform relative z-10" />
          </CardContent>
        </Card>

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
      </div>
    </MainLayout>
  );
}
