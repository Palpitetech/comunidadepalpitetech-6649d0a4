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
  referralCode?: string | null;
}

export function ActionBar({
  likesCount,
  isLiked,
  onToggleLike,
  isLiking,
  commentsCount,
  onCommentsClick,
  postContent,
  referralCode,
}: ActionBarProps) {
  const getShareUrl = () => {
    const url = new URL(window.location.href);
    if (referralCode) {
      url.searchParams.set("ref", referralCode);
    }
    return url.toString();
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.share({
        title: "Palpite Tech",
        text: "Confira esse palpite na comunidade!",
        url: shareUrl,
      });
    } catch {
      await navigator.clipboard.writeText(shareUrl);
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
    <div className="flex items-center gap-0.5 py-1">
      {/* Like */}
      <button
        onClick={onToggleLike}
        disabled={isLiking}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors",
          isLiked
            ? "text-destructive"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
        <span className="tabular-nums">{likesCount}</span>
      </button>

      {/* Comments */}
      {commentsCount !== undefined && (
        <button
          onClick={onCommentsClick}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{commentsCount}</span>
        </button>
      )}

      <div className="flex-1" />

      {/* Copy */}
      {postContent && (
        <button
          onClick={handleCopyContent}
          className="p-1.5 rounded-md text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Share */}
      <button
        onClick={handleShare}
        className="p-1.5 rounded-md text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
