import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoteriaBadge } from "@/components/comunidade/LoteriaBadge";
import { GuideBadge } from "@/components/comunidade/GuideBadge";
import { ActionBar } from "@/components/comunidade/ActionBar";
import { CommentSection } from "@/components/comunidade/CommentSection";
import { BotCta } from "@/components/comunidade/BotCta";
import { LoginPromptModal } from "@/components/comunidade/LoginPromptModal";
import { Skeleton } from "@/components/ui/skeleton";
import { usePostDetails } from "@/hooks/usePostDetails";
import { usePostActions } from "@/hooks/usePostActions";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMySubscription } from "@/hooks/useMySubscription";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PostDetalhes() {
  const isMobile = useIsMobile();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const isAuthenticated = !!user;
  const { data: subscription } = useMySubscription(user?.id);
  const isFreePlan = !subscription || subscription.status === "inativa";
  const [showLoginModal, setShowLoginModal] = useState(false);

  const {
    post,
    isLoadingPost,
    comments,
    isLoadingComments,
    isLiked,
    refetchLike,
    refetchPost,
  } = usePostDetails(id || "");

  const {
    toggleLike,
    isTogglingLike,
    addComment,
    isAddingComment,
    deleteComment,
    deletingCommentId,
  } = usePostActions(id || "");

  // Show login modal after 10 seconds for unauthenticated users
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) return;

    const timer = setTimeout(() => {
      setShowLoginModal(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, authLoading]);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    action();
  };

  const handleToggleLike = () => {
    requireAuth(() => {
      toggleLike(isLiked, {
        onSuccess: () => {
          refetchLike();
          refetchPost();
        },
      });
    });
  };

  const handleAddComment = (content: string, parentId?: string) => {
    requireAuth(() => {
      addComment({ content, parentId });
    });
  };

  if (isLoadingPost) {
    return (
      <MainLayout pageTitle="Post" hideBottomNav={!isAuthenticated}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-24" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-20 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout pageTitle="Post" hideBottomNav={!isAuthenticated}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {!isMobile && (
            <Button
              variant="ghost"
              onClick={() => navigate("/comunidade")}
              className="gap-2 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Post não encontrado.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const authorName = post.perfis?.nome || "Usuário";
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <MainLayout pageTitle="Post" hideBottomNav={!isAuthenticated}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {!isMobile && (
          <Button
            variant="ghost"
            onClick={() => navigate(isAuthenticated ? "/comunidade" : "/login")}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        )}

        {/* Header: Autor */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.perfis?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">{authorName}</span>
              {post.perfis?.is_bot && <GuideBadge />}
              {post.loteria_tag && <LoteriaBadge tag={post.loteria_tag} />}
            </div>
            <span className="text-sm text-muted-foreground">{timeAgo}</span>
          </div>
        </div>

        {/* Título */}
        {post.titulo && (
          <h1 className="text-xl font-bold text-foreground">{post.titulo}</h1>
        )}

        {/* Mídia em tamanho completo */}
        {post.media_url && (
          <div className="rounded-xl overflow-hidden bg-muted">
            {post.media_type === "video" ? (
              <video
                src={post.media_url}
                controls
                className="w-full max-h-[500px] object-contain"
              />
            ) : (
              <img
                src={post.media_url}
                alt="Mídia do post"
                className="w-full max-h-[500px] object-contain"
              />
            )}
          </div>
        )}

        {/* Conteúdo */}
        <p className="text-foreground whitespace-pre-wrap">{post.conteudo}</p>

        {/* Link externo (apenas admin) */}
        {post.external_link_url && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open(post.external_link_url!, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
            {post.external_link_text || "Abrir link"}
          </Button>
        )}

        {/* CTA do Bot - apenas para usuários do plano Free */}
        {isFreePlan && post.perfis?.is_bot && post.cta_override_enabled && post.cta_override_buttons && post.cta_override_buttons.length > 0 && (
          <BotCta
            text={post.cta_override_text}
            buttons={post.cta_override_buttons}
          />
        )}

        {/* Barra de ações */}
        <ActionBar
          likesCount={post.curtidas || 0}
          isLiked={isLiked}
          onToggleLike={handleToggleLike}
          isLiking={isTogglingLike}
          postContent={post.conteudo}
        />

        {/* Seção de comentários */}
        <CommentSection
          comments={comments}
          commentsCount={post.respostas_count || 0}
          currentUserId={user?.id}
          onAddComment={handleAddComment}
          onDeleteComment={(commentId) => requireAuth(() => deleteComment(commentId))}
          isLoading={isLoadingComments}
          isAdding={isAddingComment}
          deletingId={deletingCommentId}
        />
      </div>

      {/* Modal de login para usuários não autenticados */}
      <LoginPromptModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </MainLayout>
  );
}
