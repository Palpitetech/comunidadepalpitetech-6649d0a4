import { useState, useEffect, useRef } from "react";
// ... keep existing code
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ExternalLink, ArrowLeft, MessageCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoteriaBadge } from "@/components/comunidade/LoteriaBadge";
import { FormattedContent } from "@/components/comunidade/FormattedContent";

import { ActionBar } from "@/components/comunidade/ActionBar";
import { CommentSection } from "@/components/comunidade/CommentSection";
import { BotCta } from "@/components/comunidade/BotCta";
import { LoginPromptModal } from "@/components/comunidade/LoginPromptModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { usePostDetails } from "@/hooks/usePostDetails";
import { usePostActions } from "@/hooks/usePostActions";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMySubscription } from "@/hooks/useMySubscription";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

function PostSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="aspect-[3/4] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export default function PostDetalhes() {
  const isMobile = useIsMobile();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const isAuthenticated = !!user;
  const { data: subscription } = useMySubscription(user?.id);
  const isFreePlan = !subscription || subscription.status === "inativa";
  const [showLoginModal, setShowLoginModal] = useState(false);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  // Capture referral code from shared URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && ref.length === 6) {
      localStorage.setItem("referral_code", ref);
    }
  }, [searchParams]);

  // Fetch current user's referral code for sharing
  const { data: myReferralCode } = useQuery({
    queryKey: ["my-referral-code", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("perfis")
        .select("referral_code")
        .eq("id", user!.id)
        .single();
      return data?.referral_code || null;
    },
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  const {
    post,
    isLoadingPost,
    comments,
    isLoadingComments,
    isLiked,
    refetchLike,
    refetchPost,
  } = usePostDetails(slug || "");

  const resolvedPostId = post?.id || "";

  const {
    toggleLike,
    isTogglingLike,
    addComment,
    isAddingComment,
    deleteComment,
    deletingCommentId,
  } = usePostActions(resolvedPostId);

  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    const timer = setTimeout(() => setShowLoginModal(true), 10000);
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

  const scrollToComments = () => {
    commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoadingPost) {
    return (
      <MainLayout pageTitle="Post" hideBottomNav={!isAuthenticated}>
        <PostSkeleton />
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout pageTitle="Post" hideBottomNav={!isAuthenticated}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {!isMobile && (
            <Button variant="ghost" onClick={() => navigate("/comunidade")} className="gap-2 mb-6">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          <div className="bg-muted/50 rounded-xl p-10 text-center">
            <p className="text-muted-foreground text-sm">Post não encontrado.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const authorName = post.perfis?.nome || "Usuário";
  const initials = authorName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR });
  const commentsCount = post.respostas_count || 0;

  return (
    <MainLayout pageTitle={post?.titulo || "Post"} hideBottomNav={!isAuthenticated}>
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Desktop back button */}
        {!isMobile && (
          <div className="px-4 pt-4">
            <Button
              variant="ghost"
              onClick={() => navigate(isAuthenticated ? "/comunidade" : "/login")}
              className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
        )}

        {/* Author header — compact */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.perfis?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[11px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm text-foreground truncate">{authorName}</span>
            {post.loteria_tag && <LoteriaBadge tag={post.loteria_tag} className="text-[10px] px-1.5 py-0" />}
            <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{timeAgo}</span>
          </div>
        </div>

        {/* Title */}
        {post.titulo && (
          <div className="px-4 pb-2 hidden md:block">
            <h1 className="text-xl font-bold text-foreground leading-tight">{post.titulo}</h1>
          </div>
        )}

        {/* Media — full-bleed on mobile */}
        {post.media_url && (
        <div className={cn(
          "bg-muted/30 overflow-hidden aspect-[3/4]",
          isMobile ? "mx-0" : "mx-4 rounded-xl"
        )}>
            {post.media_type === "video" ? (
              <video
                src={post.media_url}
                controls
                className="w-full h-full object-cover"
                playsInline
              />
            ) : (
              <img
                src={post.media_url}
                alt="Mídia do post"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* Content body */}
        <div className="px-4 pt-3">
          <FormattedContent content={post.conteudo} />
        </div>

        {/* External link */}
        {post.external_link_url && (
          <div className="px-4 pt-3">
            <Button
              variant="outline"
              className="gap-2 w-full sm:w-auto"
              onClick={() => window.open(post.external_link_url!, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
              {post.external_link_text || "Abrir link"}
            </Button>
          </div>
        )}

        {/* Bot CTA */}
        {isFreePlan && post.perfis?.is_bot && post.cta_override_enabled && post.cta_override_buttons && post.cta_override_buttons.length > 0 && (
          <div className="px-4 pt-3">
            <BotCta text={post.cta_override_text} buttons={post.cta_override_buttons} />
          </div>
        )}

        {/* Action bar */}
        <div className="px-4 pt-3">
          <ActionBar
            likesCount={post.curtidas || 0}
            isLiked={isLiked}
            onToggleLike={handleToggleLike}
            isLiking={isTogglingLike}
            commentsCount={commentsCount}
            onCommentsClick={scrollToComments}
            postContent={post.conteudo}
            referralCode={myReferralCode}
          />
        </div>

        {/* Comments section */}
        <div ref={commentSectionRef} className="px-4 pt-1 pb-8">
          <CommentSection
            comments={comments}
            commentsCount={commentsCount}
            currentUserId={user?.id}
            onAddComment={handleAddComment}
            onDeleteComment={(commentId) => requireAuth(() => deleteComment(commentId))}
            isLoading={isLoadingComments}
            isAdding={isAddingComment}
            deletingId={deletingCommentId}
          />
        </div>
      </div>

      <LoginPromptModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </MainLayout>
  );
}
