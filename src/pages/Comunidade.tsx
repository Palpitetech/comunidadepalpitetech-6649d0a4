import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/components/layout/MainLayout";
import { FeedHeader } from "@/components/comunidade/FeedHeader";
import { PostCard } from "@/components/comunidade/PostCard";
import { PostCardSkeleton } from "@/components/comunidade/PostCardSkeleton";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { LatestResults } from "@/components/home/LatestResults";
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

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card 
            className="bg-primary hover:bg-primary/90 transition-all cursor-pointer text-white border-none shadow-lg overflow-hidden group active:scale-95"
            onClick={() => navigate('/gerar-jogos')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center justify-center h-full min-h-[100px]">
              <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform mb-2">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Gerar meus Palpites</h3>
            </CardContent>
          </Card>

          <Card 
            className="bg-white hover:bg-gray-50 transition-all cursor-pointer text-primary border-none shadow-lg overflow-hidden group active:scale-95"
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center justify-center h-full min-h-[100px]">
              <div className="bg-primary/10 p-2 rounded-xl group-hover:scale-110 transition-transform mb-2">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-sm sm:text-base leading-tight text-senior-dark">Entrar no Grupo</h3>
            </CardContent>
          </Card>
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
