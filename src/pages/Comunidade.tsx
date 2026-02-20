import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/components/layout/MainLayout";
import { FeedHeader } from "@/components/comunidade/FeedHeader";
import { PostCard } from "@/components/comunidade/PostCard";
import { PostCardSkeleton } from "@/components/comunidade/PostCardSkeleton";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { Pin } from "lucide-react";

export default function Comunidade() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: posts, isLoading, error } = useCommunityPosts();

  const { pinnedPost, otherPosts } = useMemo(() => {
    if (!posts || posts.length === 0) return { pinnedPost: null, otherPosts: [] };

    // Find the most recent "resultado_oficial" post
    const resultPost = posts.find((p) => p.tipo === "resultado_oficial");

    if (!resultPost) return { pinnedPost: null, otherPosts: posts };

    const others = posts.filter((p) => p.id !== resultPost.id);
    return { pinnedPost: resultPost, otherPosts: others };
  }, [posts]);

  return (
    <MainLayout pageTitle="Comunidade" hideBackButton>
      <div className="max-w-2xl mx-auto px-4 py-6 bg-clovers min-h-full bg-primary/5">
        {!isMobile && <FeedHeader />}

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
            {/* Post de resultado fixado no topo */}
            {pinnedPost && (
              <div className="relative">
                <div className="absolute -top-2 left-3 z-10 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                  <Pin className="h-3 w-3" />
                  Fixado
                </div>
                <div className="ring-2 ring-primary/30 rounded-xl">
                  <PostCard
                    post={pinnedPost}
                    onClick={() => navigate(`/comunidade/post/${pinnedPost.id}`)}
                  />
                </div>
              </div>
            )}

            {/* Demais posts */}
            {otherPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => navigate(`/comunidade/post/${post.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
