import { Heart, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ActionBarProps {
  likesCount: number;
  isLiked: boolean;
  onToggleLike: () => void;
  isLiking?: boolean;
  postContent?: string;
}

export function ActionBar({
  likesCount,
  isLiked,
  onToggleLike,
  isLiking,
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
      // Fallback: copiar link
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
    <div className="flex items-center gap-2 py-3 border-y border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleLike}
        disabled={isLiking}
        className={cn(
          "gap-2 transition-colors",
          isLiked && "text-destructive hover:text-destructive/90"
        )}
      >
        <Heart
          className={cn("h-5 w-5", isLiked && "fill-current")}
        />
        <span className="font-medium">{likesCount}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="gap-2"
      >
        <Share2 className="h-5 w-5" />
        <span className="hidden sm:inline">Compartilhar</span>
      </Button>

      {postContent && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyContent}
          className="gap-2"
        >
          <Copy className="h-5 w-5" />
          <span className="hidden sm:inline">Copiar</span>
        </Button>
      )}
    </div>
  );
}
