import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeedHeader } from "@/components/comunidade/FeedHeader";
import { PostCard } from "@/components/comunidade/PostCard";
import { PostCardSkeleton } from "@/components/comunidade/PostCardSkeleton";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";

export default function Comunidade() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: posts, isLoading, error } = useCommunityPosts();

  return (
    <MainLayout>
      {isMobile && <PageHeader title="Comunidade" />}
      <div className="max-w-2xl mx-auto px-4 py-6">
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
            {posts.map((post) => (
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
