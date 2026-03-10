import { Heart, Share2, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ActionBarProps {
  likesCount: number;
  isLiked: boolean;
  onToggleLike: () => void;
  isLiking?: boolean;
  commentsCount?: number;
  onCommentsClick?: () => void;
  postContent?: string;
}

export function ActionBar({
  likesCount,
  isLiked,
  onToggleLike,
  isLiking,
  commentsCount,
  onCommentsClick,
  postContent,
}: ActionBarProps) {
  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Palpite Tech",
        text: "Confira esse palpite na comunidade!",
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  const handleCopyContent = async () => {
    if (postContent) {
      await navigator.clipboard.writeText(postContent);
      toast.success("Conteúdo copiado!");
    }
  };

  return (
    <div className="flex items-center gap-1 py-2 border-y border-border/60">
      {/* Like */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleLike}
        disabled={isLiking}
        className={cn(
          "gap-1.5 h-9 px-3 rounded-lg transition-all",
          isLiked
            ? "text-destructive hover:text-destructive/90"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Heart className={cn("h-[18px] w-[18px] transition-transform", isLiked && "fill-current scale-110")} />
        <span className="text-sm font-medium tabular-nums">{likesCount}</span>
      </Button>

      {/* Comments */}
      {commentsCount !== undefined && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCommentsClick}
          className="gap-1.5 h-9 px-3 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          <span className="text-sm font-medium tabular-nums">{commentsCount}</span>
        </Button>
      )}

      <div className="flex-1" />

      {/* Copy */}
      {postContent && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyContent}
          className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
        >
          <Copy className="h-[18px] w-[18px]" />
        </Button>
      )}

      {/* Share */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleShare}
        className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
      >
        <Share2 className="h-[18px] w-[18px]" />
      </Button>
    </div>
  );
}
